   
import { 
    roundTo,isBitSet,guessOptionBits,
} from '../../common/utils.js';
import {genth,gentd,getxFactorStyle,formatDHMS,
    dateUTCSmall,formatPosition,formatTime,formatShortDate
} from './common.js';

import {sailNames,sailColors,categoryStyle, categoryStyleDark,category} from "./constant.js"

import {getConnectedPlayerId,
        getRaceInfo,
        getLegPlayerInfos,
        getLegFleetInfos,
        getLegSelectedPlayersState,
        setLegSelectedPlayers
} from '../app/memoData.js'

import {getUserPrefs} from '../../common/userPrefs.js'

import {getSortField, getSortOrder,setSortOrder,setSortField,isDisplayEnabled,compareFleetPlayers,FLEET_SORT_KEY_BY_TH_ID} from '../app/sortManager.js'


export function buildRaceFleetHtml() {
    const raceInfo         = getRaceInfo();
    const raceItes         = getLegPlayerInfos();
    const raceItesFleet    = getLegFleetInfos();
    const connectedPlayerId = getConnectedPlayerId();

    if (!raceInfo || raceInfo?.length === 0) return;

    // pas de flotte
    if (!raceItesFleet || Object.keys(raceItesFleet).length === 0) {
        document.getElementById("friendList").innerHTML = `
            <table id="raceidTable">
            <thead><tr><th>No friend positions received yet. Please enter a race.</th></tr></thead>
            </table>`;
        return;
    }

    // on prend l’ite courante pour le joueur connecté
    if (raceItes && raceItes.ites && raceItes.ites.length > 0) {
        raceItes.ite = raceItes.ites[0];
    }

    const sortField = getSortField();   // ex: "dtf", "speed", "displayName", ...
    const sortAsc   = getSortOrder();   // booléen, utilisé déjà par genth()

    // HEADER
    let raceFleetTableHeader = '<tr>'
        + genth("th_rt", "RT", "Call Router", undefined)
        + genth("th_lu", "Date" + dateUTCSmall(), undefined,      sortField == "lastCalcDate",   sortAsc)
        + genth("th_name", "Skipper", undefined,                   sortField == "displayName",    sortAsc)
        + genth("th_teamname", "Team", undefined,                  sortField == "teamname",       sortAsc)
        + genth("th_rank", "Rank", undefined,                      sortField == "rank",           sortAsc)
        + ((raceInfo.raceType !== "record")
            ? genth("th_racetime", "RaceTime", "Current Race Time", sortField == "raceTime",     sortAsc)
            : "")
        + genth("th_dtu", "DTU", "Distance to Us",                 sortField == "distanceToUs",  sortAsc)
        + genth("th_dtf", "DTF", "Distance to Finish",             sortField == "dtf",           sortAsc)
        + genth("th_twd", "TWD", "True Wind Direction",            sortField == "twd",           sortAsc)
        + genth("th_tws", "TWS", "True Wind Speed",                sortField == "tws",           sortAsc)
        + genth("th_twa", "TWA", "True Wind Angle",                sortField == "twa",           sortAsc)
        + genth("th_hdg", "HDG", "Heading",                        sortField == "heading",       sortAsc)
        + genth("th_speed","Speed","Boat Speed",                   sortField == "speed",         sortAsc)
        + genth("th_vmg","VMG","Velocity Made Good",               sortField == "vmg",           sortAsc)
        + genth("th_sail", "Sail", "Sail Used",                    sortField == "sail",          sortAsc)
        + genth("th_factor", "Factor", "Speed factor over no-options boat", sortField == "xfactor", sortAsc)
        + genth("th_foils", "Foils", "Boat assumed to have Foils. Unknown if no foiling conditions", sortField == "xoption_foils", sortAsc);

    if (raceInfo.raceType === "record") {
        raceFleetTableHeader +=
              genth("th_sd","Race Time", "Current Race Time",       sortField == "startDate",     sortAsc)
            + genth("th_eRT","ERT", "Estimated Total Race Time",    sortField == "eRT",           sortAsc)
            + genth("th_avgS","avgS", "Average Speed",              sortField == "avgSpeed",      sortAsc);
    }

    raceFleetTableHeader +=
          genth("th_psn", "Position", undefined)
        + genth("th_options", "Options", "Options according to Usercard",  sortField == "xoption_options", sortAsc)
        + genth("th_state", "State", "Waiting or Staying, Racing, Arrived, Aground or Bad TWA", sortField == "state", sortAsc)
        + genth("th_remove", "", "Remove selected boats from the fleet list", undefined)
        + '</tr>';

    const rows = Object.entries(raceItesFleet).map(([userId, entry]) => {
        const pInfos = (userId == connectedPlayerId) ? raceItes : entry;
        return { userId, pInfos };
    });

    rows.sort((a, b) => {
        const isAme = a.userId === connectedPlayerId;
        const isBme = b.userId === connectedPlayerId;

        if (isAme && !isBme) return -1;
        if (!isAme && isBme) return  1;

        return compareFleetPlayers(a.pInfos, b.pInfos, sortField, sortAsc);
    });

    let raceFleetLines = "";
    for (const { userId, pInfos } of rows) {
        raceFleetLines += buildRaceFleetLine(pInfos, raceInfo, connectedPlayerId);
    }

    const fleetHTML =
        '<table>'
        + '<thead class="sticky">'
        + raceFleetTableHeader
        + '</thead>'
        + '<tbody>'
        + raceFleetLines
        + '</tbody>'
        + '</table>';

    document.getElementById("friendList").innerHTML = fleetHTML;

    addEventListenersToRemoveSelectedBoatButtons();
    addEventListenersToSelectedLine();
    addEventListenersFleetSort();
}
    


