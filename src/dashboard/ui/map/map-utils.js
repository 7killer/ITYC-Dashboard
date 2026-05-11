import L from '@/dashboard/ui/map/leaflet-setup';
import {formatPosition,formatShortDate,formatDHMS} from '../common.js';
import {getUserPrefs,saveUserPrefs} from "../../../common/userPrefs.js"

import { mapState,redrawMapCheckPoints,redrawProjectionLine } from './map-race.js';
import {applyWindSettings, stopAutoPlay, pauseAutoPlay,startAutoPlay,applyWindAtTime,windUiState,initWindTimeMode,setWindTimeMode} from './map-wind.js';

import {onCoastColorChange} from "./map-coasts.js"

import {onSailsMarkersChange} from "./map-routes.js"

export const greenRRIcon = L.icon({
    iconUrl: '../img/greenIcon.png',
    shadowUrl: '../img/RRIconShadowNok.png',
    iconSize:     [20, 35], // size of the icon
    shadowSize:   [53, 51], // size of the shadow
    iconAnchor:   [10, 35], // point of the icon which will correspond to marker's location
    shadowAnchor: [27, 45],  // the same for the shadow
    popupAnchor:  [0, -42] // point from which the popup should open relative to the iconAnchor
});
export const redRLIcon = L.icon({
    iconUrl: '../img/redIcon.png',
    shadowUrl: '../img/RLIconShadowNok.png',
    iconSize:     [20, 35],
    shadowSize:   [53, 51],
    iconAnchor:   [10, 35],
    shadowAnchor: [27, 45],
    popupAnchor:  [0, -42]
});
export const greenRRIconP = L.icon({
    iconUrl: '../img/greenIcon.png',
    shadowUrl: '../img/RRIconShadowOK.png',
    iconSize:     [20, 35],
    shadowSize:   [53, 51],
    iconAnchor:   [10, 35],
    shadowAnchor: [27, 45],
    popupAnchor:  [0, -42]
});
export const redRLIconP = L.icon({
    iconUrl: '../img/redIcon.png',
    shadowUrl: '../img/RLIconShadowOK.png',
    iconSize:     [20, 35],
    shadowSize:   [53, 51],
    iconAnchor:   [10, 35],
    shadowAnchor: [27, 45],
    popupAnchor:  [0, -42]
});
export const yellowRRIcon = L.icon({
    iconUrl: '../img/yellowIcon.png',
    shadowUrl: '../img/RRIconShadowNok.png',
    iconSize:     [20, 35],
    shadowSize:   [53, 51],
    iconAnchor:   [10, 35],
    shadowAnchor: [27, 45],
    popupAnchor:  [0, -42]
});
export const yellowRLIcon = L.icon({
    iconUrl: '../img/yellowIcon.png',
    shadowUrl: '../img/RLIconShadowNok.png',
    iconSize:     [20, 35],
    shadowSize:   [53, 51],
    iconAnchor:   [10, 35],
    shadowAnchor: [27, 45],
    popupAnchor:  [0, -42]
});
export const yellowRRIconP = L.icon({
    iconUrl: '../img/yellowIcon.png',
    shadowUrl: '../img/RRIconShadowOK.png',
    iconSize:     [20, 35],
    shadowSize:   [53, 51],
    iconAnchor:   [10, 35],
    shadowAnchor: [27, 45],
    popupAnchor:  [0, -42]
});
export const yellowRLIconP = L.icon({
    iconUrl: '../img/yellowIcon.png',
    shadowUrl: '../img/RLIconShadowOK.png',
    iconSize:     [20, 35],
    shadowSize:   [53, 51],
    iconAnchor:   [10, 35],
    shadowAnchor: [27, 45],
    popupAnchor:  [0, -42]
});

export function buildMarker( pos, layer, icond,title, zi, op,heading)
{ 
    let ret = [];
    for(let i=0;i<pos.length;i++)
    {
        if(!heading) heading=0;
        if(heading == 180) heading = 179.9; //or boat icon are drawn at 0° when 180° :s
        const marker1 = L.marker(pos[i],{icon:icond,rotationAngle: heading});
        if(op) marker1.opacity = op;
        if(zi)  marker1.zIndexOffset = zi;
        if(title)
        {
    
            marker1.bindPopup(title);    
            marker1.on('mouseover', function(e){
                e.target.bindPopup(title).openPopup();
            
                });        
            marker1.on('mouseout', function(e){  
                e.target.closePopup();
            
            });
        }
        marker1.addTo(layer);
        ret.push(marker1);  
    }                   
    return ret;
}

export function buildTextIcon(icon,iconColor,markerColor,text)
{
    return  L.AwesomeMarkers.icon({
        icon: icon,
        markerColor: markerColor,
        iconColor : iconColor,
        prefix: 'fa',
        html: text,
    });
}
export function buildBoatIcon(fillColor,borderColor,opacity)
{
    const MARKER = encodeURIComponent(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
    <svg width="100%" height="100%" viewBox="0 0 14 14" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:1.41421;">
    <path d="M4.784,13.635c0,0 -0.106,-2.924 0.006,-4.379c0.115,-1.502 0.318,-3.151 0.686,-4.632c0.163,-0.654 0.45,-1.623 0.755,-2.44c0.202,-0.54 0.407,-1.021 0.554,-1.352c0.038,-0.085 0.122,-0.139 0.215,-0.139c0.092,0 0.176,0.054 0.214,0.139c0.151,0.342 0.361,0.835 0.555,1.352c0.305,0.817 0.592,1.786 0.755,2.44c0.368,1.481 0.571,3.13 0.686,4.632c0.112,1.455 0.006,4.379 0.006,4.379l-4.432,0Z" style="fill:` +
    borderColor + `;"/><path d="M5.481,12.731c0,0 -0.073,-3.048 0.003,-4.22c0.06,-0.909 0.886,-3.522 1.293,-4.764c0.03,-0.098 0.121,-0.165 0.223,-0.165c0.103,0 0.193,0.067 0.224,0.164c0.406,1.243 1.232,3.856 1.292,4.765c0.076,1.172 0.003,4.22 0.003,4.22l-3.038,0Z" style="fill:`+
    fillColor+`;fill-opacity:`+ opacity +`;"/> </svg>`);   

    const MARKER_ICON_URL = `data:image/svg+xml;utf8,${MARKER}`;
    
    return L.icon({
        iconUrl: MARKER_ICON_URL,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -2],
    });
}

