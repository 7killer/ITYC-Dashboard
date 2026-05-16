import {DateUTC,formatPosition, getRankingCategory
} from './common.js';

import {getRaceInfo,getLegPlayerInfos} from '../app/memoData.js'

import {getUserPrefs, saveUserPrefs} from "../../common/userPrefs.js"
import {creditsMaxAwardedByPriceLevel} from './constant.js'
/***** helpers DOM très compacts *****/
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  // props: { class, dataset, style, on: {click: fn}, ...attributes }
  for (const [k, v] of Object.entries(props || {})) {
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'style') Object.assign(el.style, v);
    else if (k === 'on') for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
    else if (v !== undefined && v !== null) el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    el.append(c instanceof Node ? c : document.createTextNode(c ?? ''));
  }
  return el;
}
const frag = (...nodes) => nodes.reduce((f, n) => (f.append(n), f), document.createDocumentFragment());



/***** petites aides *****/
const optionKeys = [
  ['foil','Foils'],
  ['winch','Winch'],
  ['hull','Hull'],
  ['light','Light'],
  ['reach','Reach'],
  ['heavy','Heavy'],
  ['radio','Radio'],
  ['magicFurler','Magic Furler'],
  ['comfortLoungePug','Comfort Lounge'],
  ['vrtexJacket','VRTex Jacket'],
];

function isTaken(playerOptions, key) {
    return !!(playerOptions && playerOptions[key] === true);
}
function totalOptionCredits(raceInfo,playerOptions) {
  let sum = 0;
  if (!raceInfo?.optionPrices) return sum;
  for (const [k] of optionKeys) if (isTaken(playerOptions, k)) sum += raceInfo.optionPrices[k] || 0;
  return sum;
}

/***** blocs UI *****/
function card(title, bodyNodes, {icon=null, class: extraClass = ''} = {}) {
  const sectionClass = ['card', extraClass].filter(Boolean).join(' ');
  return h('section', {class: sectionClass},
    h('div', {class:'card-header'},
      icon ? h('span', {class:'badge'}, icon) : null,
      h('h3', null, title)
    ),
    h('div', {class:'card-body'}, ...(Array.isArray(bodyNodes) ? bodyNodes : [bodyNodes]))
  );
}

function tableModern({head=[], rows=[]}) {
  const thead = h('thead', null, h('tr', null, ...head.map(t => h('th', null, t))));
  const tbody = h('tbody', null, ...rows.map(r => h('tr', null, ...r.map((c,i) => h('td', {class: i.className || ''}, c)))));
  return h('div', {class:'table-wrap'}, h('table', {class:'table-modern'}, thead, tbody));
}

/***** sections *****/
function viewIdentity(raceInfo,playerOptions) {
   const rid = raceInfo.raceId+"_"+raceInfo.legNum;
  const img = h('img', {
    class: 'rb-identity-thumb',
    src:`https://static.virtualregatta.com/offshore/leg/${rid}.jpg`
  });
  const badge = h('span', {class:'badge'}, raceInfo.raceType == 'record'? 'Record':'Race');
  const grid = h('div', {class:'kv'},
    h('div', {class:'k'}, 'Race Name (Id)'), h('div', {class:'v'}, `${raceInfo.legName} (${rid})`),
    h('div', {class:'k'}, 'Boat Name'), h('div', {class:'v'}, raceInfo.boatName ?? '-'),
    h('div', {class:'k'}, 'Wind Model'), h('div', {class:'v'}, `GFS ${(raceInfo.fineWinds ? '0.25' : '1.0')}°`),
    h('div', {class:'k'}, 'VSR Level'), h('div', {class:'v'}, `VSR${raceInfo.vsrLevel}`),
    h('div', {class:'k'}, 'Price'), h('div', {class:'v'}, `Cat. ${raceInfo.priceLevel}`),
    h('div', {class:'k'}, 'Category'), h('div', {class:'v'}, getRankingCategory(playerOptions)),
    h('div', {class:'k'}, 'Fleet status'), h('div', {class:'v'}, `Arrived ${raceInfo.arrived} / At sea ${raceInfo.boatsAtSea} / Total ${raceInfo.nbTotalSkippers}`),
  );
  const layout = h('div', {class:'rb-identity'},
    h('div', {class:'rb-identity-media'}, badge, img),
    grid
  );
  return card('Race Details', layout);
}