function buildRaceFleetLine(playerFleetInfos,raceInfo,connectedPlayerId) {


    if(!playerFleetInfos || !raceInfo) 
        return "";
    const playerIte = playerFleetInfos.ite;
    if(!playerIte) 
        return "";
    const iteDash= playerIte.metaDash;
    if(!iteDash) 
        return "";
    const userPrefs = getUserPrefs();
    const darkTheme = userPrefs.theme=="dark";

    const userId = playerIte.userId;

    const isDisplay = isDisplayEnabled(playerIte, userId,connectedPlayerId) &&  ( !userPrefs.filters.inRace|| r.state == "racing" );
    if(!isDisplay) 
        return "";

    let iconState = "";
    let txtTitle="";
    if (playerIte.state == null) {
        iconState = '';
    } else if (playerIte.state == "racing" && playerIte.speed == 0 && playerIte.twa != 0) {
        iconState = '<span style="color:Red;">&#x2B24;</span>';
        txtTitle = "AGROUND !";
    } else if (playerIte.state == "racing" && playerIte.speed != 0) {
        iconState = '<span style="color:DodgerBlue;">&#x2B24;</span>';
        txtTitle = "Racing";
    } else if (playerIte.state == "arrived") {
        iconState = '<span style="color:Lime;">&#x2B24;</span>';
        txtTitle = "Arrived";
    } else if (playerIte.state == "waiting") {
        iconState = '<span style="color:DimGray;">&#x2a02;</span>';
        txtTitle = "Waiting";
    } else if (playerIte.state == "staying") {
        iconState = '<span style="color:DimGray;">&#x2a02;</span>';
        txtTitle = "Staying";
    } else {
        iconState = "-";
    }

    let bull = "";
    if (getLegSelectedPlayersState(userId)) {
        bull = '<span style="color:HotPink;font-size:16px;"><b>&#9679;</b></span>';
    }

    if (playerIte.team == true) {
        bull += '<span style="color:Red;font-size:16px;"><b>&#9679;</b></span>';
    }
    if (playerIte.followed == true || playerIte.isFollowed == true) {
        bull += '<span style="color:LimeGreen;font-size:16px;"><b>&#9679</b></span>';
    } else if (playerIte.type == "real") {
        bull = '<span style="color:Chocolate;font-size:16px;"><b>&#9679;</b></span>';
    } else {
        bull += '<span style="color:LightGrey;font-size:16px;"><b>&#9679;</b></span>';
    }
    
    if ( playerIte.type == "top") {
        bull += '<span style="color:GoldenRod;font-size:16px;"><b>&#9679;</b></span>';
    }
    if ( playerIte.type == "certified") {
        bull += '<span style="color:DodgerBlue;font-size:16px;"><b>&#9679;</b></span>';
    }
    if ( playerIte.type == "sponsor") {
        bull += '<span style="color:DarkSlateBlue;font-size:16px;"><b>&#9679;</b></span>';
    }
    
    if (userId == connectedPlayerId) {
        bull = '<span>&#11088</span>';
    }

    const teamName = playerFleetInfos.team?.id?playerFleetInfos.team.name:"";

    const xfactorStyle = iteDash?getxFactorStyle(playerIte):"";
    let xfactorTxt = "-";
    if(iteDash) {
        xfactorTxt = roundTo(iteDash.xfactor, 4);
        if(iteDash.sailCoverage != 0 && iteDash.xplained) {
            xfactorTxt += " " + iteDash.sailCoverage +"%";
        }
    }
    const isTWAMode = playerIte.isRegulated;
    let lock = "";
    if(isTWAMode == false)
        lock = "<span title='TWA Unlocked' class='cursorHelp'>&#x25EF;</span>";
    else if(isTWAMode == true)
        lock =  "<span title='TWA Locked' class='cursorHelp'>&#x24B6;</span>";
    
    const twaFG = 'style="color: ' + ((playerIte.twa < 0) ? "red" : "green") + ';"'

    const hdgFG = isTWAMode ? (darkTheme?"white":"black") : (darkTheme?"darkcyan":"blue");
    const hdgBold = isTWAMode ? "font-weight: normal;" : "font-weight: bold;";

    const {optionsTxt,optionsTitle,optionsStyle,foilsType} = drawOptions(playerFleetInfos.options);

    let routerIcon = '&nbsp;';
    if(userPrefs.router.sel = "zezo")
        if(raceInfo.zezoUrl) routerIcon = '<span id="rt:' + userId + '">&#x2388;</span>';
    else routerIcon = '<span id="vrz:' + userId + '">&#x262F;</span>';
    
    const nameClass = (userId == connectedPlayerId)?'highlightMe':"";
    const categoryIdx = category.indexOf(playerIte.type);
    const nameStyle = (userId == connectedPlayerId)?"color: #b86dff; font-weight: bold; "
                    :("color:"+(darkTheme?categoryStyleDark[categoryIdx].nameStyle:categoryStyle[categoryIdx].nameStyle)+";");

    
    const autoSail = (playerIte.sail > 10 ? "<span title='Auto Sails' class='cursorHelp'>&#x24B6;</span>" : "")
   
    const name = (playerIte.type == "sponsor")?
                    (playerIte.branding?.name?(playerFleetInfos.info.name + "(" + playerIte.branding.name + ")"):playerFleetInfos.info.name):playerFleetInfos.info.name;
    
    const sailStyle = 'style="color:'+sailColors[playerIte.sail]+'"';
    const sailName = sailNames[playerIte.sail%10] || "-";
    const foils = iteDash?.realFoilFactor==null?(foilsType?"no":"?"):(roundTo(iteDash.realFoilFactor,1)+"%")
    

    return '<tr class="' + nameClass + ' hovred" id="ui:' + userId + '">'
        + '<td class="tdc">' + routerIcon + '</td>'
        + gentd("Time","",null, formatTime(playerIte.iteDate, 1))
        + '<td class="Skipper" style="' + nameStyle + '"><div class="bull">' + bull + "</div> " + name + '</td>'
        + gentd("Team","",null, teamName )
        + gentd("Rank","",null, (playerIte.rank ? playerIte.rank : "-"))
        + ((raceInfo.raceType !== "record")?gentd("RaceTime","",null, (iteDash.raceTime ? formatDHMS(iteDash.raceTime) : "-")):"")
        + gentd("DTU","",null, (iteDash.DTU ? roundTo(iteDash.DTU, 3) : '-') )
        + gentd("DTF","",null, ((iteDash.dtf==iteDash.dtfC)?"(" + roundTo(iteDash.dtfC,3) + ")":roundTo(iteDash.dtf,3)) )
        + gentd("TWD","",null, roundTo(playerIte.twd?playerIte.twd:iteDash.twd, 3) )
        + gentd("TWS","",null, roundTo(playerIte.tws, 3) )
        + gentd("TWA", twaFG,null, roundTo(Math.abs(playerIte.twa), 3) )
        + gentd("TWAIcon", 'style="color:grey; align:center; text-align:center;"', null, lock)
        + gentd("HDG", 'style="color:' + hdgFG + '";"' + hdgBold ,null, roundTo(playerIte.hdg, 3) )
        + gentd("Speed","",null, roundTo(playerIte.speed, 3) )
        + gentd("VMG","",null, roundTo(iteDash.vmg, 3))
    //                        + Util.gentd("Sail","",null, '<span ' + bi.sailStyle + '>&#x25e2&#x25e3  </span>' + bi.sail )
        + gentd("Sail","",null, '<span ' + sailStyle + '>&#x25e2&#x25e3  </span>' + sailName )
        + gentd("SailIcon", 'style="color:grey; align:center; text-align:center;"', null, autoSail)
        + gentd("Factor", xfactorStyle,null, xfactorTxt )
        + gentd("Foils", "", null, foils)
        + recordRaceFields(raceInfo, playerIte)
        + gentd("Position","",null, (playerIte.pos ? formatPosition(playerIte.pos.lat, playerIte.pos.lon) : "-") )
        + gentd("Options",optionsStyle,optionsTitle, optionsTxt)
        + gentd("State", "", txtTitle, iconState)
        + gentd("Remove", "", null, (getLegSelectedPlayersState(userId) && userId != connectedPlayerId ? '<span class="removeSelectedBoat" data-id="' + userId + '" title="Remove this boat: ' + name + '">❌</span>' : ""))
        + '</tr>';
}

