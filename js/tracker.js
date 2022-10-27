import * as Util from './util.js';
import * as DM from './dataManagement.js';


const sailNames = [0, "Jib", "Spi", "Stay", "LJ", "C0", "HG", "LG", 8, 9,
                     // VR sends sailNo + 10 to indicate autoSail. We use sailNo mod 10 to find the sail name sans Auto indication.
                     "Auto", "Jib &#x24B6;", "Spi &#x24B6;", "Stay &#x24B6;", "LJ &#x24B6;", "C0 &#x24B6;", "HG &#x24B6;", "LG &#x24B6;"];

var lastSendDate = 0;//timestamp ite du dernier envoi
var lastCalcDate = 0;   //time stamp pour detection info la plus a jour
var recordEnable = false; //pour ne record que le fleet info depuis le mergeboatinfo


var mesData = [];
function initMessage(rid,name,myId) {
    mesData = [];
    mesData["raceId"] = rid;
    mesData["raceName"] = name;
    mesData["myId"] = myId;

        lastCalcDate = 0;   //init timestamp derni�re ite
        recordEnable = true;
}

function addInfo(uid,uinfo,type) {

    if(!uinfo || !uid || !mesData || !recordEnable) return;

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
    if (type === "record" && uinfo.startDate) {
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

    mesData[uid] = webinfo;
}


function sendInfo() {
    var timeP = Math.floor(Math.random() * 300);
    return new Promise((resolve) => {
        setTimeout(() => resolve(sendInfoR()), timeP*10);
      });
}

function sendInfoR() {
    
    var webdata = "";
    Object.keys(mesData).forEach(function (key) {
        webdata += "/**/"+JSON.stringify(mesData[key]);
    });
    let dat = JSON.stringify(webdata);

    lastSendDate = lastCalcDate;
    recordEnable = false;

    let xhr = new XMLHttpRequest();
    xhr.open("POST", atob("aHR0cHM6Ly92ci5pdHljLmZyL2Rpbi5waHA="));
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(dat);
    
}




export {
    sendInfo,initMessage,addInfo
}