
import {getUserPrefs} from '../../../common/userPrefs.js'
import {ensureLayerControlClickable,applyBoundsForCurrentMode, buildPolarCRS, createArcticWMS, computeComfortView} from './map-core.js'
import {initButtonToCenterViewMap,enableCoordinateCopyingWithShortcut} from './map-shortcuts.js'
import {buildPt2, buildMarker,
    buildTextIcon,buildCircleEndRace,
    buildPath_bspline,buildTrace,buildPath,buildBoatIcon,
    yellowRLIconP, yellowRRIconP, yellowRLIcon, yellowRRIcon,
    redRLIconP, redRLIcon, greenRRIconP, greenRRIcon
} from './map-utils.js'
import {formatPosition,formatShortDate,formatTimestampToReadableDate,formatDHMS
} from '../common.js';
import {sailNames,sailColors,categoryStyle, categoryStyleDark,category} from "../constant.js"

import {getConnectedPlayerId,
        getRaceInfo,
        getLegPlayerInfos,
        getLegFleetInfos,
        getLegPlayersTracksFleet,
        getLegPlayersTrackLeader,
        getLegPlayersOrder
} from '../../app/memoData.js'
import {isDisplayEnabled} from '../../app/sortManager.js'

import { gcDistance, roundTo} from '../../../common/utils.js';

import {drawProjectionLine} from './map-proj.js'

import L from '@/dashboard/ui/map/leaflet-setup';

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
    leaderMeLayer: null,
    
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
    if (!mapState || !mapState.map) return;
    const map = mapState.map;

    if (!playerIte) return; // current position unknown
    if(!raceOrder || raceOrder.lenght==0 || raceOrder[0]?.action?.type !== "wp") return; //last order not wp

    if(mapState.wayPointLayer)
    {
        map.removeLayer(mapState.wayPointLayer);
    }
    mapState.wayPointLayer = L.layerGroup();

    const wpOrder = raceOrder[0].action.action;  
    const lastWpIdx = playerIte.lastWpIdx;
    const currPos = playerIte.pos;
    
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

function updateMapMe(connectedPlayerId,playerIte) {
    const trackFleet = getLegPlayersTracksFleet();
    const userPrefs = getUserPrefs();
    const localTimes = userPrefs.global.localTime;
    const displayMarkers = userPrefs.map.showMarkers;

    if (!mapState|| !mapState.map) return;
    /*todo scinder trace et position*/
    const map = mapState.map;
    const myTrack = trackFleet[connectedPlayerId].track;

    if(!mapState.meLayer) mapState.meLayer  = L.layerGroup();
    if(!mapState.meBoatLayer) mapState.meBoatLayer  = L.layerGroup();
    if(!mapState.meLayerMarkers) mapState.meLayerMarkers  = L.layerGroup();

    if(mapState.meLayer) map.removeLayer(mapState.meLayer);
    if(mapState.meLayerMarkers) map.removeLayer(mapState.meLayerMarkers);
    if(mapState.meBoatLayer) map.removeLayer(mapState.meBoatLayer);
    mapState.meLayer  = L.layerGroup();
    mapState.meLayerMarkers  = L.layerGroup();
    mapState.meBoatLayer  = L.layerGroup();
    
    const myPos = {lat :playerIte.pos.lat, lon:playerIte.pos.lon};
    if(trackFleet && trackFleet.lenght !=0 && trackFleet[connectedPlayerId]?.track)
    {
        let myTrackPts = [];
        let isFirst = false;
        let prevPt = null;
        myTrack.forEach(({ lat, lon, ts,tag}) => {
            myTrackPts.push({lat,lon});
            if(isFirst)
            {
                const title =  "Me " 
                            + "<br><b>" 
                            + formatShortDate(ts,undefined,localTimes) 
                            + "</b> | Speed: " 
                            + roundTo(Math.abs(gcDistance(myPos, {lat, lon}) / ((ts -  prevPt.ts) / 1000) * 3600), 2) 
                            + " kts<br>" + formatPosition(lat, lon) 
                            + (tag ? "<br>(Type: " + tag + ")" : "");
                buildCircle({lat,lon}, mapState.meLayerMarkers,"#b86dff", 1.5 ,1, title);
                mapState.refPoints.push({lat,lon});
            }
            isFirst = true;
            prevPt = {lat:lat, lon:lon, ts:ts};
        });
        const myTrackpath = buildPath(myTrackPts, undefined, undefined, myPos.lat, myPos.lon);
        buildTrace(myTrackpath, mapState.meLayer, mapState.refPoints, "#b86dff", 1.5, 1);
    }
    
    mapState.meLayer.addTo(map);
    if(displayMarkers) mapState.meLayerMarkers.addTo(map);

//    if(myPos.lat && myPos.lon)
//    {
        
    const myPosPt = buildPt2(myPos.lat, myPos.lon);
    const title = "Me (Last position: " 
                + formatTimestampToReadableDate(playerIte.iteDate, 1) 
                + ")<br>TWA: <b>" + roundTo(playerIte.twa, 3) + "°</b>"
                + " | HDG: <b>" + roundTo(playerIte.hdg, 2) + "°</b>"
                + "<br>Sail: " + sailNames[playerIte.sail] + " | Speed: " + roundTo(playerIte.speed, 3) + " kts"
                + "<br>TWS: " + roundTo(playerIte.tws, 3) + " kts | TWD: " + roundTo(playerIte.twd, 3) + "°";
    buildMarker(myPosPt, mapState.meBoatLayer, buildBoatIcon("#b86dff","#000000",0.4), title,  200, 0.5,playerIte.hdg);
    drawProjectionLine(myPosPt,playerIte.hdg,playerIte.speed) ;
//   }
    mapState.meBoatLayer.addTo(map);

    if(!mapState.userZoom) updateBounds();  
}

