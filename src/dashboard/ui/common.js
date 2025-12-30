

import {getUserPrefs, saveUserPrefs} from "../../common/userPrefs.js"
import { roundTo ,sign,isCurrent} from "../../common/utils.js";
import {sailNames,sailColors} from "./constant.js"

export function switchTheme(theme)
{

    if(theme=="dark")
    {
        document.documentElement.setAttribute("data-theme", "dark");
        document.getElementById("rt_close_popupLmap").src = "./img/closedark.png";
        document.getElementsByClassName("popupCloseBt").src = "./img/closedark.png";
    }else
    {
        document.documentElement.setAttribute("data-theme", "light");
        document.getElementById("rt_close_popupLmap").src = "./img/close.png";
        document.getElementsByClassName("popupCloseBt").src = "./img/close.png";
    }
    //TODO Redraw dash
}

export function getBG(timestamp, previousTimeStamp) {
    return isCurrent(timestamp) ? ('style="background-color: ' + (darkTheme?"darkred":"LightRed") + ';"') : "";
}

function pad0 (val, length=2, base=10) {
    var result = val.toString(base)
    while (result.length < length) result = '0' + result;
    return result;
}

export function formatHM (seconds) {
    if (seconds === undefined || isNaN(seconds) || seconds < 0) {
        return "-";
    }

    seconds = Math.floor(seconds / 1000);

    var hours = Math.floor(seconds / 3600);
    seconds -= 3600 * hours;

    var minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    let ret;
    if(hours!=0)
    {
        ret = pad0(hours,1)+ "h" + pad0(minutes) + "m";
    } else
    {
        ret = pad0(minutes,1) + "m";    
    }
    return ret;
}
export function formatTimeNotif(ts) {
    var tsOptions = {
        hour: "numeric",
        minute: "numeric",
        hour12: false
    };
    var d = (ts) ? (new Date(ts)) : (new Date());
    return new Intl.DateTimeFormat("lookup", tsOptions).format(d);
}

export function formatTime(ts, format = 0) {
    const userPrefs = getUserPrefs(); 

    let tsOptions = {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false
    };
    if (format == 1) {
        tsOptions = {
            hour: "numeric",
            minute: "numeric",
            hour12: false
        };
    }
    const d = (ts) ? (new Date(ts)) : (new Date());
    if (!userPrefs.global.localTime) {
        tsOptions.timeZone = "UTC";
    }
    return new Intl.DateTimeFormat("lookup", tsOptions).format(d);
}

export function formatDHMS(seconds) {
    if (seconds === undefined || isNaN(seconds) || seconds < 0) {
        return "-";
    }

    seconds = Math.floor(seconds / 1000);

    var days = Math.floor(seconds / 86400);
    var hours = Math.floor(seconds / 3600) % 24;
    var minutes = Math.floor(seconds / 60) % 60;
    let retVal = "";
    if(days!=0) retVal = pad0(days) + "d " + pad0(hours) + "h " + pad0(minutes) + "m";
    else if(hours!=0) retVal = pad0(hours) + "h " + pad0(minutes) + "m";
    else retVal = pad0(minutes) + "m"; 

    return retVal;
}

export function formatShortDate(ts, dflt, timezone) {
    if (!ts && dflt) return dflt;
    if(ts=='-') return "-";
    const date = new Date(ts);
    var month, day, hours, minutes, utcDate;
    if (!timezone) {
        utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()));
        month = (utcDate.getUTCMonth() + 1).toString().padStart(2, '0');
        day = utcDate.getUTCDate().toString().padStart(2, '0');
        hours = utcDate.getUTCHours().toString().padStart(2, '0');
        minutes = utcDate.getUTCMinutes().toString().padStart(2, '0');
    } else {
        month = (date.getMonth() + 1).toString().padStart(2, '0');
        day = date.getDate().toString().padStart(2, '0');
        hours = date.getHours().toString().padStart(2, '0');
        minutes = date.getMinutes().toString().padStart(2, '0');
    }
    return `${day}/${month} ${hours}:${minutes}`;
}

export function formatTimestampToReadableDate(ts, returnType = 0) {
    const date = new Date(ts);
    if (returnType == 1) return date.toLocaleString('fr-FR', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
        }); // return '02/15/25, 06:33'
    else return date.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' }); // return 'Sunday, November 10, 2024 at 2:22 PM'
}

