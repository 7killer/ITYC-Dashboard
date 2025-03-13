import * as Util from './util.js';
import * as zz from './zezoscript.js';
import * as lMap from './map.js';
import * as DM from './dataManagement.js';


const routeInfosmodel =
{
    lat : "",
    lon : "",
    timestamp : "",
    heading : "",
    tws : "",
    twa : "",
    twd : "",
    sail : "",
    speed : "",
    stamina : "",
    boost : ""
}

var myRoute = [];
var markersState = true;
var displayFilter = 0;
var currentId = 0;

var actualZezoColor = "#AA0000";
var actualAvalon00Color ="#0000FF";
var actualAvalon06Color ="#005500";
var actualAvalon12Color ="#5500AA";
var actualAvalon18Color ="#AA0055";
var actualVRZenColor ="#499300";
var actualgpxColor ="#009349";

String.prototype.cleanSpecial = function() {
    var rules = {
        'a': /[àâ]/g,
        'A': /[ÀÂ]/g,
        'e': /[èéêë]/g,
        'E': /[ÈÉÊË]/g,
        'i': /[îï]/g,
        'I': /[ÎÏ]/g,
        'o': /[ô]/,
        'O': /[Ô]/g,
        'u': /[ùû]/g,
        'U': /[ÙÛ]/g,
        'c': /[ç]/g,
        'C': /[Ç]/g,
        ',' : /[;]/g,
        '' : /(\r\n|\n|\r)/g,
        '' : /[\/|\s|-]/g,
        '' : / +/g
        
    };
    var str = this;
    for(var latin in rules) {
        var nonLatin = rules[latin];
        str = str.replace(nonLatin , latin);
    }
    return str;
}



