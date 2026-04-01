
import {processDBOperations,getData,getAllData,getLatestAndPreviousByTriplet} from './dbOpes.js';
import { roundTo } from './utils.js';
import {getConnectedPlayerId,
        getRaceInfo,
        getLegPlayerInfos,
        getLegFleetInfos,
} from '../dashboard/app/memoData.js'
import { getUserPrefs } from './userPrefs.js';
import {sailNames} from "../dashboard/ui/constant.js"


const MIN_ZEZO_INTERVAL_MS = 15 * 60 * 1000; // 5 minutes

export const ZEZO_BASE_URL = "http://zezo.org/";
const RACE_LIST_ZEZO_URL=ZEZO_BASE_URL + "races2.json";

const VRZEN_BASE_URL =  "https://routage.vrzen.org";

const ITYC_POLAR_URL = "https://ityc.fr/autoSail.html";
const ITYC_IFRAME_URL = "https://ityc.fr/polarDash.html";

const INC_POLAR_URL = "http://inc.bureauvallee.free.fr/polaires/?";
const LSV_POLAR_URL = "https://vro.civis.net/polars/?";

const WINDY_POLAR_URL = "https://www.windy.com";

const DORADO_BASE_URL = "https://vr.ityc.fr/dorado.php?id=";

let lastRaceListFetchTs   = 0;
let raceListInFlightPromise = null;
let lastVRZenRaceListFetchTs = 0;
let vrZenRaceListInFlightPromise = null;

export async function getRaceListZezo(opts = {}) {
    const { forceRefresh = false } = opts;

    const now = Date.now();
    if (!forceRefresh && now - lastRaceListFetchTs < MIN_ZEZO_INTERVAL_MS) {
        console.log("[getRaceListZEZO] skipped (throttled, < 15min)");
        return null;
    }

    if (raceListInFlightPromise && !forceRefresh) {
        return raceListInFlightPromise;
    }

    lastRaceListFetchTs = now;

    raceListInFlightPromise = (async () => {
        try {
            const response = await fetch(RACE_LIST_ZEZO_URL, { method: "GET" });

            if (!response.ok) {
                console.warn("[getRaceListZEZO] HTTP error:", response.status, response.statusText);
                return null;
            }

            let zezoRaceList;
            try {
                zezoRaceList = await response.json();
            } catch (err) {
                console.error("[getRaceListZEZO] JSON parse error:", err);
                return null;
            }

            if (!zezoRaceList.races ||!Array.isArray(zezoRaceList.races) || zezoRaceList.races.length === 0) {
                console.warn("[getRaceListZEZO] Empty or invalid race list");
                return null;
            }

            const now = Date.now();
            const legList = [];

            zezoRaceList.races.forEach((race) => {
                if (!race || !race.id) return;
                const [raceIdRaw, legNumRaw] = String(race.id).split(".");
                if (!raceIdRaw || !legNumRaw) return;

                const raceUrl =  (race.url && race.url!="")?race.url:null;
                if(!raceUrl) return;

                legList.push({
                    id: `${raceIdRaw}-${legNumRaw}`,
                    raceId: Number(raceIdRaw),
                    legNum: Number(legNumRaw),
                    zezoUrl : raceUrl
                });
            });

            if (legList.length === 0) {
                console.warn("[getRaceListZEZO] No valid legs after mapping");
                return null;
            }

            const dbOpe = [
                {
                type: "putOrUpdate",
                internal: [
                    {
                    id: "legListUpdate",
                    ts: now,
                    },
                ],
                legList,
                },
            ];

            try {
                await processDBOperations(dbOpe);
            } catch (err) {
                console.error("[getRaceListZEZO] DB operation error:", err);
            }

            return legList;
        } catch (err) {
            console.error("[getRaceListZEZO] Unexpected error:", err);
            return null;
        } finally {
            raceListInFlightPromise = null;
        }
    })();

  return raceListInFlightPromise;
}

