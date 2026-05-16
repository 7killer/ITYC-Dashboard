import { getSpeeds } from './utils.js';
import { roundTo } from '../common/utils.js';

const DEFAULT_TWA_STEP = 0.1;
const DEFAULT_TWS_STEP = 0.1;

const bestVmgCurveCache = new Map();

function getOptionsCacheKey(options) {
  if (!options) return '';
  return Object.keys(options)
    .sort()
    .map((key) => `${key}:${options[key] ? 1 : 0}`)
    .join('|');
}

function getPolarCacheKey(boatPolars) {
  return [
    boatPolars?._id ?? boatPolars?.id ?? '',
    boatPolars?._updatedAt ?? '',
    boatPolars?.label ?? '',
    boatPolars?.globalSpeedRatio ?? '',
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
    twaStep,
  ].join('::');
  const cached = bestVmgCurveCache.get(cacheKey);
  if (cached) return cached;

  const curve = {
    tws: [],
    upwindTwa: [],
    downwindTwa: [],
    upwindSail: [],
    downwindSail: [],
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