export function twaBackGround(currTwa,bestTwa)
    {
        var twaBG = " ";
        var currentTWA = Math.round(Math.abs(currTwa));
        var bTwaUp =   Math.round(bestTwa.twaUp);
        var bTwaDw =   Math.round(bestTwa.twaDown);
        if((currentTWA == bTwaUp) || (currentTWA == bTwaDw))
            twaBG =  ' background-color:lightgreen;';
        else if((currentTWA < bTwaUp && currentTWA >= bTwaUp-2) 
                || (currentTWA > bTwaDw && currentTWA <= bTwaDw+2))
                twaBG =  ' background-color:DarkOrange;';
        else if((currentTWA < bTwaUp-2) 
            || (currentTWA > bTwaDw+2))
            twaBG =  ' background-color:DarkRed;';
        return twaBG;
    }
export function gentdRacelog(className, name, style, title, value) {
    const userPrefs = getUserPrefs(); 
    const checked = userPrefs?.racelog?.column[name];
    if (!style || style === null) style = '';
    if (checked == undefined || checked ) {
        return '<td class="' + className + '" ' 
            + style 
            + (title ? (' title="' + title + '"') : "")
            + ' >' + value + '</td>';
    } else {
        return "";
    }
}
export function genthRacelog(id, name, content, title) {
    const userPrefs = getUserPrefs(); 
    const checked = userPrefs?.racelog?.column[name];
    if (checked == undefined || checked ) {
        return '<th id="' + id + '"'
            + (title ? (' title="' + title + '"') : "")
            + '>' + content + '</th>';
    } else {
        return ""
    }
}

export function genth(id, content, title, sortfield, sortmark) {
    const userPrefs = getUserPrefs();
    let checkboxId = '';
    if (!content) {
        const contentAlt = id.split("_")[1];
        checkboxId = id.split("_")[1].toLowerCase();
    } else
        checkboxId = id;
    const checked = userPrefs?.fleet?.column[checkboxId];
    if (checked == undefined || checked ) {
        if (sortfield && sortmark != undefined) {
            content = content + " " + (sortmark ? "&#x25b2;" : "&#x25bc;");
        }
        var cspan = '';
        if (id=="th_twa" || id=="th_sail") {
            cspan = "colspan = 2";
        }
        return '<th ' + cspan + ' id="' + id + '"'
            + ' data-sort-key="' + checkboxId + '"'
            + (sortfield ? ' style="background: DarkBlue;"' : "")
            + (title ? (' title="' + title + '"') : "")
            + '>' + content + '</th>';
    } else {
        return ""
    }
}
export function gentd(name, style,title, value) {
    const userPrefs = getUserPrefs();
    const checked = userPrefs?.fleet?.column[name];
    if (checked == undefined || checked ) {
        if (name == "fleet_sailicon") {
            var checkBoxSail = document.getElementById('fleet_sail');
            if (!checkBoxSail.checked) return "";
        }
        else if (name == "fleet_twaicon") {
            var checkBoxTWA = document.getElementById('fleet_twa');
            if (!checkBoxTWA.checked) return "";
        }
        return '<td class="' + name + '" ' 
                            + style 
                            + (title ? (' title="' + title + '"') : "")
                            + ' >' + value + '</td>';
    }    else {
        return ""
    }

}
export function getxFactorStyle(raceIte)
{
    const iteDash= raceIte.metaDash;
    const userPrefs = getUserPrefs();
    const darkTheme = userPrefs.theme=="dark";
    let xfactorStyle= 'style="color:' + ((iteDash.xplained) ? (darkTheme?"#a5A5A5" :"black") : "red") + ';"'
    if(!raceIte.speed  )
        xfactorStyle = 'style="color:' + darkTheme?"#a5A5A5" :"black" + ';"';
    
    if(iteDash.sailCoverage != 0 && iteDash.xplained) {
        if(iteDash.sailCoverage > 1.2 || (iteDash.sailCoverage<0 && Math.abs(iteDash.sailCoverage)<98))
            xfactorStyle = 'style="color:red;"';
        else if(iteDash.sailCoverage > 0)
            xfactorStyle = 'style="color:orange ;"';
    }
    return xfactorStyle;
}


