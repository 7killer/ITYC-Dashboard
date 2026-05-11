// auto-wind-worker.js

self.onmessage = function (e) {
  const { header, u, v, bounds, debugWind3 } = e.data;
  if (!header || !u || !v || !bounds) return;

  const {
    lo1, la1, dx, dy, nx, ny
  } = header;

  const { south, north, west, east } = bounds;

  let minMs = Infinity;
  let maxMs = 0;
  let count = 0;

  // parcours de la grille
  for (let j = 0; j < ny; j++) {
    const lat = la1 - j * dy;
    if (lat < south || lat > north) continue;

    for (let i = 0; i < nx; i++) {
      const lon = lo1 + i * dx;
      const lonNorm = lon > 180 ? lon - 360 : lon;

      if (lonNorm < west || lonNorm > east) continue;

      const idx = j * nx + i;
      const uu = u[idx];
      const vv = v[idx];
      if (uu == null || vv == null) continue;

      const speed = Math.sqrt(uu * uu + vv * vv);
      if (speed < minMs) minMs = speed;
      if (speed > maxMs) maxMs = speed;
      count += 1;
    }
  }

  if (!count || !Number.isFinite(minMs)) return;

  const minKts = Math.max(0, minMs * 1.943844);
  const maxKts = Math.max(minKts + 0.1, maxMs * 1.943844);

  self.postMessage({
    autoMinKts: Number(minKts.toFixed(2)),
    autoMaxKts: Number(maxKts.toFixed(2)),
    count,
    bounds,
    debugWind3: !!debugWind3,
  });
};
