import * as Util from './util.js';
import * as rt from './routingviewer.js';

const options = {
    key: 'notValid', // REPLACE WITH YOUR KEY !!!
    lat: 14,
    lon: -29,
    zoom: 4,
    isKeyValid:false
    // Put additional console output
   // verbose: true,
};
const category = ["real", "certified", "top", "sponsor", "normal", "pilotBoat", "team"];
const categoryStyle = [
    // real
    {nameStyle: "color: Chocolate;", bcolor: '#D2691E', bbcolor: '#000000'},
    // certified
    {nameStyle: "color: Black;", bcolor: '#1E90FF', bbcolor: '#000000'},
    // top
    {nameStyle: "color: GoldenRod; font-weight: bold;", bcolor: '#ffd700', bbcolor: '#000000'},
    // "sponsor"
    {nameStyle: "color: Black;", bcolor: '#D3D3D3', bbcolor: '#ffffff'},
    // "normal"
    {nameStyle: "color: Black;", bcolor: '#D3D3D3', bbcolor: '#000000'},
    // "normal"
    {nameStyle: "color: Black;", bcolor: '#000000', bbcolor: '#ff0000'}
];
const categoryStyleDark = [
    // real
    {nameStyle: "color: Chocolate;", bcolor: '#D2691E', bbcolor: '#000000'},
    // certified
    {nameStyle: "color: #a5a5a5;", bcolor: '#1E90FF', bbcolor: '#000000'},
    // top
    {nameStyle: "color: GoldenRod; font-weight: bold;", bcolor: '#ffd700', bbcolor: '#000000'},
    // "sponsor"
    {nameStyle: "color: #a5a5a5;", bcolor: '#D3D3D3', bbcolor: '#ffffff'},
    // "normal"
    {nameStyle: "color: #a5a5a5;", bcolor: '#D3D3D3', bbcolor: '#000000'},
    // "normal"
    {nameStyle: "color: #a5a5a5;", bcolor: '#000000', bbcolor: '#ff0000'}
];
const sailNames = [0, "Jib", "Spi", "Stay", "LJ", "C0", "HG", "LG", 8, 9,
                     // VR sends sailNo + 10 to indicate autoSail. We use sailNo mod 10 to find the sail name sans Auto indication.
                     "Auto", "Jib &#x24B6;", "Spi &#x24B6;", "Stay &#x24B6;", "LJ &#x24B6;", "C0 &#x24B6;", "HG &#x24B6;", "LG &#x24B6;"];
var currentId = 0;
var currentTeam = 0;    
var displayFilter = 0;
var lMapInfos;



function set_displayFilter(value)
{
    displayFilter =value;
}

function set_currentId(value)
{
    currentId = value;
}
function set_currentTeam(value)
{
    currentTeam = value;
}

                     
function boatinfo(uid, uinfo) {
    var res = {
        name: uinfo.displayName,
        speed: uinfo.speed,
        heading: uinfo.heading,
        tws: uinfo.tws,
        twa: Math.abs(uinfo.twa),
        twaStyle: 'style="color: ' + ((uinfo.twa < 0) ? "red" : "green") + ';"',
        sail: sailNames[uinfo.sail] || "-",
        xfactorStyle: 'style="color:' + ((uinfo.xplained) ? "black" : "red") + ';"',
        nameStyle: uinfo.nameStyle,
        bcolor: uinfo.bcolor,
        bbcolor: uinfo.bbcolor
    };

    if (uid == currentId) {
        res.nameStyle = "color: #b86dff; font-weight: bold; ";
        res.bcolor = '#b86dff';
        if (!uinfo.displayName) {
            res.name = 'Me';
        }        
    } else {
        var idx = category.indexOf(uinfo.type);
        if(document.documentElement.getAttribute("data-theme") =='dark')
            var style = categoryStyleDark[idx]; 
        else
            var style = categoryStyle[idx];
        res.nameStyle = style.nameStyle;
        res.bcolor = style.bcolor;
        res.bbcolor = style.bbcolor;
        if ((uinfo.isFollowed || uinfo.followed) && (uinfo.type == "normal" || uinfo.type == "sponsor")) {
            res.bcolor = "#32cd32";
            res.bbcolor = "#000000"; 
            if (uinfo.teamname == currentTeam || uinfo.team) {
                res.bbcolor = "#ae1030"; 
            }
        } else if ((uinfo.teamname == currentTeam || uinfo.team) && (uinfo.type != "top")) {
            res.bcolor = "#ae1030";
            res.bbcolor = "#000000";
            if (uinfo.isFollowed || uinfo.followed) {
                res.bbcolor = "#32cd32"; 
            }
            
        }
    }
    
    if (uinfo.type == "sponsor") {
        res.bbcolor = "#FFFFFF";                
        if (uinfo.branding && uinfo.branding.name) {
            res.name += "(" + uinfo.branding.name + ")";
        }
    }
    
    // Modif - Couleur voiles colonne Sail
    uinfo.shortSail = res.sail.slice(0,2);

    function sailColor() {
        switch (res.sail.slice(0,2)) {
            case "Ji":
                return "#FF6666";
                break;
            case "LJ":
                return "#FFF266";
                break;
            case "St":
                return "#66FF66";
                break;
            case "C0":
                return "#66CCFF";
                break;
            case "HG":
                return "#FF66FF";
                break;
            case "LG":
                return "#FFC44D";
                break;
            case "Sp":
                return "#6666FF";
                break;
            default:
                return "#FFFFFF";
        }
    }
    res.sailStyle = 'style="color:' + sailColor() + '" padding: 0px 0px 0px 2px;"';
    // Fin modif Couleur voiles
    return (res);
}
function isDisplayEnabled (record, uid) {


    return  (uid == currentId)
        || (record.type2 == "followed"  && (displayFilter & 0x001))
        || (record.type2 == "team"      && (displayFilter & 0x002))
        || (record.type2 == "normal"    && (displayFilter & 0x004))
        || ((record.type == "top" || record.type2 == "top")         && (displayFilter & 0x008))
        || (record.type2 == "certified" && (displayFilter & 0x010))
        || (record.type2 == "real"      && (displayFilter & 0x020))
        || ((record.type == "sponsor" || record.type2 == "sponsor") && (displayFilter & 0x040))
        || (record.choice == true       && (displayFilter & 0x080))
        || (record.state == "racing"    && (displayFilter & 0x100))
}


