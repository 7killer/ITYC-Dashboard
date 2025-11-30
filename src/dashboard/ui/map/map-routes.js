


function importRoute(route,race,name) {
    if (!race || !race.lMap|| !race.lMap.map || !race.lMap.gdiv) return;
    
    var map = race.lMap.map;

    if(!race.lMap.route[name]) race.lMap.route[name] = [];

    var lmapRoute = race.lMap.route[name];
    if(!lmapRoute.traceLayer) lmapRoute.traceLayer = L.layerGroup();
    if(!lmapRoute.markersLayer) lmapRoute.markersLayer = L.layerGroup();

    lmapRoute.color = route.color;
    lmapRoute.displayedName = route.displayedName;

    lmapRoute.projectionData = [];
    let currentSail = '';
    for (var i = 0 ; i < route.points.length ; i++) {
        var pos = buildPt2(route.points[i].lat, route.points[i].lon);

        race.lMap.refPoints.push(pos[1]);
        
        lmapRoute.projectionData.push(createProjectionPoint(route.points[i].timestamp,route.points[i].lat, route.points[i].lon)); 

        let circleSize = 2;
        let circleColor = lmapRoute.color;
        if (currentSail != route.points[i].sail) {
            if (currentSail != '') {
                circleColor = rt.darkenColor(lmapRoute.color, 110);
            }
            currentSail = route.points[i].sail;
        }
        buildCircle(pos, lmapRoute.markersLayer, circleColor, circleSize, 1, rt.buildMarkerTitle(route.points[i]));

        
    }
    buildTrace(buildPath(route.points), lmapRoute.traceLayer,race, lmapRoute.color,1,1.5);
    lmapRoute.traceLayer.addTo(map); 
    
    if(document.getElementById('sel_showMarkersLmap').checked) lmapRoute.markersLayer.addTo(map);
    if(!race.lMap.userZoom) updateBounds(race);
    
    lmapRoute.displayed = true;
    lMapInfos = race.lMap;

}

function hideRoute(race,name) {

    if (!race || !race.lMap|| !race.lMap.map || !race.lMap.gdiv) return;
    if(!race.lMap.route[name]) return;
    var lmapRoute = race.lMap.route[name];
    var map = race.lMap.map;

    if(lmapRoute.traceLayer) { map.removeLayer(lmapRoute.traceLayer); /*delete lmapRoute.traceLayer;*/}
    if(lmapRoute.markersLayer) { map.removeLayer(lmapRoute.markersLayer); /*delete lmapRoute.markersLayer;*/}
    if(lmapRoute.projectionLayer) { map.removeLayer(lmapRoute.projectionLayer); /*delete lmapRoute.projectionLayer;*/}
        
    lmapRoute.displayed = false;    
    lMapInfos = race.lMap;

}

function showRoute(race,name) {
    if (!race || !race.lMap|| !race.lMap.map|| !race.lMap.route || !race.lMap.gdiv) return;
    if(!race.lMap.route[name]) return;
    var lmapRoute = race.lMap.route[name];
    var map = race.lMap.map;
    if(lmapRoute.traceLayer) lmapRoute.traceLayer.addTo(map);
    
    if(lmapRoute.markersLayer && document.getElementById('sel_showMarkersLmap').checked) lmapRoute.markersLayer.addTo(map);
    
    lmapRoute.displayed = true;
    lMapInfos = race.lMap;
}

function deleteRoute(race,name) {
    if (!race || !race.lMap || !race.lMap.gdiv) return;
    if(!race.lMap.route || !race.lMap.route[name]) return;
    var lMapRoute = race.lMap.route[name];

    if(race.lMap.map)
    {
        var map = race.lMap.map;

        if(lMapRoute.traceLayer) { map.removeLayer(lMapRoute.traceLayer);}
        if(lMapRoute.markersLayer) { map.removeLayer(lMapRoute.markersLayer); }
        if(lMapRoute.projectionLayer) { map.removeLayer(lMapRoute.projectionLayer); }
    }
    delete race.lMap.route[name];
        
    lMapInfos = race.lMap;

}

function onMarkersChange(race,markerHideShow) {


    if (!race || !race.lMap|| !race.lMap.map || !race.lMap.gdiv) return;
    
    var map = race.lMap.map;

    Object.keys(race.lMap.route).forEach(function (name) {

        if(race.lMap.route[name].markersLayer )
        {
            if(markerHideShow && race.lMap.route[name].displayed == true)  
                race.lMap.route[name].markersLayer.addTo(map);
            else
                map.removeLayer(race.lMap.route[name].markersLayer);
         }
    });
    if(race.lMap.meLayerMarkers)
    {
        if(markerHideShow )  
            race.lMap.meLayerMarkers.addTo(map);
        else
        map.removeLayer(race.lMap.meLayerMarkers);
    }
    if(race.lMap.fleetLayerMarkers)
    {
        if(markerHideShow)  
            race.lMap.fleetLayerMarkers.addTo(map);
        else
        map.removeLayer(race.lMap.fleetLayerMarkers);
    }
}

function hideShowTracks(race) {
    if (!race || !race.lMap|| !race.lMap.map || !race.lMap.gdiv) return;
    
    var map = race.lMap.map;
    if(race.lMap.fleetLayerMarkers)
    {
        if(document.getElementById('sel_showTracksLmap').checked)  
            race.lMap.fleetLayerTracks.addTo(map);
        else
            map.removeLayer(race.lMap.fleetLayerTracks);
    }
}