// UI Controller
"use strict";

import * as Util from './util.js';
import * as NMEA from './nmea.js';
import * as DM from './dataManagement.js';
import * as EX from './extra.js';
import * as lMap from './map.js';
import * as rt from './routingviewer.js';
import * as tr from './tracker.js';
import * as gr from './graph.js';
import * as nf from './notif.js'
import * as exp from './exportTool.js'

var controller = function () {

    const LightRed = '#FFA0A0';

    // ToDo: clear stats if user/boat changes
    var currentUserId,currentUserName, currentTeam,currentTeamId,currentRaceId=0;
    var requests = new Map();

    // Polars and other game parameters, indexed by polar._id
    var polars = [];

    var races = new Map();
    var raceFleetMap = new Map();

    let welcomePage = false;
    var currentSortField = "none";
    var originClick;
    var drawTheme = "dark";
    var CompasWin;
    var csvSep = ";";
    

    const sailNames = [0, "Jib", "Spi", "Stay", "LJ", "C0", "HG", "LG", 8, 9,
                     // VR sends sailNo + 10 to indicate autoSail. We use sailNo mod 10 to find the sail name sans Auto indication.
                     "Auto", "Jib &#x24B6;", "Spi &#x24B6;", "Stay &#x24B6;", "LJ &#x24B6;", "C0 &#x24B6;", "HG &#x24B6;", "LG &#x24B6;"];
    const sailColors = ["#FFFFFF", "#FF6666", "#6666FF", "#66FF66", "#FFF266", "#66CCFF", "#FF66FF", "#FFC44D", 8, 9,
    // VR sends sailNo + 10 to indicate autoSail. We use sailNo mod 10 to find the sail name sans Auto indication.
                    "#FFFFFF", "#FF6666", "#6666FF", "#66FF66", "#FFF266", "#66CCFF;", "#FF66FF", "#FFC44D"];
    const creditsMaxAwardedByPriceLevel = [8600, 7150, 5700, 4300, 2850, 1425];
    
                    

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
        {nameStyle: "color: Black;", bcolor: '#000000'}
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
        {nameStyle: "color: #a5a5a5;", bcolor: '#000000'}
    ];

      // shall be loaded and stored when connect to welcome page
      //boats: {0: 1, 5: 1.2, 15: 1.5, 50: 2}
    
      const boat2StaminaCoeff = [
        {_id:0      ,name: "unknow",               stamina: "1"},
        {_id:1      ,name: "unknow",               stamina: "1"},
        {_id:2      ,name: "Figaro 3",             stamina: "1"},
        {_id:3      ,name: "Class 40 2021",        stamina: "1"},
        {_id:4      ,name: "Imoca",                stamina: "1.2"},
        {_id:5      ,name: "Mini 6.50",            stamina: "1"},
        {_id:6      ,name: "Ultim (Solo)",         stamina: "1.5"},
        {_id:7      ,name: "Volvo 65",              stamina: "1.2"},
        {_id:8      ,name: "unknow",               stamina: "1"},
        {_id:9      ,name: "Ultim (Crew)",         stamina: "1.5"},
        {_id:10     ,name: "Olympus",              stamina: "1.5"},
        {_id:11     ,name: "Ocean 50 (Multi 50)",  stamina: "1"},
        {_id:12     ,name: "unknow",               stamina: "1"},
        {_id:13     ,name: "Caravelle",            stamina: "2"},
        {_id:14     ,name: "Super Maxi 100",       stamina: "1.5"},
        {_id:15     ,name: "unknow",               stamina: "1"},
        {_id:16     ,name: "Tara",                 stamina: "2"},
        {_id:17     ,name: "unknow",               stamina: "1"},
        {_id:18     ,name: "OffShore Racer",       stamina: "1"},
        {_id:19     ,name: "Mod70",       		   stamina: "1.2"},
        {_id:20     ,name: "Cruiser Racer",        stamina: "1.2"},
        {_id:21     ,name: "Ultim BP XI",        stamina: "1.5"},
      ];





