import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import proj4 from 'proj4';
import 'proj4leaflet';

globalThis.L = L;
globalThis.proj4 = proj4;

import 'leaflet.tilelayer.colorfilter';
import 'leaflet.nauticscale/dist/leaflet.nauticscale.js';
import 'leaflet-ruler/src/leaflet-ruler.js';
import 'leaflet-ruler/src/leaflet-ruler.css';
import 'leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.min.js';
import 'leaflet.coordinates/dist/Leaflet.Coordinates-0.1.5.css';
import 'leaflet-polylinedecorator';
import 'font-awesome/css/font-awesome.min.css';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.js';
import 'leaflet.awesome-markers/dist/leaflet.awesome-markers.css';
import 'leaflet.geodesic'
import 'leaflet-velocity/dist/leaflet-velocity.css';
import 'leaflet-velocity';/*
import '@leaflet-windy/wind-js/windy.js';
import '@leaflet-windy/L.WindCanvas.js';
import '@leaflet-windy/L.WindyLayer.js';*/

export default L;