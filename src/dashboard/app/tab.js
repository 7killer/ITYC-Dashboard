

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
}

export function refreshActiveTab(tabId)
{

    if(tabId == null)
    {
        tabId = activeTab;
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
            buildRaceFleetHtml();
            break;
        case "raceMap":
            initializeMap();
            break;
        case "raceBook":
            buildRaceBookHtml();            
            break;
        case "raceGraph":
            upDateGraph();
            break;
        case "raceAnalyse":
            buildRaceAnalyseAdvance();
            break;
        case "notif":
            showNotifList();
            break;
    }
}