// ---------------------------------------------------------------------------

    var selRace, selNmeaport;
    var cbFriends, cbOpponents, cbCertified, cbTeam, cbTop, cbReals, cbSponsors,cbTrackinfos, cbWithLastCmd,cbSelect, cbInRace, cbRouter, cbReuseTab, cbLocalTime, cbRawLog, cbNMEAOutput;
    var lbBoatname, lbTeamname, lbCycle;
    var currentCycle;

    var lbCredits;

    var divRaceStatus, divRecordLog, divFriendList, divRawLog;

    var cb2digits;
    var nbdigits = 0;
    var nbTabs = 9;
    
    var lang = "fr";

    
    // ---------------------------------------------------------------------------    


    function addSelOption(race, beta, disabled) {
        var option = document.createElement("option");
        option.text = race.name + (beta ? " beta" : "") + " (" + race.id.substr(0, 3) + ")";
        option.value = race.id;
        option.betaflag = beta;
        option.disabled = disabled;
        selRace.appendChild(option);

        nf.addRace(race.id,race.name);

    }

    function initRace(race, disabled) {
        races.set(race.id, race);
        var fleetData = new Map();
        fleetData.table = new Array();
        fleetData.uinfo = new Object();
        raceFleetMap.set(race.id, fleetData);
        addSelOption(race, false, disabled);
        if (race.has_beta) {
            addSelOption(race, true, disabled);
        }
    }

    var zezoRaceListAnswer = false;
    var raceListTimeOut ;

    function initRaces() {
        var xhr = new XMLHttpRequest();
        xhr.onload = function () {
           var json = xhr.responseText;
            json = JSON.parse(json);
            for (var i = 0; i < json.races.length; i++) {
                console.log("Race: " + JSON.stringify(json.races[i]) + "=> "+ json.races[i].name.remAcc());
                json.races[i].source = "zezo";
                initRace(json.races[i], true);
            }
            nbdigits=(cb2digits.checked?1:0);
            rt.set_nbdigit(nbdigits);
            rt.updateRaces(races);
            makeRaceStatusHTML();
            zezoRaceListAnswer = true;
        }
        xhr.open("GET", "http://zezo.org/races2.json");
        xhr.send();
        zezoRaceListAnswer = false;
        
        if(raceListTimeOut) clearTimeout(raceListTimeOut);
        raceListTimeOut = setTimeout(mergeRaceList, 10000); // let 10 sec to zezo and ITYC to answer.

    }

    function mergeRaceList() {
        if(zezoRaceListAnswer) return;
        
        if(raceListTimeOut) clearTimeout(raceListTimeOut);
        var raceListItyc = DM.getRaceListInfos();
        Object.keys(raceListItyc.uinfo).forEach(function (key) {
            var raceInfo =raceListItyc.uinfo[key];
            if(raceInfo.vsr != 0) { 
                raceInfo.legId = raceInfo.legId.replace("_",".");
                raceInfo.id=raceInfo.legId 
                initRace(raceInfo, true);
            }       
        });
        nbdigits=(cb2digits.checked?1:0);
        rt.set_nbdigit(nbdigits);
        rt.updateRaces(races);
        makeRaceStatusHTML();
    }


    function commonHeaders() {

        return Util.genthRacelog("th_rl_rank", "rank", "Rank")
            + Util.genthRacelog("th_rl_dtl", "dtl", "DTL", "Distance To Leader")
            + Util.genthRacelog("th_rl_dtf", "dtf", "DTF", "Distance To Finish")
            + Util.genthRacelog("th_rl_twd", "twd", "TWD", "True Wind Direction")
            + Util.genthRacelog("th_rl_tws", "tws", "TWS", "True Wind Speed")
            + Util.genthRacelog("th_rl_twaLarge", "twa", "TWA", "True Wind Angle")
            + Util.genthRacelog("th_rl_hdg", "hdg", "HDG", "Heading");
    }

    function printLastCommand(lcActions) {
        var lastCommand = "";
        lcActions.map(function (action) {
            if (action.type == "heading") {
                lastCommand += "<span class='lastCommandOrder'>" + (action.autoTwa ? " TWA" : " HDG") + " " + Util.roundTo(action.value, 0) + "°</span> • ";
            } else if (action.type == "sail") {
                lastCommand += " Sail <span class='lastCommandOrder'>" + sailNames[action.value] + "</span>";
            } else if (action.type == "prog") {
                action.values.map(function (progCmd) {
                    var progTime = formatDateUTC(progCmd.ts, 1);
                    lastCommand += "<span class='lastCommandOrder'>" + (progCmd.autoTwa ? " TWA" : " HDG") + " " + Util.roundTo(progCmd.heading, 0) + "°</span> @ " + progTime + " • ";
                });
            } else if (action.type == "wp") {
                action.values.map(function (waypoint) {
                    lastCommand += " WP <span class='lastCommandOrder'>" + Util.formatPosition(waypoint.lat, waypoint.lon) + "</span> • ";
                });
            }
        });
        lastCommand = lastCommand.replace(/ \•([^•]*)$/, "");
        return lastCommand;
    }



    function infoSail(r,s) {

        var sailInfo;
        if(s) {
            sailInfo = sailNames[r.curr.sail % 10];
        } else
            sailInfo =  '<span ' + 'style="color:' + sailColors[r.curr.sail] + '" padding: 0px 0px 0px 2px;"' + '>&#x25e2&#x25e3  </span>'+ sailNames[r.curr.sail % 10];
        var isAutoSail = r.curr.hasPermanentAutoSails ||
            (r.curr.tsEndOfAutoSail &&(r.curr.tsEndOfAutoSail - r.curr.lastCalcDate) > 0);
        var autoSailTime = r.curr.hasPermanentAutoSails ? '∞' : Util.formatHMS(r.curr.tsEndOfAutoSail - r.curr.lastCalcDate);
        if (isAutoSail) {
            sailInfo = sailInfo + " <span title='Auto Sails' class='cursorHelp'>&#x24B6;</span> " + autoSailTime;
        } else {
            sailInfo = sailInfo + " (Man)";
        }
        
        var sailNameBG = r.curr.badSail ? LightRed : "lightgreen";
        if(drawTheme =='dark')
            sailNameBG = r.curr.badSail ? "darkred" : "darkgreen";

        // Remember when this message was received ...
        if (! r.curr.receivedTS) {
            r.curr.receivedTS = Date.now();
        }
         // ... so we can tell if lastCalcDate was outdated (by more than 15min) already when we received it.
         var lastCalcDelta = r.curr.receivedTS - r.curr.lastCalcDate; 
        if(lastCalcDelta > 900000)   sailNameBG = 'red' ;

        var retVal = '<td class="asail" style="background-color:' + sailNameBG + ';">';
        if(r.curr.bestVmg.sailTWSMax != 0)
        {
            retVal +='<div class="textMini">'+ r.curr.bestVmg.sailTWSMin +' - '+ r.curr.bestVmg.sailTWSMax+' kts</div>';
        }
        retVal += '<div>'+sailInfo+'</div>';
        if(r.curr.bestVmg.sailTWAMax != 0)
        {
            retVal +='<div class="textMini">'+ r.curr.bestVmg.sailTWAMin +' - '+ r.curr.bestVmg.sailTWAMax+'°</div>';
        }
        retVal +="</td>";
        return   retVal; 

    }
    function twaBackGround(currTwa,bestTwa)
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

    function commonTableLines(r,bestTwa) {
        // No need to infer TWA mode, except that we might want to factor in the last command
        if(!r.curr)
        {
            return '<td class="rank"></td>'
            + '<td class="dtl"></td>'
            + '<td class="dtf"></td>'
            + '<td class="twd"></td>'
            + '<td class="tws"></td>'
            + '<td class="twa" ></td>'
            + '<td  class="hdg" ></td>'
        }
        var isTWAMode = r.curr.isRegulated;
        
        var twaFG = (r.curr.twa < 0) ? "red" : "green";
        var twaBold = isTWAMode ? "font-weight: bold;" : "";
        var twaBG = " ";
        if(bestTwa)
        {
            twaBG = twaBackGround(r.curr.twa,bestTwa);
        }
        
        var hdgFG = isTWAMode ? "black" : "blue";
        var hdgBold = isTWAMode ? "font-weight: normal;" : "font-weight: bold;";
        if(drawTheme =='dark')
            hdgFG = isTWAMode ? "white" : "darkcyan"; 
        
        return Util.gentdRacelog("rank", "rank", null, "Rank", (r.rank ? r.rank : "-"))
            + Util.gentdRacelog("dtl", "dtl", null, "DTL", Util.roundTo(r.curr.distanceToEnd - r.bestDTF, 2+nbdigits))
            + Util.gentdRacelog("dtf", "dtf", null, "DTF", Util.roundTo(r.curr.distanceToEnd, 2+nbdigits))
            + '<td class="twd">' + Util.roundTo(r.curr.twd, 2+nbdigits) + '</td>'
            + '<td class="tws">' + Util.roundTo(r.curr.tws, 2+nbdigits) + '</td>'
            + '<td class="twa" style="color:' + twaFG + ";" + twaBG + twaBold  + '">' + Util.roundTo(Math.abs(r.curr.twa), 2+nbdigits) + '</td>'
            + '<td  class="hdg" style="color:' + hdgFG + ";" + hdgBold + '">' + Util.roundTo(r.curr.heading, 2+nbdigits) + '</td>'
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
            sSail : sailNames[uinfo.sail%10],
            aSail : (uinfo.sail > 10 ? "<span title='Auto Sails' class='cursorHelp'>&#x24B6;</span>" : ""),
            xfactorStyle: 'style="color:' + ((uinfo.xplained) ? ((drawTheme =='dark')?"#a5A5A5" :"black") : "red") + ';"',
            nameStyle: uinfo.nameStyle,
            bcolor: uinfo.bcolor,
            bbcolor: uinfo.bbcolor,
            staminaStyle: 'style="color: ' + ((uinfo.stamina < paramStamina.tiredness[0]) ? "red" : "green") + ';"',
            
        };
        if(!uinfo.stamina)
            res.staminaStyle = "";
        else if (uinfo.stamina < paramStamina.tiredness[1]) 
            res.staminaStyle = 'style="color:orange"';

        if(!uinfo.speed  )
            res.xfactorStyle = 'style="color:' + (drawTheme =='dark')?"#a5A5A5" :"black" + ';"';

        //if(uinfo.xoption_sailOverlayer != "0%")
        //    res.xfactorStyle = 'style="color:red;"';
        
        if(uinfo.xoption_sailOverlayer != "0%" && uinfo.xplained) {
            let x = uinfo.xoption_sailOverlayer.replace('%','');
            x = Number(x);
            if(x > 1.2 || (x<0 && Math.abs(x)<98))
                res.xfactorStyle = 'style="color:red;"';
            else if(x > 0)
                res.xfactorStyle = 'style="color:orange ;"';
        }

        res.nameClass = "";

        if (uid == currentUserId) {
            res.nameStyle = "color: #b86dff; font-weight: bold; ";
            res.bcolor = '#b86dff';
            res.nameClass = ' highlightMe';
            if (!uinfo.displayName) {
                res.name = 'Me';
            }        
        } else {
            var idx = category.indexOf(uinfo.type);
            if(drawTheme =='dark')
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
            switch (uinfo.shortSail) {
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
        return  (uid == currentUserId)
            || (record.type2 == "followed" && cbFriends.checked)
            || (record.type2 == "team" && cbTeam.checked)
            || (record.type2 == "normal" && cbOpponents.checked)
            || ((record.type == "top" || record.type2 == "top") && cbTop.checked)
            || (record.type2 == "certified" && cbCertified.checked)
            || (record.type2 == "real" && cbReals.checked)
            || ((record.type == "sponsor" || record.type2 == "sponsor") && cbSponsors.checked)
            || (record.choice == true && cbSelect.checked)
            || (record.state == "racing" && cbInRace.checked);
    }



   function makeIntegratedHTML(rstTimer) {

        function vmg (speed, twa) {
            var r = Math.abs(Math.cos(twa / 180 * Math.PI));
            return speed * r;
        }
   
        

        var raceStatusHeader = '<tr>'
        + '<th title="Call Router" colspan="2">' + "RT" + '</th>'
        + '<th title="Call Polars">' + "PL" + '</th>'
        + '<th title="Call ITYC">' + "ITYC" + '</th>'
        + '<th>' + "Time" + '</th>'
        + '<th title="True Wind Direction">' + "TWD" + '</th>'
        + '<th title="True Wind Speed">' + "TWS" + '</th>'
        + '<th title="True Wind Angle">' + "TWA" + '</th>'
        + '<th title="Heading">' + "HDG" + '</th>'
        + '<th title="Boat speed">' + "Speed" + '</th>'
        + '<th title="Auto Sail time remaining">' + "aSail" + '</th>' 
        + '<th title="Boat VMG">' + "VMG" + '</th>'       
        + '<th title="Best VMG Up | Dw">' + "Best VMG" + '</th>' 
        + '<th title="Best Speed spd | TWA">' + "Best speed" + '</th>'
        + '<th title="Stamina">' + "Stamina" + '</th>'
        + '<th title=""Speed factor over no-options boat">' + "Factor" + '</th>'       
        + '<th title="Boat assumed to have Foils. Unknown if no foiling conditions">' + "Foils" + '</th>'
        + '<th title="Position">' + "Position" + '</th>';


        if(lang ==  "fr") {
            raceStatusHeader += '<th title="Temps restant changement de voile">' + "Voile" + '</th>'
            + '<th title="Temps restant empannage">' + "Emp." + '</th>'
            + '<th title="Temps restant virement">' + "Vir." + '</th>';
        } else
        {
            raceStatusHeader += '<th title="Time remaining sail change">' + "Sail" + '</th>'
            + '<th title="Time remaining tack">' + "Tack" + '</th>'
            + '<th title="Time remaining gybe">' + "Gybe" + '</th>';       
        }

        raceStatusHeader += '</tr>';

        var raceLine ="";
        var r = races.get(selRace.value);
        var raceId ="";

        if(!currentUserId ) {
            if(lang ==  "fr") {
                raceLine ="<tr><td colspan='22'>❌ Joueur non détecté (<a href='https://www.virtualregatta.com'>Relancer</a>)</td></tr>";
            } else {
                raceLine ="<tr><td colspan='22'>❌ Player not detected (<a href='https://www.virtualregatta.com'>Reload</a>)</td></tr>";    
            }
        } else if(r == undefined || r.curr == undefined ||((welcomePage))) {
            if(lang ==  "fr") {
                raceLine ='<tr><td colspan="22">❌ Aucune course chargée (Joueur détecté: '+ currentUserName +')</td></tr>';
            } else
            {
                raceLine ='<tr><td colspan="22">❌ No race loaded (Player detected: '+ currentUserName +')</td></tr>';            
            }
        } else  {
            let p=  raceFleetMap.get(r.id).uinfo[currentUserId];

            raceId = r.id;
            var bestTwa = r.curr.bestVmg;
            var bestVMGString = bestTwa.twaUp + '<span class="textMini">°</span> | ' + bestTwa.twaDown + '<span class="textMini">°</span>';
            var bestVMGTilte = Util.roundTo(bestTwa.vmgUp, 2+nbdigits) + '<span class="textMini"> kts</span> | ' + Util.roundTo(Math.abs(bestTwa.vmgDown), 2+nbdigits) + '<span class="textMini"> kts</span>';
            var bspeedTitle = Util.roundTo(bestTwa.bspeed, 2+nbdigits) + ' <span class="textMini">kts</span><br>' + bestTwa.btwa + '<span class="textMini">°</span>';
    
            var lastCalcDelta = r.curr.receivedTS - r.curr.lastCalcDate; 
            var lastCalcStyle = ""
            if(lastCalcDelta > 900000) {
                lastCalcStyle = 'style="background-color: red;'
                lastCalcStyle += (drawTheme =='dark')?' color:black;"':'"';
            }
            
            
            // No need to infer TWA mode, except that we might want to factor in the last command
            var isTWAMode = r.curr.isRegulated;
            
            var twaFG = (r.curr.twa < 0) ? "red" : "green";
            var twaBold = isTWAMode ? "font-weight: bold;" : "";
            var twaBG = " ";
            if(bestTwa)
            {
                twaBG = twaBackGround(r.curr.twa,bestTwa);
            }
            var hdgFG = isTWAMode ? "black" : "blue";
            var hdgBold = isTWAMode ? "font-weight: normal;" : "font-weight: bold;";
            if(drawTheme =='dark')
                hdgFG = isTWAMode ? "white" : "darkcyan";

            if(drawTheme =='dark')
            	var agroundBG = r.curr.aground ? "darkred" : "darkgreen";
        	else
            	var agroundBG = r.curr.aground ? LightRed : "lightgreen"; 
            var staminaStyle = "";
            var staminaTxt = "-"
            if(r.curr.stamina)
            {
                if (r.curr.stamina < paramStamina.tiredness[0]) 
                    staminaStyle = 'style="color:red"';
                else if (r.curr.stamina < paramStamina.tiredness[1]) 
                    staminaStyle = 'style="color:orange"';
                else 
                    staminaStyle = 'style="color:green"';   
                staminaTxt = Util.roundTo(r.curr.stamina , 2) + "%";
                staminaTxt += " (x" + Util.roundTo(computeEnergyPenalitiesFactor(r.curr.stamina) , 2)+")" ;
            };

            var timeLine = '<div>'+Util.formatTimeNotif(r.curr.lastCalcDate)+'</div><div id="dashIntegTime" class="textMini">'+'</div>';

            raceLine = '<tr id="rs:' + r.id + '" style="background-color:' + agroundBG + ';">';
            raceLine += (r.url ? ('<td class="tdc"><span id="rt:' + r.id + '">&#x2388;</span></td>') : '<td>&nbsp;</td>')
            raceLine += '<td class="tdc"><span id="vrz:' + r.id + '">&#x262F;</span></td>'
            
            raceLine += '<td class="tdc"><span id="pl:' + r.id + '">&#x26F5;</span></td>'
            raceLine += '<td class="tdc"><span id="ityc:' + r.id + '">&#x2620;</span></td>'         
                + '<td class="time" ' + lastCalcStyle + '>' +  timeLine + '</td>'
                + '<td class="twd">' + Util.roundTo(r.curr.twd, 2+nbdigits) + '</td>'
                + '<td class="tws">' + Util.roundTo(r.curr.tws, 2+nbdigits) + '</td>'
                + '<td class="twa" style="color:' + twaFG + ";" + twaBG + twaBold  + '">' + Util.roundTo(Math.abs(r.curr.twa), 2+nbdigits) + '</td>'
                + '<td  class="hdg" style="color:' + hdgFG + ";" + hdgBold + '">' + Util.roundTo(r.curr.heading, 2+nbdigits) + '</td>'
                + '<td class="speed1"'+ (r.curr.aground ?('style="background-color:' + agroundBG + ';">'):'>') + Util.roundTo(r.curr.speed, 2+nbdigits) + '</td>'
                + infoSail(r,true)
                + '<td class="speed2">' + Util.roundTo(vmg(r.curr.speed, r.curr.twa), 2+nbdigits) + '</td>'
                + '<td class="bvmg"><p>' + bestVMGString +'</p>';
            if(document.getElementById("showBVMGSpeed").checked) 
                raceLine += '<p>(' + bestVMGTilte + ')</p>';
            raceLine += '</td>'
                + '<td class="bspeed">' + bspeedTitle +'</td>'
                + '<td class="stamina" '+ staminaStyle+ '>' + staminaTxt  + '</td>';
            if(!p)
            { 
                raceLine += '<td class="xfactor"> - </td>'
                    + '<td class="foil"> - </td>'
                    + '<td class="position"> - </td>';

            } else {
                var bi = boatinfo(currentUserId, p);
                var xfactorTxt = Util.roundTo(p.xfactor, 4);
                if(p.xoption_sailOverlayer != "0%" && p.xplained) {
                    xfactorTxt += " " + p.xoption_sailOverlayer;
                } 

                raceLine += '<td class="xfactor"' + bi.xfactorStyle + '>' + xfactorTxt + '</td>'
                + '<td class="foil">' + (p.xoption_foils || "?") + '</td>'
                + '<td class="position">' + (p.pos ? Util.formatPosition2l(p.pos.lat, p.pos.lon) : "-") + '</td>';
            }  
            function isCurrent(timestamp) {
                return (timestamp && r.prev && r.prev.lastCalcDate && (timestamp > r.prev.lastCalcDate));
            }
    
            function getBG(timestamp) {
                return isCurrent(timestamp) ? ('style="background-color: ' + ((drawTheme =='dark')?"darkred":LightRed) + ';"') : "";
            }

            if(r.curr.tsEndOfSailChange)
                raceLine += '<td class="sailPenalties" ' + getBG(r.curr.tsEndOfSailChange) + '>' + formatSeconds(r.curr.tsEndOfSailChange - r.curr.lastCalcDate) + '</td>';
            else
                raceLine += '<td class="sailPenalties"> - </td>';
            if(r.curr.tsEndOfGybe)
                raceLine += '<td class="gybe" ' + getBG(r.curr.tsEndOfGybe) + '>' + formatSeconds(r.curr.tsEndOfGybe - r.curr.lastCalcDate) + '</td>';
            else
                raceLine += '<td class="gybe"> - </td>';
            if(r.curr.tsEndOfTack)
                raceLine += '<td class="tack" ' + getBG(r.curr.tsEndOfTack) + '>' + formatSeconds(r.curr.tsEndOfTack - r.curr.lastCalcDate) + '</td>';
            else
                raceLine += '<td class="tack"> - </td>';

            raceLine += '</tr>';

        }

        let outputTable =  '<table id="raceStatusTable">'
            + '<thead>'
            + raceStatusHeader
            + '</thead>'
            + '<tbody>'
            + raceLine
            + '</tbody>'
            + '</table>';


        let gameSize = document.getElementById("fullScreen_Size").value;
        if(!document.getElementById("FullScreen_Game" ).checked) gameSize = 0;

        return {order: "update",
        content:outputTable,
        newTab:cbReuseTab.checked,
        rid:raceId,
        theme:drawTheme,type:"data",rstTimer:rstTimer,gameSize:gameSize}
	}
    function computeEnergyPenalitiesFactor(stamina) {
        let coeff = stamina * -0.015 + 2;
        return coeff<0.5?0.5:coeff;
    }
    function makeRaceStatusHTML() {
        function makeRaceStatusLine(pair) {

            function vmg (speed, twa) {
                var r = Math.abs(Math.cos(twa / 180 * Math.PI));
                return speed * r;
            }
        
            function isSailisInOptions(sailId,options)
            {
                switch(sailId)
                {
                    default :
                    case 1 : //JIB
                    case 2 : //SPI
                        return true;
                    case 3 : //STAYSAIL
                    case 6 : //HEAVY_GNK
                        return options.includes("heavy");
                    case 4 : //LIGHT_JIB
                    case 7 : //LIGHT_GNK
                        return options.includes("light");
                    case 5 : //CODE_0
                        return options.includes("reach");
                }
            }

            function bestVMG(tws, polars, options,sailId,currTwa) {
                var best = {"vmgUp": 0, "twaUp": 0,"sailUp":0,
                             "vmgDown": 0, "twaDown": 0,"sailDown":0, 
                             "bspeed" :0,"btwa":0,"sailBSpeed":0,
                             "sailTWAMin":0,"sailTWAMax":0,
                             "sailTWSMin":0,"sailTWSMax":0};
                if(!polars)
                    return  best;
                var iS = fractionStep(tws, polars.tws);
    
                var detect =false;
                var twaDetect = [];
                for (var twaIndex=250; twaIndex < 1800; twaIndex++) {
                    var aTWA = twaIndex/10;
                    var iA	= fractionStep(aTWA, polars.twa);
                    var actualSailSpd = 0;
                    var bestSpd = 0;
                    var bestSpdSail = 0;
                    for (const sail of polars.sail) {
                        if(!isSailisInOptions(sail.id,options)) continue;
                        var f = foilingFactor(options, tws, polars.twa[iA.index], polars.foil);
                        var h = options.includes("hull") ? polars.hull.speedRatio : 1.0;
                        var rspeed = bilinear(iA.fraction, iS.fraction,
                                              sail.speed[iA.index-1][iS.index - 1],
                                              sail.speed[iA.index][iS.index - 1],
                                              sail.speed[iA.index-1][iS.index],
                                              sail.speed[iA.index][iS.index]);
                        var speed = rspeed  * f * h;
                        var vmg = speed * Math.cos(aTWA / 180 * Math.PI);
                        if (vmg > best.vmgUp) {
                            best.twaUp = aTWA;
                            best.vmgUp = vmg;
                            best.sailUp = sail.id;
                        } else if (vmg < best.vmgDown) {
                            best.twaDown = aTWA;
                            best.vmgDown = vmg;
                            best.sailDown = sail.id;
                        }
                        if(speed>best.bspeed) {
                            best.bspeed = speed;
                            best.btwa = aTWA;
                            best.sailBSpeed = sail.id;
                        }
                        if(speed>bestSpd) {
                            bestSpd = speed;
                            bestSpdSail = sail.id;
                        }
                        if(sailId == sail.id) actualSailSpd = speed;
    
                    }
                    //verify if actual still the best at this TWA
                    if( (actualSailSpd>=bestSpd && bestSpdSail == sailId) ||
                    (actualSailSpd*1.014>bestSpd && bestSpdSail != sailId))  {
                        twaDetect.push(aTWA);
                        detect = true;
                    }
                }
                if(detect) {
                    best.sailTWAMax = twaDetect.reduce(function(v1, v2){return Math.max(v1, v2)});
                    best.sailTWAMin = twaDetect.reduce(function(v1, v2){return Math.min(v1, v2)});
                }
                detect =false;
                var twsDetect = [];
                var iA	= fractionStep(currTwa, polars.twa);
                    
                for (var twsIndex=200; twsIndex < 4300; twsIndex++) {
                    var aTWS = twsIndex/100;
                    var actualSailSpd = 0;
                    var bestSpd = 0;
                    var bestSpdSail = 0;

                    var iS = fractionStep(aTWS, polars.tws);
                    try {
                        for (const sail of polars.sail) {
                            
                            if(!isSailisInOptions(sail.id,options)) continue;
                            var f = foilingFactor(options, aTWS, polars.twa[iA.index], polars.foil);
                            var h = options.includes("hull") ? polars.hull.speedRatio : 1.0;
                            var rspeed = bilinear(iA.fraction, iS.fraction,
                                                  sail.speed[iA.index-1][iS.index - 1],
                                                  sail.speed[iA.index][iS.index - 1],
                                                  sail.speed[iA.index-1][iS.index],
                                                  sail.speed[iA.index][iS.index]);
                            var speed = rspeed  * f * h;
                            if(speed>bestSpd) {
                                bestSpd = speed;
                                bestSpdSail = sail.id;
                            }
                            if(sailId == sail.id) actualSailSpd = speed;
        
                        }
                    } catch {


                    };

                    //verify if actual still the best at this TWA
                    if( (actualSailSpd>=bestSpd && bestSpdSail == sailId) ||
                    (actualSailSpd*1.014>bestSpd && bestSpdSail != sailId))  {
                        twsDetect.push(aTWS);
                        detect = true;
                    }
                }
                if(detect) {
                    best.sailTWSMax = twsDetect.reduce(function(v1, v2){return Math.max(v1, v2)});
                    best.sailTWSMin = twsDetect.reduce(function(v1, v2){return Math.min(v1, v2)});
                }

                return  best;
            }
            var r = pair[1];
            if (r.curr == undefined) {
                return "";
            } else {
                if(drawTheme =='dark')
                    var agroundBG = r.curr.aground ? "darkred" : "darkgreen";
                else
                    var agroundBG = r.curr.aground ? LightRed : "lightgreen";  

                var manoeuvering = (r.curr.tsEndOfSailChange > r.curr.lastCalcDate)
                    || (r.curr.tsEndOfGybe > r.curr.lastCalcDate)
                    || (r.curr.tsEndOfTack > r.curr.lastCalcDate);
                var lastCommand = "-";
                var lastCommandBG = "";
                if (r.lastCommand != undefined) {
                    // ToDo: error handling; multiple commands; expiring?
                    var lcTime = formatTime(r.lastCommand.request.ts);
                    lastCommand = printLastCommand(r.lastCommand.request.actions);
                    lastCommand = "T:" + lcTime + " Actions:" + lastCommand;
                    if (r.lastCommand.rc != "ok") {
                        lastCommandBG = (drawTheme =='background-color:dark; ')?"background-color:darkred; ":LightRed;
                    }
                }
    
                var info = "-";
                if (r.type === "leg") {
                    info = '<span>' + r.legName + '</span>';
                } else if (r.type === "record") {
                    if (r.record) {
                        info = '<span>Record, Attempt ' + parseInt(r.record.attemptCounter) + '</span>';
                    } else {
                        info = '<span>-</span>'
                    }
                }
                if (r.record && r.record.lastRankingGateName) {
                    info += '<br/><span>@ ' + r.record.lastRankingGateName + '</span>';
                }
    
                var trstyle = "hov";
                if (r.id === selRace.value) trstyle += " sel";
                
                var best = bestVMG(r.curr.tws, polars[r.curr.boat.polar_id], r.curr.options,r.curr.sail % 10,r.curr.twa);
                r.curr.bestVmg = best;
                var bestVMGString = best.twaUp + '<span class="textMini">°</span> | ' + best.twaDown + '<span class="textMini">°</span>';
                var bestVMGTilte = Util.roundTo(best.vmgUp, 2+nbdigits) + '<span class="textMini"> kts</span> | ' + Util.roundTo(Math.abs(best.vmgDown), 2+nbdigits) + '<span class="textMini"> kts</span>';
                var bspeedTitle = Util.roundTo(best.bspeed, 2+nbdigits) + ' <span class="textMini">kts</span><br>' + best.btwa + '<span class="textMini">°</span>';
    
                // ... so we can tell if lastCalcDate was outdated (by more than 15min) already when we received it.
                var lastCalcDelta = r.curr.receivedTS - r.curr.lastCalcDate; 

                var lastCalcStyle = ""
                if(lastCalcDelta > 900000) {
                    lastCalcStyle = 'style="background-color: red;'
                    lastCalcStyle += (drawTheme =='dark')?' color:black;"':'"';
                }
                var penalties = manoeuveringPenalities(r);
                var staminaLoose = computeEnergyLoose(r); 

                var tack = "<p>-" +  penalties.tack.dist + "nm | " + penalties.tack.time + "s</p>"; 
                tack  +=  "<p>-" + staminaLoose.tack + "% | " + computeEnergyRecovery(staminaLoose.tack,r.curr.tws,r.curr.options) + "min</p>";
                var gybe =  "<p>-" + penalties.gybe.dist + "nm | " + penalties.gybe.time + "s</p>" 
                gybe += "<p>-"+staminaLoose.gybe + "% | " + computeEnergyRecovery(staminaLoose.gybe,r.curr.tws,r.curr.options) + "min</p>";
                var sail =  "<p>-" + penalties.sail.dist + "nm | " + penalties.sail.time + "s</p>" 
                sail += "<p>-"+staminaLoose.sail + "% | " + computeEnergyRecovery(staminaLoose.sail,r.curr.tws,r.curr.options) + "min</p>";    
                var staminaStyle = "";
                var staminaTxt = "-";
                if(r.curr.stamina)
                {
                    if (r.curr.stamina < paramStamina.tiredness[0]) 
                        staminaStyle = 'style="color:red"';
                    else if (r.curr.stamina < paramStamina.tiredness[1]) 
                        staminaStyle = 'style="color:orange"';
                    else 
                        staminaStyle = 'style="color:green"';   

                    staminaTxt = Util.roundTo(r.curr.stamina , 2) + "%";
                    staminaTxt += " (x" + Util.roundTo(penalties.staminaFactor , 2)+")" ;
                }

                let itycLedColor = "LightGrey";
                if(document.getElementById("ITYC_record").checked)
                {
                    if(r.optITYCStatus) itycLedColor = "LimeGreen";
                    else  itycLedColor = "Red";
                }

                var returnVal = '<tr class="' + trstyle + '" id="rs:' + r.id + '">'
                    + (r.url ? ('<td class="tdc"><span id="rt:' + r.id + '">&#x2388;</span></td>') : '<td>&nbsp;</td>')
                    +  '<td class="tdc"><span id="vrz:' + r.id + '">&#x262F;</span></td>'
                    + '<td class="tdc"><span id="pl:' + r.id + '">&#x26F5;</span></td>'
                    + '<td class="tdc"><span id="wi:' + r.id + '"><img class="icon" src="./img/wind.svg"/></span></td>'
                    + '<td class="tdc"><span id="ityc:' + r.id + '">&#x2620;</span></td>'
                    + '<td class="tdc"><span id="cp:' + r.id + '"><img class="icon" src="./img/compass.svg"/></span></td>'
                    + '<td class="name">' + r.name + '</td>'
                    +'<td class="time" ' + lastCalcStyle + '>' + Util.formatTimeNotif(r.curr.lastCalcDate) + '</td>'
                    + commonTableLines(r,best)
                    + infoSail(r,false)
                    + '<td class="speed1">' + Util.roundTo(r.curr.speed, 2+nbdigits) + '</td>'
                    + '<td class="speed2">' + Util.roundTo(vmg(r.curr.speed, r.curr.twa), 2+nbdigits) + '</td>'
                    + '<td class="bvmg"><p>' + bestVMGString + '</p>';
                    if(document.getElementById("showBVMGSpeed").checked) 
                        returnVal += '<p>(' + bestVMGTilte + ')</p>';
                    returnVal += '</td>'
                    + '<td class="bspeed">' + bspeedTitle +'</td>'
                    + '<td class="stamina" ' + staminaStyle + '>' + staminaTxt  + '</td>'
                    + '<td class="tack">' + tack + '</td>'
                    + '<td class="gybe">' + gybe + '</td>'
                    + '<td class="sailPenalties">' + sail + '</td>'
                    + '<td class="agrd" style="background-color:' + agroundBG + ';">' + (r.curr.aground ? "AGROUND" : "No") + '</td>'
                    + '<td class="man">' + (manoeuvering ? "Yes" : "No") + '</td>';
                
                if(cbWithLastCmd.checked)   
                    returnVal += '<td ' + lastCommandBG + '">' + lastCommand + '</td>';
                
                returnVal += '<td><span style="color:'+itycLedColor+';font-size:16px;"><b>&#9679</b></span></td>';
                returnVal += '</tr>';
                return returnVal;

            }
        }

        function computeEnergyLoose(r) {

            if(!polars || !polars[r.curr.boat.polar_id])
            return {
                "gybe" : "-",
                "tack" : "-",
                "sail" : "-"
                };
            function computeStaminaLoose(tws,basePt,boatId,type="M")
            {
                function getBoatCoefficient(boatWeight) {
                    if(!paramStamina.consumption.boats) return -1;
                    let i = 0;
                    let rangeList = Object.keys(paramStamina.consumption.boats);
                    for(i = 0 ; i<rangeList.length-1;i++)
                    {
                        if(boatWeight >= rangeList[i] && boatWeight < rangeList[i+1])
                            break;
                    }
                    return paramStamina.consumption.boats[rangeList[i]];
                }
                function getWindConsumptionFactor(windSpeed) {      
                    const vrJacketwinds = {// hard coded by VR
                        "0": 1,
                        "10": 1,
                        "20": 1.2,
                        "30": 1.8
                    };
                    let winds = paramStamina.consumption.winds;
                    if(r.curr.options.includes('vrtexJacket')) winds = vrJacketwinds;
                    const windKeys = Object.keys(winds).map(Number).sort((a, b) => a - b);
                    if (windSpeed <= windKeys[0]) return winds[windKeys[0]];
                    if (windSpeed >= windKeys[windKeys.length - 1]) return winds[windKeys[windKeys.length - 1]];
                
                    let lowerBound = windKeys[0];
                    let upperBound = windKeys[0];
                    for (let i = 0; i < windKeys.length; i++) {
                        if (windSpeed >= windKeys[i]) {
                            lowerBound = windKeys[i];
                        }
                        if (windSpeed < windKeys[i]) {
                            upperBound = windKeys[i];
                            break;
                        }
                    }
                    const ratio = (windSpeed - lowerBound) / (upperBound - lowerBound);  
                    return winds[lowerBound] + ratio * (winds[upperBound] - winds[lowerBound]);
                }

                var boatStamina = -1;
                if(r.legdata && r.legdata.boat && r.legdata.boat.stats)
                {
                    boatStamina = getBoatCoefficient(r.legdata.boat.stats.weight/1000);
                } 
                if(boatStamina == -1)
                {
                    if(boat2StaminaCoeff[boatId]) boatStamina = boat2StaminaCoeff[boatId].stamina;
                    else boatStamina = 1;
                }
                basePt *= boatStamina;
                if(type=="S" && r.curr.options.includes('magicFurler')) basePt *= 0.8;
                return (getWindConsumptionFactor(tws)*basePt).toFixed(2);
            }
            return {
                "gybe" : computeStaminaLoose(r.curr.tws, paramStamina.consumption.points.gybe, r.curr.boat.polar_id),
                "tack" : computeStaminaLoose(r.curr.tws, paramStamina.consumption.points.tack, r.curr.boat.polar_id),
                "sail" : computeStaminaLoose(r.curr.tws, paramStamina.consumption.points.sail, r.curr.boat.polar_id,"S")
            };
        }

        function computeEnergyRecovery(pts,tws,options) {
            if(!tws) return "-";
            var ltws = paramStamina.recovery.loWind;
            var htws = paramStamina.recovery.hiWind;
            var lRecovery = paramStamina.recovery.loTime*60;
            var hRecovery = paramStamina.recovery.hiTime*60;
            var minByPt = 1;
            if(tws<=ltws) {
                minByPt = lRecovery;
            } else  if(tws>=htws) {
                minByPt = hRecovery;
            } else {
                let aFactor = (hRecovery+lRecovery)/2;
                let bFactor = (hRecovery-lRecovery)/2;
                minByPt = aFactor-Math.cos((tws-ltws)/(htws-ltws)*Math.PI)*bFactor;
            }
            if (options.includes('comfortLoungePug')) minByPt *= 0.8;
            return ((pts / Number(paramStamina.recovery.points)*minByPt)/60).toFixed(0); 
        }        
        

        function manoeuveringPenalities (record) {
            if(!polars || !polars[record.curr.boat.polar_id])
                return {
                    "gybe" : "-",
                    "tack" : "-",
                    "sail" : "-",
                    "staminaFactor" :""
                    };
            function penalty (speed, options, fraction, spec,boatcoeff,type="M") {
                if(!polars || !polars[record.curr.boat.polar_id])
                {
                    return {
                        "time" : "-",
                        "dist" : "-",
                    };
                }
                if (options.indexOf("winch") >= 0) {
                    spec = spec.pro;
                } else {
                    spec = spec.std;
                }
                var time = (spec.lw.timer + (spec.hw.timer - spec.lw.timer) * fraction)*boatcoeff;
                if(type=="S") {
                    if (options.indexOf("magicFurler") >= 0) {
                        time *= 0.8;
                    }
                }
                var dist = speed * time / 3600;
                return {
                    "time" : time.toFixed(),
                    "dist" : (dist * (1- spec.lw.ratio)).toFixed(3)
                };
            }
            var winch = polars[record.curr.boat.polar_id].winch;
            var tws = record.curr.tws;
            var speed = record.curr.speed;
            var options = record.curr.options;
           //take account of penalities
            var fraction;
            if  ((winch.lws <= tws) && (tws <= winch.hws)) {
                fraction = 0.5-Math.cos((tws-winch.lws)/(winch.hws-winch.lws)*Math.PI)*0.5;
            } else if (tws < winch.lws) {
                fraction = 0;
            } else {
                fraction = 1;
            }

            //take in account stamina, coeff is coming from impact value
            var boatCoeff = 1.0;
            if(record.curr.stamina) boatCoeff = computeEnergyPenalitiesFactor(record.curr.stamina);
            

            return {
                "gybe" : penalty(speed, options, fraction, winch.gybe,boatCoeff),
                "tack" : penalty(speed, options, fraction, winch.tack,boatCoeff),
                "sail" : penalty(speed, options, fraction, winch.sailChange,boatCoeff,"S"),
                "staminaFactor" : (record.curr.stamina?boatCoeff:"")
            };
        }
        var raceStatusHeader = '<tr>'
            + '<th title="Call Router" colspan="2">' + "RT" + '</th>'
            + '<th title="Call Polars">' + "PL" + '</th>'
            + '<th title="Call WindInfo">' + "WI" + '</th>'
            + '<th title="Call ITYC">' + "ITYC" + '</th>'
            + '<th title="Open compass">' + "C" + '</th>'
            + '<th>' + "Race" + '</th>'
            + '<th>' + "Time" + '</th>'
            + commonHeaders()
            + '<th title="Auto Sail time remaining">' + "aSail" + '</th>'
            + '<th title="Boat speed">' + "Speed" + '</th>'
            + '<th title="Boat VMG">' + "VMG" + '</th>'
            + '<th>' + "Best VMG" + '</th>'
            + '<th>' + "Best speed" + '</th>'
            + '<th title="Stamina">' + "Stamina" + '</th>';
        if(lang ==  "fr") {
            raceStatusHeader += '<th title="Temps de manoeuvre théorique">' + "Virement" + '</th>'
                            + '<th title="Temps de manoeuvre théorique">' + "Empannage" + '</th>'
                            + '<th title="Temps de manoeuvre théorique">' + "Voile" + '</th>';
        } else
        {
            raceStatusHeader += '<th title="Approximated manoeuvring loose">' + "Tack" + '</th>'
                            + '<th title="Approximated manoeuvring loose">' + "Gybe" + '</th>'
                            + '<th title="Approximated manoeuvring loose">' + "Sail" + '</th>';
        }
        raceStatusHeader += '<th title="Boat is aground">' + "Agnd" + '</th>'
            + '<th title="Boat is maneuvering, half speed">' + "Mnvr" + '</th>';
        if(cbWithLastCmd.checked)  
            raceStatusHeader += '<th >' + "Last Command" + '</th>';
        raceStatusHeader += '<th title="ITYC option Status">' + "Co" + '</th>'
        

        raceStatusHeader += '</tr>';

        divRaceStatus.innerHTML =  '<table id="raceStatusTable">'
            + '<thead>'
            + raceStatusHeader
            + '</thead>'
            + '<tbody>'
            + Array.from(races || []).map(makeRaceStatusLine).join(" ");
            + '</tbody>'
            + '</table>';
    }

    function updateFleetHTML(rf) {
        function friendListHeader() {
            function recordRaceColumns () {
                var race = races.get(selRace.value);
                if (race.type === "record") {
                    return  Util.genth("th_sd","Race Time", "Current Race Time", Util.sortField == "startDate", Util.currentSortOrder)
                        + Util.genth("th_eRT","ERT", "Estimated Total Race Time", Util.sortField == "eRT", Util.currentSortOrder)
                        + Util.genth("th_avgS","avgS", "Average Speed", Util.sortField == "avgSpeed", Util.currentSortOrder);
                } else {
                    return "";
                }
            }
            var race = races.get(selRace.value);
            return '<tr>'
                + Util.genth("th_rt", "RT", "Call Router", undefined)
                + Util.genth("th_lu", "Date" + dateUTC(), undefined, Util.sortField == "lastCalcDate", Util.currentSortOrder)
                + Util.genth("th_name", "Skipper", undefined, Util.sortField == "displayName", Util.currentSortOrder)
                + Util.genth("th_teamname", "Team", undefined, Util.sortField == "teamname", Util.currentSortOrder)
                + Util.genth("th_rank", "Rank", undefined, Util.sortField == "rank", Util.currentSortOrder)
                + ((race.type !== "record")?Util.genth("th_racetime", "RaceTime", "Current Race Time", Util.sortField == "raceTime", Util.currentSortOrder):"")
                + Util.genth("th_dtu", "DTU", "Distance to Us", Util.sortField == "distanceToUs", Util.currentSortOrder)
                + Util.genth("th_dtf", "DTF", "Distance to Finish", Util.sortField == "dtf", Util.currentSortOrder)
                + Util.genth("th_twd", "TWD", "True Wind Direction", Util.sortField == "twd", Util.currentSortOrder)
                + Util.genth("th_tws", "TWS", "True Wind Speed", Util.sortField == "tws", Util.currentSortOrder)
                + Util.genth("th_twa", "TWA", "True Wind Angle", Util.sortField == "twa", Util.currentSortOrder)
                + Util.genth("th_hdg", "HDG", "Heading", Util.sortField == "heading", Util.currentSortOrder)
                + Util.genth("th_speed","Speed","Boat Speed", Util.sortField == 'speed', Util.currentSortOrder)
                + Util.genth("th_vmg","VMG","Velocity Made Good", Util.sortField == 'vmg', Util.currentSortOrder)
                + Util.genth("th_sail", "Sail", "Sail Used", Util.sortField == "sail", Util.currentSortOrder)
                + Util.genth("th_factor", "Factor", "Speed factor over no-options boat", Util.sortField == "xfactor", Util.currentSortOrder)
                + Util.genth("th_foils", "Foils", "Boat assumed to have Foils. Unknown if no foiling conditions", Util.sortField == "xoption_foils", Util.currentSortOrder)
                + recordRaceColumns()
                + Util.genth("th_psn", "Position", undefined)
                + Util.genth("th_options", "Options", "Options according to Usercard",  Util.sortField == "xoption_options", Util.currentSortOrder)
                + Util.genth("th_state", "State", "Waiting or Staying, Racing, Arrived, Aground or Bad TWA", Util.sortField == "state", Util.currentSortOrder)
                + Util.genth("th_remove", "", "Remove selected boats from the fleet list", undefined)
                + '</tr>';
        }
        function makeFriendListLine(uid) {
            function recordRaceFields (race, r) {
                    //This function takes in latitude and longitude of two location and returns the distance between them as the crow flies (in km)
                function calcCrow(pos0,pos1) 
                {
                    // Converts numeric degrees to radians
                    function toRad(Value) 
                    {
                        return Value * Math.PI / 180;
                    }
                    var R = 6371; // km
                    var dLat = toRad(pos1.lat-pos0.lat);
                    var dLon = toRad(pos1.lon-pos0.lon);
                    var lat1 = toRad(pos0.lat);
                    var lat2 = toRad(pos1.lat);

                    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
                    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
                    var d = R * c;
                    return d;
                }

                if (race.type === "record") {
                    if (r.state === "racing" && r.distanceToEnd) {
                        try {
                            var raceTime = (r.tsRecord - r.startDate);
                            var estimatedSpeed = r.distanceFromStart / (raceTime / 3600000);
                            var eTtF = (r.distanceToEnd / estimatedSpeed) * 3600000;
                            r.avgSpeed = estimatedSpeed;
                            r.eRT = raceTime + eTtF;
                        } catch (e) {
                            r.eRT = e.toString();
                        }
                        var t ;
                        if(r.eRT) t = '<td class="eRT" title= "End : ' + Util.formatShortDate(r.eRT,undefined,cbLocalTime.checked) + '">' + Util.formatDHMS(r.eRT, 1+nbdigits) + '</td>';
                        else t = '<td class="eRT" title= "End : unknow"></td>';
                        return '<td class="eRT" title= "Start : ' + Util.formatShortDate(r.startDate,undefined,cbLocalTime.checked) + '">' + Util.formatDHMS(raceTime) + '</td>'  // Modif Class
                            + t
                            + '<td class="avg">' + Util.roundTo(r.avgSpeed, 1+nbdigits) + '</td>';
                    } else {
                        if(r.startDate && r.state === "racing" && r.startDate!="-") {
                            //r.dtf can replace 
                            var raceTime = (Date.now() - r.startDate);
                            var retVal = '<td class="eRT" title= "Start : ' + Util.formatShortDate(r.startDate,undefined,cbLocalTime.checked) + '">' + Util.formatDHMS(raceTime) + '</td>'  // Modif Class;
                    
                           /* if(r.dtf)
                            {
                                var distanceFromStart = calcCrow(r.pos, {lat: race.legdata.start.lat, lon:race.legdata.start.lon});
                                var estimatedSpeed = distanceFromStart / (raceTime / 3600000);
                                var eTtF = (r.dtf / estimatedSpeed) * 3600000;
                                r.avgSpeed = estimatedSpeed;
                                r.eRT = raceTime + eTtF;
                                retVal += '<td class="eRT" title= "End : ' + Util.formatShortDate(r.eRT,undefined,cbLocalTime.checked) + '">' + Util.formatDHMS(r.eRT, 1+nbdigits) + '</td>'
                                + '<td class="avg">' + Util.roundTo(r.avgSpeed, 1+nbdigits) + '</td>';                            
                            } else*/
                             retVal += '<td class="eRT"> - </td>'
                                    + '<td class="avg"> - </td>'; 
                            return retVal;
                        }
                        else
                            return '<td class="eRT"> - </td>'                                                                    // Modif Class
                            + '<td class="eRT"> - </td>'
                            + '<td class="avg"> - </td>';
                        
                    }
                } else {
                    return "";
                }
            }

            if (uid == undefined) {
                return "";
            } else {
                var r = this.uinfo[uid];
                var race = races.get(selRace.value);
                if (r == undefined || race.legdata == undefined) return "";
                var bi = boatinfo(uid, r);
    
                r.dtf = r.distanceToEnd;
                r.dtfC = (race.legdata?Util.gcDistance(r.pos, race.legdata.end):"-");
                if (!r.dtf || r.dtf == "null") {
                    r.dtf = r.dtfC;
                }
                
                // Ajout - Puces colonne State
                var iconState = "";
                var txtTitle="";
                if (r.state == null) {
                    iconState = '';
                } else if (r.state == "racing" && bi.speed == 0 && bi.twa != 0) {
                    iconState = '<span style="color:Red;">&#x2B24;</span>';
                    txtTitle = "AGROUND !";
                } else if (r.state == "racing" && bi.speed != 0) {
                    iconState = '<span style="color:DodgerBlue;">&#x2B24;</span>';
                    txtTitle = "Racing";
                } else if (r.state == "arrived") {
                    iconState = '<span style="color:Lime;">&#x2B24;</span>';
                    txtTitle = "Arrived";
                } else if (r.state == "waiting") {
                    iconState = '<span style="color:DimGray;">&#x2a02;</span>';
                    txtTitle = "Waiting";
                } else if (r.state == "staying") {
                    iconState = '<span style="color:DimGray;">&#x2a02;</span>';
                    txtTitle = "Staying";
                } else {
                    iconState = "-";
                }
                // Fin Ajout - Puces colonne State

                // Ajout - Puces colonne Skipper
                var bull = "";
                if (r.choice) {
                    bull = '<span style="color:HotPink;font-size:16px;"><b>&#9679;</b></span>';
                }
    
                if (r.team == true) {
                    bull += '<span style="color:Red;font-size:16px;"><b>&#9679;</b></span>';
                }
                if (r.followed == true || r.isFollowed == true) {
                    bull += '<span style="color:LimeGreen;font-size:16px;"><b>&#9679</b></span>';
                } else if (r.type == "real") {
                    bull = '<span style="color:Chocolate;font-size:16px;"><b>&#9679;</b></span>';
                } else {
                    bull += '<span style="color:LightGrey;font-size:16px;"><b>&#9679;</b></span>';
                }
                
                if ( r.type == "top") {
                    bull += '<span style="color:GoldenRod;font-size:16px;"><b>&#9679;</b></span>';
                }
                if ( r.type == "certified") {
                    bull += '<span style="color:DodgerBlue;font-size:16px;"><b>&#9679;</b></span>';
                }
                if ( r.type == "sponsor") {
                    bull += '<span style="color:DarkSlateBlue;font-size:16px;"><b>&#9679;</b></span>';
                }
                
                if (uid == currentUserId) {
                    bull = '<span>&#11088</span>';
                }
                // Fin Ajout - Puces colonne Skipper
    
                var lock;
                if (!r.isregulated) {
                    var lock = "";
                }
                if (r.isRegulated == true) {
                    // var lock = "&#128272;";
                    var lock = "<span title='TWA Locked' class='cursorHelp'>&#x24B6;</span>";
                }
                if (r.isRegulated == false) {
                    var lock = "<span title='TWA Unlocked' class='cursorHelp'>&#x25EF;</span>";
                }
                
                var teamName = DM.teamModel.teamName;
                var playerData = DM.getPlayerInfos(uid);
                if(playerData)
                {
                    teamName =  DM.getTeamName(playerData.teamId).remExportAcc();
                    if(teamName != DM.teamModel.teamName)
                    {
                        r.teamname = teamName;
                        r.teamId = playerData.teamId;
                    }
                }


                var xfactorTxt = Util.roundTo(r.xfactor, 4);
                if(r.xoption_sailOverlayer != "0%" && r.xplained) {
                    xfactorTxt += " " + r.xoption_sailOverlayer;
                } 

                var isDisplay = isDisplayEnabled(r, uid) &&  ( !cbInRace.checked || r.state == "racing" );
                if (isDisplay) {
                    var isTWAMode = r.isRegulated;
                    var hdgFG = isTWAMode ? "black" : "blue";
                    var hdgBold = isTWAMode ? "font-weight: normal;" : "font-weight: bold;";
                    if(drawTheme =='dark')
                        hdgFG = isTWAMode ? "white" : "darkcyan";

                    var xOptionsTxt = "?";
                    var xOptionsTitle = null;
                    
                    if(r.xoption_options)
                    {
                        xOptionsTxt = r.xoption_options;
                        if(document.getElementById("abbreviatedOption").checked) {
                            xOptionsTitle = r.xoption_options;
                            xOptionsTxt = xOptionsTxt.replace("All Options","AO");
                            xOptionsTxt = xOptionsTxt.replace("Full Pack","FP");
                            xOptionsTxt = xOptionsTxt.replace("reach","R");
                            xOptionsTxt = xOptionsTxt.replace("light","L");
                            xOptionsTxt = xOptionsTxt.replace("heavy","H");
                            xOptionsTxt = xOptionsTxt.replace("winch","W");
                            xOptionsTxt = xOptionsTxt.replace("foil","F");
                            xOptionsTxt = xOptionsTxt.replace("hull","h");
                            xOptionsTxt = xOptionsTxt.replace("magicFurler","M");
                            xOptionsTxt = xOptionsTxt.replace("vrtexJacket","J");
                            xOptionsTxt = xOptionsTxt.replace("comfortLoungePug","C");

                        } 
                    }
                    

                    r.raceTime = "";
                    var legS = 0;
                    if (r.legStartDate != undefined && r.legStartDate > 0) legS = r.legStartDate;
                    if (race.legdata && race.legdata.start != undefined && race.legdata.start.date != undefined) legS = race.legdata.start.date;
                    if (legS > 0) r.raceTime = r.lastCalcDate-legS;

                    var routerCell = '<td>&nbsp;</td>';
                    if(document.getElementById("sel_router").value=="zezo") {
                        if(race.url) routerCell = '<td class="tdc"><span id="rt:' + uid + '">&#x2388;</span></td>';
                    } else
                        routerCell = '<td class="tdc"><span id="vrz:' + uid + '">&#x262F;</span></td>';

                    return '<tr class="' + bi.nameClass + ' hovred" id="ui:' + uid + '">'
                        + routerCell
                        + Util.gentd("Time","",null, formatTime(r.lastCalcDate, 1))
                        + '<td class="Skipper" style="' + bi.nameStyle + '"><div class="bull">' + bull + "</div> " + bi.name + '</td>'
                        + Util.gentd("Team","",null, r.teamname )
                        + Util.gentd("Rank","",null, (r.rank ? r.rank : "-"))
                        + ((race.type !== "record")?Util.gentd("RaceTime","",null, (r.raceTime ? Util.formatDHMS(r.raceTime) : "-")):"")
                        + Util.gentd("DTU","",null, (r.distanceToUs ? Util.roundTo(r.distanceToUs, 2+nbdigits) : '-') )
                        + Util.gentd("DTF","",null, ((r.dtf==r.dtfC)?"(" + Util.roundTo(r.dtfC,2+nbdigits) + ")":Util.roundTo(r.dtf,2+nbdigits)) )
                        + Util.gentd("TWD","",null, Util.roundTo(r.twd, 2+nbdigits) )
                        + Util.gentd("TWS","",null, Util.roundTo(bi.tws, 2+nbdigits) )
                        + Util.gentd("TWA", bi.twaStyle,null, Util.roundTo(bi.twa, 2+nbdigits) )
                        + Util.gentd("TWAIcon", 'style="color:grey; align:center; text-align:center;"', null, lock)
                        + Util.gentd("HDG", 'style="color:' + hdgFG + '";"' + hdgBold ,null, Util.roundTo(bi.heading, 2+nbdigits) )
                        + Util.gentd("Speed","",null, Util.roundTo(bi.speed, 2+nbdigits) )
                        + Util.gentd("VMG","",null, Util.roundTo(r.vmg, 2+nbdigits))
//                        + Util.gentd("Sail","",null, '<span ' + bi.sailStyle + '>&#x25e2&#x25e3  </span>' + bi.sail )
                        + Util.gentd("Sail","",null, '<span ' + bi.sailStyle + '>&#x25e2&#x25e3  </span>' + bi.sSail )
                        + Util.gentd("SailIcon", 'style="color:grey; align:center; text-align:center;"', null, bi.aSail)
                        + Util.gentd("Factor", bi.xfactorStyle,null, xfactorTxt )
                        + Util.gentd("Foils", "", null, (r.xoption_foils || "?"))
                        + recordRaceFields(race, r)
                        + Util.gentd("Position","",null, (r.pos ? Util.formatPosition(r.pos.lat, r.pos.lon) : "-") )
                        + Util.gentd("Options","",xOptionsTitle, xOptionsTxt)
                        + Util.gentd("State", "", txtTitle, iconState)
                        + Util.gentd("Remove", "", null, (r.choice && uid != currentUserId ? '<span class="removeSelectedBoat" data-id="' + uid + '" title="Remove this boat: ' + bi.name + '">❌</span>' : ""))
                        + '</tr>';
                }
            }
        }
        if (rf === undefined || rf.table.length==0) {
            divFriendList.innerHTML = "No friend positions received yet";
        } else {
            if (originClick == 2) {
                Util.sortFriends(rf,originClick);
                var fleetHTML =
                    '<table>'
                    + '<thead class="sticky">'
                    + friendListHeader()
                    + '</thead>'
                    + '<tbody>'
                    + Array.from(rf.table || []).map(makeFriendListLine, rf).join(" ");
                    + '</tbody>'
                    + '</table>';
                divFriendList.innerHTML = fleetHTML;

                addEventListenersToRemoveSelectedBoatButtons();
                addEventListenersToSelectedLine();
            }
        }
    }

    function mySoNiceSound(s) {
       var e=document.createElement('audio');
       e.setAttribute('src',s);
       e.play();
    }



    function makeTableHTML(r) {

        function tableHeader() {
            return '<tr>'
                + Util.genthRacelog("th_rl_date", "dateTime", "Time" + dateUTC())
                + commonHeaders()
                + Util.genthRacelog("th_rl_aSail", "aSail", "aSail", "Auto Sail time remaining")
                + Util.genthRacelog("th_rl_reportedSpeed", "reportedSpeed", "vR (kn)", "Reported speed")
                + Util.genthRacelog("th_rl_calcSpeed", "calcSpeed", "vC (kn)", "Calculated speed (Δd/Δt)")
                + Util.genthRacelog("th_rl_foils", "foils", "Foils", "Foiling factor")
                + Util.genthRacelog("th_rl_factor", "factor", "Factor", "Speed factor")
                + Util.genthRacelog("th_rl_stamina", "stamina", "Stamina", "Stamina Value. (penalities factor)")
                + Util.genthRacelog("th_rl_deltaDistance", "deltaDistance", "Δd (nm)", "Calculated distance")
                + Util.genthRacelog("th_rl_deltaTime", "deltaTime", "Δt (s)", "Time between positions")
                + Util.genthRacelog("th_rl_psn", "position", "Position")
                + Util.genthRacelog("th_rl_sail", "sail", "Sail", "Sail change time remaining")
                + Util.genthRacelog("th_rl_gybe", "gybe", "Gybe", "Gybing time remaining")
                + Util.genthRacelog("th_rl_tack", "tack", "Tack", "Tacking time remaining")
                + '</tr>';
        }

        function makeRaceLineLogCmd(cinfo) {
            if(!cinfo.action) return"";
            return '<tr class="commandLine hovred">'
            + '<td class="time">' + formatDateUTC(cinfo.ts, 1) + '</td>'
            + '<td colspan="19"><b>Command @ ' + (cinfo.ts_order_sent ? formatDateUTC(cinfo.ts_order_sent, 2) : formatDateUTC(cinfo.ts))
            + '</b> • <b>Actions</b> → ' + printLastCommand(cinfo.action) + '</td>'
            + '</tr>';
        }
        function makeRaceLineLog(rinfo)
        {
            function isDifferingSpeed(realSpeed, calculatedSpeed) {
                return Math.abs(1 - realSpeed / calculatedSpeed) > 0.01;
            }
    
            function isCurrent(timestamp) {
                return (timestamp && (timestamp > rinfo.plastCalcDate));
            }
    
            function getBG(timestamp) {
                return isCurrent(timestamp) ? ('style="background-color: ' + ((drawTheme =='dark')?"darkred":LightRed) + ';"') : "";
            }
    
            function isPenalty() {
                return isCurrent(rinfo.sailTime)
                    || isCurrent(rinfo.gybeTime)
                    || isCurrent(rinfo.tackTime);
            }
    
            function infoSailRl(rinfo,s) {
    
                var sailInfo;
                if(s) {
                    sailInfo = sailNames[rinfo.sail % 10];
                } else
                    sailInfo =  '<span ' + 'style="color:' + sailColors[rinfo.sail] + '" padding: 0px 0px 0px 2px;"' + '>&#x25e2&#x25e3  </span>'+ sailNames[rinfo.sail % 10];
    
                if (rinfo.isAutoSail) {
                    sailInfo = sailInfo + " <span title='Auto Sails' class='cursorHelp'>&#x24B6;</span> " + rinfo.autoSailTime;
                } else {
                    sailInfo = sailInfo + " (Man)";
                }
                
                var sailNameBG = rinfo.badSail ? LightRed : "lightgreen";
                if(drawTheme =='dark')
                    sailNameBG = rinfo.badSail ? "darkred" : "darkgreen";
        
                 // ... so we can tell if lastCalcDate was outdated (by more than 15min) already when we received it.
                if(rinfo.lastCalcDelta > 900000)   sailNameBG = 'red' ;
        
                return  '<td class="asail" style="background-color:' + sailNameBG + ';">' + sailInfo + "</td>";
        
            }
        
            function commonTableLinesRl(rinfo,bestTwa) {
                // No need to infer TWA mode, except that we might want to factor in the last command
                if(!rinfo)
                {
                    return '<td class="rank"></td>'
                    + '<td class="dtl"></td>'
                    + '<td class="dtf"></td>'
                    + '<td class="twd"></td>'
                    + '<td class="tws"></td>'
                    + '<td class="twa" ></td>'
                    + '<td  class="hdg" ></td>'
                }
                var isTWAMode = rinfo.isRegulated;
                
                var twaFG = (rinfo.twa < 0) ? "red" : "green";
                var twaBold = isTWAMode ? "font-weight: bold;" : "";
                var twaBG = " ";
                if(bestTwa)
                {
                    twaBG = twaBackGround(rinfo.twa,bestTwa);
                }
                
                var hdgFG = isTWAMode ? "black" : "blue";
                var hdgBold = isTWAMode ? "font-weight: normal;" : "font-weight: bold;";
                if(drawTheme =='dark')
                    hdgFG = isTWAMode ? "white" : "darkcyan"; 
                
                return Util.gentdRacelog("rank", "rank", null, "Rank", (rinfo.rank ? rinfo.rank : "-"))
                    + Util.gentdRacelog("dtl", "dtl", null, "DTL", Util.roundTo(rinfo.distanceToEnd - rinfo.bestDTF, 2+nbdigits))
                    + Util.gentdRacelog("dtf", "dtf", null, "DTF", Util.roundTo(rinfo.distanceToEnd, 2+nbdigits))
                    + '<td class="twd">' + Util.roundTo(rinfo.twd, 2+nbdigits) + '</td>'
                    + '<td class="tws">' + Util.roundTo(rinfo.tws, 2+nbdigits) + '</td>'
                    + '<td class="twa" style="color:' + twaFG + ";" + twaBG + twaBold  + '">' + Util.roundTo(Math.abs(rinfo.twa), 2+nbdigits) + '</td>'
                    + '<td  class="hdg" style="color:' + hdgFG + ";" + hdgBold + '">' + Util.roundTo(rinfo.heading, 2+nbdigits) + '</td>'
            }
            if(!rinfo.tws) return"";
    
            nbdigits=(cb2digits.checked?1:0);
            rt.set_nbdigit(nbdigits);
            var speedCStyle = "";
            var speedTStyle = "";
            var deltaDist = Util.roundTo(rinfo.deltaD, 2+nbdigits);
    
            if (isPenalty()) {
                speedCStyle = 'style="background-color: ' + ((drawTheme =='dark')?"darkred":LightRed) + ';"';
            } else if (isDifferingSpeed(rinfo.speed,rinfo.speedC)) {
                speedCStyle = 'style="background-color: yellow;';
                speedCStyle += (drawTheme =='dark')?' color:black;"':'"';
    
            } else if (rinfo.speedT && isDifferingSpeed(rinfo.speedT.speed)) {
                // Speed differs but not due to penalty - assume "Bad Sail" and display theoretical delta
                speedTStyle = 'style="background-color: ' + ((drawTheme =='dark')?"darkred":LightRed) + ';"';
                deltaDist = deltaDist + " (" + Util.roundTo(rinfo.deltaD_T, 2+nbdigits) + ")";
            }
    
            var sailChange = formatSeconds(rinfo.sailTime - rinfo.lastCalcDate);
            var gybing = formatSeconds(rinfo.gybeTime - rinfo.lastCalcDate);
            var tacking = formatSeconds(rinfo.tackTime - rinfo.lastCalcDate);
    
            var staminaStyle = "";
            if(rinfo.stamina)
            {
                if (rinfo.stamina < paramStamina.tiredness[0]) 
                    staminaStyle = 'style="color:red"';
                else if (rinfo.stamina < paramStamina.tiredness[1]) 
                    staminaStyle = 'style="color:orange"';
                else 
                    staminaStyle = 'style="color:green"';   
            }

            var xfactorStyle= 'style="color:' + ((rinfo.xplained) ? ((drawTheme =='dark')?"#a5A5A5" :"black") : "red") + ';"'
            if(rinfo.xoption_sailOverlayer != "0%" && rinfo.xplained) {
            let x = rinfo.xoption_sailOverlayer.replace('%','');
                x = Number(x);
                if(x > 1.2 || (x<0 && Math.abs(x)<98))
                    xfactorStyle = 'style="color:red;"';
                else if(x > 0)
                    xfactorStyle = 'style="color:orange ;"';
            }

            var xfactorTxt = Util.roundTo(rinfo.xfactor, 4);
            if(rinfo.xoption_sailOverlayer != "0%" && rinfo.xplained) {
                xfactorTxt += " " + rinfo.xoption_sailOverlayer;
            } 

            return '<tr class="hovred">'
                + Util.gentdRacelog("time", "time", null, "Time", formatDateUTC(rinfo.lastCalcDate, 1))
                + commonTableLinesRl(rinfo,rinfo.bestVmg)
                + infoSailRl(rinfo,false)
                + Util.gentdRacelog("speed1", "reportedSpeed", null, "vR (kn)", Util.roundTo(rinfo.speed, 2+nbdigits))
                + Util.gentdRacelog("speed2", "calcSpeed", speedCStyle, "vC (kn)", (Util.roundTo(rinfo.speedC, 2+nbdigits) + " (" + sailNames[(rinfo.sail % 10)] + ")"))
                + Util.gentdRacelog("foils", "foils", null, "Foils", (rinfo.speedT ? (Util.roundTo(rinfo.speedT.foiling, 0) + "%") : "-"))
                + Util.gentdRacelog("xfactor", "factor", xfactorStyle, "Factor", xfactorTxt)
                + Util.gentdRacelog("stamina", "stamina", staminaStyle, "Stamina", (rinfo.stamina ? Util.roundTo(rinfo.stamina , 2) + "%": "-"))
                + Util.gentdRacelog("deltaD", "deltaDistance", speedTStyle, "Δd (nm)", deltaDist)
                + Util.gentdRacelog("deltaT", "deltaTime", null, "Δt (s)", Util.roundTo(rinfo.deltaT, 0))
                + Util.gentdRacelog("position", "position", null, "Position", Util.formatPosition(rinfo.pos.lat, rinfo.pos.lon))
                + '<td class="sailPenalties" ' + getBG(rinfo.sailTime) + '>' + sailChange + '</td>'
                + '<td class="gybe" ' + getBG(rinfo.gybeTime) + '>' + gybing + '</td>'
                + '<td class="tack" ' + getBG(rinfo.tackTime) + '>' + tacking + '</td>'
                + '</tr>';
    
    
        }

        function makeRaceLine(rinfo)
        {
            if(!rinfo  ) return"";
            if(rinfo.rlType =="log") return makeRaceLineLog(rinfo);
            else return makeRaceLineLogCmd(rinfo);
        }
        
        if (cbLocalTime.checked) {
            var timeHidden = "display: none;";
            var timeLocalHidden = "";
        } else {
            var timeHidden = "";
            var timeLocalHidden = "display: none;";
        }

        var rli = [];
        if(r && r.id) rli = DM.getRaceLogInfos(r.id);

        return '<style>'                    // Modif
            + '#UTC {' + timeHidden + '}'
            + '#UTCLocal {' + timeLocalHidden + '}'
            + '</style>'                    // Fin Modif
            + '<table>'
            + '<thead class="sticky">'
            + tableHeader ()
            + '</thead>'
            + '<tbody>'
            + Array.from(rli || []).map(makeRaceLine).join(" ")
            + '</tbody>'
            + '</table>';
    }

    function makeTableHTMLProcess(r) {
        divRecordLog.innerHTML = makeTableHTML(r);
        updateToggleRaceLogCommandsLines();
    }

    function updateToggleRaceLogCommandsLines() {
        var commandLines = document.querySelectorAll('tr.commandLine');
        commandLines.forEach(function(line, index) {
            if (document.getElementById("hideCommandsLines").checked) {
                if ( index > 4) {
                    line.style.display = 'none';
                }
            } else {
                line.style.display = '';
            }
        });
    }

    function clearRecordedData(rid) {
        var race = races.get(rid);
        if(race) {
            race.recordedData = [];
            race.recordedData.tws = [];
            race.recordedData.hdg = [];
            race.recordedData.twa = [];
            race.recordedData.twd = [];
            race.recordedData.bs = [];
            race.recordedData.sail = [];
            race.recordedData.sail.id = [];
            race.recordedData.sail.color = [];
            race.recordedData.stamina = [];
            race.recordedData.ts = [];


        }
    }
    
    function fleetInfosCleaner() {

        var interval =   document.getElementById("auto_cleanInterval").value;
        if(!interval) return;
        interval = Number(interval);
        if(!interval) return;
        
        var tooOldLimit = Date.now()- interval*60*1000;
        raceFleetMap.forEach(raceFleet => {


            Object.keys(raceFleet.uinfo).forEach(function (key) {
                
                if(raceFleet.uinfo[key].lastStaminaUpdate < tooOldLimit && key!=currentUserId) {
                    if (raceFleet.uinfo[key].stamina) delete raceFleet.uinfo[key].stamina;
                    if (raceFleet.uinfo[key].rank) delete raceFleet.uinfo[key].rank;
                    if (raceFleet.uinfo[key].lastStaminaUpdate) delete raceFleet.uinfo[key].lastStaminaUpdate;
                    if (raceFleet.uinfo[key].isRegulated) delete raceFleet.uinfo[key].isRegulated;

                    /*record specific*/
                    if (raceFleet.uinfo[key].distanceToEnd) delete raceFleet.uinfo[key].distanceToEnd;
                    if (raceFleet.uinfo[key].distanceFromStart) delete raceFleet.uinfo[key].distanceFromStart;
                    if (raceFleet.uinfo[key].tsRecord) delete raceFleet.uinfo[key].tsRecord;

                }


            });
        });
    }

    ////////////////////////////////////////////////////////////////////////////////
    // mergeBoatInfo
    //
    // Boat info comes from two sources:
    // - fleet messages
    // - boatinfo messages
    // We store all the information in one place and update fields,
    // assuming same-named fields have the same meaning in both messages.
    var elemList = ["_id",                                     //  boatinfo
                    "baseInfos",                               //  UserCard - .team.name
                    "boat",                                    //  baotinfo, fleet
                    "choice",
                    "displayName",                             //  boatinfo, fleet      
                    "distanceFromStart",                       //  boatinfo
                    "distanceToEnd",                           //  boatinfo
                    "extendedInfos",                           //  UserCard, fleet (real boat)
                    "isFollowed",                              //  UserCard, fleet
                    "followed",                                //  fleet
                    "fullOptions",                             //  boatinfo
                    "gateGroupCounters",                       //  boatinfo
                    "hasPermanentAutoSails",                   //  boatinfo
                    "heading",                                 //  boatinfo, fleet
                    "isRegulated",                             //  boatinfo, UserCard
                    "lastCalcDate",                            //  boatinfo, fleet
                    "legStartDate",                            //  boatinfo
                    "mode",
                    "options",                                 //  boatinfo
                    "personal",                                //  boatinfo
                    "pos",                                     //  boatinfo, fleet
                    "rank",                                    //  boatinfo, fleet
                    "sail",                                    //  boatinfo, fleet (null)
                    "speed",                                   //  boatinfo, fleet
                    "startDate",                               //  boatinfo, fleet (null)
                    "state",                                   //  boatinfo, fleet, UserCard (!= boatinfo state!)
                    // Don't copy team &  teamnane, special handling.
                    // "team",                                    //  fleet
                    //"teamname",                                //  UserCard.baseInfos, AccountDetails
                    "track",                                   //  csvFile
                    "tsRecord",
                    "tsEndOfAutoSail",                         //  ?
                    "tsLastEngine",                            //  boatinfo
                    "twa",                                     //  boatinfo, fleet (null)
                    "tws",                                     //  boatinfo, fleet (null)
                    "twd",                                     //
                    "vmg",                                     // 
                    "type",                                    //  boatinfo, fleet (normal, real, certified, top, sponsor)
                    "type2",                                   //  (team, followed, certified, normal, real)
                    "action",                                  //  WP, heading or autoTwa...
                    "preferredMapPreset",                       //  boatinfo
                    "stamina"  									//  boatinfo

                   ];

    function mergeBoatInfo(rid, mode, uid, data) {
        var fleet = raceFleetMap.get(rid);
        if (!fleet) {
            console.log("raceInfo not initialized");
            return;
        }
        var race = races.get(rid);
        var storedInfo = fleet.uinfo[uid];
        var boatPolars = (data.boat) ? polars[data.boat.polar_id] : undefined;
        

        if(uid==currentUserId && data.lastCalcDate) {
            let recordedInfos = race.recordedData;
            if(!recordedInfos) {   
                clearRecordedData(rid);   
            }

            if(!race.recordedData.lastts) race.recordedData.lastts = data.lastCalcDate-1;
            if(race.recordedData.lastts < data.lastCalcDate) {
                race.recordedData.tws.push(data.tws);
                race.recordedData.hdg.push(data.heading);
                race.recordedData.twa.push(data.twa);
                if(!data.twd) race.recordedData.twd.push(race.recordedData.twd.slice(-1));
                else race.recordedData.twd.push(data.twd);
                race.recordedData.bs.push(data.speed);
                race.recordedData.sail.id.push(data.sail);
                race.recordedData.sail.color.push( Util.sailId2Color(data.sail));
                if(!data.stamina) race.recordedData.stamina.push(race.recordedData.stamina.slice(-1));
                else race.recordedData.stamina.push(data.stamina);
                race.recordedData.ts.push(data.lastCalcDate);
                race.recordedData.lastts = data.lastCalcDate;

            }
        }
        
        if (!storedInfo) {
            storedInfo = new Object();
            fleet.uinfo[uid] = storedInfo;
            fleet.table.push(uid); 
        }

        if (mode == "usercard") {
            storedInfo.choice = true;
            storedInfo.isRegulated = false;

        }

        if (data.team && data.team.name) {
            storedInfo.teamname = data.team.name;
        } else if (data.team) {
            storedInfo.team = data.team;
            storedInfo.teamname = currentTeam;
        }
        
        var playerData = DM.getPlayerInfos(uid);
        if(playerData)
        {
            var teamName = DM.getTeamName(playerData.teamId);
            if(teamName != undefined || teamName != teamModel.teamName)
                storedInfo.teamname  = teamName;
                storedInfo.teamId = playerData.teamId;
        }

        if(!storedInfo.extraPos) storedInfo.extraPos=[];
        let lghtExtraPt  = storedInfo.extraPos.length;
        let addPt = false;
        if(lghtExtraPt != 0)
        {
            let lastExtraPt = storedInfo.extraPos[lghtExtraPt-1];
            if(lastExtraPt.ts < data.lastCalcDate)
            {
                if(data.track && data.track.length != 0)
                {
                    if(data.track[data.track.length-1].ts < data.lastCalcDate)
                        addPt = true;
                } else
                    addPt = true;
            }
        } else
        {
            if(data.track && data.track.length != 0)
            {
                if(data.track[data.track.length-1].ts < data.lastCalcDate)
                    addPt = true;
            } else
                addPt = true;
        }

        if(addPt)
        {
            let newPt = [];
            newPt.lat = data.pos.lat;
            newPt.lon = data.pos.lon;
            newPt.ts = data.lastCalcDate
            if(data.isRegulated) newPt.tag = "twa"; else newPt.tag = "hdg";
            storedInfo.extraPos.push(newPt);    
            lghtExtraPt += 1;
        }

        // copy elems from data to uinfo
        elemList.forEach( function (tag) {
            if (tag in data &&  data[tag]) {
                storedInfo[tag] = data[tag];
                if (tag == "baseInfos") {
                    storedInfo.displayName = data["baseInfos"].displayName;
                } else if (tag == "pos" && race.curr) { // calc gc distance to us
                    storedInfo.distanceToUs = Util.roundTo(Util.gcDistance(race.curr.pos, data.pos), 1);
                    storedInfo.bearingFromUs = Util.roundTo(Util.courseAngle(race.curr.pos.lat, race.curr.pos.lon, data.pos.lat, data.pos.lon) * 180 / Math.PI, 1);
                    var ad = storedInfo.bearingFromUs - race.curr.heading + 90;
                    if (ad < 0) ad += 360;
                    if (ad > 360) ad -= 360;
                    if (ad > 180) storedInfo.distanceToUs = -storedInfo.distanceToUs; // "behind" us
                } else if(tag=="stamina" && uid != currentUserId) {
                    storedInfo.lastStaminaUpdate = data["lastCalcDate"];
                } else if(tag=="track")
                {
                    //here merge incomming track infos with kno ones which have been complete with 
                    if(lghtExtraPt!=0 && data.track.length != 0)
                    {
                        let idxExtraPt=lghtExtraPt-1;
                        let extendedTrack = [];
                        let lastExtraPosTsAdd = 0;
                        for(let i =data.track.length-1; i >= 0;)
                        {
                            let extraPosTs = storedInfo.extraPos[idxExtraPt].ts
                            if( extraPosTs > data.track[i].ts && lastExtraPosTsAdd != extraPosTs)
                            {
                                extendedTrack.push(storedInfo.extraPos[idxExtraPt]);
                                lastExtraPosTsAdd = extraPosTs;
                                if(idxExtraPt>0) lghtExtraPt--;
                            } else
                            {
                                extendedTrack.push(data.track[i]);
                                if(i>=0) i--;
                            }
                        }
                        
                        storedInfo.track = extendedTrack.reverse();
                    }
                }
            }
        });

        if((!storedInfo.track || storedInfo.track.lenght == 0) && lghtExtraPt!=0)
        {
            storedInfo.track = storedInfo.extraPos;
        }
        
        fixMessageData(storedInfo, uid);
        
        if (race.type === "record") 
        {
            var storedStartDate = DM.getStartRaceTimePlayer(rid,uid);
            if(storedInfo.state == "racing")
            {

                if(!storedInfo.startDate || storedInfo.startDate==DM.raceOptionPlayerModel.startRaceTime) {
                    if(storedStartDate != DM.raceOptionPlayerModel.startRaceTime) {
                        storedInfo.startDate = storedStartDate;
                    }
                }
            } else {
                storedInfo.startDate = DM.raceOptionPlayerModel.startRaceTime;
            }
        }

        if(uid==currentUserId) explainPlayerOptions(storedInfo); /* options are now transmit only for current user */
        else initPlayerOptions(storedInfo);

        if(storedInfo.xoption_options == "---" || storedInfo.xoption_options == "?")
        {
            var storedPlayerOption = DM.getRaceOptionsPlayer(rid,uid);
			if(storedPlayerOption && storedPlayerOption != "?")
            {
                var optionsList = [];
                if(storedPlayerOption == "Full Pack" || storedPlayerOption =="All Options") {
                    optionsList = ["foil","winch","radio","skin","hull","reach","heavy","light","magicFurler","vrtexJacket","comfortLoungePug"];
                } else
                {
                    var optionsType = storedPlayerOption.split(" ");
                    for(var j = 0; j < optionsType.length;j++)
                    {
                        var options0List =  optionsType[j].replace("[","").replace("]","");
                        options0List = options0List.split(",")
                        for ( var i = 0; i < options0List.length; i++) {
                            optionsList.push(options0List[i]);
                        }
                    }
                }
                storedInfo.options = optionsList;
                explainPlayerOptions(storedInfo);
            }        
        }

        if (boatPolars) {
            var sailDef = boatPolars.sail[data.sail % 10 - 1];

            // "Real" boats have no sail info
            // "Waiting" boats have no TWA
            if (data.state == "racing" && sailDef && data.twa && data.tws) {
                var iA = fractionStep(data.twa, boatPolars.twa);
                var iS = fractionStep(data.tws, boatPolars.tws);

                // "Plain" speed
                var speedT = pSpeed(iA, iS, sailDef.speed);
                // Speedup factors
                var foilFactor = foilingFactor(["foil"], data.tws, data.twa, boatPolars.foil);
                var hullFactor = boatPolars.hull.speedRatio;

                // Explain storedInfo.speed from plain speed and speedup factors
                explain(storedInfo, foilFactor, hullFactor, speedT);
            }
        } else {
            storedInfo.xplained = true;
            storedInfo.xfactor = 1.0;  
        }


        if (data.rank > 0)  {
            storedInfo.rank = data.rank;
            storedInfo.lastRankUpdate = data.lastCalcDate;
        }
        // Ajout - Calcul TWD
        if (storedInfo.twa !== 0) {
            storedInfo.twd = storedInfo.twa + storedInfo.heading;
            if (storedInfo.twd < 0) {
                storedInfo.twd += 360;
            } else if(storedInfo.twd > 360)
                storedInfo.twd -=360; 
        } else {
            storedInfo.twd = "-";
        }
        
        // Ajout - Calcul VMG
        storedInfo.vmg = Math.abs(storedInfo.speed * Math.cos(Util.toRad(storedInfo.twa)));
        
        // Ajout - type2 pour tri par catégories
        if (storedInfo.team) {
            storedInfo.type2 = "team";
        } else if (storedInfo.followed || storedInfo.isFollowed) {
            storedInfo.type2 = "followed";
        } else {
            storedInfo.type2 = storedInfo.type;  
        }

        if(document.getElementById("ITYC_record").checked) tr.addInfoFleet(uid,storedInfo,race.type);
    }

    function mergeBoatTrackInfo(rid, uid, data) {
        var fleet = raceFleetMap.get(rid);
        if (!fleet) {
            console.log("raceInfo not initialized");
            return;
        }
        var storedInfo = fleet.uinfo[uid];
        if (!storedInfo) {
            storedInfo = new Object();
            fleet.uinfo[uid] = storedInfo;
            fleet.table.push(uid);
        }
        // copy elems from data to uinfo
        elemList.forEach( function (tag) {
            if (tag in data && data[tag]) {
                storedInfo[tag] = data[tag];
            }
        });
    }

    function fixMessageData (message, userId) {

        if (message.type == "pilotBoat") {
            message.displayName = "Frigate";
        } else if (message.type == "real") {
            message.displayName = message.extendedInfos.boatName;
            message.rank = message.extendedInfos.rank;
        }

        message.tsRecord = message.lastCalcDate || Date.now();
    }



    function determineRankingCategory(savedOptions)
    {
        if(savedOptions == "Full Pack" || savedOptions == "All Options"
        || savedOptions == "FP" || savedOptions == "AO")
            return "Full Pack";
        else if(savedOptions == "?"|| savedOptions == "---")
        {
            return "?";
        } else if(savedOptions == "-") {
            return "PDD";        
        }  else {
            if(!Array.isArray(savedOptions)) {
                var optionsType = savedOptions.split(" ");
                var optionsList = [];

                for(var j = 0; j < optionsType.length;j++)
                {
                    var options0List =  optionsType[j].replace("[","").replace("]","");
                    options0List = options0List.split(",")
                    for ( var i = 0; i < options0List.length; i++) {
                        optionsList.push(options0List[i]);
                    }
                }
            } else{
                optionsList = savedOptions;
            }
            var optionBits = {
                "hull":  1,
                "winch": 2,
                "foil":  4,
                "light": 8,
                "reach": 16,
                "heavy": 32,
                "h"    : 1,
                "W":     2,
                "F":     4,
                "L":     8,
                "R":     16,
                "H":     32
            };
            let optDetected = 0;
            for (const option of optionsList) {
                if (optionBits[option]) {
                    optDetected |= optionBits[option];
                }
            }
            var categoryIndicator = 0;
            if(optDetected&1)  categoryIndicator += 84337349;
            if(optDetected&2)  categoryIndicator += 120481928;
            if(optDetected&4)  categoryIndicator += 265060241;
            if(optDetected&8)  categoryIndicator += 180722892;
            if(optDetected&16) categoryIndicator += 204819277;
            if(optDetected&32) categoryIndicator += 144578313;
            if(categoryIndicator <= 240963855)
                return "PDD";        
            else if(categoryIndicator <= 500000000)
                return "1/2 Full Pack";  
            else
                return "Full Pack";
        
        }
    }
    function initPlayerOptions(info)
    {
        info.xoption_foils = "?";
        info.xoption_sailOverlayer = "0%";
        info.xoption_options = "?";
        info.savedOption = "?";
    }

    function explainPlayerOptions(info)
    {
        info.xoption_sailOverlayer = "0%";
        info.xoption_options = "?";
        info.savedOption = "?";
        info.xoption_foils = "?";

        if (info.fullOptions === true) {
            info.xoption_options = "Full Pack";
            info.savedOption = "Full Pack";
            info.rankingCategory  = "Full Pack";
            info.xoption_foils = "0%";
        } else if (info.options && info.options!="-") {
            if (info.options.length == 8) {
                info.xoption_options = "All Options";
                info.savedOption = "All Options";
                info.rankingCategory  = "Full Pack";
                info.xoption_foils = "0%";
            } else {
                var opt_sail = "[";
                var opt_perf = "[";
                var opt_sail_found = false;
                var opt_perf_found = false;
                
                if (info.options.includes('reach')) {opt_sail += "reach,";opt_sail_found = true;}
                if (info.options.includes('light')) {opt_sail += "light,";opt_sail_found = true;}
                if (info.options.includes('heavy')) {opt_sail += "heavy,";opt_sail_found = true;}
                if (info.options.includes('winch')) {opt_perf += "winch,";opt_perf_found = true;}
                if (info.options.includes('foil'))  {opt_perf += "foil,"; info.xoption_foils = "0%";opt_perf_found = true;}
                else info.xoption_foils = "no";
                if (info.options.includes('hull'))  {opt_perf += "hull,";opt_perf_found = true;}
                if (info.options.includes('magicFurler'))  {opt_perf += "magicFurler,";opt_perf_found = true;}
                if (info.options.includes('vrtexJacket'))  {opt_perf += "vrtexJacket,";opt_perf_found = true;}
                if (info.options.includes('comfortLoungePug'))  {opt_perf += "comfortLoungePug,";opt_perf_found = true;}
                
        
                opt_sail = opt_sail.substring(0,opt_sail.length-1);
                opt_perf = opt_perf.substring(0,opt_perf.length-1);
                if (opt_sail.length != "") opt_sail += "]";
                if (opt_perf.length != "") opt_perf += "]";                
                
                if(opt_sail_found && opt_perf_found)
                {
                    info.xoption_options = opt_sail + " " + opt_perf;
                    info.savedOption = opt_sail + " " + opt_perf;
                } else if(opt_sail_found && !opt_perf_found)
                {
                    info.xoption_options = opt_sail;
                    info.savedOption = opt_sail;
                } else if(!opt_sail_found && opt_perf_found)
                {
                    info.xoption_options = opt_perf;
                    info.savedOption = opt_perf;
                } else
                { // get only skin or radio
                    info.xoption_options = "-";
                    info.savedOption = "-";
                }
                
                
            }
        } else if(!info.options)
        {
            info.xoption_options = "-";
            info.savedOption = "-";
            info.xoption_foils = "no";
        }        
    }

    function explain(info, foilFactor, hullFactor, speedT) {
        function epsEqual(a, b) {
            return Math.abs(b - a) < 0.00001;
        }

        info.xfactor = info.speed / speedT;
        info.xplained = false;
        var foils = ((foilFactor - 1) * 100) / 4 * 100;

        if (epsEqual(info.xfactor, 1.0)) {
            // Speed agrees with "plain" speed.
            // Explanation: 1. no hull and 2. foiling condition => no foils.
            info.xplained = true;
            // info.xoption_options = "no";
            if (foilFactor > 1.0) {
                info.xoption_foils = "no";
            }
            
            info.xoption_sailOverlayer = "0%";
        } else {
            // Speed does not agree with plain speed.
            // Check if hull, foil or hull+foil can explain the observed speed.
            if (epsEqual(info.speed, speedT * hullFactor)) {
                info.xplained = true;
                info.xoption_sailOverlayer = "0%";
                if (epsEqual(hullFactor, foilFactor)) {
                    // Both hull and foil match.
                    info.xoption_foils = Util.roundTo(foils, 0) + "%";
                } else {
                    if (foilFactor > 1.0) {
                        info.xoption_foils = "no";
                    }
                }
            } else if (epsEqual(info.speed, speedT * foilFactor)) {
                info.xplained = true;
                info.xoption_sailOverlayer = "0%";
                info.xoption_foils = Util.roundTo(foils, 0) + "%";
            } else if (epsEqual(info.speed, speedT * foilFactor * hullFactor)) {
                info.xplained = true;
                info.xoption_sailOverlayer = "0%";
                info.xoption_foils = Util.roundTo(foils, 0) + "%";
            } else {
                if(!info.options) return;
                info.xplained = true;
                info.xoption_foils = Util.roundTo(foils, 0) + "%";
                //here check for overspeed due to sail
                //spd = speedT *ff* hf *sf
                //sf = spd /  speedT *ff* hf
                var sf = 1.0;
                if((info.options.includes("foil") && info.options.includes("hull"))
                || info.options.includes("Full Pack")|| info.options.includes("All Options"))
                    sf = info.speed / (speedT * foilFactor * hullFactor);
                else if(info.options.includes("foil"))
                    sf = info.speed / (speedT * foilFactor);
                else if(info.options.includes("hull"))
                    sf = info.speed / (speedT * hullFactor);
                else
                    sf = info.speed / (speedT * hullFactor);

                if(sf >1.0 && sf <= 1.14) {
                    info.xoption_sailOverlayer = "+"+Util.roundTo((sf-1.0)*100, 2) + "%";
                } else if(sf < 1.0) {
                    info.xoption_sailOverlayer = "-"+Util.roundTo((1.0-sf)*100, 2) + "%";
                }
            }
        }
    }


    function updateFleet(rid, mode, data) {
        var fleet = raceFleetMap.get(rid);

        if(!fleet || !fleet.uinfo) return;

        if(document.getElementById("ITYC_record").checked) { //si choix utilisateur
            var raceData = DM.getRaceInfos(rid);
            var name ="-";
            var type = "-";
            if(raceData) {
                name = raceData.legName;
                type= raceData.raceType;
            }
            tr.initMessage("fleet",rid,name,currentUserId,type);
        }  
        
        data.forEach(function (message) {
            mergeBoatInfo(rid, mode, message.userId, message);
        });

        if(document.getElementById("ITYC_record").checked) tr.sendInfo("fleet");

        Util.sortFriends(fleet,originClick);
    }

    

    function formatSeconds(value) {
        if (value < 0) {
            return "-";
        } else {
            return Util.roundTo(value / 1000, 0);
        }
    }

    function formatDate(ts, dflt) {
        var tsOptions = {
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false
        };
        var d = (ts) ? (new Date(ts)) : (new Date());
        if (cbLocalTime.checked) {
        } else {
            tsOptions.timeZone = "UTC";
        }
        return new Intl.DateTimeFormat("lookup", tsOptions).format(d);
    }



    function exportStamina()
    {
        exp.exportStamina(paramStamina);
    }
    function exportPolar()
    {
        exp.exportPolar(polars)
    }

    function exportGraphData()
    {
        var race = races.get(selRace.value);
        if (!race)  return;
        exp.exportGraphData(race,csvSep);
    }
    function saveFile(fileName,urlFile){
        let a = document.createElement("a");
        a.style = "display: none";
        document.body.appendChild(a);
        a.href = urlFile;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(urlFile);
        a.remove();
    }
    function exportFleet() {
        function makeLineFleet(uid) {
            var r = fleet.uinfo[uid];
            
            var bi = boatinfo(uid, r);
                
            var pState = "";
            if (r.state == "racing" && bi.speed == 0 && bi.twa != 0) pState = "AGROUND !";
            else if (r.state == "racing" && bi.speed != 0) pState = "Racing";
            else if (r.state == "arrived") pState = "Arrived";
            else if (r.state == "waiting") pState = "Waiting";
            else if (r.state == "staying") pState = "Staying";
                
            let line = csvSep; //first cell is RT, useless

            line += bi.name + csvSep;
            line += formatTime(r.lastCalcDate)  + csvSep;
            line += (r.rank ? r.rank : "-") + csvSep;
            var data = ((r.dtf==r.dtfC)?"(" + Util.roundTo(r.dtfC,2+nbdigits) + ")":Util.roundTo(r.dtf,2+nbdigits)) + csvSep;
            if(csvSep!=',') data.replace(".",",");
            line += data;
            data =(r.distanceToUs ? Util.roundTo(r.distanceToUs, 2+nbdigits):"-" )+ csvSep;
            if(csvSep!=',') data.replace(".",",");
            line += data;
            line += "-" + csvSep;
            line += bi.sSail + csvSep;
            line += pState + csvSep;
            line += ((race.type !== "record")?(r.raceTime ? Util.formatDHMS(r.raceTime) : "-"):"") + csvSep;
            line += (r.pos ? Util.formatPosition(r.pos.lat, r.pos.lon) : "-")  + csvSep;
            data =Util.roundTo(bi.heading, 2+nbdigits) + csvSep;
            if(csvSep!=',') data.replace(".",",");
            line += data;
            data =Util.roundTo(bi.twa, 2+nbdigits)  + csvSep;
            if(csvSep!=',') data.replace(".",",");
            line += data;
            data = Util.roundTo(bi.tws, 2+nbdigits)  + csvSep;
            if(csvSep!=',') data.replace(".",",");
            line += data;
            data = Util.roundTo(bi.speed, 2+nbdigits) + csvSep;
            if(csvSep!=',') data.replace(".",",");
            line += data;
            data = Util.roundTo(r.xfactor, 4) + csvSep;
            if(csvSep!=',') data.replace(".",",");
            line += data;
            line += (r.xoption_foils || "?") + csvSep;
            line +=  (r.xoption_options || "?") + csvSep;
            line +=  (r.teamname ? r.teamname : "-") + csvSep;
            return line;

        }
        var race = races.get(selRace.value);
        if(!race) return; //todo alert
        var fleet = raceFleetMap.get(race.id);
        if(!fleet) return; //todo alert
        
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
        
        var  date = mm + '_' + dd + '_' + yyyy+ '_' + today.getHours()+today.getMinutes();        
        var tabletitle = " ";
            
        tabletitle +=  'Name'+csvSep + race.legdata.name +csvSep+ race.id+"\n";
        tabletitle +=  'VSR' + race.legdata.vsrLevel + "\n";
        tabletitle += 'Export Date'+csvSep+date+ "\n\n";
        var fileContent = tabletitle;
        fileContent += "RT"+csvSep+"Skipper"+csvSep+"Last Update"+csvSep+"Rank"+csvSep+"DTF"+csvSep+"DTU"+csvSep+"BRG"+csvSep+"Sail"+csvSep+"State"+csvSep+"RaceTime"+csvSep+"Position"+csvSep+"HDG"+csvSep+"TWA"+csvSep+"TWS"+csvSep+"Speed"+csvSep+"Factor"+csvSep+"Foils"+csvSep+"Options"+csvSep+"team\n";
        
        fileContent += Array.from(fleet.table || []).map(makeLineFleet).join("\n");
                 
        let blobData = new Blob([fileContent], {type: "text/plain"});
        let url = window.URL.createObjectURL(blobData);
        saveFile(race.legdata.name+'_'+race.id + '_Fleet_'+date+'.csv',url);

    }

    

    function graphCleanData() {
        var race = races.get(selRace.value);
        if(race && race.recordedData) 
            delete race.recordedData;
        gr.upDateGraph(null);
    }


    function dateUTC() {
       var options = {
            year: "numeric",
            timeZoneName: "short"
        };
        if (cbLocalTime.checked) {} else {
            options.timeZone = "UTC";
        }
        var str = new Intl.DateTimeFormat("lookup", options).format(new Date());
        var res = str.substring(5);
        return '<span class="small">&nbsp;(' + res + ')</span>';
    }

    // Ajout - Affichage Heure locale / Heure UTC
    function formatDateUTC(ts, format = 0) {
        if (!ts) return;
        // Format: MM/DD HH:MM:SS
        var tsOptions = {
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
        var d = (ts) ? (new Date(ts)) : (new Date());
        var dtUTCLocal = new Intl.DateTimeFormat("lookup", tsOptions).format(d);
        tsOptions.timeZone = "UTC";
        var dtUTC = new Intl.DateTimeFormat("lookup", tsOptions).format(d);
        return '<span id="UTC">' + dtUTC + '</span><span id="UTCLocal">' + dtUTCLocal + '</span>';

    }
    // Fin ajout

    function formatTime(ts, format = 0) {
        var tsOptions = {
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
        var d = (ts) ? (new Date(ts)) : (new Date());
        if (!cbLocalTime.checked) {
            tsOptions.timeZone = "UTC";
        }
        return new Intl.DateTimeFormat("lookup", tsOptions).format(d);
    }


    async function addTableCommandLine(r) {
        var rliLine =  saveRaceLogLineCmd(r);
        await DM.addRaceLogInfosLine(r.id,rliLine);
        await DM.saveRaceLogInfos(r.id);

        if (r.id == selRace.value) {
            makeTableHTMLProcess(r);
        }
        // updateMapWaypoints(r);
    }

    function saveRaceLogLineCmd(r) {
        var now = new Date();
        var cinfo = {
            action : r.lastCommand.request.actions,
            ts : r.lastCommand.request.ts,
            ts_order_sent : now,
            rlType : "cmd"     
        }
        return cinfo;
    }



    function saveRaceLogLine(r) {

        var p=0;
        if(r.prev) p = r.prev.lastCalcDate;
        // Remember when this message was received ...
        var t = new Date();
        if (r.curr.receivedTS) {
            t = r.curr.receivedTS;
        } 
        var xfactor = 1.0030;
        var xoption_sailOverlayer = "0%";
        var xplained = false;

        var fleet = raceFleetMap.get(r.id);
        if(fleet && fleet.uinfo[currentUserId])
        {
            var uinfo = fleet.uinfo[currentUserId];
            xplained = uinfo.xplained;
            xoption_sailOverlayer = uinfo.xoption_sailOverlayer;
            xfactor = uinfo.xfactor;
        }

        var rinfo = {
        /* racelog info*/
            lastCalcDate : r.curr.lastCalcDate,
            gybeTime : r.curr.tsEndOfGybe,
            tackTime : r.curr.tsEndOfTack,
            sailTime : r.curr.tsEndOfSailChange,
            speed : r.curr.speed,
            speedT : r.curr.speedT,
            speedC : r.curr.speedC,
            deltaD_T : r.curr.deltaD_T,
            deltaD : r.curr.deltaD,
            deltaT : r.curr.deltaT,
            plastCalcDate : p,
            stamina : r.curr.stamina,
            pos : r.curr.pos,

            /* commonlines */
            isRegulated : r.curr.isRegulated,
            twa : r.curr.twa,
            bestVmg : r.curr.bestVmg,
            rank : r.curr.rank,
            distanceToEnd : r.curr.distanceToEnd,
            bestDTF : r.bestDTF,
            twd : r.curr.twd,
            tws : r.curr.tws,
            heading : r.curr.heading,

            /*infoSail*/
            sail : r.curr.sail,
            isAutoSail : ( r.curr.hasPermanentAutoSails ||
                (r.curr.tsEndOfAutoSail &&(r.curr.tsEndOfAutoSail - r.curr.lastCalcDate) > 0)),
            autoSailTime :( r.curr.hasPermanentAutoSails ? '∞' : Util.formatHMS(r.curr.tsEndOfAutoSail - r.curr.lastCalcDate)),
            badSail : r.curr.badSail,

            /*factor*/
            xfactor : xfactor,
            xoption_sailOverlayer : xoption_sailOverlayer,
            xplained : xplained,

            lastCalcDelta : t - r.curr.lastCalcDate,   
            rlType : "log" ,
            ts : r.curr.receivedTS
        }    
        return rinfo;
    }
    

    async function saveMessage(r) {

        if(document.getElementById("auto_clean").checked) fleetInfosCleaner();

        if(r.curr && r.curr.deltaT != 0)
        {  
            var rliLine =  saveRaceLogLine(r);
            await DM.addRaceLogInfosLine(r.id,rliLine);
            await DM.saveRaceLogInfos(r.id);
            if (r.id == selRace.value) {
                makeTableHTMLProcess(r);
                updateCompas(r);
            }
        }
    }


    function updateFleetFilter(race) {
        nbdigits=(cb2digits.checked?1:0);
        rt.set_nbdigit(nbdigits);

        updateFleetHTML(raceFleetMap.get(selRace.value));
    }

    async function changeRace(raceId) {

        if (typeof raceId === "object") { // select event
            raceId = this.value;
        } else{
            selRace.value = raceId;
        }
        var race = races.get(raceId);
        if(currentRaceId==0) //first Race Selection
        {
            currentRaceId = raceId;
        } else
        {
            //cleaning map infos to ensure correct redraw at race switch
            var previousRace = races.get(currentRaceId);
            lMap.cleanMap(previousRace);
            if(previousRace.gDiv) delete previousRace.gdiv;
            
        
        }

        if(race && race.curr ) welcomePage = false; 
        await DM.getRaceOptionsList(raceId);
        if(!race.optITYCStatus) race.optITYCStatus = false;
                        
        currentRaceId = raceId;
        makeRaceStatusHTML();
        //await DM.initRaceLogInfos(raceId);
        makeTableHTMLProcess(race);
        if(race && race.recordedData) {
            gr.upDateGraph(race.recordedData);
        }
        updateFleetHTML(raceFleetMap.get(raceId));
        buildlogBookHTML(race);
        rt.updateFleet(raceId,raceFleetMap);
        switchMap(race);
        if (cbNMEAOutput.checked) 
            NMEA.setActiveRace(raceId);
        await getOptionNRid("sailRankRaceId","",selRace.value);
    }

    function transformRaceLegId(id)
    {
        if(!id) return undefined;
        if (id.raceId) {
            return id.raceId + "." + id.legNum;
        } else {
            if (id.leg_num) {
                return id.race_id + "." + id.leg_num;
            } else if (id.race_id == 0 && id.leg_num == 0) {
                return id.race_id + "." + id.leg_num;
            } else if (id.num) {
                return id.race_id + "." + id.num;
            } else {
                return undefined;
            }
        }
    }

    function getRaceLegId(id) {
        var ret = transformRaceLegId(id);
        if(!ret)
        {
            if(lastRaceIdReceived)
                ret = transformRaceLegId(lastRaceIdReceived);
        } else
        {
            lastRaceIdReceived = id;
        }
        if(!ret)
        {
            console.log(id);
            alert("Unknown race id format");    
        }
        return ret;            
    }

    function clearLog() {
        divRawLog.innerHTML = "";
    }

    function tableClick(ev) {
        var call_rt = false;
        var call_wi = false;
        var call_pl = false;
        var call_ityc = false;
        var call_cp = false;
        var call_vrzen = false;
        var friend = false;
        var tabsel = false;
        var cbox = false;
        var dosort = true;
        var rmatch;
        var re_rtsp = new RegExp("^rt:(.+)"); // Call-Router
        var re_polr = new RegExp("^pl:(.+)"); // Call-Polars
        var re_wisp = new RegExp("^wi:(.+)"); // Weather-Info
        var re_ityc = new RegExp("^ityc:(.+)"); // ITYC
        var re_vrzen = new RegExp("^vrz:(.+)"); // Call-Vrzen
        var re_rsel = new RegExp("^rs:(.+)"); // Race-Selection
        var re_usel = new RegExp("^ui:(.+)"); // User-Selection
        var re_tsel = new RegExp("^ts:(.+)"); // Tab-Selection
        var re_cbox = new RegExp("^sel_(.+)"); // Checkbox-Selection
        var re_cpsp = new RegExp("^cp:(.+)"); // Call-Compass
        var re_ntdel = new RegExp("^notif_delete_(.+)"); // Notif delete button

        var ev_lbl = ev.target.id;
        switch (ev_lbl) {
            case "th_name":
                Util.set_sortField("displayName");
                break;
            case "th_teamname":
                Util.set_sortField("teamname");
                break;
            case "th_rank":
            case "th_gap":
            case "th_total":   
            Util.set_sortField("rank");
                break;
            case "th_gender":
                Util.set_sortField("genderType");
                break;    
            case "th_teamsize":
                Util.set_sortField("teamsize");
                break;
            case "th_skipper":
                Util.set_sortField("racing");
                break;
            case "th_raceRank":
                Util.set_sortField("raceRank");
                break;
            case "th_xOptions":
                Util.set_sortField("xOptions");
                break;               
            case "th_rankcategory" :
                Util.set_sortField("rankingCategory");
                break;               
            case "th_type":
                Util.set_sortField("type");
                break;                
            case "th_teamid":
                Util.set_sortField("teamId");
                break; 

            case "th_lu":
                Util.set_sortField("lastCalcDate");
                break;
            case "th_sd":
                Util.set_sortField("startDate");
                break;
            case "th_racetime":
                Util.set_sortField("raceTime");
                break;
            case "th_eRT":
                Util.set_sortField("eRT");
                break;
            case "th_avgspeed":
                Util.set_sortField("avgSpeed");
                break;
            case "th_dtf":
                Util.set_sortField("dtf");
                break;
            case "th_dtu":
                Util.set_sortField("distanceToUs");
                break;
            case "th_state":
                Util.set_sortField("state");
                break;
            case "th_hdg":
                Util.set_sortField("heading");
                break;
            case "th_twa":
                Util.set_sortField("twa");
                break;
            case "th_tws":
                Util.set_sortField("tws");
                break;
            case "th_twd":
                Util.set_sortField("twd");
                break;
            case "th_speed":
                Util.set_sortField("speed");
                break;
            case "th_vmg":
                Util.set_sortField("vmg");
                break;
            case "th_sail":
                Util.set_sortField("sail");
                break;
            case "th_factor":
                Util.set_sortField("xfactor");
                break;
            case "th_foils":
                Util.set_sortField("xoption_foils");
                break;
            case "th_flag":
                Util.set_sortField("country");
                break;                
            case "th_options":
                Util.set_sortField("xoption_options");
                break;
            case "th_stamina":
                Util.set_sortField("stamina");
                break;
            case "th_brg":
            //case "th_psn":
            //case "th_foils":
                Util.set_sortField("none");
                break;
            default:
                dosort = false;
        }

        // Sort friends table
        if (dosort) {
            if (Util.sortField == currentSortField) {
                Util.set_currentSortOrder(1 - Util.currentSortOrder);
            } else {
                currentSortField = Util.sortField;
                Util.set_currentSortOrder(0);
            }            
            if (originClick == 2) {
                updateFleetHTML(raceFleetMap.get(selRace.value));
            } 

        }

        for (var node = ev.target; node; node = node.parentNode) {
            var id = node.id;
            var match;
            if (re_rtsp.exec(id)) {
                call_rt = true;
            } else if (re_polr.exec(id)) {
                call_pl = true;
            } else if (re_wisp.exec(id)) {
                call_wi = true;
            } else if (re_ityc.exec(id)) {
                call_ityc = true;
            } else if (re_cpsp.exec(id)) {
                call_cp = true;
            } else if (re_vrzen.exec(id)) {
                call_vrzen = true;  
            } else if (match = re_rsel.exec(id)) {
                rmatch = match[1];
            } else if (match = re_usel.exec(id)) {
                rmatch = match[1];
                friend = true;
            } else if (match = re_tsel.exec(id)) {
                rmatch = match[1];
                tabsel = true;
            } else if (match = re_cbox.exec(id)) {
                rmatch = match[1];
                cbox = true;
            } else if (match = re_ntdel.exec(id)) {
                nf.deleteNotif(id);
            }

        }
        if (rmatch) {
            if (tabsel) {
                // Tab-Selection
                originClick= rmatch ;
             //   EX.extraRoute("hidden");
                display_selbox("hidden");
                for (var t = 1; t <= nbTabs; t++) {
                    if(t==3)
                        document.getElementById("tab-content" + t).style.display = (rmatch == t ? "flex" : "none");
                    else document.getElementById("tab-content" + t).style.display = (rmatch == t ? "block" : "none");
                }
                if (rmatch == 2) {
                    
                    updateFleetHTML(raceFleetMap.get(selRace.value));
                    display_selbox("visible");
                } else if (rmatch == 3) {
                    var race = races.get(selRace.value);
                    rt.updateFleet(race,raceFleetMap);
                    initializeMap(race);
                    EX.extraRoute("visible");
                    display_selbox("visible");
                } else if (rmatch == 4) {
                    buildlogBookHTML(races.get(selRace.value));
                } else if (rmatch == 5) {
                    var race = races.get(selRace.value);
                    if(race && race.recordedData) {
                        gr.upDateGraph(race.recordedData);
                    }
                } else if (rmatch == 6) {
                    nf.showList();
                } else if (rmatch == 8) {
   //                 updateUserConfigHTML();
                }  else if (rmatch == 9) {
                    document.getElementById('ityc_frame').src = getITYCFullExtra(getITYCFull("https://ityc.fr/polarDash.html" + getITYCBoat(selRace.value),selRace.value),selRace.value)  ;
                } 
            } else if (friend) {
                // Friend-Routing
                if (call_rt) callRouter(selRace.value, rmatch, false,"zezo");
                else if (call_vrzen) callRouter(selRace.value, rmatch, false,"vrzen");
            } else if (cbox) {
                // Skippers-Choice
                if(ev_lbl == "sel_ExportFleet") {onFleetInCpyClipBoard();return;}
                changeState(ev_lbl);
            } else if (call_wi) callWindy(rmatch, 0); // weather
            else if (call_rt) callRouter(rmatch, currentUserId, false,"zezo");
            else if (call_pl) callPolars(rmatch);
            else if (call_ityc) callITYC(rmatch);
            else if (call_cp) callCompass(selRace.value,currentUserId);
            else if (call_vrzen) callRouter(rmatch, currentUserId, false,"vrzen");
    
            else
            {

                // Race-Switching
                enableRace(rmatch, true);
                changeRace(rmatch);
            }
        }
    }

    function changeState(lbl_tochange) {
        var cbxlbl = lbl_tochange.replace("lbl_", "sel_");
        var selectedcbx = document.getElementById(cbxlbl);
        if(selectedcbx) {
            if (selectedcbx.checked) {
                selectedcbx.checked = false;
            } else {
                selectedcbx.checked = true;
            }
        }
    }

    function display_selbox(state) {
        document.getElementById("sel_skippers").style.visibility = state;
        document.getElementById("sel_export").style.visibility = state;
    }




    function resize(ev) {
        for (var t = 1; t <= nbTabs; t++) {
            var tab = document.getElementById("tab-content" + t);
            tab.style.height = window.innerHeight - tab.getBoundingClientRect().y;
        }
    }

    function enableRace(id, force) {
        for (var i = 0; i < selRace.options.length; i++) {
            if (selRace.options[i].value == id) {
                selRace.options[i].disabled = false;
                if (selRace.selectedIndex == -1 || force) {
                    selRace.selectedIndex = i;
                }
            }
        }
    }

    function renameRace(id, newname) {
        for (var i = 0; i < selRace.options.length; i++) {
            if (selRace.options[i].value == id) {
                selRace.options[i].text = newname;
            }
        }
    }

    function disableRaces() {
        for (var i = 0; i < selRace.options.length; i++) {
            selRace.options[i].disabled = true;
        }
        selRace.selectedIndex == -1;
    }

    function addRace(message) {
        var raceId = getRaceLegId(message._id);
        var race = {
            id: raceId,
            name: "Race #" + raceId,
            source: "tmp"
        };
        initRace(race, false);
        return race;
    }

    async function updatePosition(message, r) {
        if (r === undefined) {      // race not lsited
            r = addRace(message);
        }

        if (r.curr !== undefined && r.curr.lastCalcDate == message.lastCalcDate) {
            // Repeated message
            // return;
        }

        if (!r.curr) {
            enableRace(r.id);
        }

        r.prev = r.curr;
        r.curr = message;
        var boatPolars = polars[message.boat.polar_id];
        if (boatPolars == undefined || message.options == undefined || message.tws == undefined) {
        } else {
            r.curr.speedT = theoreticalSpeed(message);
        }
        if (r.prev != undefined) {
            var d = Util.gcDistance(r.prev.pos, r.curr.pos);
            var delta = Util.courseAngle(r.prev.pos.lat, r.prev.pos.lon, r.curr.pos.lat, r.curr.pos.lon);
            var alpha = Math.PI - Util.angle(Util.toRad(r.prev.heading), delta);
            var beta = Math.PI - Util.angle(Util.toRad(r.curr.heading), delta);
            var gamma = Util.angle(Util.toRad(r.curr.heading), Util.toRad(r.prev.heading));
            // Epoch timestamps are milliseconds since 00:00:00 UTC on 1 January 1970.
            r.curr.deltaT = (r.curr.lastCalcDate - r.prev.lastCalcDate) / 1000;
            if (r.curr.deltaT > 0
                && Math.abs(Util.toDeg(gamma) - 180) > 1
                && Util.toDeg(alpha) > 1
                && Util.toDeg(beta) > 1) {
                r.curr.deltaD = d / Math.sin(gamma) * (Math.sin(beta) + Math.sin(alpha));
            } else {
                r.curr.deltaD = d;
            }
            r.curr.speedC = Math.abs(Util.roundTo(r.curr.deltaD / r.curr.deltaT * 3600, 2+nbdigits));
            // deltaD_T = Delta distance computed from speedT is only displayed when it deviates
            if (r.curr.speedT) {
                r.curr.deltaD_T = r.curr.deltaD / r.curr.speedC * r.curr.speedT.speed;
            }
        }

        makeRaceStatusHTML();
        await saveMessage(r);
        if (message.gateGroupCounters) {
            r.gatecnt = message.gateGroupCounters;
            lMap.updateMapCheckpoints(r);
        }

        if(r.recordedData) {
            gr.upDateGraph(r.recordedData, true);
        }

    }

    function theoreticalSpeed(message) {
        if(!message.boat)
            return undefined;
        var boatPolars = polars[message.boat.polar_id];
        if (boatPolars == undefined || message.options == undefined || message.tws == undefined) {
            return undefined;
        } else {
            var tws = message.tws;
            var twa = message.twa;
            var options = message.options;
            var foil = foilingFactor(options, tws, twa, boatPolars.foil);
            var foiling = (foil - 1.0) * 100 / (boatPolars.foil.speedRatio - 1.0);
            var hull = options.includes("hull") ? 1.003 : 1.0;
            var ratio = boatPolars.globalSpeedRatio;
            var twsLookup = fractionStep(tws, boatPolars.tws);
            var twaLookup = fractionStep(twa, boatPolars.twa);
            var speed = maxSpeed(options, twsLookup, twaLookup, boatPolars.sail);
            return {
                "speed": Util.roundTo(speed.speed * foil * hull * ratio, 2+nbdigits),
                "sail": sailNames[speed.sail],
                "foiling": foiling
            };
        }
    }

    function maxSpeed(options, iS, iA, sailDefs) {
        var maxSpeed = 0;
        var maxSail = "";
        for (const sailDef of sailDefs) {
            if (sailDef.id === 1
                || sailDef.id === 2
                || (sailDef.id === 3 && options.includes("heavy"))
                || (sailDef.id === 4 && options.includes("light"))
                || (sailDef.id === 5 && options.includes("reach"))
                || (sailDef.id === 6 && options.includes("heavy"))
                || (sailDef.id === 7 && options.includes("light"))) {
                var speed = pSpeed(iA, iS, sailDef.speed);
                if (speed > maxSpeed) {
                    maxSpeed = speed;
                    maxSail = sailDef.id;
                }
            }
        }
        return {
            speed: maxSpeed,
            sail: maxSail
        }
    }

    function getSailDef(sailDefs, id) {
        for (const sailDef of sailDefs) {
            if (sailDef.id === id) {
                return sailDef;
            }
        }
        return null;
    }

    function pSpeed(iA, iS, speeds) {
        return bilinear(iA.fraction, iS.fraction,
            speeds[iA.index - 1][iS.index - 1],
            speeds[iA.index][iS.index - 1],
            speeds[iA.index - 1][iS.index],
            speeds[iA.index][iS.index]);
    }

    function bilinear(x, y, f00, f10, f01, f11) {
        return f00 * (1 - x) * (1 - y)
            + f10 * x * (1 - y)
            + f01 * (1 - x) * y
            + f11 * x * y;
    }

    function foilingFactor(options, tws, twa, foil) {
        var speedSteps = [0, foil.twsMin - foil.twsMerge, foil.twsMin, foil.twsMax, foil.twsMax + foil.twsMerge, Infinity];
        var twaSteps = [0, foil.twaMin - foil.twaMerge, foil.twaMin, foil.twaMax, foil.twaMax + foil.twaMerge, Infinity];
        var foilMat = [[1, 1, 1, 1, 1, 1],
                       [1, 1, 1, 1, 1, 1],
                       [1, 1, foil.speedRatio, foil.speedRatio, 1, 1],
                       [1, 1, foil.speedRatio, foil.speedRatio, 1, 1],
                       [1, 1, 1, 1, 1, 1],
                       [1, 1, 1, 1, 1, 1]];

        if (options.includes("foil")) {
            var iS = fractionStep(tws, speedSteps);
            var iA = fractionStep(twa, twaSteps);
            return bilinear(iA.fraction, iS.fraction,
                foilMat[iA.index - 1][iS.index - 1],
                foilMat[iA.index][iS.index - 1],
                foilMat[iA.index - 1][iS.index],
                foilMat[iA.index][iS.index]);
        } else {
            return 1.0;
        }
    }

    function fractionStep(value, steps) {
        var absVal	= Math.abs(value);
		var index	= 0;
		while (index < steps.length && steps[index]<= absVal) {
			index++;
		}

		if (index >= steps.length) {
			return {
				index	: steps.length-1,
				fraction: 1
			};
		}

		return {
			index	: index,
			fraction: (absVal - steps[index-1]) / (steps[index] - steps[index-1])
		};
    }
    /////////////////////////  Router / polar site call back




    function prepareZezoUrl(raceId, userId, beta, auto = false,withConfirm = true) {
        var optionBits = {
            "winch": 4,
            "foil": 16,
            "light": 32,
            "reach": 64,
            "heavy": 128
        };

        var baseURL = "http://zezo.org";
        var race = races.get(raceId);
        if (!race ) {
            // Panic - check if the race_id part is known.
            // In the unlikely case when the polars change from one leg to another,
            // this will give surprising results...
            var race_id = Number(raceId.split('.')[0]);
            var race = races.get(race_id);
            
            
            if((!race || ! race.url) && withConfirm) alert("Unknown race - no routing available");
            return;
        }
        var urlBeta = race.url + (beta ? "b" : "");

        // Get boat position and options (self or opponent)
        var uinfo;
        var uname = lbBoatname.innerHTML;
        var type = "me";

        uinfo = raceFleetMap.get(raceId).uinfo[userId];
        if (!uinfo && userId == currentUserId) 
            uinfo = race.curr;
        if (!uinfo) {
            alert("Can't find record for user id " + userId);
            return;
        }
        

        if (uinfo.lastCalcDate && withConfirm) {
            var now = Date.now();
            if ((now - uinfo.lastCalcDate) > 750000) {
                console.log("Confirm routing for stale position?");
                // If the Dashboard tab is not active, confirm does NOT raise a popup
                // and returns false immediately.
                // This means the router will not be auto-called with a stale position.
                if (!confirm("Position is older than 10 min, really call router ?")) {
                    console.log("Confirm routing ==> cancel.");
                    return;
                } else {
                    console.log("Confirm routing ==> confirmed.");
                }

            }
        }

        var pos = uinfo.pos;
        var twa = uinfo.twa;

        var options = 2;
        if (uinfo.options) {
            for (const option of uinfo.options) {
                if (optionBits[option]) {
                    options |= optionBits[option];
                }
            }
        }

        var flagIsAuto = (auto ? "&auto=yes" : "&auto=no");

        return baseURL + "/" + urlBeta + "/chart.pl"
            + "?lat=" + pos.lat
            + "&lon=" + pos.lon
            + "&ts=" + (race.curr.lastCalcDate / 1000)
            + "&o=" + options
            + "&twa=" + twa
            + "&userid=" + userId
            + "&type=" + type
            + flagIsAuto;


    }
    /////////////////////////



// Call VRZEN
    function prepareVrzUrl(raceId) {
        var baseURL = "https://routage.vrzen.org/Course";   
        var race_id = Number(raceId.split('.')[0]);
        return baseURL + "/" + race_id;
    }

    function prepareVrzFullUrl(raceId,pid) {
        var baseURL = prepareVrzUrl(raceId);
        var race = races.get(raceId);
        // Get boat position and options (self or opponent)
        var uinfo = raceFleetMap.get(raceId).uinfo[pid];
        if (!uinfo)
        {
            if(pid==currentUserId) uinfo = race.curr; else return baseURL ;
        } 

        var pos = uinfo.pos;
        var hdg = uinfo.heading;
        var voile = uinfo.sail % 10;
        var sta = uinfo.stamina;
        if(sta && sta > 100) sta = 100;
        var lat = Util.roundTo(pos.lat, 6);
        var lon = Util.roundTo(pos.lon, 6);
        let retVal = baseURL 
            + "/" + lat.replace(".",",")
            + "/" + lon.replace(".",",")
            + "/" + Util.roundTo(hdg, 0)
            + "/" + voile;
        if(sta && sta!="-") retVal += "/" + Util.roundTo(sta, 0);

        return retVal;

    }
    
    function callRouterVRZ(raceId,pid) {
        // https://routage.vrzen.org/Course/CourseParDefaut/LatitudeParDefaut/LongitudeParDefaut
        // https://routage.vrzen.org/Course/CourseParDefaut/LatitudeParDefaut/LongitudeParDefaut/CapParDefaut/VoileParDefaut
        // https://routage.vrzen.org/Course/CourseParDefaut/atitudeParDefaut/LongitudeParDefaut/CapParDefaut/VoileParDefaut/EnergieParDefaut   
        var baseURL = prepareVrzUrl(raceId);
        var url = prepareVrzFullUrl(raceId,pid); 
        Util.openTab(url, baseURL,(cbReuseTab.checked && pid == currentUserId));
    
    }
    function callRouterZezo(raceId, pid, beta, auto = false) {
        var urlBeta =  "http://zezo.org/"+ races.get(raceId).url+ (beta ? "b" : "")+"/chart.pl?";
        var url = prepareZezoUrl(raceId, pid, beta, auto);
        Util.openTab(url, urlBeta,(cbReuseTab.checked && pid == currentUserId));
    }

    function callWindy(raceId, userId) {
        var baseURL = "https://www.windy.com";
        var r = races.get(raceId);
        var uinfo;

        if (userId) {
            uinfo = raceFleetMap.get(raceId).uinfo[userId];
            if (uinfo === undefined) {
                alert("Can't find record for user id " + userId);
                return;
            }
        }
        var pos = r.curr.pos;
        if (uinfo) pos = uinfo.pos;
        var url = baseURL + "/?gfs," + pos.lat + "," + pos.lon + ",6,i:pressure,d:picker";
        
        Util.openTab(url, r.url,cbReuseTab.checked);
    }
    function preparePolarBaseUrl()
    {
        var siteSel = document.getElementById("sel_polarSite").value ;

        if(siteSel==1)
            return "http://inc.bureauvallee.free.fr/polaires/?";
        else if(siteSel==2)
            return "https://cert.civis.net/polars/?";
        
        return "http://toxcct.free.fr/polars/?";
        
    }

    function preparePolarUrl(raceId) {
        var baseURL = preparePolarBaseUrl() + "race_id=" + raceId;
       
        var race = races.get(raceId);

        var twa = Math.abs(Util.roundTo(race.curr.twa || 20, 0));
        var tws = Util.roundTo(race.curr.tws || 4, 1);

        if ((!race.curr.tws || !race.curr.twa ) && race.curr.state != "waiting") {
            alert("Missing TWA and/or TWS, calling polars with TWA=" + twa + "°, TWS=" + tws + "kn");
        }

        var url = baseURL + "&tws=" + tws + "&twa=" + twa;

        let optionsList = ["reach", "hull", "light", "heavy", "foil"];
        for (const option of race.curr.options) {
            if (option !== "skin" && option !== "winch" && option !== "radio") {
                const optionIndex = optionsList.indexOf(option);
                if (optionIndex !== -1) {
                    optionsList.splice(optionIndex, 1);
                }
                url += `&${option}=true`;
            }
        }
        for (const option of optionsList) {
            url += `&${option}=false`;
        }

        url += "&utm_source=VRDashboard";
        return url;

    }

    function callPolars(raceId) {
        var baseURL = preparePolarBaseUrl() + "race_id=" + raceId;   
        var url = preparePolarUrl(raceId);
        Util.openTab(url, baseURL,cbReuseTab.checked);
    }

    function getITYCBase() {
        return "https://ityc.fr/autoSail.html";
    }
    
    function getITYCBoat(raceId) {
        var r = races.get(raceId);
        return "?b="+ r.curr.boat.label.replace(" ","_");
    }

    function getITYCFull(baseUrl, raceId)  {
        var r = races.get(raceId);

        if(!r.curr) return "";
        //get needed info
        var twa = r.curr.twa;
        var tws = r.curr.tws;

        //buidl options fields
        var options= "";
        if (r.curr.fullOptions === true) {
            options = "FP";
        } else if (r.curr.options) {
            if (r.curr.options.length == 8) {
                options = "AO";
            } else {
                var opt_sail = "[";
                var opt_perf = "[";
                if (r.curr.options.includes('reach')) opt_sail += "R,";
                if (r.curr.options.includes('light')) opt_sail += "L,";
                if (r.curr.options.includes('heavy')) opt_sail += "H,";
                if (r.curr.options.includes('winch')) opt_perf += "W,";
                if (r.curr.options.includes('foil'))  opt_perf += "F,";
                if (r.curr.options.includes('hull')) opt_perf += "h,";
                if (r.curr.options.includes('magicFurler')) opt_perf += "M,";
                if (r.curr.options.includes('vrtexJacket')) opt_perf += "J,";
                if (r.curr.options.includes('comfortLoungePug')) opt_perf += "C,";
                opt_sail = opt_sail.substring(0,opt_sail.length-1);
                opt_perf = opt_perf.substring(0,opt_perf.length-1);
                if (opt_sail.length != "") opt_sail += "]";
                if (opt_perf.length != "") opt_perf += "]";                
                options = opt_sail + " " + opt_perf;
            }
        }

        //build url
        var url = baseUrl+"&s="+sailNames[r.curr.sail % 10];
        url += "&o="+options;
        url += "&ts="+tws;
        url += "&ta="+twa;

        return url;

    }

    function getITYCFullExtra(baseUrl, raceId)  {
        var r = races.get(raceId);

        if(!r.curr) return "";
        //get needed info boat speed , energy
        var bs = r.curr.speed;
        var se = r.curr.stamina;
        var url = baseUrl+"&bs="+bs;
        url += "&se="+se;
        url += "&th="+drawTheme;
        return url;

    }
    function callITYC(raceId) {
        var baseURL = getITYCBase()+getITYCBoat(raceId);
        var url =  getITYCFull(baseURL,raceId);
        Util.openTab(url, baseURL,cbReuseTab.checked);
    }

    function callPolarAnalysis(rtSite="ityc")
    {
        if (selRace.selectedIndex == -1) {
            alert("Race info not available - please reload VR Offshore");
            return;
        }
        if(rtSite=="ityc")
            callITYC(selRace.value)
        else
            callPolars(selRace.value);
    }

    
    function formatPositionWithMilliSec(lat, lon) {
        var latDMS = Util.toDMS(lat);
        var lonDMS = Util.toDMS(lon);
        var latString = latDMS.g + "°" + Util.pad0(latDMS.m) + "'" + Util.pad0(latDMS.s) + "." + latDMS.cs + '"';
        var lonString = lonDMS.g + "°" + Util.pad0(lonDMS.m) + "'" + Util.pad0(lonDMS.s) + "." + lonDMS.cs + '"';
        return latString + ((latDMS.u == 1) ? "N" : "S") + " - " + lonString + ((lonDMS.u == 1) ? "E" : "W");
    }
    
    String.prototype.remAcc = function() {
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
            '' : /[\/|\s|-]/g,
        };
        var str = this;
        for(var latin in rules) {
            var nonLatin = rules[latin];
            str = str.replace(nonLatin , latin);
        }
        return str;
    }
    String.prototype.remExportAcc = function() {
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
            ' ' : /(\r\n|\n|\r)/g,
            
        };
        var str = this;
        for(var latin in rules) {
            var nonLatin = rules[latin];
            str = str.replace(nonLatin , latin);
        }
        return str;
    }

    function getJSONKey(key) {
        for (acc in rules) {
            if (rules[acc].indexOf(key) > -1) {return acc};
        }
    }

    function replaceSpec(str){
        var regstring = "";
        for (acc in rules) {
            regstring += rules[acc];
        }
        var reg = new RegExp("[" + regstring + "]", "g");
        return str.replace(reg, function(t) {return getJSONKey(t)});
    }

 

    function switchMap(race) {
        initializeMap(race);
        rt.initialize(race.id);    
        races.forEach(function (r) {
            if (r.gdiv) {
                if (r == race) {
                    r.gdiv.style.display = "block";
                } else {
                    r.gdiv.style.display = "none";
                }
            }
        });
    }



function buildlogBookHTML(race) {

    // start, finish blue yellow
    //var pos = new google.maps.LatLng(race.legdata.start.lat, race.legdata.start.lon);
    //Util.formatPosition(race.legdata.end.lat, race.legdata.end.lon)
    
    function makelogBookLine(type,name,id,lat1,lon1,lat2,lon2,status) {

        var bookLine = '<tr>'
        + '<td class="type">'+type+'</td>'
        + '<td class="name">'+name+'</td>'
        + '<td class="id">'+id+'</td>'
        + '<td class="position"> ' + Util.formatPosition(lat1,lon1) + '</td>';

        if(lat2 && lon2) 
            bookLine += '<td class="position">' + Util.formatPosition(lat2,lon2) + '</td>';
        else if(lat2)
            bookLine += '<td class="position"> Radius : '+ lat2 + ' mn </td>';
        else    
            bookLine += '<td class="position"> - </td>';
        
        if(status) 
            bookLine += '<td class="status">' + status + '</td>';
        else
            bookLine += '<td class="status"> - </td>';
        bookLine += '</tr>';
        return bookLine;
    }
    function highlightOptionsAlreadyTaken(opt) {
        if (race.curr && race.curr.options.includes(opt)) return 'style="color:limegreen"';
    }
    function totalCreditsForOptionsAlreadyTaken() {
        let total = 0;
        if (race && race.curr) {
            if (race.curr.options.includes('foil')) total += race.legdata.optionPrices.foil;
            if (race.curr.options.includes('winch')) total += race.legdata.optionPrices.winch;
            if (race.curr.options.includes('hull')) total += race.legdata.optionPrices.hull;
            if (race.curr.options.includes('light')) total += race.legdata.optionPrices.light;
            if (race.curr.options.includes('reach')) total += race.legdata.optionPrices.reach;
            if (race.curr.options.includes('heavy')) total += race.legdata.optionPrices.heavy;
            if (race.curr.options.includes('radio')) total += race.legdata.optionPrices.radio;
            if (race.curr.options.includes('magicFurler')) total += race.legdata.optionPrices.magicFurler;
            if (race.curr.options.includes('comfortLoungePug')) total += race.legdata.optionPrices.comfortLoungePug;
            if (race.curr.options.includes('vrtexJacket')) total += race.legdata.optionPrices.vrtexJacket;
        }
        return total;
    }

    if(!race || !race.legdata) {
        var raceIdentification = '<table id="raceidTable">'
        + '<thead>'
        + '<tr>'
        + '<th colspan = 8>No data available</th>'
        + '</tr>' 
        + '</thead>'
        + '</table>'
        
        document.getElementById("raceBook").innerHTML = raceIdentification;
        return;
    }

    let playerOption = "-";
    if(race.curr && race.curr.options) playerOption = race.curr.options;

    let gfsWinds = '1.0';
    if (race.gfsWinds) gfsWinds = race.gfsWinds;
    else if (race.legdata.fineWinds !== undefined && race.legdata.fineWinds === true) gfsWinds = '0.25';

    let creditsAwardedByPriceLevel = '-';
    if (race && race.curr && race.curr.rank > 0) {
        creditsAwardedByPriceLevel = Math.round(creditsMaxAwardedByPriceLevel[race.curr.priceLevel-1]/(Math.pow(race.curr.rank, 0.4)))
    }

    var raceIdentification = '<table id="raceidTable">'
        + '<thead>'
        + '<tr><td width="142px" class="centered" rowspan="3"><img src="https://static.virtualregatta.com/offshore/leg/' + race.id.replace('.', '_') + '.jpg" style="height:85px;padding: 0px;"></td><th colspan="6" height="40px">Race Details</th></tr>'
        + '<tr><th>Race Name (Id)</th><th>Boat Name</th><th>Wind Model</th><th>VSR Level</th><th>Price</th><th>Category</th></tr>'
        + '<tr><td class="centered">' + race.legdata.name + ' (' + race.id + ')</td><td class="centered">' + race.legdata.boat.name + '</td><td class="centered">GFS ' + gfsWinds + '°</td><td class="centered">VSR' + race.legdata.vsrLevel/*race.legdata.priceLevel*/ + '</td><td class="centered">Cat. ' + race.legdata.priceLevel + '</td><td class="centered">' + determineRankingCategory(playerOption) + '</td></tr>'
        + '</thead>'
        + '</table>'
        + '<table id="raceidTable2">'
        + '<thead>'
        + '<tr>'
        + '<th colspan="15" height="40px">Credits <span style="color:limegreen">(Option équipée)</span></th>'
        + '</tr>' 
        + '<tr>'
        + '<th width="7%">Game Credits</th>'
        + '<th width="7%">Race Credits</th>'
        + '<th width="17%">Current Race Credits <span style="color:tomato">(Total Options)</span></th>'
        + '<th width="6%">Gains</th>'
        + '<th width="6%" ' + highlightOptionsAlreadyTaken('foil') + '>Foils</th>'
        + '<th width="6%" ' + highlightOptionsAlreadyTaken('winch') + '>Winch</th>'
        + '<th width="6%" ' + highlightOptionsAlreadyTaken('hull') + '>Hull</th>'
        + '<th width="6%" ' + highlightOptionsAlreadyTaken('light') + '>Light</th>'
        + '<th width="6%" ' + highlightOptionsAlreadyTaken('reach') + '>Reach</th>'
        + '<th width="6%" ' + highlightOptionsAlreadyTaken('heavy') + '>Heavy</th>'
        + '<th width="6%" ' + highlightOptionsAlreadyTaken('radio') + '>Radio</th>'
        + '<th width="7%" ' + highlightOptionsAlreadyTaken('magicFurler') + '>Magic Furler</th>'
        + '<th width="7%" ' + highlightOptionsAlreadyTaken('comfortLoungePug') + '>Comfort Lounge</th>'
        + '<th width="7%" ' + highlightOptionsAlreadyTaken('vrtexJacket') + '>VRTex Jacket</th>'
        + '</tr>' 
        + '</thead>'
        + '<tbody>'
        + '<tr>'
        + '<td>'+ lbCredits.innerHTML +'</td>'
        + '<td>'+ race.legdata.freeCredits + '</td>';
        if(race.curr && race.curr.credits) raceIdentification += '<td>'+ race.curr.credits + ' <span style="color:tomato">(-' + totalCreditsForOptionsAlreadyTaken() + ')</span></td>';
        else 
            raceIdentification += '<td>??? <span style="color:tomato">(-' + totalCreditsForOptionsAlreadyTaken() + ')</span></td>';
         raceIdentification += '<td>'+ creditsAwardedByPriceLevel + '</td>'
        + '<td>'+ race.legdata.optionPrices.foil + '</td>'
        + '<td>'+ race.legdata.optionPrices.winch + '</td>'
        + '<td>'+ race.legdata.optionPrices.hull + '</td>'
        + '<td>'+ race.legdata.optionPrices.light + '</td>'
        + '<td>'+ race.legdata.optionPrices.reach + '</td>'
        + '<td>'+ race.legdata.optionPrices.heavy + '</td>'
        + '<td>'+ race.legdata.optionPrices.radio + '</td>'
        + '<td>'+ race.legdata.optionPrices.magicFurler + '</td>'
        + '<td>'+ race.legdata.optionPrices.comfortLoungePug + '</td>'
        + '<td>'+ race.legdata.optionPrices.vrtexJacket + '</td>'
        + '</tr>'
        + '</tbody>'
        + '</table>';
        
    var raceStatusHeader = '<tr>'
    + '<th colspan="10" height="40px">Race Stages</th>'
    + '</tr><tr>'
    + '<th title="Type">' + "Type" + '</th>'
    + '<th title="Name">' + "Name" + '</th>'
    + '<th title="Id">' + "Id" + '</th>'
    + '<th title="Position">' + "Position" + '</th>'
    + '<th title="Position2">' + "Position2" + '</th>'
    + '<th>' + "Status" + '</th>';

    raceStatusHeader += '</tr>';

    var raceLine ="";
    
    raceLine += makelogBookLine("🚩 Start",
                                race.legdata.start.name,
                                "Start",
                                race.legdata.start.lat,race.legdata.start.lon,
                                null,null,
                                "Date : "+ formatDateUTC(race.legdata.start.date, 1) );

    if(race.legdata.checkpoints)
    {
        for (var i = 0; i < race.legdata.checkpoints.length; i++) {
            var cp = race.legdata.checkpoints[i];
            var cp_name = "<i>Invisible</i>";
            if (cp.display != "none") cp_name = cp.display;  
            
            cp_name = cp_name.charAt(0).toUpperCase() + cp_name.slice(1);
            if (cp_name == 'Buoy') cp_name = '🏳️ ' + cp_name;
            var g_passed = "";
            if (race.gatecnt && race.gatecnt[cp.group - 1]) {
                g_passed = '<span style="color:#228B22">Passed</span>';
            } // mark/gate passed - semi transparent

            raceLine += makelogBookLine(cp_name,
                                        cp.name,
                                        cp.group + "." + cp.id,
                                        cp.start.lat,cp.start.lon,
                                        cp.end?cp.end.lat:null,cp.end?cp.end.lon:null ,
                                        g_passed);  
        }
    }
    

    raceLine += makelogBookLine("🏁 End",
                                race.legdata.end.name,
                                "End",
                                race.legdata.end.lat,race.legdata.end.lon,
                                race.legdata.end.radius?race.legdata.end.radius:null,null,
                                "Date : "+ formatDateUTC(race.legdata.end.date, 1) );
 
    var raceBookTable = '<table id="raceStatusTable">'
    + '<thead>'
    + raceStatusHeader
    + '</thead>'
    + '<tbody>'
    + raceLine
    + '</tbody>'
    + '</table>';

    var raceIceLimitsTable = ""; 
    if (race.legdata.ice_limits) {
        var iceData = race.legdata.ice_limits.south;
        if(!(iceData.length == 5 
            && iceData[0].lat == -90 && iceData[0].lon == -180
            && iceData[2].lat == -90 && iceData[2].lon == 0
            && iceData[4].lat == -90 && iceData[4].lon == 180
            )) //is not a dummy ice limits ;)
        {

            var raceIceLimitHeader = '<tr>'
            + '<th title="Ice Limites" colspan="3">' + "Limites des glaces" + '</th>'
            + '</tr>'
            + '<tr>'
            + '<th title="Ice Limites">' + "Section" + '</th>'
            + '<th title="Position">' + "Position" + '</th>'
            + '<th title="Position2">' + "Position2" + '</th>'
            
            raceIceLimitHeader += '</tr>';

            var iceLimitLine = '<tr>'
                + '<td class="type">Section 1</td>'
                + '<td class="position">'+Util.formatPosition(iceData[0].lat,iceData[0].lon)+'</td>'
                + '<td class="position">'+Util.formatPosition(iceData[1].lat,iceData[1].lon)+'</td>'
                + '</tr>';


            for (var i = 1; i < iceData.length; i++) {
                iceLimitLine += '<tr>'
                + '<td class="type">Section '+(i+1)+'</td>'
                + '<td class="position">'+Util.formatPosition(iceData[i-1].lat, iceData[i-1].lon)+'</td>'
                + '<td class="position">'+Util.formatPosition(iceData[i].lat, iceData[i].lon)+'</td>'
                + '</tr>';

            }
            
 
            raceIceLimitsTable = '<table id="raceIceLimitTable">'
            + '<thead>'
            + raceIceLimitHeader
            + '</thead>'
            + '<tbody>'
            + iceLimitLine
            + '</tbody>'
            + '</table>';
            


        }
    }

    
    var racerestrictedZonesTable = ""; 
    if (race.legdata.restrictedZones && race.legdata.restrictedZones.length != 0) {
            var racerestrictedZonesHeader = '<tr>'
            + '<th title="Restricted Zones" colspan="2" height="40px">' + "Zones interdites" + '</th>'
            + '</tr>'
            + '<tr>'
            + '<th title="Name">' + "Nom" + '</th>'
            + '<th title="Position">' + "Position" + '</th>'
            
            racerestrictedZonesHeader += '</tr>';

            var racerestrictedZonesLine = '';
            race.legdata.restrictedZones.forEach(restrictedZone => {

                racerestrictedZonesLine += '<tr>'
                        + '<td class="name" rowspan="'+  restrictedZone.vertices.length +'">'+restrictedZone.name +'</td>' 
                
                for (var i = 0; i < restrictedZone.vertices.length; i++) {
                    racerestrictedZonesLine += '<td class="position">'+Util.formatPosition(restrictedZone.vertices[i].lat,restrictedZone.vertices[i].lon)+'</td>'  
                        + '</tr>'; 

                }            
            });
 
            racerestrictedZonesTable = '<table id="restrictedZonesTable">'
            + '<thead>'
            + racerestrictedZonesHeader
            + '</thead>'
            + '<tbody>'
            + racerestrictedZonesLine
            + '</tbody>'
            + '</table>';
            
    }

    document.getElementById("raceBook").innerHTML = raceIdentification+raceBookTable+racerestrictedZonesTable+raceIceLimitsTable;


}
async function initializeMap(race) {
        if (!race || !race.legdata) return; // no legdata yet;

        updateUserConfig();
        lMap.initialize(race,raceFleetMap);
        lMap.updateMapWaypoints(race); 
    }


    function updateCompas (r) {
        // Test if Compas Popup is already open?
        if (typeof(CompasWin) === "object") {
            var sailInfo = sailNames[r.curr.sail % 10];
            var sailCompasInfo = sailInfo;
    
            var isAutoSail = r.curr.hasPermanentAutoSails || (r.curr.tsEndOfAutoSail &&(r.curr.tsEndOfAutoSail - r.curr.lastCalcDate) > 0);
            var autoSailTime = r.curr.hasPermanentAutoSails?'∞':Util.formatHMS(r.curr.tsEndOfAutoSail - r.curr.lastCalcDate);
            if (isAutoSail) {
                sailInfo = sailInfo + " (A " + autoSailTime + ")";
                sailCompasInfo = sailCompasInfo + "<BR><font style='font-size: 10px;'>(A " + autoSailTime + ")</font>";
            } else {
                sailInfo = sailInfo + " (Man)";
                sailCompasInfo = sailCompasInfo + "<BR><font style='font-size: 10px;'>(Man)</font>";
            }
    
            // Remember when this message was received ...
            if (! r.curr.receivedTS) {
                r.curr.receivedTS = new Date();
            }
            // ... so we can tell if lastCalcDate was outdated (by more than 15min) already when we received it.
            var lastCalcDelta = r.curr.receivedTS - r.curr.lastCalcDate;
            
            var isTWAMode = r.curr.isRegulated;
            
            var twaFG = (r.curr.twa < 0) ? "red" : "green";
            var arrowFG = (r.curr.twa < 0) ? "red" : "lime";
            var twaBold = isTWAMode ? "bold;" : "normal";
         
            var hdgFG = isTWAMode ? "black" : "blue";
            var hdgBold = isTWAMode ? "normal;" : "bold;";
            if(drawTheme =='dark')
                hdgFG = isTWAMode ? "white" : "darkcyan";
            
            var speedFG = (r.curr.aground ?'red':'');

            var BoatLabel = r.curr.boat.label;
            var BoatType = r.curr.boat.type;
            if(r.curr.distanceFromStart && r.curr.distanceToEnd) {
              r.dfs = r.curr.distanceFromStart;
              r.dtf = r.curr.distanceToEnd;
              r.dtfC = Util.gcDistance(r.curr.pos, r.legdata.end);
              if (!r.dtf || r.dtf == "null") {
                  r.dtf = r.dtfC;
              }
              // console.log("DFS/DTS: "+Util.roundTo(r.dfs, 1)+","+Util.roundTo(r.dtf, 1));
            }
    
            // List Checkpoints Coordinates & Status
            var gate = "";
            gate = "<table>";
            gate = gate + "<tr>";
            gate = gate + "<th>#</th><th>Type</th><th>Name</th><th>Side</th><th>Position (S/E)</th><th>Status</th>";
            gate = gate + "</tr>";
            for (var i = 0; i < r.legdata.checkpoints.length; i++) {
              var cp = r.legdata.checkpoints[i];
              var cp_name = "invsible";
              if (cp.display != "none") cp_name = cp.display;
    
              if (cp.display == "none" ||  (race.gatecnt && race.gatecnt[cp.group - 1])) {
                continue;
              }
    
              var position_s = Util.formatPosition(cp.start.lat, cp.start.lon);
              var position_e = Util.formatPosition(cp.end.lat, cp.end.lon);
    
              var g_passed = "<img class='icon' src='./img/Status_KO.svg'/>";
              if (r.gatecnt[cp.group - 1]) {
                g_passed = "<img class='icon' src='./img/Status_OK.svg'/>";
              }
    
              var side_s =  cp.side ;
              var side_e = (cp.side == "stbd")?"port":"stbd";
              gate = gate + "<tr><td style='vertical-align: top;'>"+ cp.group + "</td><td style='vertical-align: top;'>" + cp_name + "</td><td style='vertical-align: top;'>" + cp.name + "</td><td style='vertical-align: top;" + ((cp.side == "stbd")?"color: red;":"color:green;") + "'>" + side_s + "</td><td style='text-align: left; line-height: 10px;'>S: " + Util.formatPosition(cp.start.lat, cp.start.lon) + "<br>E: " + Util.formatPosition(cp.end.lat, cp.end.lon) + "</td>";
    
              gate = gate + "<td 'vertical-align: middle; text-align:center;'>" + g_passed + "</td></tr>";
            }
            gate = gate + "</table>";
    
            CompasWin.document.title = "Compas / "+r.name;
            CompasWin.document.getElementById("hdg_v").innerHTML = Util.roundTo(r.curr.heading, 3)+'&deg;';
            CompasWin.document.getElementById("hdg_v").style.fontWeight = hdgBold;
            CompasWin.document.getElementById("twa_v").innerHTML = Util.roundTo(Math.abs(r.curr.twa), 3)+'&deg;';
            CompasWin.document.getElementById("twa_v").style.color = twaFG;
            CompasWin.document.getElementById("twa_v").style.fontWeight = twaBold;
            
            CompasWin.document.getElementById("twd_v").innerHTML = Util.roundTo(r.curr.twd, 3)+'&deg;';
            CompasWin.document.getElementById("sail_v").innerHTML = sailCompasInfo;
            CompasWin.document.getElementById("tws_v").innerHTML = Util.roundTo(r.curr.tws, 2)+'kts';
            CompasWin.document.getElementById("sog_v").innerHTML = Util.roundTo(r.curr.speed, 2)+'kts';
            CompasWin.document.getElementById("sog_v").backgroundColor = speedFG;
            CompasWin.document.getElementById("boat_v").innerHTML = BoatLabel+' ('+BoatType+')';
            CompasWin.document.getElementById("updt_v").innerHTML = formatDate(r.curr.lastCalcDate);
            // ... so we can tell if lastCalcDate was outdated (by more than 15min) already when we received it.
            var lastCalcDelta = r.curr.receivedTS - r.curr.lastCalcDate;
           
            CompasWin.document.getElementById("updt_v").style.color = (lastCalcDelta > 900000)?'red':'';
            
            // Mettre à jour la rosace....
            CompasWin.document.querySelector(".arrow").style = 'border-color:'+arrowFG+' transparent transparent transparent;';
            CompasWin.document.querySelector(".arrow").style.transform = 'translate(-10px, 0px) rotate('+r.curr.twd+'deg)';
            CompasWin.document.querySelector(".boat").style.transform = 'translate(47.5px, 47.5px) rotate('+r.curr.heading+'deg)';
    
            CompasWin.document.getElementById("race_v").innerHTML = r.name;
            CompasWin.document.getElementById("pos_v").innerHTML = Util.formatPosition(r.curr.pos.lat, r.curr.pos.lon);
            CompasWin.document.getElementById("rank_v").innerHTML = (r.curr.rank ? r.curr.rank : "-");
            CompasWin.document.getElementById("startpos_v").innerHTML = Util.formatPosition(r.legdata.start.lat, r.legdata.start.lon);
            CompasWin.document.getElementById("endpos_v").innerHTML = Util.formatPosition(r.legdata.end.lat, r.legdata.end.lon);
            CompasWin.document.getElementById("dist_v").innerHTML = Util.roundTo(r.dfs, 1)+" nm / "+Util.roundTo(r.dtf, 1)+" nm";
            CompasWin.document.getElementById("gate_v").innerHTML = (gate ? gate : "-");
            
            
        }
    }
    
    function callCompass (raceId, userId) {
        var baseURL = "compass.html";
        var r = races.get(raceId);
        var uinfo;
    
        if (userId) {

            uinfo = raceFleetMap.get(raceId).uinfo[userId];
            if (uinfo === undefined) {
                alert("Can't find record for user id " + userId);
                return;
            }
        }
    
        var pos = r.curr.pos;
        if (uinfo) pos = uinfo.pos;
        var url = baseURL;
        var tinfo = "compass";
        CompasWin = Util.PositionOpenPopup(url, cbReuseTab.checked ? tinfo : "_blank", 400, 310);

        if(CompasWin)
        {  
            var race = races.get(raceId);
            new Promise((resolve) => {
                setTimeout(() => resolve(updateCompas (race)), 3000);
              });

        }
    }

    async function updateUserConfig(e)
    {
        var value = (cbFriends.checked?1:0) 
        + (cbTeam.checked?2:0)
        + (cbOpponents.checked?4:0)
        + (cbTop.checked?8:0)
        + (cbCertified.checked?16:0)
        + (cbReals.checked?32:0)
        + (cbSponsors.checked?64:0)
        + (cbSelect.checked?128:0)
        + (cbInRace.checked?256:0)
        + (cbTrackinfos.checked?512:0)
    //    + (markersShownState?1024:0);
        + (cbLocalTime.checked?2048:0);
        
        
        
        lMap.set_displayFilter(value);
        lMap.updateMapFleet(races.get(selRace.value),raceFleetMap);
        rt.set_displayFilter(value);

        //save user filter ( we have  to do it here due to label format)
        await saveLocal('cb_sel_friends',cbFriends.checked===true);
        await saveLocal('cb_sel_team',cbTeam.checked===true);
        await saveLocal('cb_sel_opponents',cbOpponents.checked===true);
        await saveLocal('cb_sel_top',cbTop.checked===true);
        await saveLocal('cb_sel_certified',cbCertified.checked===true);
        await saveLocal('cb_sel_reals',cbReals.checked===true);
        await saveLocal('cb_sel_sponsors',cbSponsors.checked===true);
        await saveLocal('cb_sel_selected',cbSelect.checked===true);
        await saveLocal('cb_sel_inrace',cbInRace.checked===true);
        
         
        
        
    }

    const toPromise = (callback) => {
        const promise = new Promise((resolve, reject) => {
            try {
                callback(resolve, reject);
            }
            catch (err) {
                reject(err);
            }
        });
        return promise;
    }
    const saveLocal = (k,v) => {
        const key = k;
        const value = { val: v };
    
        return toPromise((resolve, reject) => {
            chrome.storage.local.set({ [key]: value }, () => {
                if (chrome.runtime.lastError)
                    reject(chrome.runtime.lastError);
    
                resolve(value);
            });
        });
    }

    const getLocal = (k) => {
        const key = k;

        return toPromise((resolve, reject) => {
            chrome.storage.local.get([key], (result) => {
                if (chrome.runtime.lastError)
                    reject(chrome.runtime.lastError);

                const researches = result[key]?((result[key].val!==undefined)?result[key].val:undefined):undefined ;
                resolve(researches);
            });
        });
    }

    async function saveOption(e) {
        await saveLocal("cb_" + this.id,this.checked);
    }
    async function saveOptionN(e) {
        await saveLocal(this.id,this.value);
    }
    async function saveOptionNRid(e) { 
        if(selRace.value !=0) 
            await saveLocal(this.id + selRace.value,this.value);
           
    }
    async function getOption(name,def) {
        
        var z = await getLocal("cb_" + name,def);
        if (z === undefined && def !== undefined) {
            z = def;
            await saveLocal("cb_" + name,def);
        }
        if(z !== undefined) {
            var checkBox = document.getElementById(name);
            if(checkBox) 
            {
                checkBox.checked = (z === true);
                var event = new Event('change');
                checkBox.dispatchEvent(event);
            }
        }
        
    }

    async function getOptionNG(name,def) {
        var z = await getLocal(name,def);
        if (z === undefined && def !== undefined) {
            z = def;
            await saveLocal(name,def);
        }
        if(z !== undefined) {
            var inputBox = document.getElementById(name);
                if(inputBox) 
                {
                    inputBox.value = z;
                    var event = new Event('change');
                    inputBox.dispatchEvent(event);
                }
        }
        return z;
    }


    async function getOptionN(name,def) {
        return await getOptionNG(name,def);
    }

    async function getOptionNRid(name,def,rid) {
        var z = await getLocal(name + rid,def);
        if (z === undefined && def !== undefined) {
            z = def;
            await saveLocal(name,def);
        }
        if(z !== undefined) {
            var inputBox = document.getElementById(name);
                if(inputBox) 
                {
                    inputBox.value = z;
                    var event = new Event('change');
                    inputBox.dispatchEvent(event);
                }
        }
        return z;
    }
    async function readOptions() {
//    await chrome.storage.local.clear();
        await getOption("auto_router",true);
        await getOptionN("sel_router","zezo");
        await getOptionN("sel_Seperator","sep_1");
        
        await getOption("reuse_tab",true);
        await getOption("local_time",true);
        await getOption("nmea_output",false);
        await getOption("2digits",true);
        await getOption("color_theme",true);
        await getOption("track_infos",false);
        await getOption("with_LastCommand",false);
        await getOption("vrzenPositionFormat",false);
        await getOption("showBVMGSpeed",false);
        await getOption("hideCommandsLines", false);
        await getOption("abbreviatedOption",true);
        await getOption("fleet_team",true);
        await getOption("fleet_rank",true);
        await getOption("fleet_racetime",true);
        await getOption("fleet_speed", true);
        await getOption("fleet_dtu" ,true);
        await getOption("fleet_dtf" ,true);
        await getOption("fleet_twd" ,true);
        await getOption("fleet_tws" ,true);
        await getOption("fleet_twa" ,true);
        await getOption("fleet_hdg" ,true);
        await getOption("fleet_vmg" ,true);
        await getOption("fleet_sail",true );
        await getOption("fleet_factor",true );
        await getOption("fleet_foils" ,true);
        await getOption("fleet_position",true);
        await getOption("fleet_options",true );
        await getOption("fleet_state",true );
        await getOption("ITYC_record",true);
        await getOption("auto_clean",true);
        await getOptionN("auto_cleanInterval",5);

        await getOption("racelog_position", true);
        await getOption("racelog_stamina", true);
        await getOption("racelog_dtl", true);
        await getOption("racelog_dtf", true);
        await getOption("racelog_deltaDistance", true);
        await getOption("racelog_deltaTime", true);
        await getOption("racelog_rank", true);
        await getOption("racelog_factor", true);
        await getOption("racelog_foils", true);
        

        await getOption("sel_friends",true);
        await getOption("sel_team",true);
        await getOption("sel_opponents",true);
        await getOption("sel_top",true);
        await getOption("sel_certified");
        await getOption("sel_reals",false);
        await getOption("sel_sponsors");
        await getOption("sel_selected",true);
        await getOption("sel_inrace",true);
        await getOption("sel_showMarkersLmap",false);
        await getOption("FullScreen_Game",false);

        await getOption("sel_polarSite",1);
    
        await getOptionN("fullScreen_Size",80);

        let projectionColor = await getOptionN("sel_projectionColorLmap","#b86dff");
        lMap.setProjectionLineColor(projectionColor);

        projectionColor = await getOptionN("sel_borderColorLmap","#0000FF");
        EX.setBorderColor(projectionColor);

        projectionColor = await getOptionN("projectionLine_Size",20);
        lMap.setProjectionLineSize(projectionColor);

        tracksState = await getOption("sel_showTracksLmap",true);
        
        switchTheme();
        lang = await getLocal('dash_lang');
        if (lang == undefined) {
            lang = "fr";
            saveLocal("dash_lang",lang);
        }
        translateDash();

        await DM.getTeamList();
        await DM.getPlayerList();
        await DM.getRaceList();
        await DM.getItycPolarHash();
        
        updateUserConfig();
    }

    function addEventListenersToRemoveSelectedBoatButtons() {
        document.querySelectorAll('.removeSelectedBoat').forEach(function(e) {
          e.addEventListener('click', function() {
            const boatId = this.getAttribute('data-id');
            removeSelectedBoatFromFleet(boatId);
          });
        });
    }
    function removeSelectedBoatFromFleet(boatId) {
        //const targetedBoat = Object.values(raceFleetMap.uinfo).find(uinfo => uinfo === boatId);
        var race = races.get(selRace.value);
        var fleet = raceFleetMap.get(race.id);
        fleet.uinfo[boatId].choice = false;
        updateFleetHTML(raceFleetMap.get(selRace.value));
    }

    function addEventListenersToSelectedLine() {
        document.querySelectorAll("tr.hovred").forEach(function(row) {
            row.addEventListener("click", function() {
                row.classList.add("selectedLine");
                var siblings = Array.from(row.parentNode.children).filter(function(child) {
                    return child !== row && child.classList.contains("hovred");
                });
                siblings.forEach(function(sibling) {
                    sibling.classList.remove("selectedLine");
                });
            });
        });
    }

    function addConfigListeners() {
 

        document.getElementById("auto_router").addEventListener("change", saveOption);
        document.getElementById("sel_router").addEventListener("change", saveOptionN);
        document.getElementById("reuse_tab").addEventListener("change", saveOption);
        document.getElementById("local_time").addEventListener("change", saveOption);
        document.getElementById("nmea_output").addEventListener("change", saveOption);
        document.getElementById("2digits").addEventListener("change", saveOption);

        document.getElementById("sel_friends").addEventListener("change", updateUserConfig);
        document.getElementById("sel_team").addEventListener("change", updateUserConfig);
        document.getElementById("sel_opponents").addEventListener("change", updateUserConfig);
        document.getElementById("sel_top").addEventListener("change", updateUserConfig);
        document.getElementById("sel_certified").addEventListener("change", updateUserConfig);
        document.getElementById("sel_reals").addEventListener("change", updateUserConfig);
        document.getElementById("sel_sponsors").addEventListener("change", updateUserConfig);
        document.getElementById("sel_selected").addEventListener("change", updateUserConfig);
        document.getElementById("sel_inrace").addEventListener("change", updateUserConfig);
        document.getElementById("color_theme").addEventListener("change", saveOption);
        document.getElementById("color_theme").addEventListener("change", switchTheme);
        document.getElementById("track_infos").addEventListener("change", saveOption);
        document.getElementById("track_infos").addEventListener("change", updateUserConfig);
        document.getElementById("with_LastCommand").addEventListener("change", saveOption);
        document.getElementById("with_LastCommand").addEventListener("change", makeRaceStatusHTML);
        document.getElementById("vrzenPositionFormat").addEventListener("change", saveOption);
        document.getElementById("showBVMGSpeed").addEventListener("change", saveOption);
        document.getElementById("hideCommandsLines").addEventListener("change", saveOption);
        document.getElementById("hideCommandsLines").addEventListener("change", updateToggleRaceLogCommandsLines);
        document.getElementById("abbreviatedOption").addEventListener("change", saveOption);
        document.getElementById("fleet_team").addEventListener("change", saveOption);
        document.getElementById("fleet_rank").addEventListener("change", saveOption);
        document.getElementById("fleet_racetime").addEventListener("change", saveOption);
        document.getElementById("fleet_speed").addEventListener("change", saveOption);
        document.getElementById("fleet_dtu" ).addEventListener("change", saveOption);
        document.getElementById("fleet_dtf" ).addEventListener("change", saveOption);
        document.getElementById("fleet_twd" ).addEventListener("change", saveOption);
        document.getElementById("fleet_tws" ).addEventListener("change", saveOption);
        document.getElementById("fleet_twa" ).addEventListener("change", saveOption);
        document.getElementById("fleet_hdg" ).addEventListener("change", saveOption);
        document.getElementById("fleet_vmg" ).addEventListener("change", saveOption);
        document.getElementById("fleet_sail" ).addEventListener("change", saveOption);
        document.getElementById("fleet_factor" ).addEventListener("change", saveOption);
        document.getElementById("fleet_foils" ).addEventListener("change", saveOption);
        document.getElementById("fleet_position" ).addEventListener("change", saveOption);
        document.getElementById("fleet_options" ).addEventListener("change", saveOption);
        document.getElementById("fleet_state" ).addEventListener("change", saveOption);
        document.getElementById("ITYC_record" ).addEventListener("change", saveOption);
        document.getElementById("auto_clean" ).addEventListener("change", saveOption);
        document.getElementById("auto_cleanInterval" ).addEventListener("change", saveOptionN);   
        document.getElementById("sel_Seperator").addEventListener("change", selectSeparator);
        document.getElementById("sailRankRaceId" ).addEventListener("change", saveOptionNRid);   

        document.getElementById("racelog_position").addEventListener("change", saveOption);
        document.getElementById("racelog_stamina").addEventListener("change", saveOption);
        document.getElementById("racelog_dtl").addEventListener("change", saveOption);
        document.getElementById("racelog_dtf").addEventListener("change", saveOption);
        document.getElementById("racelog_deltaDistance").addEventListener("change", saveOption);
        document.getElementById("racelog_deltaTime").addEventListener("change", saveOption);
        document.getElementById("racelog_rank").addEventListener("change", saveOption);
        document.getElementById("racelog_factor").addEventListener("change", saveOption);
        document.getElementById("racelog_foils").addEventListener("change", saveOption);  
        document.getElementById("sel_borderColorLmap").addEventListener("change", saveOptionN);
        document.getElementById("sel_projectionColorLmap").addEventListener("change", saveOptionN);
        document.getElementById("projectionLine_Size" ).addEventListener("change", saveOptionN);  
        document.getElementById("sel_polarSite").addEventListener("change", saveOptionN); 
        document.getElementById("fullScreen_Size").addEventListener("change", saveOptionN);
        document.getElementById("FullScreen_Game" ).addEventListener("change", saveOption);
    }

    function switchAddOnMode()
    {
        
        var manifest = chrome.runtime.getManifest();
//        comPort = chrome.tabs.connect(tabId,{name: "DashPortCom"+manifest.version});
//        comPort.postMessage({order: "addOnMode",mode:"pirate",theme:drawTheme});
//        makeIntegratedHTML();
           
    }

    function switchTheme()
    {

        if(document.getElementById("color_theme").checked)
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
        drawTheme = document.documentElement.getAttribute("data-theme");
        if(currentRaceId !=0)
            changeRace(currentRaceId);
        
        makeRaceStatusHTML();     
    }

    var initialize = async function () {
        var manifest = chrome.runtime.getManifest();
        document.getElementById("lb_version").innerHTML = manifest.version;

        lbBoatname = document.getElementById("lb_boatname");
        lbCredits = document.getElementById("lb_credits");
        lbTeamname = document.getElementById("lb_teamname");
        selRace = document.getElementById("sel_race");
        lbCycle = document.getElementById("lb_cycle");
        selNmeaport = document.getElementById("sel_nmeaport");
        cbFriends = document.getElementById("sel_friends");
        cbOpponents = document.getElementById("sel_opponents");
        cbCertified = document.getElementById("sel_certified");
        cbTeam = document.getElementById("sel_team");
        cbTop = document.getElementById("sel_top");
        cbReals = document.getElementById("sel_reals");
        cbSponsors = document.getElementById("sel_sponsors");
        cbInRace = document.getElementById("sel_inrace");
        cbSelect = document.getElementById("sel_selected");        
        cbRouter = document.getElementById("auto_router");
        cbReuseTab = document.getElementById("reuse_tab");
        cbLocalTime = document.getElementById("local_time");
        cbNMEAOutput = document.getElementById("nmea_output");
        cbTrackinfos = document.getElementById("track_infos");
        cbWithLastCmd = document.getElementById("with_LastCommand");
        
        divRaceStatus = document.getElementById("raceStatus");
        divFriendList = document.getElementById("friendList");
        divRecordLog = document.getElementById("recordlog");
        makeTableHTMLProcess();
        cbRawLog = document.getElementById("cb_rawlog");
        divRawLog = document.getElementById("rawlog");
        cb2digits = document.getElementById("2digits");
        
        nf.initialize(lang);

        

        initRaces();
        var z = await getLocal('polars');
        if (z !== undefined) {
            var polarTable =  z.split("/**/");
            polarTable.shift();
            polarTable.forEach(function (polar) {
                var polarData = JSON.parse(polar);
                polars[polarData._id] = polarData;
            });
        }
        
        z = await getLocal('stamina');
        if (z !== undefined) {
            if (z !== undefined) {
                paramStamina = JSON.parse(z);
            }
        }
          chrome.storage.local.get(['stamina'], function(result) {
            if (result.key !== undefined) {
                paramStamina = JSON.parse(result.key.v);
            }
          });


        selNmeaport.addEventListener("change", function (e) {
            console.log("Setting proxyPort = " +  selNmeaport.value); 
            NMEA.settings.proxyPort = selNmeaport.value;
        });
        
        cbNMEAOutput.addEventListener("change", function (e) {
            if (cbNMEAOutput.checked) {
                console.log("Starting NMEA");
                NMEA.setActiveRace(selRace.value);
                NMEA.start(races, raceFleetMap, isDisplayEnabled);
            } else {
                console.log("Stopping NMEA");
                NMEA.stop();
            }
        });
        await EX.initialize();
        

        drawTheme = document.documentElement.getAttribute("data-theme");
        switchAddOnMode();
        display_selbox("hidden");

       // var t = await chrome.storage.local.get();
       // console.log(t);
   }

    var callRouter = function (raceId, userId = currentUserId, auto = false,rtType="zezo") {
        var beta = false;

        if (selRace.selectedIndex == -1) {
            alert("Race info not available - please reload VR Offshore");
            return;
        }

        if (typeof raceId === "object") { // button event
            raceId = selRace.value;
            beta = selRace.options[selRace.selectedIndex].betaflag;
        } else { // new tab
            var race = selRace.options[selRace.selectedIndex];
            if (race && race.value == raceId) {
                beta = race.betaflag;
            }
        }
        var now = new Date();
        var currRace = races.get(raceId).curr;
        if (!races.get(raceId)) {
            alert("Unsupported race #" + raceId);
        } else if (currRace === undefined) {
            alert("No position received yet. Please retry later.");
        } else if((now - currRace.lastCalcDate) > 750000) {
                console.log("position too old for auto routing?");    
        } else
        {
            if(rtType=="zezo") {
                if (races.get(raceId).url === undefined) 
                    alert("Unsupported race, no router support yet.");
                else
                    callRouterZezo(raceId, userId, beta, auto);
            } else 
                callRouterVRZ(raceId,userId);
        }
    }

    function reInitUI(newId) {
        if (currentUserId != undefined && currentUserId != newId) {
            // Re-initialize statistics
            disableRaces();
            races.forEach(function (race) {
                race.curr = undefined;
                race.prev = undefined;
                race.lastCommand = undefined;
                race.rank = undefined;
                race.dtl = undefined;
                race.lMap = undefined;
            });
            makeRaceStatusHTML();
            makeTableHTMLProcess();
            updateFleetHTML();
            buildlogBookHTML();
        };
    }

    


    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    var lastRaceIdReceived = undefined;
    async function handleBoatInfo (requestData, message)  {
        var retVal = false;
        if (message) {
            if (cbRawLog.checked) {
                divRawLog.innerHTML = divRawLog.innerHTML + "\n" + "<<< " + JSON.stringify(message);
            }
            try {
                if (message.leg) {
                    if (message.bs && (! currentUserId)) {
                        // Don't overwrite currentUserId if it's defined.
                        // When the user changes boats, we either receive an account message, or Dashboard was restartet.
                        currentUserId = message.bs._id.user_id;
                        currentUserName = message.bs.displayName;
                        lbBoatname.innerHTML = message.bs.displayName;
                        lbCredits.innerHTML = message.bs.currency1;
                        //todo save vsr rank                
                        lMap.set_currentId(currentUserId);
                        rt.set_currentId(currentUserId);
                    
                    }
                    await handleLegInfo(message.leg);
                }
                if (message.bs) {
                    var raceId = getRaceLegId(message.bs._id);
                    lastRaceIdReceived = message.bs._id;

                    var race = races.get(raceId);
                    if (!currentUserId &&  message.bs.credits) { // it s the connected player! //credits value is only available for the current user
                        //dashboard has been start with race openned, do full init
                        currentUserId = message.bs._id.user_id;
                        currentUserName = message.bs.displayName;
                        lbBoatname.innerHTML = message.bs.displayName;
                        if(!message.leg && race) {
                            var legdata = await DM.getLegInfo(race);
                            if(legdata) {
                                message.leg = legdata; //to fake isFirstBoatInfo
                                race.legdata = legdata; 
                            } 
                        }
                        //cleaning map infos to ensure correct redraw at race switch
                        var previousRace = races.get(currentRaceId);
                        if(previousRace)
                        {
                            lMap.cleanMap(previousRace);
                            if(previousRace.gDiv) delete previousRace.gdiv;    
                        }
                        initializeMap(race);
                                       
                        lMap.set_currentId(currentUserId);
                        rt.set_currentId(currentUserId);
                        await DM.getTeamList();
                        await DM.getPlayerList();
                        await DM.getRaceList(); 
                        await DM.getItycPolarHash();
                        await DM.getRaceOptionsList(raceId);
                        if(!race.optITYCStatus) race.optITYCStatus = false;
                         
                        await DM.initRaceLogInfos(raceId);
                        race.recordedData =  DM.rebuildRecordedData(raceId);
                        if (cbNMEAOutput.checked) {
                            NMEA.setActiveRace(selRace.value);
                            NMEA.stop();
                            NMEA.start(races, raceFleetMap, isDisplayEnabled);
                        }
                    }
                            
                    if (currentUserId ==  message.bs._id.user_id) {
                        var isFirstBoatInfo =  (message.leg != undefined);
                        handleOwnBoatInfo(message.bs, isFirstBoatInfo);
                        retVal = true;
                    } else {
                        await handleFleetBoatInfo(message.bs);
                    }
                    if(race && race.curr) welcomePage = false;
                }
                if (message.track) {
                    if (message.track._id.user_id == currentUserId) {
                        handleOwnTrackInfo(message.track);
                    } else {
                        if (message.bs) {
                            mergeBoatTrackInfo(raceId, message.bs._id.user_id, message.track);
                            lMap.updateMapFleet(race,raceFleetMap);
                        }
                        // Ignore track info.
                        // There is currently no function to update a single competitor track.
                    }
                }
                if (message.ba) {
                    handleBoatActions(message.ba);
                }

            } catch (e) {
                console.log(e + " at " + e.stack);
            }
        }
        return retVal;
    }

    async function handleFleet (requestData, message) {
        if (message) {
            if (cbRawLog.checked) {
                divRawLog.innerHTML = divRawLog.innerHTML + "\n" + "<<< " + JSON.stringify(message);
            }
            try {
                var raceId = getRaceLegId(requestData);
                var race = races.get(raceId);

                updateFleet(raceId, "fleet", message);

                var idx = message.length;
                for (var i = 0; i< idx; i++) {
                    var playerData = Object.create(DM.playerModel);
                    playerData.playerId = message[i].userId;
                    playerData.displayName = message[i].displayName;
                    DM.addPlayerInfo(playerData) ;
                }
                DM.makePlayerTable();  
                await DM.savePlayerList();

                updateFleetHTML(raceFleetMap.get(selRace.value));
                lMap.updateMapFleet(race,raceFleetMap);
                rt.updateFleet(race,raceFleetMap);
 //               makeIntegratedHTML();

            } catch (e) {
                console.log(e + " at " + e.stack);
            }
        }
    }

    async function handleLegRank (requestData, message) {        
        if (message) {
            if (cbRawLog.checked) {
                divRawLog.innerHTML = divRawLog.innerHTML + "\n" + "<<< " + JSON.stringify(message);
            }
            try {
                var raceId = getRaceLegId(requestData);
                //var message = JSON.parse(response.body).res;                
                var race = races.get(raceId);
                var raceData = DM.getRaceInfos(race.id);
                if(!raceData)
                {
                    raceData = Object.create(DM.raceInfosModel);
                    raceData.legId =race.id;
                    raceData.legName = race.legName;
                    raceData.name = race.name;
                    DM.addRaceInfo(raceData) ;
                    DM.makeRaceTable();  
                    await DM.saveRaceList();
                }


                if(0==requestData.partition) 
                {
                    var lastCalcDate="-";
                    if(race.curr) lastCalcDate = race.curr.lastCalcDate;
                    var fleet = raceFleetMap.get(race.id);

                    if(document.getElementById("ITYC_record").checked) 
                        tr.initMessage("rank",race.id,race.legName,currentUserId,raceData.raceType);   
                
                    var idx = message.rank.length;
                    for (var i = 0; i< idx; i++) {
                        var id = message.rank[i]._id;
                        if(document.getElementById("ITYC_record").checked) 
                        {
                            var playerData = Object.create(tr.rankInfosModel);
                            playerData.playerId = id;
                            playerData.displayName  = message.rank[i].displayName;
                            playerData.rank  = message.rank[i].rank;
                            playerData.distance  = message.rank[i].distance;
                            playerData.lastCalcDate  = lastCalcDate;
                            tr.addInfoRanking(id,playerData);
                        }
                        if(fleet && fleet.uinfo && fleet.uinfo[id])fleet.uinfo[id].rank =  message.rank[i].rank;
                    }
                    if(document.getElementById("ITYC_record").checked)
                        tr.sendInfo("rank"); 
                }
            } catch (e) {
                console.log(e + " at " + e.stack);
            }
        }
    }            

    async function handleOwnBoatInfo (message, isFirstBoatInfo) {
        var raceId = getRaceLegId(message._id);
        var race = races.get(raceId);
        if(!race) addRace(message);
        await updatePosition(message, race);

        lMap.updateCoordinatesToCenterViewMap(message.pos.lat, message.pos.lon);

        //message._id.user_id message.displayName
        if (isFirstBoatInfo && cbRouter.checked) {
            callRouter(raceId, currentUserId, true,document.getElementById("sel_router").value);
        }
        // Add own info on Fleet tab
        mergeBoatInfo(raceId, "usercard", message._id.user_id, message);

        nf.manage(race,message._id.user_id,raceFleetMap);       //Notifications
        
        rt.updateFleet(race,raceFleetMap);

        var fleet = raceFleetMap.get(raceId);
        var userId = message._id.user_id;

        if(fleet && fleet.uinfo[userId])
        {
            var playerData = Object.create(DM.playerModel);
            playerData.playerId = userId;
            playerData.displayName = message.displayName;
            playerData.country = message.personal.country;
            DM.addPlayerInfo(playerData) ;
            DM.makePlayerTable();  
            await DM.savePlayerList();
            

            if(fleet.uinfo[userId].savedOption)
            {
                if(fleet.uinfo[userId].savedOption != "---" && fleet.uinfo[userId].savedOption != "?")
                { 
                    var playerOptionsData = Object.create(DM.raceOptionPlayerModel);
                    playerOptionsData.playerId = userId;
                    playerOptionsData.time = fleet.uinfo[userId].lastCalcDate;
                    playerOptionsData.options = fleet.uinfo[userId].savedOption;
                    if (race.type && race.type === "record" && fleet.uinfo[userId].startDate) {
                        playerOptionsData.startRaceTime = fleet.uinfo[userId].startDate;
                    }
                    await DM.addRaceOptionsList(raceId,playerOptionsData);
                    await DM.saveRaceOptionsList(raceId);
                    if(document.getElementById("ITYC_record").checked && isFirstBoatInfo)
                    {
                        var raceData = DM.getRaceInfos(raceId);
                        var name ="-";
                        var type = "-";
                        if(raceData) {
                            name = raceData.legName;
                            type= raceData.raceType;
                        }
                        tr.initMessage("opt",raceId,name,currentUserId,type);
                        tr.addOptInfo(userId,fleet.uinfo[userId]);
                        race.optITYCStatus = tr.sendInfoOpt();
                    }
                }     
            }
        }
    }

    function handleOwnTrackInfo (message) {
        var raceId = getRaceLegId(message._id);
        var race = races.get(raceId);
        lMap.updateMapMe(race, message.track);
    }

    function getUserId(message) {
        return (message._id)?message._id.user_id:message.userId;
    }

    async function handleFleetBoatInfo(message) {
        var raceId = getRaceLegId(message._id);
        var race = races.get(raceId);
        var userId = getUserId(message);
        if ( message.rank == 1 ) {
            race.bestDTF = message.distanceToEnd;
        }
        
        mergeBoatInfo(raceId, "usercard", userId, message);

        var fleet = raceFleetMap.get(raceId);

        if(fleet && fleet.uinfo[userId])
        {
            var playerData = Object.create(DM.playerModel);
            playerData.playerId = userId;
            playerData.displayName = message.displayName;
            playerData.country = message.personal.country;
            DM.addPlayerInfo(playerData) ;
            DM.makePlayerTable();  
            await DM.savePlayerList();

/* As others player options isn t need anymore             
            if(fleet.uinfo[userId].savedOption)
            {
                if(fleet.uinfo[userId].savedOption != "---" && fleet.uinfo[userId].savedOption != "?")
                { 
                    var playerOptionsData = Object.create(DM.raceOptionPlayerModel);
                    playerOptionsData.playerId = userId;
                    playerOptionsData.time = fleet.uinfo[userId].lastCalcDate;
                    playerOptionsData.options = fleet.uinfo[userId].savedOption;
                    if (race.type === "record" && fleet.uinfo[userId].startDate) {
                        playerOptionsData.startRaceTime = fleet.uinfo[userId].startDate;
                    }
                    await DM.addRaceOptionsList(raceId,playerOptionsData);
                    await DM.saveRaceOptionsList(raceId);
                }
            }
*/
            /* replace by */
            if (race.type === "record" && fleet.uinfo[userId].startDate) {
                var playerOptionsData = Object.create(DM.raceOptionPlayerModel);
                playerOptionsData.playerId = userId;
                playerOptionsData.time = fleet.uinfo[userId].lastCalcDate;
                playerOptionsData.startRaceTime = fleet.uinfo[userId].startDate;
                await DM.addRaceOptionsList(raceId,playerOptionsData);
                await DM.saveRaceOptionsList(raceId);
            }

        }
        makeRaceStatusHTML();

        if(race.recordedData) {
            gr.upDateGraph(race.recordedData);
        }

        makeTableHTMLProcess(race);
        updateFleetHTML(raceFleetMap.get(selRace.value));
        lMap.updateMapFleet(race,raceFleetMap);
        rt.updateFleet(race,raceFleetMap);
        document.dispatchEvent(new Event('change'))
    }
    
    async function handleLegInfo (message) {
        // ToDo - refactor updateFriendsUinfo message
        var raceId = getRaceLegId(message._id);
        var race = races.get(raceId);
        if (race === undefined) {
            race = {
                id: raceId,
                name: message.name,
                legName: message.name,
                source: "vr_leginfo"
            };
            initRace(race, true);
        }
        race.legdata = message;
        changeRace(raceId) ;
        await DM.saveLegInfo(races);

    }


    async function handleLegGetListResponse (response)  
    {
        // Contains destination coords, ice limits
        // ToDo: contains Bad Sail warnings. Show in race status table?
        var legInfos = response.scriptData.res;
        legInfos.map(function (legInfo) {
            var rid = legInfo.raceId + "." + legInfo.legNum;
            var race = races.get(rid);
            if (race === undefined) {
                race = {
                    id: rid,
                    name: legInfo.legName,
                    legName: legInfo.legName,
                    source: "vr_leglist"
                };
                initRace(race, true);
            } else {
                race.legName = legInfo.legName; // no name yet (created by updatePosition)
            }
            race.rank = legInfo.rank;
            race.type = legInfo.raceType;
            race.legnum = legInfo.legNum;
            race.status = legInfo.status;
            race.record = legInfo.record;
            if (legInfo.problem == "badSail") {} else if (legInfo.problem == "...") {}
        
            race.gfsWinds = '1.0';
            if (legInfo.fineWinds && legInfo.fineWinds === true) race.gfsWinds = '0.25';

            var raceData = DM.getRaceInfos(rid);
            if(!raceData|| raceData.raceType == DM.raceInfosModel.raceType)
            {
                raceData = Object.create(DM.raceInfosModel);
            } 
            raceData.legId = rid;
            raceData.legName = legInfo.legName;
            raceData.name = legInfo.raceName;
            raceData.nbPlayers = legInfo.nbTotalSkippers;
            raceData.priceLevel = legInfo.priceLevel;
            raceData.vsrRank = legInfo.vsrRank;
            raceData.raceType = legInfo.raceType;
            raceData.endDate = legInfo.end.date;
            raceData.startDate = legInfo.start.date;
            raceData.polar_id = legInfo.boat.polar_id;
            
            DM.addRaceInfo(raceData) ;
        });
        DM.makeRaceTable();  
        await DM.saveRaceList();
        makeRaceStatusHTML();
    }

    async function handleGameAddBoatAction (request, response) {
        // First boat state message, only sent for the race the UI is displaying
        var raceId = getRaceLegId(request);
        var race = races.get(raceId);
        if (race != undefined) {
            if(race.curr) welcomePage = false;
            race.lastCommand = {
                request: request,
                rc: response.scriptData.rc
            };
            await addTableCommandLine(race);
            //merge incomming cmd in global race table
            if(race.curr && response.scriptData.boatActions) {
                response.scriptData.boatActions.forEach(boatAction => {
                    if(boatAction._id.ts == response.scriptData.actionTs && boatAction._id.action=="heading") {
                        if(boatAction.autoTwa) {
                            race.curr.twaAuto = boatAction.deg;
                            if(raceFleetMap[raceId] && raceFleetMap[raceId].uinfo[currentUserId] && raceFleetMap[raceId].uinfo[currentUserId].curr)
                                raceFleetMap.get(r.id).uinfo[currentUserId].curr.twaAuto = boatAction.deg;
                        }
                        else {
                            race.curr.heading = boatAction.deg;
                            if(raceFleetMap[raceId] && raceFleetMap[raceId].uinfo[currentUserId] && raceFleetMap[raceId].uinfo[currentUserId].curr)
                                raceFleetMap.get(r.id).uinfo[currentUserId].curr.heading = boatAction.deg;
                        }
                    
                    }
                });
            }
            makeRaceStatusHTML();
            document.getElementById("raceStatusTable").addEventListener("created", controller.raceStatusResize);
            if (response.scriptData.boatActions) {
                handleBoatActions(response.scriptData.boatActions);
            }
        }
    }

    function handleBoatActions (message) {
        var l = message.length-1;
        if (l == -1) return;
        var action = message[l];    
        var raceId = getRaceLegId(action._id);
        var race = races.get(raceId);
        race.waypoints = action;
        if (race.waypoints.pos) {
            race.waypoints.type = "wp";
        } else {
            race.waypoints.type = "heading";
        }
        lMap.updateMapWaypoints(race);
    }

    async function itycPolarSync(polarId) {
        let polString = DM.serialize(polars[polarId]);
        const hashBuffer = DM.cyrb53(polString,polarId);
        if(!DM.isHashOK(polarId,hashBuffer)) {
            DM.sendPolar2ITYC(polarId,hashBuffer,polString);
        }
    
    }
    async function handleRace_SelectorData(response) {

        /* store polar */
        const boatPolar = response.scriptData.extendsData.boatPolar; 
        polars[boatPolar._id] = boatPolar;
        await itycPolarSync(boatPolar._id);
        var savedData = "";    
        Object.keys(polars).forEach(function (race) {
            savedData += "/**/"+JSON.stringify(polars[race]);
    
        });
        localStorage["polars"] = savedData;

        console.info("Stored polars " + boatPolar.label);     

    }
    async function handleMetaGetPolar (response) {
        
        // Always overwrite cached data...
        polars[response.scriptData.polar._id] = response.scriptData.polar;
        await itycPolarSync(response.scriptData.polar._id);
        var savedData = "";    
        Object.keys(polars).forEach(function (race) {
            savedData += "/**/"+JSON.stringify(polars[race]);
    
        });
        
        await  saveLocal('polars',savedData);
    
        console.info("Stored polars " + response.scriptData.polar.label);
    }

    function handleGameGetGhostTrack (request, response) {
        var raceId = getRaceLegId(request);
        var fleet = raceFleetMap.get(raceId);
        var race = races.get(raceId);
        var uid = request.user_id;

        if (race) {
            race.leaderTrack = response.scriptData.leaderTrack;
            race.leaderName =  response.scriptData.leaderName;
            if (response.scriptData.myTrack) {
                race.myTrack = response.scriptData.myTrack;
            }
            lMap.updateMapLeader(race);
        }
    }

    
    async function handleUserGetCard (request, response) {
        var raceId = getRaceLegId(request);
        var uid = request.user_id;

        if ( response.scriptData.baseInfos)
        {
            var playerData = Object.create(DM.playerModel);
            playerData.playerId = response.scriptData.baseInfos.id;
            playerData.displayName = response.scriptData.baseInfos.displayName;
            playerData.country = response.scriptData.baseInfos.country;
            playerData.genderType = response.scriptData.baseInfos.genderType;
            
            DM.createEmptyTeam();
            if(response.scriptData.baseInfos.team && response.scriptData.baseInfos.team.id) 
            {
                //register team 
                var teamData = Object.create(DM.teamModel);
                teamData.teamId = response.scriptData.baseInfos.team.id;
                teamData.teamName = response.scriptData.baseInfos.team.name;
                DM.addTeamInfo(teamData); 
                playerData.teamId = teamData.teamId;                       
            } else
                playerData.teamId = "None";
            
            DM.addPlayerInfo(playerData);
            DM.makePlayerTable();  
            await DM.savePlayerList();
            DM.makeTeamTable();
            await DM.saveTeamList();
            
            
            if (response.scriptData.legInfos
             && response.scriptData.legInfos.type) {
                
                mergeBoatInfo(raceId, "usercard", uid, response.scriptData.baseInfos);
                mergeBoatInfo(raceId, "usercard", uid, response.scriptData.legInfos);

                if (raceId == selRace.value) {
                    updateFleetHTML(raceFleetMap.get(selRace.value));
         //           makeIntegratedHTML();
                }
                
                var race = races.get(raceId);
                lMap.updateMapFleet(race,raceFleetMap);
                //updateMapFleet(race);
                rt.updateFleet(race,raceFleetMap);
            }
        }
    }

    async function handleGameGetSettings (response) {
        if(!response) return;
        if(response.scriptData.settings && response.scriptData.settings.stamina) {
            paramStamina = response.scriptData.settings.stamina;
            ;
            await saveLocal('stamina',JSON.stringify(paramStamina));
    
        }
    }

    async function handleTeamGet (response) {
        if(!response) return;
        var teamData = Object.create(DM.teamModel);
        teamData.teamId = response.scriptData.res.id;
        teamData.teamName = response.scriptData.res.def.name;
        teamData.teamsize = response.scriptData.res.def.members.length;
        if( response.scriptData.res.def.typ != undefined ) teamData.type = response.scriptData.res.def.type;
        if( response.scriptData.res.def.desc != undefined ) teamData.desc = response.scriptData.res.def.desc;
        DM.addTeamInfo(teamData);
        DM.makeTeamTable();
        await DM.saveTeamList();

        var idx = response.scriptData.res.def.members.length;
        for (var i = 0; i< idx; i++) {
            var id = response.scriptData.res.def.members[i].id;
            var playerData = Object.create(DM.playerModel);
            playerData.playerId = response.scriptData.res.def.members[i].id;
            playerData.displayName = response.scriptData.res.def.members[i].displayName;
            playerData.genderType = response.scriptData.res.def.members[i].genderType;
            playerData.country = response.scriptData.res.def.members[i].country;
            playerData.teamId = response.scriptData.res.id;
            DM.addPlayerInfo(playerData) ; //empty team fix
        }
        DM.makePlayerTable();  
        await DM.savePlayerList();    
    }

    async function handleTeamGetList (response) {
        
        if(!response) return;
        var idx = response.scriptData.res.length;
        for (var i = 0; i< idx; i++) {
            var teamData = Object.create(DM.teamModel);
            teamData.teamId = response.scriptData.res[i].id;
            teamData.teamName = response.scriptData.res[i].def.name;
            teamData.teamsize = response.scriptData.res[i].def.members;
            if( response.scriptData.res[i].def.type != undefined ) teamData.type = response.scriptData.res[i].def.type;
            if( response.scriptData.res[i].def.desc != undefined ) teamData.desc = response.scriptData.res[i].def.desc;
            DM.addTeamInfo(teamData);
        }
        DM.makeTeamTable();
        await DM.saveTeamList();
    }

    function handleGameGetFollowedBoats (request, response) {
        var raceId = getRaceLegId(request);
        var race = races.get(raceId);
        updateFleet(raceId, "followed", response.scriptData.res);
        //updateMapFleet(race);
        lMap.updateMapFleet(race,raceFleetMap);
        rt.updateFleet(race,raceFleetMap);
        if (raceId == selRace.value) {
            updateFleetHTML(raceFleetMap.get(selRace.value));
        }
    }

    function handleGameGetOpponents (request, response) {
        var raceId = getRaceLegId(request);
        var race = races.get(raceId);
        updateFleet(raceId, "opponents", response.scriptData.res);
        //updateMapFleet(race);
        lMap.updateMapFleet(race,raceFleetMap);
        rt.updateFleet(race,raceFleetMap);
        if (raceId == selRace.value) {
            updateFleetHTML(raceFleetMap.get(selRace.value));
        }
    }
    
    async function handleSocialGetPlayers (response) {
        var idx = response.scriptData.res.length;           
        DM.createEmptyTeam();
        for (var i = 0; i< idx; i++) {
            var id = response.scriptData.res[i].id;
            var playerData = Object.create(DM.playerModel);
            playerData.playerId = response.scriptData.res[i].id;
            playerData.displayName = response.scriptData.res[i].displayName;
            playerData.genderType = response.scriptData.res[i].genderType;
            playerData.country = response.scriptData.res[i].country;
            playerData.isFollowed = true; 
            if(response.scriptData.res[i].team)
            {
                playerData.teamId = response.scriptData.res[i].team.id;
                var teamData = Object.create(DM.teamModel);
                teamData.teamId = response.scriptData.res[i].team.id;
                teamData.teamName = response.scriptData.res[i].team.name;
                DM.addTeamInfo(teamData);
            } else
                playerData.teamId = "None";
            DM.addPlayerInfo(playerData) ;
        }
        DM.makePlayerTable();  
        await DM.savePlayerList(); 
        DM.makeTeamTable();
        await DM.saveTeamList();
    }
    async function handleAccountDetailsResponse (response) {
        reInitUI(response.userId);
        currentUserId = response.userId;
        lMap.set_currentId(currentUserId);
        rt.set_currentId(currentUserId);
        welcomePage = true;
        lbBoatname.innerHTML = response.displayName;
        lbCredits.innerHTML = response.currency1;
        currentUserName = response.displayName;
        if(response.scriptData)
        {
            var playerData = Object.create(DM.playerModel);
            playerData.playerId = response.userId;
            playerData.displayName = response.displayName;
            if(response.location.city)   playerData.city = response.location.city;
            if(response.location.country) playerData.country = response.location.country;

            if(response.scriptData.isVIP!==undefined && response.scriptData.isVIP && response.scriptData.userSettings.noAds === true) {
                var vipTag = document.getElementById("lb_boatvip");
                vipTag.innerHTML = "&nbsp;VIP&nbsp"; 
                vipTag.style.backgroundColor = ' #f7da03';   
                vipTag.style.color = 'black';  
            } else
            {
                var vipTag = document.getElementById("lb_boatvip");
                vipTag.innerHTML = ""; 
                vipTag.style.backgroundColor = document.body.style.backgroundColor;
            }

            DM.createEmptyTeam();

            if (response.scriptData.team) {
                lbTeamname.innerHTML = response.scriptData.team.name;
                currentTeam = response.scriptData.team.name;
                currentTeamId = response.scriptData.team.id;
                
                lMap.set_currentTeam(currentTeam);

                playerData.teamId = response.scriptData.team.id;

                var teamData = Object.create(DM.teamModel);
                teamData.teamId = response.scriptData.team.id;
                teamData.teamName = response.scriptData.team.name;
                DM.addTeamInfo(teamData);                 
            } else
                playerData.teamId = "None";

            DM.addPlayerInfo(playerData) ;
            DM.makePlayerTable();  
            await DM.savePlayerList();
            DM.makeTeamTable();
            await DM.saveTeamList();       
        }
    }

  // Events:
    var ignoredMessages = [
        "Ad_getInterstitial",       //I
        "Ad_GetPOIs",       //I
        "Game_SaveLastRank",
        "Game_GetWeather",
        "Meta_GetMapInfo",        //I
        "Meta_GetCountries",        //I
        "Leg_GetHistory",
        "Shop_GetPacks",        //I
        "Shop_GetSubscriptions",       //I
        "Social_GetCommunityMessages",       //I
        "Social_getVRmsg",       //I
        "User_GetInfos",    //I
        "Team_MessageGetList",
        "Social_GetNbUnread","Social_GetConversationList","Social_GetConversation"];              //I
    var handledMessages = [
        ".AccountDetailsResponse",
        "getboatinfos",
        "getfleet",
        "Game_GetGhostTrack",       //1
        "Game_AddBoatAction",   //1
        "Leg_GetList", //1
        "Meta_GetPolar", //1
        "User_GetCard",
        "Game_GetSettings",
        "Team_Get",
        "Team_GetList",
        "Game_GetFollowedBoats",
        "Game_GetOpponents",
        "Social_GetPlayers"
        ]; //1

    
    chrome.runtime.onMessageExternal.addListener(
        function(request, sender, sendResponse) {
            var msg = request;
            let rstTimer = false;
            let sendResp = true;
            if(msg.type=="data") {
                if(msg.req.Accept) {sendResponse({type:"dummy"}); return;}  //json ranking request not supported
                var postData = JSON.parse(msg.req);
                var eventClass = postData['@class'];
                var body = JSON.parse(msg.resp.replace(/\bNaN\b|\bInfinity\b/g, "null"));
                if (eventClass == 'AccountDetailsRequest') {
                    handleAccountDetailsResponse(body);
                } else if (eventClass == 'LeaderboardDataRequest') {
                //    handleLeaderboardDataResponse(postData, body);
                } else if (eventClass == 'LogEventRequest') {
                    var eventKey = postData.eventKey;
                    if (eventKey == 'Leg_GetList') {
                        handleLegGetListResponse(body);
                    } else if (eventKey == 'Meta_GetPolar') {
                        handleMetaGetPolar(body);
                    } else if (eventKey == 'Race_SelectorData') {
                        handleRace_SelectorData(body);
                    } else if (eventKey == 'Game_AddBoatAction' ) {
                        handleGameAddBoatAction(postData, body);
                    } else if (eventKey == "Game_GetGhostTrack") {
                        handleGameGetGhostTrack(postData, body);
                    } else if (eventKey == "User_GetCard") {
                        handleUserGetCard(postData, body);   
                    }  else if (eventKey == "Game_GetSettings") {
                        handleGameGetSettings(body);
                    } else if (eventKey == "Team_Get") {
                        handleTeamGet(body);
                    } else if (eventKey == "Team_GetList") {
                        handleTeamGetList(body);  
                    } else if (eventKey == "Game_GetFollowedBoats") {
                        handleGameGetFollowedBoats(postData, body);
                    } else if (eventKey == "Game_GetOpponents") {
                        handleGameGetOpponents(postData, body);
                    } else if (eventKey == "Social_GetPlayers") {
                        handleSocialGetPlayers( body);
                    } else if (ignoredMessages.includes(eventKey)) {
                        if(cbRawLog.checked) console.info("Ignored eventKey " + eventKey);
                    } else {
                        if(cbRawLog.checked)console.info("Unhandled logEvent " + JSON.stringify(msg.resp) + " with eventKey " + eventKey);
                    }
                }
                else {
                    var event = msg.url.substring(msg.url.lastIndexOf('/') + 1);
                    if (event == 'getboatinfos') {
                        rstTimer = handleBoatInfo(postData, body.res);
                    } else if (event == 'getfleet') {
                        handleFleet(postData, body.res);
                    } else if (event == 'getlegranks') {
                        handleLegRank(postData, body.res);
                    } else{
                        if(cbRawLog.checked)console.info("Unhandled request " + msg.url + "with response" + JSON.stringify(msg.resp));
                    }
                }
                sendResponse(makeIntegratedHTML(rstTimer));
                sendResp = false;
            }  else if(msg.type=="wndCycle") {
                var cycleString = msg.url.substring(45, 56);
                var d = parseInt(cycleString.substring(0, 8));
                var c = parseInt(cycleString.substring(9, 11));
                var cycle = d * 100 + c;
                
                if (!currentCycle || (cycle > currentCycle)) {
                    currentCycle = cycle;
                    lbCycle.innerHTML = "(Cycle : "+cycleString+")";
                }
            } else if(msg.type=="openZezo") {
                callRouter(selRace.value, currentUserId, false,"zezo");  
            } else if(msg.type=="openVrzen") {
                callRouter(selRace.value, currentUserId, false,"vrzen"); 
            } else if(msg.type=="openItyc") {
                callPolarAnalysis("ityc"); 
            } else if(msg.type=="openToxxct") {
                callPolarAnalysis("toxxct");
            }
            if(sendResp) 
            {
                let gameSize = document.getElementById("fullScreen_Size").value;
                if(!document.getElementById("FullScreen_Game" ).checked) gameSize = 0;   
                sendResponse({type:"alive",rstTimer:false,theme:drawTheme,gameSize:gameSize});
            }
        }
    );


    function onRouteListClick(ev)
    {
        var race = races.get(selRace.value);
        if (!race)  return;
        rt.onRouteListClick(ev,race);
    }

    function onAddRoute()
    {
        var race = races.get(selRace.value);
        if (!race)  return;
        rt.onAddRoute(race);
    }
    function onAddRouteLmap()
    {
        var race = races.get(selRace.value);
        if (!race)  return;
        rt.onAddRouteLmap(race);
    }

    function onCleanRoute() {
        var race = races.get(selRace.value);
        if (!race)  return;
        rt.onCleanRoute(race);

    }
    async function onMarkersChange() {
        var race = races.get(selRace.value);
        if (!race)  return;
        var markerState = rt.onMarkersChange(race);
        
        await saveLocal("cb_sel_showMarkersLmap",markerState);
    
    }

    function onSkipperSelectChange() {
        var race = races.get(selRace.value);
        if (!race)  return;
        rt.onSkipperSelectedChange("Lmap");

    }

    function onFleetInCpyClipBoard() {
        var race = races.get(selRace.value);
        if (!race)  return;
        exp.onFleetInCpyClipBoard(raceFleetMap.get(selRace.value),currentUserId,race);
    }

    let tracksState = true;
    async function onTracksChange() {
        var race = races.get(selRace.value);
        if (!race)  return;

        if(tracksState)
            tracksState = false;
        else
            tracksState = true;
    
        document.getElementById('sel_showTracksLmap').checked=tracksState;
        await saveLocal("cb_sel_showTracksLmap",tracksState);
    
        lMap.hideShowTracks(race);
    }

    async function onBorderColorChange(e)
    {
        let color = e.target.value;
        EX.setBorderColor(color);
    }
    async function onProjectionColorChange(e)
    {
        let color = e.target.value;
        lMap.setProjectionLineColor(color);
    }
    async function onProjectionSizeChange(e)
    {
        let val = e.target.value;
        lMap.setProjectionLineSize(val);
    }

    async function selectLgFR () {
        lang = "fr";
        saveLocal("dash_lang",lang);
        translateDash();
    }
    function selectLgEN () {
        lang = "EN";
        saveLocal("dash_lang",lang);
        translateDash();
    }
    function selectLgES () {
        lang = "es";
        saveLocal("dash_lang",lang);
        translateDash();
    }


    
    function translateDash () {

        if(lang == "fr") {
            document.getElementById("t_boat").innerHTML = "Bateau: ";	
            document.getElementById("t_team").innerHTML = "Équipe: ";	
            document.getElementById("t_race").innerHTML = "Course";	
            document.getElementById("t_NMEA").innerHTML = "Sortie NMEA";
            document.getElementById("t_help").innerHTML = "Aide";
            
            document.getElementById("t_raceLog").innerHTML = "Journal";
            document.getElementById("t_fleet").innerHTML = "Flotte";
            document.getElementById("t_map").innerHTML = "Carte";
            document.getElementById("t_resume").innerHTML = "Résumé";
            document.getElementById("t_graph").innerHTML = "Graph";
            document.getElementById("t_analyse").innerHTML = "Analyse";
            document.getElementById("t_notif").innerHTML = "Notifs";
            document.getElementById("t_config").innerHTML = "Config";
            document.getElementById("t_rawLog").innerHTML = "Raw Log";
            
            document.getElementById("t_filter").innerHTML = "Filtres";
            document.getElementById("lbl_team").innerHTML = '<span style="color:Red;">&#x2B24;</span>&nbsp;Équipe';
            document.getElementById("lbl_friends").innerHTML = '<span style="color:LimeGreen;">&#x2B24;</span>&nbsp;Amis';
            document.getElementById("lbl_top").innerHTML = '<span style="color:GoldenRod;">&#x2B24;</span>&nbsp;Top VSR';
            document.getElementById("lbl_sponsors").innerHTML = '<span style="color:DarkSlateBlue;">&#x2B24;</span>&nbsp;Sponsors';
            document.getElementById("lbl_certified").innerHTML = '<span style="color:DodgerBlue;">&#x2B24;</span>&nbsp;Certifiés';
            document.getElementById("lbl_opponents").innerHTML = '<span style="color:lightgray;">&#x2B24;</span>&nbsp;Adversaires';
            document.getElementById("lbl_reals").innerHTML = '<span style="color:Chocolate;">&#x2B24;</span>&nbsp;Réels';
            document.getElementById("lbl_selected").innerHTML = '<span style="color:HotPink;">&#x2B24;</span>&nbsp;Sélectionnés';
            document.getElementById("lbl_inrace").innerHTML = 'En course';
            
            document.getElementById("lbl_helpLmap").innerHTML = "Aide";
            document.getElementById("lbl_showMarkersLmap").innerHTML = "Marqueurs";
            document.getElementById("lbl_showTracksLmap").innerHTML = "Traces";
            document.getElementById("lbl_rt_openLmap").innerHTML = "Ajouter";	
            document.getElementById("lbl_rt_cleanLmap").innerHTML = "Effacer";
            document.getElementById("t_rtTitle").innerHTML = "Import Routage";
            document.getElementById("bt_rt_addLmap").innerHTML = "Import";
            document.getElementById("t_opt_sails").innerHTML = "Voiles";
            document.getElementById("t_opt_hull").innerHTML = "Polish";
            document.getElementById("t_opt_c0").innerHTML = "C0";
            
            document.getElementById("bt_cleanGraph").innerHTML = "Effacer graphiques";
            document.getElementById("bt_exportGraphData").innerHTML = "Exporter les données";
            
            document.getElementById("t_notif2").innerHTML = "Notifications et rappels";
            document.getElementById("t_notif21").innerHTML = 'Sélectionner une course :';
            document.getElementById("t_notif22").innerHTML = "Paramètres :";
            document.getElementById("t_notif_opt1").innerHTML = "inférieur";
            document.getElementById("t_notif_opt2").innerHTML = "inférieur ou égal";
            document.getElementById("t_notif_opt3").innerHTML = "égal";
            document.getElementById("t_notif_opt4").innerHTML = "supérieur ou égal";
            document.getElementById("t_notif_opt5").innerHTML = "supérieur";
            document.getElementById("t_notif23").innerHTML = "à";
            document.getElementById("t_notif25").innerHTML = "M'envoyer un rappel dans ";
            
            document.getElementById("bt_notif").innerHTML = "Créer";
            document.getElementById("bt_notif2").innerHTML = "Créer";
            document.getElementById("t_notif_repeat").innerHTML = "Répétition (x3)";
            document.getElementById("t_notif_repeat2").innerHTML = "Répétition (x3)";
            
            
            
            document.getElementById("t_config_g").innerHTML = "Général";
            document.getElementById("t_vrzenPositionFormat").innerHTML = 'Afficher position sans le séparateur "-" (redémarrage dashboard requis)';
            document.getElementById("t_2digits").innerHTML = "+1 digit";
            document.getElementById("t_reuse_tab").innerHTML = "Réutilisation onglet";
            document.getElementById("t_local_time").innerHTML = "Heure locale";
            document.getElementById("t_ITYC_record").innerHTML = "Envoi infos ITYC";
            document.getElementById("t_polarSite").innerHTML = "Site polaires";
            document.getElementById("t_FullScreen_Game").innerHTML = "Mode plein Ecran";
            document.getElementById("t_fullScreen_Size").innerHTML = "Taille du jeu";

            document.getElementById("t_config_rs").innerHTML = "Race Status";
            document.getElementById("t_showBVMGSpeed").innerHTML = "Afficher Vitesse du bateau à la VMG";
            document.getElementById("t_with_LastCommand").innerHTML = "Afficher derniers ordres";

            document.getElementById("t_config_l").innerHTML = "Journal";
            document.getElementById("t_hideCommandsLines").innerHTML = "Cacher les lignes correspondantes aux actions/commandes (sauf les 5 dernières)";
            
            document.getElementById("t_config_m").innerHTML = "Carte";
            document.getElementById("t_track_infos").innerHTML = "Charger infos traces (redémarrage dashboard requis)"		;

            document.getElementById("t_projectionLine_Size").innerHTML = "Longueur ligne de projection";
                
            document.getElementById("t_config_f").innerHTML = "Flotte";
            document.getElementById("t_abbreviatedOption").innerHTML = "Options abrégées";
            document.getElementById("t_auto_clean").innerHTML = "Nettoyage infos obsolètes";
            
            document.getElementById("t_config_c").innerHTML = "Colonnes";
            document.getElementById("t_fleet_team").innerHTML = "Équipe";
            document.getElementById("t_fleet_rank").innerHTML = "Rang";
            document.getElementById("t_fleet_racetime").innerHTML = "Temps de course";
            document.getElementById("t_fleet_speed").innerHTML = "Vitesse";
            document.getElementById("t_fleet_sail").innerHTML = "Voile";
            document.getElementById("t_fleet_factor").innerHTML = "Factor";
            document.getElementById("t_fleet_position").innerHTML = "Position";
            document.getElementById("t_fleet_options").innerHTML = "Options";
            document.getElementById("t_fleet_state").innerHTML = "État";

            document.getElementById("t_racelog_position").innerHTML = "Position";
            document.getElementById("t_racelog_stamina").innerHTML = "Stamina";
            document.getElementById("t_racelog_dtl").innerHTML = "DTL";
            document.getElementById("t_racelog_dtf").innerHTML = "DTF";
            document.getElementById("t_racelog_deltaDistance").innerHTML = "Δd (nm)";
            document.getElementById("t_racelog_deltaTime").innerHTML = "Δd (nm)";
            document.getElementById("t_racelog_rank").innerHTML = "Rang";
            document.getElementById("t_racelog_factor").innerHTML = "Factor";
            document.getElementById("t_racelog_foils").innerHTML = "Foils";
            
            document.getElementById("bt_exportPolar").innerHTML = "Exporter Polaires";
            document.getElementById("bt_exportStamina").innerHTML = "Exporter Stamina";
            document.getElementById("bt_exportFleet").innerHTML = "Exporter FleetInfos";
            
            document.getElementById("t_credit_all").innerHTML = "Tous les contributeurs inconnus !";
            document.getElementById("t_credit_me").innerHTML = "Votre serviteur !";


        } else {
            document.getElementById("t_boat").innerHTML = "Boat: ";	
            document.getElementById("t_team").innerHTML = "Team: ";	
            document.getElementById("t_race").innerHTML = "Race";	
            document.getElementById("t_NMEA").innerHTML = "NMEA output";
            document.getElementById("t_help").innerHTML = "Help";
            
            document.getElementById("t_raceLog").innerHTML = "RaceLog";
            document.getElementById("t_fleet").innerHTML = "Fleet";
            document.getElementById("t_map").innerHTML = "Map";
            document.getElementById("t_resume").innerHTML = "RaceBook";
            document.getElementById("t_graph").innerHTML = "Graph";
            document.getElementById("t_analyse").innerHTML = "Analysis";
            document.getElementById("t_notif").innerHTML = "Notifs";
            document.getElementById("t_config").innerHTML = "Config";
            document.getElementById("t_rawLog").innerHTML = "Raw Log";
            
            document.getElementById("t_filter").innerHTML = "Filters";
            document.getElementById("lbl_team").innerHTML = '<span style="color:Red;">&#x2B24;</span>&nbsp;Team';
            document.getElementById("lbl_friends").innerHTML = '<span style="color:LimeGreen;">&#x2B24;</span>&nbsp;Friends';
            document.getElementById("lbl_top").innerHTML = '<span style="color:GoldenRod;">&#x2B24;</span>&nbsp;Top VSR';
            document.getElementById("lbl_sponsors").innerHTML = '<span style="color:DarkSlateBlue;">&#x2B24;</span>&nbsp;Sponsors';
            document.getElementById("lbl_certified").innerHTML = '<span style="color:DodgerBlue;">&#x2B24;</span>&nbsp;Certified';
            document.getElementById("lbl_opponents").innerHTML = '<span style="color:lightgray;">&#x2B24;</span>&nbsp;Opponnents';
            document.getElementById("lbl_reals").innerHTML = '<span style="color:Chocolate;">&#x2B24;</span>&nbsp;Reals';
            document.getElementById("lbl_selected").innerHTML = '<span style="color:HotPink;">&#x2B24;</span>&nbsp;Selected';
            document.getElementById("lbl_inrace").innerHTML = 'Racing';
            
            document.getElementById("lbl_helpLmap").innerHTML = "Help";
            document.getElementById("lbl_showMarkersLmap").innerHTML = "Marks";
            document.getElementById("lbl_showTracksLmap").innerHTML = "Tracks";
            document.getElementById("lbl_rt_openLmap").innerHTML = "Add";	
            document.getElementById("lbl_rt_cleanLmap").innerHTML = "Clean";
            document.getElementById("t_rtTitle").innerHTML = "Routes Import";
            document.getElementById("bt_rt_addLmap").innerHTML = "Import";
            document.getElementById("t_opt_sails").innerHTML = "Sails";
            document.getElementById("t_opt_hull").innerHTML = "Hull";
            document.getElementById("t_opt_c0").innerHTML = "Reaching";
            
            document.getElementById("bt_cleanGraph").innerHTML = "Clear graphics";
            document.getElementById("bt_exportGraphData").innerHTML = "Export data";
            
            document.getElementById("t_notif2").innerHTML = "Notifications and recall";
            document.getElementById("t_notif21").innerHTML = 'Select a race:';
            document.getElementById("t_notif22").innerHTML = "Parameters:";
            
            document.getElementById("t_notif_opt1").innerHTML = "inferior";
            document.getElementById("t_notif_opt2").innerHTML = "inferior or equal";
            document.getElementById("t_notif_opt3").innerHTML = "equal";
            document.getElementById("t_notif_opt4").innerHTML = "superior or equal";
            document.getElementById("t_notif_opt5").innerHTML = "superior";
            document.getElementById("t_notif23").innerHTML = "to";
            document.getElementById("t_notif25").innerHTML = "Send me a recall in ";
            document.getElementById("bt_notif").innerHTML = "Create";
            document.getElementById("bt_notif2").innerHTML = "Create";
            document.getElementById("t_notif_repeat").innerHTML = "Repeat (x3)&nbsp;&nbsp;&nbsp;";
            document.getElementById("t_notif_repeat2").innerHTML = "Repeat (x3)&nbsp;&nbsp;&nbsp;";

            
            
            document.getElementById("t_config_g").innerHTML = "General";
            document.getElementById("t_vrzenPositionFormat").innerHTML = 'Show position without the separator "-" (dashboard restart needed)';
            document.getElementById("t_2digits").innerHTML = "+1 digit";
            document.getElementById("t_reuse_tab").innerHTML = "Tab re-use";
            document.getElementById("t_local_time").innerHTML = "Local time";
            document.getElementById("t_ITYC_record").innerHTML = "Send infos ITYC";
            document.getElementById("t_polarSite").innerHTML = "Polars site";
            document.getElementById("t_FullScreen_Game").innerHTML = "FullScreen Mode";
            document.getElementById("t_fullScreen_Size").innerHTML = "Game Size";
            
            document.getElementById("t_config_rs").innerHTML = "Race Status";
            document.getElementById("t_showBVMGSpeed").innerHTML = "Show boat speed at VMG";
            document.getElementById("t_with_LastCommand").innerHTML = "Show last commands";
            
            document.getElementById("t_config_l").innerHTML = "Race Log";
            document.getElementById("t_hideCommandsLines").innerHTML = "Hide lines corresponding to actions/commands (except the last 5)";
            
            document.getElementById("t_config_m").innerHTML = "Map";
            document.getElementById("t_track_infos").innerHTML = "Load track infos (dashboard restart needed)";
            
            document.getElementById("t_projectionLine_Size").innerHTML = "Projection line length";
                
            document.getElementById("t_config_f").innerHTML = "Fleet";
            document.getElementById("t_abbreviatedOption").innerHTML = "Shorted options";
            document.getElementById("t_auto_clean").innerHTML = "Old data cleaner";
            
            document.getElementById("t_config_c").innerHTML = "Columns";
            document.getElementById("t_fleet_team").innerHTML = "Team";
            document.getElementById("t_fleet_rank").innerHTML = "Rank";
            document.getElementById("t_fleet_racetime").innerHTML = "Race Time";
            document.getElementById("t_fleet_speed").innerHTML = "Speed";
            document.getElementById("t_fleet_sail").innerHTML = "Sail";
            document.getElementById("t_fleet_factor").innerHTML = "Factor";
            document.getElementById("t_fleet_position").innerHTML = "Position";
            document.getElementById("t_fleet_options").innerHTML = "Options";
            document.getElementById("t_fleet_state").innerHTML = "State";

            document.getElementById("t_racelog_position").innerHTML = "Position";
            document.getElementById("t_racelog_stamina").innerHTML = "Stamina";
            document.getElementById("t_racelog_dtl").innerHTML = "DTL";
            document.getElementById("t_racelog_dtf").innerHTML = "DTF";
            document.getElementById("t_racelog_deltaDistance").innerHTML = "Δd (nm)";
            document.getElementById("t_racelog_deltaTime").innerHTML = "Δd (nm)";
            document.getElementById("t_racelog_rank").innerHTML = "Rank";
            document.getElementById("t_racelog_factor").innerHTML = "Factor";
            document.getElementById("t_racelog_foils").innerHTML = "Foils";
            
            document.getElementById("bt_exportPolar").innerHTML = "Export Polars";
            document.getElementById("bt_exportStamina").innerHTML = "Export Stamina";
            document.getElementById("bt_exportFleet").innerHTML = "Export FleetInfos";
            
            document.getElementById("t_credit_all").innerHTML = "All unknows contributors !";
            document.getElementById("t_credit_me").innerHTML = "Myself !";
            
        }



        makeRaceStatusHTML();

    }

    async function selectSeparator(idSep)
    {
        let val = idSep.target.value;
        if(val=="sep_2") csvSep = ',';
        else if(val=="sep_3") csvSep = '\t';
        else csvSep = ';';
        await saveLocal('cb_sel_Seperator',val) ;

    }
    

    return {    
        // The only point of initialize is to wait until the document is constructed.
        initialize: initialize,
        
        // Useful functions
        callRouter: callRouter,
        changeRace: changeRace,
        updateFleetFilter: updateFleetFilter,

        clearLog: clearLog,
        tableClick: tableClick,
        resize: resize,
        readOptions: readOptions,
        addConfigListeners: addConfigListeners,
        // Ajout ---------------------
   //     setNotif: setNotif,
        onRouteListClick :onRouteListClick,
        onAddRoute:onAddRoute,
        onAddRouteLmap:onAddRouteLmap,
        onCleanRoute:onCleanRoute,
        onMarkersChange:onMarkersChange,
        onSkipperSelectChange:onSkipperSelectChange,
        onTracksChange:onTracksChange,
        exportPolar:exportPolar,
        exportStamina:exportStamina,
        exportFleet:exportFleet,
        exportGraphData:exportGraphData,
        graphCleanData:graphCleanData,

        selectLgFR:selectLgFR,
        selectLgEN:selectLgEN,
        selectLgES:selectLgES,

        selectSeparator:selectSeparator,
        onBorderColorChange:onBorderColorChange,
        onProjectionColorChange:onProjectionColorChange,
        onProjectionSizeChange:onProjectionSizeChange

        // Fin ajout -----------------
    }
}();

