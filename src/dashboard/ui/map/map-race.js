
import {getUserPrefs} from '../../../common/userPrefs.js'
import {applyBoundsForCurrentMode, buildPolarCRS, createArcticWMS, computeComfortView} from './map-core.js'
import {initButtonToCenterViewMap,enableCoordinateCopyingWithShortcut} from './map-shortcuts.js'
import {buildPt2, buildMarker,
    buildTextIcon,buildCircleEndRace,
    buildPath_bspline,buildTrace,
    yellowRLIconP, yellowRRIconP, yellowRLIcon, yellowRRIcon,
    redRLIconP, redRLIcon, greenRRIconP, greenRRIcon
} from './map-utils.js'
import {DateUTC,formatPosition
} from '../common.js';

import {getConnectedPlayerId,
        getRaceInfo,
        getLegPlayerInfos,
        getLegFleetInfos,
        getLegSelectedPlayersState,
        setLegSelectedPlayers
} from '../../app/memoData.js'

export const mapState = {
    raceId: null,       // id de la course actuellement affichée
    map: null,          // instance Leaflet
    refPoints: [],      // points pour fitBounds
    refLayer: null,     // layerGroup pour traits de côte / ice / RZ
    route: [],          // routes importées (importRoute / showRoute / hideRoute)
    bounds: null,
    resetUserZoom: 0,
    userZoom: false,
    // couches optionnelles, créées à la demande :
    checkPointLayer: null,
    fleetLayer: null,
    fleetLayerMarkers: null,
    fleetLayerTracks: null,
    wayPointLayer: null,
    meLayer: null,
    meLayerMarkers: null,
    meBoatLayer: null,
    leaderLayer: null,
    leaderMeLayer: null
};
const MAP_CONTAINER_ID = 'lMap';

function updateBounds()
{
    if (!mapState.map) return;
    mapState.bounds = L.latLngBounds(mapState.refPoints);
    mapState.map.fitBounds(mapState.bounds);
}

function updateMapCheckpoints(raceInfo,playerIte) {

   if (!mapState.map) return;
    
    const map = mapState.map;
    
    // checkpoints
    if (!raceInfo || !map) return;

    if(mapState.checkPointLayer)
    {
        map.removeLayer(mapState.checkPointLayer);
    }
    mapState.checkPointLayer = L.layerGroup();
    const userPrefs = getUserPrefs();
    const showInvisibleDoors = userPrefs.map.invisibleBuoy;

    if (Array.isArray(raceInfo.checkpoints)) {
        for (const cp of raceInfo.checkpoints) {
            if (cp.display == "none" && !showInvisibleDoors) {
                continue;
            }
            let cpType = (cp.display && cp.display !== 'none') ? cp.display : 'Invisible';
            cpType = cpType.charAt(0).toUpperCase() + cpType.slice(1);

            const position_s = buildPt2(cp.start.lat, cp.start.lon);
            const position_e = buildPt2(cp.end.lat, cp.end.lon);
            const passed = (playerIte?.ite?.gateGroupCounters && playerIte.ite.gateGroupCounters[cp.group - 1]) ? true : false;

            let op = 1.0;
            if(passed) op = 0.6;
            const label_g = (passed ? "<div class='tagGatePassed'>PASSED</div>" : "") 
                + "Checkpoint " + cp.group + "." + cp.id +  ": <b>" + cp.name + "</b><br>";
            const label_g_more = "<br>Type: <b>" + cpType + "</b> | Engine: " + cp.engine;
            const side_s =  (cp.side == "stbd") ? "Starboard" : "Port";
            const side_e = (cp.side == "stbd") ? "Port" : "Starboard";
            const label_s = label_g + formatPosition(cp.start.lat, cp.start.lon) + label_g_more + " | Side: " + side_s;
            const label_e = label_g + formatPosition(cp.end.lat, cp.end.lon) + label_g_more + " | Side: " + side_e;

            if (cp.display == "buoy" || cp.side == "stbd") {
                const iconStart = (cp.side == "stbd")?(passed?greenRRIconP:greenRRIcon):(passed?redRLIconP:redRLIcon);
                const iconEnd = (cp.side == "stbd")?(passed?redRLIconP:redRLIcon):(passed?greenRRIconP:greenRRIcon);
                buildMarker(position_s, mapState.checkPointLayer, iconStart, label_s, 8, op,0);
                buildMarker(position_e, mapState.checkPointLayer, iconEnd, label_e, 8, op,0);
            } else {
                const iconStart = (cp.side == "stbd")?(passed?yellowRRIconP:yellowRRIcon):(passed?yellowRLIconP:yellowRLIcon)
                buildMarker(position_s, mapState.checkPointLayer, iconStart, label_s, 8, op,0);
            }
            mapState.refPoints.push(position_e[1]);
            mapState.refPoints.push(position_s[1]);
            const pathColor = passed?"green":"yellow";
            const tpath = [];
            tpath.push(position_e[1]);
            tpath.push(position_s[1]);
            buildTrace(buildPath(tpath),mapState.checkPointLayer,mapState.refPoints,pathColor,1,op,'20, 20','10');               
        }
    }
    mapState.checkPointLayer.addTo(map); 
    if(!mapState.userZoom) updateBounds();
}

