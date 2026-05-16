   
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
getLegPlayerInfos,
getLegPlayersOrder
} from '../app/memoData.js'


import {getUserPrefs} from '../../common/userPrefs.js'

export function buildRaceLogHtml() {
    const userPrefs = getUserPrefs();
    const raceInfo = getRaceInfo();
    const racePlayerInfos = getLegPlayerInfos();
    const raceOrder = getLegPlayersOrder();

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

    if(!raceInfo || raceInfo?.length == 0 
      ||  !racePlayerInfos?.ites) {
        document.getElementById("recordlog").innerHTML = `
            <div class="race-log-wrap"><table class="tabUser race-log-table">
            <thead><tr><th>No infos received for this race.</th></tr></thead>
            </table></div>`; 
        return;
    }

    let raceItes = racePlayerInfos.ites;
    if(raceOrder?.length) {
        raceItes = [...raceItes, ...raceOrder].sort((a, b) => b.iteDate - a.iteDate);
    }

    let raceLogContent = "";
    Object.keys(raceItes).forEach(key => {
        if(key!="info" && key!="options" && key!="team")
        {
            const raceLogLine = raceItes[key];
            if('action' in raceLogLine) raceLogContent += buildRaceLogLineCmd(raceLogLine);
            else raceLogContent += buildRaceLogLine(raceLogLine);
        }
    });

        
    const utcStyle = userPrefs.global.localTime ? 'display: none;' : '';
    const utcLocalStyle = userPrefs.global.localTime ? '' : 'display: none;';

    const logTxt = `
        <style>
            #UTC { ${utcStyle} }
            #UTCLocal { ${utcLocalStyle} }
        </style>
        <div class="race-log-wrap"><table class="tabUser race-log-table">
            <thead class="sticky">${raceLogTableHeader}</thead>
            <tbody>${raceLogContent}</tbody>
        </table></div>`;
    document.getElementById("recordlog").innerHTML = logTxt;
    updateToggleRaceLogCommandsLines();
}


