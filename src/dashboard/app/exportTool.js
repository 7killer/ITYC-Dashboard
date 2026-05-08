import { getAllData } from '../../common/dbOpes.js';
import { roundTo, cleanSpecial } from '../../common/utils.js';
import { getUserPrefs } from '../../common/userPrefs.js';
import {
  getConnectedPlayerId,
  getRaceInfo,
  getLegFleetInfos,
  getLegPlayerInfos,
  getPolar,
  getParamStamina,
  getLegPlayersTracksFleet
} from './memoData.js';
import { formatDHMS, formatPosition, formatShortDate, formatTimestampToReadableDate ,formatTime} from '../ui/common.js';
import { sailNames } from '../ui/constant.js';
import { isDisplayEnabled } from './sortManager.js';

function getSeparator(csvSep = null) {
  if (csvSep) return csvSep;

  const pref = getUserPrefs().separator;
  if (pref === 'sep_2') return ',';
  if (pref === 'sep_3') return '\t';
  return ';';
}

function saveFile(fileName, blobData) {
  const urlFile = window.URL.createObjectURL(blobData);
  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.href = urlFile;
  anchor.download = fileName;
  anchor.click();
  window.URL.revokeObjectURL(urlFile);
  anchor.remove();
}

function openTab(url, baseUrl, reuseTab) {
  let isTabActive = false;
  let tabId = 0;

  chrome.tabs.query({}, (tabs) => {
    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i].url?.toLowerCase().includes(baseUrl.toLowerCase())) {
        isTabActive = true;
        tabId = tabs[i].id;
        break;
      }
    }

    if (!isTabActive || !reuseTab) {
      chrome.tabs.create({ url }, async (tab) => {
        chrome.tabs.move(tab.id, { index: tab.index + 1 });
      });
    } else {
      chrome.tabs.update(tabId, { url, selected: true });
    }
  });
}

function exportFileName(prefix, ext, raceInfo = getRaceInfo()) {
  const raceLabel = cleanSpecial(raceInfo?.legName ?? raceInfo?.name ?? `${raceInfo?.raceId ?? 'race'}_${raceInfo?.legNum ?? 0}`);
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0')
  ].join('');
  return `${prefix}_${raceLabel}_${stamp}.${ext}`;
}

function formatDateForExport(ts) {
  if (!ts) return '-';
  return formatShortDate(ts, '-', getUserPrefs().global.localTime);
}

function collectFleetRows(fleet = getLegFleetInfos()) {
  const raceInfo = getRaceInfo();
  const currentUserId = getConnectedPlayerId();
  const currentPlayerInfos = getLegPlayerInfos();
  if (!fleet || !raceInfo) return [];

  const rows = [];
  Object.entries(fleet).forEach(([userId, entry]) => {
    const rowEntry = userId === currentUserId ? currentPlayerInfos : entry;
    const ite = rowEntry?.ite ?? rowEntry?.ites?.[0];
    if (!ite || !rowEntry?.info) return;
    if (!isDisplayEnabled(ite, userId, currentUserId)) return;
    if (getUserPrefs().filters.inRace && ite.state !== 'racing') return;

    rows.push({
      userId,
      info: rowEntry.info,
      team: rowEntry.team,
      options: rowEntry.options,
      ite
    });
  });

  return rows;
}

function formatOptions(playerOptions, shortOption = true) {
  if (!playerOptions) return '?';

  const pOptions = playerOptions.options ?? {};
  const sailOpts = [];
  const perfOpts = [];

  if (pOptions.reach) sailOpts.push(shortOption ? 'R' : 'reach');
  if (pOptions.light) sailOpts.push(shortOption ? 'L' : 'light');
  if (pOptions.heavy) sailOpts.push(shortOption ? 'H' : 'heavy');
  if (pOptions.winch) perfOpts.push(shortOption ? 'W' : 'winch');
  if (pOptions.foil) perfOpts.push(shortOption ? 'F' : 'foil');
  if (pOptions.hull) perfOpts.push(shortOption ? 'h' : 'hull');
  if (pOptions.comfortLoungePug) perfOpts.push(shortOption ? 'C' : 'comfortLoungePug');
  if (pOptions.magicFurler) perfOpts.push(shortOption ? 'M' : 'magicFurler');
  if (pOptions.vrtexJacket) perfOpts.push(shortOption ? 'J' : 'vrtexJacket');

  const parts = [];
  if (sailOpts.length) parts.push(`[${sailOpts.join(',')}]`);
  if (perfOpts.length) parts.push(`[${perfOpts.join(',')}]`);

  return parts.length ? parts.join(' ') : '?';
}

