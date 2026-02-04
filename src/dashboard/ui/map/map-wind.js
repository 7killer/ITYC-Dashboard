// map-wind.js
import { mapState, updateBounds } from './map-race.js';
import L from '@/dashboard/ui/map/leaflet-setup';
import { getUserPrefs } from '../../../common/userPrefs.js';
import { WindyDataProxy } from './wind/WindyDataProxy.js';
import { getData } from '../../../common/dbOpes.js'; 

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
// ─────────────────────────────────────────────
// État local pour GRIB + timeline vent
// ─────────────────────────────────────────────

const windUiState = {
  runInfo: null,
  // timeline
  startUnix: null,
  endUnix: null,
  stepSec: 600, // 10 minutes
  currentUnix: null,
  sliderMax: 0,

  // cache snapshots (fh -> { runId, fh, blob, objectUrl, validTimeUnix })
  fhCache: new Map(),

  // contrôles Leaflet
  statusControl: null,
  statusEl: null,
  timeControl: null,
  sliderEl: null,
  timeLabelEl: null,

    // 🔥 auto-play
  isPlaying: false,
  playTimerId: null,
};

// Helper pour parler au background (worker.js)
function sendWindBg(message) {
  return new Promise((resolve) => {
    try {
      if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
        console.warn('[wind] chrome.runtime indisponible, pas de background wind');
        resolve(null);
        return;
      }
    } catch {
      console.warn('[wind] chrome.runtime non accessible (contexte non-extension ?)');
      resolve(null);
      return;
    }

    chrome.runtime.sendMessage(message, (resp) => {
      const err = chrome.runtime?.lastError;
      if (err) {
        console.warn('[wind] sendMessage error', err);
        resolve(null);
      } else {
        resolve(resp);
      }
    });
  });
}

function formatUtcDate(epochSec) {
  if (!epochSec) return '?';
  const d = new Date(epochSec * 1000);
  // "MM-DD HH:mm"
  return d.toISOString().slice(5, 16).replace('T', ' ');
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
  const resp = await sendWindBg({ target: 'bg', type: 'wind/getRunInfo' });
  if (!resp || !resp.ok || !resp.info) {
    console.warn('[wind] pas de runInfo depuis le background', resp && resp.error);
    return null;
  }

  const info = resp.info;
  resetCacheOnRunChange(info);
  windUiState.runInfo = info;

  const rawForecasts = info.forecasts || [];
  const forecasts = rawForecasts.filter((f) => (f.existsOnServer ?? f.exists));

  if (!forecasts.length) {
    console.warn('[wind] runInfo sans forecast existant');
    return info;
  }

  forecasts.sort((a, b) => (a.validTimeUnix || 0) - (b.validTimeUnix || 0));

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

  return info;
}
function ensureWindStatusControl(map) {
  if (windUiState.statusControl) return windUiState.statusControl;

  const ctrl = L.control({ position: 'bottomleft' });
  ctrl.onAdd = function () {
    const div = L.DomUtil.create('div', 'ityc-wind-status leaflet-bar');
    div.style.padding = '4px 6px';
    div.style.fontSize = '11px';
    div.style.background = 'rgba(0, 0, 0, 0.55)';
    div.style.color = '#fff';
    div.style.marginBottom = '50px'; // au-dessus de l'échelle nautique
    div.style.maxWidth = '240px';
    div.style.lineHeight = '1.3';
    div.innerHTML = '<span>Vent: init…</span>';
    L.DomEvent.disableClickPropagation(div);
    windUiState.statusEl = div;
    return div;
  };

  ctrl.addTo(map);
  windUiState.statusControl = ctrl;
  return ctrl;
}

