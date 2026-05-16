// polarEngine.js
//
// Moteur de calcul polaire optimisé & réutilisable.
// - Pas de DOM
// - Cache par TWS
// - Étape TWA configurable (par défaut 0.5°)
// - Sortie compacte (max, VMG, état courant, spikes, etc.)

import { getSpeeds } from './utils.js';
import { roundTo } from '../common/utils.js';

// Résolution angulaire (tu peux passer à 0.25 si tu veux plus fin)
const DEFAULT_TWA_STEP = 0.1;
const DEFAULT_TWS_STEP = 0.1;

// Cache des "slices" polaires par TWS
// key = TWS arrondi à 0.5 nds
const twsCache = new Map();
const twaCache = new Map();
const bestVmgCurveCache = new Map();
const polarObjectIds = new WeakMap();
let nextPolarObjectId = 1;

function getOptionsCacheKey(options) {
  if (!options) return '';
  return Object.keys(options)
    .sort()
    .map((key) => `${key}:${options[key] ? 1 : 0}`)
    .join('|');
}

function getPolarCacheKey(boatPolars) {
  if (boatPolars && !polarObjectIds.has(boatPolars)) {
    polarObjectIds.set(boatPolars, nextPolarObjectId++);
  }

  return [
    boatPolars ? polarObjectIds.get(boatPolars) : '',
    boatPolars?._id ?? boatPolars?.id ?? '',
    boatPolars?._updatedAt ?? '',
    boatPolars?.label ?? '',
    boatPolars?.globalSpeedRatio ?? ''
  ].join('|');
}

export function computeBestVmgTwaCurve(
  raceId,
  options,
  boatPolars,
  twsStep = DEFAULT_TWS_STEP,
  twaStep = DEFAULT_TWA_STEP
) {
  if (!boatPolars) return { tws: [], upwindTwa: [], downwindTwa: [], upwindSail: [], downwindSail: [] };

  const cacheKey = [
    raceId ?? '',
    getPolarCacheKey(boatPolars),
    getOptionsCacheKey(options),
    twsStep,
    twaStep
  ].join('::');
  const cached = bestVmgCurveCache.get(cacheKey);
  if (cached) return cached;

  const curve = {
    tws: [],
    upwindTwa: [],
    downwindTwa: [],
    upwindSail: [],
    downwindSail: []
  };

  for (let tws = 0.5; tws <= 45 + 1e-9; tws += twsStep) {
    const twsKey = Number(roundTo(tws, 1));
    let bestUpVmg = -Infinity;
    let bestDownVmg = Infinity;
    let bestUpTwa = 0;
    let bestDownTwa = 0;
    let bestUpSail = 0;
    let bestDownSail = 0;

    for (let twa = 0; twa <= 180 + 1e-9; twa += twaStep) {
      const twaKey = Number(roundTo(twa, 1));
      const res = getSpeeds(boatPolars, options, twsKey, twaKey);
      const vmg = res?.best?.vmg;
      if (!Number.isFinite(vmg)) continue;

      if (vmg > bestUpVmg) {
        bestUpVmg = vmg;
        bestUpTwa = twaKey;
        bestUpSail = res.best.sail;
      }
      if (vmg < bestDownVmg) {
        bestDownVmg = vmg;
        bestDownTwa = twaKey;
        bestDownSail = res.best.sail;
      }
    }

    curve.tws.push(twsKey);
    curve.upwindTwa.push(bestUpTwa);
    curve.downwindTwa.push(bestDownTwa);
    curve.upwindSail.push(bestUpSail);
    curve.downwindSail.push(bestDownSail);
  }

  bestVmgCurveCache.set(cacheKey, curve);
  return curve;
}

/**
 * Calcule / récupère une "slice" polaire pour un TWS donné.
 * La slice contient tous les TWA (0 → 180° par pas twaStep).
 */
function ensureTwsSlice({ tws, twd, cog, options, boatPolars, twaStep = DEFAULT_TWA_STEP }) {
  const key = Number(roundTo(tws, 1)); // 0.1 près, suffisant pour la clé
  let slice = twsCache.get(key);

  // Si inexistante ou contexte différent → on recalcule
  if (
    !slice ||
    slice.twd !== twd ||
    slice.cog !== cog ||
    slice.options !== options ||
    slice.boatPolars !== boatPolars ||
    slice.twaStep !== twaStep
  ) {
    slice = buildTwsSlice({ tws: key, twd, cog, options, boatPolars, twaStep });
    twsCache.set(key, slice);
  }

  return slice;
}

/**
 * Construit la slice polaire pour un TWS : grille TWA -> speeds, max, VMG, dérivées…
 */