var expanded = false;

      
var tabId = parseInt(window.location.search.substring(1));


window.addEventListener("load", async function () {

    
    
    
    
    await controller.initialize();

    document.getElementById("bt_router").addEventListener("click", controller.callRouter);
    document.getElementById("sel_race").addEventListener("change", controller.changeRace);
    document.getElementById("sel_friends").addEventListener("change", controller.updateFleetFilter);
    document.getElementById("sel_opponents").addEventListener("change", controller.updateFleetFilter);
    document.getElementById("sel_team").addEventListener("change", controller.updateFleetFilter);
    document.getElementById("sel_top").addEventListener("change", controller.updateFleetFilter);
    document.getElementById("sel_reals").addEventListener("change", controller.updateFleetFilter);
    document.getElementById("sel_sponsors").addEventListener("change", controller.updateFleetFilter);
    document.getElementById("sel_certified").addEventListener("change", controller.updateFleetFilter);
    document.getElementById("sel_inrace").addEventListener("change", controller.updateFleetFilter);
    document.getElementById("sel_selected").addEventListener("change", controller.updateFleetFilter);
    document.getElementById("2digits").addEventListener("change", controller.updateFleetFilter);
    document.getElementById("local_time").addEventListener("change", controller.updateFleetFilter);
    document.getElementById("bt_clear").addEventListener("click", controller.clearLog);
    document.getElementById("bt_exportPolar").addEventListener("click", controller.exportPolar);
    document.getElementById("bt_exportStamina").addEventListener("click", controller.exportStamina);
    document.getElementById("bt_exportFleet").addEventListener("click", controller.exportFleet);
    
    
    document.getElementById("bt_cleanGraph").addEventListener("click", controller.graphCleanData);
    document.getElementById("bt_exportGraphData").addEventListener("click", controller.exportGraphData);

    
    // Ajout ----------------------------------------------------------------------------
    //document.getElementById("sel_raceNotif").addEventListener("change", controller.changeRace);
   

    document.addEventListener("click", controller.tableClick);
    document.addEventListener("resize", controller.resize);

    
    
    // Fin ajout -------------------------------------------------------------------------
    await controller.readOptions();
    controller.addConfigListeners();

    rt.initializeWebInterface(document.getElementById("sel_showMarkersLmap").checked);
    document.getElementById("route_list_tableLmap").addEventListener("click", controller.onRouteListClick);
    document.getElementById("route_list_tableLmap").addEventListener("input", controller.onRouteListClick);    
    document.getElementById("bt_rt_addLmap").addEventListener("click", controller.onAddRouteLmap);
    document.getElementById("lbl_rt_cleanLmap").addEventListener("click", controller.onCleanRoute);
    document.getElementById("lbl_showMarkersLmap").addEventListener("click", controller.onMarkersChange);
    document.getElementById("sel_rt_skipperLmap").addEventListener("change", controller.onSkipperSelectChange);

    
    document.getElementById("lbl_showTracksLmap").addEventListener("click", controller.onTracksChange);
    

    document.getElementById("lg_fr").addEventListener("click", controller.selectLgFR);
    document.getElementById("lg_en").addEventListener("click", controller.selectLgEN);
   // document.getElementById("lg_es").addEventListener("click", controller.selectLgES);

    
    document.getElementById("sel_projectionColorLmap").addEventListener("change", controller.onProjectionColorChange);
    document.getElementById("sel_borderColorLmap").addEventListener("change", controller.onBorderColorChange);
    document.getElementById("projectionLine_Size").addEventListener("change", controller.onProjectionSizeChange);

    gr.onLoad();


    // HEavy modified by SkipperDuMad ITYC.fr

});