function updateStatusDom() {
  const el = windUiState.statusEl;
  const info = windUiState.runInfo;
  if (!el) return;

  if (!info) {
    el.innerHTML = '<span>Vent: aucun GRIB</span>';
    return;
  }

  const run = info.run || {};
  const allForecasts = info.forecasts || [];

  // Forecasts existants côté serveur
  const existing = allForecasts.filter((f) => (f.existsOnServer ?? f.exists));
  // Forecasts effectivement présents en DB (blob chargé)
  const cached = allForecasts.filter((f) => f.hasBlob);

  const totalServer = existing.length;
  const totalDb = cached.length;

  // 🔹 Date de sortie du GRIB (locale PC)
  let runDateStr = '';
  if (run.refTimeUnix) {
    runDateStr = formatLocalDateTime(run.refTimeUnix);
  } else if (run.date) {
    // fallback si jamais refTimeUnix n'est pas là
    // run.date = "YYYYMMDD"
    const y = run.date.slice(0, 4);
    const m = run.date.slice(4, 6);
    const d = run.date.slice(6, 8);
    const h = run.cycle != null ? String(run.cycle).padStart(2, '0') : '00';
    const dt = new Date(`${y}-${m}-${d}T${h}:00:00Z`);
    runDateStr = formatLocalDateTime(Math.floor(dt.getTime() / 1000));
  } else {
    runDateStr = '(date inconnue)';
  }

  // 🔹 GRIB hour (00Z / 06Z / 12Z / 18Z)
  const cycleStr =
    run.cycle != null ? `${String(run.cycle).padStart(2, '0')}Z` : '';

  // 🔹 Volume d'heures effectivement chargées en DB
  let maxLoadedH = 0;
  if (cached.length) {
    maxLoadedH = cached.reduce(
      (max, f) => (typeof f.fh === 'number' && f.fh > max ? f.fh : max),
      0
    );
  }

  // (optionnel) Volume max théorique dispo côté serveur
  let maxServerH = 0;
  if (existing.length) {
    maxServerH = existing.reduce(
      (max, f) => (typeof f.fh === 'number' && f.fh > max ? f.fh : max),
      0
    );
  }

  el.innerHTML =
    `<div><b>GRIB</b> ${runDateStr} (${cycleStr})</div>` +
    `<div>Chargé: +${maxLoadedH}h (${totalDb} échéances)</div>` +
    `<div>Dispo serveur: +${maxServerH}h (${totalServer} échéances)</div>`;
}

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
  if (windUiState.timeLabelEl)  windUiState.timeLabelEl.textContent = formatLocalDateTime(windUiState.currentUnix);
}
function stopWindAutoPlay(resetPosition = false) {
  if (windUiState.playTimerId != null) {
    clearTimeout(windUiState.playTimerId);
    windUiState.playTimerId = null;
  }
  windUiState.isPlaying = false;

  if (resetPosition && windUiState.sliderEl && windUiState.startUnix != null) {
    // Remettre le slider au début de la fenêtre (startUnix)
    const idx = 0;
    windUiState.sliderEl.value = String(idx);
    const target = windUiState.startUnix + idx * windUiState.stepSec;
    windUiState.currentUnix = target;
    if (windUiState.timeLabelEl)  windUiState.timeLabelEl.textContent = formatLocalDateTime(target);
    // Met à jour la couche de vent sur cette date
    applyWindAtTime(target).catch(console.error);
  }
}

function startWindAutoPlay() {
  if (!windUiState.sliderEl || windUiState.startUnix == null) return;

  windUiState.isPlaying = true;

const step = async () => {
  if (!windUiState.isPlaying) {
    windUiState.playTimerId = null;
    return;
  }

  const maxIdx = windUiState.sliderMax || 0;
  let idx = Number(windUiState.sliderEl.value) || 0;

  // 🔥 +20 minutes = +1200s → 2 pas de slider
  const SLIDER_STEP = Math.max(1, Math.round(1200 / windUiState.stepSec)); // = 2

  if (idx >= maxIdx) {
    stopWindAutoPlay(false);
    return;
  }

  const nextIdx = Math.min(idx + SLIDER_STEP, maxIdx);
  windUiState.sliderEl.value = String(nextIdx);

  const target =
    windUiState.startUnix + nextIdx * windUiState.stepSec;
  windUiState.currentUnix = target;

  if (windUiState.timeLabelEl) {
    windUiState.timeLabelEl.textContent =
      formatUtcDate(target) + ' UTC';
  }

  try {
    await applyWindAtTime(target);
  } catch (e) {
    console.error('[wind] autoPlay step error', e);
    stopWindAutoPlay(false);
    return;
  }

  // ⏱️ 2 secondes entre chaque step
  windUiState.playTimerId = setTimeout(step, 2000);
};

  // Si on relance alors qu’un timer traîne encore
  if (windUiState.playTimerId != null) {
    clearTimeout(windUiState.playTimerId);
    windUiState.playTimerId = null;
  }

  // Démarrer immédiatement le premier step
  windUiState.playTimerId = setTimeout(step, 0);
}

