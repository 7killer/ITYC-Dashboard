// src/background/windBackground.js
import { getData, getAllData, saveData, deleteData } from '../common/dbOpes.js';
import cfg from '@/config.json';

export const WIND_MODEL = 'gfs0p25';
const API_BASE = 'https://wind.ityc.fr';
const WINDOW_SECONDS = 5 * 24 * 3600; // 5 jours

function buildRunId(run) {
  // run = { date: 'YYYYMMDD', cycle: '00'|'06'|'12'|'18' }
  return `${run.date}_${run.cycle}`;
}

async function fetchLatestManifest() {
  const url = `${API_BASE}/api/${WIND_MODEL}/manifest/latest`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} on manifest`);
  const manifest = await res.json();

  if (cfg.debugWind) console.log('[wind] manifest latest:', manifest);
  return manifest; // { run: {date,cycle,...?}, forecasts: [...] }
}
function getForecastsWindow5d(manifest) {
  const { forecasts } = manifest;
  if (!forecasts || !forecasts.length) return [];

  // On prend le plus petit validTimeUnix comme "début de run"
  const validTimes = forecasts
    .map(f => f && typeof f.validTimeUnix === 'number' ? f.validTimeUnix : null)
    .filter(v => v !== null);

  if (!validTimes.length) return [];

  const minValid = Math.min(...validTimes);
  const maxValid = minValid + WINDOW_SECONDS;

  return forecasts.filter(f =>
    f &&
    typeof f.validTimeUnix === 'number' &&
    f.validTimeUnix >= minValid &&
    f.validTimeUnix <= maxValid
  );
}


async function ensureWindpackInDB(model, run, forecast) {
  const runId = buildRunId(run);
  const key = [model, runId, forecast.fh];

  const existing = await getData('windpacks', key);
  if (existing && existing.blob) {
    if (cfg.debugWind) console.log('[wind] windpack déjà présent', key);
    return existing;
  }

  const fileUrl = `${API_BASE}/api/${model}/file/${run.date}/${run.cycle}/${forecast.fh}`;
  if (cfg.debugWind) console.log('[wind] DL windpack', fileUrl);

  const res = await fetch(fileUrl);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} on windpack fh=${forecast.fh}`);
  }

  const blob = await res.blob();

  const record = {
    model,
    runId,
    fh: forecast.fh,
    runDate: run.date,
    runCycle: run.cycle,
    validTimeUnix: forecast.validTimeUnix,
    blob,
  };

  await saveData('windpacks', record);
  if (cfg.debugWind) console.log('[wind] windpack stocké', key);

  return record;
}

export async function syncLatestWindpacks() {
  const manifest = await fetchLatestManifest();
  const { run, forecasts } = manifest;
  const model = WIND_MODEL;

  const avail = (forecasts || []).filter(f => f && f.exists);
  if (!avail.length) {
    if (cfg.debugWind) console.warn('[wind] aucun forecast existant dans le manifest');
    return { model, run, forecasts: [] };
  }

  // minimal : on assure au moins le téléchargement du forecast le plus proche de "maintenant"
  const nowUnix = Math.floor(Date.now() / 1000);
  let best = avail[0];
  let bestDiff = Math.abs(best.validTimeUnix - nowUnix);

  for (let i = 1; i < avail.length; i++) {
    const f = avail[i];
    const diff = Math.abs(f.validTimeUnix - nowUnix);
    if (diff < bestDiff) {
      best = f;
      bestDiff = diff;
    }
  }

  try {
    await ensureWindpackInDB(model, run, best);
  } catch (e) {
    console.error('[wind] erreur DL windpack best', best, e);
  }

  // tu peux décider ici si tu veux *tout* précharger ou juste le "best" :
  // for (const f of avail) { await ensureWindpackInDB(model, run, f); }

  await cleanupOldRuns(model);

  return { model, run, forecasts };
}
async function cleanupOldRuns(model) {
  const all = await getAllData('windpacks');
  const runsSet = new Set(all.filter(p => p.model === model).map(p => p.runId));
  const runs = Array.from(runsSet).sort().reverse(); // plus récent d'abord

  const keep = new Set(runs.slice(0, 2)); // dernier + précédent
  let removed = 0;

  for (const pack of all) {
    if (pack.model !== model) continue;
    if (!keep.has(pack.runId)) {
      const key = [pack.model, pack.runId, pack.fh];
      await deleteData('windpacks', key);
      removed++;
    }
  }

  if (cfg.debugWind) {
    console.log('[wind] cleanupOldRuns', { runs, keep: Array.from(keep), removed });
  }
}
export async function buildRunInfo() {
  const manifest = await fetchLatestManifest();
  const { run, forecasts } = manifest;
  const model = WIND_MODEL;
  const runId = buildRunId(run);

  // quels windpacks sont présents en DB ?
  const packs = await getAllData('windpacks');
  const byFH = new Map();
  for (const p of packs) {
    if (p.model === model && p.runId === runId) {
      byFH.set(p.fh, p);
    }
  }

  const enriched = (forecasts || []).map(f => {
    if (!f) return null;
    const pack = byFH.get(f.fh);
    return {
      fh: f.fh,
      existsOnServer: !!f.exists,
      validTimeUnix: f.validTimeUnix,
      hasBlob: !!pack,
    };
  });

  return {
    model,
    run,
    runId,
    forecasts: enriched,
  };
}

export async function syncLatestWindpacksWindowed() {
  const manifest = await fetchLatestManifest();
  const { run } = manifest;
  const model = WIND_MODEL;

  const runId = buildRunId(run);
  const windowForecasts = getForecastsWindow5d(manifest);

  if (!windowForecasts.length) {
    if (cfg.debugWind) console.warn('[wind] aucune forecast dans la fenêtre 5j');
    return { model, run, runId, allComplete: false, count: 0, downloaded: 0 };
  }

  // Tous les FH de la fenêtre 5J
  const fhList = windowForecasts.map(f => f.fh);

  // On regarde ce qu'on a déjà en DB
  const allPacks = await getAllData('windpacks');
  const existingForRun = allPacks.filter(p => p.model === model && p.runId === runId);
  const haveByFh = new Set(existingForRun.map(p => p.fh));

  let downloaded = 0;
  let allComplete = true;

  for (const f of windowForecasts) {
    if (!f) continue;

    // Si le serveur n'a pas encore ce forecast → on n’insiste pas, on réessaiera plus tard
    if (!f.exists) {
      allComplete = false;
      continue;
    }

    // Si déjà en DB → OK
    if (haveByFh.has(f.fh)) continue;

    // Sinon on tente le download
    try {
      await ensureWindpackInDB(model, run, f);
      downloaded++;
      haveByFh.add(f.fh);
    } catch (err) {
      allComplete = false;
      console.warn('[wind] erreur download FH', f.fh, err);
    }
  }

  // Si tous les FH de la fenêtre existent côté serveur ET sont en DB → allComplete = true
  // Sinon → allComplete = false (robot 2 min continuera de réessayer)

  await cleanupOldRuns(model);

  if (cfg.debugWind) {
    console.log('[wind] syncLatestWindpacksWindowed', {
      model, runId, count: windowForecasts.length, downloaded, allComplete
    });
  }

  return { model, run, runId, count: windowForecasts.length, downloaded, allComplete };
}