function updateMapLeader(playerIte) {
    
    if (!mapState|| !mapState.map) return;

    if(mapState.leaderLayer) map.removeLayer(mapState.leaderLayer);
    if(mapState.leaderMeLayer) map.removeLayer(mapState.leaderMeLayer);
    mapState.leaderLayer = L.layerGroup(); 
    mapState.leaderMeLayer = L.layerGroup(); 

    const offset = playerIte?.startDate?(new Date() - playerIte.startDate):new Date();

    const trackLeader = getLegPlayersTrackLeader();
    if (trackLeader && trackLeader.track.length > 0) {
        const playersList = getPlayersList();
        const title = "Leader: <b>" + playersList[trackLeader.userId] + "</b><br>Elapsed: " + formatDHMS(offset);
        addGhostTrack(trackLeader.track, title, offset, "#FF8C00", mapState.leaderLayer);
    }

    const trackGhost = getLegPlayersTrackLeader();
    if (trackGhost && trackGhost.track.length > 0) {
        const title = "<b>Best Attempt</b><br>Elapsed: " + formatDHMS(offset);
        addGhostTrack(trackGhost.track, title, offset, "#b86dff", mapState.leaderMeLayer);
    }

}

function addGhostTrack (ghostTrack, title, offset, color,layer) {
    const userPrefs = getUserPrefs();
    const displayMarkers = userPrefs.map.showMarkers;
    
    if (!ghostTrack || !mapState|| !mapState.map) return;
    
    const ghostStartTS = ghostTrack[0].ts;
    const ghostPosTS = ghostStartTS + offset;
    let ghostPos;

    for (var i = 0; i < ghostTrack.length; i++) {
        const pos = buildPt2(ghostTrack[i].lat, ghostTrack[i].lon);
        mapState.refPoints.push(pos[1]);
                
        if (!ghostPos) {
            if (ghostTrack[i].ts >= ghostPosTS) {
                ghostPos = i;
            }
        }
    }
       
    buildTrace(buildPath(ghostTrack),layer,mapState.refPoints, color,1,0.6,'10, 10','5');

    if (ghostPos && displayMarkers) {
        const lat1 = ghostTrack[ghostPos].lat;
        const lon1 = ghostTrack[ghostPos].lon
        const lat0 = ghostTrack[Math.max(ghostPos - 1, 0)].lat;
        const lon0 = ghostTrack[Math.max(ghostPos - 1, 0)].lon;
        const heading = Util.courseAngle(lat0, lon0, lat1, lon1) * 180 / Math.PI;
        const d = (ghostPosTS - ghostTrack[ghostPos - 1].ts ) / (ghostTrack[ghostPos].ts - ghostTrack[ghostPos - 1].ts)
        const lat = lat0 + (lat1-lat0) * d;
        const lon = lon0 + (lon1-lon0) * d;
        const pos = buildPt2(lat, lon);
        buildMarker(pos,layer, buildBoatIcon(color,color,0.6), title,  20, 0.4,heading);
    }

    layer.addTo(mapState.map); 
    if(!mapState.userZoom) updateBounds();
}