export function buildCircle( pos, layer,trackcolor,size,opacity,title)
{
    let ret = [];
    for(let i=0;i<pos.length;i++)
    {
        const circleMark = L.circleMarker(pos[i],
            {radius : size,
            color: trackcolor,
            fillColor: trackcolor,
            fillOpacity: opacity
        });
        if(title && title != '')
        {
            circleMark.bindPopup(title);    
            circleMark.on('mouseover', function(e){
                e.target.bindPopup(title).openPopup();
                });        
            
            circleMark.on('mouseout', function(e){  
                e.target.closePopup();
            
            });
        }
        circleMark.addTo(layer);
        ret.push(circleMark);      
    }            
    return ret;
}

export function buildCircleEndRace(pos, layer, trackcolor, size)
{
    let ret = [];
    for(let i=0;i<pos.length;i++)
    {
        const circleMark = L.circle(pos[i], {
            color: trackcolor,
            weight: 2,
            fill: false,
            radius: size,
        });        
        circleMark.addTo(layer);
        ret.push(circleMark);
    }            
    return ret;
}

export function buildTrace (tpath,layer,pointsContainer, color,weight,opacity,dashArray,dashOffset,mode=true) {

    let nbTrackLine = 0;
    let trackLine = [];
    for(let i=0;i<tpath.length;i++)
    {
        let path = [];
        path[0] = [];
        path[1] = [];
        path[2] = [];
        
        for(var j=0;j<tpath[i].length;j++)
        {
            const pos = buildPt2(tpath[i][j].lat,tpath[i][j].lng);
            path[0].push(pos[0]);
            path[1].push(pos[1]);
            path[2].push(pos[2]);
            pointsContainer.push(pos[1]);
        }
        for(j=0;j<path.length;j++)
        {
            var trackLineP;
            if(mode)
            {
                trackLineP = L.geodesic(path[j],
                    {
                        color: color,
                        opacity: opacity,
                        weight: weight,
                        wrap:false
                    });
            } else
            {
                trackLineP = L.polyline(path[j],
                    {
                        color: color,
                        opacity: opacity,
                        weight: weight,
                        wrap:false
                    });                
            }
            if(dashArray) trackLineP.options.dashArray = dashArray;
            if(dashOffset) trackLineP.options.dashOffset = dashOffset;
            trackLineP.on('mouseover', function() {
                trackLineP.setStyle({
                    weight: opacity*2,
                });
            });
        
            trackLineP.on('mouseout', function() {
                trackLineP.setStyle({
                    weight: opacity,
                });
            });
            trackLine[nbTrackLine] = trackLineP;
            trackLine[nbTrackLine].addTo(layer);
            nbTrackLine++;
        }
    }
    return trackLine;
}


function buildPt(lat,lon)
{
    if(!lat) lat = 0;
    if(!lon) lon = 0;
    return L.latLng(lat,lon);
}


export function buildPt2(lat,lon)
{

    if(!lat) lat = 0;
    if(!lon) lon = 0;
    let ret = [];
    ret[0] =  L.latLng(lat,lon-360,true);
    ret[1] =  L.latLng(lat,lon);
    ret[2] =  L.latLng(lat,lon+360,true);
    return ret;
}

export function buildPath(pathEntry,initLat,initLng,finishLat,finshLng)
{

    let cpath = [];
    let cpathNum = 0;
    cpath[cpathNum] = [];
    let pos;
    if(!pathEntry )    return cpath;
    let path = [];
    if(initLat && initLng)
    {
        path.push({lat:initLat,lon:initLng});
    }
    
    for(const pts of pathEntry)
    {
        path.push(pts);
    }
    if(finishLat && finshLng)
    {
        path.push({lat:finishLat,lon:finshLng});
    }
    let paths = convertLng0To360(path);
    pos= buildPt(paths[0].lat, (paths[0].lon?paths[0].lon:paths[0].lng));
    cpath[cpathNum].push(pos);

    if(paths.length >1)
        for (let i = 1; i < paths.length; i++) {
            const lon = (paths[i].lon?paths[i].lon:paths[i].lng);
            const lat = paths[i].lat;
            pos = buildPt(lat, lon);
            cpath[cpathNum].push(pos);
        }
    return cpath;
}

const convertLng0To360 = (coordinates) => {
    const coordinatesWithOffset = [];
    let offset = 0;
  
    for (const point of coordinates) {
      const previousPoint =
        coordinatesWithOffset[coordinatesWithOffset.length - 1];
      const lon = point.lon?point.lon:point.lng;
      const lonp = previousPoint?(previousPoint.lon?previousPoint.lon:previousPoint.lng):null;
      
      if (previousPoint && lon > 90 && lonp < -90) {
        offset = -360;
      } else if (previousPoint && lonp > 90 && lon < -90) {
        offset = 360;
      }
      if(point.lon) point.lon += offset; else point.lng += offset;
      coordinatesWithOffset.push(point);
    }
  
    return coordinatesWithOffset;
  };