function set_displayFilter(value)
{
    displayFilter =value;

}
function set_currentId(value)
{
    currentId = value;
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

function initialize(raceId)
{
    if(!raceId) return;
    myRoute[raceId] = [];
    document.getElementById("route_list_tableLmap").innerHTML = "";

}

function createEmptyRoute(raceId,name,skipperName,color,displayedName)
{

    if(!raceId || !name) return;
    if(!myRoute[raceId]) myRoute[raceId] = [];
    if(myRoute[raceId][name]) delete myRoute[raceId][name]; 

    myRoute[raceId][name] = [];

    var currentRoute = myRoute[raceId][name];
    currentRoute.points = [];
    currentRoute.Lmap = [];
    
    currentRoute.displayed = false;
    currentRoute.displayedName = displayedName;
    
    currentRoute.loaded = false;
    currentRoute.skipperName = skipperName;
    currentRoute.color = color;


}

function addNewPoints(raceId,name,routeInfoData) {

    if(!raceId || !name || !myRoute[raceId] || !myRoute[raceId][name] || !routeInfoData) return;  
    myRoute[raceId][name].points.push(routeInfoData);

}

function getRoute(raceId,name)
{
    if(!raceId || !name || !myRoute[raceId] || !myRoute[raceId][name]) return;  
    
    return myRoute[raceId][name];
}
/* data  interface *******************************/

var fleetInfos = [];
var racesInfos = [];

var currentRace = "";

function updateFleet(race,raceFleetInfo)
{
    if(currentRace != race)
    {
        fleetInfos = [];
        currentRace = race;
    }
    if(!currentRace) return;
    var fleet = raceFleetInfo.get(currentRace.id);
    if(!fleet)    return;
    Object.keys(fleet.uinfo).forEach(function (key) {
        var elem = fleet.uinfo[key];
        var currentUinfo = fleetInfos[key];
        if(!currentUinfo)
        {
            fleetInfos[key] = [];
        }
        fleetInfos[key].pos = elem.pos;
        fleetInfos[key].options =  DM.getRaceOptionsPlayer(currentRace.id,key);

//        fleetInfos[key].options = elem.options;
        fleetInfos[key].displayName = elem.displayName;
        fleetInfos[key].twa = elem.twa;
        fleetInfos[key].uid = key;
        fleetInfos[key].type2  = elem.type2;
        fleetInfos[key].type  = elem.type;
        fleetInfos[key].choice  = elem.choice;
        fleetInfos[key].state  = elem.state;

    });

    if (popupStateLmap) loadRacingSkipperList("sel_rt_skipperLmap");
}

function updateRaces(races)
{
    racesInfos = races;
}

function routeExists(race,name) {

    if(!raceId || !name) return false;
    if(!myRoute[raceId]) return false;
    if(myRoute[raceId][name]) return true; 

    return false;
}
function importGPXRoute(race,gpxFile,routerName,skipperName,color) {

    if (!race || !gpxFile || !racesInfos) return "";
    
    if (!gpxFile) return "" ;//File not available

    let gpx = new gpxParser(); //Create gpxParser Object
    gpx.parse(gpxFile); //parse gpx file from string data

    let gpxPoints;
    if (!gpx || (!gpx.routes && !gpx.tracks&& !gpx.waypoints)) return "" ; //File not available
    if (Array.isArray(gpx.routes) && gpx.routes[0]?.points) gpxPoints = gpx.routes[0].points;
    else if (Array.isArray(gpx.tracks) && gpx.tracks[0]?.points) gpxPoints = gpx.tracks[0].points;
    else if (Array.isArray(gpx.waypoints)) gpxPoints = gpx.waypoints;
    else return "";

    var routeName = routerName + " " + skipperName;
    createEmptyRoute(race.id,routeName.cleanSpecial(),skipperName,color,routeName);

    gpxPoints.forEach(function (pt) {
        
        var lat = Number(pt.lat);
        var lon = Number(pt.lon);
        
        var routeData = Object.create(routeInfosmodel);

        routeData.lat = lat;
        routeData.lon =  lon;
        routeData.timestamp = Date.parse(pt.time);
        routeData.heading = "";
        routeData.tws = "";
        routeData.twa = "";
        routeData.twd = "";
        routeData.sail = "";
        routeData.speed = "";
        routeData.stamina = "";
        routeData.boost = "";
        addNewPoints(race.id,routeName.cleanSpecial(),routeData);

    });
    return routeName.cleanSpecial();
}
function importExternalRouter(race,fileTxt,routerName,skipperName,color,mode) {
         
    if (!race || !fileTxt || !racesInfos) return "";
    

    //Mode 0 Avalon
    //Mode 1 VRZen
    var poi = new Array();
    var i = 0;
    fileTxt = fileTxt.replace('\r','');
    var lineAvl = fileTxt.split('\n');
    if(lineAvl.length<= 1) //empty file or file not exits 
    {
        return "" ;//File not available
    }
    var routeName = routerName + " " + skipperName;
    createEmptyRoute(race.id,routeName.cleanSpecial(),skipperName,color,routeName);

    var currentYear = new Date();
    currentYear = currentYear.getFullYear();
    var previousMonth =0;
    while (i < lineAvl.length-2) {
        i = i + 1;
        //if (i > 54) i = i + 5;
        if(i > lineAvl.length-2) i = lineAvl.length-2;
        poi = lineAvl[i].replace(/\,/g,".").split(";"); //Fix To Accept VRZEN File or manually modified csv on US configured computer


        var isoDate, hdg, tws, twa, twd, sail, stw, lat, lon, splitDate, heure, date, stamina, boost;

        if(mode == 1)
        {//VRZen
            lat = Number(poi[3]);
            lon = Number(poi[4]);
            hdg = poi[5]+ "°";
            tws = Util.roundTo(poi[12], 2)+ " kts";
            stw = Util.roundTo(poi[10], 2) + " kts";
    
            splitDate = poi[0].split(" ");
            heure = splitDate[1];

            if(splitDate[0].includes("/")) {
                date = splitDate[0].split("/");
                if(date[0].length > 2)
					isoDate = splitDate[0] + " " + heure;
				else
					isoDate = date[2]+"-"+date[1]+"-"+date[0] + " " + heure;
                isoDate += " GMT";
            } else if(splitDate[0].includes("-")) {
                date = splitDate[0].split("-");
				if(date[0].length > 2)
					isoDate = splitDate[0] + " " + heure;
				else
					isoDate = date[2]+"-"+date[1]+"-"+date[0] + " " + heure;
                isoDate += " GMT";
            } else 
                isoDate = poi[0]+" GMT";

            sail =  poi[15];
            twa = Util.roundTo(poi[6], 2)+ "°";
            twd = Util.roundTo(poi[11], 2)+ "°"; 
            stamina = Util.roundTo(poi[24], 2);
            boost = Util.roundTo(poi[16], 2);
        } else
        { //default Mode Avalon
            const isNumber = n => (typeof(n) === 'number' || n instanceof Number ||
                    (typeof(n) === 'string' && !isNaN(n))) &&
                    isFinite(n);
            
            if(isNumber(poi[1]))  //old avalon format pos in decimal
            {
                lat = Number(poi[1]);
                lon = Number(poi[2]);    
            } else //new avalon format pos in xx°xx'xxss
            {
               let posDec =  Util.convertDMS2Dec(poi[1],poi[2]);
               lat = posDec.lat;
               lon = posDec.lon
            }
            hdg = poi[3]+ "°";
            tws = Util.roundTo(poi[8], 2)+ " kts";
            stw = Util.roundTo(poi[4], 2) + " kts";
    
            
            splitDate = poi[0].split(" ");
            var heure = splitDate[1]+":00";
            var date = splitDate[0].split("/");

            if(previousMonth==0) previousMonth = date[1];
            if(previousMonth==12 && date[1] == 1) currentYear+1;

            isoDate = currentYear+"-"+ date[1]+"-"+date[0]+ " " + heure;
            if(poi[6]>180) poi[6] -=360;
            twa = Util.roundTo(poi[6], 2)+ "°";
            twd = Util.roundTo(poi[7], 2) + "°";
            if(isNumber(poi[5]))
                sail = "(" + poi[5] + ")"; //todo found link between avalon number and sail (temporarily, display the id)
            else
                sail = poi[5]; //new version give sail name
            stamina = Util.roundTo(poi[9], 2);
            boost = Util.roundTo(poi[10], 2);
            
        }
        
        

        var routeData = Object.create(routeInfosmodel);

        routeData.lat = lat;
        routeData.lon =  lon;
        routeData.timestamp = Date.parse(isoDate);
        routeData.heading = hdg;
        routeData.tws = tws;
        routeData.twa = twa;
        routeData.twd = twd;
        routeData.sail = sail;
        routeData.speed = stw;
        routeData.stamina = stamina;
        routeData.boost = boost;
        addNewPoints(race.id,routeName.cleanSpecial(),routeData);
        
    }
    return routeName.cleanSpecial();

}


function getOption(name) {
    var z = "cb_" + name;
    chrome.storage.local.get([z], function(result) {
        if (result.key !== undefined) {
            var checkBox = document.getElementById(name);
            if(checkBox) 
            {
                checkBox.checked = (result.key.v === "true");
                var event = new Event('change');
                checkBox.dispatchEvent(event);
            }
        }
      });
}
/* web interface *********************************/

var popupStateLmap = false;


function initializeWebInterface(mkState)
{

    
    popupStateLmap = false;
    

    document.getElementById("lbl_rt_openLmap").addEventListener("click", onPopupOpenLmap);
    document.getElementById("rt_close_popupLmap").addEventListener("click", onPopupCloseLmap);
    document.getElementById("rt_popupLmap").style.display = "none";
    document.getElementById("sel_routeTypeLmap").addEventListener("change", onChangeRouteTypeLmap);
    document.getElementById("sel_routeTypeLmap").value = "rt_Zezo";
    document.getElementById("lbl_helpLmap").addEventListener("click", help);
    markersState = mkState;
    

    
}

function loadRacingSkipperList(elt)
{
    var selectobject = document.getElementById(elt);
    var options = selectobject.getElementsByTagName('OPTION');
    var optionsSelect = selectobject.value;
    var optionsSelectStillExist = false;
    
    for (var i=0; i<options.length; i++) {
        selectobject.removeChild(options[i]);
        i--;
    }


    var fln = new Array();

    Object.keys(fleetInfos).forEach(function (key) {
        if (fleetInfos[key].state != "Arrived") {
            fln.push(key);
        }
    });

    function numeric (s) {
        var r = String(s);
        if ( r.substr(0, 1) == "(" ) {
            r = r.slice(1, -1);
        }
        if ( isNaN(r) ) {
            r = r.toUpperCase();
        } else {
            r = Number(r);
        }
        return r;
    }
    fln.sort(function (uidA, uidB) {
        // Check if we have values at all
        if (fleetInfos[uidA] == undefined && fleetInfos[uidB] == undefined) return 0;
        if (fleetInfos[uidB] == undefined) return -1;
        if (fleetInfos[uidA] == undefined) return 1;

        // Fetch value of sort field and convert to number.
        var entryA = fleetInfos[uidA].displayName;
        var entryB = fleetInfos[uidB].displayName;

        // Prefer defined values over undefined values
        if (entryA == undefined && entryB == undefined) return 0;
        if (entryB == undefined) return -1;
        if (entryA == undefined) return 1;

        // Cast to number if possible
        entryA = numeric(entryA);
        entryB = numeric(entryB);

        // Compare values.
        //if (currentSortOrder == 0) {
            if (entryA < entryB) return -1;
            if (entryA > entryB) return 1;
      /*  } else {
            if (entryA > entryB) return -1;
            if (entryA < entryB) return 1;
        }*/
        return 0;
    });

   
    Object.keys(fln).forEach(function (key) {
        if (isDisplayEnabled(fleetInfos[fln[key]], fln[key])) {
            var option = document.createElement("option");

            let optionK = "";
            if(!fleetInfos[fln[key]].options || fleetInfos[fln[key]].options=="?")
                optionK = "(*) ";

            option.text = optionK+fleetInfos[fln[key]].displayName;
            option.value = fln[key];
            if(fln[key]==optionsSelect) optionsSelectStillExist = true;

            document.getElementById(elt).appendChild(option);
        }
    });
    if(optionsSelectStillExist) selectobject.value = optionsSelect;
    onSkipperSelectedChange("Lmap");
}



function onPopupOpenLmap()
{
    if(!popupStateLmap && currentRace!="")  
    {
        popupStateLmap = true;
        document.getElementById("rt_popupLmap").style.display = "block";
        document.getElementById("sel_rt_skipperLmap").style.display = "block";
        document.getElementById("rt_nameSkipperLmap").style.display = "none";
        document.getElementById("rt_extraFormat2Lmap").style.display = "flex";
        document.getElementById("rt_extraFormat3Lmap").style.display = "flex";
        document.getElementById("sel_routeTypeLmap").value = "rt_Zezo";
        document.getElementById("route_colorLmap").value = actualZezoColor;
        loadRacingSkipperList("sel_rt_skipperLmap");
        onChangeRouteTypeLmap();
    }
}

function onPopupCloseLmap() {
    popupStateLmap = false;
    document.getElementById("rt_popupLmap").style.display = "none";
}
function cleanAll()
{
    myRoute = [];
    lMap.cleanAll();

}



function onCleanRoute(race) {

    Object.keys(myRoute[race.id]).forEach(function (name) {
        lMap.deleteRoute(race,name);    
           
        delete myRoute[race.id];
    });
    document.getElementById("route_list_tableLmap").innerHTML = "";

}


function onChangeRouteTypeLmap() {
    var routeType = document.getElementById("sel_routeTypeLmap").value;
    switch(routeType)
    {

        default :
            return;
        case "rt_Zezo":
            document.getElementById("sel_rt_skipperLmap").style.display = "block";
            document.getElementById("rt_nameSkipperLmap").style.display = "none";
            document.getElementById("route_colorLmap").value = actualZezoColor;
            document.getElementById("rt_extraFormat2Lmap").style.display = "flex";
            document.getElementById("rt_extraFormat3Lmap").style.display = "flex";
            document.getElementById("rt_popupLmap").style.height = "9.5em";
            break;
        case "rt_Avalon":
            document.getElementById("sel_rt_skipperLmap").style.display = "none";
            document.getElementById("rt_nameSkipperLmap").style.display = "block";
            document.getElementById("rt_nameSkipperLmap").value =  document.getElementById("lb_boatname").textContent;
            document.getElementById("rt_nameSkipperLmap").setAttribute("placeholder", "Add custom name...");
            document.getElementById("route_colorLmap").value = actualAvalon06Color;
            document.getElementById("rt_extraFormat2Lmap").style.display = "none";
            document.getElementById("rt_extraFormat3Lmap").style.display = "none";
            document.getElementById("rt_popupLmap").style.height = "6em";
            break;
        case "rt_VRZen":
            document.getElementById("sel_rt_skipperLmap").style.display = "none";
            document.getElementById("rt_nameSkipperLmap").style.display = "block";
            document.getElementById("rt_nameSkipperLmap").value =  document.getElementById("lb_boatname").textContent;
            document.getElementById("rt_nameSkipperLmap").setAttribute("placeholder", "Add custom name...");
            document.getElementById("route_colorLmap").value =  actualVRZenColor;
            document.getElementById("rt_extraFormat2Lmap").style.display = "none";
            document.getElementById("rt_extraFormat3Lmap").style.display = "none";
            document.getElementById("rt_popupLmap").style.height = "6em";
            break;
        case "rt_gpx":
            document.getElementById("sel_rt_skipperLmap").style.display = "none";
            document.getElementById("rt_nameSkipperLmap").style.display = "block";
            document.getElementById("rt_nameSkipperLmap").value =  document.getElementById("lb_boatname").textContent;
            document.getElementById("rt_nameSkipperLmap").setAttribute("placeholder", "Add custom name...");
            document.getElementById("route_colorLmap").value =  actualgpxColor;
            document.getElementById("rt_extraFormat2Lmap").style.display = "none";
            document.getElementById("rt_extraFormat3Lmap").style.display = "none";
            document.getElementById("rt_popupLmap").style.height = "6em";
            break;
      
    }
}

async function loadExternalFile(race,type) {
    var tf = '.gpx';
    var routeType = 'Gpx';
    var routeFormat = 3;
    if(type == "rt_Avalon") {
        tf = '.csv';
        routeType = "Avalon ";
        routeFormat = 0;
    } else if(type == "rt_VRZen") {
        tf = '.csv';
        routeType = "VR Zen ";
        routeFormat = 1;
    } else if(type == "rt_gpx") {
        tf = '.gpx';
        routeType = "Gpx ";
        routeFormat = 3;
    }




    const pickerOpts = {
        types: [
          {
            description: 'Routage',
            accept: {
              'track/*': [tf]
            }
          },
        ],
        excludeAcceptAllOption: true,
        multiple: false
      };
      let fileHandle;
      
      [fileHandle] = await window.showOpenFilePicker(pickerOpts);
      const fileH = await fileHandle.getFile();
      const fileData = await fileH.text();
      if(type == "rt_Avalon" || type == "rt_VRZen") {
        return importExternalRouter(
            race,
            fileData,
            routeType,
            document.getElementById("rt_nameSkipperLmap").value,
            document.getElementById("route_colorLmap").value,
            routeFormat);
      } else if(type == "rt_gpx" ) {
        return importGPXRoute(
            race,
            fileData,
            "Gpx",
            document.getElementById("rt_nameSkipperLmap").value,
            document.getElementById("route_colorLmap").value,
        );   
      }

    
}

function buildPlayerOption(type)
{
    let option = "";
    let option2 = "";
    let optFound = false;
    let optFound2 = false;

    if(getCheckbox("opt_FP_"+type)) {
        optFound = true;
        option = "All Options";
    } else{
        if(getCheckbox("opt_hgss_"+type)) {
            optFound = true;
            option = "[heavy";
        }
        if(getCheckbox("opt_ljg_"+type)) {
            if(optFound) option+=","; else option = "[";
            optFound = true;
            option += "light";
        }
        if(getCheckbox("opt_c0_"+type)) {
            if(optFound) option+=","; else option = "[";
            optFound = true;
            option += "reach";
        }
        if(optFound) option += "] ";
        
        if(getCheckbox("opt_foils_"+type)) {
            optFound2 = true;
            option2 = "[foil";
        }
        if(getCheckbox("opt_hull_"+type)) {
            if(optFound2) option2+=","; else option2 = "[";
            optFound2 = true;
            option2 += "hull";
        }
        if(getCheckbox("opt_winch_"+type)) {
            if(optFound2) option2+=","; else option2 = "[";
            optFound2 = true;
            option2 += "winch";
        }
/*        if(getCheckbox("opt_magicFurler_"+type)) {
            if(optFound2) option2+=","; else option2 = "[";
            optFound2 = true;
            option2 += "magicFurler";
        }
        if(getCheckbox("opt_vrtexJacket_"+type)) {
            if(optFound2) option2+=","; else option2 = "[";
            optFound2 = true;
            option2 += "vrtexJacket";
        }
        if(getCheckbox("opt_comfortLoungePug_"+type)) {
            if(optFound2) option2+=","; else option2 = "[";
            optFound2 = true;
            option2 += "comfortLoungePug";
        }*/
        if(optFound2) option2 += "] ";

    }
    if(!optFound && !optFound2) option = "-";
    else if(optFound2) option += option2; 
    return option;
}

async function onAddRouteLmap(race) {
    var routeType = document.getElementById("sel_routeTypeLmap").value;

    if(!currentRace.id) return;
    var routeName = "";
   
    switch(routeType)
    {
        default :
            return;
        case "rt_Zezo":
            var raceInfos = racesInfos.get(currentRace.id);
            if(!raceInfos) return;
             if (!raceInfos.url) {
                alert("Unknown race - no routing available");
                return;
             }
            var currentUinfo = fleetInfos[document.getElementById("sel_rt_skipperLmap").value];
            if(!currentUinfo) {
                alert("Unknown player - no routing available");
                return;
            }
            
            currentUinfo.options = buildPlayerOption("Lmap");
    
            document.getElementById("bt_rt_addLmap").innerText = "Loading";
            document.getElementById("bt_rt_addLmap").disabled = true;
            
            zz.zezoCall(currentUinfo,raceInfos,document.getElementById("route_colorLmap").value,race);    
            //update map is done in zezo call as its async
            actualZezoColor = '#'+Math.floor(Math.random()*16777216).toString(16).padStart(6, '0');
            document.getElementById("route_colorLmap").value = actualZezoColor;
            break;

        case "rt_Avalon" :
            routeName = await loadExternalFile(race,"rt_Avalon");
            break;
        case "rt_VRZen" :
            routeName = await loadExternalFile(race,"rt_VRZen");
            break; 
        case "rt_gpx" :
            routeName = await loadExternalFile(race,"rt_gpx");   
            break;          
    }
    if(routeName != "") {
        updateRouteListHTML();
        displayMapTrace(race,routeName);
    }

         
}
function upDateCheckbox(elt,value)
{
    var checkBox = document.getElementById(elt);
    if(checkBox) 
    {
        checkBox.checked = value;
        var event = new Event('change');
        checkBox.dispatchEvent(event);
    }
}
function getCheckbox(elt)
{
    var checkBox = document.getElementById(elt);
    if(checkBox) 
    
        return checkBox.checked;
     else
        return null;
}
function onSkipperSelectedChange(type)
{

    if(!currentRace.id) return;
    var raceInfos = racesInfos.get(currentRace.id);
    if(!raceInfos) return;
    var currentUinfo = fleetInfos[document.getElementById("sel_rt_skipper"+type).value];
    if(!currentUinfo) { //shall never be true
        alert("Unknown player - no routing available");
        return;
    }
    if( currentUinfo.options == "-" || currentUinfo.options == "?"|| currentUinfo.options == "---")
    {
         //unlock full pack 
         upDateCheckbox("opt_FP_"+type,false);
    } else
    {
        //preload player options
        if (currentUinfo.options) {
            if(currentUinfo.options == "Full Pack" || currentUinfo.options == "All Options")
            {
                upDateCheckbox("opt_FP_"+type,true);
                upDateCheckbox("opt_hull_"+type,true);
                upDateCheckbox("opt_foils_"+type,true);
                upDateCheckbox("opt_winch_"+type,true);
//                upDateCheckbox("opt_magicFurler_"+type,true);
//               upDateCheckbox("opt_vrtexJacket_"+type,true);
//                upDateCheckbox("opt_comfortLoungePug_"+type,true);
                upDateCheckbox("opt_c0_"+type,true);
                upDateCheckbox("opt_ljg_"+type,true);
                upDateCheckbox("opt_hgss_"+type,true);
            }
            else if(currentUinfo.options == "-")
            {
                upDateCheckbox("opt_FP_"+type,false);
                upDateCheckbox("opt_hull_"+type,false);
                upDateCheckbox("opt_foils_"+type,false);
                upDateCheckbox("opt_winch_"+type,false);
//                upDateCheckbox("opt_magicFurler_"+type,false);
//                upDateCheckbox("opt_vrtexJacket_"+type,false);
//                upDateCheckbox("opt_comfortLoungePug_"+type,false);
                upDateCheckbox("opt_c0_"+type,false);
                upDateCheckbox("opt_ljg_"+type,false);
                upDateCheckbox("opt_hgss_"+type,false);
        
            } else if(currentUinfo.options == "?"|| currentUinfo.options == "---") {
                upDateCheckbox("opt_FP_"+type,false);
            } else {
                upDateCheckbox("opt_FP_"+type,false);
                if(currentUinfo.options.indexOf("hull") == -1) upDateCheckbox("opt_hull_"+type,false); else upDateCheckbox("opt_hull_"+type,true);
                if(currentUinfo.options.indexOf("foil") == -1) upDateCheckbox("opt_foils_"+type,false); else upDateCheckbox("opt_foils_"+type,true);
                if(currentUinfo.options.indexOf("winch") == -1) upDateCheckbox("opt_winch_"+type,false); else upDateCheckbox("opt_winch_"+type,true);
                if(currentUinfo.options.indexOf("reach") == -1) upDateCheckbox("opt_c0_"+type,false); else upDateCheckbox("opt_c0_"+type,true);
                if(currentUinfo.options.indexOf("light") == -1) upDateCheckbox("opt_ljg_"+type,false); else upDateCheckbox("opt_ljg_"+type,true);
                if(currentUinfo.options.indexOf("heavy") == -1) upDateCheckbox("opt_hgss_"+type,false); else upDateCheckbox("opt_hgss_"+type,true);
//                if(currentUinfo.options.indexOf("magicFurler") == -1) upDateCheckbox("opt_magicFurler_"+type,false); else upDateCheckbox("opt_magicFurler_"+type,true);
//                if(currentUinfo.options.indexOf("vrtexJacket") == -1) upDateCheckbox("opt_vrtexJacket_"+type,false); else upDateCheckbox("opt_vrtexJacket_"+type,true);
//                if(currentUinfo.options.indexOf("comfortLoungePug") == -1) upDateCheckbox("opt_comfortLoungePug_"+type,false); else upDateCheckbox("opt_comfortLoungePug_"+type,true);
            }
        } else{
            upDateCheckbox("opt_FP_"+type,false);
            upDateCheckbox("opt_hull_"+type,false);
            upDateCheckbox("opt_foils_"+type,false);
            upDateCheckbox("opt_c0_"+type,false);
            upDateCheckbox("opt_ljg_"+type,false);
            upDateCheckbox("opt_hgss_"+type,false);
//            upDateCheckbox("opt_magicFurler_"+type,false);
//            upDateCheckbox("opt_vrtexJacket_"+type,false);
//            upDateCheckbox("opt_comfortLoungePug_"+type,false);
        }
    }
}

function onRouteListClick(ev,race) {

    var re_hsLmap = new RegExp("^lbl_rt_name_Lmap:(.+)"); // Hide/Show Routing Lmap
    var re_ccLmap = new RegExp("^color_rt_name_Lmap:(.+)"); // Change Color Lmap
//    var re_wisp = new RegExp("^wi:(.+)"); // delete
    var ev_lbl = ev.target.id;

    for (var node = ev.target; node; node = node.parentNode) {
        var id = node.id;
        var rt_name;
        if (rt_name = re_hsLmap.exec(node.id)) { // Hide/Show Routing
            if(currentRace.id && myRoute[currentRace.id][rt_name[1]])
            {
                if(myRoute[currentRace.id][rt_name[1]].displayed)
                {
                    myRoute[currentRace.id][rt_name[1]].displayed = false;
                    //todo hide routage
                    document.getElementById('sel_rt_name_Lmap:'+rt_name[1]).checked=false;
                    lMap.hideRoute(race,rt_name[1]);
                } else
                {
                    myRoute[currentRace.id][rt_name[1]].displayed = true;
                    //todo show routage
                    document.getElementById('sel_rt_name_Lmap:'+rt_name[1]).checked=true;
                    lMap.showRoute(race,rt_name[1]);    

                }
            }
        } else if (rt_name = re_ccLmap.exec(node.id)) {  // Change Color
            if(currentRace.id && myRoute[currentRace.id][rt_name[1]])
            {
                if(myRoute[currentRace.id][rt_name[1]].color != document.getElementById(node.id).value) {
                    myRoute[currentRace.id][rt_name[1]].color = document.getElementById(node.id).value;
                    document.getElementById('color_rt_name_Lmap:'+rt_name[1]).value=myRoute[currentRace.id][rt_name[1]].color;
                    lMap.importRoute(myRoute[currentRace.id][rt_name[1]],race,rt_name[1]);
                
                }
            }
        }
    }
}

function onMarkersChange(race) {
    if(markersState)
        markersState = false;
    else
        markersState = true;
    
    document.getElementById('sel_showMarkersLmap').checked=markersState;
    lMap.onMarkersChange(race,markersState);
    return markersState;
}
function updateRouteListHTML()
{
    var tableBody =  '<tbody>';

    var routeList = myRoute[currentRace.id];
    if(routeList) {
        Object.keys(routeList).forEach(function (name) {
            tableBody += '<tr class="rt_lst_line">';
                tableBody += '<td class="rt_lst_name noBorderElt">';
                    tableBody += '<input type="checkbox" id="';
                    tableBody += 'sel_rt_name_Lmap:'+name;
                    tableBody += '" name="checkbox3" class="content hidden"';
                    if(routeList[name].displayed) tableBody += 'checked';
                    tableBody += '>';

                    tableBody += '<label for:"'+'sel_rt_name_Lmap:'+name + '" id="'+'lbl_rt_name_Lmap:'+name +'">'; 
                    tableBody += routeList[name].displayedName +'</label>';
                tableBody += '</td>'    
            tableBody += '<td class="rt_lst_color noBorderElt">';
                tableBody += '<input  type="color" id="color_rt_name_Lmap:'+name +'" value="';
                tableBody += routeList[name].color +'">';
            tableBody += '</td>'
            tableBody += '</tr>'

        });
    }
 
    tableBody +=  '</tbody>';
    document.getElementById("route_list_tableLmap").innerHTML = tableBody;


}

function buildMarkerTitle(point)
{

    var position = Util.formatPosition(point.lat, point.lon);
    const currentDate = new Date();
    const currentTs = currentDate.getTime();

    var newDate =   currentDate;  
    if(point.timestamp!="-")
        var newDate = Util.formatShortDate(point.timestamp,undefined,document.getElementById("local_time").checked);


    var ttw = point.timestamp-currentTs;

    var textTWA = point.twa ? "TWA: <b>" + point.twa.replace(/&deg;/g, "°") + "</b>" : "";
    var textHDG = point.heading ? "HDG: <b>" + point.heading.replace(/&deg;/g, "°") + "</b><br>" : "";
    var textTWD = point.twd ? "TWD: " + point.twd.replace(/&deg;/g, "°") : "";
    var textTWS = point.tws ? "TWS: " + point.tws + "<br>" : "";
    var textSail = point.sail ? "Sail: " + point.sail : "";
    if (point.boost && point.boost > 0) textSail += "⚠️";
    var textSpeed = point.speed ? "Speed: " + point.speed : "";
    // Data visual separator
    textTWA += point.twa && point.heading ? "&nbsp;|&nbsp;" : "";
    textTWD += point.twd && point.tws ? "&nbsp;|&nbsp;" : "";
    textSail += point.sail && point.speed ? "&nbsp;|&nbsp;" : "";
    let textStamina = '';
    if (point.stamina && point.stamina > 0) textStamina = "🔋 " + point.stamina + "%";

    var title = "<b>" + newDate + "</b> (" + Util.formatDHMS(ttw) + ")<br>"
        + position + "<br>"
        + textTWA + textHDG
        + textTWD + textTWS
        + textSail + textSpeed + "<br>"
        + textStamina;

    return title;

}

function darkenColor(hexColor, amount) {
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

function displayMapTrace(race,routeName)
{
    var route = getRoute(race.id,routeName);
    if(!route) return;
    lMap.importRoute(route,race,routeName);
    route.displayed = true;
    document.getElementById('sel_rt_name_Lmap:'+routeName).checked=true;
}

// Help for import
function help(){
    var msg = "Affichage des traits de côtes :\n" +
        "- Zoomer sur la zone de la carte où vous souhaitez afficher les traits de côtes. Ils apparaissent automatiquement en bleu après quelques instants. Pour afficher une zone différente, dézoomez et zommez à l'endroit désiré.\n- La couleur des traits de côtes peut être personnalisée (Sélection couleur 'Côtes')\n\n" + 
        "Importer un routage :\n" +
        "- Zezo : importer automatiquement la route suggérée par Zezo en cliquant sur 'Import'.\n" +
        "- Avalon : depuis votre logiciel Avalon, exportez votre route au format CSV et importez le fichier.\n" +
        "- VRZen : depuis le site du routeur VRZen, exportez votre route au format CSV et importez le fichier.\n" +
        "- Autre : importez un fichier au format GPX après avoir sélectionné son emplacement.\n\n" +
        "Copier les coordonnées pointées par la souris :\n" +
        "- Appuyez en même temps sur les touches de votre clavier : CTRL + B (ou Cmd + B sur Mac). Les coordonnées seront copiées dans le Presse-papier. Pour les réutiliser, il faudra réaliser l'action \"Coller\" (CTRL + V).";
        
    alert(msg);
}

export {
    initialize,routeInfosmodel,createEmptyRoute,addNewPoints,getRoute,routeExists,
    myRoute,updateRouteListHTML,onRouteListClick,buildMarkerTitle,displayMapTrace,onCleanRoute,onMarkersChange,onAddRouteLmap,
    initializeWebInterface,updateFleet,updateRaces,set_displayFilter,set_currentId,
    darkenColor,onSkipperSelectedChange

};