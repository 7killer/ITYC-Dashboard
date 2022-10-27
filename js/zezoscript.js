import * as rt from './routingviewer.js';
import * as Util from './util.js';
"use strict";



const pattern = /1;\sleft\s:([-]{0,1}[0-9]{1,})px;\stop:([0-9]{1,})px;"\s*onmouseover="updi\(event,'([0-9]{4}-[0-9]{2}-[0-9]{2})\s([0-9]{2}:[0-9]{2})\s([A-Z]{3,4})\s\((T[+]{1}\s?[0-9]{1,3}:[0-9]{2})\)<br>Distances:&nbsp;([0-9]{1,4}.[0-9]{1}nm)\/([0-9]{1,4}.[0-9]{1}nm)<br><b>Wind:<\/b>\s([0-9]{1,3})&deg;\s([0-9]{1,2}.[0-9]{1}\skt)\s\(<b>TWA\s([-]{0,1}[0-9]{1,3})&deg;<\/b>\)<br><b>Heading:<\/b>\s([0-9]{1,3})&deg;<b>Sail:<\/b>\s([a-zA-Z0]{2,4})<br><b>Boat\sSpeed:<\/b>\s([0-9]{1,3}.[0-9]{1,2}\skts)/

var scale;

/* Calculate latitude using the scale of the display and the css top property
 * @param top
 * @param scale
 * @returns {number}
 */
function getLatitude(top, scale) {
    return 90 - ((parseInt(top) + 2) / scale);
}

/*
 * Calculate longitude using the scale of the display and the css left property
 * @param left
 * @param scale
 * @returns {number}
 */


 
function getLongitude(left, scale){
    left= parseInt(left);
    if (((left + 2 / scale) >= -180) || ((left + 2 / scale) <= 180)) {
        return (left + 2) / scale;
    } else {
        return ((left  + 2) / scale) - 360;
    }
}
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
var rtx_idx = [];
function zezoCall(uinfo,raceInfos,color,race) {

    var optionBits = {
        "winch": 4,
        "foil": 16,
        "light": 32,
        "reach": 64,
        "heavy": 128
    };

    var baseURL = "http://zezo.org";


    var urlBeta = raceInfos.url + (raceInfos.betaflag ? "b" : "");
    var options = 2;
    if (uinfo.options) {
        if(uinfo.options == "Full Pack" || uinfo.options == "All Options")
            options +=(4+16+32+64+128);
        else if(uinfo.options == "-" || uinfo.options == "?"|| uinfo.options == "---")
        {

        } else {

            var optionsType = uinfo.options.split(" ");
            var optionsList = [];

            for(var j = 0; j < optionsType.length;j++)
            {
                var options0List =  optionsType[j].replace("[","").replace("]","");
                options0List = options0List.split(",")
                for ( var i = 0; i < options0List.length; i++) {
                    optionsList.push(options0List[i]);
                }
            }
            for (const option of optionsList) {
                if (optionBits[option]) {
                    options |= optionBits[option];
                }
            }
        }
    }

    var url = baseURL + "/" + urlBeta + "/chart.pl"
        + "?lat=" + uinfo.pos.lat
        + "&lon=" + uinfo.pos.lon
        + "&ts=" + (raceInfos.curr.lastCalcDate / 1000)
        + "&o=" + options
        + "&twa=" + uinfo.twa
        + "&userid=" + uinfo.uid
//        + "&type=" + type
        + "&auto=no";
        

    new Promise((resolve, reject) => {

        
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('loadend', () => {
            if (xhr.status === 200 || xhr.status == 0) {
                var result=xhr.responseText.split(pattern);
                var routeName = "zezo "+uinfo.displayName;
                var routeNameClean = routeName.cleanSpecial();

                if(rtx_idx[raceInfos.id])
                {
                    if(rtx_idx[raceInfos.id][routeNameClean] != undefined)
                        rtx_idx[raceInfos.id][routeNameClean] += 1;
                    else
                        rtx_idx[raceInfos.id][routeNameClean] = 0;
                } else{
                    rtx_idx[raceInfos.id] = [];
                    rtx_idx[raceInfos.id][routeNameClean] = 0;
                }
                if(rtx_idx[raceInfos.id][routeNameClean]!=0)
                {
                    routeName += " "+ rtx_idx[raceInfos.id][routeNameClean];
                    routeNameClean = routeName.cleanSpecial();
                }

                rt.createEmptyRoute(raceInfos.id,routeNameClean,uinfo.displayName,color,routeName);
        
                scale = /var scale = ([0-9]+)/.exec(result[0]);
                for (var i = 0; i < result.length -1; i = i + 15) {
                    var datas=result.slice(i+1,i+15);
                    // console.log("Datas : ", datas);
                    var [left,top,date,time,timezone,ttw,dtw,dtg,twd,tws,twa,btw,sail,stw] = datas;
        
                    var isoDate =  date.replace("/","-");
                    isoDate += "T" + time +":00";
                    if(timezone=="UTC") isoDate += ".000+00:00";
                    // isoDate += " " + time +":00 "+ timezone;
                    var routeData = Object.create(rt.routeInfosmodel);
        
                    routeData.lat = getLatitude(top, scale[1]);
                    routeData.lon =  getLongitude(left, scale[1]);;
                    routeData.timestamp = Date.parse(isoDate);
                    routeData.heading = btw;
                    routeData.tws = tws;
                    routeData.twa = twa;
                    routeData.twd = twd;
                    routeData.sail = sail;
                    routeData.speed = stw;
                    rt.addNewPoints(raceInfos.id,routeNameClean,routeData);
                    
                }
                rt.updateRouteListHTML();
                rt.displayMapTrace(race,routeNameClean);
                document.getElementById("bt_rt_addLmap").value = "Import";
                document.getElementById("bt_rt_addLmap").disabled = false;
            }else {
                resolve(false);
                document.getElementById("bt_rt_addLmap").value = "Import";
                document.getElementById("bt_rt_addLmap").disabled = false;
            }
            
        });
        xhr.open("GET", url);
        xhr.send();
    });

}


export {
    zezoCall
};