export function buildPath_bspline(pathEntry,initLat,initLng,finishLat,finshLng)
 {

    let cpath = [];
    let cpathNum = 0;
    cpath[cpathNum] = [];
    if(!pathEntry )    return cpath;
    let path = [];
    if(initLat && initLng)
    {
        path.push({lat:initLat,lon:initLng});
    }
    for(const pts of pathEntry)
    {
        path.push(pts);
    }
    if(finishLat && finshLng)
    {
        path.push({lat:finishLat,lon:finshLng});
    }

    path = [
        path[0],
        path[0],
        ...path,
        path[path.length - 1],
        path[path.length - 1]
    ];
    const paths = convertLng0To360(path);
    if(paths.length >1)
    {
        for (let i = 2; i < paths.length-1; i++) {
            for (let t = 0; t < 1; t += 0.1) {
                const  ax = (-paths[i - 2].lat + 3 * paths[i - 1].lat - 3 * paths[i].lat + paths[i + 1].lat) / 6;
                const  ay = (-paths[i - 2].lon + 3 * paths[i - 1].lon - 3 * paths[i].lon + paths[i + 1].lon) / 6;
                const  bx = (paths[i - 2].lat - 2 * paths[i - 1].lat + paths[i].lat) / 2;
                const  by = (paths[i - 2].lon - 2 * paths[i - 1].lon + paths[i].lon) / 2;
                const  cx = (-paths[i - 2].lat + paths[i].lat) / 2;
                const  cy = (-paths[i - 2].lon + paths[i].lon) / 2;
                const  dx = (paths[i - 2].lat + 4 * paths[i - 1].lat + paths[i].lat) / 6;
                const  dy = (paths[i - 2].lon + 4 * paths[i - 1].lon + paths[i].lon) / 6;
                const lat = ax * Math.pow(t + 0.1, 3) + bx * Math.pow(t + 0.1, 2) + cx * (t + 0.1) + dx;
                const lon = ay * Math.pow(t + 0.1, 3) + by * Math.pow(t + 0.1, 2) + cy * (t + 0.1) + dy;
                const pos = buildPt(lat, lon);
                cpath[cpathNum].push(pos);
            }
        }
    }
    return cpath;
}

function clampMercatorLat(lat) {
    return Math.max(-85.05112878, Math.min(85.05112878, lat));
}

function mercatorY(latDeg) {
    const lat = clampMercatorLat(latDeg) * Math.PI / 180;
    return Math.log(Math.tan(Math.PI / 4 + lat / 2));
}

function inverseMercatorY(y) {
    return (2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180 / Math.PI;
}

function buildRhumbSegmentPoints(from, to, steps = 32) {
    const lat1 = from.lat;
    const lon1 = from.lng;
    const lat2 = to.lat;
    const lon2 = to.lng;

    const y1 = mercatorY(lat1);
    const y2 = mercatorY(lat2);

    const pts = [];

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;

        const y = y1 + (y2 - y1) * t;
        const lon = lon1 + (lon2 - lon1) * t;
        const lat = inverseMercatorY(y);

        pts.push(L.latLng(lat, lon, true));
    }

    return pts;
}

function buildRhumbPolylinePoints(path, stepsPerSegment = 32) {
    if (!path || path.length === 0) return [];
    if (path.length === 1) return [path[0]];

    const pts = [];

    for (let i = 0; i < path.length - 1; i++) {
        const segPts = buildRhumbSegmentPoints(path[i], path[i + 1], stepsPerSegment);

        if (i > 0) {
            segPts.shift();
        }

        pts.push(...segPts);
    }

    return pts;
}

export function buildTraceRhumb(
    tpath,
    layer,
    pointsContainer,
    color,
    weight,
    opacity,
    dashArray,
    dashOffset,
    stepsPerSegment = 32
) {
    let nbTrackLine = 0;
    const trackLine = [];

    for (let i = 0; i < tpath.length; i++) {
        const path = [[], [], []];

        for (let j = 0; j < tpath[i].length; j++) {
            const pos = buildPt2(tpath[i][j].lat, tpath[i][j].lng);
            path[0].push(pos[0]);
            path[1].push(pos[1]);
            path[2].push(pos[2]);
            pointsContainer.push(pos[1]);
        }

        for (let j = 0; j < path.length; j++) {
            const rhumbPoints = buildRhumbPolylinePoints(path[j], stepsPerSegment);

            const trackLineP = L.polyline(rhumbPoints, {
                color,
                opacity,
                weight,
                wrap: false
            });

            if (dashArray) trackLineP.options.dashArray = dashArray;
            if (dashOffset) trackLineP.options.dashOffset = dashOffset;

            trackLineP.on('mouseover', function () {
                trackLineP.setStyle({
                    weight: opacity * 2,
                });
            });

            trackLineP.on('mouseout', function () {
                trackLineP.setStyle({
                    weight: opacity,
                });
            });

            trackLine[nbTrackLine] = trackLineP;
            trackLine[nbTrackLine].addTo(layer);
            nbTrackLine++;
        }
    }

    return trackLine;
}

export function createProjectionPoint(ts,lat,lon)
{
    return  {
        timeStamp : ts,
        lat : lat,
        lon : lon
    };
}