function updateMapFleet(raceInfo, raceItesFleet, connectedPlayerId) {

    if (!raceInfo || !raceItesFleet ||!mapState|| !mapState.map) return;
    
    const map = mapState.map;
    const userPrefs = getUserPrefs();
    const trackFleet = getLegPlayersTracksFleet();

    const displayMarkers = userPrefs.map.showMarkers;
    const displayTracks = userPrefs.map.showTracks;
    
    if(mapState.fleetLayer) map.removeLayer(mapState.fleetLayer);
    if(mapState.fleetLayerMarkers) map.removeLayer(mapState.fleetLayerMarkers);
    if(mapState.fleetLayerTracks) map.removeLayer(mapState.fleetLayerTracks);

    mapState.fleetLayer = L.layerGroup();
    mapState.fleetLayerMarkers = L.layerGroup();
    mapState.fleetLayerTracks = L.layerGroup();


    Object.entries(raceItesFleet).map(([userId, playerFleetInfos]) => {


        const playerIte = playerFleetInfos.ite;
        if(playerIte && userId && userId != connectedPlayerId && isDisplayEnabled(playerIte, userId,connectedPlayerId))
        {
            let zi;
            /*if (key == currentId){
                zi = 50;    // Me
                drawProjectionLine(race.lMap.me_PlLayer,pos,elem.heading,elem.speed) ;   
            } else*/ 
            if (playerIte.type == "top") {
                zi = 49;    // Top VSR
            } else if (playerIte.team) {
                zi = 48;    // Team
            } else if (playerIte.followed == true || playerIte.isFollowed == true) {
                zi = 47;    // Friend
            } else if ( playerIte.type == "sponsor") {
                zi = 46;    // Color Sponsor
            } else {
                zi = 44;    // Real   // Opponent
            }
            const pos = buildPt2(playerIte.pos.lat, playerIte.pos.lon);
         
            // Add names to real skippers if data exists
            let skipperName = playerFleetInfos.info.name;
            if (playerIte.extendedInfos?.skipperName) 
                skipperName += '<span class="txtUpper">' 
                            + playerIte.extendedInfos.boatName 
                            + '</span><br><b>' 
                            + playerIte.extendedInfos.skipperName + '</b>';

            let info = '';
            if (playerIte.type == 'real') {
                info = skipperName + "<br>HDG: <b>" + roundTo(playerIte.hdg, 2) + "°</b> | Speed: " + roundTo(playerIte.speed, 3) + " kts";
                if (playerIte.twa > 0) info += "<br>TWA: <b>" + roundTo(playerIte.twa, 3) + "°</b>";
                if (playerIte.sail != "-") info += " | Sail: " + sailNames[playerIte];
                if (playerIte.tws > 0) info += "<br>TWS: " + roundTo(playerIte.tws, 3) + " kts";
                if (playerIte.twd > 0) info += " | TWD: " + roundTo(playerIte.twd, 3) + "°";
            }
            else {
                info = skipperName 
                    + "<br>TWA: <b>" 
                    + roundTo(playerIte.twa, 3) 
                    + "°</b> | HDG: <b>" 
                    + roundTo(playerIte.heading, 2) 
                    + "°</b><br>Sail: " 
                    + sailNames[playerIte] || "-" 
                    + " | Speed: " 
                    + roundTo(playerIte.speed, 3) 
                    + " kts<br>TWS: " 
                    + roundTo(playerIte.tws, 3) + " kts | TWD: " 
                    + roundTo(playerIte.twd, 3) + "°";
            }

            
            if(raceInfo.raceType == "record") {
                info += "<br>Elapsed: <b>" + formatDHMS(playerIte.iteDate - playerIte.startDate) + "</b>";
            }

            const categoryIdx = category.indexOf(playerIte.type);
            const nameStyle = (userId == connectedPlayerId)?"color: #b86dff; font-weight: bold; "
                            :((userPrefs.theme=="dark")?categoryStyleDark[categoryIdx]:categoryStyle[categoryIdx]);
            
            const sailStyle = sailColors[playerIte.sail];
            buildMarker(pos, mapState.fleetLayer,buildBoatIcon(nameStyle,sailStyle,0.8), info,  zi, 0.8,playerIte.hdg);


            // track
            if (trackFleet[userId]?.track && trackFleet[userId]?.length != 0) {

                const myPos = {lat :playerIte.pos.lat, lon:playerIte.pos.lon}
                let playerTrackPts = [];
                let isFirst = false;
                let prevPt = null;
                trackFleet[userId].track.forEach(({ lat, lon, ts,tag}) => {
                    playerTrackPts.push({lat,lon});
                    if(isFirst)
                    {
                        const title =  skipperName 
                            + "<br><b>" 
                            + formatShortDate(ts,undefined,localTimes) 
                            + "</b> | Speed: " 
                            + roundTo(Math.abs(gcDistance(playerPos, {lat, lon}) / ((ts -  prevPt.ts) / 1000) * 3600), 2) 
                            + " kts<br>" + formatPosition(lat, lon) 
                            + (tag ? "<br>(Type: " + tag + ")" : "");
                
                        buildCircle(pos2,mapState.fleetLayerMarkers,nameStyle, 1.5,1,title);
                        mapState.refPoints.push({lat,lon});
                    }
                    isFirst = true;
                    prevPt = {lat:lat, lon:lon, ts:ts};
                });
            
                if(playerPos.lat && playerPos.lon)
                {
                    const myTrackpath = buildPath(playerTrackPts, undefined, undefined, playerPos.lat, playerPos.lon);
                    buildTrace(myTrackpath, mapState.fleetLayerTracks, mapState.refPoints, nameStyle, 1.5, 1);
                    mapState.fleetLayerTracks.addTo(map);
                }
            }
        }
                
    });

    mapState.fleetLayer.addTo(map); 
    if(displayMarkers)
        mapState.fleetLayerMarkers.addTo(map); 
    if(displayTracks)
        mapState.fleetLayerTracks.addTo(map); 

    if(!mapState.userZoom) updateBounds();

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

export async function initializeMap()
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
        updateMapCheckpoints(raceInfo, playerItes.ite);
        updateMapWaypoints(playerItes.ite);
        updateMapMe(connectedPlayerId,playerItes.ite);
        updateMapLeader(playerItes.ite);
        updateMapFleet(raceInfo, raceItesFleet, connectedPlayerId);
        initButtonToCenterViewMap(playerItes.ite.pos.lat, playerItes.ite.pos.lon, mapState.map);
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
    mapState.raceId = rid;

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
            updateMapCheckpoints(raceInfo, playerItes.ite); 
            updateMapWaypoints(playerItes.ite);
            updateMapMe(connectedPlayerId,playerItes.ite);
            updateMapFleet(raceInfo, raceItesFleet, connectedPlayerId);
            updateMapLeader(playerItes.ite);
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
    let title1 = "Start: <b>" + raceInfo.start.name + "</b><br>"
                + formatPosition(raceInfo.start.lat, raceInfo.start.lon);
    
    let latlng = buildPt2(raceInfo.start.lat, raceInfo.start.lon);
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
    updateMapCheckpoints(raceInfo, playerItes.ite);
    updateMapFleet(raceInfo, raceItesFleet, connectedPlayerId);

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

    updateMapWaypoints(playerItes.ite);
    updateMapLeader(playerItes.ite);
    updateMapMe(connectedPlayerId,playerItes.ite);

    set_userCustomZoom(false);
    applyBoundsForCurrentMode(map);

    map.on('baselayerchange', onBaseLayerChange);
    map.on('zoomend',set_userCustomZoom);

    mapState.map = map;
    initButtonToCenterViewMap(playerItes.ite.pos.lat, playerItes.ite.pos.lon, mapState.map);
    enableCoordinateCopyingWithShortcut();
    
}


