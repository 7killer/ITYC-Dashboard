// windpackClient.js
// Lecture du format WPK1 v1 généré côté serveur

export function parseWindpack(arrayBuffer) {
  const dv = new DataView(arrayBuffer);

  // Magic "WPK1"
  const magic =
    String.fromCharCode(dv.getUint8(0)) +
    String.fromCharCode(dv.getUint8(1)) +
    String.fromCharCode(dv.getUint8(2)) +
    String.fromCharCode(dv.getUint8(3));

  if (magic !== 'WPK1') {
    throw new Error('Invalid windpack magic: ' + magic);
  }

  const version = dv.getUint16(4, true);
  if (version !== 1) {
    throw new Error('Unsupported windpack version: ' + version);
  }

  const flags = dv.getUint16(6, true);
  const hasU = !!(flags & 1);
  const hasV = !!(flags & 2);
  const hasTmp = !!(flags & 4);

  const nx = dv.getUint32(8, true);
  const ny = dv.getUint32(12, true);

  const lo1 = dv.getFloat64(16, true);
  const la1 = dv.getFloat64(24, true);
  const dx  = dv.getFloat64(32, true);
  const dy  = dv.getFloat64(40, true);

  const scanningMode  = dv.getUint32(48, true);
  const refTimeUnix   = dv.getUint32(52, true);
  const validTimeUnix = dv.getUint32(56, true);
  // 60..75 reserved

  const n = nx * ny;
  const headerLen = 76;

  let offset = headerLen;

  function readField(present) {
    if (!present) return null;
    const byteLength = n * 4; // float32
    const sub = arrayBuffer.slice(offset, offset + byteLength);
    offset += byteLength;
    return new Float32Array(sub);
  }

  const u = readField(hasU);
  const v = readField(hasV);
  const tmp = readField(hasTmp);

  if (!u || !v) {
    throw new Error('Windpack missing U and/or V field');
  }

  const header = {
    // Pour WindyDataProxy.interpolateData, on veut une string type "YYYYMMDDHHmm"
    refTime: unixToRefTimeString(validTimeUnix),
    validTimeUnix,
    refTimeUnix,
    nx,
    ny,
    lo1,
    la1,
    dx,
    dy,
    scanningMode,
  };

  return {
    header,
    data: [u, v],
    meta: { tmp },
  };
}

export function unixToRefTimeString(unixSec) {
  const d = new Date(unixSec * 1000);
  const Y = d.getUTCFullYear();
  const M = String(d.getUTCMonth() + 1).padStart(2, '0');
  const D = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  // WindyDataProxy.strptime attend 12 chiffres : YYYYMMDDHHmm
  return `${Y}${M}${D}${h}${m}`;
}

// windpackClient.js (suite)

export async function fetchWindpackFromApi(baseUrl, dateYYYYDDMM, cycleFF, fh) {
  const fhStr = String(fh); // ex: 0,3,6,...
  const url = `${baseUrl}/api/gfs0p25/file/${dateYYYYDDMM}/${cycleFF}/${fhStr}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }

  // On décompresse le .wpack.gz en ArrayBuffer
  if (!res.body || typeof DecompressionStream === 'undefined') {
    // fallback: si ton reverse proxy décompresse déjà, tu peux tenter res.arrayBuffer() direct
    const ab = await res.arrayBuffer();
    return parseWindpack(ab);
  }

  const ds = new DecompressionStream('gzip');
  const decompressedStream = res.body.pipeThrough(ds);
  const ab = await new Response(decompressedStream).arrayBuffer();

  return parseWindpack(ab);
}