export function darkenColor(hexColor, amount) {
    const color = hexColor.replace("#", "");
    // Extract RGB comp.
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    // Calculer les nouvelles valeurs RVB avec une luminosité réduite
    const darkenedR = Math.max(0, r - amount);
    const darkenedG = Math.max(0, g - amount);
    const darkenedB = Math.max(0, b - amount);

    // Convertir les nouvelles valeurs RVB en format hexadécimal
    const darkenedHexColor = `#${componentToHex(darkenedR)}${componentToHex(darkenedG)}${componentToHex(darkenedB)}`;
    return darkenedHexColor;
}
function componentToHex(component) {
    const hex = component.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}


export function buildMarkerTitle(point)
{

    const userPrefs = getUserPrefs();
    const localTimes = userPrefs.global.localTime;

    let  position = formatPosition(point.lat, point.lon);
    const currentDate = new Date();
    const currentTs = currentDate.getTime();

    let newDate =   currentDate;  
    if(point.timestamp!="-")
        newDate = formatShortDate(point.timestamp,undefined,localTimes);


    const ttw = point.timestamp-currentTs;

    const textHDG = point.hdg ? "HDG: <b>" + point.hdg.replace(/&deg;/g, "°") + "</b><br>" : "";
    const textTWS = point.tws ? "TWS: " + point.tws + "<br>" : "";
    const textSpeed = point.speed ? "Speed: " + point.speed : "";
    // Data visual separator
    let textTWA = point.twa ? "TWA: <b>" + point.twa.replace(/&deg;/g, "°") + "</b>" : "";
    textTWA += point.twa && point.hdg ? "&nbsp;|&nbsp;" : "";

    let textTWD = point.twd ? "TWD: " + point.twd.replace(/&deg;/g, "°") : "";
    textTWD += point.twd && point.tws ? "&nbsp;|&nbsp;" : "";

    let textSail = point.sail ? "Sail: " + point.sail : "";
    if (point.boost && point.boost > 0) textSail += "⚠️";
    textSail += point.sail && point.speed ? "&nbsp;|&nbsp;" : "";

    if (point.desc) position += '<br>' + point.desc.replace(/�/g, "°");
    let textStamina = '';
    if (point.stamina && point.stamina > 0) textStamina = "🔋 " + point.stamina + "%";

        return "<b>" + newDate + "</b> (" + formatDHMS(ttw) + ")<br>"
        + position + "<br>"
        + textTWA + textHDG
        + textTWD + textTWS
        + textSail + textSpeed + "<br>"
        + textStamina;
}

export     function addMapControl(map)
{
    // Initialiser le timeMode du vent depuis les préférences utilisateur
    initWindTimeMode();
    
    map.addControl(new L.Control.ScaleNautic({
        metric: true,
        imperial: false,
        nautic: true
    }));

    const optionsRuler = {
        position: 'topleft',
        maxPoints: 2,
        lengthUnit: {
            factor: 0.539956803,
            display: 'nm',
            decimal: 2,
            label: 'Distance:'
        },
    };
    L.control.ruler(optionsRuler).addTo(map);

 /*   L.control.coordinates({
        useDMS: true,
        labelTemplateLat: "Lat: {y}",
        labelTemplateLng: " Lng: {x}",
        useLatLngOrder: true,
        labelFormatterLat: function (lat) {
            let latFormatted = L.NumberFormatter.toDMS(lat);
            latFormatted = latFormatted.replace(/''$/, '"') + (latFormatted.startsWith('-') ? ' S' : ' N');
            return '<span class="labelGeo">' + latFormatted.replace(/^-/, '') + '</span>';
            //return latFormatted.replace(/^-/, '');
        },
        labelFormatterLng: function (lng) {
            let lngFormatted = L.NumberFormatter.toDMS(lng);
            lngFormatted = lngFormatted.replace(/''$/, '"') + (lngFormatted.startsWith('-') ? ' W' : ' E');
            return '<span class="labelGeo">' + lngFormatted.replace(/^-/, '') + '</span>';
        },
    }).addTo(map);
*/
    const ctrl = new windPosControl();
    ctrl.addTo(map);

    const savedTimeMode = getUserPrefs()?.map?.windTimeMode || 'gfs';
    const ctrl2 = new WindToggleControl({
        initialMode: mapState.windSettings.visible
            ? savedTimeMode
            : 'none',
        onToggle: async (mode) => {
            if (mode === 'none') {
            mapState.windSettings.visible = false;
            // applique hide layer (ta fonction existante)
            applyWindSettings();
            return;
            }

            mapState.windSettings.visible = true;
            await setWindTimeMode(mode); // 'gfs' ou 'vr' - sauvegarde dans userPrefs
            applyWindSettings();
            await applyWindAtTime(windUiState.currentUnix);
        }
    });
    ctrl2.addTo(mapState.map);

    addSettingsMenuControl(map, {
    getWindMode: () => mapState.windSettings.mode || 'default',
    setWindMode: (mode) => {
        mapState.windSettings.mode = mode;
        applyWindSettings();
    },

    getWindMaxKts: () => mapState.windMaxKts || 40,
    setWindMaxKts: (kts) => {
        mapState.windSettings.customMaxKts = kts;
        if (mapState.windSettings.mode === 'custom') {
            applyWindSettings();
        }
    },

    getCoastColor: () => getUserPrefs().map?.borderColor || '#ff0000',
    setCoastColor: async (color) => {
        const userPrefs = getUserPrefs(); 
        userPrefs.map.borderColor = color;
        await saveUserPrefs(userPrefs);
        onCoastColorChange();

    },

    getProjectionColor: () => getUserPrefs().map?.projectionColor || '#b86dff',
    setProjectionColor: async (color) => {
        const userPrefs = getUserPrefs(); 
        userPrefs.map.projectionColor = color;
        await saveUserPrefs(userPrefs);
        redrawProjectionLine();
    },

    getProjectionLenght: () => getUserPrefs().map?.projectionLineLenght || 20,
    setProjectionLenght: async (lght) => {
        const userPrefs = getUserPrefs(); 
        userPrefs.map.projectionLineLenght = lght;
        await saveUserPrefs(userPrefs);
        redrawProjectionLine();
    },
    
    getShowHiddenBouys: () => getUserPrefs().map?.invisibleBuoy || false,
    setShowHiddenBouys: async (state) => {
        const userPrefs = getUserPrefs(); 
        userPrefs.map.invisibleBuoy = state;
        await saveUserPrefs(userPrefs);
        redrawMapCheckPoints();

    },  
    
    getShowSailsMarkers: () => getUserPrefs().map?.showSailsMarkers || false,
    setShowSailsMarkers: async (state) => {
        const userPrefs = getUserPrefs(); 
        userPrefs.map.showSailsMarkers = state;
        await saveUserPrefs(userPrefs);
        onSailsMarkersChange(state);
    },  
    });

    map.attributionControl.addAttribution('&copy;SkipperDuMad / Trait de cotes &copy;Kurun56');
}
function degreesToCardinalDirection(deg) {
    var cardinalDirection = '';

    if (deg >= 0 && deg < 11.25 || deg >= 348.75) {
      cardinalDirection = 'N';
    } else if (deg >= 11.25 && deg < 33.75) {
      cardinalDirection = 'NNE';
    } else if (deg >= 33.75 && deg < 56.25) {
      cardinalDirection = 'NE';
    } else if (deg >= 56.25 && deg < 78.75) {
      cardinalDirection = 'ENE';
    } else if (deg >= 78.25 && deg < 101.25) {
      cardinalDirection = 'E';
    } else if (deg >= 101.25 && deg < 123.75) {
      cardinalDirection = 'ESE';
    } else if (deg >= 123.75 && deg < 146.25) {
      cardinalDirection = 'SE';
    } else if (deg >= 146.25 && deg < 168.75) {
      cardinalDirection = 'SSE';
    } else if (deg >= 168.75 && deg < 191.25) {
      cardinalDirection = 'S';
    } else if (deg >= 191.25 && deg < 213.75) {
      cardinalDirection = 'SSW';
    } else if (deg >= 213.75 && deg < 236.25) {
      cardinalDirection = 'SW';
    } else if (deg >= 236.25 && deg < 258.75) {
      cardinalDirection = 'WSW';
    } else if (deg >= 258.75 && deg < 281.25) {
      cardinalDirection = 'W';
    } else if (deg >= 281.25 && deg < 303.75) {
      cardinalDirection = 'WNW';
    } else if (deg >= 303.75 && deg < 326.25) {
      cardinalDirection = 'NW';
    } else if (deg >= 326.25 && deg < 348.75) {
      cardinalDirection = 'NNW';
    }

    return cardinalDirection;
  }