function viewCredits(raceInfo,playerIte) {
  const headRow1 = [
    'Game Credits',
    'Free Credits',
    'Current Race Credits (Total Options)',
    'Gains'
  ];

  const playerRank =playerIte?.ites?(playerIte?.ites[0]?.rank ?? playerIte?.ites[1]?.rank ?? playerIte?.ites[2]?.rank ?? null):null;
  const awarded = (playerRank > 0)
    ? Math.round(creditsMaxAwardedByPriceLevel[raceInfo.priceLevel-1] / (Math.pow(playerRank, 0.4)))
    : '-';
  const takenTotal = totalOptionCredits(raceInfo,playerIte?.options?.options);
  
  const creditsCell = String(playerIte?.info?.credits ?? '-');
  const freeCell    = String(raceInfo.freeCredits ?? '-');
  const currentCell = `${(playerIte?.info?.credits || playerIte?.info?.credits===0) ? playerIte.info.credits : '???'}  `;
  const gainsCell   = String(awarded);

  const topRow = [
    creditsCell,
    freeCell,
    currentCell,
    gainsCell,
  ];
  
  topRow[2] = frag(
    h('span', null, topRow[2]),
    ' ',
    h('span', {class:'chip', style:{borderColor:'tomato', color:'tomato'}}, `(-${takenTotal})`)
  );

  const tableTop = tableModern({ head: headRow1, rows: [topRow] });

  const optionLabels = optionKeys.map(([, label]) => label);
  
  const bottomRow = optionKeys.map(([k]) => {
    const takenStyle = isTaken(playerIte?.options?.options,k) ? {outline:'2px solid #25d366'} : {};
    return h('span', {style: takenStyle}, String(raceInfo?.optionPrices?.[k] ?? '-'))
  });

  const tableBottom = tableModern({ head: optionLabels, rows: [bottomRow] });

  return card('Credits (Option équipée)', [tableTop, tableBottom], { class: 'card-credits' });
}

function viewStages(raceInfo, playerIte) {
  const userPrefs = getUserPrefs();
  const head = ['Type','Name','Id','Position','Position2','Status'];

  const rows = [];

  // Start
  rows.push([
    '🚩 Start',
    raceInfo.start?.name ?? '-',
    'Start',
    formatPosition(raceInfo.start.lat, raceInfo.start.lon),
    ' - ',
    frag('Date : ', h('span',{class:'pill pill--muted'}, DateUTC(raceInfo.start.date,1,userPrefs.global.localTime ?4:3)))
  ]);

  // Checkpoints
  if (Array.isArray(raceInfo.checkpoints)) {
    for (const cp of raceInfo.checkpoints) {
      let cpName = (cp.display && cp.display !== 'none') ? cp.display : 'Invisible';
      cpName = cpName.charAt(0).toUpperCase() + cpName.slice(1);
      if (cpName === 'Buoy') cpName = '⛳ ' + cpName;
      else if (cpName === 'Gate') cpName = '🏳️ ' + cpName;
      else if (cpName === 'Invisible') cpName = '👻 ' + cpName;
      let passed = ' - ';
      if(playerIte?.ites 
        && playerIte?.ites[0]?.gateGroupCounters
        && playerIte.ites[0].gateGroupCounters[cp.group - 1])
          passed = h('span',{class:'pill pill--ok'},'Passed');

      rows.push([
        cpName,
        cp.name ?? '',
        `${cp.group}.${cp.id}`,
        formatPosition(cp.start.lat, cp.start.lon),
        (cp.end ? formatPosition(cp.end.lat, cp.end.lon) : ' - '),
        passed
      ]);
    }
  }

  // End
  rows.push([
    '🏁 End',
    raceInfo.end?.name ?? '-',
    'End',
    formatPosition(raceInfo.end.lat, raceInfo.end.lon),
    (raceInfo.end?.radius ? `Radius : ${raceInfo.end.radius} mn` : ' - '),
    frag('Date : ', h('span',{class:'pill pill--muted'}, DateUTC(raceInfo.end.date,1,userPrefs.global.localTime ?4:3)))
  ]);

  return card('Race Stages', tableModern({head, rows}));
}

