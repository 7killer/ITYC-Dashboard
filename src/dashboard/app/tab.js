

let activeTab = 1;
import {display_selbox} from "../ui/common.js"
import {buildRaceLogHtml} from '../ui/raceLog.js'
import {buildRaceFleetHtml} from '../ui/raceFleet.js'
import {buildRaceBookHtml} from '../ui/raceBook.js'
import {initializeMap} from '../ui/map/map-race.js'
import {upDateGraph} from'../ui/raceGraph.js'
import {buildRaceAnalyseAdvance} from '../ui/raceAnalysis.js'
import {showNotifList} from'../ui/raceNotif.js'



export const tabList = Object.freeze({
    1 : "raceLog",
    2 : "raceFleet",
    3 : "raceMap",
    4 : "raceBook",
    5 : "raceGraph",
    9 : "raceAnalyse",
    6 : "notif",
    7 : "config",
    8 : "rawLog",
  });

  
export function getActiveTabId()
{
    return activeTab;
}
export function tabSwitch(tabId = null)
{
    if(tabId == null)
    {
        if(activeTab) tabId = activeTab;    //redraw management
        else return
    } 

    activeTab = tabId;

    display_selbox("hidden");
    document.getElementById("analysisModeSwitch").style.display = "none";
    document.getElementById("graphBtDiv").style.display = "none";
    document.getElementById("raceLogBtDiv").style.display = "none";
    document.getElementById("polarDivName").style.display = "none";

    

    for (const [key, value] of Object.entries(tabList)) {
        if(value == "raceMap" || value == "raceAnalyse" )
            document.getElementById("tab-content" + key).style.display = (tabId == key ? "flex" : "none");
        else document.getElementById("tab-content" + key).style.display = (tabId == key ? "block" : "none");
    }

    const tabName = tabList[tabId];

    switch(tabName) {
        case "config":
        case "rawLog":
            break;
        case "raceLog":
            buildRaceLogHtml();
            break;
        case "raceFleet":
            display_selbox("visible");
            buildRaceFleetHtml();
            break;
        case "raceMap":
            initializeMap();
            display_selbox("visible");
            break;
        case "raceBook":
            buildRaceBookHtml();            
            break;
        case "raceGraph":
            document.getElementById("graphBtDiv").style.visibility = "visible";
            document.getElementById("graphBtDiv").style.display = "block";
            upDateGraph();
            break;
        case "raceAnalyse":
            document.getElementById("analysisModeSwitch").style.visibility = "visible";
            document.getElementById("analysisModeSwitch").style.display = "block";
            document.getElementById("polarDivName").style.display = "flex";
            buildRaceAnalyseAdvance();
            break;
        case "notif":
            showNotifList();
            break;
    }
/*
    if (tabsel) {
        // Tab-Selection
        originClick= rmatch ;
     //   EX.extraRoute("hidden");
        for (let t = 1; t <= nbTabs; t++) {
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
    }*/
}
