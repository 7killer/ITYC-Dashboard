// windy-layer-worker.js
import { parseWindpack, unixToRefTimeString } from './windpackClient.js';

const windpackCache = new Map();

function isWindpackUri(uri) {
  return (
    uri.endsWith('.wpack') ||
    uri.endsWith('.wpack.gz') ||
    uri.includes('/api/gfs0p25/file/') ||
    uri.startsWith('blob:')
  );
}

self.onmessage = async (e) => {
  const data = e.data || {};
  const requestStart = performance.now();

  try {
    if (data.mode === 'interpolate' && data.urlPrev && data.urlNext && data.nowUnix) {
      const { urlPrev, urlNext, nowUnix, dtg } = data;
      const interpolated = await handleInterpolate(urlPrev, urlNext, nowUnix, data.bounds);
      postWindResult({
        fetched_data: interpolated,
        autoMinKts: interpolated.autoMinKts,
        autoMaxKts: interpolated.autoMaxKts,
        timing: data.debugWind2 ? finishTiming(interpolated.timing, requestStart) : null,
        transferData: true,
        dtg: dtg || urlNext,
      });
      return;
    }

    if (data.data_uri) {
      const timing = {};
      const fetched = await fetchAnyWindData(data.data_uri, timing);
      const tMax0 = performance.now();
      const range = computeAutoRangeKts(fetched, data.bounds);
      timing.maxMs = performance.now() - tMax0;
      postWindResult({
        fetched_data: fetched,
        autoMinKts: range?.autoMinKts,
        autoMaxKts: range?.autoMaxKts,
        timing: data.debugWind2 ? finishTiming(timing, requestStart) : null,
        dtg: data.data_uri,
      });
      return;
    }

    if (data.from_data && data.to_data) {
      const transform_options = interpolateSnapshots(data.from_data, data.to_data, 0.5);
      self.postMessage({ transform_options });
      return;
    }
  } catch (err) {
    console.error('Wind worker error:', err);
    postWindResult({
      fetched_data: {},
      dtg: data.dtg || null,
    });
  }
};

async function handleInterpolate(urlPrev, urlNext, nowUnix, bounds = null) {
  const timing = {};
  const tFetch0 = performance.now();
  const [snapPrev, snapNext] = await Promise.all([
    fetchAnyWindData(urlPrev),
    fetchAnyWindData(urlNext),
  ]);
  timing.fetchPairMs = performance.now() - tFetch0;

  const tPrev = snapPrev.header.validTimeUnix;
  const tNext = snapNext.header.validTimeUnix;

  let alpha = 0;
  if (tNext > tPrev) {
    alpha = (nowUnix - tPrev) / (tNext - tPrev);
  }
  alpha = Math.min(1, Math.max(0, alpha));

  const tInterp0 = performance.now();
  const result = interpolateSnapshots(snapPrev, snapNext, alpha);
  const range = computeAutoRangeKts(result, bounds);
  if (range) {
    result.autoMinKts = range.autoMinKts;
    result.autoMaxKts = range.autoMaxKts;
  }
  timing.interpolateMs = performance.now() - tInterp0;
  timing.alpha = Number(alpha.toFixed(4));
  timing.points = result?.data?.[0]?.length || 0;
  result.timing = timing;
  return result;
}

async function fetchAnyWindData(uri, timing = null) {
  if (isWindpackUri(uri)) {
    const cached = windpackCache.get(uri);
    if (cached) {
      if (timing) timing.cacheHit = true;
      return cached;
    }
    if (timing) timing.cacheHit = false;

    const tFetch0 = performance.now();
    const res = await fetch(uri);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${uri}`);
    }
    if (timing) timing.fetchMs = performance.now() - tFetch0;

    let snap;
    if (res.body && typeof DecompressionStream !== 'undefined') {
      const tParse0 = performance.now();
      const ds = new DecompressionStream('gzip');
      const decompressed = res.body.pipeThrough(ds);
      const ab = await new Response(decompressed).arrayBuffer();
      snap = parseWindpack(ab);
      if (timing) timing.decompressParseMs = performance.now() - tParse0;
    } else {
      const tParse0 = performance.now();
      const ab = await res.arrayBuffer();
      snap = parseWindpack(ab);
      if (timing) timing.decompressParseMs = performance.now() - tParse0;
    }

    windpackCache.set(uri, snap);
    return snap;
  }

  const res = await fetch(uri);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${uri}`);
  }
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
    console.warn('Taille U/V differente entre snapshots, fallback sur a');
    return a;
  }

  const len = uA.length;
  const uOut = new Float32Array(len);
  const vOut = new Float32Array(len);
  const t = Math.min(1, Math.max(0, alpha));
  let maxMs = 0;

  for (let i = 0; i < len; i++) {
    const uf = uA[i], vf = vA[i];
    const ut = uB[i], vt = vB[i];
    const u = uf + (ut - uf) * t;
    const v = vf + (vt - vf) * t;
    uOut[i] = u;
    vOut[i] = v;

    if (u != null && v != null) {
      const speed = Math.sqrt(u * u + v * v);
      if (speed > maxMs) maxMs = speed;
    }
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
    autoMaxKts: Math.max(10, Math.round(maxMs * 1.943844)),
  };
}

