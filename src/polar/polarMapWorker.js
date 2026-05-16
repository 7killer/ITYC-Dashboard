import { buildPolarMapData } from './polarMap.js';
import { computeBestVmgTwaCurve } from './bestVmgCurve.js';

const mapCache = new Map();
const bestVmgCache = new Map();

function optionsKey(options) {
  if (!options) return '';
  return Object.keys(options)
    .sort()
    .map((key) => `${key}:${options[key] ? 1 : 0}`)
    .join('|');
}

function polarKey(polar) {
  return [
    polar?._id ?? polar?.id ?? '',
    polar?._updatedAt ?? '',
    polar?.label ?? '',
    polar?.globalSpeedRatio ?? '',
  ].join('|');
}

function configKey(config) {
  return Object.keys(config ?? {})
    .sort()
    .map((key) => `${key}:${config[key]}`)
    .join('|');
}

self.onmessage = (event) => {
  const message = event.data;
  if (message?.type !== 'buildPolarMap' && message?.type !== 'buildBestVmgCurve') return;

  try {
    const key = [
      message.raceId ?? '',
      polarKey(message.boatPolars),
      optionsKey(message.options),
      configKey(message.config),
    ].join('::');

    if (message.type === 'buildBestVmgCurve') {
      const cached = bestVmgCache.get(key);
      if (cached) {
        self.postMessage({ type: 'bestVmgCurveReady', requestId: message.requestId, data: cached });
        return;
      }

      const data = computeBestVmgTwaCurve(
        message.raceId,
        message.options,
        message.boatPolars,
        message.config?.twsStep,
        message.config?.twaStep
      );

      bestVmgCache.set(key, data);
      self.postMessage({ type: 'bestVmgCurveReady', requestId: message.requestId, data });
      return;
    }

    const cached = mapCache.get(key);
    if (cached) {
      self.postMessage({ type: 'polarMapReady', requestId: message.requestId, data: cached });
      return;
    }

    const data = buildPolarMapData({
      raceId: message.raceId,
      options: message.options,
      boatPolars: message.boatPolars,
      config: message.config,
    });

    mapCache.set(key, data);
    self.postMessage({ type: 'polarMapReady', requestId: message.requestId, data });
  } catch (error) {
    self.postMessage({
      type: message?.type === 'buildBestVmgCurve' ? 'bestVmgCurveError' : 'polarMapError',
      requestId: message?.requestId,
      error: error?.message || String(error),
    });
  }
};
