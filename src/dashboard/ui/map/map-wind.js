
import { mapState,updateBounds } from './map-race.js';
import L from '@/dashboard/ui/map/leaflet-setup';
import {getUserPrefs} from "../../../common/userPrefs.js"
import {WindyDataProxy} from '@leaflet-windy/WindyDataProxy.js'; // selon ton organisation
import { fetchWindpackFromApi, unixToRefTimeString } from './wind/windpackClient.js';


const colorScale = [
    "rgb(255, 255, 255)",
    "rgb(255, 255, 170)",
    "rgb(255, 255, 85)",
    "rgb(255, 255, 0)", // 3
    "rgb(255, 224, 0)",
    "rgb(255, 193, 0)",
    "rgb(255, 159, 0)",
    "rgb(255, 127, 0)", // 7
    "rgb(255, 96, 0)",
    "rgb(255, 64, 0)",
    "rgb(255, 32, 0)",
    "rgb(255, 0, 0)", // 11
    "rgb(170, 0, 170)",
    "rgb(85, 0, 170)",
];
colorScale.indexFor = function(v) {
    if (v < 10.8) return 0;
    if (v < 13.9) return 1;
    if (v < 17.2) return 2;
    if (v < 20.8) return 3;
    if (v < 24.5) return 4;
    if (v < 28.5) return 5;
    if (v < 32.7) return 6;
    if (v < 37.0) return 7;
    if (v < 41.5) return 8;
    if (v < 46.2) return 9;
    if (v < 51.0) return 10;
    if (v < 56.1) return 11;
    if (v < 61.2) return 12;
    return 13
};


export function startWindWorker()
{
    if(!mapState.windy_proxy )
    {
        const worker = new Worker(
            new URL('./wind/windy-layer-worker.js', import.meta.url),
            { type: 'module' }
        );
        mapState.windy_proxy  = new WindyDataProxy(mapState.windyLayer, worker);
    }
}


export function buildWindLayer()
{
    if (!mapState.map) return;

    const map = mapState.map;

    if(mapState.windyLayer)
    {
        map.removeLayer(mapState.windyLayer);
    }
    mapState.windyLayer = L.windyLayer({
        colorScale: colorScale,
        // worker_uri: "../wind-js/mdmv-worker.js",
        opacity: 0.6,
        pane: 'shadowPane'
    });
    map.addLayer(mapState.windyLayer);
}
export async function updateWindLayer() {
  const apiBase = 'https://wind.ityc.fr'; // proxy vers ton Node

  try {
    const res = await fetch(`${apiBase}/api/gfs0p25/manifest/latest`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const manifest = await res.json();

    const { run, forecasts } = manifest;
    if (!run || !Array.isArray(forecasts) || forecasts.length === 0) {
      console.warn('Manifest invalide ou vide:', manifest);
      return;
    }

    const nowUnix = Math.floor(Date.now() / 1000);

    // On ne garde que les forecasts disponibles
    const existing = forecasts.filter(f => f.exists);
    if (!existing.length) {
      console.warn('Aucun forecast existant dans le manifest');
      return;
    }

    // On les trie par validTimeUnix
    existing.sort((a, b) => a.validTimeUnix - b.validTimeUnix);

    // Chercher prev et next autour de nowUnix
    let prev = null;
    let next = null;
    for (const f of existing) {
      if (f.validTimeUnix <= nowUnix) {
        prev = f;
      }
      if (f.validTimeUnix > nowUnix) {
        next = f;
        break;
      }
    }

    // Cas bord : si pas prev ou pas next, on prend le forecast le plus proche
    if (!prev || !next) {
      let best = existing[0];
      let bestDiff = Math.abs(existing[0].validTimeUnix - nowUnix);
      for (const f of existing) {
        const diff = Math.abs(f.validTimeUnix - nowUnix);
        if (diff < bestDiff) {
          best = f;
          bestDiff = diff;
        }
      }

      console.log('[wind] Pas d’intervalle complet, on utilise le forecast le plus proche fh=', best.fh);
      const url = `${apiBase}/api/gfs0p25/file/${run.date}/${run.cycle}/${best.fh}`;

      if (!mapState.windy_proxy) {
        console.warn('windy_proxy non initialisé');
        return;
      }

      // Mode simple : pas d’interpolation
      mapState.windy_proxy.goto_dtg(url);
      return;
    }

    // Ici on a prev et next : on peut interpoler
    const span = next.validTimeUnix - prev.validTimeUnix;
    const alpha = span > 0 ? (nowUnix - prev.validTimeUnix) / span : 0;
    const clampedAlpha = Math.min(1, Math.max(0, alpha));

    console.log('[wind] Interpolation temps réel entre fh=', prev.fh, 'et', next.fh, 'alpha=', clampedAlpha.toFixed(2));

    // On charge les deux snapshots (windpack) côté client
    const [snapPrev, snapNext] = await Promise.all([
      fetchWindpackFromApi(apiBase, run.date, run.cycle, prev.fh),
      fetchWindpackFromApi(apiBase, run.date, run.cycle, next.fh),
    ]);

    const interpolated = interpolateSnapshots(snapPrev, snapNext, clampedAlpha);

    if (!mapState.windy_proxy) {
      console.warn('windy_proxy non initialisé');
      return;
    }

    // Pas besoin de worker ici, on injecte directement la grille interpolée
    mapState.windy_proxy.assignData(interpolated, false);

  } catch (err) {
    console.error('updateWindLayer error:', err);
  }
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

  // Header : on clone celui de a et on ajuste le temps
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

// export function updateWindLayer() {
//     const apiBase = 'https://wind.ityc.fr'; // via reverse proxy Plesk (sans / final suffit)

//     fetch(`${apiBase}/api/gfs0p25/manifest/latest`)
//         .then(r => {
//             if (!r.ok) throw new Error(`HTTP ${r.status}`);
//             return r.json();
//         })
//         .then(manifest => {
//             const { run, forecasts } = manifest;
//             if (!Array.isArray(forecasts) || !run) {
//                 console.warn('Manifest invalide:', manifest);
//                 return;
//             }

//             // on prend le dernier forecast dispo (exists === true)
//             const lastOk = [...forecasts].reverse().find(f => f.exists);
//             if (!lastOk) {
//                 console.warn('Aucun forecast dispo dans le manifest');
//                 return;
//             }

//             const url = `${apiBase}/api/gfs0p25/file/${run.date}/${run.cycle}/${lastOk.fh}`;

//             if (!mapState.windy_proxy) {
//                 console.warn('windy_proxy non initialisé');
//                 return;
//             }

//             mapState.windy_proxy.goto_dtg(url);
//         })
//         .catch(err => {
//             console.error('updateWindLayer error:', err);
//         });
// }