export function dateUTCSmall() {
    
    const userPrefs = getUserPrefs();

    const options = {
        year: "numeric",
        timeZoneName: "short"
    };
    
    if (!userPrefs.global.localTime) {
        options.timeZone = "UTC";
    }
    const str = new Intl.DateTimeFormat("lookup", options).format(new Date());
    const res = str.substring(5);
    return '<span class="small">&nbsp;(' + res + ')</span>';
}
export function DateUTC(ts, format = 0,mode=2) {
    if (!ts) return;
    // Format: MM/DD HH:MM:SS
    let tsOptions = {
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false
    };
    if (format == 1) {
        // Format: MM/DD HH:MM
        tsOptions = {
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: false
        };
    }
    else if (format == 2) {
        // Format: HH:MM:SS
        tsOptions = {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false
        };
    }
    const d = (ts) ? (new Date(ts)) : (new Date());
    const dtUTCLocal = new Intl.DateTimeFormat("lookup", tsOptions).format(d);
    tsOptions.timeZone = "UTC";
    const dtUTC = new Intl.DateTimeFormat("lookup", tsOptions).format(d);
    if(mode ==2)
        return '<span id="UTC">' + dtUTC + '</span><span id="UTCLocal">' + dtUTCLocal + '</span>';
    else if(mode ==1)
        return '<span id="UTCLocal">' + dtUTCLocal + '</span>';
    else if(mode ==0)
        return '<span id="UTC">' + dtUTC + '</span>';
    else if(mode ==3)
        return dtUTC;
    else if(mode ==4)
        return  dtUTCLocal;

}


export function raceTableHeaders() {

    return genthRacelog("th_rl_rank", "rank", "Rank")
        + genthRacelog("th_rl_dtl", "dtl", "DTL", "Distance To Leader")
        + genthRacelog("th_rl_dtf", "dtf", "DTF", "Distance To Finish")
        + genthRacelog("th_rl_twd", "twd", "TWD", "True Wind Direction")
        + genthRacelog("th_rl_tws", "tws", "TWS", "True Wind Speed")
        + genthRacelog("th_rl_twaLarge", "twa", "TWA", "True Wind Angle")
        + genthRacelog("th_rl_hdg", "hdg", "HDG", "Heading");
}

export function raceTableLines(ite,bestTwa,bestDTF) {
    if(!ite)
    {
        return '<td class="rank"></td>'
        + '<td class="dtl"></td>'
        + '<td class="dtf"></td>'
        + '<td class="twd"></td>'
        + '<td class="tws"></td>'
        + '<td class="twa" ></td>'
        + '<td  class="hdg" ></td>'
    }
    const userPrefs = getUserPrefs(); 
    let isTWAMode = ite.isRegulated;
    let twaFG = (ite.twa < 0) ? "red" : "green";
    let twaBold = isTWAMode ? "font-weight: bold;" : "";
    let twaBG = " ";
    if(bestTwa)
    {
        twaBG = twaBackGround(ite.twa,bestTwa);
    }
    
    var hdgFG = isTWAMode ? "black" : "blue";
    var hdgBold = isTWAMode ? "font-weight: normal;" : "font-weight: bold;";
    if(userPrefs.theme =='dark')
        hdgFG = isTWAMode ? "white" : "darkcyan"; 
    
    //TODO compute bestDTF saveit in raceList
    return gentdRacelog("rank", "rank", null, "Rank", (ite.rank ? ite.rank : "-"))
        + gentdRacelog("dtl", "dtl", null, "DTL", bestDTF?roundTo(ite.distanceToEnd - bestDTF, 3):'-')
        + gentdRacelog("dtf", "dtf", null, "DTF", roundTo(ite.distanceToEnd, 3))
        + '<td class="twd">' + roundTo(ite.twd, 3) + '</td>'
        + '<td class="tws">' + roundTo(ite.tws, 3) + '</td>'
        + '<td class="twa" style="color:' + twaFG + ";" + twaBG + twaBold  + '">' + roundTo(Math.abs(ite.twa), 3) + '</td>'
        + '<td  class="hdg" style="color:' + hdgFG + ";" + hdgBold + '">' + roundTo(ite.hdg, 3) + '</td>'
}
export function infoSail(ite,short,extended = true) {
    let sailInfo;
    const userPrefs = getUserPrefs(); 

    if(short) {
        sailInfo = sailNames[ite.sail % 10];
    } else
        sailInfo =  '<span ' + 'style="color:' + sailColors[ite.sail] + '" padding: 0px 0px 0px 2px;"' + '>&#x25e2&#x25e3  </span>'+ sailNames[ite.sail % 10];

    if (ite.metaDash.isAutoSail) {
        const autoSailTime = ite.metaDash.autoSailTime == 'inf' ? '∞' : formatHM(ite.metaDash.autoSailTime);
        sailInfo = sailInfo + " <span title='Auto Sails' class='cursorHelp'>&#x24B6;</span> " + autoSailTime;
    } else {
        sailInfo = sailInfo + " (Man)";
    }
    
    const sailNameBG = (userPrefs.theme =='dark')?(ite.badSail ? "darkred" : "darkgreen"):(ite.badSail ? "lightred" : "lightgreen");

    if(ite.metaDash.deltaReceiveCompute > 900000)   sailNameBG = 'red' ;

    let retVal = '<td class="asail" style="background-color:' + sailNameBG + ';">';
    if(extended) {
        const best = ite.metaDash.bVmg;
        if(best.sailTWSMax != 0)
        {
            retVal +='<div class="">'+ best.sailTWSMin +' - '+ best.sailTWSMax+' kts</div>';
        }
        retVal += '<div>'+sailInfo+'</div>';
        if(best.sailTWAMax != 0)
        {
            retVal +='<div class="">'+ best.sailTWAMin +' - '+ best.sailTWAMax+'°</div>';
        }
    } else
    {
        retVal += sailInfo;
    }
    retVal +="</td>";
    return   retVal; 

}