export async function getRaceListVrZen(opts = {}) {
    const { forceRefresh = false } = opts;

    const now = Date.now();
    if (!forceRefresh && now - lastVRZenRaceListFetchTs < MIN_ZEZO_INTERVAL_MS) {
        console.log("[getRaceListVRZEN] skipped (throttled, < 15min)");
        return null;
    }

    if (vrZenRaceListInFlightPromise && !forceRefresh) {
        return vrZenRaceListInFlightPromise;
    }

    lastVRZenRaceListFetchTs = now;

    vrZenRaceListInFlightPromise = (async () => {
        try {
            const response = await fetch(`${VRZEN_BASE_URL}/Course`, { method: "GET" });

            if (!response.ok) {
                console.warn("[getRaceListVRZEN] HTTP error:", response.status, response.statusText);
                return null;
            }

            let vrZenRaceList;
            try {
                vrZenRaceList = await response.json();
            } catch (err) {
                console.error("[getRaceListVRZEN] JSON parse error:", err);
                return null;
            }

            if (!Array.isArray(vrZenRaceList) || vrZenRaceList.length === 0) {
                console.warn("[getRaceListVRZEN] Empty or invalid race list");
                return null;
            }

            const legList = await getAllData('legList').catch((error) => {
                console.error("[getRaceListVRZEN] legList read error:", error);
                return [];
            });

            if (!Array.isArray(legList) || legList.length === 0) {
                console.warn("[getRaceListVRZEN] No legList available to enrich");
                return null;
            }

            const dbLegList = [];

            vrZenRaceList.forEach((race) => {
                if (!race?.idCourseVR) return;

                const sortedEtapes = Array.isArray(race.etapeCourse)
                    ? [...race.etapeCourse].sort((stepA, stepB) => {
                        if ((stepA?.ordre ?? 0) < (stepB?.ordre ?? 0)) return -1;
                        if ((stepA?.ordre ?? 0) > (stepB?.ordre ?? 0)) return 1;
                        return 0;
                    })
                    : [];

                legList
                    .filter((leg) => Number(leg?.raceId) === Number(race.idCourseVR))
                    .forEach((leg) => {
                        dbLegList.push({
                            raceId: leg.raceId,
                            legNum: leg.legNum,
                            vrZen: {
                                vrZenName: race.nomCourse ?? null,
                                vrZenLatEnd: race.latitudeArrivee ?? null,
                                vrZenLonEnd: race.longitudeArrivee ?? null,
                                vrZenEtape: sortedEtapes
                            }
                        });
                    });
            });

            if (dbLegList.length === 0) {
                console.warn("[getRaceListVRZEN] No matching legs found after mapping");
                return null;
            }

            const dbOpe = [
                {
                    type: "putOrUpdate",
                    internal: [
                        {
                            id: "legListUpdate",
                            ts: now,
                        },
                    ],
                    legList: dbLegList,
                },
            ];

            try {
                await processDBOperations(dbOpe);
            } catch (err) {
                console.error("[getRaceListVRZEN] DB operation error:", err);
            }

            return dbLegList;
        } catch (err) {
            console.error("[getRaceListVRZEN] Unexpected error:", err);
            return null;
        } finally {
            vrZenRaceListInFlightPromise = null;
        }
    })();

    return vrZenRaceListInFlightPromise;
}

