
import {getUserPrefs} from '../../../common/userPrefs.js'
import { mapState,updateBounds } from './map-race.js';
import {buildPt2, darkenColor,buildMarkerTitle,buildCircle,buildMarker,
    buildTrace,buildPath,createProjectionPoint, buildBoatIcon,getSailIcons
} from './map-utils.js'
import {getRaceInfo} from '../../app/memoData.js'
import { onWindTimeChange, windUiState } from './map-wind.js';

let windRouteListenerBound = false;

function getCurrentRaceRoutes()
{
    const raceInfo = getRaceInfo();
    if(!raceInfo) return null;

    const rid = raceInfo.raceId+"-"+raceInfo.legNum;
    return mapState?.route?.[rid] ?? null;
}

function interpolateRoutePosition(projectionData, targetTs)
{
    if(!Array.isArray(projectionData) || projectionData.length === 0 || !targetTs) return null;

    const first = projectionData[0];
    const last = projectionData[projectionData.length - 1];

    if(targetTs <= first.timeStamp)
    {
        return {
            lat: first.lat,
            lon: first.lon,
            heading: first.heading ?? 0,
            timeStamp: first.timeStamp
        };
    }

    if(targetTs >= last.timeStamp)
    {
        return {
            lat: last.lat,
            lon: last.lon,
            heading: last.heading ?? 0,
            timeStamp: last.timeStamp
        };
    }

    for (let i = 1; i < projectionData.length; i++) {
        const prev = projectionData[i - 1];
        const next = projectionData[i];

        if (targetTs > next.timeStamp) continue;

        const span = next.timeStamp - prev.timeStamp;
        const ratio = span <= 0 ? 0 : (targetTs - prev.timeStamp) / span;
        const heading = Math.atan2(next.lon - prev.lon, next.lat - prev.lat) * 180 / Math.PI;

        return {
            lat: prev.lat + ((next.lat - prev.lat) * ratio),
            lon: prev.lon + ((next.lon - prev.lon) * ratio),
            heading,
            timeStamp: targetTs
        };
    }

    return null;
}

function buildRouteBoatTitle(lmapRoute, boatPos)
{
    return (lmapRoute.displayedName || 'Route')
        + '<br>Time: ' + new Date(boatPos.timeStamp).toLocaleString()
        + '<br>Lat/Lon: ' + boatPos.lat.toFixed(4) + ' / ' + boatPos.lon.toFixed(4);
}

function updateRouteBoatMarker(lmapRoute, epochSec)
{
    if(!mapState?.map || !lmapRoute?.projectionData?.length) return;

    const map = mapState.map;
    const targetTs = Number(epochSec) * 1000;
    const boatPos = interpolateRoutePosition(lmapRoute.projectionData, targetTs);

    if(!boatPos)
    {
        if(lmapRoute.boatLayer) map.removeLayer(lmapRoute.boatLayer);
        return;
    }

    if(!lmapRoute.boatLayer) lmapRoute.boatLayer = L.layerGroup();
    lmapRoute.boatLayer.clearLayers();

    const title = buildRouteBoatTitle(lmapRoute, boatPos);
    const icon = buildBoatIcon(lmapRoute.color || '#ffffff', '#000000', 0.8);
    const marker = L.marker([boatPos.lat, boatPos.lon], {
        icon,
        rotationAngle: boatPos.heading ?? 0,
        zIndexOffset: 150
    });
    marker.bindPopup(title);
    marker.on('mouseover', function(e){
        e.target.bindPopup(title).openPopup();
    });
    marker.on('mouseout', function(e){
        e.target.closePopup();
    });
    marker.addTo(lmapRoute.boatLayer);

    if(lmapRoute.displayed) {
        lmapRoute.boatLayer.addTo(map);
    }
}

function updateAllRouteBoatMarkers(epochSec = windUiState.currentUnix)
{
    const routes = getCurrentRaceRoutes();
    if(!routes || !epochSec) return;

    Object.values(routes).forEach((lmapRoute) => {
        updateRouteBoatMarker(lmapRoute, epochSec);
    });
}

function ensureWindRouteListener()
{
    if (windRouteListenerBound) return;

    onWindTimeChange((epochSec) => {
        updateAllRouteBoatMarkers(epochSec);
    });
    windRouteListenerBound = true;
}