function toDelimitedLine(values, separator) {
  return values
    .map((value) => {
      const text = value == null ? '' : String(value);
      if (separator === '\t') return text;
      if (text.includes(separator) || text.includes('"') || text.includes('\n')) {
        return `"${text.replaceAll('"', '""')}"`;
      }
      return text;
    })
    .join(separator);
}

export async function onFleetInCpyClipBoard(fleet = getLegFleetInfos(), currentUserId = getConnectedPlayerId(), race = getRaceInfo()) {
  const separator = '\t';
  const rows = collectFleetRows(fleet);
  if (!rows.length || !race) return;

  const headers = [
    'RT',
    'Skipper',
    ...(race.raceType == 'record' ? ['Start Date'] : []),
    ...(race.raceType == 'record' ? ['ERT'] : []),
    ...(race.raceType == 'record' ? ['avgS'] : []),
    'Last Update',
    'Rank',
    ...(race.raceType !== 'record' ? ['RaceTime'] : []),
    'DTF',
    'DTU',
    'BRG',
    'Sail',
    'State',
    'Position',
    'HDG',
    'TWA',
    'TWS',
    'Speed',
    'Stamina',
    'Factor',
    'Foils',
    'Options'
  ];

  const lines = rows.map(({ userId, info, team, options, ite }) => {
    const metaDash = ite.metaDash ?? {};
    const foils = metaDash.realFoilFactor == null ? (options?.options?.foil ? 'no' : '?') : `${roundTo(metaDash.realFoilFactor, 1)}%`;
    return toDelimitedLine([
      userId === currentUserId ? '*' : '',
      info.name,
      ...(race.raceType == 'record' ? [ite.startDate ? formatTime(ite.startDate) : '-'] : []),
      ...(race.raceType == 'record' ? [metaDash.eRT ? formatDHMS(metaDash.eRT) : '-'] : []),
      ...(race.raceType == 'record' ? [metaDash.avgSpeed ? roundTo(metaDash.avgSpeed, 2) : '-'] : []),
      formatDate(ite.iteDate,3),
      ite.rank ?? '-',
      ...(race.raceType !== 'record' ? [metaDash.raceTime ? formatDHMS(metaDash.raceTime,true) : '-'] : []),
      (metaDash.dtf?roundTo(metaDash.dtf,1):'-'),
      metaDash.DTU ?? '-',
      metaDash.BFU ?? '-',
      sailNames[ite.sail % 10] ?? '-',
      ite.state ?? '-',
      ite.pos ? formatPosition(ite.pos.lat, ite.pos.lon) : '-',
      ite.hdg? roundTo(ite.hdg, 3):'-',
      ite.twa? roundTo(ite.twa, 3):'-',
      ite.tws? roundTo(ite.tws, 1):'-',
      ite.speed? roundTo(ite.speed, 2):'-',
      ite.stamina? roundTo(ite.stamina, 2):'-',
      metaDash.xfactor? roundTo(metaDash.xfactor, 4):'-',
      foils,
      formatOptions(options, getUserPrefs().fleet.shortOption)
    ], separator);
  });

  await navigator.clipboard.writeText(`${toDelimitedLine(headers, separator)}\r\n${lines.join('\r\n')}`);

  const userPrefs = getUserPrefs();
  const sailRanksRaceId = userPrefs.sailRankId;
  if (sailRanksRaceId != null && sailRanksRaceId !== '' && sailRanksRaceId !== 0 && sailRanksRaceId !== '0') {
    const baseUrl = 'https://sailranks.com/v/regattas/';
    const fullUrl = `${baseUrl}${sailRanksRaceId}`;
    openTab(fullUrl, baseUrl, userPrefs.global.reuseTab);
  }
}

export async function exportPolar(polars = null) {
  const polarList = Array.isArray(polars) && polars.length
    ? polars
    : await getAllData('polars').catch((error) => {
        console.error('exportPolar error:', error);
        return [];
      });

  if (!polarList || !polarList.length) return;

  polarList.forEach((polarEntry) => {
    const boatName = cleanSpecial(polarEntry?.label ?? 'polar');
    const blobData = new Blob([JSON.stringify(polarEntry, null, 2)], { type: 'application/json' });
    saveFile(`${boatName}.json`, blobData);
  });
}

