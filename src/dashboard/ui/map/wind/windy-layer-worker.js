// windy-layer-worker.js
import { parseWindpack, unixToRefTimeString } from './windpackClient.js';

self.onmessage = async (e) => {
  const data = e.data || {};

  try {
    // Mode interpolation entre deux fichiers windpack
    if (data.mode === 'interpolate' && data.urlPrev && data.urlNext && data.nowUnix) {
      const { urlPrev, urlNext, nowUnix, dtg } = data;
      const interpolated = await handleInterpolate(urlPrev, urlNext, nowUnix);
      self.postMessage({
        fetched_data: interpolated,
        transform: false,
        dtg: dtg || urlNext,
      });
      return;
    }

    // Mode "simple" : charger un seul fichier (compat avec goto_dtg)
    if (data.data_uri) {
      const fetched = await fetchAnyWindData(data.data_uri);
      self.postMessage({
        fetched_data: fetched,
        transform: data.transform,
        dtg: data.data_uri,
      });
      return;
    }

    // (Optionnel) mode interpolation ancienne via from_data/to_data → pour l’instant inutile
    if (data.from_data && data.to_data) {
      const transform_options = interpolateSnapshots(data.from_data, data.to_data, 0.5);
      self.postMessage({ transform_options });
      return;
    }
  } catch (err) {
    console.error('Wind worker error:', err);
    // on renvoie un snapshot vide pour éviter de tout casser côté main
    self.postMessage({
      fetched_data: {},
      transform: false,
      dtg: data.dtg || null,
    });
  }
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

async function handleInterpolate(urlPrev, urlNext, nowUnix) {
  // Charge les deux snapshots windpack
  const [snapPrev, snapNext] = await Promise.all([
    fetchAnyWindData(urlPrev),
    fetchAnyWindData(urlNext),
  ]);
    const tPrev = snapPrev.header.validTimeUnix;
  const tNext = snapNext.header.validTimeUnix;

  let alpha = 0;
  if (tNext > tPrev) {
    alpha = (nowUnix - tPrev) / (tNext - tPrev);
  }
  alpha = Math.min(1, Math.max(0, alpha));
  console.group('[WORKER WINDPACK]');

  console.log('Prev file:', urlPrev);
  console.log('Next file:', urlNext);

  console.log('Prev validTime:',
    new Date(snapPrev.header.validTimeUnix * 1000).toISOString()
  );

  console.log('Next validTime:',
    new Date(snapNext.header.validTimeUnix * 1000).toISOString()
  );

  console.log('Now (UTC):',
    new Date(nowUnix * 1000).toISOString()
  );

  console.log('Alpha:', alpha.toFixed(3));

  console.groupEnd();
  const result = interpolateSnapshots(snapPrev, snapNext, alpha);

  console.log(
    "[WORKER RESULT]",
    "Interpolated validTime:",
    new Date(result.header.validTimeUnix * 1000).toISOString()
  );

  return result;
  }

async function fetchAnyWindData(uri) {
  const isWindpack =
    uri.endsWith('.wpack') ||
    uri.endsWith('.wpack.gz') ||
    uri.includes('/api/gfs0p25/file/') ||
    uri.startsWith('blob:');

  const res = await fetch(uri);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${uri}`);
  }

  if (isWindpack) {
    // DecompressionStream dispo dans les workers MV3
    if (res.body && typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('gzip');
      const decompressed = res.body.pipeThrough(ds);
      const ab = await new Response(decompressed).arrayBuffer();
      return parseWindpack(ab);
    } else {
      // Si ton reverse proxy décompresse déjà
      const ab = await res.arrayBuffer();
      return parseWindpack(ab);
    }
  }

  // Fallback JSON (ancien mode du plugin)
  return res.json();
}

function interpolateSnapshots(a, b, alpha) {
  if (!a || !b) return a || b;

  const uA = a.data && a.data[0];
  const vA = a.data && a.data[1];
  const uB = b.data && b.data[0];
  const vB = b.data && b.data[1];

  if (!uA || !vA || !uB || !vB) {
    console.warn('Snapshots incomplets pour interpolation, fallback sur a');
    return a;
  }
  if (uA.length !== uB.length || vA.length !== vB.length) {
    console.warn('Taille U/V différente entre snapshots, fallback sur a');
    return a;
  }

  const len = uA.length;
  const uOut = new Float32Array(len);
  const vOut = new Float32Array(len);
  const t = Math.min(1, Math.max(0, alpha));

  for (let i = 0; i < len; i++) {
    const uf = uA[i], vf = vA[i];
    const ut = uB[i], vt = vB[i];
    uOut[i] = uf + (ut - uf) * t;
    vOut[i] = vf + (vt - vf) * t;
  }

  const header = { ...a.header };
  const midUnix = Math.round(
    a.header.validTimeUnix +
    (b.header.validTimeUnix - a.header.validTimeUnix) * t
  );

  header.validTimeUnix = midUnix;
  header.refTime = unixToRefTimeString(midUnix);

  return {
    header,
    data: [uOut, vOut],
    meta: a.meta || {},
  };
}