function updateMapWaypoints(playerIte) {
    const raceOrder = getLegPlayersOrder();
    if (!mapState || !mapState.map || !mapState.gdiv) return;
    const map = mapState.map;

    if (!playerIte?.ite) return; // current position unknown
    if(!raceOrder && raceOrder[0].action.type !== "wp") return; //last order not wp

    if(mapState.wayPointLayer)
    {
        map.removeLayer(mapState.wayPointLayer);
    }
    mapState.wayPointLayer = L.layerGroup();

    const wpOrder = raceOrder[0].action.action;  
    const lastWpIdx = playerIte.ite.lastWpIdx;
    const currPos = playerIte.ite.pos;
    
    // Waypoint lines already passed
    let wpPts = [];
    wpOrder.forEach(({ lat, lon, idx }) => {
        if(idx <= lastWpIdx) wpPts.push({lat,lon});
    });
    let cpath = buildPath(wpPts,null,null,currPos.lat, currPos.lon);
    buildTrace(cpath,mapState.wayPointLayer,mapState.refPoints,"#FF00FF",1.5,0.7,[0,1,0,1]);

    // Waypoint lines    
    wpPts = [];
    wpOrder.forEach(({ lat, lon, idx }) => {
        if(idx > lastWpIdx) wpPts.push({lat,lon});
    });
    
    cpath = buildPath(wpOrder,currPos.lat, currPos.lon);
    buildTrace(cpath,mapState.wayPointLayer,mapState.refPoints,"#FF00FF",1.5,0.7);
    // Waypoint markers
    wpOrder.forEach(({ lat, lon, idx }) => {
        const pos = buildPt2(lat, lon);
        const title = formatPosition(lat, lon);
        buildCircle(pos,mapState.wayPointLayer,"#FF00FF", 2,1, title);
        mapState.refPoints.push(pos[1]);
    });     
    mapState.wayPointLayer.addTo(map); 
    if(!mapState.userZoom) updateBounds();
}
function updateMapMe(race, track) {
    if (!race || !mapState|| !mapState.map || !mapState.gdiv) return;
    
    const map = mapState.map;

    if(!mapState.meLayer) mapState.meLayer  = L.layerGroup();
    if(!mapState.meBoatLayer) mapState.meBoatLayer  = L.layerGroup();
    if(!mapState.meLayerMarkers) mapState.meLayerMarkers  = L.layerGroup();

    // track

    if (track) {

        if(mapState.meLayer) map.removeLayer(mapState.meLayer);
        if(mapState.meLayerMarkers) map.removeLayer(mapState.meLayerMarkers);
        mapState.meLayer  = L.layerGroup();
        mapState.meLayerMarkers  = L.layerGroup();

        for (var i = 0; i < track.length; i++) {
            var segment = track[i];
            var pos = buildPt2(segment.lat, segment.lon);
            if(displayFilter & 0x200) {
                if (i > 0) {
                    var deltaT = (segment.ts -  track[i-1].ts) / 1000;
                    var deltaD =  Util.gcDistance(track[i-1], segment);
                    var speed = Util.roundTo(Math.abs(deltaD / deltaT * 3600), 2);
                    var timeStamp = Util.formatShortDate(segment.ts,undefined,(displayFilter & 0x800));
                    var title =  "Me " + "<br><b>" + timeStamp + "</b> | Speed: " + speed + " kts<br>" + Util.formatPosition(segment.lat, segment.lon) + (segment.tag ? "<br>(Type: " + segment.tag + ")" : "");
                    var trackcolor = "#b86dff";
                    buildCircle(pos, mapState.meLayerMarkers,trackcolor, 1.5 ,1, title);
                    mapState.refPoints.push(pos[1]);
                }
            }
        }
        var cpath = buildPath(track, undefined, undefined, race.curr.pos.lat, race.curr.pos.lon);
        buildTrace(cpath, mapState.meLayer, race, "#b86dff", 1.5, 1);
    }        
    
    // boat
    if (race.curr && race.curr.pos) {
        var pos = buildPt2(race.curr.pos.lat, race.curr.pos.lon);

        if(mapState.meBoatLayer) map.removeLayer(mapState.meBoatLayer);
        mapState.meBoatLayer  = L.layerGroup();

        var title = "Me (Last position: " + Util.formatTimestampToReadableDate(race.curr.lastCalcDate, 1) + ")<br>TWA: <b>" + Util.roundTo(race.curr.twa, 3) + "°</b>"
                    + " | HDG: <b>" + Util.roundTo(race.curr.heading, 2) + "°</b>"
                    + "<br>Sail: " + sailNames[race.curr.sail] + " | Speed: " + Util.roundTo(race.curr.speed, 3) + " kts"
                    + "<br>TWS: " + Util.roundTo(race.curr.tws, 3) + " kts | TWD: " + Util.roundTo(race.curr.twd, 3) + "°";

        buildMarker(pos, mapState.meBoatLayer, buildBoatIcon("#b86dff","#000000",0.4), title,  200, 0.5,race.curr.heading);
     }

    
    if(document.getElementById('sel_showMarkersLmap').checked)
       mapState.meLayerMarkers.addTo(map);                
    mapState.meLayer.addTo(map);           
    mapState.meBoatLayer.addTo(map); 
    if(!mapState.userZoom) updateBounds();    
    lMapInfos = mapState;

}
function updateMapLeader(race) {

    if (!race || !mapState|| !mapState.map || !mapState.gdiv) return;

    if (!race.curr) return;
    if (!race.curr.startDate) return;
    
    var map = mapState.map;
    var d = new Date();
    var offset = d - race.curr.startDate;

    // track
    if (race.leaderTrack && race.leaderTrack.length > 0) {
        if(mapState.leaderLayer) map.removeLayer(mapState.leaderLayer);
        mapState.leaderLayer = L.layerGroup(); 

        addGhostTrack(race,race.leaderTrack, "Leader: <b>" + race.leaderName + "</b><br>Elapsed: " + Util.formatDHMS(offset), offset, "#FF8C00", mapState.leaderLayer);
    }
    if (race.myTrack && race.myTrack.length > 0) {
        if(mapState.leaderMeLayer) map.removeLayer(mapState.leaderMeLayer);
        mapState.leaderMeLayer = L.layerGroup(); 
        addGhostTrack(race,race.myTrack, "<b>Best Attempt</b><br>Elapsed: " + Util.formatDHMS(offset), offset, "#b86dff", mapState.leaderMeLayer);
    }
    lMapInfos = mapState;

}
function addGhostTrack (race,ghostTrack, title, offset, color,layer) {
    
    if (!race || !mapState|| !mapState.map || !mapState.gdiv) return;
    
    var map = mapState.map;

    var ghostStartTS = ghostTrack[0].ts;
    var ghostPosTS = ghostStartTS + offset;
    var ghostPos;
    for (var i = 0; i < ghostTrack.length; i++) {
        pos = buildPt2(ghostTrack[i].lat, ghostTrack[i].lon);
        mapState.refPoints.push(pos[1]);
                
        if (!ghostPos) {
            if (ghostTrack[i].ts >= ghostPosTS) {
                ghostPos = i;
            }
        }
    }
       
    buildTrace(buildPath(ghostTrack),layer,race, color,1,0.6,'10, 10','5');


    if (ghostPos) {
        var lat1 = ghostTrack[ghostPos].lat;
        var lon1 = ghostTrack[ghostPos].lon
        var lat0 = ghostTrack[Math.max(ghostPos - 1, 0)].lat;
        var lon0 = ghostTrack[Math.max(ghostPos - 1, 0)].lon;
        var heading = Util.courseAngle(lat0, lon0, lat1, lon1) * 180 / Math.PI;
        var d = (ghostPosTS - ghostTrack[ghostPos - 1].ts ) / (ghostTrack[ghostPos].ts - ghostTrack[ghostPos - 1].ts)
        var lat = lat0 + (lat1-lat0) * d;
        var lon = lon0 + (lon1-lon0) * d;
        var pos = buildPt2(lat, lon);
        buildMarker(pos,layer, buildBoatIcon(color,color,0.6), title,  20, 0.4,heading);
    }

    layer.addTo(map); 
    if(!mapState.userZoom) updateBounds();
}