function buildMarker( latlng, icond,title, zi, op,heading)
{ 
    if(!heading) heading=0;
    if(heading == 180) heading = 179.9; //or boat icon are drawn at 0?? when 180?? :s
    var marker1 = L.marker(latlng,{icon:icond,rotationAngle: heading/2});
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
   // marker1._icon.setAttribute('data-heading', heading);
                        
    return marker1;
}

function buildTextIcon(icon,iconColor,markerColor,text)
{
    return  L.AwesomeMarkers.icon({
        icon: icon,
        markerColor: markerColor,
        iconColor : iconColor,
        prefix: 'fa',
        html: text,
    });
}
function buildBoatIcon(fillColor,borderColor,opacity)
{

    var MARKER = encodeURIComponent(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
    <svg width="100%" height="100%" viewBox="0 0 14 14" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:1.41421;">
    <path d="M4.784,13.635c0,0 -0.106,-2.924 0.006,-4.379c0.115,-1.502 0.318,-3.151 0.686,-4.632c0.163,-0.654 0.45,-1.623 0.755,-2.44c0.202,-0.54 0.407,-1.021 0.554,-1.352c0.038,-0.085 0.122,-0.139 0.215,-0.139c0.092,0 0.176,0.054 0.214,0.139c0.151,0.342 0.361,0.835 0.555,1.352c0.305,0.817 0.592,1.786 0.755,2.44c0.368,1.481 0.571,3.13 0.686,4.632c0.112,1.455 0.006,4.379 0.006,4.379l-4.432,0Z" style="fill:` +
    borderColor + `;"/><path d="M5.481,12.731c0,0 -0.073,-3.048 0.003,-4.22c0.06,-0.909 0.886,-3.522 1.293,-4.764c0.03,-0.098 0.121,-0.165 0.223,-0.165c0.103,0 0.193,0.067 0.224,0.164c0.406,1.243 1.232,3.856 1.292,4.765c0.076,1.172 0.003,4.22 0.003,4.22l-3.038,0Z" style="fill:`+
    fillColor+`;fill-opacity:`+ opacity +`;"/> </svg>`);   

    var MARKER_ICON_URL = `data:image/svg+xml;utf8,${MARKER}`;
    
    return L.icon({
        iconUrl: MARKER_ICON_URL,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, 0],
    });
}