function buildTwsSlice({ tws, twd, cog, options, boatPolars, twaStep }) {
  const polarsData = {};          // key: TWA (nombre), value: { best, all }
  const derivativesSpeed = [];    // dérivées successives de speed
  const derivativesVmg = [];
  const derivativesVmc = [];

  const bestVMG = {
    upwind: { twa: 0, vmg: 0 },
    downwind: { twa: 0, vmg: 0 }
  };

  const max = { twa: 0, speed: 0, sail: 0 };
  let maxFoilFactor = 1;

  // 1) boucle TWA
  const twaKeys = [];
  for (let twa = 0; twa <= 180 + 1e-9; twa += twaStep) {
    const twaKey = Number(roundTo(twa, 1));
    twaKeys.push(twaKey);

    const res = getSpeeds(boatPolars, options, tws, twaKey);

    // VMC
    let hdg = twd - twaKey;
    if (hdg < 0) hdg += 360;
    else if (hdg > 360) hdg -= 360;

    const vmc = cog!==undefined?(res.best.speed * Math.cos((hdg - cog) * (Math.PI / 180))):0;
    res.best.vmc = vmc;

    polarsData[twaKey] = res;

    // Max speed
    if (res.best.speed > max.speed) {
      max.speed = res.best.speed;
      max.twa = twaKey;
      max.sail = res.best.sail;
    }

    // VMG best up/down
    if (res.best.vmg > bestVMG.upwind.vmg) {
      bestVMG.upwind.vmg = res.best.vmg;
      bestVMG.upwind.twa = twaKey;
    } else if (res.best.vmg <= bestVMG.downwind.vmg) {
      bestVMG.downwind.vmg = res.best.vmg;
      bestVMG.downwind.twa = twaKey;
    }

    if (res.best.foilFactor > maxFoilFactor) {
      maxFoilFactor = res.best.foilFactor;
    }
  }

  // Normalisation VMG
  bestVMG.upwind.vmg = Math.round(bestVMG.upwind.vmg * 10000) / 10000;
  bestVMG.downwind.vmg = Math.round(bestVMG.downwind.vmg * 10000) / 10000;

  // 2) dérivées par rapport au TWA (pour les spikes)
  for (let i = 1; i < twaKeys.length; i++) {
    const tPrev = twaKeys[i - 1];
    const tCurr = twaKeys[i];
    const pPrev = polarsData[tPrev].best;
    const pCurr = polarsData[tCurr].best;

    derivativesSpeed.push(pCurr.speed - pPrev.speed);
    derivativesVmg.push(pCurr.vmg - pPrev.vmg);
    derivativesVmc.push(pCurr.vmc - pPrev.vmc);
  }

  return {
    tws,
    twd,
    cog,
    options,
    boatPolars,
    twaStep,
    twaKeys,
    polarsData,
    derivativesSpeed,
    derivativesVmg,
    derivativesVmc,
    bestVMG,
    max,
    maxFoilFactor
  };
}
/**
 * Calcule / récupère une "slice" polaire pour un TWS donné.
 * La slice contient tous les TWA (0 → 180° par pas twaStep).
 */
function ensureTwaSlice({ twa, twd, cog, options, boatPolars, twsStep = DEFAULT_TWS_STEP }) {
  const key = Number(roundTo(twa, 1)); // 0.1 près, suffisant pour la clé
  let slice = twaCache.get(key);


  // Si inexistante ou contexte différent → on recalcule
  if (
    !slice ||
    slice.options !== options ||
    slice.boatPolars !== boatPolars ||
    slice.twsStep !== twsStep
  ) {
    slice = buildTwaSlice({ twa: key, twd, options, boatPolars, twsStep });
    twaCache.set(key, slice);
  }

  return slice;
}

/**
 * Construit la slice polaire pour un TWA : grille TWS -> speeds, max, VMG, dérivées…
 */
function buildTwaSlice({ twa, options, boatPolars, twsStep }) {
  const polarsDataTWA = {};          // key: TWA (nombre), value: { best, all }
  const derivativesSpeed = [];    // dérivées successives de speed

  const bestVMG = {
    upwind: { twa: 0, vmg: 0 },
    downwind: { twa: 0, vmg: 0 }
  };

  const max = { twa: 0, speed: 0, sail: 0 };

  // 1) boucle TWS
  const twsKeys = [];
  for (let tws = 0.5; tws <= 45 + 1e-9; tws += twsStep) {
    const twsKey = Number(roundTo(tws, 1));
    twsKeys.push(twsKey);

    const res = getSpeeds(boatPolars, options,twsKey , twa);

    polarsDataTWA[twsKey] = res;

    // Max speed
    if (res.best.speed > max.speed) {
      max.speed = res.best.speed;
      max.twa = twsKey;
      max.sail = res.best.sail;
    }
  }

  // 2) dérivées par rapport au TWA (pour les spikes)
  for (let i = 1; i < twsKeys.length; i++) {
    const tPrev = twsKeys[i - 1];
    const tCurr = twsKeys[i];
    const pPrev = polarsDataTWA[tPrev].best;
    const pCurr = polarsDataTWA[tCurr].best;

    derivativesSpeed.push(pCurr.speed - pPrev.speed);
  }

  return {
    twa,
    options,
    boatPolars,
    twsStep,
    twsKeys,
    polarsDataTWA,
    derivativesSpeed,
  };
}