export function importRoute(route,name) {
    
    const raceInfo = getRaceInfo();
    if(!mapState|| !mapState.map ||!raceInfo) return;
    
    const userPrefs = getUserPrefs();
    const displayMarkers = userPrefs.map.showMarkers;
    const displaySailsMarkers = userPrefs.map.showSailsMarkers;
    const map = mapState.map;
    const rid = raceInfo.raceId+"-"+raceInfo.legNum;

    mapState.route[rid] = mapState.route[rid] || {};
    mapState.route[rid][name] = mapState.route[rid][name] || [];

    const lmapRoute = mapState.route[rid][name];
    if(!lmapRoute.traceLayer) lmapRoute.traceLayer = L.layerGroup();
    if(!lmapRoute.markersLayer) lmapRoute.markersLayer = L.layerGroup();
    if(!lmapRoute.boatLayer) lmapRoute.boatLayer = L.layerGroup();
    if(!lmapRoute.sailsLayer) lmapRoute.sailsLayer = L.layerGroup();

    lmapRoute.color = route.color;
    lmapRoute.displayedName = route.displayedName;

    lmapRoute.projectionData = [];
    let currentSail = '';
    for (let i = 0 ; i < route.points.length ; i++) {
        const pos = buildPt2(route.points[i].lat, route.points[i].lon);

        mapState.refPoints.push(pos[1]);
        
        lmapRoute.projectionData.push(createProjectionPoint(route.points[i].timestamp,route.points[i].lat, route.points[i].lon)); 

        let circleColor = lmapRoute.color;
        if (currentSail != route.points[i].sail) {
            if (currentSail != '') {
                circleColor = darkenColor(lmapRoute.color, 110);
            }
            currentSail = route.points[i].sail;

            buildMarker(
                buildPt2(route.points[i].lat, route.points[i].lon),
                lmapRoute.sailsLayer, 
                getSailIcons(route.points[i].sail),  
                route.points[i].sail, 
                1, 1,0);
            
            
        }
        buildCircle(pos, lmapRoute.markersLayer, circleColor, 2, 1, buildMarkerTitle(route.points[i]));
    }
    buildTrace(buildPath(route.points), lmapRoute.traceLayer,mapState.refPoints, lmapRoute.color,1,1.5);
    lmapRoute.traceLayer.addTo(map); 
    
    if(displayMarkers) lmapRoute.markersLayer.addTo(map);
    if(displaySailsMarkers) lmapRoute.sailsLayer.addTo(map);
    ensureWindRouteListener();
    lmapRoute.displayed = true;
    updateRouteBoatMarker(lmapRoute, windUiState.currentUnix ?? Math.floor(Date.now() / 1000));
    if(!mapState.userZoom) updateBounds();
}

export function hideRoute(name) {

    const raceInfo = getRaceInfo();
    if(!mapState|| !mapState.map ||!raceInfo) return;
    const map = mapState.map;
    const rid = raceInfo.raceId+"-"+raceInfo.legNum;

    if (!mapState.route?.[rid]?.[name]) return;
    const lmapRoute = mapState.route[rid][name];
    
    if(lmapRoute.traceLayer) { map.removeLayer(lmapRoute.traceLayer); /*delete lmapRoute.traceLayer;*/}
    if(lmapRoute.markersLayer) { map.removeLayer(lmapRoute.markersLayer); /*delete lmapRoute.markersLayer;*/}
    if(lmapRoute.boatLayer) { map.removeLayer(lmapRoute.boatLayer); }
    if(lmapRoute.sailsLayer) { map.removeLayer(lmapRoute.sailsLayer); }

    lmapRoute.displayed = false;

}

export function showRoute(name) {
    const raceInfo = getRaceInfo();
    if(!mapState|| !mapState.map ||!raceInfo) return;
    const map = mapState.map;
    const rid = raceInfo.raceId+"-"+raceInfo.legNum;

    if (!mapState.route?.[rid]?.[name]) return;
    const lmapRoute = mapState.route[rid][name];

    const userPrefs = getUserPrefs();
    const displayMarkers = userPrefs.map.showMarkers;
    const displaySailsMarkers = userPrefs.map.showSailsMarkers;

    if(lmapRoute.traceLayer) lmapRoute.traceLayer.addTo(map);    
    if(lmapRoute.markersLayer && displayMarkers) lmapRoute.markersLayer.addTo(map);
    if(lmapRoute.sailsLayer && displaySailsMarkers) lmapRoute.sailsLayer.addTo(map);

    lmapRoute.displayed = true;
    updateRouteBoatMarker(lmapRoute, windUiState.currentUnix ?? Math.floor(Date.now() / 1000));
}

