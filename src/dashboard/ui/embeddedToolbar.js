import { 
    roundTo
} from '../../common/utils.js';
import {formatHM,formatTimeNotif,infoSail,twaBackGround,getxFactorStyle,formatPosition,getBG} from './common.js'
import {sailNames} from "./constant.js"
import {getData,getLatestAndPreviousByTriplet} from '../../common/dbOpes.js';


import {getUserPrefs} from '../../common/userPrefs.js'

let buildEmbeddedToolbarContent  = {content:"",newTab:true,rid:null,theme:"dark",rstTimer:false,gameSize:100};

export async function buildEmbeddedToolbarHtml(raceId, legNum, connectedPlayerId)
{

    const userPrefs = getUserPrefs(); 
    const rid = raceId+"-"+legNum;

    let embeddedToolbarHeader = '<tr>'
        + '<th title="Call Router">' + "RT" + '</th>'
        + '<th title="Call Polars">' + "PL" + '</th>'
        + '<th>' + "Time" + '</th>'
        + '<th title="True Wind Direction">' + "TWD" + '</th>'
        + '<th title="True Wind Speed">' + "TWS" + '</th>'
        + '<th title="True Wind Angle">' + "TWA" + '</th>'
        + '<th title="Heading">' + "HDG" + '</th>'
        + '<th title="Boat speed / Speed factor / Foils usage">' + "Speed" + '</th>'
        + '<th title="Auto Sail time remaining">' + "aSail" + '</th>' 
        + '<th title="Boat VMG">' + "VMG" + '</th>'       
        + '<th title="Best VMG Up / Down">' + "Best VMG" + '</th>'
        + '<th title="Best speed angle (Sail) / Best speed">' + "Best speed" + '</th>'
        + '<th title="Stamina">' + "Stamina" + '</th>'
        + '<th title="Position">' + "Position" + '</th>';
    if(userPrefs.lang ==  "fr") {
        embeddedToolbarHeader += '<th title="Temps restant changement de voile">' + "Voile" + '</th>'
            + '<th title="Temps restant empannage">' + "Emp." + '</th>'
            + '<th title="Temps restant virement">' + "Vir." + '</th>';
    } else
    {
        embeddedToolbarHeader += '<th title="Time remaining sail change">' + "Sail" + '</th>'
            + '<th title="Time remaining tack">' + "Tack" + '</th>'
            + '<th title="Time remaining gybe">' + "Gybe" + '</th>';  
    }

    embeddedToolbarHeader += '</tr>';
    
    let embeddedToolbarLine = await buildEmbeddedToolbarLine(raceId, legNum, connectedPlayerId);
    const embeddedToolBarTable =  '<table id="raceStatusTable">'
                    + '<thead>'
                    + embeddedToolbarHeader
                    + '</thead>'
                    + '<tbody>'
                    + embeddedToolbarLine
                    + '</tbody>'
                    + '</table>';
    
    buildEmbeddedToolbarContent = {
        content:embeddedToolBarTable,
        newTab:userPrefs.global.reuseTab,
        rid:rid,
        theme:userPrefs.theme,
        rstTimer:false,
        gameSize:userPrefs.drawing.fullScreen?userPrefs.drawing.ratio:0 };
}
export function getbuildEmbeddedToolbarContent()
{
    return buildEmbeddedToolbarContent;
}