export function generateFleetCSV(fleet = getLegFleetInfos(), raceInfo = getRaceInfo(), csvSep = null) {
  const separator = getSeparator(csvSep);
  const rows = collectFleetRows(fleet);
  if (!rows.length || !raceInfo) return;

  const raceIdLabel = `${raceInfo.raceId}-${raceInfo.legNum}`;
  const now = new Date();
  const exportDate = `${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}_${now.getFullYear()}_${now.getHours()}${String(now.getMinutes()).padStart(2, '0')}`;

  function getFleetStateLabel(ite) {
    const speed = Number(ite?.speed ?? 0);
    const twa = Math.abs(Number(ite?.twa ?? 0));

    if (ite?.state === 'racing' && speed === 0 && twa !== 0) return 'AGROUND !';
    if (ite?.state === 'racing' && speed !== 0) return 'Racing';
    if (ite?.state === 'arrived') return 'Arrived';
    if (ite?.state === 'waiting') return 'Waiting';
    if (ite?.state === 'staying') return 'Staying';
    return '';
  }

  function getSailExportLabel(sailId) {
    const label = sailNames[sailId] ?? sailNames[sailId % 10] ?? '-';
    return label.replace('&#x24B6;', '(Auto)');
  }

  const content = [
    `Name${separator}${raceInfo.legName ?? raceInfo.raceName ?? '-'}${separator}${raceIdLabel}`,
    `VSR${separator}${raceInfo.vsrLevel ?? raceInfo.vsrRank ?? '-'}`,
    `Export Date${separator}${exportDate}`,
    '',
    `RT${separator}Skipper${separator}Last Update${separator}Rank${separator}DTF${separator}DTU${separator}BRG${separator}Sail${separator}State${separator}RaceTime${separator}Position${separator}HDG${separator}TWA${separator}TWS${separator}Speed${separator}Factor${separator}Foils${separator}Options${separator}team`,
    ...rows.map(({ info, team, options, ite }) => {
      const metaDash = ite.metaDash ?? {};
      const dtf = metaDash.dtf == null
        ? '-'
        : (metaDash.dtf === metaDash.dtfC ? `(${roundTo(metaDash.dtfC, 3)})` : roundTo(metaDash.dtf, 3));
      const dtu = metaDash.DTU == null ? '-' : roundTo(metaDash.DTU, 3);
      const foils = metaDash.realFoilFactor == null ? (options?.options?.foil ? 'no' : '?') : `${roundTo(metaDash.realFoilFactor, 1)}%`;

      return toDelimitedLine([
        '',
        info.name,
        formatDateForExport(ite.iteDate),
        ite.rank ?? '-',
        dtf,
        dtu,
        '-',
        getSailExportLabel(ite.sail),
        getFleetStateLabel(ite),
        raceInfo.raceType !== 'record' && metaDash.raceTime ? formatDHMS(metaDash.raceTime) : '',
        ite.pos ? formatPosition(ite.pos.lat, ite.pos.lon) : '-',
        ite.hdg == null ? '-' : roundTo(ite.hdg, 3),
        ite.twa == null ? '-' : roundTo(Math.abs(Number(ite.twa)), 3),
        ite.tws == null ? '-' : roundTo(ite.tws, 3),
        ite.speed == null ? '-' : roundTo(ite.speed, 3),
        metaDash.xfactor == null ? '-' : roundTo(metaDash.xfactor, 4),
        foils,
        formatOptions(options, getUserPrefs().fleet.shortOption),
        team?.name ?? '-'
      ], separator);
    })
  ].join('\r\n');

  saveFile(`${cleanSpecial(raceInfo.legName ?? raceInfo.raceName ?? raceIdLabel)}_${raceIdLabel}_Fleet_${exportDate}.csv`, new Blob([content], { type: 'text/csv;charset=utf-8' }));
}