function updateMapFleet(race,raceFleetMap) {

    if (!race || !mapState|| !mapState.map  || !mapState.gdiv) return;
    
    var map = mapState.map;

    if(mapState.fleetLayer) map.removeLayer(mapState.fleetLayer);
    if(mapState.fleetLayerMarkers) map.removeLayer(mapState.fleetLayerMarkers);
    if(mapState.fleetLayerTracks) map.removeLayer(mapState.fleetLayerTracks);

    mapState.fleetLayer = L.layerGroup();
    mapState.fleetLayerMarkers = L.layerGroup();
    mapState.fleetLayerTracks = L.layerGroup();


    // opponents/followed
    var fleet = raceFleetMap.get(race.id);

    Object.keys(fleet.uinfo).forEach(function (key) {
        var elem = fleet.uinfo[key];
        var bi = boatinfo(key, elem);

        if (isDisplayEnabled(elem, key)) {
            var pos = buildPt2(elem.pos.lat, elem.pos.lon);
            // Boat
            // Organisation z-index
            var zi;
            if (key == currentId){
                zi = 50;    // Me
                drawProjectionLine(race,pos,elem.heading,elem.speed) ;   
            } else if (elem.type == "top") {
                zi = 49;    // Top VSR
            } else if (elem.teamname == currentTeam) {
                zi = 48;    // Team
            } else if (elem.isFollowed) {
                zi = 47;    // Friend
            } else if (elem.type == "sponsor" ) {
                zi = 46;    // Color Sponsor
            } else {
                zi = 44;    // Real   // Opponent
            }
            
            // Add names to real skippers if data exists
            var nameAddSkipperName = '';
            if (elem.extendedInfos && elem.extendedInfos.skipperName) nameAddSkipperName = elem.extendedInfos.boatName + '</span><br><b>' + elem.extendedInfos.skipperName + '</b>';

            if (nameAddSkipperName != '') bi.name = '<span class="txtUpper">' + nameAddSkipperName;
            else bi.name = bi.name;

            if (elem.type == 'real') {
                var info = bi.name + "<br>HDG: <b>" + Util.roundTo(bi.heading, 2) + "°</b> | Speed: " + Util.roundTo(bi.speed, 3) + " kts";
                if (bi.twa > 0) info += "<br>TWA: <b>" + Util.roundTo(bi.twa, 3) + "°</b>";
                if (bi.sail != "-") info += " | Sail: " + bi.sail;
                if (bi.tws > 0) info += "<br>TWS: " + Util.roundTo(bi.tws, 3) + " kts";
                if (bi.twd > 0) info += " | TWD: " + Util.roundTo(bi.twd, 3) + "°";
            }
            else {
                var info = bi.name + "<br>TWA: <b>" + Util.roundTo(bi.twa, 3) + "°</b> | HDG: <b>" + Util.roundTo(bi.heading, 2) + "°</b><br>Sail: " + bi.sail + " | Speed: " + Util.roundTo(bi.speed, 3) + " kts<br>TWS: " + Util.roundTo(bi.tws, 3) + " kts | TWD: " + Util.roundTo(bi.twd, 3) + "°";
            }
            if (race.type == "record") {
                if (key == currentId && elem.tsRecord && race.curr.startDate) {
                    info += "<br>Elapsed: <b>" + Util.formatDHMS(elem.tsRecord - race.curr.startDate) + "</b>";
                }
                else if (elem.startDate && elem.tsRecord) {
                    info += "<br>Elapsed: <b>" + Util.formatDHMS(elem.tsRecord - elem.startDate) + "</b>";
                }
            }

            buildMarker(pos, mapState.fleetLayer,buildBoatIcon(bi.bcolor,bi.bbcolor,0.8), info,  zi, 0.8,elem.heading);
                
            // track
            if (elem.track && elem.track.length != 0) {

                for (var i = 0; i < elem.track.length; i++) {
                    var segment = elem.track[i];
                    var pos2 = buildPt2(segment.lat, segment.lon);

                    mapState.refPoints.push(pos2[1]);
                    if(displayFilter & 0x200) {
                        if ((i > 0) && ((key != currentId)
                                        || elem.isFollowed
                                        || elem.followed))
                        {
                                var deltaT = (segment.ts -  elem.track[i-1].ts) / 1000;
                                var deltaD =  Util.gcDistance(elem.track[i-1], segment);
                                var speed = Util.roundTo(Math.abs(deltaD / deltaT * 3600), 2);
                                var timeStamp = Util.formatShortDate(segment.ts,undefined,(displayFilter & 0x800));
                                var title = elem.displayName + "<br><b>" + timeStamp + "</b> | Speed: " + speed + " kts" + "<br>" + Util.formatPosition(elem.pos.lat, elem.pos.lon) + (segment.tag ? "<br>(Type: " + segment.tag + ")" : "");

                                buildCircle(pos2,mapState.fleetLayerMarkers,bi.bcolor, 1.5,1,title);
                        }
                    }
                }

                var cpath = buildPath(elem.track,undefined,undefined,elem.pos.lat, elem.pos.lon);    
                buildTrace(cpath,mapState.fleetLayerTracks,race, bi.bcolor,1,1);    

            }
        }
    });
    mapState.fleetLayer.addTo(map); 
    if(document.getElementById('sel_showMarkersLmap').checked)
        mapState.fleetLayerMarkers.addTo(map); 
    if(document.getElementById('sel_showTracksLmap').checked)
        mapState.fleetLayerTracks.addTo(map); 

    if(!mapState.userZoom) updateBounds();
    lMapInfos = mapState;

}
function cleanMap() {
    // on cache juste le conteneur global
    const existingMap = document.getElementById(MAP_CONTAINER_ID);
    if (existingMap) {
        existingMap.style.visibility = "hidden";
        existingMap.style.height = "0px";
        existingMap.style.width = "0px";
    }

    // l'état Leaflet reste en mémoire ; si tu veux vraiment tout purger, tu peux faire :
    if (mapState.map) {
        mapState.map.off();
        mapState.map.remove();
    }
    mapState.map = null;
    mapState.raceId = null;
}