const windPosControl = L.Control.extend({
  options: {
    position: 'bottomright',
  },

  onAdd: function (map) {
    const container = L.DomUtil.create(
      'div',
      'leaflet-bar ityc-info-control ityc-posplay'
    );
 
     // ---- Colonne boutons lecture (zone rouge) ----
     const pb = document.createElement('div');
     pb.className = 'ityc-posplay-buttons';
     pb.innerHTML = `
       <button type="button" class="ityc-pb-btn" data-role="play"  title="Lecture">▶</button>
       <button type="button" class="ityc-pb-btn" data-role="pause" title="Pause">⏸</button>
       <button type="button" class="ityc-pb-btn" data-role="stop"  title="Stop">⏹</button>
     `;
 
     const play  = pb.querySelector('[data-role="play"]');
     const pause = pb.querySelector('[data-role="pause"]');
     const stop  = pb.querySelector('[data-role="stop"]');
 
     play.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); startAutoPlay(); });
     pause.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); pauseAutoPlay(); });
     stop.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); stopAutoPlay(true); });
 
     // ---- Bloc infos (coords + vent) ----
     const info = document.createElement('div');
     info.className = 'ityc-posplay-info';
  
    const rowCoords = document.createElement('div');
    rowCoords.className = 'ityc-info-coords';
    rowCoords.textContent = 'Lat: —   Lng: —';

    const rowWind = document.createElement('div');
    rowWind.className = 'ityc-info-wind';
    rowWind.style.display = 'none';
    rowWind.textContent = 'TWD: —   TWS: —';

    info.appendChild(rowCoords);
    info.appendChild(rowWind);
    container.appendChild(pb);
    container.appendChild(info);

    this._map = map;
    this._rowCoords = rowCoords;
    this._rowWind = rowWind;

    // === Mouse move handler ===
    const update = (e) => {
        function formatLatDMS(lat)
        {
            let latFormatted = L.NumberFormatter.toDMS(lat);
            latFormatted = latFormatted.replace(/''$/, '"') + (latFormatted.startsWith('-') ? ' S' : ' N');
            return latFormatted.replace(/^-/, '');
        }
        function formatLngDMS(lng)
        {
            let lngFormatted = L.NumberFormatter.toDMS(lng);
            lngFormatted = lngFormatted.replace(/''$/, '"') + (lngFormatted.startsWith('-') ? ' W' : ' E');
            return lngFormatted.replace(/^-/, '');
        }


        const { lat, lng } = e.latlng;

        rowCoords.innerHTML  =
            `Lat: ${formatLatDMS(lat)}   Lng: ${formatLngDMS(lng)}`;

        // Si vent actif et windy dispo
        if (
            mapState.windSettings.visible  &&
            mapState.windyLayer &&
            mapState.windyLayer._windy &&
            mapState.windyLayer._windy.field
        ) {
            const field = mapState.windyLayer._windy.field;
            const point = map.latLngToContainerPoint(e.latlng);
            const v = field(point.x, point.y);

            if (v && v[2] !== null) {
                const speedKt = (v[2] * 1.94384).toFixed(1); // m/s -> kt
                let dirDeg = Math.round(
                    (Math.atan2(v[0], -v[1]) * 180) / Math.PI +180
                );
                if (dirDeg >= 360) dirDeg -= 360;
                rowWind.textContent =
                    `TWD: ${dirDeg}° (${degreesToCardinalDirection(dirDeg)})   TWS: ${speedKt} kt`;
                rowWind.style.display = '';
                pb.style.display = '';
            } else {
                rowWind.style.display = 'none';
                pb.style.display = 'none';
            }
        } else {
            rowWind.style.display = 'none';
            pb.style.display = 'none';
        }
    };

    this._updateFn = update;
    map.on('mousemove', update);
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);
    return container;
  },

  onRemove: function (map) {
    if (this._updateFn) {
      map.off('mousemove', this._updateFn);
    }
  },
});

