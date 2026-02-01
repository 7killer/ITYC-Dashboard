// windy-layer-worker.js
import { parseWindpack, unixToRefTimeString } from './windpackClient.js';

self.onmessage = async (e) => {
  const { data } = e;

  // Transform entre deux snapshots (déjà fourni par ta WindyDataProxy.interpolateData)
/*  if (data.from_data && data.to_data) {
    const transform_options = WindyDataProxy.interpolateData(data.from_data, data.to_data);
    self.postMessage({ transform_options });
    return;
  }
*/
  if (data.data_uri) {
    try {
      const fetched = await fetchAnyWindData(data.data_uri);
      console.log('Worker fetched windpack', data.data_uri, fetched && fetched.header);
      self.postMessage({
        fetched_data: fetched,
        transform: data.transform,
        dtg: data.data_uri,
      });
    } catch (err) {
      console.error('Worker fetch error:', err);
      self.postMessage({
        fetched_data: {},
        transform: data.transform,
        dtg: data.data_uri,
      });
    }
  }
};

async function fetchAnyWindData(uri) {
  const isWindpack = uri.endsWith('.wpack') || uri.endsWith('.wpack.gz') || uri.includes('/api/gfs0p25/file/');

  if (isWindpack) {
    // On suppose que uri est une URL absolue ou relative vers ton API
    const res = await fetch(uri);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${uri}`);

    if (res.body && typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('gzip');
      const decompressed = res.body.pipeThrough(ds);
      const ab = await new Response(decompressed).arrayBuffer();
      return parseWindpack(ab);
    } else {
      // si déjà décompressé par le proxy (pas de Content-Encoding: gzip)
      const ab = await res.arrayBuffer();
      return parseWindpack(ab);
    }
  }

  // Fallback JSON pour compat / debug
  const res = await fetch(uri);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${uri}`);
  return res.json();
}

