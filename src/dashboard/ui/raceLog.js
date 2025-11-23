   
import { 
    roundTo
} from '../../common/utils.js';
import {raceTableLines,raceTableHeaders,
    genthRacelog,gentdRacelog,
    infoSail,getxFactorStyle,
    dateUTCSmall,DateUTC,formatPosition,formatSeconds,getBG
} from './common.js';

import {sailNames,sailColors} from "./constant.js"

import {getConnectedPlayerId,
getRaceInfo,
getOpenedRaceId,
getLegList,
getParamStamina,
getOpenedRaceHistory,
getLegPlayerInfosHistory,
getLegPlayerInfos,
getLegPlayersOrder
} from '../app/memoData.js'


import {getUserPrefs} from '../../common/userPrefs.js'

export function buildRaceLogHtml() {
    const userPrefs = getUserPrefs();
    const raceInfo = getRaceInfo();
    const racePlayerInfos = getLegPlayerInfos();
    const raceOrder = getLegPlayersOrder();

    if(!raceInfo || raceInfo?.length == 0 
      ||  !racePlayerInfos?.ites) return;
    let raceItes = racePlayerInfos.ites;
    if(raceOrder?.length) {
        raceItes = [...raceItes, ...raceOrder].sort((a, b) => b.iteDate - a.iteDate);
    }
    const raceLogTableHeader = '<tr>'
        + genthRacelog("th_rl_date", "dateTime", "Time" + dateUTCSmall())
        + raceTableHeaders()
        + genthRacelog("th_rl_aSail", "aSail", "aSail", "Auto Sail time remaining")
        + genthRacelog("th_rl_reportedSpeed", "reportedSpeed", "vR (kn)", "Reported speed")
        + genthRacelog("th_rl_calcSpeed", "calcSpeed", "vC (kn)", "Calculated speed (Δd/Δt)")
        + genthRacelog("th_rl_foils", "foils", "Foils", "Foiling factor")
        + genthRacelog("th_rl_factor", "factor", "Factor", "Speed factor")
        + genthRacelog("th_rl_stamina", "stamina", "Stamina", "Stamina Value. (penalities factor)")
        + genthRacelog("th_rl_deltaDistance", "deltaDistance", "Δd (nm)", "Calculated distance")
        + genthRacelog("th_rl_deltaTime", "deltaTime", "Δt (s)", "Time between positions")
        + genthRacelog("th_rl_psn", "position", "Position")
        + genthRacelog("th_rl_sail", "sail", "Sail", "Sail change time remaining")
        + genthRacelog("th_rl_gybe", "gybe", "Gybe", "Gybing time remaining")
        + genthRacelog("th_rl_tack", "tack", "Tack", "Tacking time remaining")
        + '</tr>';

        let raceLogContent = "";
        if(raceItes.length == 0) return; //TODO display empty raceLog
        for(let idx=0;idx<raceItes.length;idx++)
        {
                const raceLogLine = raceItes[idx];
                if('action' in raceLogLine)
                {
                    raceLogContent += buildRaceLogLineCmd(raceLogLine);
                } else {
                    raceLogContent += buildRaceLogLine(raceLogLine);
                }
            

        }
        Object.keys(raceItes).forEach(key => {
            if(key!="info" && key!="options" && key!="team")
            {
                const raceLogLine = raceItes[key];
                if('action' in raceLogLine)
                {
                    raceLogContent += buildRaceLogLineCmd(raceLogLine);
                } else {
                    raceLogContent += buildRaceLogLine(raceLogLine);
                }
            }
        });

        
    const utcStyle = userPrefs.global.localTime ? 'display: none;' : '';
    const utcLocalStyle = userPrefs.global.localTime ? '' : 'display: none;';

    const logTxt = `
        <style>
            #UTC { ${utcStyle} }
            #UTCLocal { ${utcLocalStyle} }
        </style>
        <table>
            <thead class="sticky">${raceLogTableHeader}</thead>
            <tbody>${raceLogContent}</tbody>
        </table>`;
    document.getElementById("recordlog").innerHTML = logTxt;
    updateToggleRaceLogCommandsLines();
}