/**
 * Détection des "spikes" (pics/creux) dans une série de dérivées.
 */
function computeSpikes(polarsData, twaKeys, derivatives, sensitivity, mode = 'speed') {
  const spikes = [];

  for (let i = 1; i < derivatives.length; i++) {
    const dPrev = derivatives[i - 1];
    const dCurr = derivatives[i];
    const delta = Math.abs(dCurr - dPrev);

    if (delta <= sensitivity) continue;

    let type = '';

    if (Math.sign(dCurr) === Math.sign(dPrev)) {
      // même signe
      if (Math.sign(dCurr) > 0) {
        // pente positive
        if (Math.abs(dPrev) < Math.abs(dCurr)) type = 'hole';
        else if (Math.abs(dPrev) > Math.abs(dCurr)) type = 'sum';
      } else {
        // pente négative
        if (Math.abs(dPrev) < Math.abs(dCurr)) type = 'sum';
        else if (Math.abs(dPrev) > Math.abs(dCurr)) type = 'hole';
      }
    } else if (Math.sign(dPrev) > 0 && Math.sign(dCurr) <= 0) {
      type = 'sum';
    } else if (Math.sign(dPrev) < 0 && Math.sign(dCurr) >= 0) {
      type = 'hole';
    } else if (Math.sign(dPrev) === 0) {
      if (Math.sign(dCurr) > 0) type = 'hole';
      else if (Math.sign(dCurr) < 0) type = 'sum';
    }

    const twa = twaKeys[i]; // on associe le spike au point "courant"
    const best = polarsData[twa].best;

    let baseVal = 0;
    if (mode === 'speed' || mode === 'twa') baseVal = best.speed;
    else if (mode === 'vmg') baseVal = best.vmg;
    else if (mode === 'vmc') baseVal = best.vmc;

    if (baseVal < 0) {
      type = type === 'sum' ? 'hole' : 'sum';
    }

    spikes.push({
      idx: twa,
      speed: baseVal,
      sail: best.sail,
      type
    });
  }

  return spikes;
}

/**
 * Calcule l’état polaire complet pour un TWS/TWA donné.
 *
 * @param {Object} params
 *  - twa, tws, twd, cog, raceId, options, boatPolars
 *  - spikeSensitivity: seuil des spikes (0.001 ~ 0.005)
 *  - twaStep: pas angulaire TWA (0.5 par défaut)
 *
 * @returns {Object} state
 *  {
 *    tws, twa, twaKey,
 *    max, bestVMG, maxFoilFactor,
 *    polarsData,
 *    current: { speed, vmg, bestSail, foilFactor, foilRate, bestSailTWAMin, bestSailTWAMax, ... },
 *    spikesSpeed, spikesVmg, spikesVmc
 *  }
 */
