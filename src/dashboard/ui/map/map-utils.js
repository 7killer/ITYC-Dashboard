import L from '@/dashboard/ui/map/leaflet-setup';
import {formatPosition,formatShortDate,formatDHMS} from '../common.js';

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

    const paths = convertLng0To360(path);
    cpath[cpathNum].push(buildPt(paths[0].lat, (paths[0].lon?paths[0].lon:paths[0].lng)));

    if(path.length >1)
    {
        for (let i = 2; i < paths.length - 1; i++) {
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

    const textHDG = point.heading ? "HDG: <b>" + point.heading.replace(/&deg;/g, "°") + "</b><br>" : "";
    const textTWS = point.tws ? "TWS: " + point.tws + "<br>" : "";
    const textSpeed = point.speed ? "Speed: " + point.speed : "";
    // Data visual separator
    let textTWA = point.twa ? "TWA: <b>" + point.twa.replace(/&deg;/g, "°") + "</b>" : "";
    textTWA += point.twa && point.heading ? "&nbsp;|&nbsp;" : "";

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