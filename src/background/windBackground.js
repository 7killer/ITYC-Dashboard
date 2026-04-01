// src/background/windBackground.js
import { getData, getAllData, saveData, deleteData } from '../common/dbOpes.js';
import cfg from '@/config.json';

export const WIND_MODEL = 'gfs0p25';
const API_BASE = 'https://wind.ityc.fr';
const WINDOW_SECONDS = 5 * 24 * 3600; // 5 jours
const VALID_WHICH = new Set(['latest', 'previous']);
function normalizeWhich(which) {
  const w = String(which || 'latest').toLowerCase();
  return VALID_WHICH.has(w) ? w : 'latest';
}

function buildRunId(run) {
  // run = { date: 'YYYYMMDD', cycle: '00'|'06'|'12'|'18' }
  return `${run.date}_${run.cycle}`;
}
function parseRunId(runId) {
  // "YYYYMMDD_CC" -> { date:"YYYYMMDD", cycle:"CC" }
  const s = String(runId || '');
  const m = s.match(/^(\d{8})_(\d{2})$/);
  if (!m) return null;
  return { date: m[1], cycle: m[2] };
}

function computeValidTimeUnixFromRunIdFh(runId, fh) {
  const parsed = parseRunId(runId);
  const fhNum = toFhNumber(fh);
  if (!parsed || fhNum == null) return null;
  const y = Number(parsed.date.slice(0, 4));
  const mo = Number(parsed.date.slice(4, 6)) - 1;
  const d = Number(parsed.date.slice(6, 8));
  const h = Number(parsed.cycle);
  const refMs = Date.UTC(y, mo, d, h, 0, 0);
  return Math.floor(refMs / 1000) + fhNum * 3600;
}

async function fetchManifest(which = 'latest') {
  const w = normalizeWhich(which);
  const url = `${API_BASE}/api/${WIND_MODEL}/manifest/${w}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} on manifest`);
  const manifest = await res.json();

  if (cfg.debugWind) console.log(`[wind] manifest ${w}:`, manifest);
  return manifest; // { run: {date,cycle,...?}, forecasts: [...] }
}

function toFhNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
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
  const fhNum = toFhNumber(forecast?.fh);
  if (fhNum == null) throw new Error(`Invalid forecast.fh: ${forecast?.fh}`);
  const key = [model, runId, fhNum];

  const existing = await getData('windpacks', key);
  if (existing && existing.blob) {
    if (cfg.debugWind) console.log('[wind] windpack déjà présent', key);
    return existing;
  }

  const fileUrl = `${API_BASE}/api/${model}/file/${run.date}/${run.cycle}/${fhNum}`;
  if (cfg.debugWind) console.log('[wind] DL windpack', fileUrl);

  const res = await fetch(fileUrl);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} on windpack fh=${fhNum}`);
  }

  const blob = await res.blob();

  const record = {
    model,
    runId,
    fh: fhNum,
    runDate: run.date,
    runCycle: run.cycle,
    validTimeUnix: forecast.validTimeUnix,
    blob,
  };

  await saveData('windpacks', record);
  if (cfg.debugWind) console.log('[wind] windpack stocké', key);

  return record;
}

/**
 * Assure qu'un windpack (model, runId, fh) est en DB.
 * - runId = "YYYYMMDD_CC"
 * - fh = number (ex 9, 12, 15, 18...)
 *
 * Utilisé par le mode VR côté UI : on peut avoir besoin de snapshots
 * d'un run différent du "latest" courant.
 */
export async function ensureWindpackByRunIdFh(model, runId, fh) {
  const parsed = parseRunId(runId);
  const fhNum = toFhNumber(fh);
  if (!parsed) throw new Error(`Invalid runId: ${runId}`);
  if (fhNum == null) throw new Error(`Invalid fh: ${fh}`);

  // Déjà en DB ?
  const key = [model, runId, fhNum];
  const existing = await getData('windpacks', key);
  if (existing && existing.blob) return existing;

  // On construit un "run" + "forecast" minimal pour réutiliser ensureWindpackInDB
  const run = { date: parsed.date, cycle: parsed.cycle };
  const validTimeUnix = computeValidTimeUnixFromRunIdFh(runId, fhNum);
  const forecast = {
    fh: fhNum,
    validTimeUnix,
    exists: true,
  };

  return ensureWindpackInDB(model, run, forecast);
}

async function ensurePreviousRunFh09and12(model) {
  // Toujours tenter de précharger FH 9 et 12 du run "previous"
  try {
    const prevManifest = await fetchManifest('previous');
    const prevRun = prevManifest?.run;
    const prevForecasts = prevManifest?.forecasts || [];
    if (!prevRun || !prevForecasts.length) return;

    const want = new Set([9, 12]);
    const candidates = prevForecasts
      .map((f) => ({ f, fh: toFhNumber(f?.fh) }))
      .filter((x) => x.f && x.fh != null && want.has(x.fh));

    for (const c of candidates) {
      // Si le serveur n'a pas encore FH 9/12 (rare sur "previous"), on skip.
      if (!c.f.exists) continue;
      try {
        await ensureWindpackInDB(model, prevRun, c.f);
      } catch (e) {
        if (cfg.debugWind) console.warn('[wind] preload previous fh failed', c.fh, e);
      }
    }
  } catch (e) {
    if (cfg.debugWind) console.warn('[wind] preload previous fh 9/12 skipped (manifest previous failed)', e);
  }
}

export async function syncLatestWindpacks() {
  const manifest = await fetchManifest('latest');
  const { run, forecasts } = manifest;
  const model = WIND_MODEL;

  const avail = (forecasts || []).filter(f => f && f.exists);
  if (!avail.length) {
    if (cfg.debugWind) console.warn('[wind] aucun forecast existant dans le manifest');
    await ensurePreviousRunFh09and12(model);
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
    if (cfg.debugWind) console.error('[wind] erreur DL windpack best', best, e);
  }
  await ensurePreviousRunFh09and12(model);
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
export async function buildRunInfo(opts = undefined) {
  const which = normalizeWhich(opts?.which);
  const manifest = await fetchManifest(which);
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
    const fhNum = toFhNumber(f.fh);
    const pack = fhNum == null ? null : byFH.get(fhNum);
    return {
      fh: fhNum ?? f.fh,
      existsOnServer: !!f.exists,
      validTimeUnix: f.validTimeUnix,
      hasBlob: !!pack,
    };
  });

  return {
    model,
    run,
    runId,
    which,
    forecasts: enriched,
  };
}

export async function syncLatestWindpacksWindowed() {
  const manifest = await fetchManifest('latest');
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
      if (cfg.debugWind) console.warn('[wind] erreur download FH', f.fh, err);
    }
  }

  // Si tous les FH de la fenêtre existent côté serveur ET sont en DB → allComplete = true
  // Sinon → allComplete = false (robot 2 min continuera de réessayer)
  await ensurePreviousRunFh09and12(model);
  await cleanupOldRuns(model);

  if (cfg.debugWind) {
    console.log('[wind] syncLatestWindpacksWindowed', {
      model, runId, count: windowForecasts.length, downloaded, allComplete
    });
  }

  return { model, run, runId, count: windowForecasts.length, downloaded, allComplete };
}