function ensureWindTimeControl(map) {
  if (windUiState.timeControl) return windUiState.timeControl;

  const ctrl = L.control({ position: 'bottomleft' });
  ctrl.onAdd = function () {
    const div = L.DomUtil.create('div', 'ityc-wind-time leaflet-bar');
    div.style.padding = '4px 6px';
    div.style.fontSize = '11px';
    div.style.background = 'rgba(0, 0, 0, 0.55)';
    div.style.color = '#fff';
    div.style.marginBottom = '95px'; // un peu au-dessus du GRIB status + échelle
    div.style.maxWidth = '260px';

    const label = document.createElement('div');
    label.textContent = 'Vent : heure de la prévision';
    label.style.marginBottom = '2px';

    // ─────────────────────────────────
    // Barre de boutons Play / Pause / Stop
    // ─────────────────────────────────
    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.gap = '4px';
    btnRow.style.marginBottom = '2px';

    const btnPlay = document.createElement('button');
    btnPlay.type = 'button';
    btnPlay.textContent = '▶';
    btnPlay.title = 'Lecture automatique';
    btnPlay.style.fontSize = '11px';
    btnPlay.style.padding = '2px 4px';

    const btnPause = document.createElement('button');
    btnPause.type = 'button';
    btnPause.textContent = '⏸';
    btnPause.title = 'Pause';
    btnPause.style.fontSize = '11px';
    btnPause.style.padding = '2px 4px';

    const btnStop = document.createElement('button');
    btnStop.type = 'button';
    btnStop.textContent = '⏹';
    btnStop.title = 'Stop (retour au début)';
    btnStop.style.fontSize = '11px';
    btnStop.style.padding = '2px 4px';

    btnRow.appendChild(btnPlay);
    btnRow.appendChild(btnPause);
    btnRow.appendChild(btnStop);

    // ─────────────────────────────────
    // Slider
    // ─────────────────────────────────
    const range = document.createElement('input');
    range.type = 'range';
    range.min = '0';
    range.max = String(windUiState.sliderMax || 0);
    range.value = String(computeSliderIndexFromCurrent());
    range.style.width = '180px';

    // Label horaire
    const ts = document.createElement('div');
    ts.style.marginTop = '2px';
//    ts.textContent =
//      formatUtcDate(windUiState.currentUnix) + ' UTC';

    ts.textContent = formatLocalDateTime(windUiState.currentUnix);

    div.appendChild(label);
    div.appendChild(btnRow);
    div.appendChild(range);
    div.appendChild(ts);

    L.DomEvent.disableClickPropagation(div);

    // Mise à jour live du label horaire quand on glisse le slider
    range.addEventListener('input', () => {
      const idx = Number(range.value) || 0;
      const target =
        windUiState.startUnix + idx * windUiState.stepSec;
      windUiState.currentUnix = target;
      ts.textContent = formatLocalDateTime(target);
    });

    // Recalcul réel de la couche vent quand on lâche le slider
    range.addEventListener('change', async () => {
      const idx = Number(range.value) || 0;
      const target =
        windUiState.startUnix + idx * windUiState.stepSec;
      windUiState.currentUnix = target;
      ts.textContent = formatLocalDateTime(target);
      await applyWindAtTime(target);
    });

    // Bouton Play
    btnPlay.addEventListener('click', () => {
      if (!windUiState.isPlaying) {
        startWindAutoPlay();
      }
    });

    // Bouton Pause
    btnPause.addEventListener('click', () => {
      stopWindAutoPlay(false);
    });

    // Bouton Stop
    btnStop.addEventListener('click', () => {
      stopWindAutoPlay(true);
    });

    windUiState.sliderEl = range;
    windUiState.timeLabelEl = ts;
    return div;
  };

  ctrl.addTo(map);
  windUiState.timeControl = ctrl;
  return ctrl;
}