export function computePolarState(
  twa,
  tws,
  twd,
  cog,
  raceId,
  options,
  boatPolars,
  spikeSensitivity = 0.002,
  twaStep = DEFAULT_TWA_STEP,
  twsStep = DEFAULT_TWS_STEP
) {
      console.groupCollapsed(`[computePolarState] receive param`);
    console.log("→ raceId :",   raceId);
    console.log("→ options :", options);
    console.log("→ polar :", boatPolars);
    console.log("→ twa :", twa);
    console.log("→ tws :", tws);
    console.log("→ twd :", twd);
    console.log("→ cog :", cog);
    console.groupEnd();

  if (!boatPolars) throw new Error('computePolarState: boatPolars manquant');
  if (!raceId) throw new Error('computePolarState: raceId manquant');

  // Normalisation entrées
  const twsI = Number(roundTo(tws, 2));
  const twaI = Math.abs(Number(roundTo(twa, 2)));
  
  if(twaI == undefined || twaI == null)
    twa = 90;
  else if (twaI < 0) twa = 0;
  else if (twaI > 180) twa = 180;
  else twa = twaI;

  if(twsI == undefined || twsI == null)
    tws = 10;
  else if (twsI < 0.5) tws = 0.5;
  else if (twsI > 45) tws = 45;
  else tws = twsI;
  
  const slice = ensureTwsSlice({ tws, twd, cog, options, boatPolars, twaStep });
  const twaKey = snapToGrid(twa, slice.twaStep);
  const base = slice.polarsData[twaKey];
  if (!base) {
    
    // Pas de point exactement à twaKey → on s'aligne sur 0° pour éviter le crash
    // (cas très rare si twa hors [0..180])
    const fallbackKey = slice.twaKeys[0];
    return computePolarState(
      fallbackKey,
      tws,
      twd,
      cog,
      raceId,
      options,
      boatPolars,
      spikeSensitivity,
      twaStep,
      twsStep
    );
  }

  const slice2 = ensureTwaSlice({ twa, options, boatPolars, twsStep });
  const twsKey = snapToGrid(tws, slice2.twsStep);
  const base2 = slice2.polarsDataTWA[twsKey];
  if (!base2) {
    // Pas de point exactement à twaKey → on s'aligne sur 0° pour éviter le crash
    // (cas très rare si twa hors [0..180])
    const fallbackKey = slice2.twsKeys[0];
    return computePolarState(
      twa,
      fallbackKey,
      twd,
      cog,
      raceId,
      options,
      boatPolars,
      spikeSensitivity,
      twaStep,
      twsStep
    );
  }  

  // État courant (au TWA demandé)
  const current = {
    speed: base.best.speed,
    vmg: Math.abs(base.best.vmg),
    bestSail: base.best.sail,
    foilFactor: base.best.foilFactor,
    foilRate: base.best.foilRate,
    bestSailTWAMin: 0,
    bestSailTWAMax: 0,
    __twa: twaKey,
    __tws: tws,
    __twd: twd,
    __cog: cog,
    __raceId: raceId,
    __options: options,
    __spikeSensitivity: spikeSensitivity
  };

  // Détermine les bornes TWA min/max où la voile actuelle reste "dans le coup"
  const sailRange = computeSailTwaRange(slice.polarsData, boatPolars, options, base.best.sail, slice.twaKeys);
  current.bestSailTWAMin = sailRange.min;
  current.bestSailTWAMax = sailRange.max;

  // Spikes
  const spikesSpeed = computeSpikes(
    slice.polarsData,
    slice.twaKeys,
    slice.derivativesSpeed,
    spikeSensitivity,
    'speed'
  );
  const spikesVmg = computeSpikes(
    slice.polarsData,
    slice.twaKeys,
    slice.derivativesVmg,
    spikeSensitivity,
    'vmg'
  );
  const spikesVmc = computeSpikes(
    slice.polarsData,
    slice.twaKeys,
    slice.derivativesVmc,
    spikeSensitivity,
    'vmc'
  );
  const spikesTws = computeSpikes(
    slice2.polarsDataTWA,
    slice2.twsKeys,
    slice2.derivativesSpeed,
    spikeSensitivity,
    'tws'
  );
  current.spikes = spikesSpeed;

  // VMG downwind est négatif dans les polaires → on stocke sa valeur absolue comme dans ton code
  const bestVMG = {
    upwind: { ...slice.bestVMG.upwind },
    downwind: {
      twa: slice.bestVMG.downwind.twa,
      vmg: Math.abs(slice.bestVMG.downwind.vmg)
    }
  };

  return {
    tws,
    twa,
    twaKey,
    twsKey,
    twd,
    cog,
    raceId,
    options,
    boatPolars,

    polarsData: slice.polarsData,           // équivalent _polarsData
    polarsDataTWA : slice2.polarsDataTWA,
    max: slice.max,                         // équivalent _currentResultset.max
    bestVMG,                                // équivalent _currentResultset.bestVMG
    maxFoilFactor: slice.maxFoilFactor,     // équivalent _maxFoilFactor
    current,                                // équivalent _currentResultset.current
    sailsSpeeds: slice.polarsData[twaKey].all,
    spikesSpeed,
    spikesVmg,
    spikesVmc,
    spikesTws
  };
}

/**
 * Bornes TWA min/max pour lesquelles la voile courante reste valable.
 * (approximation de ta logique d’origine)
 */
function computeSailTwaRange(polarsData, boatPolars, options, sailId, twaKeys) {
  let min = null;
  let max = null;

  for (const twa of twaKeys) {
    const data = polarsData[twa];
    if (!data || !data.all) continue;

    const speedSail = data.all[sailId];
    const best = data.best;

    if (speedSail == null) continue;

    // Même logique que dans ton file : voile actuelle "OK" si <= 1.4% plus lente que la meilleure
    const inRange =
      (speedSail * 1.014 > best.speed && best.sail !== sailId) ||
      (speedSail >= best.speed && best.sail === sailId);

    if (!inRange) continue;

    if (min === null || twa < min) min = twa;
    if (max === null || twa > max) max = twa;
  }

  return {
    min: min ?? 0,
    max: max ?? 180
  };
}

function snapToGrid(value, step) {
  return Number((Math.round(value / step) * step).toFixed(1));
}