function recordRaceFields (raceInfo, playerIte) {
    const userPrefs = getUserPrefs();
    if (raceInfo.raceType === "record") {
        const localTimes = userPrefs.global.localTime;
        if (playerIte.state === "racing" && playerIte.distanceToEnd) {
            let t ;
            if(playerIte.metaDash.eRT) t = '<td class="eRT" title= "End : ' + formatShortDate(playerIte.metaDash.eRT,undefined,localTimes) + '">' + formatDHMS(playerIte.metaDash.eRT, 2) + '</td>';
            else t = '<td class="eRT" title= "End : unknow"></td>';
            return '<td class="eRT" title= "Start : ' + formatShortDate(playerIte.startDate,undefined,localTimes) + '">' + formatDHMS(playerIte.metaDash.raceTime) + '</td>'
                + t
                + '<td class="avg">' + roundTo(playerIte.metaDash.avgSpeed, 2) + '</td>';
        } else {
            if(playerIte.startDate && playerIte.state === "racing" && playerIte.startDate!="-") {
                //r.dtf can replace 
                let retVal = '<td class="eRT" title= "Start : ' + formatShortDate(playerIte.startDate,undefined,localTimes) + '">' + formatDHMS(playerIte.metaDash.raceTime) + '</td>';
        
                /* if(r.dtf)
                {
                    var distanceFromStart = calcCrow(r.pos, {lat: race.legdata.start.lat, lon:race.legdata.start.lon});
                    var estimatedSpeed = distanceFromStart / (raceTime / 3600000);
                    var eTtF = (r.dtf / estimatedSpeed) * 3600000;
                    r.avgSpeed = estimatedSpeed;
                    r.eRT = raceTime + eTtF;
                    retVal += '<td class="eRT" title= "End : ' + Util.formatShortDate(r.eRT,undefined,cbLocalTime.checked) + '">' + Util.formatDHMS(r.eRT, 2) + '</td>'
                    + '<td class="avg">' + Util.roundTo(r.avgSpeed, 2) + '</td>';                            
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

function drawOptions(playerOptions) {
    const userPrefs = getUserPrefs();
    let optionsTxt = "";
    let optionsStyle = "";
    let optionsTitle = "";
    let foilsType = false;

    if(!playerOptions)
        return {optionsTxt:"",optionsTitle:"",optionsStyle:"",foilsType:false};

    let optSail = "";
    let optPerf = "";
    if(playerOptions.options) 
    {
        const pOptions = playerOptions.options;
        
        if(pOptions.light || pOptions.reach || pOptions.heavy)
            optSail = "[";
        if(pOptions.reach) optSail += "reach,";
        if(pOptions.light) optSail += "light,";
        if(pOptions.heavy) optSail += "heavy,";

        if(pOptions.foil || pOptions.winch || pOptions.hull
            || pOptions.comfortLoungePug || pOptions.magicFurler || pOptions.vrtexJacket
        )
            optPerf = "[";
        if(pOptions.winch) optPerf += "winch,";
        if(pOptions.foil) {optPerf += "foil,";foilsType = true;}
        if(pOptions.hull) optPerf += "hull,";
        if(pOptions.comfortLoungePug) optPerf += "comfortLoungePug,";
        if(pOptions.magicFurler) optPerf += "magicFurler,";
        if(pOptions.vrtexJacket) optPerf += "vrtexJacket,";

    } else if(playerOptions.guessOptions  && playerOptions.guessOptions!= 0)
    {
        const pOptions = playerOptions.guessOptions;
        if(isBitSet(pOptions,guessOptionBits["reach"])
        || isBitSet(pOptions,guessOptionBits["light"])
        || isBitSet(pOptions,guessOptionBits["heavy"]))
            optSail ="[";
        
        if(isBitSet(pOptions,guessOptionBits["reach"])) optSail += "reach,";
        if(isBitSet(pOptions,guessOptionBits["light"])) optSail += "light,";
        if(isBitSet(pOptions,guessOptionBits["heavy"])) optSail += "heavy,";

        if((isBitSet(pOptions,guessOptionBits["winchDetected"]) && isBitSet(pOptions,guessOptionBits["winch"]))
        || (isBitSet(pOptions,guessOptionBits["foilDetected"]) && isBitSet(pOptions,guessOptionBits["foil"]))
        || (isBitSet(pOptions,guessOptionBits["hullDetected"]) && isBitSet(pOptions,guessOptionBits["hull"])))
            optPerf ="[";

        if(isBitSet(pOptions,guessOptionBits["winchDetected"]) && isBitSet(pOptions,guessOptionBits["winch"]))
            optPerf += "winch,";
        if(isBitSet(pOptions,guessOptionBits["foilDetected"]) && isBitSet(pOptions,guessOptionBits["foil"]))
        {    optPerf += "foil,";foilsType = true;}
        if(isBitSet(pOptions,guessOptionBits["hullDetected"]) && isBitSet(pOptions,guessOptionBits["hull"]))
            optPerf += "hull,";
        optionsStyle = 'style="font-style: italic;"';

    }
    
    if(optSail.length !=0) 
    {
        optSail = optSail.substring(0,optSail.length-1);
        optSail += "]";
    }
    if(optPerf.length !=0) 
    {
        optPerf = optPerf.substring(0,optPerf.length-1);
        optPerf += "]";
    }

    if(optSail.length !=0 && optPerf.length !=0)
        optionsTxt = optSail + " " + optPerf ;
    else if(optSail.length !=0 && optPerf.length ==0)
        optionsTxt = optSail;
    else if(optSail.length ==0 && optPerf.length !=0)
        optionsTxt = optPerf ;
    else if(!playerOptions.guessOptions  || playerOptions.guessOptions == 0)
        optionsTxt = "?";

    optionsTitle = optionsTxt;
    if(userPrefs.fleet.shortOption)
    {
        optionsTxt = optionsTxt.replace("All Options","AO");
        optionsTxt = optionsTxt.replace("Full Pack","FP");
        optionsTxt = optionsTxt.replace("reach","R");
        optionsTxt = optionsTxt.replace("light","L");
        optionsTxt = optionsTxt.replace("heavy","H");
        optionsTxt = optionsTxt.replace("winch","W");
        optionsTxt = optionsTxt.replace("foil","F");
        optionsTxt = optionsTxt.replace("hull","h");
        optionsTxt = optionsTxt.replace("magicFurler","M");
        optionsTxt = optionsTxt.replace("vrtexJacket","J");
        optionsTxt = optionsTxt.replace("comfortLoungePug","C");
    }
    return {optionsTxt:optionsTxt,optionsTitle:optionsTitle,optionsStyle:optionsStyle,foilsType : foilsType};

}

function addEventListenersToRemoveSelectedBoatButtons() {
    document.querySelectorAll('.removeSelectedBoat').forEach(function(e) {
        e.addEventListener('click', function() {
            const boatId = this.getAttribute('data-id');
            setLegSelectedPlayers(boatId,false);
            buildRaceFleetHtml()
        });
    });
}

function addEventListenersToSelectedLine() {
    document.querySelectorAll("tr.hovred").forEach(function(row) {
        row.addEventListener("click", function() {
            row.classList.add("selectedLine");
            let siblings = Array.from(row.parentNode.children).filter(function(child) {
                return child !== row && child.classList.contains("hovred");
            });
            siblings.forEach(function(sibling) {
                sibling.classList.remove("selectedLine");
            });
        });
    });
}

function addEventListenersFleetSort() {
    const friendList = document.getElementById("friendList");
    if (!friendList) return;

    const header = friendList.querySelector("thead");
    if (!header) return;

    header.addEventListener("click", (event) => {
        const th = event.target.closest("th");
        if (!th || !th.id) return;

        const sortKey = FLEET_SORT_KEY_BY_TH_ID[th.id];
        if (!sortKey) {
            return;
        }

        if (getSortField() === sortKey) {
            setSortOrder(!getSortOrder());
        } else {
            setSortField(sortKey);
            setSortOrder(true);
        }
        buildRaceFleetHtml();
    });
}


