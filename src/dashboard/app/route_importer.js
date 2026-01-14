

import {getUserPrefs} from './../../common/userPrefs.js'
import { mapState } from './../ui/map/map-race.js';
import { cleanSpecial,roundTo,convertDMS2Dec} from './../../common/utils.js';
import GPXParser from "gpxparser";
export const routeInfosmodel =
{
    lat : "",
    lon : "",
    timestamp : "",
    hdg : "",
    tws : "",
    twa : "",
    twd : "",
    sail : "",
    speed : "",
    stamina : "",
    boost : ""
}

export function initRouteList()
{
    const raceInfo = getRaceInfo();
    if(!raceInfo) return;
    const rid = raceInfo.raceId+"-"+raceInfo.legNum;
    /*todo delete route of previous race */
    mapState.route[rid] = [];
    document.getElementById("route_list_tableLmap").innerHTML = "";

}


export function createEmptyRoute(rid,name,skipperName,color,displayedName)
{
    
    if(!rid || !name) return;
    if(!mapState.route[rid]) mapState.route[rid] = [];
    if(mapState.route[rid][name]) delete mapState.route[rid][name]; 

    mapState.route[rid][name] = [];

    const currentRoute = mapState.route[rid][name];
    currentRoute.points = [];
    
    currentRoute.displayed = true;
    currentRoute.displayedName = displayedName;
    
    currentRoute.loaded = false;
    currentRoute.skipperName = skipperName;
    currentRoute.color = color;


}

export function addNewPoints(rid,name,routeInfoData) {
    const hasRoute = !!mapState?.route?.[rid]?.[name];
    if (!hasRoute || !routeInfoData) return;
    mapState.route[rid][name].points.push(routeInfoData);

}


export function importGPXRoute(race,gpxFile,routerName,skipperName,color) {

    const raceInfo = getRaceInfo();
    if(!raceInfo || !gpxFile) return;
    const rid = raceInfo.raceId+"-"+raceInfo.legNum;


    let gpx = new GPXParser(); //Create gpxParser Object
    gpx.parse(gpxFile); //parse gpx file from string data

    let gpxPoints;
    if (!gpx || (!gpx.routes && !gpx.tracks && !gpx.waypoints)) return "" ; //File not available
    if (Array.isArray(gpx.routes) && gpx.routes[0]?.points) gpxPoints = gpx.routes[0].points;
    else if (Array.isArray(gpx.tracks) && gpx.tracks[0]?.points) gpxPoints = gpx.tracks[0].points;
    else if (Array.isArray(gpx.waypoints)) gpxPoints = gpx.waypoints;
    else return "";

    const routeName = cleanSpecial(routerName + " " + skipperName);
    createEmptyRoute(rid,routeName,skipperName,color,routerName + " " + skipperName);

    gpxPoints.forEach(function (pt) {
        
        const lat = Number(pt.lat);
        const lon = Number(pt.lon);  
        const routeData = Object.create(routeInfosmodel);

        routeData.lat = lat;
        routeData.lon =  lon;
        routeData.timestamp = Date.parse(pt.time);
        routeData.hdg = "";
        routeData.tws = "";
        routeData.twa = "";
        routeData.twd = "";
        routeData.sail = "";
        routeData.speed = "";
        routeData.stamina = "";
        routeData.boost = "";
        routeData.desc = pt.desc;
        addNewPoints(rid,routeName,routeData);

    });
    return routeName;
}


