   
import { 
    roundTo
} from '../../common/utils.js';
import {formatHM,formatTimeNotif,raceTableLines,infoSail,raceTableHeaders} from './common.js'

import {getConnectedPlayerId,
getRaceInfo,
getOpenedRaceId,
getLegList,
getParamStamina,
getOpenedRaceHistory,
getLegPlayerInfosHistory,
getLegPlayerInfos
} from '../app/memoData.js'


import {getUserPrefs} from '../../common/userPrefs.js'

export function buildRaceStatusHtml()
{
    const userPrefs = getUserPrefs(); 
    const connectedRace = getOpenedRaceId();
    const raceInfo = getRaceInfo();
    const raceItes = getLegPlayerInfos();
    const raceList = getLegList();

    if(!raceInfo || raceInfo?.length == 0 
      ||  !raceItes ) return;
    
    let raceStatusHeader = '<tr>'
        + '<th title="Call Router" colspan="2">' + "RT" + '</th>'
        + '<th title="Call Polars">' + "PL" + '</th>'
        + '<th title="Call WindInfo">' + "WI" + '</th>'
        + '<th title="Call ITYC">' + "ITYC" + '</th>'
        + '<th title="Open compass">' + "C" + '</th>'
        + '<th>' + "Race" + '</th>'
        + '<th>' + "Time" + '</th>'
        + raceTableHeaders()
        + '<th title="Auto Sail time remaining">' + "aSail" + '</th>'
        + '<th title="Boat speed">' + "Speed" + '</th>'
        + '<th title="Boat VMG">' + "VMG" + '</th>'
        + '<th>' + "Best VMG" + '</th>'
        + '<th>' + "Best speed" + '</th>'
        + '<th title="Stamina">' + "Stamina" + '</th>';
    if(userPrefs.lang ==  "fr") {
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
    if(userPrefs.raceData.lastCmd)  
        raceStatusHeader += '<th >' + "Last Command" + '</th>';
    raceStatusHeader += '<th title="ITYC option Status">' + "Co" + '</th>'
        
    raceStatusHeader += '</tr>';
    
    let tableContent = buildRaceStatusHtmlLine(raceInfo ,raceItes?.ites?.[0] ?? null);

    const openedRaceIdHistory = getOpenedRaceHistory();
    const legPlayerInfosHistory =getLegPlayerInfosHistory();

    for (const legId of Object.entries(openedRaceIdHistory)) {
        if(connectedRace.raceId != legId.raceId || connectedRace.legNum != legId.legNum)
        {
            const key = `${legId.raceId}-${legId.legNum}`;
            const legIte = legPlayerInfosHistory[key];
            const legInfo = raceList[key];
            if(legIte?.ites && legInfo) tableContent += buildRaceStatusHtmlLine(legInfo ,legIte.ites[0]);
        }
    }
    
    const tablecontainer = document.getElementById("raceStatus");
    tablecontainer.innerHTML =  '<table id="raceStatusTable">'
        + '<thead>'
        + raceStatusHeader
        + '</thead>'
        + '<tbody>'
        + tableContent
        + '</tbody>'
        + '</table>';

}

function buildRaceStatusHtmlLine(raceInfo ,raceIte)
{
    if(!raceIte || !raceInfo) return "";
    const userPrefs = getUserPrefs(); 
    let lastCommand = "-";
    let lastCommandBG = "";
    let agroundBG = raceIte.aground ? "LightRed" : "lightgreen";
    let mnvrBG = raceIte.metaDash?.manoeuvering ? "LightRed" : "lightgreen";
    
    if(userPrefs.theme =='dark') {
        agroundBG = raceIte.aground ? "darkred" : "darkgreen";
        mnvrBG = raceIte.metaDash?.manoeuvering ? "darkred" : "darkgreen";
    }

    /* todo handle boat action
    if (r.lastCommand != undefined) {
        // ToDo: error handling; multiple commands; expiring?
        var lcTime = formatTime(r.lastCommand.request.ts);
        lastCommand = printLastCommand(r.lastCommand.request.actions);
        lastCommand = "T:" + lcTime + " Actions:" + lastCommand;
        if (r.lastCommand.rc != "ok") {
            lastCommandBG = (drawTheme =='background-color:dark; ')?"background-color:darkred; ":"LightRed";
        }
    }
    */

    let info = "-";
    if (raceInfo.raceType === "leg") {
        info = '<span>' + raceInfo.legName + '</span>';
    } else if (raceInfo.raceType === "record") {
        if (raceInfo.record) {
            info = '<span>Record, Attempt ' + parseInt(raceInfo.record.attemptCounter) + '</span>';
        } else {
            info = '<span>-</span>'
        }
    }
    if (raceInfo.record?.lastRankingGateName) {
        info += '<br/><span>@ ' + raceInfo.record.lastRankingGateName + '</span>';
    }

    let trstyle = "hov";
    const raceIdFull = getOpenedRaceId();
    if (raceInfo.id === raceIdFull.raceId || raceInfo.legNum === raceIdFull.legNum) trstyle += " sel";

    const best = raceIte.metaDash?.bVmg;
    const bestVMGString = best?(best.twaUp + '<span class="textMini">°</span> | ' + best.twaDown + '<span class="textMini">°</span>'):'-';
    const bestVMGTilte = best?(roundTo(best.vmgUp, 3) + '<span class="textMini"> kts</span> | ' + roundTo(Math.abs(best.vmgDown), 3) + '<span class="textMini"> kts</span>'):'-';
    const bspeedTitle = best?(roundTo(best.bspeed, 3) + ' <span class="textMini">kts</span><br>' + best.btwa + '<span class="textMini">°</span>'):'-';

    let lastCalcStyle = ""
    if(raceIte.metaDash?.deltaReceiveCompute > 900000) {
        lastCalcStyle = 'style="background-color: red;'
        lastCalcStyle += (userPrefs.theme =='dark')?' color:black;"':'"';
    }

    const manoeuver = raceIte.metaDash?.manoeuver;
    const tack = manoeuver?("<p>-" +  manoeuver.tack.pena.dist + "nm | " + manoeuver.tack.pena.time + "s</p>"
             +  "<p>" + manoeuver.tack.energyLoose + "% | " + manoeuver.tack.energyRecovery + "min</p>"):'-';
    const gybe =  manoeuver?("<p>-" + manoeuver.gybe.pena.dist + "nm | " + manoeuver.gybe.pena.time + "s</p>" 
             + "<p>"+manoeuver.gybe.energyLoose + "% | " + manoeuver.gybe.energyRecovery + "min</p>"):'-';
    const sail =  manoeuver?("<p>-" + manoeuver.sail.pena.dist + "nm | " + manoeuver.sail.pena.time + "s</p>" 
             + "<p>"+manoeuver.sail.energyLoose + "% | " + manoeuver.sail.energyRecovery + "min</p>"):'-';    
    let staminaStyle = "";
    let staminaTxt = "-";

    const stamina = raceIte.metaDash?.realStamina;
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
        staminaTxt += " (x" + roundTo(manoeuver.staminaFactor , 2)+")" ;
    }

    let fullStamina = '<td class="stamina" ';

    if(raceIte.metaDash?.coffeeBoost != 0 || raceIte.metaDash?.chocoBoost != 0)
    {
        
        fullStamina += '><div class="textMini">';
        if(raceIte.metaDash.chocoBoost != 0) {
            fullStamina += '🍫+'+ roundTo(raceIte.metaDash.chocoBoost, 2)+'%';
            fullStamina += ' ⌚'+ formatHM(raceIte.metaDash.chocoExp-Date.now());
        }
        fullStamina += '</div>';

        fullStamina += '<div ' + staminaStyle +'>';
        fullStamina += staminaTxt;
        fullStamina += '</div>';
        fullStamina += '<div class="textMini">';
        if(raceIte.metaDash.coffeeBoost != 0) {
            fullStamina += '☕+'+ roundTo(raceIte.metaDash.coffeeBoost, 2)+'%';
            fullStamina += ' ⌚'+ formatHM(raceIte.metaDash.coffeeExp-Date.now());
        }
        fullStamina += '</div>';
        fullStamina += '</td>';
    
        //🍴
    } else
    {
        fullStamina += staminaStyle + '>' + staminaTxt  + '</td>';
    }

    let itycLedColor = "LightGrey";
/*
                
                if(document.getElementById("ITYC_record").checked)
                {
                    if(r.optITYCStatus) itycLedColor = "LimeGreen";
                    else  itycLedColor = "Red";
                }
*/
    const rid = raceInfo.raceId+"-"+raceInfo.legNum;
    
    const zezoUrl = raceInfo.zezoUrl?raceInfo.zezoUrl:null; 
    let returnVal = '<tr class="' + trstyle + '" id="rs:' + rid + '">'
    returnVal += (zezoUrl ? ('<td class="tdc"><span id="rt:' + rid + '">&#x2388;</span></td>') : '<td>&nbsp;</td>')
    returnVal +=  '<td class="tdc"><span id="vrz:' + rid + '">&#x262F;</span></td>'
    returnVal += '<td class="tdc"><span id="pl:' + rid + '">&#x26F5;</span></td>'
    returnVal += '<td class="tdc"><span id="wi:' + rid + '"><img class="icon" src="./img/wind.svg"/></span></td>'
    returnVal += '<td class="tdc"><span id="ityc:' + rid + '">&#x2620;</span></td>'
    returnVal += '<td class="tdc"><span id="cp:' + rid + '"><img class="icon" src="./img/compass.svg"/></span></td>'
    returnVal += '<td class="name">' + raceInfo.legName + '</td>'
    returnVal +='<td class="time" ' + lastCalcStyle + '>' + formatTimeNotif(raceIte.iteDate) + '</td>'
    returnVal += raceTableLines(raceIte,best)
    returnVal += infoSail(raceIte,false)
    returnVal += '<td class="speed1">' + roundTo(raceIte.speed, 3) + '</td>'
    returnVal += '<td class="speed2">' + (raceIte.metaDash?.vmg?roundTo(raceIte.metaDash.vmg, 3):'-') + '</td>'
    returnVal += '<td class="bvmg"><p>' + bestVMGString + '</p>';
        if(userPrefs.raceData.VMGSpeed) 
            returnVal += '<p>(' + bestVMGTilte + ')</p>';
    returnVal += '</td>'
    returnVal += '<td class="bspeed">' + bspeedTitle +'</td>'
    returnVal += fullStamina
    returnVal += '<td class="tack">' + tack + '</td>'
    returnVal += '<td class="gybe">' + gybe + '</td>'
    returnVal += '<td class="sailPenalties">' + sail + '</td>'
    returnVal += '<td class="agrd" style="background-color:' + agroundBG + ';">' + (raceIte.aground ? "AGROUND" : "No") + '</td>'
    returnVal += '<td class="man" style="background-color:' + mnvrBG + ';">' + (raceIte.metaDash?.manoeuvering ? "Yes" : "No") + '</td>';

    if(userPrefs.raceData.lastCmd)   
        returnVal += '<td ' + lastCommandBG + '">' + lastCommand + '</td>';

    returnVal += '<td><span style="color:'+itycLedColor+';font-size:16px;"><b>&#9679</b></span></td>';
    returnVal += '</tr>';
    return returnVal;
}
   
  