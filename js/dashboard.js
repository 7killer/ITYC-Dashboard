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

var controller = function () {

    const LightRed = '#FFA0A0';

    // ToDo: clear stats if user/boat changes
    var currentUserId,currentUserName, currentTeam,currentTeamId,currentRaceId=0;
    var requests = new Map();

    // Polars and other game parameters, indexed by polar._id
    var polars = [];

    var races = new Map();
    var raceFleetMap = new Map();

    let comPort;
    var currentSortField = "none";
    var originClick;
    var drawTheme = "dark";
    const sailNames = [0, "Jib", "Spi", "Stay", "LJ", "C0", "HG", "LG", 8, 9,
                     // VR sends sailNo + 10 to indicate autoSail. We use sailNo mod 10 to find the sail name sans Auto indication.
                     "Auto", "Jib &#x24B6;", "Spi &#x24B6;", "Stay &#x24B6;", "LJ &#x24B6;", "C0 &#x24B6;", "HG &#x24B6;", "LG &#x24B6;"];
    const sailColors = ["#FFFFFF", "#FF6666", "#6666FF", "#66FF66", "#FFF266", "#66CCFF", "#FF66FF", "#FFC44D", 8, 9,
    // VR sends sailNo + 10 to indicate autoSail. We use sailNo mod 10 to find the sail name sans Auto indication.
                    "#FFFFFF", "#FF6666", "#6666FF", "#66FF66", "#FFF266", "#66CCFF;", "#FF66FF", "#FFC44D"];
    
                    

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

    const refCurvePena = [

        0,0.035,0.069,0.17,0.264,0.353,0.439,0.521,0.602,0.681,
        0.761, 0.84,0.922,1.005,1.092,1.182,1.276,1.376,1.481,1.593,
        1.712,1.838,1.972,2.115,2.267,2.429,2.6,2.782,2.975,3.18,
        3.395,3.623,3.863,4.116,4.382,4.661,4.953,5.258,5.578,5.912,
        6.259,6.621,6.997,7.388,7.794,8.214,8.648,9.098,9.562,10.041,
        10.535,11.044,11.567,12.105,12.657,13.224,13.805,14.4,15.01,15.633,
        16.27,16.921,17.585,18.263,18.953,19.657,20.373,21.101,21.842,22.594,
        23.358,24.133,24.919,25.716,26.523,27.341,28.168,29.004,29.85,30.704,
        31.567,32.438,33.317,34.203,35.095,35.995,36.9,37.812,38.728,39.65,
        40.576,41.507,42.441,43.378,44.319,45.262,46.207,47.154,48.102,49.051,
        50,50.95,51.899,52.847,53.793,54.739,55.682,56.622,57.56,58.494,
        59.424,60.351,61.272,62.189,63.1,64.006,64.905,65.798,66.684,67.562,
        68.433,69.296,70.151,70.996,71.833,72.66,73.477,74.285,75.082,75.868,
        76.643,77.407,78.159,78.9,79.628,80.344,81.047,81.738,82.415,83.08,
        83.73,84.368,84.991,85.601,86.196,86.777,87.344,87.896,88.434,88.957,
        89.466,89.96,90.439,90.903,91.352,91.787,92.207,92.613,93.004,93.38,
        93.742,94.089,94.423,94.743,95.048,95.34,95.619,95.885,96.138,
        96.378,96.606,96.822,97.026,97.219,97.401,97.573,97.734,97.886,98.029,
        98.163,98.29,98.408,98.52,98.625,98.725,98.82,98.91,98.996,99.08,
        99.161,99.241,99.32,99.4,99.48,99.563,99.649,99.738,99.832,99.932,99.966,100,
      ];
      const refCurveRecovery = [

        0,0.023333333,0.046333333,0.069,0.136333333,0.201333333,0.264,0.323333333,0.381666667,0.439,0.493666667,
        0.548,0.602,0.654666667,0.707666667,0.761,0.813666667,0.867333333,0.922,0.977333333,1.034,
        1.092,1.152,1.213333333,1.276,1.342666667,1.411,1.481,1.555666667,1.632666667,1.712,
        1.796,1.882666667,1.972,2.067333333,2.165666667,2.267,2.375,2.486,2.6,2.721333333,
        2.846333333,2.975,3.111666667,3.251666667,3.395,3.547,3.703,3.863,4.031666667,4.204666667,
        4.382,4.568,4.758333333,4.953,5.156333333,5.364666667,5.578,5.800666667,6.027666667,6.259,
        6.500333333,6.746333333,6.997,7.257666667,7.523333333,7.794,8.074,8.358666667,8.648,8.948,
        9.252666667,9.562,9.881333333,10.20566667,10.535,10.87433333,11.21833333,11.567,11.92566667,12.289,
        12.657,13.035,13.41766667,13.805,14.20166667,14.60333333,15.01,15.42533333,15.84533333,16.27,
        16.704,17.14233333,17.585,18.037,18.493,18.953,19.42233333,19.89566667,20.373,20.85833333,
        21.348,21.842,22.34333333,22.84866667,23.358,23.87466667,24.395,24.919,25.45033333,25.985,
        26.523,27.06833333,27.61666667,28.168,28.72533333,29.286,29.85,30.41933333,30.99166667,31.567,
        32.14766667,32.731,33.317,33.90766667,34.50033333,35.095,35.695,36.29666667,36.9,37.508,
        38.11733333,38.728,39.34266667,39.95866667,40.576,41.19666667,41.81833333,42.441,43.06566667,43.69166667,
        44.319,44.94766667,45.577,46.207,46.83833333,47.47,48.102,48.73466667,49.36733333,50,
        50.63333333,51.26633333,51.899,52.531,53.16233333,53.793,54.42366667,55.05333333,55.682,56.30866667,
        56.93466667,57.56,58.18266667,58.804,59.424,60.042,60.658,61.272,61.88333333,62.49266667,
        63.1,63.704,64.30566667,64.905,65.50033333,66.09333333,66.684,67.26933333,67.85233333,68.433,
        69.00833333,69.581,70.151,70.71433333,71.275,71.833,72.38433333,72.93233333,73.477,74.01566667,
        74.55066667,75.082,75.606,76.12633333,76.643,77.15233333,77.65766667,78.159,78.653,79.14266667,
        79.628,80.10533333,80.57833333,81.047,81.50766667,81.96366667,82.415,82.85833333,83.29666667,83.73,
        84.15533333,84.57566667,84.991,85.39766667,85.79933333,86.196,86.58333333,86.966,87.344,87.712,
        88.07533333,88.434,88.78266667,89.12666667,89.466,89.79533333,90.11966667,90.439,90.74833333,91.05266667,
        91.352,91.642,91.927,92.207,92.47766667,92.74333333,93.004,93.25466667,93.50066667,93.742,
        93.97333333,94.20033333,94.423,94.63633333,94.84466667,95.048,95.24266667,95.433,95.619,95.79633333,
        95.96933333,96.138,96.298,96.454,96.606,96.75,96.89,97.026,97.15466667,97.27966667,
        97.401,97.51566667,97.62666667,97.734,97.83533333,97.93366667,98.029,98.11833333,98.20533333,98.29,98.36866667,
        98.44533333,98.52,98.59,98.65833333,98.725,98.78833333,98.85,98.91,98.96733333,99.024,
        99.08,99.134,99.18766667,99.241,99.29366667,99.34666667,99.4,99.45333333,99.50766667,
        99.563,99.62033333,99.67866667,99.738,99.80066667,99.86533333,99.932,99.95466667,99.97733333,100
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
        {_id:7      ,name: "unknow",               stamina: "1"},
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
      ];



    var notifications = [];     // Notifications

// ---------------------------------------------------------------------------

    var selRace, selNmeaport, selFriends;
    var cbFriends, cbOpponents, cbCertified, cbTeam, cbTop, cbReals, cbSponsors,cbTrackinfos, cbWithLastCmd,cbSelect, cbInRace, cbRouter, cbReuseTab, cbLocalTime, cbRawLog, cbNMEAOutput;
    var lbBoatname, lbTeamname, lbCycle;

    var divRaceStatus, divRecordLog, divFriendList, divRawLog;

    var selRaceNotif, divNotif,  lbRaceNotif, lbType1Notif, lbType2Notif, lbValNotif, lbMinNotif,  TextNotif;
    var cb2digits;
    var nbdigits = 0;
    

    Notification.requestPermission(function (status) {
        if (Notification.permission !== status) {
            Notification.permission = status;
        }
        console.log("Notifications status" + status);
    });


    function GoNotif(TitreNotif, TextNotif, icon, i) {
        var options = {
            "lang": "FR",
            "icon": "./img/"+icon + ".png",
            "image": "./img/bandeau.jpg",
            "body": TextNotif
        };
        var notif = new Notification(TitreNotif, options);
        notif.onclick = function(x) {
            notifications[i].repet = 4;
            console.log(formatTimeNotif(Date.now()) + " Repet : " + i + " / " + notifications[i].repet);
            window.focus();
            this.close();
        };
    } 
    // ---------------------------------------------------------------------------    


    function addSelOption(race, beta, disabled) {
        var option = document.createElement("option");
        option.text = race.name + (beta ? " beta" : "") + " (" + race.id.substr(0, 3) + ")";
        option.value = race.id;
        option.betaflag = beta;
        option.disabled = disabled;
        selRace.appendChild(option);

        // Ajout - Notifications -------------------
        var optionNotif = document.createElement("option");
        optionNotif.text = race.name;
        selRaceNotif.appendChild(optionNotif);
        // Fin ajout -------------------------------
    }

    function initRace(race, disabled) {
        race.tableLines = [];
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
        }
        xhr.open("GET", "http://zezo.org/races2.json");
        xhr.send();
    }



    function commonHeaders() {

        return '<th>' + "Rank" + '</th>'
             + '<th title="Distance To Leader">' + "DTL" + '</th>'
             + '<th title="Distance To Finish">' + "DTF" + '</th>'
             + '<th title="True Wind Direction">' + "TWD" + '</th>'
             + '<th title="True Wind Speed">' + "TWS" + '</th>'
             + '<th title="True Wind Angle">' + "TWA" + '</th>'
             + '<th title="Heading">' + "HDG" + '</th>';
    }

    function printLastCommand(lcActions) {
        var lastCommand = "";
        lcActions.map(function (action) {
            if (action.type == "heading") {
                lastCommand += (action.autoTwa ? " TWA" : " HDG") + "=" + Util.roundTo(action.value, 3+nbdigits) + " | ";
            } else if (action.type == "sail") {
                lastCommand += " Sail=" + sailNames[action.value];
            } else if (action.type == "prog") {
                action.values.map(function (progCmd) {
                    var progTime = formatDateUTC(progCmd.ts);
                    lastCommand += (progCmd.autoTwa ? " TWA" : " HDG") + "=" + Util.roundTo(progCmd.heading, 3+nbdigits) + " @ " + progTime + " | ";
                });
            } else if (action.type == "wp") {
                action.values.map(function (waypoint) {
                    lastCommand += " WP: " + Util.formatPosition(waypoint.lat, waypoint.lon) + " | ";
                });
            }
        });
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
            sailInfo = sailInfo + " (A " + autoSailTime + ")";
        } else {
            sailInfo = sailInfo + " (Man)";
        }
        
        var sailNameBG = r.curr.badSail ? LightRed : "lightgreen";
        if(drawTheme =='dark')
            sailNameBG = r.curr.badSail ? "darkred" : "darkgreen";

        // Remember when this message was received ...
        if (! r.curr.receivedTS) {
            r.curr.receivedTS = new Date();
        }
         // ... so we can tell if lastCalcDate was outdated (by more than 15min) already when we received it.
         var lastCalcDelta = r.curr.receivedTS - r.curr.lastCalcDate; 
        if(lastCalcDelta > 900000)   sailNameBG = 'red' ;

        return  '<td class="asail" style="background-color:' + sailNameBG + ';">' + sailInfo + "</td>";

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
            var currentTWA = Util.roundTo(Math.abs(r.curr.twa), 1);
            if((currentTWA == bestTwa.twaUp) || (currentTWA == bestTwa.twaDown))
             twaBG =  ' background-color:lightgreen;';
        }
        
        var hdgFG = isTWAMode ? "black" : "blue";
        var hdgBold = isTWAMode ? "font-weight: normal;" : "font-weight: bold;";
        if(drawTheme =='dark')
            hdgFG = isTWAMode ? "white" : "darkcyan"; 
        
        return '<td class="rank">' + (r.rank ? r.rank : "-") + '</td>'
            + '<td class="dtl">' + Util.roundTo(r.curr.distanceToEnd - r.bestDTF, 2+nbdigits) + '</td>'
            + '<td class="dtf">' + Util.roundTo(r.curr.distanceToEnd, 2+nbdigits) + '</td>'
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
            aSail : (uinfo.sail>10?"&#x24B6;":""),
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
            if(x > 1.2)
                res.xfactorStyle = 'style="color:red;"';
            else if(x > 0)
                res.xfactorStyle = 'style="color:orange ;"';
        
        }


        if (uid == currentUserId) {
            res.nameStyle = "color: #b86dff; font-weight: bold; ";
            res.bcolor = '#b86dff';
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



   function makeIntegratedHTML() {

        function vmg (speed, twa) {
            var r = Math.abs(Math.cos(twa / 180 * Math.PI));
            return speed * r;
        }
    
        function bestVMG(tws, polars, options) {
            var best = {"vmgUp": 0, "twaUp": 0, "vmgDown": 0, "twaDown": 0, "bspeed" :0,"btwa":0};
            if(!polars)
                return  best;
            var iS = fractionStep(tws, polars.tws);

            for (var twaIndex=25; twaIndex < 180; twaIndex++) {
                
		        var iA	= fractionStep(twaIndex, polars.twa);
                for (const sail of polars.sail) {
                    var f = foilingFactor(options, tws, polars.twa[iA.index], polars.foil);
                    var h = options.includes("hull") ? polars.hull.speedRatio : 1.0;
                    var rspeed = bilinear(iA.fraction, iS.fraction,
                                          sail.speed[iA.index-1][iS.index - 1],
                                          sail.speed[iA.index][iS.index - 1],
                                          sail.speed[iA.index-1][iS.index],
                                          sail.speed[iA.index][iS.index]);
                    var speed = rspeed  * f * h;
                    var vmg = speed * Math.cos(twaIndex / 180 * Math.PI);
                    if (vmg > best.vmgUp) {
                        best.twaUp = twaIndex;
                        best.vmgUp = vmg;
                    } else if (vmg < best.vmgDown) {
                        best.twaDown = twaIndex;
                        best.vmgDown = vmg;
                    }
                    if(speed>best.bspeed) {
                        best.bspeed = speed;
                        best.btwa = twaIndex;
                    }
                }
            }
            return  best;
        }

        var raceStatusHeader = '<tr>'
        + '<th title="Call Router">' + "RT" + '</th>'
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
        + '<th title="Position">' + "Position" + '</th>'
        + '<th title="Temps restant changement de voile">' + "Voile" + '</th>'
        + '<th title="Temps restant empannage">' + "Empannage" + '</th>'
        + '<th title="Temps restant virement">' + "Virement" + '</th>';       

        raceStatusHeader += '</tr>';

        var raceLine ="";
        var r = races.get(selRace.value);
        var raceId ="";
        let zUrl = "";
        let pUrl = "";
        let iUrl = "";
            
        let rzUrl = "";
        let rpUrl = "";
        let riUrl = ""; 
        if(!currentUserId ) {
            raceLine ="<tr><td>Joueur non détecté</td></tr>";
        } else if(r == undefined || r.curr == undefined) {
            raceLine ="<tr><td>Pas de course chargée</td></tr>";
        } else  {
            let p=  raceFleetMap.get(r.id).uinfo[currentUserId];

            raceId = r.id;


            var bestTwa = bestVMG(r.curr.tws, polars[r.curr.boat.polar_id], r.curr.options);
            var bestVMGString = bestTwa.twaUp + " | " + bestTwa.twaDown;
            var bestVMGTilte = Util.roundTo(bestTwa.vmgUp, 2+nbdigits) + "kts | " + Util.roundTo(Math.abs(bestTwa.vmgDown), 2+nbdigits) + "kts";
            var bspeedTitle = Util.roundTo(bestTwa.bspeed, 2+nbdigits) + "kts | " + bestTwa.btwa;
    
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
                var currentTWA = Util.roundTo(Math.abs(r.curr.twa), 1);
                if((currentTWA == bestTwa.twaUp) || (currentTWA == bestTwa.twaDown))
                twaBG =  ' background-color:lightgreen;';
            }
            
            var hdgFG = isTWAMode ? "black" : "blue";
            var hdgBold = isTWAMode ? "font-weight: normal;" : "font-weight: bold;";
            if(drawTheme =='dark')
                hdgFG = isTWAMode ? "white" : "darkcyan";
            
            var beta = selRace.options[selRace.selectedIndex].betaflag;
            
            zUrl = prepareZezoUrl(r.id, currentUserId, beta, false, false);
            pUrl = preparePolarUrl(r.id);
            if(r.url) rzUrl = "http://zezo.org/"+ r.url+"/chart.pl?";
            rpUrl = "http://inc.bureauvallee.free.fr/polaires/?race_id=" + raceId ;    
 
            iUrl = getITYCBase(raceId);
            riUrl =  getITYCFull(raceId);

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

            raceLine = '<tr id="rs:' + r.id + '" style="background-color:' + agroundBG + ';">';
            raceLine += (r.url ? ('<td class="tdc"><span id="rt:' + r.id + '">&#x2388;</span></td>') : '<td>&nbsp;</td>')
            raceLine += '<td class="tdc"><span id="pl:' + r.id + '">&#x26F5;</span></td>'
            raceLine += '<td class="tdc"><span id="ityc:' + r.id + '">&#x2620;</span></td>'         
                + '<td class="time" ' + lastCalcStyle + '>' + formatTimeNotif(r.curr.lastCalcDate) + '</td>'
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
                raceLine += '<td class="sail" ' + getBG(r.curr.tsEndOfSailChange) + '>' + formatSeconds(r.curr.tsEndOfSailChange - r.curr.lastCalcDate) + '</td>';
            else
                raceLine += '<td class="sail"> - </td>';
            if(r.curr.tsEndOfGybe)
                raceLine += '<td class="gybe" ' + getBG(r.curr.tsEndOfGybe) + '>' + formatSeconds(r.curr.tsEndOfGybe - r.curr.lastCalcDate) + '</td>';
            else
                raceLine += '<td class="gybe"> - </td>';
            if(r.curr.tsEndOfTack)
                raceLine += '<td class="tack" ' + getBG(r.curr.tsEndOfTack) + '>' + formatSeconds(r.curr.tsEndOfTack - r.curr.lastCalcDate) + '</td>';
            else
                raceLine += '<td class="tack"> - </td>';

            
                /* + '<td class="agrd" style="background-color:' + agroundBG + ';">' + (r.curr.aground ? "AGROUND" : "No") + '</td>'
                    + '<td class="man">' + (manoeuvering ? "Yes" : "No") + '</td>';
                */
                    
            raceLine += '</tr>';

            
    


            
        }
        "";
        var manifest = chrome.runtime.getManifest();
        let outputTable =  '<table id="raceStatusTable">'
            + '<thead>'
            + raceStatusHeader
            + '</thead>'
            + '<tbody>'
            + raceLine
            + '</tbody>'
            + '</table>';

        var mode = "pirate";



        
        return {order: "update",
        content:outputTable,
        newTab:cbReuseTab.checked,
        rid:raceId,
        zurl:zUrl,purl:pUrl,iurl:iUrl,
        rzurl:rzUrl,rpurl:rpUrl,riurl:riUrl,
        mode:mode,theme:drawTheme}
	}
    function computeEnergyPenalitiesFactor(stamina) {
        return stamina * -0.015 + 2;
    }
    function makeRaceStatusHTML() {
        function makeRaceStatusLine(pair) {

            function vmg (speed, twa) {
                var r = Math.abs(Math.cos(twa / 180 * Math.PI));
                return speed * r;
            }
        
            function bestVMG(tws, polars, options) {
                var best = {"vmgUp": 0, "twaUp": 0, "vmgDown": 0, "twaDown": 0, "bspeed" :0,"btwa":0};
                if(!polars)
                    return  best;
                var iS = fractionStep(tws, polars.tws);
                for (var twaIndex=0; twaIndex < polars.twa.length; twaIndex++) {
                    for (const sail of polars.sail) {
                        var f = foilingFactor(options, tws, polars.twa[twaIndex], polars.foil);
                        var h = options.includes("hull") ? polars.hull.speedRatio : 1.0;
                        var rspeed = bilinear(0, iS.fraction,
                                              sail.speed[twaIndex][iS.index - 1],
                                              sail.speed[twaIndex][iS.index - 1],
                                              sail.speed[twaIndex][iS.index],
                                              sail.speed[twaIndex][iS.index]);
                        var speed = rspeed  * f * h;
                        var vmg = speed * Math.cos(polars.twa[twaIndex] / 180 * Math.PI);
                        if (vmg > best.vmgUp) {
                            best.twaUp = polars.twa[twaIndex];
                            best.vmgUp = vmg;
                        } else if (vmg < best.vmgDown) {
                            best.twaDown = polars.twa[twaIndex];
                            best.vmgDown = vmg;
                        }
                        if(speed>best.bspeed) {
                            best.bspeed = speed;
                            best.btwa = polars.twa[twaIndex];
                        }
                    }
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
                
                var best = bestVMG(r.curr.tws, polars[r.curr.boat.polar_id], r.curr.options);
                var bestVMGString = best.twaUp + " | " + best.twaDown;
                var bestVMGTilte = Util.roundTo(best.vmgUp, 2+nbdigits) + "kts | " + Util.roundTo(Math.abs(best.vmgDown), 2+nbdigits) + "kts";
                var bspeedTitle = Util.roundTo(best.bspeed, 2+nbdigits) + "kts | " + best.btwa;
    
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
                tack  +=  "<p>-" + staminaLoose.tack + "% | " + computeEnergyRecovery(staminaLoose.tack,r.curr.tws) + "min</p>";
                var gybe =  "<p>-" + penalties.gybe.dist + "nm | " + penalties.gybe.time + "s</p>" 
                gybe += "<p>-"+staminaLoose.gybe + "% | " + computeEnergyRecovery(staminaLoose.gybe,r.curr.tws) + "min</p>";
                var sail =  "<p>-" + penalties.sail.dist + "nm | " + penalties.sail.time + "s</p>" 
                sail += "<p>-"+staminaLoose.sail + "% | " + computeEnergyRecovery(staminaLoose.sail,r.curr.tws) + "min</p>";    
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


                var returnVal = '<tr class="' + trstyle + '" id="rs:' + r.id + '">'
                    + (r.url ? ('<td class="tdc"><span id="rt:' + r.id + '">&#x2388;</span></td>') : '<td>&nbsp;</td>')
                    + '<td class="tdc"><span id="pl:' + r.id + '">&#x26F5;</span></td>'
                    + '<td class="tdc"><span id="wi:' + r.id + '"><img class="icon" src="./img/wind.svg"/></span></td>'
                    + '<td class="tdc"><span id="ityc:' + r.id + '">&#x2620;</span></td>'
                    + '<td class="name">' + r.name + '</td>'
                    +'<td class="time" ' + lastCalcStyle + '>' + formatTimeNotif(r.curr.lastCalcDate) + '</td>'
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
                    + '<td class="sail">' + sail + '</td>'
                    + '<td class="agrd" style="background-color:' + agroundBG + ';">' + (r.curr.aground ? "AGROUND" : "No") + '</td>'
                    + '<td class="man">' + (manoeuvering ? "Yes" : "No") + '</td>';
                
                if(cbWithLastCmd.checked)   
                    returnVal += '<td ' + lastCommandBG + '">' + lastCommand + '</td>';
                
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
            function computeStaminaLoose(tws,basePt,boatId)
            {
                    //take in account boat stamina
                var boatStamina = 1;
                if(boat2StaminaCoeff[boatId]) boatStamina = boat2StaminaCoeff[boatId].stamina;
                basePt *= boatStamina;
                /* 0 - 10 nds 0.02*v + 1
                    10 - 20 nds 0.03*v + 0.9
                    20 - 30 nds 0.05*v + 0.5 */
                let a = 0;
                let b = 0;         
                if(tws<10) {
                    a = 0.02;
                    b = 1;
                } else if(tws<20) {
                    a = 0.03;
                    b = 0.9;
                } else if(tws<30) {
                    a = 0.05;
                    b = .5;           
                } else {
                    a = 0;
                    b = 2;
                }         
                return ((a *tws + b)*basePt).toFixed(2);
            }
            var tws = r.curr.tws;
            
            return {
                "gybe" : computeStaminaLoose(tws, paramStamina.consumption.points.gybe, r.curr.boat.polar_id),
                "tack" : computeStaminaLoose(tws, paramStamina.consumption.points.tack, r.curr.boat.polar_id),
                "sail" : computeStaminaLoose(tws, paramStamina.consumption.points.sail, r.curr.boat.polar_id)
            };
        }

        function computeEnergyRecovery(pts,tws) {
            if(!tws) return "-";
            tws = tws.toFixed(1)*10;
            var ltws = paramStamina.recovery.loWind*10;
            var htws = paramStamina.recovery.hiWind*10;
            var lRecovery = paramStamina.recovery.loTime*60;
            var hRecovery = paramStamina.recovery.hiTime*60;
            var recoveryGap = hRecovery-lRecovery;  
            var minByPt = 1;
            if(tws<=ltws) {
                minByPt = lRecovery;
            } else  if(tws>=htws) {
                minByPt = hRecovery;
            } else {
                minByPt = (recoveryGap*refCurveRecovery[tws-ltws]/100)+lRecovery;
            }

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
            function penalty (speed, options, fraction, spec,boatcoeff) {
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
              fraction = refCurvePena[((tws-winch.lws)*10).toFixed(0)] /100;
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
                "sail" : penalty(speed, options, fraction, winch.sailChange,boatCoeff),
                "staminaFactor" : (record.curr.stamina?boatCoeff:"")
            };
        }
        var raceStatusHeader = '<tr>'
            + '<th title="Call Router">' + "RT" + '</th>'
            + '<th title="Call Polars">' + "PL" + '</th>'
            + '<th title="Call WindInfo">' + "WI" + '</th>'
            + '<th title="Call ITYC">' + "ITYC" + '</th>'
            + '<th>' + "Race" + '</th>'
            + '<th>' + "Time" + '</th>'
            + commonHeaders()
            + '<th title="Auto Sail time remaining">' + "aSail" + '</th>'
            + '<th title="Boat speed">' + "Speed" + '</th>'
            + '<th title="Boat VMG">' + "VMG" + '</th>'
            + '<th>' + "Best VMG" + '</th>'
            + '<th>' + "Best speed" + '</th>'
            + '<th title="Stamina">' + "Stamina" + '</th>'
            + '<th title="Approximated manoeuvring loose">' + "Empannage" + '</th>'
            + '<th title="Approximated manoeuvring loose">' + "Virement" + '</th>'
            + '<th title="Approximated manoeuvring loose">' + "Voile" + '</th>'
            + '<th title="Boat is aground">' + "Agnd" + '</th>'
            + '<th title="Boat is maneuvering, half speed">' + "Mnvr" + '</th>';
        if(cbWithLastCmd.checked)  
            raceStatusHeader += '<th >' + "Last Command" + '</th>';
        
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
            
            return '<tr>'
                + Util.genth("th_rt", "RT", "Call Router", Util.sortField == "none", undefined)
                + Util.genth("th_lu", "Date" + dateUTC(), undefined)
                + Util.genth("th_name", "Skipper", undefined, Util.sortField == "displayName", Util.currentSortOrder)
                + Util.genth("th_teamname", "Team", undefined, Util.sortField == "teamname", Util.currentSortOrder)
                + Util.genth("th_rank", "Rank", undefined, Util.sortField == "rank", Util.currentSortOrder)
                + Util.genth("th_dtu", "DTU", "Distance to Us", Util.sortField == "distanceToUs", Util.currentSortOrder)
                + Util.genth("th_dtf", "DTF", "Distance to Finish", Util.sortField == "dtf", Util.currentSortOrder)
                + Util.genth("th_twd", "TWD", "True Wind Direction", Util.sortField == "twd", Util.currentSortOrder)
                + Util.genth("th_tws", "TWS", "True Wind Speed", Util.sortField == "tws", Util.currentSortOrder)
                + Util.genth("th_twa", "TWA", "True Wind Angle", Util.sortField == "twa", Util.currentSortOrder)
                + Util.genth("th_hdg", "HDG", "Heading", Util.sortField == "heading", Util.currentSortOrder)
                + Util.genth("th_speed","Speed","Boat Speed", Util.sortField == 'speed', Util.currentSortOrder)
                + Util.genth("th_vmg","VMG","Velocity Made Good", Util.sortField == 'vmg', Util.currentSortOrder)
                + Util.genth("th_sail", "Sail", "Sail Used", Util.sortField == "sail", Util.currentSortOrder)
                + Util.genth("th_factor", "Factor", "Speed factor over no-options boat", undefined)
                + Util.genth("th_foils", "Foils", "Boat assumed to have Foils. Unknown if no foiling conditions", undefined)				
                + Util.genth("th_stamina", "Stamina", "Stamina Value. (penalities factor)", undefined)
                + recordRaceColumns()
                + Util.genth("th_psn", "Position", undefined)
                + Util.genth("th_options", "Options", "Options according to Usercard",  Util.sortField == "xoption_options", Util.currentSortOrder)
                + Util.genth("th_state", "State", "Waiting or Staying, Racing, Arrived, Aground or Bad TWA", Util.sortField == "state", Util.currentSortOrder)
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
                        return '<td class="eRT" title= "Start : ' + Util.formatShortDate(r.startDate,undefined,cbLocalTime.checked) + '">' + Util.formatDHMS(raceTime) + '</td>'  // Modif Class
                            + '<td class="eRT" title= "End : ' + Util.formatShortDate(r.eRT,undefined,cbLocalTime.checked) + '">' + Util.formatDHMS(r.eRT, 1+nbdigits) + '</td>'
                            + '<td class="avg">' + Util.roundTo(r.avgSpeed, 1+nbdigits) + '</td>';
                    } else {
                        if(r.startDate && r.state === "racing") {
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
                r.dtfC = Util.gcDistance(r.pos, race.legdata.end);
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
                } else {
                    bull = '&nbsp;';
                }                    
    
                if (r.team == true) {
                    bull += '<span style="color:Red;font-size:16px;"><b>&#9679;</b></span>';
                }
                if (r.followed == true || r.isFollowed == true) {
                    bull += '<span style="color:LimeGreen;font-size:16px;"><b>&#9679</b></span>';
                } else if (r.type == "real") {
                    bull = '&nbsp;<span style="color:Chocolate;font-size:16px;"><b>&#9679;</b></span>';
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
                }  else {
                    bull += '&nbsp;';
                }
                
                if (uid == currentUserId) {
                    bull = '&nbsp;<span>&#11088</span>';
                }
                // Fin Ajout - Puces colonne Skipper
    
                var lock;
                if (!r.isregulated) {
                    var lock = "";
                }
                if (r.isRegulated == true) {
                    // var lock = "&#128272;";
                    var lock = "<b>&#x24B6;</b>";
                }
                if (r.isRegulated == false) {
                    var lock = "&#x25EF;";
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


                if(!r.isVIP) r.isVIP="?";

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
                            xOptionsTxt = xOptionsTxt.replace("hull","H");

                        } 
                    }
                    var staminaTxt = "-";
                    if(r.stamina)
                    {
                        staminaTxt = Util.roundTo(r.stamina , 2) + "%";
                        staminaTxt += " (x" + Util.roundTo(computeEnergyPenalitiesFactor(r.stamina) , 2)+")" ;
                    }
                    return '<tr class="hovred" id="ui:' + uid + '">'
                        + (race.url ? ('<td class="tdc"><span id="rt:' + uid + '">&#x2388;</span></td>') : '<td>&nbsp;</td>')
                        + '<td class="time">' + formatTime(r.lastCalcDate) + '</td>'
                        + '<td class="Skipper" style="' + bi.nameStyle + '">' + bull + " " + bi.name + '</td>' 
                        + Util.gentd("Team","",null, r.teamname )
                        + Util.gentd("Rank","",null, (r.rank ? r.rank : "-"))
                        + Util.gentd("DTU","",null, (r.distanceToUs ? Util.roundTo(r.distanceToUs, 2+nbdigits) : '-') )
                        + Util.gentd("DTF","",null, ((r.dtf==r.dtfC)?"(" + Util.roundTo(r.dtfC,2+nbdigits) + ")":Util.roundTo(r.dtf,2+nbdigits)) )
                        + Util.gentd("TWD","",null, Util.roundTo(r.twd, 2+nbdigits) )
                        + Util.gentd("TWS","",null, Util.roundTo(bi.tws, 2+nbdigits) )
                        + Util.gentd("TWA", bi.twaStyle,null, Util.roundTo(bi.twa, 2+nbdigits) )
                        + Util.gentd("TWA", 'style="color: grey; align:center;"',null, lock )
                        + Util.gentd("HDG", 'style="color:' + hdgFG + '";"' + hdgBold ,null, Util.roundTo(bi.heading, 2+nbdigits) )
                        + Util.gentd("Speed","",null, Util.roundTo(bi.speed, 2+nbdigits) )
                        + Util.gentd("VMG","",null, Util.roundTo(r.vmg, 2+nbdigits))
//                        + Util.gentd("Sail","",null, '<span ' + bi.sailStyle + '>&#x25e2&#x25e3  </span>' + bi.sail )
                        + Util.gentd("Sail","",null, '<span ' + bi.sailStyle + '>&#x25e2&#x25e3  </span>' + bi.sSail )
                        + Util.gentd("Sail","",null,  bi.aSail )
                        + Util.gentd("Factor", bi.xfactorStyle,null, xfactorTxt )
                        + Util.gentd("Foils", null,null, (r.xoption_foils || "?") )
                        + Util.gentd("Stamina",bi.staminaStyle,null,staminaTxt)  
                        + recordRaceFields(race, r)
                        + Util.gentd("Position","",null, (r.pos ? Util.formatPosition(r.pos.lat, r.pos.lon) : "-") )
                        + Util.gentd("Options","",xOptionsTitle, xOptionsTxt)
                        + Util.gentd("State",null, 'title="' + txtTitle + '"', iconState )
                        + '</tr>';
                }
            }
        }
        if (rf === undefined || rf.table.length==0) {
            divFriendList.innerHTML = "No friend positions received yet";
        } else {
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
                + '<th>' + "Time" + dateUTC() + '</th>'
                + commonHeaders()
                + '<th title="Auto Sail time remaining">' + "aSail" + '</th>'
                + '<th title="Reported speed">' + "vR (kn)" + '</th>'
                + '<th title="Calculated speed (Δd/Δt)">' + "vC (kn)" + '</th>'
                + '<th title="Foiling factor">' + "Foils" + '</th>'
                + '<th title="Stamina">' + "Stamina" + '</th>'
                + '<th title="Calculated distance">' + "Δd (nm)" + '</th>'
                + '<th title="Time between positions">' + "Δt (s)" + '</th>'
                + '<th>' + "Position" + '</th>'
                + '<th title="Sail change time remaining">' + "Sail" + '</th>'
                + '<th title="Gybing time remaining">' + "Gybe" + '</th>'
                + '<th title="Tacking time remaining">' + "Tack" + '</th>'
                + '</tr>';
        }
        // Modif - display: none pour date locale / UTC
        if (cbLocalTime.checked) {
            var timeHidden = "display: none;";
            var timeLocalHidden = "";
        } else {
            var timeHidden = "";
            var timeLocalHidden = "display: none;";
        }
        // Fin Modif

        return '<style>'                    // Modif
            + '#UTC {' + timeHidden + '}'
            + '#UTCLocal {' + timeLocalHidden + '}'
            + '</style>'                    // Fin Modif
            + '<table>'
            + '<thead class="sticky">'
            + tableHeader ()
            + '</thead>'
            + '<tbody>'
            + (r === undefined ? "" : r.tableLines.join(" "))
            + '</tbody>'
            + '</table>';
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
                    delete raceFleet.uinfo[key].stamina;
                    delete raceFleet.uinfo[key].rank;
                    delete raceFleet.uinfo[key].lastStaminaUpdate;
                    delete raceFleet.uinfo[key].isRegulated;

                    /*record specific*/
                    delete raceFleet.uinfo[key].distanceToEnd;
                    delete raceFleet.uinfo[key].distanceFromStart;
                    delete raceFleet.uinfo[key].tsRecord;

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
                }
            }
        });
        
        fixMessageData(storedInfo, uid);
        
        if (race.type === "record") 
        {
            var storedStartDate = DM.getStartRaceTimePlayer(rid,uid);
            if(storedInfo.state == "racing")
            {
                
                if(!storedInfo.startDate || storedInfo.startDate=="-") {
                    if(storedStartDate  && storedStartDate != DM.raceOptionPlayerModel.startRaceTime) {
                        storedInfo.startDate = storedStartDate;
                    }
                } else
                {
                    if(storedStartDate != storedInfo.startDate)
                    {
                        var storedPlayerOption = DM.getRacePlayerInfos(rid,uid);
                        if(storedPlayerOption && storedPlayerOption.playerId != DM.raceOptionPlayerModel.playerId) {
                            storedPlayerOption.startRaceTime = storedInfo.startDate;
                            DM.addRaceOptionsList(rid,storedPlayerOption);
                            DM.saveRaceOptionsList();
                        }
    
                    }
                }
            } else {
                var storedPlayerOption = DM.getRacePlayerInfos(rid,uid);
                if(storedPlayerOption && storedPlayerOption.playerId != DM.raceOptionPlayerModel.playerId) {
                    storedPlayerOption.startRaceTime = "-";
                    DM.addRaceOptionsList(rid,storedPlayerOption);
                    DM.saveRaceOptionsList();
                }
            }
            
            
        }

        explainPlayerOptions(storedInfo);
        if(storedInfo.xoption_options == "---" || storedInfo.xoption_options == "?")
        {
            var storedPlayerOption = DM.getRaceOptionsPlayer(rid,uid);
            if(storedPlayerOption)
            {
                storedInfo.xoption_options = storedPlayerOption;
            }
     }

        if(storedInfo.isVIP ==  "?")
        {
            var playerData = DM.getPlayerInfos(uid);
            if(playerData && playerData.isVIP)
                storedInfo.isVIP =  playerData.isVIP;  
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

        if(document.getElementById("ITYC_record").checked) tr.addInfo(uid,storedInfo,race.type);
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

    function initFoils (boatData) {
        if (boatData.options) {
            for (const feature of boatData.options) {
                if (feature == "foil") {
                    return "0%";
                }
            }
            return "no";
        } else {
            return "?";
        }
    }

    function determineRankingCategory(savedOptions)
    {
        if(savedOptions == "Full Pack" || savedOptions == "All Options")
            return "Full Pack";
        else if(savedOptions == "-" || savedOptions == "?"|| savedOptions == "---")
        {
            return "-";
        } else {

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
            var categoryIndicator = 0;
            for (const opt of optionsList) {
                switch(opt)
                {
                    case "reach":
                        categoryIndicator += 204819277;
                        break;
                    case "light":
                        categoryIndicator += 180722892;
                        break;          

                    case "heavy":
                        categoryIndicator += 144578313;
                        break;           

                    case "winch":
                        categoryIndicator += 120481928;
                        break;
                    case "foil":
                        categoryIndicator += 265060241;
                        break;        
                    case "hull":
                        categoryIndicator += 84337349;
                        break;
                    default :
                        break;
                }        
            }

            if(categoryIndicator <= 240963855)
                return "PDD";        
            else if(categoryIndicator <= 500000000)
                return "1/2 Full Pack";  
            else
                return "Full Pack";
        
        }
    }

    function explainPlayerOptions(info)
    {
        info.xoption_foils = initFoils(info);
        info.xoption_sailOverlayer = "0%";
        info.xoption_options = "?";
        info.savedOption = "---";
        info.isVIP =  "?";
        
        if(info.preferredMapPreset)
        {
            info.isVIP =  "No";
            if (info.preferredMapPreset != "default") {
                info.isVIP =  "Yes";
            }
        }
        if (info.fullOptions === true) {
            info.xoption_options = "Full Pack";
            info.savedOption = "Full Pack";
            info.rankingCategory  = "Full Pack";
        } else if (info.options) {
            if (info.options.length == 8) {
                info.xoption_options = "All Options";
                info.savedOption = "All Options";
                info.rankingCategory  = "Full Pack";
            } else {
                var opt_sail = "[";
                var opt_perf = "[";
                for (const opt of info.options.sort()) {
                    if (opt == "reach" || opt == "light" || opt == "heavy") {
                        opt_sail += opt + ",";
                    }
                    if (opt == "winch" || opt == "foil" || opt == "hull" ){
                        opt_perf += opt + ",";
                    }
                    


                }
                opt_sail = opt_sail.substring(0,opt_sail.length-1);
                opt_perf = opt_perf.substring(0,opt_perf.length-1);
                if (opt_sail.length != "") opt_sail += "]";
                if (opt_perf.length != "") opt_perf += "]";                
                info.xoption_options = opt_sail + " " + opt_perf;
                info.savedOption = opt_sail + " " + opt_perf;
            }
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
                //here check for overspeed due to sail
                //spd = speedT *ff* hf *sf
                //sf = spd /  speedT *ff* hf
                var sf = info.speed / (speedT * foilFactor * hullFactor);
                if(sf >1.0 && sf <= 1.14) {
                    info.xplained = true;
                    info.xoption_sailOverlayer = "+"+Util.roundTo((sf-1.0)*100, 2) + "%";
                    info.xoption_foils = Util.roundTo(foils, 0) + "%";

                } else if(sf < 1.0) {
                    info.xplained = true;
                    info.xoption_sailOverlayer = "-"+Util.roundTo((1.0-sf)*100, 2) + "%";
                    info.xoption_foils = Util.roundTo(foils, 0) + "%";
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
            if(raceData) name = raceData.legName;
            tr.initMessage("fleet",rid,name,currentUserId);
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

    function formatLongDate(ts) {
        var tsOptions = {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            hour12: false
        };
        var d = (ts) ? (new Date(ts)) : (new Date());
        return new Intl.DateTimeFormat("lookup", tsOptions).format(d);
    }

    

    // Ajout - Notifications
    function setNotif() {        
        if (lbRaceNotif.value == "---") {
            alert ("Enregistrememnt impossible, sélectionnez une course !");
            return;
        }

        if (lbMinNotif.value) {    
            var nText = "<p><b>" + lbRaceNotif.value + " :</b> rappel vers " + formatTimeNotif(Date.now() + lbMinNotif.value * 60000) + " (heure locale).</p>";
            notifications.push({race: lbRaceNotif.value,
                                time: Date.now() + lbMinNotif.value * 60000,
                                repet: 0,
                                text: nText
                               }); 
        }

        if (lbType1Notif.value != "---" && lbType2Notif.value != "---" && lbValNotif.value) {
            var nTime;
            var nText = "<p><b>" + lbRaceNotif.value + " :</b> notification si le "
                    + lbType1Notif.value + " est " + lbType2Notif.value + " à " + lbValNotif.value + ".</p>";
                if(lbType1Notif.value == "TWA") {
                var nTWA = Util.roundTo(lbValNotif.value,1);
            } else if (lbType1Notif.value == "HDG") {
                var nHDG = Util.roundTo(lbValNotif.value,1);          
            } else if (lbType1Notif.value == "TWS") {
                var nTWS = Util.roundTo(lbValNotif.value,1);          
            } else if (lbType1Notif.value == "TWD") {
                var nTWD = Util.roundTo(lbValNotif.value,1);          
            }            
            notifications.push({race: lbRaceNotif.value,
                                twa: nTWA,
                                hdg: nHDG,
                                tws: nTWS,
                                twd: nTWD,
                                limite: lbType2Notif.value.substring(0,3),
                                repet: 0,
                                text: nText
                               });
        } else if (!lbMinNotif.value) {
            alert ("Enregistrememnt impossible, vérifiez les données !");
            return;
        }
        lbRaceNotif.value = "---";
        lbType1Notif.value = "---";
        lbType2Notif.value = "---";
        lbValNotif.value = "";
        lbMinNotif.value = "";
        afficheNotif();
            
    }
    
    function afficheNotif() {
        divNotif.innerHTML = "";
        for (var i = 0; i < notifications.length; i++) {
            if(notifications[i].repet < 3) {divNotif.innerHTML += notifications[i].text;}            
        }        
    }

    function showNotif(r) {

        function show(i) {     
            var repeat = notifications[i].repet;
            notifications[i].repet = repeat + 1;
            GoNotif(TitreNotif, TextNotif, icon, i);                            
        }
        
        var TitreNotif = r.name;
        var icon = 2;
        // Notification Echouement
        if (r.curr.aground == true) {
            TextNotif =  r.curr.displayName + " : vous êtes échoué !";
            GoNotif(TitreNotif, TextNotif, icon);
        }

        // Notification Mauvaise voile
        if (r.curr.badSail == true && r.curr.distanceToEnd > 1) {
            TextNotif = r.curr.displayName + " : vous naviguez sous mauvaise voile !";
            GoNotif(TitreNotif, TextNotif, icon);
        }

        for (var i = 0; i < notifications.length; i++) {
            var icon = 1;
            if(notifications[i].race == r.name && notifications[i].repet < 3){
                // Notification type rappel horaire
                // 300000 millisecondes = 5 minutes
                if (Date.now() > notifications[i].time - 300000 && Date.now() < notifications[i].time + 600000) {
                    var icon = 3;
                    TextNotif =  r.curr.displayName + " : rappel programmé à " + formatTimeNotif(notifications[i].time) + " !";
                    show(i);
                }
                
                // Notification type TWA
                if (notifications[i].twa) {
                    if (notifications[i].limite == "inf" && Util.roundTo(Math.abs(r.curr.twa), 1) <= notifications[i].twa) {
                        TextNotif =  r.curr.displayName + " : votre TWA est inférieur à " + notifications[i].twa + ".";
                        show(i);
                    } else if (notifications[i].limite == "sup" && Util.roundTo(Math.abs(r.curr.twa), 1) >= notifications[i].twa) {
                        TextNotif =  r.curr.displayName + " : votre TWA est supérieur à " + notifications[i].twa + ".";
                        show(i);
                    }    
                }

                // Notification type HDG
                if (notifications[i].hdg) {
                    if (notifications[i].limite == "inf" && Util.roundTo(Math.abs(r.curr.heading), 1) <= notifications[i].hdg) {
                        TextNotif =  r.curr.displayName + " : votre cap est inférieur à " + notifications[i].hdg + ".";
                        show(i);
                    } else if (notifications[i].limite == "sup" && Util.roundTo(Math.abs(r.curr.heading), 1) >= notifications[i].hdg) {
                        TextNotif =  r.curr.displayName + " : votre cap est supérieur à " + notifications[i].hdg + ".";
                        show(i);
                    }    
                }            

                // Notification type TWS
                if (notifications[i].tws) {
                    if (notifications[i].limite == "inf" && Util.roundTo(Math.abs(r.curr.tws), 1) <= notifications[i].tws) {
                        TextNotif =  r.curr.displayName + " : la force du vent est inférieure à " + notifications[i].tws + ".";
                        show(i);
                    } else if (notifications[i].limite == "sup" && Util.roundTo(Math.abs(r.curr.tws), 1) >= notifications[i].tws) {
                        TextNotif =  r.curr.displayName + " : la force du vent est supérieure à " + notifications[i].tws + ".";
                        show(i);
                    }    
                }            

                // Notification type TWD
                if (notifications[i].twd) {
                    if (notifications[i].limite == "inf" && Util.roundTo(Math.abs(r.curr.twd), 1) <= notifications[i].twd) {
                        TextNotif =  r.curr.displayName + " : la direction du vent est inférieure à " + notifications[i].twd + ".";
                        show(i);
                    } else if (notifications[i].limite == "sup" && Util.roundTo(Math.abs(r.curr.twd), 1) >= notifications[i].twd) {
                        TextNotif =  r.curr.displayName + " : la direction du vent est supérieure à " + notifications[i].twd + ".";
                        show(i);
                    }    
                }            
            }
        }
    }
    // Fin ajout - Notifications
    
    function exportPolar()
    {
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
      //  if(format="json")
        {
            Object.keys(polars).forEach(function (id) {
                var boatName = polars[id].label.split('/')[1]?polars[id].label.split('/')[1]:polars[id].label;
                boatName = boatName.replace('-','_');
                var ExportedData ="data_"+ boatName +" = '[";
                ExportedData += JSON.stringify(polars[id]);
                ExportedData += "]'"
                var boatName = polars[id].label.split('/')[1]?polars[id].label.split('/')[1]:polars[id].label;
                let blobData = new Blob([ExportedData], {type: "text/plain"});
                let url = window.URL.createObjectURL(blobData);
                saveFile(boatName+'.json',url);
            });


        }

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

    function exportStamina()
    {

        if(!paramStamina.consumption) return;
      //  if(format="json")
      var ExportedData = "stamina = ";
      ExportedData += JSON.stringify(paramStamina);
      let blobData = new Blob([ExportedData], {type: "text/plain"});
      let url = window.URL.createObjectURL(blobData);
      saveFile('stamina.json',url);  
    }
    function exportGraphData()
    {
        function printDate(tps) {
            var a = new Date(Number(tps));
            var year = a.getFullYear();
            var month = a.getMonth();
            var date = a.getDate();
            var hour = a.getHours();
            var min = a.getMinutes();
            var sec = a.getSeconds();
        
            if(hour<10) hour = "0"+hour;
            if(min<10) min = "0"+min;
            if(sec<10) sec = "0"+sec;
            
            var pDate = date + '/' + month + '/' + year + ' ' + hour + 'h' + min;
            if(sec!=0) pDate += ':' + sec ;
            return pDate;
        }
        function makeDataLine(id) {

            
            return stringToCopy;

        }


        var fileContent = "Race data\n";
        fileContent += "Date;"+printDate(Date.now()) +" \n";

        var race = races.get(selRace.value);
        if(race && race.recordedData) {
            let rid = selRace.value; 
            let recordedInfos = race.recordedData;
            var raceDatas = DM.getRaceInfos(rid);
            var raceName = raceDatas.legName?raceDatas.legName:raceDatas.name;

            fileContent += "RaceID;"+rid; 
            fileContent += "\n";
            fileContent += "Race Name;"+raceName.remExportAcc(); 
            fileContent += "\n\n";
            fileContent += "Time;TWS;TWD;TWA;HDG;Speed;Stamina;Sail\n";

            for(var i=0;i<recordedInfos.ts.length;i++) {
                fileContent += printDate(recordedInfos.ts[i])+";";
   

                fileContent += recordedInfos.tws[i]?((recordedInfos.tws[i] +";").replace(".",",")):";";
                fileContent += recordedInfos.twd[i]?((recordedInfos.twd[i] +";").replace(".",",")):";";
                fileContent += recordedInfos.twa[i]?((recordedInfos.twa[i] +";").replace(".",",")):";";
                fileContent += recordedInfos.hdg[i]?((recordedInfos.hdg[i] +";").replace(".",",")):";";
                fileContent += recordedInfos.bs[i]?((recordedInfos.bs[i] +";").replace(".",",")):";";
                fileContent += recordedInfos.stamina[i]?((recordedInfos.stamina[i] +";").replace(".",",")):";";
                fileContent += recordedInfos.sail.id[i]?(sailNames[recordedInfos.sail.id[i]].split(" ")[0] +";\n"):";\n";
            }

            
            let blobData = new Blob([fileContent], {type: "text/plain"});
            let url = window.URL.createObjectURL(blobData);
            let fileName = "graphData_";
            fileName += rid;
            fileName += ".csv";
            saveFile(fileName,url);
        }
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
        var res = str.substring(6);
        return  '<span id="small">&nbsp;(' + res + ')</span>';
    }

    // Ajout - Affichage Heure locale / Heure UTC
    function formatDateUTC(ts, dflt) {
        if (!ts && dflt) return dflt;
        var tsOptions = {
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false
         };
        var d = (ts) ? (new Date(ts)) : (new Date());
        var dtUTCLocal = new Intl.DateTimeFormat("lookup", tsOptions).format(d);
        tsOptions.timeZone = "UTC";
        var dtUTC = new Intl.DateTimeFormat("lookup", tsOptions).format(d);
        return '<span id="UTC">' + dtUTC + '</span><span id="UTCLocal">' + dtUTCLocal + '</span>';

    }
    // Fin ajout

    function formatTime(ts) {
        var tsOptions = {
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: false
        };
        var d = (ts) ? (new Date(ts)) : (new Date());
        if (!cbLocalTime.checked) {
            tsOptions.timeZone = "UTC";
        }
        return new Intl.DateTimeFormat("lookup", tsOptions).format(d);
    }

    function formatTimeNotif(ts) {
        var tsOptions = {
            hour: "numeric",
            minute: "numeric",
            hour12: false
        };
        var d = (ts) ? (new Date(ts)) : (new Date());
        return new Intl.DateTimeFormat("lookup", tsOptions).format(d);
    }

    function addTableCommandLine(r) {
        r.tableLines.unshift('<tr>'
            + '<td class="time">' + formatDateUTC(r.lastCommand.request.ts) + '</td>'           // Modif
            + '<td colspan="3">Command @ ' + formatDateUTC() + '</td>'                             // Modif
            + '<td colspan="16">Actions:' + printLastCommand(r.lastCommand.request.actions) + '</td>'
            + '</tr>');
        if (r.id == selRace.value) {
            divRecordLog.innerHTML = makeTableHTML(r);
        }
        // updateMapWaypoints(r);
    }

    function makeTableLine(r) {
        showNotif(r);       // Modification - Notifications
        if(document.getElementById("auto_clean").checked) fleetInfosCleaner();
        function isDifferingSpeed(speed) {
            return Math.abs(1 - r.curr.speed / speed) > 0.01;
        }

        function isCurrent(timestamp) {
            return (timestamp && (timestamp > r.prev.lastCalcDate));
        }

        function getBG(timestamp) {
            return isCurrent(timestamp) ? ('style="background-color: ' + ((drawTheme =='dark')?"darkred":LightRed) + ';"') : "";
        }

        function isPenalty() {
            return isCurrent(r.curr.tsEndOfSailChange)
                || isCurrent(r.curr.tsEndOfGybe)
                || isCurrent(r.curr.tsEndOfTack);
        }

        nbdigits=(cb2digits.checked?1:0);
        rt.set_nbdigit(nbdigits);
        var speedCStyle = "";
        var speedTStyle = "";
        var deltaDist = Util.roundTo(r.curr.deltaD, 2+nbdigits);


        if (isPenalty()) {
            speedCStyle = 'style="background-color: ' + ((drawTheme =='dark')?"darkred":LightRed) + ';"';
        } else if (isDifferingSpeed(r.curr.speedC)) {
            speedCStyle = 'style="background-color: yellow;';
            speedCStyle += (drawTheme =='dark')?' color:black;"':'"';

        } else if (r.curr.speedT && isDifferingSpeed(r.curr.speedT.speed)) {
            // Speed differs but not due to penalty - assume "Bad Sail" and display theoretical delta
            speedTStyle = 'style="background-color: ' + ((drawTheme =='dark')?"darkred":LightRed) + ';"';
            deltaDist = deltaDist + " (" + Util.roundTo(r.curr.deltaD_T, 2+nbdigits) + ")";
        }

        var sailChange = formatSeconds(r.curr.tsEndOfSailChange - r.curr.lastCalcDate);
        var gybing = formatSeconds(r.curr.tsEndOfGybe - r.curr.lastCalcDate);
        var tacking = formatSeconds(r.curr.tsEndOfTack - r.curr.lastCalcDate);

        var staminaStyle = "";
        if(r.curr.stamina)
        {
            if (r.curr.stamina < paramStamina.tiredness[0]) 
                staminaStyle = 'style="color:red"';
            else if (r.curr.stamina < paramStamina.tiredness[1]) 
                staminaStyle = 'style="color:orange"';
            else 
                staminaStyle = 'style="color:green"';   
        }
        return '<tr>'
            + '<td class="time">' + formatDateUTC(r.curr.lastCalcDate) + '</td>'    // Modif
            + commonTableLines(r)
            + infoSail(r,false)
            + '<td class="speed1">' + Util.roundTo(r.curr.speed, 2+nbdigits) + '</td>'
            + '<td class="speed2" ' + speedCStyle + '>' + Util.roundTo(r.curr.speedC, 2+nbdigits) + " (" + sailNames[(r.curr.sail % 10)] + ")" + '</td>'
            + '<td class="foils">' + (r.curr.speedT ? (Util.roundTo(r.curr.speedT.foiling, 0) + "%") : "-") + '</td>'
            + '<td class="stamina" ' +staminaStyle+'>' + (r.curr.stamina ? Util.roundTo(r.curr.stamina , 2) + "%": "-")  + '</td>'
            + '<td class="deltaD" ' + speedTStyle + '>' + deltaDist + '</td>'
            + '<td class="deltaT">' + Util.roundTo(r.curr.deltaT, 0) + '</td>'
            + '<td class="position">' + Util.formatPosition(r.curr.pos.lat, r.curr.pos.lon) + '</td>'
            + '<td class="sail" ' + getBG(r.curr.tsEndOfSailChange) + '>' + sailChange + '</td>'
            + '<td class="gybe" ' + getBG(r.curr.tsEndOfGybe) + '>' + gybing + '</td>'
            + '<td class="tack" ' + getBG(r.curr.tsEndOfTack) + '>' + tacking + '</td>'
            + '</tr>';
    }

    function saveMessage(r) {
        var newRow = makeTableLine(r);
        if(r.curr && r.curr.deltaT != 0)
        {   r.tableLines.unshift(newRow);
            if (r.id == selRace.value) {
                divRecordLog.innerHTML = makeTableHTML(r);
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
            selRace.value = raceId
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
        
        await DM.getRaceOptionsList(raceId);
        currentRaceId = raceId;
        makeRaceStatusHTML();
        divRecordLog.innerHTML = makeTableHTML(race);
        if(race.recordedData) {
            gr.upDateGraph(race.recordedData);
        }
        updateFleetHTML(raceFleetMap.get(raceId));
        buildlogBookHTML(race);
        rt.updateFleet(raceId,raceFleetMap);
        switchMap(race);

        NMEA.setActiveRace(raceId);
    }

    function getRaceLegId(id) {
        // work around for certain messages (Game_GetOpponents)
        // Modify to work for User_GetCard when no race selected (ie => race_id:0, leg_num:0)
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
                console.log(id);
                alert("Unknown race id format");
                return undefined;
            }
        }
    }

    function clearLog() {
        divRawLog.innerHTML = "";
    }

    function tableClick(ev) {
        var call_rt = false;
        var call_wi = false;
        var call_pl = false;
        var call_ityc = false;
        var friend = false;
        var tabsel = false;
        var cbox = false;
        var dosort = true;
        var rmatch;
        var re_rtsp = new RegExp("^rt:(.+)"); // Call-Router
        var re_polr = new RegExp("^pl:(.+)"); // Call-Polars
        var re_wisp = new RegExp("^wi:(.+)"); // Weather-Info
        var re_ityc = new RegExp("^ityc:(.+)"); // ITYC
        var re_rsel = new RegExp("^rs:(.+)"); // Race-Selection
        var re_usel = new RegExp("^ui:(.+)"); // User-Selection
        var re_tsel = new RegExp("^ts:(.+)"); // Tab-Selection
        var re_cbox = new RegExp("^sel_(.+)"); // Checkbox-Selection

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
            case "th_RaceTime":
                Util.set_sortField("RaceTime");
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

            case "th_flag":
                Util.set_sortField("country");
                break;                


 /*           case "th_flag2":
                Util.set_sortField("country";
                break;

            case "th_role":
                Util.set_sortField("role";
                break;*/


           

            case "th_options":
                Util.set_sortField("xoption_options");
                break;
            case "th_rt":
            case "th_brg":
            case "th_psn":
            case "th_foils":
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
            }  else if (match = re_rsel.exec(id)) {
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
            }
        }
        if (rmatch) {
            if (tabsel) {
                // Tab-Selection
                originClick= rmatch ;
                EX.extraRoute("hidden");
                display_selbox("hidden");
                for (var t = 1; t <= 8; t++) {
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
                    divNotif.innerHTML = "";
                    afficheNotif();
                } else if (rmatch == 8) {
   //                 updateUserConfigHTML();
                } 
            } else if (friend) {
                // Friend-Routing
                if (call_rt) callRouter(selRace.value, rmatch, false);
            } else if (cbox) {
                // Skippers-Choice
                changeState(ev_lbl);
                var tabClick = originClick; 
                if (tabClick == 2 || tabClick == 4 || tabClick == 5) {
                    updateFleetHTML(raceFleetMap.get(selRace.value));
                    lMap.updateMapFleet(races.get(selRace.value),raceFleetMap);
                }
            } else if (call_wi) callWindy(rmatch, 0); // weather
            else if (call_rt) callRouter(rmatch, currentUserId, false);
            else if (call_pl) callPolars(rmatch);
            else if (call_ityc) callITYC(rmatch);
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
        updateUserConfig();
        
    }

    function display_selbox(state) {
        selFriends.style.visibility = state;
    }




    function resize(ev) {
        for (var t = 1; t <= 8; t++) {
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

    function updatePosition(message, r) {
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
            r.curr.speedT = theoreticalSpeed(message.tws, message.twa, message.options, boatPolars);
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
            saveMessage(r);
        }
        if (message.gateGroupCounters) {
            r.gatecnt = message.gateGroupCounters;
            lMap.updateMapCheckpoints(r);
        }
        if(r.lMap && !EX.getDisplayFlag())
        {
            EX.extraMap(r);
        }
        makeRaceStatusHTML();

        if(r.recordedData) {
            gr.upDateGraph(r.recordedData);
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
            var twd = message.twd;
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
        var absVal = Math.abs(value);
        var index = 0;
        while (index < steps.length && steps[index] <= absVal) {
            index++;
        }
        if (index < steps.length) {
            return {
                index: index,
                fraction: (absVal - steps[index - 1]) / (steps[index] - steps[index - 1])
            }
        } else {
            return {
                index: index - 1,
                fraction: 1.0
            }
        }
    }

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
        if (userId != currentUserId) {
            uinfo = raceFleetMap.get(raceId).uinfo[userId];
            if (!uinfo) {
                alert("Can't find record for user id " + userId);
                return;
            }
            type = "friend";
        } else {
            uinfo = race.curr;
        }

        if (uinfo.lastCalcDate && withConfirm) {
            var now = new Date();
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

    function callRouterZezo(raceId, userId, beta, auto = false) {
        var urlBeta = races.get(raceId).url + (beta ? "b" : "");
        var url = prepareZezoUrl(raceId, userId, beta, auto);
        window.open(url, cbReuseTab.checked ? urlBeta : "_blank");
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
        var tinfo = "windy:" + r.url;
        window.open(url, cbReuseTab.checked ? tinfo : "_blank");
    }

    function preparePolarUrl(raceId) {
        var baseURL = "http://inc.bureauvallee.free.fr/polaires/?race_id=" + raceId;
        var race = races.get(raceId);

        var twa = Math.abs(Util.roundTo(race.curr.twa || 20, 0));
        var tws = Util.roundTo(race.curr.tws || 4, 1);

        if ((!race.curr.tws || !race.curr.twa ) && race.curr.state != "waiting") {
            alert("Missing TWA and/or TWS, calling polars with TWA=" + twa + "°, TWS=" + tws + "kn");
        }

        var url = baseURL + "&tws=" + tws + "&twa=" + twa;

        for (const option of race.curr.options) {
            url += "&" + race.curr.options[option] + "=true";
        }

        url += "&utm_source=VRDashboard";
        return url;

    }

    function callPolars(raceId) {
        var baseURL = "http://inc.bureauvallee.free.fr/polaires/?race_id=" + raceId;
        var url = preparePolarUrl(raceId)
        window.open(url, cbReuseTab.checked ? baseURL : "_blank");
    }

    function getITYCBase(raceId) {
        var r = races.get(raceId);
        var baseURL = "https://ityc.fr/autoSail.html?b=";
        baseURL += r.curr.boat.label.replace(" ","_");
        return baseURL;
    }

    function getITYCFull(raceId)  {
        var r = races.get(raceId);

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
                for (const opt of r.curr.options.sort()) {
                    if (opt == "reach" || opt == "light" || opt == "heavy") {
                        opt_sail += opt + ",";
                    }
                    if (opt == "winch" || opt == "foil" || opt == "hull" ){
                        opt_perf += opt + ",";
                    }
                }
                opt_sail = opt_sail.substring(0,opt_sail.length-1);
                opt_perf = opt_perf.substring(0,opt_perf.length-1);
                if (opt_sail.length != "") opt_sail += "]";
                if (opt_perf.length != "") opt_perf += "]";                
                options = opt_sail + " " + opt_perf;
            }
        }

        options = options.replace("reach","R");
        options = options.replace("light","L");
        options = options.replace("heavy","H");
        options = options.replace("winch","W");
        options = options.replace("foil","F");
        options = options.replace("hull","h");

        //build url
        var baseURL = getITYCBase(raceId);
        var url = baseURL+"&s="+sailNames[r.curr.sail % 10];
        url += "&o="+options;
        url += "&ts="+tws;
        url += "&ta="+twa;

        return url;

    }

    function callITYC(raceId) {
        var baseURL = getITYCBase(raceId);
        var url =  getITYCFull(raceId);
        window.open(url, cbReuseTab.checked ? baseURL : "_blank");
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
    var raceIdentification = '<table id="raceidTable">'
        + '<thead>'
        + '<tr>'
        + '<th colspan = 8>' + race.legdata.name + ' (' + race.id + ') VSR' + race.legdata.vsrLevel/*race.legdata.priceLevel*/ + ' ' + race.legdata.boat.name+'</th>'
        + '</tr>' 
        + '</thead>'
        + '</table>'
        + '<table id="raceidTable2">'
        + '<thead>'
        + '<tr>'
        + '<th colspan = 8>Credits</th>'
        + '</tr>' 
        + '<tr>'
        + '<th>Free Credits</th>'
        + '<th>Winch</th>'
        + '<th>Hull</th>'
        + '<th>Light</th>'
        + '<th>Reach</th>'
        + '<th>Heavy</th>'
        + '<th>Radio</th>'
        + '<th>Skin</th>'
        + '</tr>' 
        + '</thead>'
        + '<tbody>'
        + '<tr>'
        + '<td>'+ race.legdata.freeCredits + '</td>'
        + '<td>'+ race.legdata.optionPrices.winch + '</td>'
        + '<td>'+ race.legdata.optionPrices.hull + '</td>'
        + '<td>'+ race.legdata.optionPrices.light + '</td>'
        + '<td>'+ race.legdata.optionPrices.reach + '</td>'
        + '<td>'+ race.legdata.optionPrices.heavy + '</td>'
        + '<td>'+ race.legdata.optionPrices.radio + '</td>'
        + '<td>'+ race.legdata.optionPrices.skin + '</td>'
        + '</tr>'
        + '</tbody>'
        + '</table>';
        
    var raceStatusHeader = '<tr>'
    + '<th title="Type">' + "Type" + '</th>'
    + '<th title="Name">' + "Name" + '</th>'
    + '<th title="Id">' + "Id" + '</th>'
    + '<th title="Position">' + "Position" + '</th>'
    + '<th title="Position2">' + "Position2" + '</th>'
    + '<th>' + "Status" + '</th>';

    raceStatusHeader += '</tr>';

    var raceLine ="";
    
    raceLine += makelogBookLine("Start ",
                                race.legdata.start.name,
                                "Start",
                                race.legdata.start.lat,race.legdata.start.lon,
                                null,null,
                                "Date : "+ formatDateUTC(race.legdata.start.date) );

    if(race.legdata.checkpoints)
    {
        for (var i = 0; i < race.legdata.checkpoints.length; i++) {
            var cp = race.legdata.checkpoints[i];
            var cp_name = "invisible";
            if (cp.display != "none") cp_name = cp.display;  
            
            var g_passed = "";
            if (race.gatecnt && race.gatecnt[cp.group - 1]) {
                g_passed = "Passed";
            } // mark/gate passed - semi transparent

            raceLine += makelogBookLine(cp_name,
                                        cp.name,
                                        cp.group + "." + cp.id,
                                        cp.start.lat,cp.start.lon,
                                        cp.end?cp.end.lat:null,cp.end?cp.end.lon:null ,
                                        g_passed);  
        }
    }
    

    raceLine += makelogBookLine("End ",
                                race.legdata.end.name,
                                "End",
                                race.legdata.end.lat,race.legdata.end.lon,
                                race.legdata.end.radius?race.legdata.end.radius:null,null,
                                "Date : "+ formatDateUTC(race.legdata.end.date) );
 
    var raceBookTable = '<table id="raceStatusTable">'
    + '<thead>'
    + raceStatusHeader
    + '</thead>'
    + '<tbody>'
    + raceLine
    + '</tbody>'
    + '</table>';

    document.getElementById("raceBook").innerHTML = raceIdentification+raceBookTable;


}
async function initializeMap(race) {
        if (!race || !race.legdata) return; // no legdata yet;


        if (!race || !race.legdata) return; // no legdata yet;

        updateUserConfig();
        lMap.initialize(race,raceFleetMap);
        lMap.updateMapWaypoints(race); 
    }

    function updateUserConfig(e)
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
        localStorage["cb_sel_friends"] = (cbFriends.checked===true);
        localStorage["cb_sel_team"] = (cbTeam.checked===true);
        localStorage["cb_sel_opponents"] = (cbOpponents.checked===true);
        localStorage["cb_sel_top"] = (cbTop.checked===true);
        localStorage["cb_sel_certified"] = (cbCertified.checked===true);
        localStorage["cb_sel_reals"] = (cbReals.checked===true);
        localStorage["cb_sel_sponsors"] = (cbSponsors.checked===true);
        localStorage["cb_sel_selected"] = (cbSelect.checked===true);
        localStorage["cb_sel_inrace"] = (cbInRace.checked===true);
        
        
        
    }

    function saveOption(e) {
        localStorage["cb_" + this.id] = this.checked;
    }
    function saveOptionN(e) {
        localStorage["cb_" + this.id] = this.value;
    }
    function getOption(name) {
        var value = localStorage["cb_" + name];
        if (value !== undefined) {
            var checkBox = document.getElementById(name);
            if(checkBox) 
            {
                checkBox.checked = (value === "true");
                var event = new Event('change');
                checkBox.dispatchEvent(event);
            }

        }
    }
    function getOptionN(name) {
        var value = localStorage["cb_" + name];
        if (value !== undefined) {
            var inputBox = document.getElementById(name);
            if(inputBox) 
            {
                inputBox.value = value;
                var event = new Event('change');
                inputBox.dispatchEvent(event);
            }
            
        }
    }
    async function readOptions() {
        getOption("auto_router");
    //    getOption("markers");
        getOption("reuse_tab");
        getOption("local_time");
        getOption("nmea_output");
        getOption("2digits");
        getOption("color_theme");
        getOption("track_infos");
        getOption("with_LastCommand");
        getOption("vrzenPositionFormat");
        getOption("showBVMGSpeed");
        getOption("abbreviatedOption");
        getOption("fleet_team");
        getOption("fleet_rank");
        getOption("fleet_dtu" );
        getOption("fleet_dtf" );
        getOption("fleet_twd" );
        getOption("fleet_tws" );
        getOption("fleet_twa" );
        getOption("fleet_hdg" );
        getOption("fleet_vmg" );
        getOption("fleet_sail" );
        getOption("fleet_factor" );
        getOption("fleet_foils" );
        getOption("fleet_position" );
        getOption("fleet_options" );
        getOption("fleet_state" );
        getOption("ITYC_record");
        getOption("auto_clean");
        getOptionN("auto_cleanInterval");
        

        getOption("sel_friends");
        getOption("sel_team");
        getOption("sel_opponents");
        getOption("sel_top");
        getOption("sel_certified");
        getOption("sel_reals");
        getOption("sel_sponsors");
        getOption("sel_selected");
        getOption("sel_inrace");

        
        tracksState = getOption("sel_showTracksLmap");
        
        switchTheme();

        await DM.getTeamList();
        await DM.getPlayerList();
        await DM.getRaceList();
        
        updateUserConfig();
    }

    function addConfigListeners() {
 

        document.getElementById("auto_router").addEventListener("change", saveOption);
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
        document.getElementById("abbreviatedOption").addEventListener("change", saveOption);
        document.getElementById("fleet_team").addEventListener("change", saveOption);
        document.getElementById("fleet_rank").addEventListener("change", saveOption);
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

        }else
        {
            document.documentElement.setAttribute("data-theme", "light");
            document.getElementById("rt_close_popupLmap").src = "./img/close.png";
        }
        drawTheme = document.documentElement.getAttribute("data-theme");
        if(currentRaceId !=0)
            changeRace(currentRaceId);
        
        makeRaceStatusHTML();     
    }

  
    
    var initialize = function () {
        var manifest = chrome.runtime.getManifest();
        document.getElementById("lb_version").innerHTML = manifest.version;

        lbBoatname = document.getElementById("lb_boatname");
        lbTeamname = document.getElementById("lb_teamname");
        selRace = document.getElementById("sel_race");
        lbCycle = document.getElementById("lb_cycle");
        selNmeaport = document.getElementById("sel_nmeaport");
        selFriends = document.getElementById("sel_skippers");
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
        divRecordLog.innerHTML = makeTableHTML();
        cbRawLog = document.getElementById("cb_rawlog");
        divRawLog = document.getElementById("rawlog");
        // Ajout ---------------------------------------------
        cb2digits = document.getElementById("2digits");
        selRaceNotif = document.getElementById("sel_raceNotif");
        
        lbRaceNotif = document.getElementById("sel_raceNotif");
        lbType1Notif = document.getElementById("sel_type1Notif");
        lbType2Notif = document.getElementById("sel_type2Notif");
        lbValNotif = document.getElementById("sel_valNotif");
        lbMinNotif = document.getElementById("sel_minuteNotif");
        divNotif = document.getElementById("notif");
        // Fin ajout ------------------------------------------
        

        initRaces();

        var loadData = localStorage["polars"];
        if (loadData !== undefined) {
            var polarTable = loadData.split("/**/");
            polarTable.shift();
            polarTable.forEach(function (polar) {
                var polarData = JSON.parse(polar);
                polars[polarData._id] = polarData;
            });
        }

        loadData = localStorage["stamina"];
        if (loadData !== undefined) {
            paramStamina = JSON.parse(loadData);
        }

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
        EX.initialize();
        

        drawTheme = document.documentElement.getAttribute("data-theme");
        switchAddOnMode();
    }

    var callRouter = function (raceId, userId = currentUserId, auto = false) {
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

        if (!races.get(raceId)) {
            alert("Unsupported race #" + raceId);
        } else if (races.get(raceId).curr === undefined) {
            alert("No position received yet. Please retry later.");
        } else if (races.get(raceId).url === undefined) {
            alert("Unsupported race, no router support yet.");
        } else {
            callRouterZezo(raceId, userId, beta, auto);
        }
    }

    function reInitUI(newId) {
        if (currentUserId != undefined && currentUserId != newId) {
            // Re-initialize statistics
            disableRaces();
            races.forEach(function (race) {
                race.tableLines = [];
                race.curr = undefined;
                race.prev = undefined;
                race.lastCommand = undefined;
                race.rank = undefined;
                race.dtl = undefined;
                race.lMap = undefined;
            });
            makeRaceStatusHTML();
            divRecordLog.innerHTML = makeTableHTML();
            updateFleetHTML();
            buildlogBookHTML();
        };
    }

    


    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    function handleBoatInfo (message)  {
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
                        //todo save vsr rank                
                        lMap.set_currentId(currentUserId);
                        rt.set_currentId(currentUserId);
                    
                    }
                    handleLegInfo(message.leg);
                }
                if (message.bs) {
                    if (!currentUserId) {
                        alert("Logged-on user is unknown, please exit and re-enter VR Offshore!");
                        return;
                    }
                    if (currentUserId ==  message.bs._id.user_id) {
                        var isFirstBoatInfo =  (message.leg != undefined);
                        handleOwnBoatInfo(message.bs, isFirstBoatInfo);
                    } else {
                        handleFleetBoatInfo(message.bs);
                    }
                }
                if (message.track) {
                    if (message.track._id.user_id == currentUserId) {
                        handleOwnTrackInfo(message.track);
                    } else {
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
    }

    function handleFleet (requestData, message) {
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
                DM.savePlayerList();

                updateFleetHTML(raceFleetMap.get(selRace.value));
                lMap.updateMapFleet(race,raceFleetMap);
                rt.updateFleet(race,raceFleetMap);
 //               makeIntegratedHTML();

            } catch (e) {
                console.log(e + " at " + e.stack);;
            }
        }
    }


    function handleOwnBoatInfo (message, isFirstBoatInfo) {
        var raceId = getRaceLegId(message._id);
        var race = races.get(raceId);
        updatePosition(message, race);
        //message._id.user_id message.displayName
        if (isFirstBoatInfo && cbRouter.checked) {
            callRouter(raceId, currentUserId, true);
        }
        // Add own info on Fleet tab
        mergeBoatInfo(raceId, "usercard", message._id.user_id, message);
        
        rt.updateFleet(race,raceFleetMap);

        var fleet = raceFleetMap.get(raceId);
        var userId = message._id.user_id;

        if(fleet && fleet.uinfo[userId])
        {
            var playerData = Object.create(DM.playerModel);
            playerData.playerId = userId;
            playerData.displayName = message.displayName;
            playerData.country = message.personal.country;
            if(fleet.uinfo[userId].isVIP && fleet.uinfo[userId].isVIP!="?") playerData.isVIP =  fleet.uinfo[userId].isVIP;
            DM.addPlayerInfo(playerData) ;
            DM.makePlayerTable();  
            DM.savePlayerList();
            

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
                    DM.addRaceOptionsList(raceId,playerOptionsData);
                    DM.saveRaceOptionsList();
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

    function handleFleetBoatInfo(message) {
        var raceId = getRaceLegId(message._id);
        var race = races.get(raceId);
        var userId = getUserId(message);
        if ( message.rank == 1 ) {
            race.bestDTF = message.distanceToEnd;
        }
        
        mergeBoatInfo(raceId, "usercard", userId, message);


        rt.updateFleet(race,raceFleetMap);
        
        var fleet = raceFleetMap.get(raceId);

        if(fleet && fleet.uinfo[userId])
        {
            var playerData = Object.create(DM.playerModel);
            playerData.playerId = userId;
            playerData.displayName = message.displayName;
            playerData.country = message.personal.country;
            if(fleet.uinfo[userId].isVIP && fleet.uinfo[userId].isVIP!="?") playerData.isVIP =  fleet.uinfo[userId].isVIP;
            DM.addPlayerInfo(playerData) ;
            DM.makePlayerTable();  
            DM.savePlayerList();
            
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
                    DM.addRaceOptionsList(raceId,playerOptionsData);
                    DM.saveRaceOptionsList();
                }
            }
        }
        makeRaceStatusHTML();

        if(race.recordedData) {
            gr.upDateGraph(race.recordedData);
        }

        divRecordLog.innerHTML = makeTableHTML(race);
        updateFleetHTML(raceFleetMap.get(selRace.value));
        lMap.updateMapFleet(race,raceFleetMap);
        rt.updateFleet(race,raceFleetMap);
        document.dispatchEvent(new Event('change'))
    }
    
    function handleLegInfo (message) {
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
    //    initializeMap(race);
    //    initializeMapWindy(race);

    }


    function handleLegGetListResponse (response)  
    {
                // Contains destination coords, ice limits
        // ToDo: contains Bad Sail warnings. Show in race status table?
        var legInfos = response.scriptData.res;
        legInfos.map(function (legInfo) {
            var rid = legInfo.raceId + "." + legInfo.legNum;;
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
            raceData.end = legInfo.end.date;
            raceData.startDate = legInfo.start.date;
            DM.addRaceInfo(raceData) ;
        });
        //reinitialise race curr as no race open
        races.forEach(function (race) {
            race.curr = undefined;
        });
        DM.makeRaceTable();  
        DM.saveRaceList();
        makeRaceStatusHTML();
    }

    function handleGameAddBoatAction (request, response) {
        // First boat state message, only sent for the race the UI is displaying
        var raceId = getRaceLegId(request);
        var race = races.get(raceId);
        if (race != undefined) {
            race.lastCommand = {
                request: request,
                rc: response.scriptData.rc
            };
            addTableCommandLine(race);
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
            if(race.gmap && race.gmap.map) clearTrack(race.gmap.map,"_db_wp");
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

    function handleMetaGetPolar (response) {
        // Always overwrite cached data...
        polars[response.scriptData.polar._id] = response.scriptData.polar;
        var savedData = "";    
        Object.keys(polars).forEach(function (race) {
            savedData += "/**/"+JSON.stringify(polars[race]);
    
        });
        localStorage["polars"] = savedData;

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

    
    function handleUserGetCard (request, response) {
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
            DM.savePlayerList();
           DM.makeTeamTable();
            DM.saveTeamList();
            
            
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
                updateMapFleet(race);
                rt.updateFleet(race,raceFleetMap);
            }
        }
    }

    function handleGameGetSettings (response) {
        if(!response) return;
        if(response.scriptData.settings && response.scriptData.settings.stamina) {
            paramStamina = response.scriptData.settings.stamina;
            ;

            localStorage["stamina"] = JSON.stringify(paramStamina);    
        }
    }

    function handleTeamGet (response) {
        if(!response) return;
        var teamData = Object.create(DM.teamModel);
        teamData.teamId = response.scriptData.res.id;
        teamData.teamName = response.scriptData.res.def.name;
        teamData.teamsize = response.scriptData.res.def.members.length;
        if( response.scriptData.res.def.typ != undefined ) teamData.type = response.scriptData.res.def.type;
        if( response.scriptData.res.def.desc != undefined ) teamData.desc = response.scriptData.res.def.desc;
        DM.addTeamInfo(teamData);
        DM.makeTeamTable();
        DM.saveTeamList();

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
        DM.savePlayerList();    
    }

    function handleTeamGetList (response) {
        
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
        DM.saveTeamList();
    }

    function handleGameGetFollowedBoats (request, response) {
        var raceId = getRaceLegId(request);
        var race = races.get(raceId);
        updateFleet(raceId, "followed", response.scriptData.res);
        updateMapFleet(race);
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
        updateMapFleet(race);
        lMap.updateMapFleet(race,raceFleetMap);
        rt.updateFleet(race,raceFleetMap);
        if (raceId == selRace.value) {
            updateFleetHTML(raceFleetMap.get(selRace.value));
        }
    }
    
    function handleSocialGetPlayers (response) {
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
       DM.savePlayerList(); 
        DM.makeTeamTable();
        DM.saveTeamList();
    }
    function handleAccountDetailsResponse (response) {
        reInitUI(response.userId);
        currentUserId = response.userId;
        lMap.set_currentId(currentUserId);
        rt.set_currentId(currentUserId);
        lbBoatname.innerHTML = response.displayName;
        currentUserName = response.displayName;
        if(response.scriptData)
        {
            var playerData = Object.create(DM.playerModel);
            playerData.playerId = response.userId;
            playerData.displayName = response.displayName;
            if(response.location.city)   playerData.city = response.location.city;
            if(response.location.country) playerData.country = response.location.country;


            playerData.isVIP = response.scriptData.isVIP; 
            if(playerData.isVIP ==true) {
                var vipTag = document.getElementById("lb_boatvip");
                vipTag.innerHTML = "&nbsp;VIP&nbsp"; 
                vipTag.style.backgroundColor = ' #f7da03';   
                vipTag.style.color = 'black';  
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
            DM.savePlayerList();
            DM.makeTeamTable();
            DM.saveTeamList();       
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
                    handleBoatInfo(body.res);
                } else if (event == 'getfleet') {
                    handleFleet(postData, body.res);
                } else if (event == 'getlegranks') {
    //                handleLegRank(postData, body.res);
                } else{
                  if(postData == "" && body == "") {
                      var cycleString = msg.url.substring(45, 56);
                      var d = parseInt(cycleString.substring(0, 8));
                      var c = parseInt(cycleString.substring(9, 11));
                      var cycle = d * 100 + c;
                      if (cycle > currentCycle) {
                          currentCycle = cycle;
                          lbCycle.innerHTML = cycleString;
                      }
                  } else
                      if(cbRawLog.checked)console.info("Unhandled request " + msg.url + "with response" + JSON.stringify(msg.resp));
                }
            }
          sendResponse(makeIntegratedHTML());

        });


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
    function onMarkersChange() {
        var race = races.get(selRace.value);
        if (!race)  return;
        var markerState = rt.onMarkersChange(race);
        localStorage["cb_sel_showMarkers"] = markerState;
        localStorage["cb_sel_showMarkersLmap"] = markerState;

    }

    let tracksState = true;
    function onTracksChange() {
        var race = races.get(selRace.value);
        if (!race)  return;

        if(tracksState)
            tracksState = false;
        else
            tracksState = true;
    
        document.getElementById('sel_showTracksLmap').checked=tracksState;
        localStorage["cb_sel_showTracksLmap"] = tracksState;

        lMap.hideShowTracks(race);
    }

    function onGuideChange() {
        var race = races.get(selRace.value);
        if (!race)  return;
        EX.onGuideChange(race);

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
        setNotif: setNotif,
        onRouteListClick :onRouteListClick,
        onAddRoute:onAddRoute,
        onAddRouteLmap:onAddRouteLmap,
        onCleanRoute:onCleanRoute,
        onMarkersChange:onMarkersChange,
        onGuideChange:onGuideChange,
        onTracksChange:onTracksChange,
        exportPolar:exportPolar,
        exportStamina:exportStamina,
        exportGraphData:exportGraphData,
        graphCleanData:graphCleanData
        // Fin ajout -----------------
    }
}();