const WindToggleControl = L.Control.extend({
  options: { position: 'topright' },

  initialize: function (opts = {}) {
    L.Util.setOptions(this, opts);

    // onToggle(mode) : 'none' | 'gfs' | 'vr'
    this._onToggle = opts.onToggle || (() => {});

    // état initial : 'none'|'gfs'|'vr'
    const initialMode = (opts.initialMode === 'vr' || opts.initialMode === 'gfs')
      ? opts.initialMode
      : 'none';

    this._mode = initialMode;
    this._lastOnMode = (initialMode === 'none') ? (opts.defaultOnMode || 'gfs') : initialMode;

    this._hideTimer = null;
  },

  onAdd: function (map) {
    this._map = map;

    const container = L.DomUtil.create('div', 'leaflet-bar ityc-toolbar ityc-windctl');

    // Bouton icône
    const btn = L.DomUtil.create('a', 'ityc-tool ityc-tool-wind', container);
    btn.href = '#';
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', 'Vent');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" class="ityc-icon" aria-hidden="true">
        <path d="M4 8h10a3 3 0 1 0-3-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M4 12h14a3 3 0 1 1-3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M4 16h8a2 2 0 1 1-2 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;

    // Mini-menu (hover)
    const menu = L.DomUtil.create('div', 'ityc-wind-menu', container);
    menu.style.display = 'none';
    menu.setAttribute('role', 'menu');

    const groupName = `ityc_wind_${Math.random().toString(16).slice(2)}`;
    menu.innerHTML = `
      <label class="ityc-wind-opt">
        <input type="radio" name="${groupName}" value="gfs">
        <span>GFS 0.25</span>
      </label>
      <label class="ityc-wind-opt">
        <input type="radio" name="${groupName}" value="vr">
        <span>VR</span>
      </label>
      <label class="ityc-wind-opt">
        <input type="radio" name="${groupName}" value="none">
        <span>Aucun</span>
      </label>
    `;

    this._container = container;
    this._btn = btn;
    this._menu = menu;

    // init UI
    this._syncRadios();
    this._applyState();

    // Leaflet events
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);

    // Click bouton : toggle none <-> lastOnMode (utile sans hover)
    L.DomEvent.on(btn, 'click', L.DomEvent.stop);
    L.DomEvent.on(btn, 'click', () => {
      const next = (this._mode === 'none') ? (this._lastOnMode || 'gfs') : 'none';
      this.setMode(next, { emit: true });
    });

    // Hover open/close menu
    const showMenu = () => {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
      this._menu.style.display = '';
      this._container.classList.add('is-menu-open');
    };

    const hideMenu = () => {
      clearTimeout(this._hideTimer);
      this._hideTimer = setTimeout(() => {
        this._menu.style.display = 'none';
        this._container.classList.remove('is-menu-open');
      }, 180);
    };

    container.addEventListener('mouseenter', showMenu);
    container.addEventListener('mouseleave', hideMenu);
    menu.addEventListener('mouseenter', showMenu);
    menu.addEventListener('mouseleave', hideMenu);

    // Selection radio
    menu.querySelectorAll('input[type="radio"]').forEach((input) => {
      input.addEventListener('change', () => {
        const v = input.value; // gfs|vr|none
        this.setMode(v, { emit: true });
      });
    });

    return container;
  },

  setMode: function (mode, { emit = false } = {}) {
    const m = (mode === 'vr' || mode === 'gfs') ? mode : 'none';
    this._mode = m;
    if (m !== 'none') this._lastOnMode = m;

    this._syncRadios();
    this._applyState();

    if (emit) this._onToggle(this._mode);
  },

  getMode: function () {
    return this._mode;
  },

  _syncRadios: function () {
    if (!this._menu) return;
    const inputs = this._menu.querySelectorAll('input[type="radio"]');
    inputs.forEach((i) => {
      i.checked = (i.value === this._mode);
    });
  },

  _applyState: function () {
    if (!this._btn) return;

    const isOn = this._mode !== 'none';
    this._btn.classList.toggle('is-on', isOn);
    this._btn.classList.toggle('is-off', !isOn);

    const title =
      this._mode === 'vr' ? 'Vent (VR)' :
      this._mode === 'gfs' ? 'Vent (GFS 0.25)' :
      'Vent (Aucun)';

    this._btn.title = title;
    this._btn.setAttribute('aria-pressed', String(isOn));
  },
});