function viewIceLimits(raceInfo) {
  const south = raceInfo?.ice_limits?.south;
  if (!Array.isArray(south) || south.length === 0) return null;

  // ignore dummy pattern (même logique que ton code)
  const isDummy = (south.length === 5
    && south[0].lat === -90 && south[0].lon === -180
    && south[2].lat === -90 && south[2].lon === 0
    && south[4].lat === -90 && south[4].lon === 180);
  if (isDummy) return null;

  const head = ['Section', 'Position', 'Position2'];
  const rows = [];

  for (let i=1; i<south.length; i++) {
    rows.push([
      `Section ${i+1}`,
      formatPosition(south[i-1].lat, south[i-1].lon),
      formatPosition(south[i].lat, south[i].lon),
    ]);
  }
  return card('Limites des glaces', tableModern({head, rows}));
}

function viewRestrictedZones(raceInfo) {
  const rz = raceInfo?.restrictedZones;
  if (!Array.isArray(rz) || rz.length === 0) return null;

  const tables = rz.map((z, zoneIndex) => {
    const name = z?.name ?? `Zone ${zoneIndex + 1}`;
    const vertices = Array.isArray(z?.vertices) ? z.vertices : [];

    const maxPointsByRow = 4;
    const coordCount = vertices.length ? maxPointsByRow : 1;
    const rows = [];

    if (vertices.length) {
      for (let i = 0; i < vertices.length; i += maxPointsByRow) {
        const chunk = vertices.slice(i, i + maxPointsByRow);
        const missingCount = maxPointsByRow - chunk.length;
        const emptyPositionCell = missingCount ? [h('td', {colspan: missingCount}, '')] : [];

        rows.push(
          h('tr', null, ...chunk.map((p, pointIndex) => h('td', null, (p?.lat != null && p?.lon != null) ? (`${i + pointIndex + 1} : ` + formatPosition(p.lat, p.lon)) : '-')), ...emptyPositionCell)
        );
      }
    } else {
      rows.push(
        h('tr', null, h('td', null, 'Aucun point'))
      );
    }

    return h('div', {class: 'table-wrap rb-rz-table'},
      h('table', {class: 'table-modern'},
        h('tbody', null,
          h('tr', null, h('th', {colspan: coordCount}, name)),
          ...rows
        )
      )
    );
  });

  return card('Zones interdites', h('div', {class: 'rb-rz-list'}, ...tables));
}

/***** rendu principal *****/
export function buildRaceBookHtml() {
    const host = document.getElementById('raceBook');
    if (!host) return;
    const raceInfo = getRaceInfo();
    const playerIte = getLegPlayerInfos();


    if(!raceInfo || raceInfo?.length == 0 ) {
        host.replaceChildren(
          card('Race Details', h('div', {class:'centered'}, 'No data available. Please enter a race.'))
        );
        return;
    }
    const identity = viewIdentity(raceInfo,playerIte?.options?.options);
    const credits  = viewCredits(raceInfo,playerIte);
    const stages   = viewStages(raceInfo,playerIte);
    const ice      = viewIceLimits(raceInfo,playerIte);
    const rz       = viewRestrictedZones(raceInfo,playerIte);

    if(rz) document.getElementById("raceLogBtDiv").style.display = "block";

    // grille principale : identité + crédits côte à côte quand large
    const gridTop = h('div', {class:'rb-grid'}, identity, credits);

    host.replaceChildren(
    gridTop,
    stages,
    ice || document.createComment('no ice limits'),
    rz  || document.createComment('no restricted zones'),
    );
}