export function openAutoRouter() {

    const connectedPlayerId = getConnectedPlayerId();
    const raceInfo = getRaceInfo();
    const raceItes = getLegPlayerInfos();
    const userPrefs = getUserPrefs();
    if(!raceInfo || raceInfo?.length == 0 
    || !raceItes || !raceItes.ites || !raceItes.ites.length
    || !connectedPlayerId)
        return;

    if(userPrefs.router.sel == "zezo")
    {
        if (!raceInfo.zezoUrl) openZezoRouter(raceInfo.zezoUrl,raceItes.ites[0], raceItes.options, userPrefs.global.reuseTab,false);
    }
    else if(rtType == "vrzen")
    {
        openVrZenRouter(raceInfo.raceId, raceItes.ites[0],userPrefs.global.reuseTab);
    }  
    else
    {
        if (raceInfo.zezoUrl) openZezoRouter(raceInfo.zezoUrl,raceItes.ites[0], raceItes.options, userPrefs.global.reuseTab,false);
        openVrZenRouter(raceInfo.raceId, raceItes.ites[0],userPrefs.global.reuseTab);        
    }      
}
export function openRouterSiteFront(userId,auto = false,rtType="zezo")
{
    const connectedPlayerId = getConnectedPlayerId();
    const raceInfo = getRaceInfo();
    const raceItes = getLegPlayerInfos();
    const raceItesFleet    = getLegFleetInfos();
    const userPrefs = getUserPrefs();


    if(!raceInfo || raceInfo?.length == 0 ){
        alert("Unknown race - no routing available");
        return;
    }

    if(userId.length < 10) 
    {
        if(connectedPlayerId)
            userId = connectedPlayerId;
        else {
            alert("No player info - no routing available");
            return;   
        }
    } 


    let pIte;
    let pOptions;
    let reuseTab = false;
    if(connectedPlayerId && connectedPlayerId == userId)
    {
        if(!raceItes || !raceItes.ites || !raceItes.ites.length ){
            alert("No player info - no routing available");
            return;
        }
        pIte = raceItes.ites[0];
        pOptions = raceItes.options;
        if(userPrefs.global.reuseTab) reuseTab = true;
    } else
    {
        if(!raceItesFleet ||!raceItesFleet[userId]) {
            alert("Unknown player - no routing available");
            return;
        }
        pIte = raceItesFleet[userId].ite;
        pOptions = raceItesFleet[userId].options;        
    }

    if (pIte.iteDate) {
        const now = Date.now();
        if ((now - pIte.iteDate) > 750000) {
            if (!confirm("Position is older than 10 min, really call router ?")) {
                return;
            }
        }
    }

    if(rtType == "zezo")
    {
        if (!raceInfo.zezoUrl) {
            alert("Race not available in Zezo - no routing available");
            return;
        }        
        openZezoRouter(raceInfo.zezoUrl,pIte, pOptions, reuseTab,auto);
    }
    else if(rtType == "vrzen")
    {
        openVrZenRouter(raceInfo.raceId, pIte,reuseTab);
    }

}

export async function openRouterSiteBack(rtType="zezo",auto = false)
{
            

    const userPrefs = getUserPrefs();
/***********************/
    const currentRace = await getData('internal', 'lastOpennedRace');
    if(!currentRace ){
        alert("Unknown race - no routing available");
        return;
    }        

    const raceInfo = await getData('legList', [currentRace.raceId, currentRace.legNum]); 
    if(!raceInfo || raceInfo?.length == 0 ){
        alert("Unknown race - no routing available");
        return;
    }

    const currentId = await getData('internal', 'lastLoggedUser');
    if(!currentId) {
        alert("Unknown player - no routing available");
        return;
    }
    const { latest, previous, meta } = await getLatestAndPreviousByTriplet(currentRace.raceId, currentRace.legNum, currentId.loggedUser , {storeName: 'legPlayersInfos'});
    if(meta.timedOut || !latest) {
        alert("No player info - no routing available");
        return;
    }
    if (latest.iteDate) {
        const now = Date.now();
        if ((now - latest.iteDate) > 750000) {
            if (!confirm("Position is older than 10 min, really call router ?")) {
                return;
            }
        }
    }

    const playerOption = (await getData('legPlayersOptions', [currentRace.raceId, currentRace.legNum, currentId.loggedUser])) ?? {options:[],guessOptions:0};

    if(rtType == "zezo")
    {
        if (!raceInfo.zezoUrl) {
            alert("Race not available in Zezo - no routing available");
            return;
        }        
        openZezoRouter(raceInfo.zezoUrl,latest,playerOption,userPrefs.global.reuseTab,auto);
    }
    else if(rtType == "vrzen")
    {
        openVrZenRouter(currentRace.raceId, latest);
    }
}

export function computeZezoOptions(pOptions)
{
    let optVal = 0;
    if(pOptions)
    {
        if(pOptions?.hull)  optVal+=2;
        if(pOptions?.winch) optVal+=4;
        if(pOptions?.foil)  optVal+=16;
        if(pOptions?.light) optVal+=32;
        if(pOptions?.reach) optVal+=64;
        if(pOptions?.heavy) optVal+=128;
    }
    return optVal;
}

function openZezoRouter(raceUrl, pIte,options, reuseTab = false, auto= false)
{
    const optVal = computeZezoOptions(options.options);

    const refUrl = ZEZO_BASE_URL + raceUrl + "/chart.pl?";
    const callUrl = refUrl
        + "lat=" + pIte.pos.lat
        + "&lon=" + pIte.pos.lon
        + "&ts=" + (pIte.iteDate / 1000)
        + "&o=" + optVal
        + "&twa=" + pIte.twa
        + "&userid=" + pIte.userId
        + "&type=me"
        + (auto?"&auto=yes" : "&auto=no");

    openTab(callUrl, refUrl,reuseTab);
}

