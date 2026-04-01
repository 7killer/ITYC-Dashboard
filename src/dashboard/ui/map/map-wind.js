// map-wind.js
import { mapState, updateBounds } from './map-race.js';
import L from '@/dashboard/ui/map/leaflet-setup';
import { getUserPrefs } from '../../../common/userPrefs.js';
import { WindyDataProxy } from './wind/WindyDataProxy.js';
import { getData } from '../../../common/dbOpes.js'; 
import cfg from '@/config.json';
// Palette Beaufort (on la réutilise pour leaflet-velocity)
/*const colorScale = [
  'rgb(255, 255, 255)',
  'rgb(255, 255, 170)',
  'rgb(255, 255, 85)',
  'rgb(255, 255, 0)', // 3
  'rgb(255, 224, 0)',
  'rgb(255, 193, 0)',
  'rgb(255, 159, 0)',
  'rgb(255, 127, 0)', // 7
  'rgb(255, 96, 0)',
  'rgb(255, 64, 0)',
  'rgb(255, 32, 0)',
  'rgb(255, 0, 0)', // 11
  'rgb(170, 0, 170)',
  'rgb(85, 0, 170)',
];*/
const colorScale = [
  '#1e3f5a',
  '#225ea8',
  '#1d91c0',
  '#41b6c4',
  '#7fcdbb',
  '#c7e9b4',
  '#ffff8c',
  '#feda61',
  '#fd8d3c',
  '#f03b20',
  '#bd0026',
  '#7b1fa2',
];
let windUpdateInProgress = false;
let windUpdateQueued = null;
const WIND_PROXY_RETRY_SCHEDULE_MS = [
  ...Array(20).fill(2000),
  ...Array(10).fill(20000),
  ...Array(10).fill(60000),
  600000,
];
let windProxyRetryTimer = null;
let windProxyRetryAttempts = 0;
let windProxyRetryTargetUnix = null;

// ─────────────────────────────────────────────
// État local pour GRIB + timeline vent
// ─────────────────────────────────────────────

export const windUiState = {
  runInfo: null,
  runInfoKind: 'latest', // 'latest' | 'previous' (fallback affiché)
  lastRunSignature: null, // détecter arrivée de nouveaux forecasts
  pollTimer: null,
  pollInFlight: false,
  runInfoLatest: null,
  runInfoPrevious: null,

  // timeline
  startUnix: null,
  endUnix: null,
  stepSec: 600, // 10 minutes
  currentUnix: null,
  sliderMax: 0,

  // autoplay
  autoPlayTimer: null,
  autoPlayState: 'stopped', // 'playing' | 'paused' | 'stopped'

  // cache snapshots (fh -> { runId, fh, blob, objectUrl, validTimeUnix })
  fhCache: new Map(),

  // contrôles Leaflet
  
    statusControl: null, // grib + time (bottom-left)
    timeControl: null,     // slider (bottom-center)
    sliderEl: null,
   timeLabelEl: null,     // (désormais dans status control)
   ticksEl: null,
   daysEl: null,
   tipEl: null,


  
  // listeners externes (routage…)
  timeListeners: new Set(),
};
// API publique : écouter les changements de temps de vent
export function onWindTimeChange(cb) {
  if (typeof cb === 'function') {
    windUiState.timeListeners.add(cb);
    // renvoie un unsubscribe pratique
    return () => windUiState.timeListeners.delete(cb);
  }
  return () => {};
}

function notifyWindTimeChange(epochSec) {
  windUiState.currentUnix = epochSec;
  for (const cb of windUiState.timeListeners) {
    try {
      cb(epochSec);
    } catch (err) {
      if (cfg.debugWind) console.error('[wind] erreur listener onWindTimeChange', err);
    }
  }
}
// Helper pour parler au background (worker.js)
function sendWindBg(message) {
  return new Promise((resolve) => {
    try {
      if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
        if (cfg.debugWind) console.warn('[wind] chrome.runtime indisponible, pas de background wind');
        resolve(null);
        return;
      }
    } catch {
      if (cfg.debugWind) console.warn('[wind] chrome.runtime non accessible (contexte non-extension ?)');
      resolve(null);
      return;
    }

    chrome.runtime.sendMessage(message, (resp) => {
      const err = chrome.runtime?.lastError;
      if (err) {
        if (cfg.debugWind) console.warn('[wind] sendMessage error', err);
        resolve(null);
      } else {
        resolve(resp);
      }
    });
  });
}
function getWindTimeMode() {
  const m = mapState?.windSettings?.timeMode;
  return (m === 'vr') ? 'vr' : 'gfs';
}

function setWindTimeMode(mode) {
  if (!mapState.windSettings) mapState.windSettings = {};
  mapState.windSettings.timeMode = (mode === 'vr') ? 'vr' : 'gfs';
}

