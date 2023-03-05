import * as Util from './util.js';
import * as DM from './dataManagement.js';


const sailNames = [0, "Jib", "Spi", "Stay", "LJ", "C0", "HG", "LG", 8, 9,
                     // VR sends sailNo + 10 to indicate autoSail. We use sailNo mod 10 to find the sail name sans Auto indication.
                     "Auto", "Jib &#x24B6;", "Spi &#x24B6;", "Stay &#x24B6;", "LJ &#x24B6;", "C0 &#x24B6;", "HG &#x24B6;", "LG &#x24B6;"];

var lastSendDate = 0;//timestamp ite du dernier envoi
var lastCalcDate = 0;   //time stamp pour detection info la plus a jour
var recordEnable = false; //pour ne record que le fleet info depuis le mergeboatinfo
var racetype = "-";

var mesData = [];
function initMessage(type,rid,name,myId,rtype) {

    mesData[type] = [];
    mesData[type]["raceId"] = rid;
    mesData[type]["raceName"] = name;
    mesData[type]["myId"] = myId;
    racetype = rtype;
    if(type=="fleet") {
        lastCalcDate = 0;   //init timestamp dernière ite
        recordEnable = true;
    }
    
}

function addInfoFleet(uid,uinfo) {

    if(!uinfo || !uid || !mesData["fleet"] || !recordEnable) return;

    if(uinfo.lastCalcDate < lastSendDate) return; //not uptodate

    lastCalcDate = uinfo.lastCalcDate;    

    var xOptionsTxt = "-";
    if(uinfo.xoption_options) {
        xOptionsTxt = uinfo.xoption_options;
        xOptionsTxt = xOptionsTxt.replace("All Options","AO");
        xOptionsTxt = xOptionsTxt.replace("Full Pack","FP");
        xOptionsTxt = xOptionsTxt.replace("reach","R");
        xOptionsTxt = xOptionsTxt.replace("light","L");
        xOptionsTxt = xOptionsTxt.replace("heavy","H");
        xOptionsTxt = xOptionsTxt.replace("winch","W");
        xOptionsTxt = xOptionsTxt.replace("foil","F");
        xOptionsTxt = xOptionsTxt.replace("hull","h");
        
    }
    var playerData = DM.getPlayerInfos(uid);
    if(playerData)
    {
        var teamName = DM.getTeamName(playerData.teamId);
        if(teamName != undefined || teamName != teamModel.teamName) {
            uinfo.teamname = teamName;
            uinfo.teamId = playerData.teamId;    
        }
    }
    var startRaceTime = "-";
    if (racetype === "record" && uinfo.startDate) {
        startRaceTime = uinfo.startDate;
    }

    var webinfo = {

        date : uinfo.lastCalcDate,
        uid:uid,
        name: uinfo.displayName,
        teamId : (uinfo.teamId?uinfo.teamId:"-"),
        teamName : (uinfo.teamname?uinfo.teamname:"-"),
        speed: uinfo.speed,
        heading: uinfo.heading,
        tws: uinfo.tws,
        twd: uinfo.twd,
        twa: uinfo.twa,
        twaAuto : uinfo.isRegulated,
        sail: uinfo.sail || "-",
        foil :  (uinfo.xplained?uinfo.xoption_foils:"-"),
        posLat : (uinfo.pos ? uinfo.pos.lat : "-"),
        posLong : (uinfo.pos ?  uinfo.pos.lon : "-"),
        opt : xOptionsTxt,
        xf : (uinfo.xplained?uinfo.xfactor:"-"),
        xfs : (uinfo.xplained?uinfo.xoption_sailOverlayer:"-"),
        state : uinfo.state,
        rank : (uinfo.rank ?  uinfo.rank : "-"),
        stamina: (uinfo.stamina ? uinfo.stamina : "-"), 
        dist: (uinfo.dtf ? uinfo.dtf : 99999999999.0), 
        startRaceTime: startRaceTime
    };

//foils

    mesData["fleet"][uid] = webinfo;
}

const rankInfosModel = { 
    displayName : "-",
    rank : "-",
    distance : 0,
    lastCalcDate : "-",
    xOptions : "?",
    teamId : "",
    teamName : "-"
};

function addInfoRanking(uid,uinfo) {

    if(!uinfo || !uid|| !mesData["rank"]) return;

    //if(uinfo.lastCalcDate < mostIteDate) return; //not uptodate
    

    var xOptionsTxt = "-";
    if(uinfo.xoption_options) {
        xOptionsTxt = uinfo.xoption_options;
        xOptionsTxt = xOptionsTxt.replace("All Options","AO");
        xOptionsTxt = xOptionsTxt.replace("Full Pack","FP");
        xOptionsTxt = xOptionsTxt.replace("reach","R");
        xOptionsTxt = xOptionsTxt.replace("light","L");
        xOptionsTxt = xOptionsTxt.replace("heavy","H");
        xOptionsTxt = xOptionsTxt.replace("winch","W");
        xOptionsTxt = xOptionsTxt.replace("foil","F");
        xOptionsTxt = xOptionsTxt.replace("hull","h");
        
    }

    var playerData = DM.getPlayerInfos(uid);
    if(playerData)
    {
        var teamName = DM.getTeamName(playerData.teamId);
        if(teamName != undefined || teamName != teamModel.teamName) {
            uinfo.teamname = teamName;
            uinfo.teamId = playerData.teamId;    
        }
    }

    var webinfo = {

        date : uinfo.lastCalcDate,
        uid:uid,
        name: uinfo.displayName,
        teamId : (uinfo.teamId?uinfo.teamId:"-"),
        teamName : (uinfo.teamName?uinfo.teamName:"-"),
        rank : (uinfo.rank ?  uinfo.rank : "-"),
        opt : xOptionsTxt,
        dist : uinfo.distance
    };

    mesData["rank"][uid] = webinfo;
}

function sendInfo(type) {
    var timeP = Math.floor(Math.random() * 300);
    return new Promise((resolve) => {
        setTimeout(() => resolve(sendInfoR(type)), timeP*10);
      });
}

function sendInfoR(type) {
 
    var webdata = "";
    Object.keys(mesData[type]).forEach(function (key) {
        webdata += "/**/"+JSON.stringify(mesData[type][key]);
    });
    let dat = JSON.stringify(webdata);

    if(type=="fleet") {
        lastSendDate = lastCalcDate;
        recordEnable = false;
    }
    let xhr = new XMLHttpRequest();    
    if(type=="fleet")
        xhr.open("POST", atob("aHR0cHM6Ly92ci5pdHljLmZyL2Rpbi5waHA="));
    else
        xhr.open("POST", atob("aHR0cHM6Ly92ci5pdHljLmZyL2RpbnIucGhw"));
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(dat);
    
}

export {
    sendInfo,initMessage,addInfoFleet,addInfoRanking,rankInfosModel
}