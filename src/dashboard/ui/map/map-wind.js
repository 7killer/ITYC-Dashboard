// map-wind.js
import { mapState, updateBounds } from './map-race.js';
import L from '@/dashboard/ui/map/leaflet-setup';
import { getUserPrefs } from '../../../common/userPrefs.js';
import { WindyDataProxy } from './wind/WindyDataProxy.js';

// IMPORTANT : plugin leaflet-velocity


// Palette Beaufort (on la réutilise pour leaflet-velocity)
/*const colorScale = [
  'rgb(255, 255, 255)',
  'rgb(255, 255, 170)',
  'rgb(255, 255, 85)',
  'rgb(255, 255, 0)', // 3
  'rgb(255, 224, 0)',
  'rgb(255, 193, 0)',
  'rgb(255, 159, 0)',
  'rgb(255, 127, 0)', // 7
  'rgb(255, 96, 0)',
  'rgb(255, 64, 0)',
  'rgb(255, 32, 0)',
  'rgb(255, 0, 0)', // 11
  'rgb(170, 0, 170)',
  'rgb(85, 0, 170)',
];*/
const colorScale = [
  '#1e3f5a',
  '#225ea8',
  '#1d91c0',
  '#41b6c4',
  '#7fcdbb',
  '#c7e9b4',
  '#ffff8c',
  '#feda61',
  '#fd8d3c',
  '#f03b20',
  '#bd0026',
  '#7b1fa2',
];


// ─────────────────────────────────────────────
// Worker + proxy
// ─────────────────────────────────────────────

export function startWindWorker() {
  if (!mapState.windy_proxy) {
    const worker = new Worker(
      new URL('./wind/windy-layer-worker.js', import.meta.url),
      { type: 'module' }
    );
    mapState.windy_proxy = new WindyDataProxy(mapState.windyLayer, worker);
  }
}

// ─────────────────────────────────────────────
// Construction de la couche vent (leaflet-velocity)
// ─────────────────────────────────────────────

export function buildWindLayer() {
  if (!mapState.map) return;

  const map = mapState.map;

  if (mapState.windyLayer) {
    map.removeLayer(mapState.windyLayer);

  }
  if (mapState.windControl) {
    map.removeControl(mapState.windControl);
    mapState.windControl = null;
  }

  // leaflet-velocity
  mapState.windyLayer = L.velocityLayer({
    // on laisse data à null, elle sera poussée par WindyDataProxy.setData()
    data: null,
    opacity: 0.6,
    pane: 'shadowPane',
    colorScale, // notre palette
//    velocityScale: 0.005, // à tweaker pour la longueur des particules
    velocityScale: 0.01, // à tweaker pour la longueur des particules
    displayValues: true,
    displayOptions: {
      velocityType: 'Vent',
      position: 'bottomleft',
      emptyString: 'Aucune donnée',
      angleConvention: 'bearingCW',
      speedUnit: 'kts',
      showCardinal: true,
      directionString: 'Direction',
      speedString: 'Vitesse',
    },
  });

  map.addLayer(mapState.windyLayer);

}

// ─────────────────────────────────────────────
// Récup du manifest & interpolation temps réel
// ─────────────────────────────────────────────

export function updateWindLayer() {
  const apiBase = 'https://wind.ityc.fr'; // proxy vers ton Node

  fetch(`${apiBase}/api/gfs0p25/manifest/latest`)
    .then(function (res) {
      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }
      return res.json();
    })
    .then(function (manifest) {
      const run = manifest.run;
      const forecasts = manifest.forecasts;

      if (!run || !Array.isArray(forecasts) || forecasts.length === 0) {
        console.warn('Manifest invalide ou vide:', manifest);
        return;
      }

      const nowUnix = Math.floor(Date.now() / 1000);

      // Ne garder que les forecasts existants
      const existing = forecasts.filter(function (f) {
        return f.exists;
      });

      if (!existing.length) {
        console.warn('Aucun forecast existant dans le manifest');
        return;
      }

      // Trier par validTimeUnix croissant
      existing.sort(function (a, b) {
        return a.validTimeUnix - b.validTimeUnix;
      });

      // Chercher prev (<= now) et next (> now)
      let prev = null;
      let next = null;

      for (let i = 0; i < existing.length; i++) {
        const f = existing[i];
        if (f.validTimeUnix <= nowUnix) {
          prev = f;
        }
        if (f.validTimeUnix > nowUnix) {
          next = f;
          break;
        }
      }

      if (!mapState.windy_proxy) {
        console.warn('windy_proxy non initialisé');
        return;
      }

      const baseFileUrl =
        apiBase + '/api/gfs0p25/file/' + run.date + '/' + run.cycle;

      // Cas bord : pas d’intervalle complet
      if (!prev || !next) {
        let best = existing[0];
        let bestDiff = Math.abs(existing[0].validTimeUnix - nowUnix);

        for (let i = 1; i < existing.length; i++) {
          const f = existing[i];
          const diff = Math.abs(f.validTimeUnix - nowUnix);
          if (diff < bestDiff) {
            best = f;
            bestDiff = diff;
          }
        }

        console.log(
          '[wind] Pas d’intervalle complet, on utilise le forecast le plus proche fh=',
          best.fh
        );

        const url = baseFileUrl + '/' + best.fh;
        mapState.windy_proxy.goto_dtg(url);
        return;
      }

      // Cas normal : interpolation entre prev & next
      const urlPrev = baseFileUrl + '/' + prev.fh;
      const urlNext = baseFileUrl + '/' + next.fh;

      console.log(
        '[wind] Interpolation temps réel entre fh=',
        prev.fh,
        'et',
        next.fh,
        'nowUnix=',
        nowUnix
      );

      mapState.windy_proxy.interpolateBetween(urlPrev, urlNext, nowUnix);
    })
    .catch(function (err) {
      console.error('updateWindLayer error:', err);
    });
}