export function addSettingsMenuControl(map, {
  getWindMode,          // () => 'default'|'custom'|'auto'
  setWindMode,          // (mode) => void
  getWindMaxKts,        // () => number
  setWindMaxKts,        // (kts) => void
  getCoastColor,        // () => string  ex '#ff0000'
  setCoastColor,        // (color) => void  (ton handler existant)
  getProjectionColor,   // () => string  ex '#b86dff'
  setProjectionColor,   // (color) => void  (ton handler existant)
  getProjectionLenght,
  setProjectionLenght,
  getShowHiddenBouys,
  setShowHiddenBouys,
  getShowSailsMarkers,
  setShowSailsMarkers

} = {}) {
  const SettingsControl = L.Control.extend({
    options: { position: 'topright' },

    onAdd() {
      const root = L.DomUtil.create('div', 'leaflet-bar ityc-settings');

      // bouton gear
      const btn = L.DomUtil.create('a', 'ityc-tool ityc-tool-gear is-off', root);
      btn.href = '#';
      btn.title = 'Réglages';
      btn.setAttribute('role', 'button');

      btn.innerHTML = `
        <svg viewBox="0 0 24 24" class="ityc-icon" aria-hidden="true">
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" fill="none" stroke="currentColor" stroke-width="2"/>
          <path d="M19.4 15a8.7 8.7 0 0 0 .1-1l2-1.2-2-3.4-2.3.6a7.6 7.6 0 0 0-.8-.5L16 7h-4l-.4-2h-3.9l-.8 2.1a7.6 7.6 0 0 0-.8.5l-2.3-.6-2 3.4L3.6 14c0 .3 0 .7.1 1l-2 1.2 2 3.4 2.3-.6c.3.2.5.3.8.5L8 21h4l.4 2h3.9l.8-2.1c.3-.2.6-.3.8-.5l2.3.6 2-3.4-2-1.2Z"
                fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        </svg>
      `;

      // panel (menu hover)
      const panel = L.DomUtil.create('div', 'ityc-settings-panel', root);
      panel.innerHTML = `
        <div class="ityc-settings-title">Réglages</div>

        <div class="ityc-settings-row">
          <label class="ityc-settings-label">Mode vent</label>
          <select class="ityc-settings-select" data-role="wind-mode">
            <option value="default">Défaut</option>
            <option value="custom">Custom</option>
            <option value="auto">Auto</option>
          </select>
        </div>

        <div class="ityc-settings-row ityc-settings-row-custom" data-role="wind-custom">
          <label class="ityc-settings-label">Max (kt)</label>
          <input class="ityc-settings-range" data-role="wind-max" type="range" min="5" max="80" step="1" value="40">
          <span class="ityc-settings-value" data-role="wind-max-val">40</span>
        </div>

        <div class="ityc-settings-divider"></div>

        <div class="ityc-settings-row">
          <label class="ityc-settings-label">Trait de côte</label>
          <input class="ityc-settings-color" data-role="coast-color" type="color" value="#ff0000">
        </div>
        <div class="ityc-settings-row">
          <label class="ityc-settings-label">Ligne de projection</label>
          <input class="ityc-settings-color" data-role="projection-color" type="color" value="#ff0000">
        </div>

        <div class="ityc-settings-divider"></div>

        <div class="ityc-settings-row">
          <label class="ityc-settings-label">Longueur projection</label>
          <input class="ityc-settings-value" data-role="projection-lenght" type="number" min="0" max="360" value="20">
        </div>

        <div class="ityc-settings-divider"></div>
        <div class="ityc-settings-row">
          <label class="ityc-settings-label">Afficher bouées cachées</label>
          <input class="ityc-settings-checkbox" data-role="show-hidden-bouys" type="checkbox">
        </div>
        <div class="ityc-settings-divider"></div>
        <div class="ityc-settings-row">
          <label class="ityc-settings-label">Afficher marques de voiles</label>
          <input class="ityc-settings-checkbox" data-role="show-sails-markers" type="checkbox">
        </div>


      `;

      // stop propagation (sinon map pan/zoom)
      L.DomEvent.disableClickPropagation(root);
      L.DomEvent.disableScrollPropagation(root);

      // init values
      const selMode = panel.querySelector('[data-role="wind-mode"]');
      const rowCustom = panel.querySelector('[data-role="wind-custom"]');
      const rngMax = panel.querySelector('[data-role="wind-max"]');
      const lblMax = panel.querySelector('[data-role="wind-max-val"]');
      const inpCoast = panel.querySelector('[data-role="coast-color"]');
      const inpProjection = panel.querySelector('[data-role="projection-color"]');
      const inpProjectionLenght = panel.querySelector('[data-role="projection-lenght"]');
      const inpPShowHiddenbouys = panel.querySelector('[data-role="show-hidden-bouys"]');
      const inpPShowSailsMarkers = panel.querySelector('[data-role="show-sails-markers"]');
        

      const mode0 = getWindMode ? getWindMode() : 'default';
      selMode.value = mode0;

      const max0 = getWindMaxKts ? Number(getWindMaxKts()) : 40;
      rngMax.value = String(max0);
      lblMax.textContent = String(max0);

      const cc0 = getCoastColor ? (getCoastColor() || '#ff0000') : '#ff0000';
      inpCoast.value = cc0;
      
      const cc1 = getProjectionColor ? (getProjectionColor() || '#b86dff') : '#b86dff';
      inpProjection.value = cc1;

      const pLght = getProjectionLenght ? (Number(getProjectionLenght()) || 20) : 30;
      inpProjectionLenght.value = pLght;

      const pHiddenBouys = getShowHiddenBouys ? getShowHiddenBouys() : false;
      inpPShowHiddenbouys.checked = pHiddenBouys;

      const pSailsMarkers = getShowSailsMarkers ? getShowSailsMarkers() : false;
      inpPShowSailsMarkers.checked = pSailsMarkers;

      const refreshCustomVisibility = () => {
        const mode = selMode.value;
        rowCustom.style.display = (mode === 'custom') ? '' : 'none';
      };
      refreshCustomVisibility();

      // handlers
      selMode.addEventListener('change', () => {
        const mode = selMode.value;
        refreshCustomVisibility();
        if (setWindMode) setWindMode(mode);
      });

      rngMax.addEventListener('input', () => {
        lblMax.textContent = rngMax.value;
      });
      rngMax.addEventListener('change', () => {
        const kts = Number(rngMax.value);
        if (setWindMaxKts) setWindMaxKts(kts);
      });

      inpCoast.addEventListener('change', () => {
        const color = inpCoast.value;
        if (setCoastColor) setCoastColor(color);
      });

      inpProjection.addEventListener('change', () => {
        const color = inpProjection.value;
        if (setProjectionColor) setProjectionColor(color);
      });

      inpProjectionLenght.addEventListener('change', () => {
        const pLght = inpProjectionLenght.value;
        if (setProjectionLenght) setProjectionLenght(pLght);
      });

      inpPShowHiddenbouys.addEventListener('change', () => {
        const sHiddenBouys = inpPShowHiddenbouys.checked;
        if (setShowHiddenBouys) setShowHiddenBouys(sHiddenBouys);
      });
      inpPShowSailsMarkers.addEventListener('change', () => {
        const sSailsMarkers = inpPShowSailsMarkers.checked;
        if (setShowSailsMarkers) setShowSailsMarkers(sSailsMarkers);
      });
      // hover open/close (survol)
      const open = () => root.classList.add('open');
      const close = () => root.classList.remove('open');

      root.addEventListener('mouseenter', open);
      root.addEventListener('mouseleave', close);

      // click sur gear = toggle (utile mobile / tactile)
      L.DomEvent.on(btn, 'click', L.DomEvent.stop);
      L.DomEvent.on(btn, 'click', () => {
        root.classList.toggle('open');
      });

      return root;
    },
  });

  const ctrl = new SettingsControl();
  ctrl.addTo(map);
  return ctrl;
}