export function deleteRoute(name) {
    const raceInfo = getRaceInfo();
    if(!mapState|| !mapState.map ||!raceInfo) return;
    const map = mapState.map;
    const rid = raceInfo.raceId+"-"+raceInfo.legNum;

    if (!mapState.route?.[rid]?.[name]) return;
    const lmapRoute = mapState.route[rid][name];

    if(lmapRoute.traceLayer) { map.removeLayer(lmapRoute.traceLayer);}
    if(lmapRoute.markersLayer) { map.removeLayer(lmapRoute.markersLayer); }
    if(lmapRoute.boatLayer) { map.removeLayer(lmapRoute.boatLayer); }
    if(lmapRoute.sailsLayer) { map.removeLayer(lmapRoute.sailsLayer); }

    delete mapState.route[rid][name];

}

export function deleteAllRoutes()
{
    const raceInfo = getRaceInfo();
    if(!raceInfo) return;
    const rid = raceInfo.raceId+"-"+raceInfo.legNum;
    Object.keys(mapState?.route?.[rid]).forEach(function (name) {
        deleteRoute(name); 
    });
    
}

export function onMarkersChange() {
    const raceInfo = getRaceInfo();
    if(!mapState|| !mapState.map ||!raceInfo) return;
    const map = mapState.map;
    const rid = raceInfo.raceId+"-"+raceInfo.legNum;

    const userPrefs = getUserPrefs();
    const displayMarkers = userPrefs.map.showMarkers;

    const markersToggle = document.getElementById('sel_showMarkersLmap');
    if(markersToggle) markersToggle.checked=displayMarkers;

    if(mapState.route[rid])
    {
        Object.keys(mapState.route[rid]).forEach(function (name) {

            if(mapState.route[rid][name].markersLayer )
            {
                if(displayMarkers && mapState.route[rid][name].displayed == true)  
                    mapState.route[rid][name].markersLayer.addTo(map);
                else
                    map.removeLayer(mapState.route[rid][name].markersLayer);
            }
        });
    }

    if(mapState.meLayerMarkers)
    {
        if(displayMarkers )  
            mapState.meLayerMarkers.addTo(map);
        else
        map.removeLayer(mapState.meLayerMarkers);
    }
    if(mapState.fleetLayerMarkers)
    {
        if(displayMarkers)  
            mapState.fleetLayerMarkers.addTo(map);
        else
        map.removeLayer(mapState.fleetLayerMarkers);
    }
}

export function onSailsMarkersChange(displaySailsMarkers) {
    const raceInfo = getRaceInfo();
    if(!mapState|| !mapState.map ||!raceInfo) return;
    const map = mapState.map;
    const rid = raceInfo.raceId+"-"+raceInfo.legNum;

    if(mapState.route[rid])
    {
        Object.keys(mapState.route[rid]).forEach(function (name) {

            if(mapState.route[rid][name].sailsLayer )
            {
                if(displaySailsMarkers && mapState.route[rid][name].displayed == true)  
                    mapState.route[rid][name].sailsLayer.addTo(map);
                else
                    map.removeLayer(mapState.route[rid][name].sailsLayer);
            }
        });
    }
}

export function hideShowTracks() {
    if(!mapState|| !mapState.map ) return;
    const map = mapState.map;

    const userPrefs = getUserPrefs();
    const displayTracks = userPrefs.map.showTracks;
    const tracksToggle = document.getElementById('sel_showTracksLmap');
    if(tracksToggle) tracksToggle.checked=displayTracks;
    if(mapState.fleetLayerTracks)
    {
        if(displayTracks)  
            mapState.fleetLayerTracks.addTo(map);
        else {
            map.removeLayer(mapState.fleetLayerTracks);
            if(mapState.fleetLayerMarkers) 
                    map.removeLayer(mapState.fleetLayerMarkers);
        } 
    }
}