function openVrZenRouter(raceId, pIte, reuseTab = false)
{
    const refUrl = VRZEN_BASE_URL + "/Course/"+raceId;
    let stamina = pIte.metaDash?.realStamina? pIte.metaDash.realStamina : pIte.stamina;
    if(stamina > 100) stamina = 100;
    
    // https://routage.vrzen.org/Course/CourseParDefaut/atitudeParDefaut/LongitudeParDefaut/CapParDefaut/VoileParDefaut/EnergieParDefaut  
    const callUrl = refUrl
        + "/" + roundTo(pIte.pos.lat,6).replace(".",",")
        + "/" + roundTo(pIte.pos.lon,6).replace(".",",")
        + "/" + roundTo(pIte.hdg,0)
        + "/" + pIte.sail % 10
        + (stamina!=null?("/" + stamina):"");
    
    openTab(callUrl, refUrl,reuseTab);
}


export function openPolarSiteFront(polarType = "ITYC")
{
    const connectedPlayerId = getConnectedPlayerId();
    const raceInfo = getRaceInfo();
    const raceItes = getLegPlayerInfos();
    const userPrefs = getUserPrefs();

    if(!connectedPlayerId
    || !raceItes || !raceItes.ites || !raceItes.ites.length) 
        return;

    if(polarType == "ITYC")
    {
        openITYCPolar(raceInfo.boatName,raceItes.ites[0],raceItes.options,userPrefs.global.reuseTab);
    } else
    {
        openExternalPolar(raceInfo.raceId, raceInfo.legNum, 
                        raceItes.ites[0],raceItes.options,
                        userPrefs.global.polarSite, userPrefs.global.reuseTab);
    }
}

export async function openPolarSiteBack(polarType = "ITYC")
{

    const currentRace = await getData('internal', 'lastOpennedRace');
    if(!currentRace ){
        alert("Unknown race - no polar available");
        return;
    }        

    const raceInfo = await getData('legList', [currentRace.raceId, currentRace.legNum]); 
    if(!raceInfo || raceInfo?.length == 0 ){
        alert("Unknown race - no polar available");
        return;
    }

    const currentId = await getData('internal', 'lastLoggedUser');
    if(!currentId) {
        alert("Unknown player - no polar available");
        return;
    }
    const { latest, previous, meta } = await getLatestAndPreviousByTriplet(currentRace.raceId, currentRace.legNum, currentId.loggedUser , {storeName: 'legPlayersInfos'});
    if(meta.timedOut || !latest) {
        alert("No player info - no polar available");
        return;
    }

    const playerOption = (await getData('legPlayersOptions', [currentRace.raceId, currentRace.legNum, currentId.loggedUser])) ?? {options:[],guessOptions:0};

    const userPrefs = getUserPrefs();

    if(polarType == "ITYC")
    {
        openITYCPolar(raceInfo.boatName,latest,playerOption,userPrefs.global.reuseTab);
    } else
    {
        openExternalPolar(currentRace.raceId, currentRace.legNum, 
                        latest,playerOption,
                        userPrefs.global.polarSite, userPrefs.global.reuseTab);
    }
}

function openITYCPolar(boatLabel, pIte,options, reuseTab = false)
{
    const { callUrl, refUrl } = buildITYCPolarUrls(boatLabel, pIte, options);

    openTab(callUrl, refUrl,reuseTab);
}