export function importExternalRouter(rid,fileTxt,routerName,skipperName,color,mode) {
         
    if (!rid || !fileTxt) return "";

    //Mode 0 Avalon
    //Mode 1 VRZen
    let poi = new Array();
    let i = 0;
    fileTxt = fileTxt.replace('\r','');
    const lineAvl = fileTxt.split('\n');
    if(lineAvl.length<= 1) //empty file or file not exits 
    {
        return "" ;//File not available
    }
    const routeName = cleanSpecial(routerName + " " + skipperName);
    createEmptyRoute(rid,routeName,skipperName,color,routerName + " " + skipperName);

    let currentYear = new Date();
    currentYear = currentYear.getFullYear();
    let previousMonth =0;

    const totalLines = lineAvl.length-2;
    if (mode == 1) totalLines = lineAvl.length-1;
    while (i < totalLines) {
        i = i + 1;
        if (i > totalLines) i = totalLines;
        poi = lineAvl[i].replace(/\,/g,".").split(";");

        let isoDate, hdg, tws, twa, twd, sail, stw, lat, lon, splitDate, heure, date, stamina, boost;

        if(mode == 1)
        {//VRZen
            lat = Number(poi[3]);
            lon = Number(poi[4]);
            hdg = poi[5]+ "°";
            tws = roundTo(poi[12], 2)+ " kts";
            stw = roundTo(poi[10], 2) + " kts";
    
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

            sail = renameSailFromRoutes(poi[15]);
            twa = roundTo(poi[6], 2)+ "°";
            twd = roundTo(poi[11], 2)+ "°"; 
            stamina = roundTo(poi[24], 2);
            boost = roundTo(poi[16], 2);
        } else if(mode == 4)
        {
            splitDate = poi[0].split(" ");
            let latB = splitDate[0].replace("�","°").replace(".","'") + " " + splitDate[1];
            let lonB = splitDate[3].replace("�","°").replace(".","'") + " " + splitDate[4];
            
            const posDec =  convertDMS2Dec(latB,lonB);
            lat = posDec.lat;
            lon = posDec.lon;

            hdg = poi[4]+ "°";

            tws = roundTo(poi[5], 2)+ " kts";
            twd = roundTo(poi[6], 2) + "°";
            stw = roundTo(poi[3], 2) + " kts";
            twa = "-";
            sail = "-";
            
            splitDate = poi[1].split(" ");
            heure = splitDate[1];
            date = splitDate[0].split("/");
            isoDate = date[0]+"-"+ date[1]+"-"+date[2]+ " " + heure;
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
               let posDec =  convertDMS2Dec(poi[1],poi[2]);
               lat = posDec.lat;
               lon = posDec.lon
            }
            hdg = poi[3]+ "°";
            tws = roundTo(poi[8], 2)+ " kts";
            stw = roundTo(poi[4], 2) + " kts";
    
            splitDate = poi[0].split(" ");
            heure = splitDate[1]+":00";
            date = splitDate[0].split("/");

            if(previousMonth==0) previousMonth = date[1];
            if(previousMonth==12 && date[1] == 1) currentYear+1;

            isoDate = currentYear+"-"+ date[1]+"-"+date[0]+ " " + heure;
            if(poi[6]>180) poi[6] -=360;
            twa = roundTo(poi[6], 2)+ "°";
            twd = roundTo(poi[7], 2) + "°";
            if(isNumber(poi[5]))
                sail = "(" + poi[5] + ")"; //todo found link between avalon number and sail (temporarily, display the id)
            else
                sail = renameSailFromRoutes(poi[5]);
            stamina = roundTo(poi[9], 2);
            boost = roundTo(poi[10], 2);
            
        }
        
        const routeData = Object.create(routeInfosmodel);

        routeData.lat = lat;
        routeData.lon =  lon;
        routeData.timestamp = Date.parse(isoDate);
        routeData.hdg = hdg;
        routeData.tws = tws;
        routeData.twa = twa;
        routeData.twd = twd;
        routeData.sail = sail;
        routeData.speed = stw;
        routeData.stamina = stamina;
        routeData.boost = boost;
        addNewPoints(rid,routeName,routeData);
        
    }
    return routeName;
}

export function importExtraPattern(rid,fileTxt,routerName,skipperName,color) {

    if (!rid || !fileTxt) return "";
    

    //Mode 0 Avalon
    //Mode 1 VRZen
    let poi = new Array();
    let i = 0;
    fileTxt = fileTxt.replace('\r','');
    let lineAvl = fileTxt.split('\n');

    if(lineAvl.length<= 1) return "" ;//empty file or file not exits 

    const routeName = cleanSpecial(routerName + " " + skipperName);
    createEmptyRoute(rid,routeName,skipperName,color,routerName + " " + skipperName);

    while (i < lineAvl.length-2) {
        i = i + 1;
        if(i > lineAvl.length-2) i = lineAvl.length-2;
        poi = lineAvl[i].replace(/\,/g,".").split(";"); //Fix To Accept VRZEN File or manually modified csv on US configured computer

        const routeData = Object.create(routeInfosmodel);
        routeData.lat = Number(poi[0]);
        routeData.lon =  Number(poi[1]);
        routeData.timestamp = "-";
        routeData.hdg = "-";
        routeData.tws = "-";
        routeData.twa = "-";
        routeData.twd = "-";
        routeData.sail = "-";
        routeData.speed = "-";
        addNewPoints(race.id,routeName,routeData);
        
    }
    return routeName;
}

function renameSailFromRoutes(sailName) {
    if (sailName && sailName !== undefined) {
        switch(sailName)
        {
            case  '"HeavyGnk-foils"':
            case  '"HeavyGnk"':
            case  'Spi lourd':
            case  '"HEAVY_GNK"':
            case  '"HEAVY_GNK-foils"':
                sailName = 'HG';
                break;
            case  '"LightGnk-foils"':
            case  '"LightGnk"':
            case  'Spi leger':
            case  '"LIGHT_GNK"':
            case  '"LIGHT_GNK-foils"':
                sailName = 'LG';
                break;
            case  '"Code0-foils"':
            case  '"Code0"':
            case  'Code 0':
            case  '"CODE_0"':
            case  '"CODE_0-foils"':
                sailName = 'C0';
                break;
            case  '"Staysail-foils"':
            case  '"Staysail"':
            case  'Staysail':
            case  '"Trinquette"':
            case  '"STAYSAIL"':
            case  '"STAYSAIL-foils"':
                sailName = 'Stay';
                break;
            case  '"LightJib-foils"':
            case  '"LightJib"':
            case  'Genois leger':
            case  '"LIGHT_JIB"':
            case  '"LIGHT_JIB-foils"':
                sailName = 'LJ';
                break;
            case  '"Jib-foils"':
            case  '"Jib"':
            case  'Jib':
            case  '"JIB"':
            case  '"JIB-foils"':
                sailName = 'Jib';
                break;
            case  '"Spi-foils"':
            case  '"Spi"':
            case  'Spi':
            case  '"SPI"':
            case  '"SPI-foils"':
                sailName = 'Spi';
                break; 
            default :
                break;
        }
    }
    return sailName;
}