function formatUtcDate(epochSec) {
  if (!epochSec) return '?';
  const d = new Date(epochSec * 1000);
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
function formatLocalDateTime(epochSec) {
  if (!epochSec) return '?';
  const d = new Date(epochSec * 1000);

  // Utilise la locale du navigateur (par ex. fr-FR pour toi)
  // et le fuseau local (DST auto)
  // Exemple fr-FR : "mercredi 4 février 20:00"
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function resetCacheOnRunChange(newInfo) {
  const newRunId = newInfo?.run?.runId || newInfo?.runId;
  const oldRunId = windUiState.runInfo?.run?.runId || windUiState.runInfo?.runId;
  if (oldRunId && newRunId && newRunId !== oldRunId) {
    for (const entry of windUiState.fhCache.values()) {
      try {
        entry.objectUrl && URL.revokeObjectURL(entry.objectUrl);
      } catch (_) {}
    }
    windUiState.fhCache.clear();
  }
}

async function loadRunInfoFromBg() {
  // Toujours charger latest + previous (le mode VR en a besoin).
  const [latest, previous] = await Promise.all([
    sendWindBg({ target: 'bg', type: 'wind/getRunInfo', which: 'latest' }),
    sendWindBg({ target: 'bg', type: 'wind/getRunInfo', which: 'previous' }),
  ]);

  const latestInfo = (latest && latest.ok && latest.info) ? latest.info : null;
  const prevInfo = (previous && previous.ok && previous.info) ? previous.info : null;

  if (!latestInfo && !prevInfo) {
    if (cfg.debugWind) console.warn('[wind] pas de runInfo depuis le background', latest?.error || previous?.error);
    return null;
  }

  // Cache : si changement de run (latest) => purge objectUrls
  if (latestInfo) resetCacheOnRunChange(latestInfo);

  windUiState.runInfoLatest = latestInfo;
  windUiState.runInfoPrevious = prevInfo;

  // runInfo "principal" utilisé pour la timeline : priorité latest si non vide, sinon previous.
  if (latestInfo) {
    const forecasts = (latestInfo.forecasts || []).filter((f) => (f.existsOnServer ?? f.exists));
    if (forecasts.length) {
      windUiState.runInfo = latestInfo;
      windUiState.runInfoKind = 'latest';
      return applyRunInfoToTimeline(latestInfo);
    }
  }

  if (prevInfo) {
    const pfore = (prevInfo.forecasts || []).filter((f) => (f.existsOnServer ?? f.exists));
    if (pfore.length) {
      windUiState.runInfo = prevInfo;
      windUiState.runInfoKind = 'previous';
      return applyRunInfoToTimeline(prevInfo);
    }
  }

  // Sinon, timeline minimale sur latest si dispo
  if (latestInfo) {
    windUiState.runInfo = latestInfo;
    windUiState.runInfoKind = 'latest';
    return applyRunInfoToTimeline(latestInfo);
  }
  windUiState.runInfo = prevInfo;
  windUiState.runInfoKind = 'previous';
  return applyRunInfoToTimeline(prevInfo);
}

function getExistingForecasts(info) {
  const raw = info?.forecasts || [];
  const existing = raw.filter((f) => (f.existsOnServer ?? f.exists));
  existing.sort((a, b) => (a.validTimeUnix || 0) - (b.validTimeUnix || 0));
  return existing;
}

function runStampFromRunId(runId) {
  // "YYYYMMDD_CC" -> YYYYMMDD*100 + CC (number)
  const m = String(runId || '').match(/^(\d{8})_(\d{2})$/);
  if (!m) return 0;
  return Number(m[1]) * 100 + Number(m[2]);
}

function pickBestForecastAtValidTime(infos, validTimeUnix) {
  // infos: array of runInfo
  // retourne { runId, fh, validTimeUnix } du run le plus récent qui a ce validTime et existeOnServer
  let best = null;
  let bestStamp = -1;
  for (const info of infos) {
    if (!info) continue;
    const runId = info?.run?.runId || info?.runId;
    const stamp = runStampFromRunId(runId);
    if (!runId) continue;
    const arr = info.forecasts || [];
    for (const f of arr) {
      if (!f) continue;
      const exists = (f.existsOnServer ?? f.exists);
      if (!exists) continue;
      if ((f.validTimeUnix || 0) !== validTimeUnix) continue;
      const fh = Number(f.fh ?? f.forecastHour ?? f.hour);
      if (!Number.isFinite(fh)) continue;
      if (stamp > bestStamp) {
        bestStamp = stamp;
        best = { runId, fh, validTimeUnix };
      }
    }
  }
  return best;
}

function computeRunSignature(info) {
  const run = info?.run || {};
  const runId = run.runId || info?.runId || '';
  const existing = getExistingForecasts(info);
  const count = existing.length;
  const lastVt = count ? (existing[count - 1].validTimeUnix || 0) : 0;
  const firstVt = count ? (existing[0].validTimeUnix || 0) : 0;
  return `${runId}|${count}|${firstVt}|${lastVt}|${windUiState.runInfoKind}`;
}

function computeCombinedSignature() {
  const a = windUiState.runInfoLatest ? computeRunSignature(windUiState.runInfoLatest) : 'none';
  const b = windUiState.runInfoPrevious ? computeRunSignature(windUiState.runInfoPrevious) : 'none';
  return `L:${a}#P:${b}#mode:${getWindTimeMode()}`;
}

function applyRunInfoToTimeline(info) {
  const forecasts = getExistingForecasts(info);
  if (!forecasts.length) {
    // timeline minimal (pas de slider utile)
    windUiState.startUnix = null;
    windUiState.endUnix = null;
    windUiState.sliderMax = 0;
    refreshTimelineUI();
    return info;
  }
  const min = forecasts[0].validTimeUnix;
  const max = forecasts[forecasts.length - 1].validTimeUnix;
  const spanMax = min + 5 * 24 * 3600; // 5 jours max
  windUiState.startUnix = min;
  windUiState.endUnix = Math.min(max, spanMax);
  if (!windUiState.currentUnix) {
    windUiState.currentUnix = Math.floor(Date.now() / 1000);
  }
  if (windUiState.currentUnix < windUiState.startUnix) {
    windUiState.currentUnix = windUiState.startUnix;
  }
  if (windUiState.currentUnix > windUiState.endUnix) {
    windUiState.currentUnix = windUiState.endUnix;
  }
  const totalSteps = Math.max(
    0,
    Math.floor((windUiState.endUnix - windUiState.startUnix) / windUiState.stepSec)
  );
  windUiState.sliderMax = totalSteps;
  refreshTimelineUI();
  return info;
}
function ensureWindStatusControl(map) {
  const el = windUiState.statusControl;
  if (el) el.update();
  else
  {
      const ctrl = new shortGribControl();
      ctrl.addTo(map);
      windUiState.statusControl = ctrl; 
  }
}

const shortGribControl = L.Control.extend({
  options: {
    position: 'bottomleft',
  },

  onAdd: function (map) {
    const container = L.DomUtil.create(
      'div',
      'leaflet-bar ityc-info-control ityc-info-grib'
    );
     
    const rowTime = document.createElement('div');
    rowTime.className = 'ityc-info-coords ityc-grib-time';
    rowTime.textContent = formatLocalDateTime(windUiState.currentUnix);
   
    const rowGribInfo = document.createElement('div');
    rowGribInfo.className = 'ityc-info-coords';
    const info = windUiState.runInfo;
    if (!info) {
      rowGribInfo.textContent = 'GRIB : —';
    }

    container.appendChild(rowTime);
    container.appendChild(rowGribInfo);

    this._map = map;
    this._rowTime = rowTime;
    this._rowGribInfo = rowGribInfo;
    


    // === Mouse move handler ===
    const update = () => {
      // temps courant affiché
      rowTime.textContent = formatLocalDateTime(windUiState.currentUnix);
      const info = windUiState.runInfo;

      if (!info) {
        rowGribInfo.textContent = 'GRIB : —';
        return;
      }

      const run = info.run || {};
      const allForecasts = info.forecasts || [];
      const cached = allForecasts.filter((f) => f.hasBlob);

      // max horizon chargé
      let maxH = 0;
      for (const f of cached) {
        const fh =
          Number(f.fh ?? f.forecastHour ?? f.hour ?? 0);
        if (!Number.isNaN(fh) && fh > maxH) maxH = fh;
      }

      // date locale dd/mm/yy
      let dt = null;
      if (run.refTimeUnix) {
        dt = new Date(run.refTimeUnix * 1000);
      } else if (run.date) {
        const y = Number(run.date.slice(0, 4));
        const m = Number(run.date.slice(4, 6)) - 1;
        const d = Number(run.date.slice(6, 8));
        const h = Number(run.cycle || 0);
        dt = new Date(Date.UTC(y, m, d, h, 0, 0));
      }

      const dateStr = dt
        ? new Intl.DateTimeFormat(undefined, {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          }).format(dt)
        : '?';

      const cycleStr =
        run.cycle != null ? `${String(run.cycle).padStart(2, '0')}Z` : '';
      const plusStr = maxH ? `+${maxH}h` : '+0h';

      // ex: "09/02/26 18Z +120h"
      rowGribInfo.textContent = `${dateStr} ${cycleStr} ${plusStr}`;
      if (mapState.windSettings.visible)
      {
        rowTime.style.display = '';
        rowGribInfo.style.display = '';
      }
      else
      {
        rowTime.style.display = 'none';
        rowGribInfo.style.display = 'none';
      }
    };
   // update();
    this._updateFn = update;
    update();
    map.on('mousemove', update);

    return container;
  },

  onRemove: function (map) {
    if (this._updateFn) {
      map.off('mousemove', this._updateFn);
    }
  },

  update: function () {
    if (this._updateFn) this._updateFn();
  },
});


function computeSliderIndexFromCurrent() {
  if (!windUiState.startUnix || windUiState.currentUnix == null) return 0;
  const idx = Math.round(
    (windUiState.currentUnix - windUiState.startUnix) /
      windUiState.stepSec
  );
  return Math.min(Math.max(idx, 0), windUiState.sliderMax || 0);
}

function refreshTimeControlDom() {
  if (!windUiState.sliderEl) return;
  windUiState.sliderEl.max = String(windUiState.sliderMax || 0);
  windUiState.sliderEl.value = String(computeSliderIndexFromCurrent());
  const sc = windUiState.statusControl;
  if (sc && typeof sc.update === 'function') sc.update();
}


function clearAutoPlayTimer() {
  if (windUiState.autoPlayTimer) {
    clearTimeout(windUiState.autoPlayTimer);
    windUiState.autoPlayTimer = null;
  }
}

function resetWindProxyRetryState() {
  if (windProxyRetryTimer) {
    clearTimeout(windProxyRetryTimer);
    windProxyRetryTimer = null;
  }
  windProxyRetryAttempts = 0;
  windProxyRetryTargetUnix = null;
}

function scheduleWindProxyRetry(targetUnix) {
  windProxyRetryTargetUnix = targetUnix ?? windProxyRetryTargetUnix ?? windUiState.currentUnix ?? Math.floor(Date.now() / 1000);

  if (windProxyRetryTimer) return;

  if (windProxyRetryAttempts >= WIND_PROXY_RETRY_SCHEDULE_MS.length) {
    if (cfg.debugWind) {
      console.warn('[wind] abandon retry windy_proxy après plusieurs tentatives');
    }
    return;
  }

  const retryDelay = WIND_PROXY_RETRY_SCHEDULE_MS[windProxyRetryAttempts];
  windProxyRetryAttempts += 1;
  windProxyRetryTimer = setTimeout(async () => {
    windProxyRetryTimer = null;

    try {
      startWindWorker();

      if (!mapState.windy_proxy) {
        scheduleWindProxyRetry(windProxyRetryTargetUnix);
        return;
      }

      const retryTarget = windProxyRetryTargetUnix ?? windUiState.currentUnix ?? Math.floor(Date.now() / 1000);
      resetWindProxyRetryState();
      await applyWindAtTime(retryTarget);
    } catch (err) {
      if (cfg.debugWind) console.warn('[wind] retry windy_proxy failed', err);
      scheduleWindProxyRetry(windProxyRetryTargetUnix);
    }
  }, retryDelay);
}

export function stopAutoPlay() {
  clearAutoPlayTimer();
  windUiState.autoPlayState = 'stopped';
}

export function pauseAutoPlay() {
  clearAutoPlayTimer();
  windUiState.autoPlayState = 'paused';
}

async function autoPlayStep() {
  if (windUiState.autoPlayState !== 'playing') return;
  const { startUnix, endUnix } = windUiState;
  if (!startUnix || !endUnix) {
    stopAutoPlay();
    return;
  }

  const current = windUiState.currentUnix ?? startUnix;
  const offsetHours = (current - startUnix) / 3600;

  // 1er bonus : +1h jusqu'à H+24, ensuite +3h
  const stepHours = offsetHours < 24 ? 1 : 3;
  let next = current + stepHours * 3600;

  if (next > endUnix) {
    stopAutoPlay();
    return;
  }

  windUiState.currentUnix = next;

  if (windUiState.sliderEl) {
    const idx = computeSliderIndexFromCurrent();
    windUiState.sliderEl.value = String(idx);
  }
  if (windUiState.timeLabelEl) {
    windUiState.timeLabelEl.textContent = formatUtcDate(next);
  }

  await applyWindAtTime(next);

  // toutes les 2s
  windUiState.autoPlayTimer = setTimeout(autoPlayStep, 1000);
}

export function startAutoPlay() {
  if (windUiState.autoPlayState === 'playing') return;
  windUiState.autoPlayState = 'playing';
  clearAutoPlayTimer();
  windUiState.autoPlayTimer = setTimeout(autoPlayStep, 0);
}

 // ─────────────────────────────────────────────
 // Timeline “Windy-like” (jours + ticks 3h + tooltip)
 // ─────────────────────────────────────────────

function refreshTimelineUI() {
  // slider+ticks/jours
  refreshTimeControlDom();
  const container = windUiState.timeControl?._container || windUiState.timeControl?.getContainer?.();
  if (!container) return;
  const ticksEl = container.querySelector('[data-role="ticks"]');
  const daysEl  = container.querySelector('[data-role="days"]');
  if (ticksEl && daysEl) buildTimelineTicks(ticksEl, daysEl);
}
 
 function buildTimelineTicks(ticksEl, daysEl) {
  ticksEl.innerHTML = '';
  daysEl.innerHTML = '';
  const start = windUiState.startUnix;
  const end   = windUiState.endUnix;
  if (!start || !end || end <= start) return;

  const totalSec = end - start;
  const totalH = totalSec / 3600;

  // ticks 3h
  const tickEveryH = 3;
  const nbTicks = Math.floor(totalH / tickEveryH);
  for (let i = 0; i <= nbTicks; i++) {
    const h = i * tickEveryH;
    const ratio = h / totalH;
    const div = document.createElement('div');
    div.className = 'ityc-tl-tick';
    div.style.left = `${ratio * 100}%`;
    if (h % 24 === 0) div.classList.add('is-day');
    ticksEl.appendChild(div);
  }

  // labels jours
  const nbDays = Math.ceil(totalH / 24);
  for (let d = 0; d <= nbDays; d++) {
    const ts = start + d * 24 * 3600;
    if (ts > end) break;
    const ratio = (d * 24) / totalH;
    const lab = document.createElement('div');
    lab.className = 'ityc-tl-day';
    lab.style.left = `${ratio * 100}%`;
    const date = new Date(ts * 1000);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    lab.textContent = isToday
      ? "Aujourd’hui"
      : new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date);
    daysEl.appendChild(lab);
  }
}
 function ensureWindTimeControl(map) {
   if (windUiState.timeControl) return windUiState.timeControl;
 
   const ctrl = L.control({ position: 'bottomleft' });
 
   ctrl.onAdd = function () {
    // Slider “Windy-like” (barre seulement) -> bottom-center via corner custom
    const root = L.DomUtil.create('div', 'leaflet-bar ityc-info-control ityc-timeline');
    root.innerHTML = `
      <div class="ityc-tl-bar">
        <div class="ityc-tl-ticks" data-role="ticks"></div>
        <input class="ityc-tl-slider" data-role="slider" type="range" min="0" max="0" step="1" value="0" />
        <div class="ityc-tl-tooltip" data-role="tip" style="display:none;"></div>
      </div>
      <div class="ityc-tl-days" data-role="days"></div>
    `;

    L.DomEvent.disableClickPropagation(root);
    L.DomEvent.disableScrollPropagation(root);

    const elSlider = root.querySelector('[data-role="slider"]');
    const elTicks  = root.querySelector('[data-role="ticks"]');
    const elDays   = root.querySelector('[data-role="days"]');
    const elTip    = root.querySelector('[data-role="tip"]');

    windUiState.sliderEl = elSlider;
    windUiState.ticksEl = elTicks;
    windUiState.daysEl = elDays;
    windUiState.tipEl = elTip;

    elSlider.max = String(windUiState.sliderMax || 0);
    elSlider.value = String(computeSliderIndexFromCurrent());

    buildTimelineTicks(elTicks, elDays);

    const bar = root.querySelector('.ityc-tl-bar');
    const showTipAt = (clientX) => {
      const rect = elSlider.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const idx = Math.round(ratio * (Number(elSlider.max) || 0));
      const ts = (windUiState.startUnix || 0) + idx * windUiState.stepSec;
      elTip.textContent = formatLocalDateTime(ts);
      elTip.style.display = '';
      elTip.style.left = `${Math.round(ratio * 100)}%`;
    };
    const hideTip = () => { elTip.style.display = 'none'; };

    bar.addEventListener('mousemove', (e) => showTipAt(e.clientX));
    bar.addEventListener('mouseleave', hideTip);

    const updateTipFromSlider = () => {
      const idx = Number(elSlider.value) || 0;
      const ts = (windUiState.startUnix || 0) + idx * windUiState.stepSec;
      const max = Number(elSlider.max) || 0;
      const ratio = max ? (idx / max) : 0;
      elTip.textContent = formatLocalDateTime(ts);
      elTip.style.display = '';
      elTip.style.left = `${Math.round(ratio * 100)}%`;
    };

    elSlider.addEventListener('input', () => {
      const idx = Number(elSlider.value) || 0;
      const target = (windUiState.startUnix || 0) + idx * windUiState.stepSec;
      windUiState.currentUnix = target;
      updateTipFromSlider();
      // met à jour le bloc temps+grib
      const sc = windUiState.statusControl;
      if (sc && typeof sc.update === 'function') sc.update();
    });

    elSlider.addEventListener('change', async () => {
      stopAutoPlay();
      hideTip();
      const idx = Number(elSlider.value) || 0;
      const target = (windUiState.startUnix || 0) + idx * windUiState.stepSec;
      await applyWindAtTime(target);
    });

    return root;
   };
 
   ctrl.addTo(map);
   windUiState.timeControl = ctrl;
   moveControlToBottomCenter(map, ctrl);
   return ctrl;
 }

function ensureBottomCenterCorner(map) {
  if (map._controlCorners && map._controlCorners.bottomcenter) return map._controlCorners.bottomcenter;
  const container = map._controlContainer || map._controlContainer;
  const corner = L.DomUtil.create('div', 'leaflet-bottom leaflet-center', container);
  // Leaflet n’a pas ce coin par défaut, on l’ajoute
  map._controlCorners = map._controlCorners || {};
  map._controlCorners.bottomcenter = corner;
  return corner;
}
function moveControlToBottomCenter(map, ctrl) {
  const corner = ensureBottomCenterCorner(map);
  const c = ctrl?._container;
  if (corner && c) corner.appendChild(c);
}

async function getOrLoadSnapshot(runId, fh) {
  const key = `${runId}_${fh}`;
  const cached = windUiState.fhCache.get(key);
  if (cached) return cached;

  const model =
    windUiState.runInfoLatest?.model ||
    windUiState.runInfo?.model ||
    'gfs0p25';

  // Lecture directe en IndexedDB
  const pack = await getData('windpacks', [model, runId, fh]);
  if (!pack || !pack.blob) {
    if (cfg.debugWind) console.warn('[wind] pack introuvable en DB', { model, runId, fh, pack });
    return null;
  }

  const blob = pack.blob;

  const objectUrl = URL.createObjectURL(blob);
  const entry = {
    runId,
    fh,
    blob,
    objectUrl,
    validTimeUnix: pack.validTimeUnix || pack.validTime || null,
  };

  windUiState.fhCache.set(key, entry);
  return entry;
}

async function ensureSnapshotAvailable(model, runId, fh) {
  // Demande au BG de télécharger en DB si manquant
  const resp = await sendWindBg({
    target: 'bg',
    type: 'wind/ensureWindpack',
    model,
    runId,
    fh,
  });
  if (!resp || !resp.ok) {
    if (cfg.debugWind) console.warn('[wind] ensureWindpack failed', resp && resp.error);
    return false;
  }
  return true;
}

function floorTo3hAnchor(unixSec) {
  const step = 3 * 3600;
  return Math.floor(unixSec / step) * step;
}

export async function applyWindAtTime(targetUnix) {
  // Throttle : une seule interpolation à la fois, on garde la dernière demandée
  if (windUpdateInProgress) {
    windUpdateQueued = targetUnix;
    return;
  }

  windUpdateInProgress = true;

  try {
    let info = windUiState.runInfo;
    if (!info) {
      info = await loadRunInfoFromBg();
    }
    if (!info) return;

    if (!mapState.windy_proxy) {
      if (cfg.debugWind) console.warn('[wind] windy_proxy non initialisé');
      scheduleWindProxyRetry(targetUnix);
      return;
    }
    resetWindProxyRetryState();
    const mode = getWindTimeMode();
    const model =
      windUiState.runInfoLatest?.model ||
      windUiState.runInfo?.model ||
      'gfs0p25';

    if (mode === 'vr') {
      // VR : interpolation dans le créneau [anchor0, anchor1] de 3h,
      // avec choix du snapshot le plus récent disponible à chaque ancre (latest/previous).
      if (!windUiState.runInfoLatest && !windUiState.runInfoPrevious) {
        await loadRunInfoFromBg();
      }
      const infos = [windUiState.runInfoLatest, windUiState.runInfoPrevious].filter(Boolean);
      if (!infos.length) return;

      const anchor0 = floorTo3hAnchor(targetUnix);
      const anchor1 = anchor0 + 3 * 3600;

      let p = pickBestForecastAtValidTime(infos, anchor0);
      let n = pickBestForecastAtValidTime(infos, anchor1);

      // fallback si anchor exact absent (début de run incomplet par ex) :
      // on garde le plus proche en temps dans les infos combinées
      const combinedExisting = [];
      for (const ri of infos) {
        const runId = ri?.run?.runId || ri?.runId;
        if (!runId) continue;
        for (const f of (ri.forecasts || [])) {
          if (!f) continue;
          const exists = (f.existsOnServer ?? f.exists);
          if (!exists) continue;
          const fh = Number(f.fh ?? f.forecastHour ?? f.hour);
          if (!Number.isFinite(fh)) continue;
          combinedExisting.push({ runId, fh, validTimeUnix: f.validTimeUnix, stamp: runStampFromRunId(runId) });
        }
      }
      combinedExisting.sort((a, b) => (a.validTimeUnix - b.validTimeUnix) || (b.stamp - a.stamp));

      const nearest = (t) => {
        if (!combinedExisting.length) return null;
        let best = combinedExisting[0];
        let bestDiff = Math.abs((best.validTimeUnix || 0) - t);
        for (let i = 1; i < combinedExisting.length; i++) {
          const x = combinedExisting[i];
          const diff = Math.abs((x.validTimeUnix || 0) - t);
          if (diff < bestDiff) { best = x; bestDiff = diff; }
        }
        return { runId: best.runId, fh: best.fh, validTimeUnix: best.validTimeUnix };
      };
      if (!p) p = nearest(anchor0);
      if (!n) n = nearest(anchor1);
      if (!p || !n) return;

      // Charger snapshots (multi runId) + download on-demand
      let prevSnap = await getOrLoadSnapshot(p.runId, p.fh);
      if (!prevSnap) {
        const ok = await ensureSnapshotAvailable(model, p.runId, p.fh);
        if (ok) prevSnap = await getOrLoadSnapshot(p.runId, p.fh);
      }
      let nextSnap = (p.runId === n.runId && p.fh === n.fh) ? prevSnap : await getOrLoadSnapshot(n.runId, n.fh);
      if (!nextSnap) {
        const ok = await ensureSnapshotAvailable(model, n.runId, n.fh);
        if (ok) nextSnap = await getOrLoadSnapshot(n.runId, n.fh);
      }
      if (!prevSnap || !nextSnap) return;

      if (p.runId === n.runId && p.fh === n.fh) {
        mapState.windy_proxy.goto_dtg(prevSnap.objectUrl);
      } else {
        mapState.windy_proxy.interpolateBetween(prevSnap.objectUrl, nextSnap.objectUrl, targetUnix);
      }
      notifyWindTimeChange(targetUnix);
      return;
    }

    // GFS (mode actuel) : un seul runInfo (latest ou previous)
    const run = info.run || {};
    const runId = run.runId || info.runId;
    if (!runId) {
      console.warn('[wind] runId manquant dans runInfo');
      return;
    }

    const existing = (info.forecasts || []).filter((f) => (f.existsOnServer ?? f.exists));
    if (!existing.length) return;
    existing.sort((a, b) => (a.validTimeUnix || 0) - (b.validTimeUnix || 0));

    let prev = null;
    let next = null;
    for (let i = 0; i < existing.length; i++) {
      const f = existing[i];
      const vt = f.validTimeUnix;
      if (vt <= targetUnix) prev = f;
      if (vt >= targetUnix) { next = f; break; }
    }

    if (!prev || !next) {
      let best = existing[0];
      let bestDiff = Math.abs((existing[0].validTimeUnix || 0) - targetUnix);
      for (let i = 1; i < existing.length; i++) {
        const f = existing[i];
        const diff = Math.abs((f.validTimeUnix || 0) - targetUnix);
        if (diff < bestDiff) { best = f; bestDiff = diff; }
      }
      let bestSnap = await getOrLoadSnapshot(runId, best.fh);
      if (!bestSnap) {
        // en mode GFS, on tente aussi un download on-demand (utile si l’alarme est en retard)
        const ok = await ensureSnapshotAvailable(model, runId, best.fh);
        if (ok) bestSnap = await getOrLoadSnapshot(runId, best.fh);
      }
      if (!bestSnap) return;
      mapState.windy_proxy.goto_dtg(bestSnap.objectUrl);
      notifyWindTimeChange(targetUnix);
      return;
    }

    let prevSnap = await getOrLoadSnapshot(runId, prev.fh);
    if (!prevSnap) {
      const ok = await ensureSnapshotAvailable(model, runId, prev.fh);
      if (ok) prevSnap = await getOrLoadSnapshot(runId, prev.fh);
    }
    let nextSnap = (prev.fh === next.fh) ? prevSnap : await getOrLoadSnapshot(runId, next.fh);
    if (!nextSnap) {
      const ok = await ensureSnapshotAvailable(model, runId, next.fh);
      if (ok) nextSnap = await getOrLoadSnapshot(runId, next.fh);
    }
    if (!prevSnap || !nextSnap) return;

    mapState.windy_proxy.interpolateBetween(prevSnap.objectUrl, nextSnap.objectUrl, targetUnix);


  } finally {
    windUpdateInProgress = false;

    if (windUpdateQueued != null) {
      const next = windUpdateQueued;
      windUpdateQueued = null;
      applyWindAtTime(next);
    }
    notifyWindTimeChange(targetUnix);
  }
}

// ─────────────────────────────────────────────
// Worker + proxy
// ─────────────────────────────────────────────

export function startWindWorker() {
  if (!mapState.windy_proxy) {
    const worker = new Worker(
      new URL('./wind/windy-layer-worker.js', import.meta.url),
      { type: 'module' }
    );
    mapState.windy_proxy = new WindyDataProxy(mapState.windyLayer, worker);
  }

  if (mapState.windy_proxy) {
    windProxyRetryAttempts = 0;
  }
}

// ─────────────────────────────────────────────
// Construction de la couche vent (leaflet-velocity)
// ─────────────────────────────────────────────
export function buildWindLayer() {
  if (!mapState.map) return;

  const map = mapState.map;

  // Nettoyer anciennes instances
  if (mapState.windyLayer) {
    map.removeLayer(mapState.windyLayer);
    mapState.windyLayer = null;
  }

  const settings = mapState.windSettings;

  // Choix du maxVelocity selon le mode
  let maxKts;
  if (settings.mode === 'custom') {
    maxKts = settings.customMaxKts;
  } else if (settings.mode === 'auto' && settings.autoMaxKts) {
    maxKts = settings.autoMaxKts;
  } else {
    // default : valeur “climato” raisonnable
    maxKts = 50;
  }

  mapState.windyLayer = L.velocityLayer({
    data: settings.lastData || null,
    opacity: settings.visible ? 0.6 : 0.0,
    paneName: 'overlayPane',
    colorScale, // ta palette
    maxVelocity: ktsToMps(maxKts),   // *** clé pour le gradient ***
    velocityScale: 0.005,
    displayValues: false,
  });

  if (settings.visible) {
    map.addLayer(mapState.windyLayer);
  }
}
function ktsToMps(kts) {
  return kts * 0.514444; // conversion
}
// ─────────────────────────────────────────────
// Récup du manifest & interpolation temps réel
// ─────────────────────────────────────────────

export async function updateWindLayer() {
  if (!mapState.map) return;
  const map = mapState.map;
  
  ensureWindStatusControl(map);
  ensureWindTimeControl(map);
  startRunInfoPolling();

  await loadRunInfoFromBg();
  refreshTimeControlDom();
  refreshTimelineUI();

  // Applique le vent à l'heure courante de la timeline
  await applyWindAtTime(windUiState.currentUnix);
}
function startRunInfoPolling() {
  if (windUiState.pollTimer) return;
  // toutes les 2 minutes : on récupère runInfo (latest), fallback previous si vide
  windUiState.pollTimer = setInterval(async () => {
    if (windUiState.pollInFlight) return;
    windUiState.pollInFlight = true;
    try {
      // on sauvegarde l'état avant
      const prevSig = windUiState.lastRunSignature || computeCombinedSignature();
      const prevHadForecasts = !!getExistingForecasts(windUiState.runInfo).length;
      const info = await loadRunInfoFromBg();
      if (!info) return;
      const sig = computeCombinedSignature();
      windUiState.lastRunSignature = sig;
      // Si nouveauté (plus de forecasts, horizon qui s’étend, ou bascule latest/prev)
      const changed = !prevSig || sig !== prevSig;
      if (!changed) return;
      // UI
      refreshTimeControlDom();
      refreshTimelineUI();
      const sc = windUiState.statusControl;
      if (sc && typeof sc.update === 'function') sc.update();
      // Si avant il n’y avait RIEN et maintenant il y a des forecasts -> on applique le champ
      const nowHasForecasts = !!getExistingForecasts(windUiState.runInfo).length;
      if (mapState.windSettings.visible && (!prevHadForecasts && nowHasForecasts)) {
        // si layer pas présent mais visible, on s’assure qu’il est sur la map
        if (mapState.map && mapState.windyLayer && !mapState.map.hasLayer(mapState.windyLayer)) {
          mapState.map.addLayer(mapState.windyLayer);
        }
        await applyWindAtTime(windUiState.currentUnix);
      }
    } catch (e) {
      if (cfg.debugWind) console.warn('[wind] poll runInfo error', e);
    } finally {
      windUiState.pollInFlight = false;
    }
  }, 120000);
}
export function applyWindSettings() {
  const map = mapState.map;
  const layer = mapState.windyLayer;
  const settings = mapState.windSettings;

  if (!map || !layer) return;

  // 1️⃣ déterminer le maxVelocity
  let maxKts;
  if (settings.mode === 'custom') {
    maxKts = settings.customMaxKts;
  } else if (settings.mode === 'auto' && settings.autoMaxKts) {
    maxKts = settings.autoMaxKts;
  } else {
    maxKts = 50; // valeur par défaut
  }

  const maxVelocity = ktsToMps(maxKts);
  layer.options.maxVelocity = maxVelocity;

  // 2️⃣ gérer la visibilité
  if (!settings.visible) {
    if (map.hasLayer(layer)) {
      map.removeLayer(layer);
    }
    return;
  }

  // 3️⃣ remettre les données à jour si on les a
  if (settings.lastData) {
    layer.setData(settings.lastData);
  }

  // 4️⃣ forcer un vrai refresh comme un toggle
  const isOnMap = map.hasLayer(layer);
  if (isOnMap) {
    map.removeLayer(layer);
    map.addLayer(layer);
  } else {
    map.addLayer(layer);
  }
}


let autoWindWorker = null;

export function initAutoWindWorker() {
  if (!autoWindWorker) {
    autoWindWorker = new Worker(
      new URL('./wind/auto-wind-worker.js', import.meta.url),
      { type: 'module' }
    );

    autoWindWorker.onmessage = (e) => {
      const { autoMaxKts } = e.data;
      if (!autoMaxKts) return;

      mapState.windSettings.autoMaxKts = autoMaxKts;

      if (mapState.windSettings.mode === 'auto') {
        applyWindSettings();
      }
    };
  }
}
let autoWindDebounce = null;

export function requestAutoWindUpdate() {
  if (mapState.windSettings.mode !== 'auto') return;
  if (!mapState.windSettings.lastData) return;
  if (!mapState.map) return;

  clearTimeout(autoWindDebounce);
  autoWindDebounce = setTimeout(() => {
    const payload = mapState.windSettings.lastData;
    const bounds = mapState.map.getBounds();

    const header = payload[0].header;
    const u = payload[0].data;
    const v = payload[1].data;

    autoWindWorker.postMessage({
      header,
      u,
      v,
      bounds: {
        south: bounds.getSouth(),
        north: bounds.getNorth(),
        west: bounds.getWest(),
        east: bounds.getEast(),
      }
    });
  }, 200); // debounce doux
}