async function buildEmbeddedToolbarLine(raceId ,legNum,connectedPlayerId)
{

    let dashState = await getData('internal', 'state'); 
    dashState = dashState?.state?dashState.state:'dashInstalled'
    const playerInfo = (connectedPlayerId && connectedPlayerId!="")?(await getData('players', connectedPlayerId)):null;
    const userPrefs = getUserPrefs(); 
    let retVal = "";
    if(dashState == 'dashInstalled' || !connectedPlayerId || connectedPlayerId=="") {
        if(userPrefs.lang ==  "fr") {
            retVal ="<tr><td colspan='17'>❌ Joueur non détecté (<a href='https://www.virtualregatta.com/offshore-game/'>Relancer</a>)</td></tr>";
        } else {
            retVal ="<tr><td colspan='17'>❌ Player not detected (<a href='https://www.virtualregatta.com/en/offshore-game/'>Reload</a>)</td></tr>";    
        }
        return retVal;
    } else if(dashState == 'playerConnected' || !raceId || !legNum) {
        if(userPrefs.lang ==  "fr") {
            retVal ='<tr><td colspan="17">❌ Aucune course chargée (Joueur détecté: '+ playerInfo.name +')</td></tr>';
        } else
        {
            retVal ='<tr><td colspan="17">❌ No race loaded (Player detected: '+ playerInfo.name +')</td></tr>';            
        }
        return retVal;
    }

    

    const { latest, previous, meta } = await getLatestAndPreviousByTriplet(raceId, legNum, connectedPlayerId , {storeName: 'legPlayersInfos'});
    if(meta.timedOut || !latest) return;
    const raceIte = latest;
    const legInfos = await getData('legList', [raceId, legNum]); 
    if(!legInfos || !raceIte || !raceIte.metaDash) return;



    const best = raceIte.metaDash.bVmg;
    
    let bestVMGTxt = "";
    let bspeedTxt = "";
    if(best)
    {
        bestVMGTxt = "<div>" + '\u2197  ' + best.twaUp + ' ('+sailNames[best.sailUp % 10]+')';
        if(userPrefs.raceData.VMGSpeed)
            bestVMGTxt += ' (' + roundTo(bestTwa.vmgUp, 3) + 'kts )';
        bestVMGTxt += '</div>';
        bestVMGTxt += "<div>" + '\u2198  ' + best.twaDown + ' ('+sailNames[best.sailDown % 10]+')';
        if(userPrefs.raceData.VMGSpeed)
            bestVMGTxt += ' (' + roundTo(Math.abs(best.vmgDown), 3) + 'kts )';
        bestVMGTxt += '</div>';

        bspeedTxt += "<div>" + best.btwa + '° (' + sailNames[best.sailBSpeed % 10]+') </div>';
        bspeedTxt += "<div>" + roundTo(best.bspeed, 3) + 'kts</div>';
    }

    let speedTxtBg = "";
    if(raceIte.aground || raceIte.metaDash.manoeuvering)
    {
        speedTxtBg = 'style="background-color:' + userPrefs.theme =='dark'?"darkred":"LightRed" + ';';
    }

    const xfactorStyle = getxFactorStyle(raceIte);
    let xfactorTxt = roundTo(raceIte.metaDash.xfactor, 4);
    if(raceIte.metaDash.sailCoverage != 0 && raceIte.metaDash.xplained) {
        xfactorTxt += " " + raceIte.metaDash.sailCoverage +"%";
    }
    let speedTxt = '<div>'+ roundTo(raceIte.speed, 3) + '</div>';
    speedTxt += '<div class="xfactor"' + xfactorStyle + '>' + xfactorTxt + '</div>';
    speedTxt += '<div class="foil">'
    speedTxt += '<img " class="foilImg" src="'+ chrome.runtime.getURL('./img/foil.png') +'" >'
    speedTxt += raceIte.metaDash.realFoilFactor==null?"no":(raceIte.metaDash.realFoilFactor+"%");
    speedTxt += '</div>';

    let lastCalcStyle = ""
    if(raceIte.metaDash.deltaReceiveCompute > 900000) {
        lastCalcStyle = 'style="background-color: red;'
        lastCalcStyle += (userPrefs.theme =='dark')?' color:black;"':'"';
    }

    const isTWAMode = raceIte.isRegulated;
    const twaFG = (raceIte.twa < 0) ? "red" : "green";
    const twaBold = isTWAMode ? "font-weight: bold;" : "";
    let twaBG = " ";
    if(best)
    {
        twaBG = twaBackGround(raceIte.twa,best);
    }
    
    let hdgFG = isTWAMode ? "black" : "blue";
    const hdgBold = isTWAMode ? "font-weight: normal;" : "font-weight: bold;";
    if(userPrefs.theme =='dark')
        hdgFG = isTWAMode ? "white" : "darkcyan"; 

    let staminaStyle = "";
    let staminaTxt = "-";
    const stamina = raceIte.metaDash.realStamina;
    const setting = await getData("internal","paramStamina") ;
    const paramStamina = setting?.paramStamina;
    const manoeuver = raceIte.metaDash.manoeuver;
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

    if(raceIte.metaDash.coffeeBoost != 0 || raceIte.metaDash.chocoBoost != 0)
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

    let sailPenaTxt = '<td class="tack">';
    if(manoeuver?.sail)
        sailPenaTxt += '<div>-' +  manoeuver.sail.pena.dist + 'nm | ' + manoeuver.sail.pena.time + 's</div>'
    else
        sailPenaTxt += '<div>-</div>';
    if(raceIte.tsEndOfSailChange)
        sailPenaTxt += '<div ' + getBG(raceIte.tsEndOfSailChange) + '>' + formatSeconds(raceIte.tsEndOfSailChange - raceIte.iteDate) + '</div>';
    else
        sailPenaTxt += '<div> - </div>';
    sailPenaTxt += '</td>';
    let tackPenaTxt = '<td class="tack">';
    if(manoeuver?.tack)
        tackPenaTxt += '<div>-' +  manoeuver.tack.pena.dist + 'nm | ' + manoeuver.tack.pena.time + 's</div>'
    else
        tackPenaTxt += '<div>-</div>';
    if(raceIte.tsEndOfTack)
        tackPenaTxt += '<div ' + getBG(raceIte.tsEndOfTack) + '>' + formatSeconds(raceIte.tsEndOfTack - raceIte.iteDate) + '</div>';
    else
        tackPenaTxt += '<div> - </div>';
    tackPenaTxt += '</td>';
    let gybePenaTxt = '<td class="tack">';
    if(manoeuver?.tack)
        gybePenaTxt += '<div>-' +  manoeuver.gybe.pena.dist + 'nm | ' + manoeuver.gybe.pena.time + 's</div>'
    else
        gybePenaTxt += '<div>-</div>';
    if(raceIte.tsEndOfGybe)
        gybePenaTxt += '<div ' + getBG(raceIte.tsEndOfGybe) + '>' + formatSeconds(raceIte.tsEndOfGybe - raceIte.iteDate) + '</div>';
    else
        gybePenaTxt += '<div> - </div>';
    gybePenaTxt += '</td>';
    
    const timeLine = '<div>'+formatTimeNotif(raceIte.iteDate)+'</div><div id="dashIntegTime" class="textMini">'+'</div>';

    const rid = legInfos.id+"-"+legInfos.legNum;
    const zezoUrl = null; 
    
    retVal = '<tr id="rs:' + rid + '">';
    retVal += '<td class="tdc"><div>';
    retVal += '<span id="vrz:' + rid + '">&#x262F;</span>';
    retVal += '</div><div>';
    retVal += (zezoUrl ? ('<span class="zezoIcon" id="rt:' + rid + '">&#x2388;</span>') : '&nbsp;');
    retVal += '</div></td>';
    retVal += '<td class="tdc"><div>';
    retVal += '<span id="pl:' + rid + '">&#x26F5;</span>';
    retVal += '</div><div>';
    retVal += '<span id="ityc:' + rid + '">&#x2620;</span>';
    retVal += '</div></td>';

    retVal += '<td class="time" ' + lastCalcStyle + '>' +  timeLine + '</td>'
        + '<td class="twd">' + roundTo(raceIte.twd, 3) + '</td>'
        + '<td class="tws">' + roundTo(raceIte.tws, 3) + '</td>'
        + '<td class="twa" style="color:' + twaFG + ";" + twaBG + twaBold  + '">' + roundTo(Math.abs(raceIte.twa), 3) + '</td>'
        + '<td  class="hdg" style="color:' + hdgFG + ";" + hdgBold + '">' + roundTo(raceIte.hdg, 3) + '</td>'
        + '<td class="speed1"'+ speedTxtBg + '>' + speedTxt + '</td>' 
        + infoSail(raceIte,true)
        + '<td class="speed2">' + roundTo(raceIte.metaDash.vmg, 3) + '</td>'
        + '<td class="bvmg">' + bestVMGTxt + '</td>'
        + '<td class="bspeed">' + bspeedTxt +'</td>'
        + fullStamina
        + '<td class="position">' + (raceIte.pos ? formatPosition(raceIte.pos.lat, raceIte.pos.lon,true) : "-") + '</td>'
        + sailPenaTxt + gybePenaTxt + tackPenaTxt
        + '</tr>';
    return retVal;
    
}