function buildCircle(latlng,trackcolor,size,opacity,title)
{
    var circleMark = L.circle(latlng,size, {
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
    return circleMark;
}

function buildTrace (tpath, color,weight,opacity,dashArray,dashOffset) {

    var trackLine = L.geodesic(tpath,
        {
            color: color,
            opacity: opacity,
            weight: weight,
        });
    if(dashArray) trackLine.options.dashArray = dashArray;
    if(dashOffset) trackLine.options.dashOffset = dashOffset;
    trackLine.on('mouseover', function() {
        trackLine.setStyle({
            weight: opacity*2,
        });
    });

    trackLine.on('mouseout', function() {
        trackLine.setStyle({
            weight: opacity,
        });
    });
    return trackLine;

}

var greenRRIcon = L.icon({
    iconUrl: '../img/greenIcon.png',
    shadowUrl: '../img/RRIconShadowNok.png',

    iconSize:     [20, 40], // size of the icon
    shadowSize:   [53, 52], // size of the shadow
    iconAnchor:   [10, 40], // point of the icon which will correspond to marker's location
    shadowAnchor: [27, 46],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});
var redRLIcon = L.icon({
    iconUrl: '../img/redIcon.png',
    shadowUrl: '../img/RLIconShadowNok.png',

    iconSize:     [20, 40], // size of the icon
    shadowSize:   [53, 52], // size of the shadow
    iconAnchor:   [10, 40], // point of the icon which will correspond to marker's location
    shadowAnchor: [27, 46],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});
var greenRRIconP = L.icon({
    iconUrl: '../img/greenIcon.png',
    shadowUrl: '../img/RRIconShadowOK.png',

    iconSize:     [20, 40], // size of the icon
    shadowSize:   [53, 52], // size of the shadow
    iconAnchor:   [10, 40], // point of the icon which will correspond to marker's location
    shadowAnchor: [27, 46],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});
var redRLIconP = L.icon({
    iconUrl: '../img/redIcon.png',
    shadowUrl: '../img/RLIconShadowOK.png',

    iconSize:     [20, 40], // size of the icon
    shadowSize:   [53, 52], // size of the shadow
    iconAnchor:   [10, 40], // point of the icon which will correspond to marker's location
    shadowAnchor: [27, 46],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var yellowRRIcon = L.icon({
    iconUrl: '../img/yellowIcon.png',
    shadowUrl: '../img/RRIconShadowNok.png',

    iconSize:     [20, 40], // size of the icon
    shadowSize:   [53, 52], // size of the shadow
    iconAnchor:   [10, 40], // point of the icon which will correspond to marker's location
    shadowAnchor: [27, 46],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var yellowRLIcon = L.icon({
    iconUrl: '../img/yellowIcon.png',
    shadowUrl: '../img/RLIconShadowNok.png',

    iconSize:     [20, 40], // size of the icon
    shadowSize:   [53, 52], // size of the shadow
    iconAnchor:   [10, 40], // point of the icon which will correspond to marker's location
    shadowAnchor: [27, 46],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var yellowRRIconP = L.icon({
    iconUrl: '../img/yellowIcon.png',
    shadowUrl: '../img/RRIconShadowOK.png',

    iconSize:     [20, 40], // size of the icon
    shadowSize:   [53, 52], // size of the shadow
    iconAnchor:   [10, 40], // point of the icon which will correspond to marker's location
    shadowAnchor: [27, 46],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var yellowRLIconP = L.icon({
    iconUrl: '../img/yellowIcon.png',
    shadowUrl: '../img/RLIconShadowOK.png',

    iconSize:     [20, 40], // size of the icon
    shadowSize:   [53, 52], // size of the shadow
    iconAnchor:   [10, 40], // point of the icon which will correspond to marker's location
    shadowAnchor: [27, 46],  // the same for the shadow
    popupAnchor:  [-3, -76] // point from which the popup should open relative to the iconAnchor
});


function cleanMap(race) {

    lMapInfos = undefined;
    if(race.lMap) delete race.lMap.gdiv;
    var existingMap = document.getElementById('lMap'+race.id);
    if(existingMap) {
        existingMap.style.visibility = "hidden";
        existingMap.style.height = "0px";
        existingMap.style.width = "0px";
    }
}

async function initialize(race,raceFleetMap)
{
    function set_userCustomZoom(e)
    {
        if(race.lMap.resetUserZoom > 0)
            race.lMap.userZoom = true;
        else    race.lMap.resetUserZoom += 1;
    }
    if(!race ) return;


    if(race.lMap && race.lMap.gdiv) return ;  

    if((!race.lMap || !race.lMap.gdiv) && document.getElementById("tab-content3").style.display == "flex")
    {

        var existingMap = document.getElementById('lMap'+race.id);
        if(existingMap) {
            existingMap.style.visibility = "visible";
            existingMap.style.height = "100%";
            existingMap.style.width = "90%";
            race.lMap.gdiv = existingMap;
            lMapInfos = race.lMap;
        } else
        {

        
                //todo save zoom and pos according race
            var savRoute = [];
            if(race.lMap && race.lMap.route)
            {
                savRoute = race.lMap.route;
            }

            // Create div
            var divMap = document.createElement('div');
            divMap.style.height = "100%";
            divMap.style.display = "flex";
            divMap.style.width = "90%";
            divMap.setAttribute('id', 'lMap'+race.id);

            document.getElementById("tab-content3").appendChild(divMap);
            





            var Esri_WorldImagery = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                minZoom: 2, maxZoom: 40, maxNativeZoom: 40, attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, ' +
                    'AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            });
        
            var OSM_Layer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                minZoom: 2, maxZoom: 40, maxNativeZoom: 40, attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            });
        
            var baseLayers = {
                "Carte": OSM_Layer,
                "Satellite": Esri_WorldImagery
            };
        
        
            var map = L.map('lMap'+race.id, {
    /*          contextmenu: true,
                contextmenuWidth: 150,
                contextmenuItems: [{
                    text: 'Obtenir Position',
                    callback: obtenirPositionGEFS
                }],*/
                layers: [OSM_Layer]
            });
            var layerControl = L.control.layers(baseLayers);
            layerControl.addTo(map);
            L.control.scale().addTo(map);
        /*  handleError = function (err) {
                console.log('handleError...');
                console.log(err);
            };
        
            windJSLeaflet = new WindJSLeaflet.init({
                localMode: false,
                map: map,
                layerControl: layerControl,
                useNearest: true,
                timeISO: new Date().toISOString(),
                nearestDaysLimit: 7,
                displayValues: true,
                displayOptions: {
                    displayPosition: 'bottomleft',
                    displayEmptyString: 'Donnees Vent manquantes'
                },
                overlayName: 'Vent',
                pingUrl: 'https://routage.vrzen.org/dateHeureVent/',
                latestUrl: 'https://routage.vrzen.org/CarteVent/',
                nearestUrl: 'https://routage.vrzen.org/CarteVent/',        
                errorCallback: handleError
            });  
            */

    /*        var map = L.map('lMap');        
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 40,
                attribution: '?? OpenStreetMap'
            }).addTo(map);
    */


            map.attributionControl.addAttribution('&copy;SkipperDuMad / Trait de cotes &copy;Kurun56');
            
            race.lMap = [];
            race.lMap.map = map;
            //race.lMap.refLayer
            race.lMap.refPoints = [];
            race.lMap.refLayer = L.layerGroup();
            if(savRoute != [])
                race.lMap.route = savRoute;
            else
                race.lMap.route = [];
            race.lMap.resetUserZoom = 0;
            race.lMap.userZoom = false;
            
            race.lMap.gdiv = document.getElementById('lMap'+race.id);
                
        
                

            var title1 = "Start: " + race.legdata.start.name 
                        + "\nPosition: " + Util.formatPosition(race.legdata.start.lat, race.legdata.start.lon);
            var latlng = L.latLng(race.legdata.start.lat,race.legdata.start.lon);
            buildMarker(latlng,buildTextIcon('','blue','red',"S"),title1,0).addTo(race.lMap.refLayer);

            
            race.lMap.refPoints.push(latlng);
            
            title1 =  "<span>Finish: " + race.legdata.end.name 
                + "\nPosition: " + Util.formatPosition(race.legdata.end.lat, race.legdata.end.lon) +"</span>";
            latlng = L.latLng(race.legdata.end.lat,race.legdata.end.lon);
            buildMarker(latlng,buildTextIcon('','yellow','red',"F"),title1,0).addTo(race.lMap.refLayer);
            race.lMap.refPoints.push(latlng);
            

            buildCircle(latlng,'red',race.legdata.end.radius * 1852.0,0).addTo(race.lMap.refLayer);

                
                
            // course
            var cpath = [];
            for (var i = 0; i < race.legdata.course.length; i++) {
                latlng = L.latLng(race.legdata.course[i].lat, race.legdata.course[i].lon);
                race.lMap.refPoints.push(latlng);
                cpath.push(latlng);
            }
            //turf.bezierSpline( turf.lineString(cpath));
            
            var raceLine = L.geodesic(cpath,
                            {
                                color: "white",
                                opacity: 0.5,
                                weight: 1
                            }).addTo(race.lMap.refLayer);
            
            var raceLinePatterns = L.polylineDecorator(raceLine, {
                    patterns: [
                        {offset: '5%', repeat: '10%', symbol: L.Symbol.arrowHead({pixelSize: 15, pathOptions: {fillOpacity: 0.5, weight: 1, color :'white'}})}
                    ]
                }).addTo(race.lMap.refLayer);
                
                


            //  Ice limits

            if (race.legdata.ice_limits) {
                var iceLimit = [];
                var iceData = race.legdata.ice_limits.south;
                if(!(iceData.length == 5 
                    && iceData[0].lat == -90 && iceData[0].lon == -180
                    && iceData[2].lat == -90 && iceData[2].lon == 0
                    && iceData[4].lat == -90 && iceData[4].lon == 180
                    )) //is not a dummy ice limits ;)
                {
                
                    for (var i = 0; i < iceData.length; i++) {
                        latlng = L.latLng(iceData[i].lat, iceData[i].lon);
                        race.lMap.refPoints.push(latlng);
                        iceLimit.push(latlng);
                    }
                    buildTrace(iceLimit, "#FF0000",4,0.5).addTo(race.lMap.refLayer);
                }
            }

            race.lMap.refLayer.addTo(map);

            updateBounds(race);
            updateMapCheckpoints(race);
            updateMapFleet(race,raceFleetMap);
            
        // race.lMap.timeStamp = store.get('timestamp');

            Object.keys(race.lMap.route).forEach(function (name) {
                var lMapRoute = race.lMap.route[name];
                var map = race.lMap.map;
                if(lMapRoute.displayed)
                {
                    if(lMapRoute.traceLayer) lMapRoute.traceLayer.addTo(map);
                    if(lMapRoute.markersLayer && document.getElementById('sel_showMarkersLmap').checked) lMapRoute.markersLayer.addTo(map);
                }
            });
            
            lMapInfos = race.lMap;
            updateMapWaypoints(race);
            updateMapLeader(race);
            updateMapMe(race);

            set_userCustomZoom(false);
            map.on('zoomend',set_userCustomZoom);

            
            
            lMapInfos = race.lMap;
        }

    }
}



function updateBounds(race)
{
    if (!race|| !race.lMap || !race.lMap.gdiv) return;

    race.lMap.bounds = L.latLngBounds(race.lMap.refPoints);
    race.lMap.map.fitBounds(race.lMap.bounds);
    lMapInfos = race.lMap;
    
}
function updateMapCheckpoints(race) {

   if (!race || !race.lMap|| !race.lMap.map || !race.lMap.gdiv) return;
    
    var map = race.lMap.map;
    
    // checkpoints
    if (!race.legdata) return;
    if (!map) return;

    if(race.lMap.checkPointLayer)
    {
        map.removeLayer(race.lMap.checkPointLayer);
    }
    race.lMap.checkPointLayer = L.layerGroup();
    
        
    for (var i = 0; i < race.legdata.checkpoints.length; i++) {

        var cp = race.legdata.checkpoints[i];
        var cp_name = "invisible";
        if (cp.display != "none") cp_name = cp.display;

        var position_s = L.latLng(cp.start.lat, cp.start.lon);
        var position_e = L.latLng(cp.end.lat, cp.end.lon);
    
        var c_sb = "green";
        var c_bb = "red";
        var zi = 8;
        if (cp.display == "none") {
            continue;
        }

        var op = 1.0;
        var g_passed = false;
        if (race.gatecnt && race.gatecnt[cp.group - 1]) {
            g_passed = true;
            op = 0.6;
        } // mark/gate passed - semi transparent
        
        var label_g = "checkpoint " + cp.group + "." + cp.id +  ", type: " + cp_name + ", engine: " + cp.engine + ", name: " + cp.name + (g_passed ? ", PASSED" : "");
        var side_s =  cp.side ;
        var side_e = (cp.side == "stbd")?"port":"stbd";
        var label_s = label_g + ", side: " + side_s + "\nPosition: " + Util.formatPosition(cp.start.lat, cp.start.lon);
        var label_e = label_g + ", side: " + side_e + "\nPosition: " + Util.formatPosition(cp.end.lat, cp.end.lon);

       

        if (cp.display == "buoy") {
            if (cp.side == "stbd") {
       
                if(!g_passed) {
                    buildMarker(position_s, greenRRIcon, label_s, 8, op,0).addTo(race.lMap.checkPointLayer);
                    buildMarker(position_e, redRLIcon, label_e, 8, op,0).addTo(race.lMap.checkPointLayer);
                } else
                {
                    buildMarker(position_s, greenRRIconP, label_s, 8, op,0).addTo(race.lMap.checkPointLayer);
                    buildMarker(position_e, redRLIconP, label_e, 8, op,0).addTo(race.lMap.checkPointLayer);
                
                }
            } else {
                if(!g_passed) {
                    buildMarker(position_s, redRLIcon, label_s, 8, op,0).addTo(race.lMap.checkPointLayer);
                    buildMarker(position_e, greenRRIcon,  label_e, 8, op,0).addTo(race.lMap.checkPointLayer);
                } else
                {
                    buildMarker(position_s, redRLIconP, label_s, 8, op,0).addTo(race.lMap.checkPointLayer);
                    buildMarker(position_e, greenRRIconP,  label_e, 8, op,0).addTo(race.lMap.checkPointLayer);

                }
            }
        } else if (cp.display == "gate") {
            if (cp.side == "stbd") {
                if(!g_passed) {
                    buildMarker(position_s, greenRRIcon, label_s,  8, op,0).addTo(race.lMap.checkPointLayer);
                    buildMarker(position_e, redRLIcon, label_s,  8, op,0).addTo(race.lMap.checkPointLayer);
                } else
                {
                    buildMarker(position_s, greenRRIconP, label_s,  8, op,0).addTo(race.lMap.checkPointLayer);
                    buildMarker(position_e, redRLIconP, label_s,  8, op,0).addTo(race.lMap.checkPointLayer);

                }
            } else {
                if(!g_passed) {
                    buildMarker(position_s, redRLIcon, label_s,  8, op,0).addTo(race.lMap.checkPointLayer);
                    buildMarker(position_e, greenRRIcon, label_s,  8, op,0).addTo(race.lMap.checkPointLayer);
                } else
                {
                    buildMarker(position_s, redRLIconP, label_s,  8, op,0).addTo(race.lMap.checkPointLayer);
                    buildMarker(position_e, greenRRIconP, label_s,  8, op,0).addTo(race.lMap.checkPointLayer);

                }
                
            }
        } else {
            if (cp.side == "stbd") {
                if(!g_passed) {
                    buildMarker(position_s, yellowRRIcon, label_s, zi, op,0).addTo(race.lMap.checkPointLayer);
                } else
                {
                    buildMarker(position_s, yellowRRIconP, label_s, zi, op,0).addTo(race.lMap.checkPointLayer);

                }
            } else {
                if(!g_passed) {
                    buildMarker(position_s, yellowRLIcon, label_s, zi, op,0).addTo(race.lMap.checkPointLayer);
                } else
                {
                    buildMarker(position_s, yellowRLIconP, label_s, zi, op,0).addTo(race.lMap.checkPointLayer);

                }
            }
        }
        
        race.lMap.refPoints.push(position_e);
        race.lMap.refPoints.push(position_s);

        var path = [];
        path.push(position_e);
        path.push(position_s);
        var pathColor = "yellow";
        if(g_passed) pathColor = "green";
        buildTrace(path, pathColor,1,op,'20, 20','10').addTo(race.lMap.checkPointLayer);


            
    }
    race.lMap.checkPointLayer.addTo(map); 
    if(!race.lMap.userZoom) updateBounds(race);
    lMapInfos = race.lMap;
}

function updateMapWaypoints(race) {

    if (!race || !race.lMap|| !race.lMap.map || !race.lMap.gdiv) return;
    
    var map = race.lMap.map;

    if (!race.curr) return; // current position unknown
    if (!map) return; // no map yet
    
    if(race.lMap.wayPointLayer)
    {
        map.removeLayer(race.lMap.wayPointLayer);
    }
    race.lMap.wayPointLayer = L.layerGroup();

    
    // track wp
    var tpath = [];
    if (race.waypoints && race.waypoints.type == "wp") {
        var action = race.waypoints;
        if (action.pos) {
            // Waypoint lines
            tpath.push(L.latLng(race.curr.pos.lat, race.curr.pos.lon)); // boat
            for (var i = 0; i < action.pos.length; i++) {
                tpath.push(L.latLng(action.pos[i].lat, action.pos[i].lon));
            }
            buildTrace(tpath,"#FF00FF",1.5,0.7).addTo(race.lMap.wayPointLayer);

            // Waypoint markers
            for (var i = 0; i < action.pos.length; i++) {
                var pos = L.latLng(action.pos[i].lat, action.pos[i].lon);
                var title = Util.formatPosition(action.pos[i].lat, action.pos[i].lon);
                buildCircle(pos,"#FF00FF", 2,1, title).addTo(race.lMap.wayPointLayer);
                race.lMap.refPoints.push(pos);
             }
        } else if (action.length) {
            // Waypoint lines
            tpath.push(L.latLng(race.curr.pos.lat, race.curr.pos.lon)); // boat
            for (var i = 0; i < action.length; i++) {
                tpath.push(L.latLng(action[i].lat, action[i].lon));
            }
            buildTrace(tpath,"#FF00FF",1.5,0.7).addTo(race.lMap.wayPointLayer);

            // Waypoint markers
            for (var i = 0; i < action.length; i++) {
                var pos = L.latLng(action[i].lat, action[i].lon);
                var title = Util.formatPosition(action[i].lat, action[i].lon);
                buildCircle(pos,"#FF00FF", 2,1, title).addTo(race.lMap.wayPointLayer);
                race.lMap.refPoints.push(pos);
            }
        } else {
            console.error("Unexpected waypoint format: " + JSON.stringify(action));
        }
    }       
    race.lMap.wayPointLayer.addTo(map); 
    if(!race.lMap.userZoom) updateBounds(race);
    lMapInfos = race.lMap;

}
function updateMapMe(race, track) {
    if (!race || !race.lMap|| !race.lMap.map || !race.lMap.gdiv) return;
    
    var map = race.lMap.map;

    if(!race.lMap.meLayer) race.lMap.meLayer  = L.layerGroup();
    if(!race.lMap.meBoatLayer) race.lMap.meBoatLayer  = L.layerGroup();
    if(!race.lMap.meLayerMarkers) race.lMap.meLayerMarkers  = L.layerGroup();

    // track
    var tpath = [];

    if (track) {

        if(race.lMap.meLayer) map.removeLayer(race.lMap.meLayer);
        if(race.lMap.meLayerMarkers) map.removeLayer(race.lMap.meLayerMarkers);
        race.lMap.meLayer  = L.layerGroup();
        race.lMap.meLayerMarkers  = L.layerGroup();

        for (var i = 0; i < track.length; i++) {
            var segment = track[i];
            var pos = L.latLng(segment.lat, segment.lon);
            tpath.push(pos);
            if(displayFilter & 0x200) {
                if (i > 0) {
                    var deltaT = (segment.ts -  track[i-1].ts) / 1000;
                    var deltaD =  Util.gcDistance(track[i-1], segment);
                    var speed = Util.roundTo(Math.abs(deltaD / deltaT * 3600), 2);
                    var timeStamp = Util.formatShortDate(segment.ts,undefined,(displayFilter & 0x800));
                    var title =  "Me " + " : " + timeStamp + " | " + speed + "kn" + " | " + (segment.tag || "-");
                    var trackcolor = "#b86dff";
                    buildCircle(pos,trackcolor, 1.5 ,1, title).addTo(race.lMap.meLayerMarkers);
                    race.lMap.refPoints.push(pos);
                }
            }
        }
        if (race.curr && race.curr.pos) {
            var pos = L.latLng(race.curr.pos.lat, race.curr.pos.lon);
            tpath.push(pos);
        }
    
        buildTrace(tpath, "#b86dff",1.5,1).addTo(race.lMap.meLayer);
    }        
    
    // boat
    if (race.curr && race.curr.pos) {
        var nbdigits = (document.getElementById("2digits").checked?1:0);
        var pos = L.latLng(race.curr.pos.lat, race.curr.pos.lon);

        if(race.lMap.meBoatLayer) map.removeLayer(race.lMap.meBoatLayer);
        race.lMap.meBoatLayer  = L.layerGroup();
        var title = "Me | HDG : " 
                    + Util.roundTo(race.curr.heading, 2 + nbdigits) 
                    + " | TWA : " + Util.roundTo(race.curr.twa, 2 + nbdigits) 
                    + " | SPD : " + Util.roundTo(race.curr.speed, 2+nbdigits);

        buildMarker(pos, buildBoatIcon("#b86dff","#000000",0.4), title,  200, 0.5,race.curr.heading).addTo(race.lMap.meBoatLayer);
     }

    
    if(document.getElementById('sel_showMarkersLmap').checked)
       race.lMap.meLayerMarkers.addTo(map);                
    race.lMap.meLayer.addTo(map);           
    race.lMap.meBoatLayer.addTo(map); 
    if(!race.lMap.userZoom) updateBounds(race);    
    lMapInfos = race.lMap;

}
function updateMapLeader(race) {

    if (!race || !race.lMap|| !race.lMap.map || !race.lMap.gdiv) return;

    if (!race.curr) return;
    if (!race.curr.startDate) return;
    
    var map = race.lMap.map;
    var d = new Date();
    var offset = d - race.curr.startDate;

    // track
    if (race.leaderTrack && race.leaderTrack.length > 0) {
        if(race.lMap.leaderLayer) map.removeLayer(race.lMap.leaderLayer);
        race.lMap.leaderLayer = L.layerGroup(); 

        addGhostTrack(race,race.leaderTrack, "Leader : " + race.leaderName + " | Elapsed : " + Util.formatDHMS(offset), offset,  "#FF8C00",race.lMap.leaderLayer);
    }
    if (race.myTrack && race.myTrack.length > 0) {
        if(race.lMap.leaderMeLayer) map.removeLayer(race.lMap.leaderMeLayer);
        race.lMap.leaderMeLayer = L.layerGroup(); 
        addGhostTrack(race,race.myTrack,"Best Attempt" + " | Elapsed : " + Util.formatDHMS(offset), offset,  "#b86dff",race.lMap.leaderMeLayer);
    }
    lMapInfos = race.lMap;

}
function addGhostTrack (race,ghostTrack, title, offset, color,layer) {
    
    if (!race || !race.lMap|| !race.lMap.map || !race.lMap.gdiv) return;
    
    var map = race.lMap.map;
    
    var tpath = [];
    var ghostStartTS = ghostTrack[0].ts;
    var ghostPosTS = ghostStartTS + offset;
    var ghostPos;
    for (var i = 0; i < ghostTrack.length; i++) {
        pos = L.latLng(ghostTrack[i].lat, ghostTrack[i].lon);
        tpath.push(pos);
        race.lMap.refPoints.push(pos);
                
        if (!ghostPos) {
            if (ghostTrack[i].ts >= ghostPosTS) {
                ghostPos = i;
            }
        }
    }
    buildTrace(tpath, color,1,0.6,'10, 10','5').addTo(layer);

    if (ghostPos) {
        var lat1 = ghostTrack[ghostPos].lat;
        var lon1 = ghostTrack[ghostPos].lon
        var lat0 = ghostTrack[Math.max(ghostPos - 1, 0)].lat;
        var lon0 = ghostTrack[Math.max(ghostPos - 1, 0)].lon;
        var heading = Util.courseAngle(lat0, lon0, lat1, lon1) * 180 / Math.PI;
        var d = (ghostPosTS - ghostTrack[ghostPos - 1].ts ) / (ghostTrack[ghostPos].ts - ghostTrack[ghostPos - 1].ts)
        var lat = lat0 + (lat1-lat0) * d;
        var lon = lon0 + (lon1-lon0) * d;
        var pos = L.latLng(lat, lon);
        buildMarker(pos, buildBoatIcon(color,color,0.6), title,  20, 0.4,heading).addTo(layer);
    }

    layer.addTo(map); 
    if(!race.lMap.userZoom) updateBounds(race);
}

function computeNextPos(pos,hdg,speed,time) {
    var dist5 = speed*time/(3600*60);
    var alpha = 360 - ( hdg - 90);
    var lat5 = pos.lat;
    var lng5 = pos.lng;
    var latrad1 = Util.toRad(lat5);
    var latrad2;
    var phi;

    lat5 += dist5*Math.sin(Util.toRad(alpha));
    latrad2 = Util.toRad(lat5);
    phi = Math.cos((latrad1+latrad2)/2);
    lng5 += (dist5*Math.cos(Util.toRad(alpha))) / phi ;
    if(lng5 > 180) {
        lng5 = lng5 - 360;
    }
    if(lng5 < -180) {
        lng5 = lng5 + 360;
    }

    return L.latLng(lat5, lng5);

}

function drawProjectionLine(race,pos,hdg,speed) {

    if(!hdg || !speed) return;
    var map = race.lMap.map;
    if(race.lMap.me_PlLayer) map.removeLayer(race.lMap.me_PlLayer);
    
    race.lMap.me_PlLayer  = L.layerGroup();

    var tpath = [];
    tpath.push(pos);

    for(var i=0;i<5;i++)
    {
        pos = computeNextPos(pos,hdg,speed,2*60);        
        tpath.push(pos);    
        var title = 2*(i+1)+"min";
        buildCircle(pos,"#b86dff", 1.5,1,title).addTo(race.lMap.me_PlLayer); 
    }

    buildTrace(tpath, "#b86dff",1,0.4,'10, 10','5').addTo(race.lMap.me_PlLayer);

    race.lMap.me_PlLayer.addTo(map); 

}


function updateMapFleet(race,raceFleetMap) {

    if (!race || !race.lMap|| !race.lMap.map  || !race.lMap.gdiv) return;
    
    var map = race.lMap.map;

    if(race.lMap.fleetLayer) map.removeLayer(race.lMap.fleetLayer);
    if(race.lMap.fleetLayerMarkers) map.removeLayer(race.lMap.fleetLayerMarkers);
    if(race.lMap.fleetLayerTracks) map.removeLayer(race.lMap.fleetLayerTracks);

    race.lMap.fleetLayer = L.layerGroup();
    race.lMap.fleetLayerMarkers = L.layerGroup();
    race.lMap.fleetLayerTracks = L.layerGroup();


    // opponents/followed
    var fleet = raceFleetMap.get(race.id);

    Object.keys(fleet.uinfo).forEach(function (key) {
        var elem = fleet.uinfo[key];
        var bi = boatinfo(key, elem);

        if (isDisplayEnabled(elem, key)) {
            var pos = L.latLng(elem.pos.lat, elem.pos.lon);
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
            
            var nbdigits = (document.getElementById("2digits").checked?1:0);
            var info = bi.name + " | HDG : " + Util.roundTo(bi.heading, 1+nbdigits) + " | TWA : " + Util.roundTo(bi.twa, 2+nbdigits) + " | SPD : " + Util.roundTo(bi.speed, 2 + nbdigits);
            if (elem.startDate && race.type == "record") {
                info += " | Elapsed : " + Util.formatDHMS(elem.ts - elem.startDate);
            }
            



            
            buildMarker(pos, buildBoatIcon(bi.bcolor,bi.bbcolor,0.8), info,  zi, 0.8,elem.heading).addTo(race.lMap.fleetLayer);
                

            
            // track
            var tpath = [];
            if (elem.track) {
                for (var i = 0; i < elem.track.length; i++) {
                    var segment = elem.track[i];
                    var pos2 = L.latLng(segment.lat, segment.lon);
                    tpath.push(pos2);
                    race.lMap.refPoints.push(pos2);
                    if(displayFilter & 0x200) {
                        if ((i > 0) && ((key = currentId)
                                                || elem.isFollowed
                                                || elem.followed))
                        {
                                var deltaT = (segment.ts -  elem.track[i-1].ts) / 1000;
                                var deltaD =  Util.gcDistance(elem.track[i-1], segment);
                                var speed = Util.roundTo(Math.abs(deltaD / deltaT * 3600), 2);
                                var timeStamp = Util.formatShortDate(segment.ts,undefined,(displayFilter & 0x800));
                                var title =  elem.displayName + " : " + timeStamp + " | " + speed + "kn" + " | " + (segment.tag || "-");

                                buildCircle(pos2,bi.bcolor, 1.5,1,title).addTo(race.lMap.fleetLayerMarkers);
                        }
                    }
                }
                tpath.push(pos);
                buildTrace (tpath, bi.bcolor,1,1).addTo(race.lMap.fleetLayerTracks); 
            }
        }
    });
    race.lMap.fleetLayer.addTo(map); 
    if(document.getElementById('sel_showMarkersLmap').checked)
        race.lMap.fleetLayerMarkers.addTo(map); 
    if(document.getElementById('sel_showTracksLmap').checked)
        race.lMap.fleetLayerTracks.addTo(map); 

    if(!race.lMap.userZoom) updateBounds(race);
    lMapInfos = race.lMap;

}

function createProjectionPoint(ts,lat,lon)
{
    var projectionPoint = [];
    projectionPoint.timeStamp = ts;
    projectionPoint.lat = lat;
    projectionPoint.lon = lon;
    return projectionPoint;

}

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
    var tpath = [];

    for (var i = 0 ; i < route.points.length ; i++) {
        var pos = L.latLng(route.points[i].lat, route.points[i].lon);
        tpath.push(pos);
        race.lMap.refPoints.push(pos);
        
        lmapRoute.projectionData.push(createProjectionPoint(route.points[i].timestamp,route.points[i].lat, route.points[i].lon)); 

        buildCircle(pos,lmapRoute.color, 2,1,rt.buildMarkerTitle(route.points[i])).addTo(lmapRoute.markersLayer);

    }
    buildTrace (tpath, lmapRoute.color,1,1.5).addTo(lmapRoute.traceLayer); 
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

export {
    initialize,updateMapCheckpoints,updateMapFleet,cleanMap,set_displayFilter,set_currentId,set_currentTeam,
    updateMapWaypoints,updateMapMe,updateMapLeader,
    importRoute,hideRoute,showRoute,deleteRoute,onMarkersChange,hideShowTracks
};