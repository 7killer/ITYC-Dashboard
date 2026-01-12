

import {getUserPrefs} from '../../../common/userPrefs.js'
import { mapState,updateBounds } from './map-race.js';
import {buildPt2, darkenColor,buildMarkerTitle,buildCircle,
    buildTrace,buildPath,createProjectionPoint
} from './map-utils.js'
import {getRaceInfo} from '../../app/memoData.js'
export function importRoute(route,name) {
    
    const raceInfo = getRaceInfo();
    if(!mapState|| !mapState.map ||!raceInfo) return;
    
    const userPrefs = getUserPrefs();
    const displayMarkers = userPrefs.map.showMarkers;
    const map = mapState.map;
    const rid = raceInfo.raceId+"-"+raceInfo.legNum;

    mapState.route[rid] = mapState.route[rid] || {};
    mapState.route[rid][name] = mapState.route[rid][name] || [];

    const lmapRoute = mapState.route[rid][name];
    if(!lmapRoute.traceLayer) lmapRoute.traceLayer = L.layerGroup();
    if(!lmapRoute.markersLayer) lmapRoute.markersLayer = L.layerGroup();

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
        }
        buildCircle(pos, lmapRoute.markersLayer, circleColor, 2, 1, buildMarkerTitle(route.points[i]));
    }
    buildTrace(buildPath(route.points), lmapRoute.traceLayer,mapState.refPoints, lmapRoute.color,1,1.5);
    lmapRoute.traceLayer.addTo(map); 
    
    if(displayMarkers) lmapRoute.markersLayer.addTo(map);
    if(!mapState.userZoom) updateBounds();
    lmapRoute.displayed = true;
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
    if(lmapRoute.projectionLayer) { map.removeLayer(lmapRoute.projectionLayer); /*delete lmapRoute.projectionLayer;*/}
        
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

    if(lmapRoute.traceLayer) lmapRoute.traceLayer.addTo(map);
    
    if(lmapRoute.markersLayer && displayMarkers) lmapRoute.markersLayer.addTo(map);
    
    lmapRoute.displayed = true;
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
    if(lmapRoute.projectionLayer) { map.removeLayer(lmapRoute.projectionLayer); }

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

    document.getElementById('sel_showMarkersLmap').checked=displayMarkers;

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

export function hideShowTracks() {
    if(!mapState|| !mapState.map ) return;
    const map = mapState.map;

    const userPrefs = getUserPrefs();
    const displayTracks = userPrefs.map.showTracks;
    document.getElementById('sel_showTracksLmap').checked=displayTracks;
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