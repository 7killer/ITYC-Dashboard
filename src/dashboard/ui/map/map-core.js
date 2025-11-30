

function ensureLayerControlClickable(ctrl) {
  const c = ctrl && ctrl._container;
  if (!c) return;
  c.style.zIndex = '10050';
  c.style.pointerEvents = 'auto';

  if (!document.getElementById('leaflet-layercontrol-pointer-patch')) {
    const style = document.createElement('style');
    style.id = 'leaflet-layercontrol-pointer-patch';
    style.textContent = `
      .leaflet-top.leaflet-right { pointer-events: none; }
      .leaflet-top.leaflet-right .leaflet-control { pointer-events: auto; }
      .leaflet-control-layers { z-index: 10050 !important; }
    `;
    document.head.appendChild(style);
  }

  c.addEventListener('click', (ev) => {
    const label = ev.target.closest('label');
    if (!label) return;
    const input = label.querySelector('input.leaflet-control-layers-selector');
    if (!input) return;
    if (!input.checked) {
      input.checked = true;
      if (typeof ctrl._onInputClick === 'function') {
        ctrl._onInputClick();
      }
    }
  });
}

window.POLAR = window.POLAR || {
  enabled: false,
  crs: null,
  wmsLayer: null,
};

function hasProj4Leaflet() {
  return (
    typeof window !== 'undefined' &&
    window.L &&
    L.Proj &&                              
    typeof window.proj4 === 'function'     
  );
}

export function buildPolarCRS() {
  if (!hasProj4Leaflet()) return null;
  return new L.Proj.CRS(
    'EPSG:3413',
    '+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs',
    {
      resolutions: [8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1],
      origin: [-4194304, 4194304],
      bounds: L.bounds([-4194304, -4194304], [4194304, 4194304]),
    }
  );
}

export function createArcticWMS() {
  if (!hasProj4Leaflet()) return null;
  if (!POLAR.crs) POLAR.crs = buildPolarCRS();
  return L.tileLayer.wms('https://gibs.earthdata.nasa.gov/wms/epsg3413/best/wms.cgi', {
    layers: 'BlueMarble_ShadedRelief_Bathymetry',
    format: 'image/png',
    transparent: false,
    version: '1.1.1',
    crs: POLAR.crs,
    attribution: '&copy; NASA GIBS',
  });
}
let mercatorDragHandler = null;
let mercatorDragHandlerMapId = null;

export function applyBoundsForCurrentMode(map) {
  if (
    mercatorDragHandler &&
    mercatorDragHandlerMapId &&
    map &&
    map._leaflet_id === mercatorDragHandlerMapId
  ) {
    map.off('drag', mercatorDragHandler);
    mercatorDragHandler = null;
    mercatorDragHandlerMapId = null;
  }

  if (!POLAR.enabled) {
    const bounds = [
      [-89.98155760646617, -270],
      [ 89.99346179538875,  270]
    ];
    map.setMaxBounds(bounds);
    mercatorDragHandler = function () {
      map.panInsideBounds(bounds, { animate: false });
    };
    map.on('drag', mercatorDragHandler);
    mercatorDragHandlerMapId = map._leaflet_id;

  } else {
    map.setMaxBounds(null);
  }
}

export function computeComfortView(isArctic, prevCenter, prevZoom) {
  const prevLat = (prevCenter && Number.isFinite(prevCenter.lat)) ? prevCenter.lat : 0;
  const prevLng = (prevCenter && Number.isFinite(prevCenter.lng)) ? prevCenter.lng : 0;

  const normLng = ((prevLng + 540) % 360) - 180;

  if (isArctic) {
    const THRESHOLD_NORTH = 60;
    const alreadyInArctic = prevLat >= THRESHOLD_NORTH;
    const targetLat = alreadyInArctic ? prevLat : 85;
    const targetLng = normLng;
    const targetZoom = alreadyInArctic ? (prevZoom ?? 3) : 3;

    return { center: L.latLng(targetLat, targetLng), zoom: targetZoom };
  }
  const clampedLat = Math.max(-85, Math.min(85, prevLat));
  return { center: L.latLng(clampedLat, normLng), zoom: prevZoom ?? 3 };
}