export function exportGraphData(playerInfos = getLegPlayerInfos(), csvSep = null) {
  const separator = getSeparator(csvSep);
  const history = playerInfos?.ites ?? [];
  if (!history.length) return;

  const content = [
    toDelimitedLine(['Time', 'TWS', 'TWD', 'TWA', 'HDG', 'Speed', 'Stamina', 'Sail'], separator),
    ...history.map((ite) => toDelimitedLine([
      formatDateForExport(ite.iteDate),
      ite.tws ?? '-',
      ite.metaDash?.twd ?? ite.twd ?? '-',
      ite.twa ?? '-',
      ite.hdg ?? '-',
      ite.speed ?? '-',
      ite.metaDash?.realStamina ?? ite.stamina ?? '-',
      sailNames[ite.sail % 10] ?? '-'
    ], separator))
  ].join('\r\n');

  saveFile(exportFileName('graphData', 'csv'), new Blob([content], { type: 'text/csv;charset=utf-8' }));
}

export function exportRestrictedZones(race = getRaceInfo()) {
  const restrictedZones = race?.restrictedZones ?? race?.legdata?.restrictedZones;
  if (!restrictedZones?.length) return;

  const features = restrictedZones.map((zone) => {
    const coordinates = zone.vertices.map((vertex) => [Number(roundTo(vertex.lon, 5)), Number(roundTo(vertex.lat, 5))]);
    coordinates.push(coordinates[0]);

    return {
      type: 'Feature',
      properties: { name: zone.name },
      bbox: zone.bbox ? [zone.bbox[1], zone.bbox[0], zone.bbox[3], zone.bbox[2]] : undefined,
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      }
    };
  });

  const jsonPretty = JSON.stringify({ type: 'FeatureCollection', features }, null, 2);
  saveFile(exportFileName('restrictedZones' + (race?.legName ? `_${race.legName}` : ''), 'json', race), new Blob([jsonPretty], { type: 'application/json' }));
}

export function exportStamina(paramStamina = getParamStamina()) {
  if (!paramStamina || !paramStamina.consumption) return;
  saveFile('stamina.json', new Blob([JSON.stringify(paramStamina, null, 2)], { type: 'application/json' }));
}

export function exportOwnBoatTrack(track = null) {
  const currentUserId = getConnectedPlayerId();
  const fleetTracks = getLegPlayersTracksFleet();
  const ownTrack = track ?? fleetTracks?.[currentUserId]?.track;
  if (!ownTrack?.length) return;

  const trackGPX = generateGPX(ownTrack);
  saveFile(exportFileName('boatTrack', 'gpx'), new Blob([trackGPX], { type: 'application/gpx+xml' }));
}

function generateGPX(data) {
  let gpxContent = `<?xml version="1.0" encoding="UTF-8" ?><gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="ITYC"><metadata><link href="https://ityc.fr/"><text>ITYC</text></link><time>${new Date().toISOString()}</time></metadata>`;
  data.forEach((point) => {
    const lon = point.lon > 180 ? point.lon - 360 : point.lon;
    gpxContent += `<wpt lat="${point.lat}" lon="${lon}"><time>${new Date(point.ts).toISOString()}</time><name>${formatTimestampToReadableDate(point.ts)}</name><desc>Latitude : ${Number(point.lat).toFixed(2)} - Longitude : ${Number(lon).toFixed(2)}</desc></wpt>`;
  });
  gpxContent += `<trk><name>Boat tracking with ITYC</name><trkseg>`;
  data.forEach((point) => {
    const lon = point.lon > 180 ? point.lon - 360 : point.lon;
    gpxContent += `<trkpt lat="${point.lat}" lon="${lon}"><time>${new Date(point.ts).toISOString()}</time></trkpt>`;
  });
  gpxContent += `</trkseg></trk></gpx>`;
  return gpxContent;
}

export function exportRestrictedZones(race = getRaceInfo()) {
  const restrictedZones = race?.restrictedZones ?? race?.legdata?.restrictedZones;
  if (!restrictedZones?.length) return;

  const features = restrictedZones.map((zone) => {
    const coordinates = zone.vertices.map((vertex) => [Number(roundTo(vertex.lon, 5)), Number(roundTo(vertex.lat, 5))]);
    coordinates.push(coordinates[0]);

    return {
      type: 'Feature',
      properties: { name: zone.name },
      bbox: zone.bbox ? [zone.bbox[1], zone.bbox[0], zone.bbox[3], zone.bbox[2]] : undefined,
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      }
    };
  });

  const jsonPretty = JSON.stringify({ type: 'FeatureCollection', features }, null, 2);
  saveFile(exportFileName('restrictedZones', 'json', race), new Blob([jsonPretty], { type: 'application/json' }));
}