function buildRaceLogLineCmd(raceLogLine) {
    if(!raceLogLine.action) return"";
    return '<tr class="commandLine hovred">'
    + '<td class="time">' + DateUTC(raceLogLine.iteDate, 1) + '</td>'
    + '<td colspan="19"><b>Command @ ' + (raceLogLine.serverTs ? DateUTC(raceLogLine.serverTs, 2) : DateUTC(raceLogLine.serverTs))
    + '</b> • <b>Actions</b> → ' + printLastCommand(raceLogLine.action) + '</td>'
    + '</tr>';
}
function printLastCommand(order) {
    let lastCommand = "";
    const action = order.action
    if (order.type == "order") {
        lastCommand += "<span class='lastCommandOrder'>" + (action.autoTwa ? " TWA" : " HDG") + " " + roundTo(action.deg, 0) + "°</span> • ";
    } else if (order.type == "sail") {
        lastCommand += " Sail <span class='lastCommandOrder'>" + sailNames[action.sailId] + "</span>";
    } else if (order.type == "prog") {
        action.map(function (progCmd) {
            const progTime = DateUTC(progCmd.timestamp, 1);
            lastCommand += "<span class='lastCommandOrder'>" + (progCmd.autoTwa ? " TWA" : " HDG") + " " + roundTo(progCmd.deg, 0) + "°</span> @ " + progTime + " • ";
        });
    } else if (order.type == "wp") {
        action.map(function (waypoint) {
            lastCommand += " WP <span class='lastCommandOrder'>" + formatPosition(waypoint.lat, waypoint.lon) + "</span> • ";
        });
    }
    lastCommand = lastCommand.replace(/ \•([^•]*)$/, "");
    return lastCommand;
}
function buildRaceLogLine(raceIte)
{
    function isDifferingSpeed(realSpeed, calculatedSpeed) {
        return Math.abs(1 - realSpeed / calculatedSpeed) > 0.01;
    }




    const iteDash= raceIte.metaDash;
    const userPrefs = getUserPrefs();
    const darkTheme = userPrefs.theme=="dark";
    if(!raceIte.tws || !iteDash ) return"";

    let speedCStyle = "";
    let speedTStyle = "";
    let deltaDist = "";

    if("deltaD" in iteDash
        && "speedC" in iteDash
        && "deltaD_T" in iteDash) {
        deltaDist = roundTo(iteDash.deltaD, 3);
        if (isDifferingSpeed(raceIte.speed,iteDash.speedC)) {
            speedCStyle = 'style="background-color: yellow;';
            speedCStyle += darkTheme?' color:black;"':'"';

        } else if (iteDash.speedT && isDifferingSpeed(raceIte.speed)) {
            // Speed differs but not due to penalty - assume "Bad Sail" and display theoretical delta
            speedTStyle = 'style="background-color: ' + (darkTheme?"darkred":"LightRed") + ';"';
            deltaDist = deltaDist + " (" + roundTo(iteDash.deltaD_T, 3) + ")";
        }
    }
    if (iteDash.manoeuvering) {
        speedCStyle = 'style="background-color: ' + (darkTheme?"darkred":"LightRed") + ';"';
    }

    const sailChange = formatSeconds(raceIte.tsEndOfSailChange - raceIte.iteDate);
    const gybing = formatSeconds(raceIte.tsEndOfGybe - raceIte.iteDate);
    const tacking = formatSeconds(raceIte.tsEndOfTack - raceIte.iteDate);

    let staminaStyle = "";
    let staminaTxt = "-";

    const stamina = iteDash.realStamina;
    const paramStamina = getParamStamina();
    if(stamina)
    {
        if (stamina < paramStamina?.tiredness[0]) 
            staminaStyle = 'style="color:red"';
        else if (stamina < paramStamina?.tiredness[1]) 
            staminaStyle = 'style="color:orange"';
        else 
            staminaStyle = 'style="color:green"';   

        staminaTxt = roundTo(stamina , 2) + "%";
        staminaTxt += iteDash.manoeuver.staminaFactor?(" (x" + roundTo(iteDash.manoeuver.staminaFactor , 2)+")"):"" ;
    }

    const xfactorStyle = getxFactorStyle(raceIte);

    let xfactorTxt = roundTo(iteDash.xfactor, 4);
    if(iteDash.sailCoverage != 0 && iteDash.xplained) {
        xfactorTxt += " " + iteDash.sailCoverage +"%";
    }
    const foilTxt = iteDash.realFoilFactor==null?"-":(roundTo(iteDash.realFoilFactor,0) + "%");
    return '<tr class="hovred">'
        + gentdRacelog("time", "time", null, "Time", DateUTC(raceIte.iteDate, 1))
        + raceTableLines(raceIte,iteDash.bVmg)
        + infoSail(raceIte,false,false)
        + gentdRacelog("speed1", "reportedSpeed", null, "vR (kn)", roundTo(raceIte.speed, 3))
        + gentdRacelog("speed2", "calcSpeed", speedCStyle, "vC (kn)", (roundTo(iteDash.speedC, 3) + " (" + sailNames[(raceIte.sail % 10)] + ")"))
        + gentdRacelog("foils", "foils", null, "Foils",foilTxt)
        + gentdRacelog("xfactor", "factor", xfactorStyle, "Factor", xfactorTxt)
        + gentdRacelog("stamina", "stamina", staminaStyle, "Stamina", (stamina ? roundTo(stamina , 2) + "%": "-"))
        + gentdRacelog("deltaD", "deltaDistance", speedTStyle, "Δd (nm)", deltaDist)
        + gentdRacelog("deltaT", "deltaTime", null, "Δt (s)", roundTo(iteDash.deltaT, 0))
        + gentdRacelog("position", "position", null, "Position", formatPosition(raceIte.pos.lat, raceIte.pos.lon))
        + '<td class="sailPenalties" ' + getBG(iteDash.tsEndOfSailChange,raceIte.metaDash.previousIteDate) + '>' + sailChange + '</td>'
        + '<td class="gybe" ' + getBG(iteDash.tsEndOfGybe,iteDash.previousIteDate) + '>' + gybing + '</td>'
        + '<td class="tack" ' + getBG(iteDash.tsEndOfTack,iteDash.previousIteDate) + '>' + tacking + '</td>'
        + '</tr>';


}



function updateToggleRaceLogCommandsLines() {
    const userPrefs = getUserPrefs();
    const commandLines = document.querySelectorAll('tr.commandLine');
    commandLines.forEach(function(line, index) {
        if (userPrefs.raceLog.hideLastCmd) {
            if ( index > 4) {
                line.style.display = 'none';
            }
        } else {
            line.style.display = '';
        }
    });
}