function getOrCreateMapContainer() {
    const tab = document.getElementById("tab-content3");
    if (!tab) return null;

    let divMap = document.getElementById(MAP_CONTAINER_ID);
    if (!divMap) {
        divMap = document.createElement('div');
        divMap.id = MAP_CONTAINER_ID;
        divMap.style.height = "100%";
        divMap.style.display = "flex";
        divMap.style.width = "90%";
        tab.appendChild(divMap);
    }

    // on le (re)rend visible
    divMap.style.visibility = "visible";
    divMap.style.height = "100%";
    divMap.style.width = "90%";

    return divMap;
}

export async function initialize(raceFleetMap)
{
    function set_userCustomZoom(e)
    {
        if(mapState.resetUserZoom > 0)
            mapState.userZoom = true;
        else    mapState.resetUserZoom += 1;
        
        if(e && e.target) if(e.target._zoom > 5 ) 
        {
            const mapcenter = mapState.map.getCenter();
            const lon = mapcenter.lng; 
//            EX.loadBorder(race,mapcenter.lat,lon);
        }
    }

    const tab = document.getElementById("tab-content3");
    if (!tab) return;
    if (getComputedStyle(tab).display === "none") {
        // onglet masqué : on ne fait rien (évite les soucis de taille initiale)
        return;
    }

    const raceInfo = getRaceInfo();
    const playerItes = getLegPlayerInfos();
    const raceItesFleet    = getLegFleetInfos();
    const connectedPlayerId = getConnectedPlayerId();
    
    if (playerItes && playerItes.ites && playerItes.ites.length > 0) {
        playerItes.ite = playerItes.ites[0];
    }

    const rid = raceInfo.raceId+"_"+raceInfo.legNum;

    const divMap = getOrCreateMapContainer();
    if (!divMap) return;
    if(!raceInfo || raceInfo?.length == 0 ) return;
    if (mapState.map && mapState.raceId === rid) {
        mapState.map.invalidateSize();
        applyBoundsForCurrentMode(mapState.map);

        // couches dynamiques
        updateBounds();
        updateMapCheckpoints(raceInfo);
        updateMapFleet(raceInfo, raceItesFleet);
        updateMapWaypoints(playerItes);
        updateMapLeader(raceInfo);
        updateMapMe(raceInfo,playerIte);
        initButtonToCenterViewMap(playerIte.pos.lat, playerIte.pos.lon, mapState.map);
        enableCoordinateCopyingWithShortcut();
        return;
    }

    if (mapState.map) {
        mapState.map.off();
        mapState.map.remove();
        mapState.map = null;
    }

    mapState.refPoints = [];
    mapState.refLayer = L.layerGroup();
    // mapState.route : on peut décider de le conserver par course dans une Map si tu veux,
    // mais pour l’instant on le repart à zéro :
    //mapState.route = {};

    mapState.resetUserZoom = 0;
    mapState.userZoom = false;
    mapState.raceId = race.id;

    let mapTileColorFilterDarkMode = [
        'invert:100%',
        'bright:106%',
        'contrast:121%',
        'hue:195deg',
        'saturate:43%'
    ];

    const Esri_WorldImagery = L.tileLayer(
        'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
            minZoom: 2, maxZoom: 40, maxNativeZoom: 40,
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, ' +
                         'AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        }
    );

    const OSM_Layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 2, maxZoom: 40, maxNativeZoom: 40,
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    });

    const OSM_DarkLayer = L.tileLayer.colorFilter('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 2, maxZoom: 40, maxNativeZoom: 40,
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        filter: mapTileColorFilterDarkMode                
    });

    const Arctic_WMS = createArcticWMS();

    const baseLayers = {
        "Carte": OSM_Layer,
        "Dark": OSM_DarkLayer,
        "Satellite": Esri_WorldImagery
    };
    if (Arctic_WMS) {
        baseLayers["Arctic (EPSG:3413)"] = Arctic_WMS;
    }

    const userPrefs = getUserPrefs();
    const userBaseMap = userPrefs.map.selectBaseMap;

    let selectBaseMap = OSM_Layer;
    if (userBaseMap === "Dark") selectBaseMap = OSM_DarkLayer;
    else if (userBaseMap === "Satellite") selectBaseMap = Esri_WorldImagery;
    else if (userBaseMap === "Arctic (EPSG:3413)" && Arctic_WMS) selectBaseMap = Arctic_WMS;

    const usingPolar = (selectBaseMap === Arctic_WMS) && !!POLAR.crs;
    POLAR.enabled = usingPolar;

    let map = L.map(MAP_CONTAINER_ID, {
        layers: [selectBaseMap],
        crs: usingPolar ? POLAR.crs : L.CRS.EPSG3857
    });

    mapState.map = map;
    lMapInfos = mapState;    

    
    const layerControl = L.control.layers(baseLayers, null, { position: 'topright' });
    layerControl.addTo(map);
    ensureLayerControlClickable(layerControl);

    async function onBaseLayerChange(e) {
        await saveLocal("selectBaseMap", e.name);

        const isArctic = (e.layer === Arctic_WMS);
        const wasArctic = !!POLAR.enabled;

        if (hasProj4Leaflet() && (isArctic !== wasArctic)) {
            const center = map.getCenter();
            const zoom   = map.getZoom();

            map.off('baselayerchange', onBaseLayerChange);
            map.off('zoomend', set_userCustomZoom);
            map.remove();

            POLAR.enabled = isArctic;

            const activeBase = isArctic
                ? Arctic_WMS
                : (e.name === 'Dark'
                    ? OSM_DarkLayer
                    : (e.name === 'Satellite' ? Esri_WorldImagery : OSM_Layer));

            const newMap = L.map(MAP_CONTAINER_ID, {
                crs: isArctic ? (POLAR.crs || buildPolarCRS()) : L.CRS.EPSG3857,
                layers: [activeBase],
                zoomAnimation: false,
                fadeAnimation: false
            });

            mapState.map = newMap;
            map = newMap;

            newMap.once('load', () => newMap.invalidateSize());
            const comfy = computeComfortView(isArctic, center, zoom);
            requestAnimationFrame(() => {
                newMap.setView(comfy.center, comfy.zoom, { animate: false });
                newMap.invalidateSize();
                setTimeout(() => newMap.invalidateSize(), 0);
            });

            const newBaseLayers = {
                "Carte": OSM_Layer,
                "Dark": OSM_DarkLayer,
                "Satellite": Esri_WorldImagery
            };
            if (Arctic_WMS) newBaseLayers["Arctic (EPSG:3413)"] = Arctic_WMS;
            const newLayerControl = L.control.layers(newBaseLayers);
            newLayerControl.addTo(newMap);
            ensureLayerControlClickable(newLayerControl);

            newMap.addControl(new L.Control.ScaleNautic({
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
            L.control.ruler(optionsRuler).addTo(newMap);

            L.control.coordinates({
                useDMS: true,
                labelTemplateLat: "Lat: {y}",
                labelTemplateLng: " Lng: {x}",
                useLatLngOrder: true,
                labelFormatterLat: function (lat) {
                    let latFormatted = L.NumberFormatter.toDMS(lat);
                    latFormatted = latFormatted.replace(/''$/, '"') + (latFormatted.startsWith('-') ? ' S' : ' N');
                    return latFormatted.replace(/^-/, '');
                },
                labelFormatterLng: function (lng) {
                    let lngFormatted = L.NumberFormatter.toDMS(lng);
                    lngFormatted = lngFormatted.replace(/''$/, '"') + (lngFormatted.startsWith('-') ? ' W' : ' E');
                    return '<span class="labelGeo">' + lngFormatted.replace(/^-/, '') + '</span>';
                },
            }).addTo(newMap);

            if (mapState.refLayer) mapState.refLayer.addTo(newMap);

            applyBoundsForCurrentMode(newMap);

            newMap.on('zoomend', set_userCustomZoom);
            newMap.on('baselayerchange', onBaseLayerChange);

            // re-appliquer les couches dynamiques pour la course courante
            const raceInfo = getRaceInfo();
            const playerItes = getLegPlayerInfos();
            const raceItesFleet    = getLegFleetInfos();
            const connectedPlayerId = getConnectedPlayerId();
    
            if (playerItes && playerItes.ites && playerItes.ites.length > 0) {
                playerItes.ite = playerItes.ites[0];
            }
            updateBounds(raceInfo);
            updateMapCheckpoints(raceInfo);
            updateMapFleet(raceInfo, raceItesFleet);
            updateMapWaypoints(playerItes);
            updateMapLeader(raceInfo);
            updateMapMe(raceInfo);
            lMapInfos = mapState;
            return;
        }

        POLAR.enabled = isArctic;
        applyBoundsForCurrentMode(map);
    }

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

    L.control.coordinates({
        useDMS: true,
        labelTemplateLat: "Lat: {y}",
        labelTemplateLng: " Lng: {x}",
        useLatLngOrder: true,
        labelFormatterLat: function (lat) {
            let latFormatted = L.NumberFormatter.toDMS(lat);
            latFormatted = latFormatted.replace(/''$/, '"') + (latFormatted.startsWith('-') ? ' S' : ' N');
            return latFormatted.replace(/^-/, '');
        },
        labelFormatterLng: function (lng) {
            let lngFormatted = L.NumberFormatter.toDMS(lng);
            lngFormatted = lngFormatted.replace(/''$/, '"') + (lngFormatted.startsWith('-') ? ' W' : ' E');
            return '<span class="labelGeo">' + lngFormatted.replace(/^-/, '') + '</span>';
        },
    }).addTo(map);

    map.attributionControl.addAttribution('&copy;SkipperDuMad / Trait de cotes &copy;Kurun56');

    mapState.refLayer = L.layerGroup();

    //start end
    const title1 = "Start: <b>" + raceInfo.start.name + "</b><br>"
                + formatPosition(raceInfo.start.lat, raceInfo.start.lon);
    
    const latlng = buildPt2(raceInfo.start.lat, raceInfo.start.lon);
    buildMarker(latlng,mapState.refLayer,buildTextIcon('','white','blue',"S"),title1,0);
    mapState.refPoints.push(latlng[1]);
    
    title1 =  "Finish: <b>" + raceInfo.end.name  + "</b><br>"
        + formatPosition(raceInfo.end.lat, raceInfo.end.lon);
    latlng = buildPt2(raceInfo.end.lat,raceInfo.end.lon);
    buildMarker(latlng,mapState.refLayer,buildTextIcon('','yellow','red',"F"),title1,0);
    mapState.refPoints.push(latlng[1]);
    
    buildCircleEndRace(latlng,mapState.refLayer, 'red', raceInfo.end.radius * 1852.0);
    
    // course
    const cpath = buildPath_bspline(raceInfo.course,raceInfo.start.lat,raceInfo.start.lon,raceInfo.end.lat,raceInfo.end.lon);
    const raceLine = buildTrace(cpath,mapState.refLayer,mapState.refPoints,"white",1,0.5);
    for(var i=0;i<raceLine.length;i++) 
    {
        L.polylineDecorator(raceLine[i], {
            patterns: [
                {offset: '5%', repeat: '10%', symbol: L.Symbol.arrowHead({pixelSize: 15, pathOptions: {fillOpacity: 0.5, weight: 1, color :'white'}})}
            ]
        }).addTo(mapState.refLayer);
    }

    //  Ice limits
    const south = raceInfo?.ice_limits?.south;
    if (Array.isArray(south) && south.length !== 0) 
    {
        const isDummy = (south.length === 5
        && south[0].lat === -90 && south[0].lon === -180
        && south[2].lat === -90 && south[2].lon === 0
        && south[4].lat === -90 && south[4].lon === 180);

        if(!isDummy)
        {
            const iceDataMiddleIndex = Math.ceil(iceData.length / 2);
            const iceDataFirstHalf = iceData.slice(0, iceDataMiddleIndex);
            const iceDataSecondHalf = iceData.slice(iceDataMiddleIndex);
            buildTrace(buildPath(iceDataFirstHalf),mapState.refLayer,mapState.refPoints,"#FF0000",1.5,0.5,false);
            buildTrace(buildPath(iceDataSecondHalf),mapState.refLayer,mapState.refPoints,"#FF0000",1.5,0.5,false);
            if (Util.isOdd(iceData.length)) buildTrace(buildPath([iceDataFirstHalf[iceDataFirstHalf.length - 1], iceDataSecondHalf[0]]),mapState.refLayer,mapState.refPoints,"#FF0000",1.5,0.5,false);    
        }
    }
    const rz = raceInfo?.restrictedZones;
    if (Array.isArray(rz) && rz.length !== 0) {
        for (const z of rz) {
            let polygonPts0 = [];
            let polygonPts1 = [];
            let polygonPts2 = [];
            let restrictedZoneColor = "red";
            if(z.color) restrictedZoneColor = z.color;
            for (const p of (z.vertices || [])) {
                polygonPts0.push([p.lat, p.lon]);
                polygonPts1.push([p.lat, p.lon-360]);
                polygonPts2.push([p.lat, p.lon+360]);
            }
            L.polygon(polygonPts0,
            {
                color: restrictedZoneColor,
                stroke : 0.35,
                weight : 1,
            }).addTo(mapState.refLayer);
            L.polygon(polygonPts1,
            {
                color: restrictedZoneColor,
                stroke : 0.35,
                weight : 1,
            }).addTo(mapState.refLayer);
            L.polygon(polygonPts2,
            {
                color: restrictedZoneColor,
                stroke : 0.35,
                weight : 1,
            }).addTo(mapState.refLayer);

        }
    }
    mapState.refLayer.addTo(map);
    updateBounds(raceInfo);
    updateMapCheckpoints(raceInfo);
    updateMapFleet(raceInfo, raceItesFleet);

    if(mapState.route[rid] && mapState.route[rid].length !==0) {
        Object.keys(mapState.route[rid]).forEach(function (name) {
            var lMapRoute = mapState.route[rid][name];
            var map = mapState.map;
            if(lMapRoute.displayed)
            {
                if(lMapRoute.traceLayer) lMapRoute.traceLayer.addTo(map);
                if(lMapRoute.markersLayer && document.getElementById('sel_showMarkersLmap').checked) lMapRoute.markersLayer.addTo(map);
            }
        });
    }

    updateMapWaypoints(playerItes);
    updateMapLeader(raceInfo);
    updateMapMe(raceInfo);

    set_userCustomZoom(false);
    applyBoundsForCurrentMode(map);

    map.on('baselayerchange', onBaseLayerChange);
    map.on('zoomend',set_userCustomZoom);

    mapState.map = map;
    initButtonToCenterViewMap(playerIte.pos.lat, playerIte.lon, mapState.map);
    enableCoordinateCopyingWithShortcut();
    
}