var expanded = false;

      
var tabId = parseInt(window.location.search.substring(1));


window.addEventListener("load", function () {

    controller.initialize();

    document.getElementById("bt_router").addEventListener("click", controller.callRouter);
    document.getElementById("sel_race").addEventListener("change", controller.changeRace);
    document.getElementById("sel_skippers").addEventListener("change", controller.updateFleetFilter);
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

    
    document.getElementById("bt_cleanGraph").addEventListener("click", controller.graphCleanData);
    document.getElementById("bt_exportGraphData").addEventListener("click", controller.exportGraphData);
    
    // Ajout ----------------------------------------------------------------------------
    document.getElementById("sel_raceNotif").addEventListener("change", controller.changeRace);
   
    document.getElementById("bt_notif").addEventListener("click", controller.setNotif);
    document.addEventListener("click", controller.tableClick);
    document.addEventListener("resize", controller.resize);

    
    
    // Fin ajout -------------------------------------------------------------------------
    controller.readOptions();
    controller.addConfigListeners();

    rt.initializeWebInterface();
    document.getElementById("route_list_tableLmap").addEventListener("click", controller.onRouteListClick);
    document.getElementById("route_list_tableLmap").addEventListener("input", controller.onRouteListClick);    
    document.getElementById("bt_rt_addLmap").addEventListener("click", controller.onAddRouteLmap);
    document.getElementById("lbl_rt_cleanLmap").addEventListener("click", controller.onCleanRoute);
    document.getElementById("lbl_showMarkersLmap").addEventListener("click", controller.onMarkersChange);
    document.getElementById("lbl_extraLmap").addEventListener("click", controller.onGuideChange);

    
    document.getElementById("lbl_showTracksLmap").addEventListener("click", controller.onTracksChange);
    


    
    


    gr.onLoad();


    // HEavy modified by SkipperDuMad ITYC.fr

});