export const sailUnknownIcon = L.icon({
    iconUrl: '../img/sail_unknow.png',
    iconSize:     [21, 19],
    iconAnchor:   [11, 19],
//    popupAnchor:  [0, -42]
});

export const sailJIBIcon = L.icon({
    iconUrl: '../img/sail_jib.png',
    iconSize:     [21, 19],
    iconAnchor:   [11, 19],
//    popupAnchor:  [0, -42]
});

export const sailSPIIcon = L.icon({
    iconUrl: '../img/sail_spi.png',
    iconSize:     [21, 19],
    iconAnchor:   [11, 19],
//    popupAnchor:  [0, -42]
});

export const sailSSIcon = L.icon({
    iconUrl: '../img/sail_ss.png',
    iconSize:     [21, 19],
    iconAnchor:   [11, 19],
//    popupAnchor:  [0, -42]
});

export const sailLJIcon = L.icon({
    iconUrl: '../img/sail_lj.png',
    iconSize:     [21, 19],
    iconAnchor:   [11, 19],
//    popupAnchor:  [0, -42]
});

export const sailC0Icon = L.icon({
    iconUrl: '../img/sail_c0.png',
    iconSize:     [21, 19],
    iconAnchor:   [11, 19],
//    popupAnchor:  [0, -42]
});

export const sailHGIcon = L.icon({
    iconUrl: '../img/sail_hg.png',
    iconSize:     [21, 19],
    iconAnchor:   [11, 19],
//    popupAnchor:  [0, -42]
});
export const sailLGIcon = L.icon({
    iconUrl: '../img/sail_lg.png',
    iconSize:     [21, 19],
    iconAnchor:   [11, 19],
//    popupAnchor:  [0, -42]
});

export function getSailIcons(sail)
{
    let sailMarkerIcon = sailUnknownIcon;

    let cleanSailName = sail.replace("/[^\w\s]/gi", '').toLowerCase();
    cleanSailName=cleanSailName.replace('"','').replace('"','');

    switch(cleanSailName)
    {
        case "jib":
        case "jib-foils":
            sailMarkerIcon = sailJIBIcon;
            break;
        case "spi":
        case "spi-foils":
            sailMarkerIcon = sailSPIIcon;
            break;
        case "stay":
        case "stay sail":
        case "ss":
        case "trinquette":
        case "staysail-foils":
        case "staysail":
            sailMarkerIcon = sailSSIcon;
            break;
        case "genois leger":
        case "lj":
        case "light jib":
        case "light_jib":
        case "light_jib-foils":
        case "lightjib":
        case "lightjib-foils":
            sailMarkerIcon = sailLJIcon;
            break;
        case "c0":
        case "code0":
        case "code 0":
        case "code_0":
        case "code_0-foils":
        case "code0":
        case "code0-foils":
            sailMarkerIcon = sailC0Icon;
            break;
        case "hg":
        case "heavy gennaker":
        case "spi lourd":
        case "heavy_gnk":
        case "heavy_gnk-foils":
        case "heavygnk":
        case "heavygnk-foils":
            sailMarkerIcon = sailHGIcon;
            break;
        case "spi leger":
        case "lg":
        case "light gennaker":
        case "light_gnk":
        case "light_gnk-foils":
        case "lightgnk":
        case "lightgnk-foils":
            sailMarkerIcon = sailLGIcon;
            break;
    }
    return sailMarkerIcon;
}