function computeAutoRangeKts(snapshot, bounds = null) {
  const u = snapshot?.data?.[0];
  const v = snapshot?.data?.[1];
  if (!u || !v) return null;

  const header = snapshot.header || {};
  const nx = header.nx || 0;
  const ny = header.ny || 0;
  const lo1 = header.lo1 || 0;
  const la1 = header.la1 || 0;
  const dx = header.dx || 0;
  const dy = header.dy || 0;
  const useBounds = bounds && nx && ny && Number.isFinite(dx) && Number.isFinite(dy);

  let minMs = Infinity;
  let maxMs = 0;
  const len = Math.min(u.length, v.length);
  for (let i = 0; i < len; i++) {
    if (useBounds) {
      const j = Math.floor(i / nx);
      const col = i - j * nx;
      if (j < 0 || j >= ny) continue;
      const lat = la1 - j * dy;
      const lon = lo1 + col * dx;
      const lonNorm = lon > 180 ? lon - 360 : lon;
      if (lat < bounds.south || lat > bounds.north) continue;
      if (!isLonInBounds(lonNorm, bounds.west, bounds.east)) continue;
    }

    const uu = u[i];
    const vv = v[i];
    if (uu == null || vv == null) continue;
    const speed = Math.sqrt(uu * uu + vv * vv);
    if (speed < minMs) minMs = speed;
    if (speed > maxMs) maxMs = speed;
  }

  if (!Number.isFinite(minMs)) return null;
  const minKts = Math.max(0, minMs * 1.943844);
  const maxKts = Math.max(minKts + 0.1, maxMs * 1.943844);
  return {
    autoMinKts: Number(minKts.toFixed(2)),
    autoMaxKts: Number(maxKts.toFixed(2)),
  };
}

function isLonInBounds(lon, west, east) {
  if (west <= east) return lon >= west && lon <= east;
  return lon >= west || lon <= east;
}

function postWindResult(message) {
  const tPost0 = performance.now();
  const u = message?.fetched_data?.data?.[0];
  const v = message?.fetched_data?.data?.[1];
  const transfer = [];

  if (message.transferData && u instanceof Float32Array && v instanceof Float32Array) {
    transfer.push(u.buffer, v.buffer);
  }
  delete message.transferData;

  if (message.timing) {
    message.timing.transfer = transfer.length;
  }

  if (transfer.length) {
    self.postMessage(message, transfer);
  } else {
    self.postMessage(message);
  }

  if (message.timing) {
    message.timing.postCallMs = Number((performance.now() - tPost0).toFixed(1));
  }
}

function finishTiming(timing, requestStart) {
  if (!timing) return null;
  return {
    totalWorkerMs: Number((performance.now() - requestStart).toFixed(1)),
    fetchPairMs: timing.fetchPairMs != null ? Number(timing.fetchPairMs.toFixed(1)) : undefined,
    fetchMs: timing.fetchMs != null ? Number(timing.fetchMs.toFixed(1)) : undefined,
    decompressParseMs: timing.decompressParseMs != null ? Number(timing.decompressParseMs.toFixed(1)) : undefined,
    interpolateMs: timing.interpolateMs != null ? Number(timing.interpolateMs.toFixed(1)) : undefined,
    maxMs: timing.maxMs != null ? Number(timing.maxMs.toFixed(1)) : undefined,
    alpha: timing.alpha,
    points: timing.points,
    cacheHit: timing.cacheHit,
  };
}