function buildITYCPolarUrls(boatLabel, pIte, options = {iframe:false})
{
    const userPrefs = getUserPrefs();
    const pOptions = options.options ?? {};
    let stamina = pIte.metaDash?.realStamina? pIte.metaDash.realStamina : pIte.stamina;
    if(stamina > 100) stamina = 100;
    
    const sailOptions = [];
    const perfOptions = [];
    if(pOptions.reach) sailOptions.push("R");
    if(pOptions.light) sailOptions.push("L");
    if(pOptions.heavy) sailOptions.push("H");

    if(pOptions.winch) perfOptions.push("W");
    if(pOptions.foil) perfOptions.push("F");
    if(pOptions.hull) perfOptions.push("h");
    if(pOptions.comfortLoungePug) perfOptions.push("C");
    if(pOptions.magicFurler) perfOptions.push("M");
    if(pOptions.vrtexJacket) perfOptions.push("J");

    const optSail = sailOptions.length ? `[${sailOptions.join(",")}]` : "";
    const optPerf = perfOptions.length ? `[${perfOptions.join(",")}]` : "";

    let optionsTxt ="";
    if(optSail.length !=0 && optPerf.length !=0)
        optionsTxt = optSail + " " + optPerf ;
    else if(optSail.length !=0 && optPerf.length ==0)
        optionsTxt = optSail;
    else if(optSail.length ==0 && optPerf.length !=0)
        optionsTxt = optPerf ;

    const refUrl = (options.iframe?ITYC_IFRAME_URL:ITYC_POLAR_URL) + "?b="+ boatLabel.replaceAll(" ","_");

    const callUrl = refUrl 
        +"&s="+sailNames[pIte.sail % 10]
        + "&o="+optionsTxt
        + "&ts="+pIte.tws
        + "&ta="+pIte.twa
        + "&th="+userPrefs.theme
        + (options.iframe?("&bs="+pIte.speed):"")
        + (options.iframe?("&se="+stamina):"");
    return { callUrl, refUrl };
}

export function getITYCPolarUrl()
{
    const raceInfo = getRaceInfo();
    const raceItes = getLegPlayerInfos();

    if(!raceInfo?.boatName
    || !raceItes?.ites?.length) {
        return "";
    }
    raceItes.options.iframe = true;
    return buildITYCPolarUrls(raceInfo.boatName, raceItes.ites[0], raceItes.options).callUrl;
}

function openExternalPolar(raceId, legNum, pIte, options,polarSite, reuseTab = false)
{
    const twa = Math.abs(roundTo(pIte.twa || 20, 0));
    const tws = roundTo(pIte.tws || 4, 1);

    const pOptions = options.options;
    let optionTxt = "";
    if(pOptions.reach) optionTxt += `&reach=true`; else optionTxt += `&reach=false`;
    if(pOptions.light) optionTxt += `&light=true`; else optionTxt += `&light=false`;
    if(pOptions.heavy) optionTxt += `&heavy=true`; else optionTxt += `&heavy=false`;
    if(pOptions.foil) optionTxt += `&foil=true`; else optionTxt += `&foil=false`;
    if(pOptions.hull) optionTxt += `&hull=true`; else optionTxt += `&hull=false`;

    const refUrl = (polarSite == "INC"?INC_POLAR_URL:LSV_POLAR_URL)
        + "race_id=" + raceId + "." + legNum;

    const callUrl = refUrl
        +  "&tws=" + tws 
        + "&twa=" + twa
        + optionTxt;
  
    openTab(callUrl, refUrl,reuseTab);  
}

export function openWindySiteFront()
{
    const raceItes = getLegPlayerInfos();
    const userPrefs = getUserPrefs();

    if(!raceItes || !raceItes.ites || !raceItes.ites.length) 
        return;

    const refUrl = WINDY_POLAR_URL+ "/?gfs,";

    const callUrl = refUrl
        + raceItes.ites[0].pos.lat + ","
        + raceItes.ites[0].pos.lon
        + + ",6,i:pressure,d:picker";
  
    openTab(callUrl, WINDY_POLAR_URL,userPrefs.global.reuseTab);
}

export function getDoradoUrl()
{
    const raceInfo = getRaceInfo();
    const connectedPlayerId = getConnectedPlayerId();
    if(!raceInfo || !connectedPlayerId) return;

    const doradoUrl = DORADO_BASE_URL
        + connectedPlayerId;
        + "&rid="
        + raceInfo.raceId + '_' + raceInfo.legNum;

    navigator.clipboard.writeText(doradoUrl);
}


function openTab(url, baseUrl,reuseTab)
{
    let isTabActive = false;
    let tabId = 0;
    chrome.tabs.query({}, function(tabs) { 
        for(let i=0;i<tabs.length;i++) {
            if(tabs[i].url.toLowerCase().includes(baseUrl.toLowerCase()) == true) {
                isTabActive = true;
                tabId = tabs[i].id;
                break;
            }
        }

        if(isTabActive == false || !reuseTab) {
            chrome.tabs.create({ url:url },async function(tab){chrome.tabs.move(tab.id, {index: tab.index+1});});
        } else{
            chrome.tabs.update(tabId, {url:url,selected:true});
        }
    });
}