function buildRaceLogLineCmd(raceLogLine) {
    if(!raceLogLine.action) return"";
    const commandWhen = raceLogLine.serverTs ? DateUTC(raceLogLine.serverTs, 2) : DateUTC(raceLogLine.iteDate);
    const actionType = raceLogLine.action.type;
    let actionTxt = 'Order';
    if(actionType === "sail") actionTxt = 'Sail';
    else if(actionType === "prog") actionTxt = 'Prog';
    else if(actionType === "wp") actionTxt = 'Waypoints';
    return '<tr class="commandLine hovred">'
        + '<td class="time">' + DateUTC(raceLogLine.iteDate, 1) + '</td>'
        + '<td colspan="19">'
        + '<div class="commandLineHeader"><span class="commandLineSub">' + actionTxt + '</span> <b>envoyée à ' + commandWhen + '</b></div>'
        + '<div class="command-grid">' + printLastCommand(raceLogLine.action) + '</div>'
        + '</td>'
        + '</tr>';
}
function printLastCommand(order) {
    const action = order.action;
    const items = [];

    if (order.type == "order") {
        items.push('<span class="command-grid-item command-order"><span class="lastCommandOrder">' + (action.autoTwa ? "TWA" : "HDG") + ' ' + roundTo(action.deg, 0) + '°</span></span>');
    } else if (order.type == "sail") {
        items.push('<span class="command-grid-item command-sail">Sail <span class="lastCommandOrder">' + sailNames[action.sailId] + '</span></span>');
    } else if (order.type == "prog" && Array.isArray(action)) {
        action.forEach(function (progCmd) {
            const progTime = DateUTC(progCmd.timestamp, 1);
            items.push('<span class="command-grid-item command-prog"><span class="lastCommandOrder">' +  progTime + ' - ' + (progCmd.autoTwa ? "TWA" : "HDG") + ' ' + roundTo(progCmd.deg, 0) + '°</span></span>');
        });
    } else if (order.type == "wp" && Array.isArray(action)) {
        action.forEach(function (waypoint) {
            items.push('<span class="command-grid-item command-wp">WP <span class="lastCommandOrder">' + formatPosition(waypoint.lat, waypoint.lon) + '</span></span>');
        });
    }

    return items.join('');
}
function buildRaceLogLine(raceIte)
{
    function isDifferingSpeed(realSpeed, calculatedSpeed) {
        return Math.abs(1 - realSpeed / calculatedSpeed) > 0.01;
    }




    const iteDash= raceIte.metaDash;
    const userPrefs = getUserPrefs();
    const darkTheme = userPrefs.theme=="dark";
    if(!raceIte.tws ) return"";

    const sailChange = formatSeconds(raceIte.tsEndOfSailChange - raceIte.iteDate);
    const gybing = formatSeconds(raceIte.tsEndOfGybe - raceIte.iteDate);
    const tacking = formatSeconds(raceIte.tsEndOfTack - raceIte.iteDate);

    let speedCStyle = "";
    let speedTStyle = "";
    let deltaDist = "";

    let staminaStyle = "";
    let staminaTxt = "-";

    const xfactorStyle = getxFactorStyle(raceIte);
    let xfactorTxt = "-";
    let foilTxt = "-";

    const stamina = iteDash?.realStamina;
    const paramStamina = getParamStamina();

    if(iteDash) {

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
        if (iteDash?.manoeuvering) {
            speedCStyle = 'style="background-color: ' + (darkTheme?"darkred":"LightRed") + ';"';
        }

        if(stamina)
        {
            if (stamina < paramStamina?.tiredness[0]) 
                staminaStyle = 'style="color:red";';
            else if (stamina < paramStamina?.tiredness[1]) 
                staminaStyle = 'style="color:orange";';
            else 
                staminaStyle = 'style="color:green";';   

            staminaTxt = roundTo(stamina , 2) + "%";
            staminaTxt += iteDash.manoeuver.staminaFactor?(" (x" + roundTo(iteDash.manoeuver.staminaFactor , 2)+")"):"" ;
        }

        xfactorTxt = roundTo(iteDash.xfactor, 4);
        if(iteDash.sailCoverage != 0 && iteDash.xplained) {
            xfactorTxt += " " + iteDash.sailCoverage +"%";
        }
        foilTxt = iteDash.realFoilFactor==null?"-":(roundTo(iteDash.realFoilFactor,0) + "%");
    }

    const speedCText = iteDash?.speedC?roundTo(iteDash.speedC, 3):"-";
    const deltaTText = iteDash?.deltaT?roundTo(iteDash.deltaT, 0):"-";

    return '<tr class="hovred">'
        + gentdRacelog("time", "time", null, "Time", DateUTC(raceIte.iteDate, 1))
        + raceTableLines(raceIte,iteDash?.bVmg)
        + infoSail(raceIte,false,false)
        + gentdRacelog("speed1", "reportedSpeed", null, "vR (kn)", roundTo(raceIte.speed, 3))
        + gentdRacelog("speed2", "calcSpeed", speedCStyle, "vC (kn)", (speedCText + " (" + sailNames[(raceIte.sail % 10)] + ")"))
        + gentdRacelog("foils", "foils", null, "Foils",foilTxt)
        + gentdRacelog("xfactor", "factor", xfactorStyle, "Factor", xfactorTxt)
        + gentdRacelog("stamina", "stamina", staminaStyle, "Stamina", (stamina ? roundTo(stamina , 2) + "%": "-"))
        + gentdRacelog("deltaD", "deltaDistance", speedTStyle, "Δd (nm)", deltaDist)
        + gentdRacelog("deltaT", "deltaTime", null, "Δt (s)", deltaTText)
        + gentdRacelog("position", "position", null, "Position", formatPosition(raceIte.pos.lat, raceIte.pos.lon))
        + '<td class="sailPenalties" ' + getBG(iteDash?.tsEndOfSailChange,iteDash?.previousIteDate) + '>' + sailChange + '</td>'
        + '<td class="gybe" ' + getBG(iteDash?.tsEndOfGybe,iteDash?.previousIteDate) + '>' + gybing + '</td>'
        + '<td class="tack" ' + getBG(iteDash?.tsEndOfTack,iteDash?.previousIteDate) + '>' + tacking + '</td>'
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