function toDMS(number) {
    const u = sign(number);
    number = Math.abs(number);
    const g = Math.floor(number);
    let frac = number - g;
    const m = Math.floor(frac * 60);
    frac = frac - m / 60;
    let s = Math.floor(frac * 3600);
    let cs = roundTo(360000 * (frac - s / 3600), 0);
    while (cs >= 100) {
        cs = cs - 100;
        s = s + 1;
    }
    return {
        "u": u,
        "g": g,
        "m": m,
        "s": s,
        "cs": cs
    };
}
    

export function formatPosition(lat, lon,long=false) {
    const latDMS = toDMS(lat);
    const lonDMS = toDMS(lon);
    const latString = latDMS.g + "°" + pad0(latDMS.m) + "'" + pad0(latDMS.s) + "." + pad0(latDMS.cs, 2) + '"';
    const lonString = lonDMS.g + "°" + pad0(lonDMS.m) + "'" + pad0(lonDMS.s) + "." + pad0(lonDMS.cs, 2) + '"';
    const userPrefs = getUserPrefs();

    const separator = userPrefs.global.separatorPos?" ":" - ";
    
    let retVal = long?"<p>":"";
    retVal += latString + ((latDMS.u == 1) ? "N" : "S");
    retVal +=  long?"</p><p>":separator;
    retVal += lonString + ((lonDMS.u == 1) ? "E" : "W");
    retVal += long?"<p>":"";
    return  retVal;

}



export function formatSeconds(value) {
    if (value < 0) {
        return "-";
    } else {
        return roundTo(value / 1000, 0);
    }
}


export function changeState(lbl_tochange) {
    const cbxlbl = lbl_tochange.replace("lbl_", "sel_");
    const selectedcbx = document.getElementById(cbxlbl);
    if(selectedcbx) {
        if (selectedcbx.checked) {
            selectedcbx.checked = false;
        } else {
            selectedcbx.checked = true;
        }
    }
    const name = lbl_tochange.replace("lbl_", "");
    const userPrefs = getUserPrefs();
    const checked = userPrefs?.filters[name];
    if (checked != undefined) {
        userPrefs.filters[name] = selectedcbx.checked ;
    }
    saveUserPrefs(userPrefs);

}

export function display_selbox(state) {
    document.getElementById("sel_skippers").style.visibility = state;
    document.getElementById("sel_export").style.visibility = state;
}


export function getRankingCategory(playerOptions)
{
    if(!playerOptions) return "?";
    var categoryIndicator = 0;

    if(     playerOptions.foil
         && playerOptions.heavy
         && playerOptions.hull
         && playerOptions.light
         && playerOptions.reach
         && playerOptions.winch
         && playerOptions.comfortLoungePug
         && playerOptions.magicFurler
         && playerOptions.vrtexJacket)
    {
        return "Full Pack";
    }
    if(playerOptions.hull)  categoryIndicator += 84337349;
    if(playerOptions.winch) categoryIndicator += 120481928;
    if(playerOptions.foil)  categoryIndicator += 265060241;
    if(playerOptions.light) categoryIndicator += 180722892;
    if(playerOptions.reach) categoryIndicator += 204819277;
    if(playerOptions.heavy) categoryIndicator += 144578313;

    if(categoryIndicator <= 240963855)
        return "PDD";        
    else if(categoryIndicator <= 500000000)
        return "1/2 Full Pack";  
    else
        return "Full Pack";
}