async function getOrLoadSnapshot(runId, fh) {
  const key = `${runId}_${fh}`;
  const cached = windUiState.fhCache.get(key);
  if (cached) return cached;

  // modèle : on le récupère du runInfo si dispo, sinon fallback
  const model = windUiState.runInfo?.model || 'gfs0p25';

  // Lecture directe en IndexedDB
  const pack = await getData('windpacks', [model, runId, fh]);
  if (!pack || !pack.blob) {
    console.warn('[wind] pack introuvable en DB', { model, runId, fh, pack });
    return null;
  }

  const blob = pack.blob;

  // Pour debug, si tu veux voir ce que c'est :
  // console.log('[wind] blob type:', blob && blob.constructor && blob.constructor.name);

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


async function applyWindAtTime(targetUnix) {
  let info = windUiState.runInfo;
  if (!info) {
    info = await loadRunInfoFromBg();
  }
  if (!info) return;

  const run = info.run || {};
  const runId = run.runId || info.runId;
  if (!runId) {
    console.warn('[wind] runId manquant dans runInfo');
    return;
  }

  const allForecasts = info.forecasts || [];
  const existing = allForecasts.filter((f) => (f.existsOnServer ?? f.exists));
  if (!existing.length) return;

  existing.sort((a, b) => (a.validTimeUnix || 0) - (b.validTimeUnix || 0));

  let prev = null;
  let next = null;
  for (let i = 0; i < existing.length; i++) {
    const f = existing[i];
    const vt = f.validTimeUnix;
    if (vt <= targetUnix) prev = f;
    if (vt >= targetUnix) {
      next = f;
      break;
    }
  }

  if (!mapState.windy_proxy) {
    console.warn('[wind] windy_proxy non initialisé');
    return;
  }

  // cas bord : pas d’intervalle complet, on prend le "best" simple
  if (!prev || !next) {
    let best = existing[0];
    let bestDiff = Math.abs((existing[0].validTimeUnix || 0) - targetUnix);
    for (let i = 1; i < existing.length; i++) {
      const f = existing[i];
      const diff = Math.abs((f.validTimeUnix || 0) - targetUnix);
      if (diff < bestDiff) {
        best = f;
        bestDiff = diff;
      }
    }
    const bestSnap = await getOrLoadSnapshot(runId, best.fh);
    if (!bestSnap) return;
    // goto_dtg avec un seul fichier
    mapState.windy_proxy.goto_dtg(bestSnap.objectUrl);
    return;
  }

  // intervalle complet : interpolation dans le worker
  const prevSnap = await getOrLoadSnapshot(runId, prev.fh);
  const nextSnap =
    prev.fh === next.fh ? prevSnap : await getOrLoadSnapshot(runId, next.fh);

  if (!prevSnap || !nextSnap) return;

  mapState.windy_proxy.interpolateBetween(
    prevSnap.objectUrl,
    nextSnap.objectUrl,
    targetUnix
  );
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
    displayValues: true,
    displayOptions: {
      velocityType: 'Vent',
      position: 'bottomright',
      emptyString: 'Aucune donnée',
      angleConvention: 'bearingCW',
      showCardinal: true,
      speedUnit: 'kt',
      directionString: 'Direction',
      speedString: 'Vitesse',
    },
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

/*export function updateWindLayer() {
  const apiBase = 'https://wind.ityc.fr'; // proxy vers ton Node

  fetch(`${apiBase}/api/gfs0p25/manifest/latest`)
    .then(function (res) {
      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }
      return res.json();
    })
    .then(function (manifest) {
      const run = manifest.run;
      const forecasts = manifest.forecasts;

      if (!run || !Array.isArray(forecasts) || forecasts.length === 0) {
        console.warn('Manifest invalide ou vide:', manifest);
        return;
      }

      const nowUnix = Math.floor(Date.now() / 1000);

      // Ne garder que les forecasts existants
      const existing = forecasts.filter(function (f) {
        return f.exists;
      });

      if (!existing.length) {
        console.warn('Aucun forecast existant dans le manifest');
        return;
      }

      // Trier par validTimeUnix croissant
      existing.sort(function (a, b) {
        return a.validTimeUnix - b.validTimeUnix;
      });

      // Chercher prev (<= now) et next (> now)
      let prev = null;
      let next = null;

      for (let i = 0; i < existing.length; i++) {
        const f = existing[i];
        if (f.validTimeUnix <= nowUnix) {
          prev = f;
        }
        if (f.validTimeUnix > nowUnix) {
          next = f;
          break;
        }
      }

      if (!mapState.windy_proxy) {
        console.warn('windy_proxy non initialisé');
        return;
      }

      const baseFileUrl =
        apiBase + '/api/gfs0p25/file/' + run.date + '/' + run.cycle;

      // Cas bord : pas d’intervalle complet
      if (!prev || !next) {
        let best = existing[0];
        let bestDiff = Math.abs(existing[0].validTimeUnix - nowUnix);

        for (let i = 1; i < existing.length; i++) {
          const f = existing[i];
          const diff = Math.abs(f.validTimeUnix - nowUnix);
          if (diff < bestDiff) {
            best = f;
            bestDiff = diff;
          }
        }

        console.log(
          '[wind] Pas d’intervalle complet, on utilise le forecast le plus proche fh=',
          best.fh
        );

        const url = baseFileUrl + '/' + best.fh;
        mapState.windy_proxy.goto_dtg(url);
        return;
      }

      // Cas normal : interpolation entre prev & next
      const urlPrev = baseFileUrl + '/' + prev.fh;
      const urlNext = baseFileUrl + '/' + next.fh;

      console.log(
        '[wind] Interpolation temps réel entre fh=',
        prev.fh,
        'et',
        next.fh,
        'nowUnix=',
        nowUnix
      );

      mapState.windy_proxy.interpolateBetween(urlPrev, urlNext, nowUnix);
    })
    .catch(function (err) {
      console.error('updateWindLayer error:', err);
    });
}*/
export async function updateWindLayer() {
  if (!mapState.map) return;
  const map = mapState.map;

  // Contrôles (ne seront créés qu'une fois)
  ensureWindStatusControl(map);
  ensureWindTimeControl(map);

  // On charge/rafraîchit le runInfo depuis le background
  await loadRunInfoFromBg();
  updateStatusDom();
  refreshTimeControlDom();

  // Applique le vent à l'heure courante de la timeline
  await applyWindAtTime(windUiState.currentUnix);
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

const WindDisplayControl = L.Control.extend({
  options: {
    position: 'topright',
    onModeChange: null,
    onMaxChange: null,
    onToggleVisible: null,
  },

  onAdd(map) {
    const container = L.DomUtil.create('div', 'leaflet-bar wind-display-control');
    container.innerHTML = `
      <div class="wind-ctrl">
        <div class="wind-ctrl-row">
          <label>Vent :</label>
          <input type="checkbox" id="wind-visible" checked>
        </div>
        <div class="wind-ctrl-row">
          <select id="wind-mode">
            <option value="default">Défaut</option>
            <option value="custom">Custom</option>
            <option value="auto">Auto</option>
          </select>
        </div>
        <div class="wind-ctrl-row" id="wind-custom-row">
          <label>Max (nds)</label>
          <input type="range" id="wind-max" min="10" max="40" step="1" value="40">
          <span id="wind-max-value">40</span>
        </div>
      </div>
    `;

    // éviter que le contrôle bouffe le drag/zoom
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    const modeSelect   = container.querySelector('#wind-mode');
    const visibleCheck = container.querySelector('#wind-visible');
    const maxRange     = container.querySelector('#wind-max');
    const maxSpan      = container.querySelector('#wind-max-value');
    const customRow    = container.querySelector('#wind-custom-row');

    const opts = this.options;

    // init selon mapState
    const settings = mapState.windSettings;
    modeSelect.value = settings.mode;
    visibleCheck.checked = settings.visible;
    maxRange.value = settings.customMaxKts;
    maxSpan.textContent = settings.customMaxKts;
    customRow.style.display = (settings.mode === 'custom') ? 'flex' : 'none';

    modeSelect.addEventListener('change', () => {
      const mode = modeSelect.value;
      customRow.style.display = (mode === 'custom') ? 'flex' : 'none';
      if (opts.onModeChange) opts.onModeChange(mode);
    });

    visibleCheck.addEventListener('change', () => {
      if (opts.onToggleVisible) opts.onToggleVisible(visibleCheck.checked);
    });

    maxRange.addEventListener('input', () => {
      const v = parseInt(maxRange.value, 10) || 0;
      maxSpan.textContent = v;
      if (opts.onMaxChange) opts.onMaxChange(v);
    });

    return container;
  }
});

L.control.windDisplay = function (opts) {
  return new WindDisplayControl(opts);
};


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