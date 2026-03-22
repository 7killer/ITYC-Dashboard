
import {processDBOperations,getData, getAllData} from '../common/dbOpes.js';

 import { getUserPrefs  } from '../common/userPrefs.js';

// URL décodée une seule fois
const TEAM_LIST_URL = atob("aHR0cHM6Ly92ci5pdHljLmZyL2dldFRlYW1MaXN0LnBocA==");
const PLAYER_LIST_URL = atob("aHR0cHM6Ly92ci5pdHljLmZyL2dldFBsYXllckxpc3QucGhw");
const RACE_LIST_URL = atob("aHR0cHM6Ly92ci5pdHljLmZyL2dldFJhY2VMaXN0LnBocA==");
const RACE_OPTIONS_BASE_URL = atob("aHR0cHM6Ly92ci5pdHljLmZyL2dldE9wdGlvbkxpc3QucGhwP3JpZD0=");
const SEND_LEG_DATA_URL = atob("aHR0cHM6Ly92ci5pdHljLmZyL2RpblJhY2VJbmZvLnBocA==");
const SEND_INFO_OPT_URL = atob("aHR0cHM6Ly92ci5pdHljLmZyL2Rpbk9wdC5waHA=");
const SEND_FLEET_URL = atob("aHR0cHM6Ly92ci5pdHljLmZyL2RpblJhY2VEYXRhLnBocA==");
const SEND_RANK_URL  = atob("aHR0cHM6Ly92ci5pdHljLmZyL2RpblJhbmsucGhw");


let teamListInFlightPromise = null;
let playerListInFlightPromise = null;
let raceListInFlightPromise = null;
const raceOptionsInFlight = new Map();
const sendLegInFlight = new Map();

const MIN_ITYC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

let lastTeamListFetchTs   = 0;
let lastPlayerListFetchTs = 0;
let lastRaceListFetchTs   = 0;
// par raceId_legNum pour les options
const lastRaceOptionsFetchTs = new Map();
/**
 * Récupère / met à jour TeamList depuis ITYC.
 * - Mutile l'objet global TeamList comme avant
 * - Sauvegarde via saveTeamList() et saveLocal()
 * - Évite les appels concurrents : un seul fetch à la fois
 *
 * @param {Object} [opts]
 * @param {boolean} [opts.forceRefresh=false] si true, ignore une promesse déjà en cours
 * @returns {Promise<typeof TeamList>}
 */
export async function getTeamListITYC(opts = {}) {
    const { forceRefresh = false } = opts;

    const now = Date.now();
    if (!forceRefresh && now - lastTeamListFetchTs < MIN_ITYC_INTERVAL_MS) {
        console.log("[getTeamListITYC] skipped (throttled, < 5min)");
        return null;
    }

    if (teamListInFlightPromise && !forceRefresh) {
        return teamListInFlightPromise;
    }

    lastTeamListFetchTs = now;

    teamListInFlightPromise = (async () => {
        try {
        const response = await fetch(TEAM_LIST_URL, { method: "GET" });

        if (!response.ok) {
            console.warn("[getTeamListITYC] HTTP error:", response.status, response.statusText);
            return null;
        }

        let itycTeamList;
        try {
            itycTeamList = await response.json();
        } catch (err) {
            console.error("[getTeamListITYC] JSON parse error:", err);
            return null;
        }

        if (!Array.isArray(itycTeamList) || itycTeamList.length === 0) {
            console.warn("[getTeamListITYC] Empty or invalid team list");
            return null;
        }

        itycTeamList.shift();

        const teamList = [];
        itycTeamList.forEach((team) => {
            if (!team || !team.tid) return;

            teamList.push({
            id: team.tid,
            name: team.teamName,
            });
        });

        if (teamList.length === 0) {
            console.warn("[getTeamListITYC] No valid teams after filtering");
            return null;
        }

        const dbOpe = [
            {
            type: "putOrUpdate",
            internal: [
                {
                id: "teamsUpdate",
                ts: Date.now(),
                },
            ],
            teams: teamList,
            },
        ];

        try {
            await processDBOperations(dbOpe);
        } catch (err) {
            console.error("[getTeamListITYC] DB operation error:", err);
        }

        return teamList;
        } catch (err) {
            console.error("[getTeamListITYC] Unexpected error:", err);
            return null;
        } finally {
            teamListInFlightPromise = null;
        }
    })();

    return teamListInFlightPromise;
}

export async function getPlayerListITYC(opts = {}) {
  const { forceRefresh = false } = opts;

  const now = Date.now();
  if (!forceRefresh && now - lastPlayerListFetchTs < MIN_ITYC_INTERVAL_MS) {
    console.log("[getPlayerListITYC] skipped (throttled, < 5min)");
    return null;
  }

  if (playerListInFlightPromise && !forceRefresh) {
    return playerListInFlightPromise;
  }

  lastPlayerListFetchTs = now;

  playerListInFlightPromise = (async () => {
    try {
      const response = await fetch(PLAYER_LIST_URL, { method: "GET" });

      if (!response.ok) {
        console.warn("[getPlayerListITYC] HTTP error:", response.status, response.statusText);
        return null;
      }

      let itycPlayerList;
      try {
        itycPlayerList = await response.json();
      } catch (err) {
        console.error("[getPlayerListITYC] JSON parse error:", err);
        return null;
      }

      if (!Array.isArray(itycPlayerList) || itycPlayerList.length === 0) {
        console.warn("[getPlayerListITYC] Empty or invalid player list");
        return null;
      }

      const now = Date.now();
      const players = [];
      const playersDatas = await getAllData("players").catch(error => {
        console.error("getplayerList error :", error);
      });

      const playersIndex = new Map(playersDatas.map(p => [p.id, p]));

      const existingPlayers = [];
      const newPlayers = [];

      itycPlayerList.forEach((player) => {
        if (!player || !player.uid) return;
        const dbPlayer = playersIndex.get(player.uid);
        const teamId =
          player.tid && player.tid !== "-" ? player.tid : null;

        let doUpdate = false;
        if(!dbPlayer) doUpdate = true;
        else if(dbPlayer.teamId != teamId || dbPlayer.name != player.name)  doUpdate = true;

        if(doUpdate)
          players.push({
            id: player.uid,
            name: player.name,
            teamId,
            timestamp: now,
          });
      });

      if (players.length === 0) {
        console.warn("[getPlayerListITYC] No valid players after filtering");
        return null;
      }

      const dbOpe = [
        {
          type: "putOrUpdate",
          internal: [
            {
              id: "playersUpdate",
              ts: now,
            },
          ],
          players, 
        },
      ];

      try {
        await processDBOperations(dbOpe);
      } catch (err) {
        console.error("[getPlayerListITYC] DB operation error:", err);
      }

      return players;
    } catch (err) {
      console.error("[getPlayerListITYC] Unexpected error:", err);
      return null;
    } finally {
      playerListInFlightPromise = null;
    }
  })();

  return playerListInFlightPromise;
}

export async function getRaceListITYC(opts = {}) {
    const { forceRefresh = false } = opts;

    const now = Date.now();
    if (!forceRefresh && now - lastRaceListFetchTs < MIN_ITYC_INTERVAL_MS) {
        console.log("[getRaceListITYC] skipped (throttled, < 5min)");
        return null;
    }

    if (raceListInFlightPromise && !forceRefresh) {
        return raceListInFlightPromise;
    }

    lastRaceListFetchTs = now;

    raceListInFlightPromise = (async () => {
        try {
            const response = await fetch(RACE_LIST_URL, { method: "GET" });

            if (!response.ok) {
                console.warn("[getRaceListITYC] HTTP error:", response.status, response.statusText);
                return null;
            }

            let itycRaceList;
            try {
                itycRaceList = await response.json();
            } catch (err) {
                console.error("[getRaceListITYC] JSON parse error:", err);
                return null;
            }

            if (!Array.isArray(itycRaceList) || itycRaceList.length === 0) {
                console.warn("[getRaceListITYC] Empty or invalid race list");
                return null;
            }

            const now = Date.now();
            const legList = [];

            itycRaceList.forEach((race) => {
                if (!race || !race.rid) return;

                const raceInfo =  (race.data && race.data!="")?JSON.parse(race.data):null;
                // rid au format "raceId_legNum"
                const [raceIdRaw, legNumRaw] = String(race.rid).split("_");
                if (!raceIdRaw || !legNumRaw) return;

                const raceId = Number.isNaN(Number(raceIdRaw)) ? raceIdRaw : Number(raceIdRaw);
                const legNum = Number.isNaN(Number(legNumRaw)) ? legNumRaw : Number(legNumRaw);
                if(raceId == 825)
                  console.log("fuck");
                const legName  = race.legName  ?? null;
                const raceName = race.name     ?? null;
                const raceType = race.type     ?? null;
                const vsrLevel = race.vsrRank ?? race.vsr ?? 0;
                const start    = raceInfo?.start ?? null;
                const end      = raceInfo?.end   ?? null;
                const close    = race.start ?? null;
                const open     = race.end   ?? null;
                const polar_id = raceInfo?.boat?.polar_id ?? null;

                const fineWinds = raceInfo?.gfsWinds ?? null;
                const boatName = raceInfo?.boat?.name ?? null;
                const priceLevel = raceInfo?.priceLevel ?? null;
                const optionPrices  = raceInfo?.optionPrices ?? null;
                const checkpoints = raceInfo?.checkpoints ?? [];
                const ice_limits = raceInfo?.ice_limits ?? [];
                const course = raceInfo?.course ?? [];
                const restrictedZones = raceInfo?.restrictedZones ?? []



                legList.push({
                id: `${raceId}-${legNum}`,
                raceId,
                legNum,
                legName,
                raceName,
                raceType,
                start,
                end,
                polar_id,
                fineWinds,
                boatName,
                priceLevel,
                vsrLevel,
                optionPrices,
                checkpoints,
                ice_limits,
                course,
                restrictedZones
                });
            });

            if (legList.length === 0) {
                console.warn("[getRaceListITYC] No valid legs after mapping");
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
                console.error("[getRaceListITYC] DB operation error:", err);
            }

            return legList;
        } catch (err) {
            console.error("[getRaceListITYC] Unexpected error:", err);
            return null;
        } finally {
            raceListInFlightPromise = null;
        }
    })();

  return raceListInFlightPromise;
}

function decodeOptionString(optRaw) {
    if (!optRaw || optRaw === "?") return "";

    // Full Pack / All Options = tout activé
    const allOpts =
        "foil heavy hull light reach winch comfortLoungePug magicFurler vrtexJacket radio";

    if (optRaw === "FP" || optRaw === "AO") {
        return allOpts;
    }

    let opt = optRaw;
    opt = opt.replace("h", "hull");
    opt = opt.replace("H", "heavy");
    opt = opt.replace("L", "light");
    opt = opt.replace("R", "reach");
    opt = opt.replace("W", "winch");
    opt = opt.replace("F", "foil");
    opt = opt.replace("M", "magicFurler");
    opt = opt.replace("J", "vrtexJacket");
    opt = opt.replace("C", "comfortLoungePug");

    return opt;
}
function buildOptionsFlags(optString) {
    const s = optString || "";

    return {
        foil:  s.includes("foil"),
        heavy: s.includes("heavy"),
        hull:  s.includes("hull"),
        light: s.includes("light"),
        reach: s.includes("reach"),
        winch: s.includes("winch"),
        comfortLoungePug: s.includes("comfortLoungePug"),
        magicFurler: s.includes("magicFurler"),
        vrtexJacket: s.includes("vrtexJacket"),
        radio: s.includes("radio"),
    };
}

export async function getRaceOptionsListITYC(raceId, legNum, opts = {}) {
    const { forceRefresh = false } = opts;

    if(!raceId || !legNum) return;
    const rid = `${raceId}_${legNum}`;
    const key = rid;

    const now = Date.now();
    const lastTs = lastRaceOptionsFetchTs.get(key) || 0;
    if (!forceRefresh && now - lastTs < MIN_ITYC_INTERVAL_MS) {
        console.log("[getRaceOptionsListITYC] skipped (throttled, < 5min) for", rid);
        return null;
    }

    if (raceOptionsInFlight.has(key) && !forceRefresh) {
        return raceOptionsInFlight.get(key);
    }

    lastRaceOptionsFetchTs.set(key, now);

    const promise = (async () => {
        try {
            const url = `${RACE_OPTIONS_BASE_URL}${encodeURIComponent(rid)}`;
            const response = await fetch(url, { method: "GET" });

            if (!response.ok) {
                console.warn("[getRaceOptionsListITYC] HTTP error:", response.status, response.statusText);
                return null;
            }

            let itycRaceOptList;
            try {
                itycRaceOptList = await response.json();
            } catch (err) {
                console.error("[getRaceOptionsListITYC] JSON parse error:", err);
                return null;
            }

            if (!Array.isArray(itycRaceOptList) || itycRaceOptList.length === 0) {
                console.warn("[getRaceOptionsListITYC] Empty or invalid options list for", rid);
                return null;
            }
    
            const legPlayersOptions = [];
            for (const onlineplayerOpt of itycRaceOptList) {
                if(!onlineplayerOpt.playerId)
                {
                    if(!onlineplayerOpt.uid) return;
                    onlineplayerOpt.playerId = onlineplayerOpt.uid;
                } 

                if(onlineplayerOpt.opt && onlineplayerOpt.opt != "?")
                {
                    onlineplayerOpt.opt = decodeOptionString(onlineplayerOpt.opt);
                } else if(onlineplayerOpt.options) {
                    onlineplayerOpt.opt = onlineplayerOpt.options ;
                }
                const pOpt = buildOptionsFlags(onlineplayerOpt.opt);
                if(!onlineplayerOpt.guessOptions) {
                    if(onlineplayerOpt.guessOpt !== undefined) onlineplayerOpt.guessOptions = onlineplayerOpt.guessOpt;
                    else onlineplayerOpt.guessOptions = 0;
                }
                if(!onlineplayerOpt.stTs &&  onlineplayerOpt.startRaceTime)
                    onlineplayerOpt.stTs = onlineplayerOpt.startRaceTime;

                const playerOptionRace = (await getData('legPlayersOptions', [raceId, legNum, onlineplayerOpt.playerId])) ?? {options:[],guessOptions:0,timestamp:0};
    
                if(playerOptionRace.timestamp != 0)
                {
                    if(onlineplayerOpt.update > playerOptionRace.timestamp)
                    {
                        playerOptionRace.options = pOpt;
                        if(onlineplayerOpt.stTs == 0 || onlineplayerOpt.stTs =="0" ||  onlineplayerOpt.stTs =="-") onlineplayerOpt.startRaceTime = "-";
                        else {
                            onlineplayerOpt.startRaceTime = Number(onlineplayerOpt.stTs);                            
                        } 
                    }
                    playerOptionRace.guessOptions |= onlineplayerOpt.guessOptions;
                    legPlayersOptions.push({
                        raceId,
                        legNum,
                        userId : onlineplayerOpt.playerId,
                        id: `${raceId}_${legNum}_${onlineplayerOpt.playerId}_${onlineplayerOpt.update}`,
                        options: pOpt,
                        guessOptions: playerOptionRace.guessOptions,
                        timestamp: onlineplayerOpt.update,
                        // startRaceTime: p.startRaceTime, // ⬅️ laissé de côté pour l'instant comme demandé
                    });
                } else
                {
                    legPlayersOptions.push({
                        raceId,
                        legNum,
                        userId : onlineplayerOpt.playerId,
                        id: `${raceId}_${legNum}_${onlineplayerOpt.playerId}_${onlineplayerOpt.update}`,
                        options: pOpt,
                        guessOptions: onlineplayerOpt.guessOptions,
                        timestamp: onlineplayerOpt.update,
                        // startRaceTime: p.startRaceTime, // ⬅️ laissé de côté pour l'instant comme demandé
                    });
                }
            }
            if (legPlayersOptions.length === 0) {
                console.warn("[getRaceOptionsListITYC] No valid merged options for", rid);
                return null;
            }

            const dbOpe = [
                {
                type: "putOrUpdate",
                internal: [
                    {
                    id: "legPlayersOptionsUpdate",
                    ts: Date.now(),
                    },
                ],
                legPlayersOptions,
                },
            ];

            try {
                await processDBOperations(dbOpe);
            } catch (err) {
                console.error("[getRaceOptionsListITYC] DB operation error:", err);
            }
        } catch (err) {
            console.error("[getRaceOptionsListITYC] Unexpected error:", err);
            return null;
        } finally {
            raceOptionsInFlight.delete(key);
        }
    })();
    raceOptionsInFlight.set(key, promise);
    return promise;
}

export async function sendLegDataITYC(message, opts = {}) {
    const { force = false } = opts;

    const userPrefs = getUserPrefs(); 
    if(!userPrefs.global.ITYCSend) return; 

    if(!(message.res?.leg)) return;

    const legData = message.res.leg;
    const legItycData =
    {
        rid :               legData.id?.raceId + "." + legData.id?.legNum,
        checkpoints :       legData.checkpoints,
        course :            legData.course,
        ice_limits :        legData.ice_limits,
        loadingScreenLogo : legData.loadingScreenLogo,
        name :              legData.name,
        open :              legData.open,
        priceLevel :        legData.priceLevel,
        race :              legData,
        start :             legData.start,
        end :               legData.end,
        gfsWinds :          legData.fineWinds?'0.25':'1.0',
        optionPrices:       legData.optionPrices,
        ...(legData.boat
        ? { boat: legData.boat}
            : {}),         
        ...(legData.boat?.polar_id
        ? { polar_id: legData.boat.polar_id }
            : {}),        
    };



    if (!legItycData?.rid) {
        console.warn("[sendLegDataITYC] missing rid");
        return false;
    }

    const key = legItycData.rid;

    if (sendLegInFlight.has(key) && !force) {
        return sendLegInFlight.get(key);
    }

    const promise = (async () => {
        try {
            const payload = "/**/" + JSON.stringify(legItycData);

            const response = await fetch(SEND_LEG_DATA_URL, {
                method: "POST",
                headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                },
                body: payload,
            });

            if (!response.ok) {
                console.warn(
                "[sendLegDataITYC] HTTP error:",
                response.status,
                response.statusText
                );
                return false;
            }

            // Si le serveur renvoie du JSON
            try {
                await response.json();
            } catch {
                // Si ce n'est pas du JSON, ce n'est pas bloquant
            }

            return true;
        } catch (err) {
            console.error("[sendLegDataITYC] Unexpected error:", err);
        return false;
        } finally {
            sendLegInFlight.delete(key);
        }
    })();
    sendLegInFlight.set(key, promise);
    return promise;
}

let lastSendDate = 0;//timestamp ite du dernier envoi
let lastCalcDate = 0;   //time stamp pour detection info la plus a jour
let mesData = [];
export function initMessageITYC(type,rid,name,myId,rtype) {

    const userPrefs = getUserPrefs(); 
    if(!userPrefs.global.ITYCSend) return;

    mesData[type] = [];
    mesData[type]["raceId"] = rid;
    mesData[type]["raceName"] = name;
    mesData[type]["myId"] = myId;
 //   racetype = rtype;
    if(type=="fleet") {
        lastCalcDate = 0;
    } else
    {
        mesData[type]["measTime"] = 0;
    }
}

export function sendInfoITYC(type, withRandom = true) {
    
    const userPrefs = getUserPrefs(); 
    if(!userPrefs.global.ITYCSend) return;

    const execute = () => sendInfoCore(type);

    if (withRandom) {
        // 0 à 2990 ms
        const delayMs = Math.floor(Math.random() * 300) * 10;
        setTimeout(execute, delayMs);
    } else {
        execute();
    }
}

function sendInfoCore(type) {
    if (!mesData[type]) {
        console.warn("[sendInfo] no mesData for type:", type);
        return;
    }

    if (type === "fleet") {
        lastSendDate = lastCalcDate;
      //  recordEnable = false;
    } else {
        mesData[type]["measTime"] =
        Math.round(Date.now() / 60000) * 60000;
    }

    let webdata = "";
    Object.keys(mesData[type]).forEach((key) => {
        webdata += "/**/" + JSON.stringify(mesData[type][key]);
    });

    const dat = JSON.stringify(webdata);

    let url;
    if (type === "fleet") {
        url = SEND_FLEET_URL;
    } else if (type === "rank") {
        url = SEND_RANK_URL;
    } else {
        console.warn("[sendInfo] unknown type:", type);
        return;
    }

    fetch(url, {
        method: "POST",
        headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        },
        body: dat,
    })
    .then((response) => {
        if (!response.ok) {
        console.warn("[sendInfo] HTTP error:", response.status);
        }
    })
    .catch((err) => {
//        console.error("[sendInfo] network error:", err);
    });
}



export async function sendInfoOptITYC(message)
{
    const userPrefs = getUserPrefs(); 
    if(!userPrefs.global.ITYCSend) return false;

    const bs = message?.res?.bs;
    if (!bs) {
        return false;
    }

    let currentIdData = await getData("internal", "lastLoggedUser");
    const currentId = currentIdData?.loggedUser;
    if (!currentId || bs._id.user_id === currentId) {
        return false;
    }

    const raceId = bs._id?.race_id;
    const legNum = bs._id?.leg_num;
    if (raceId == null || legNum == null) {
        return false;
    }

    const legInfos = await getData("legList", [raceId, legNum]);
    if (!legInfos) {
        return false;
    }

    const rid = `${raceId}.${legNum}`;

    if(bs.fullOptions)
    {
        bs.options = ["foil","heavy","hull","light","reach","radio",
                    "winch","comfortLoungePug","magicFurler","vrtexJacket"
        ];
    } 
    if(!bs.options) return;

    bs.options.replace("All Options","AO");
    bs.options.replace("Full Pack","FP");
    bs.options.replace("reach","R");
    bs.options.replace("light","L");
    bs.options.replace("heavy","H");
    bs.options.replace("winch","W");
    bs.options.replace("foil","F");
    bs.options.replace("hull","h");
    bs.options.replace("magicFurler","M");
    bs.options.replace("vrtexJacket","J");
    bs.options.replace("comfortLoungePug","C")
    

    initMessageITYC("opt",rid,legInfos.legName,currendId,legInfos.raceType);
    
    const webinfo = {

        date :  bs.lastCalcDate,
        uid:    currendId,
        name:   bs.displayName,
        teamId: bs.team?.id ?? "-",
        teamName: bs.team?.name ?? "-",
        opt : bs.options,
        ...( bs.startDate
        ? { startRaceTime:  bs.startDate }
            : {})
    };

    mesData["opt"][currendId] = webinfo;

    mesData['opt']["measTime"] = Math.round(Date.now()/60000)*6000;
    var webdata = "";
    Object.keys(mesData['opt']).forEach(function (key) {
        webdata += "/**/"+JSON.stringify(mesData['opt'][key]);
    });

    const dat = JSON.stringify(webdata);
    try {
        const response = await fetch(SEND_INFO_OPT_URL, {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: dat,
        });

        return response.ok;
    } catch (err) {
 //       console.error("[sendInfoOptITYC] Unexpected error:", err);
        return false;
    }
}


export async function addInfoFleetITYC(pInfo,legInfos) {

    const userPrefs = getUserPrefs(); 
    if(!userPrefs.global.ITYCSend) return false;

    const pOption = pInfo.playerOption?pInfo.playerOption:'?';
    const ite = pInfo.latest?pInfo.latest:null;

    if(!ite) return;

    const playerInfo = (ite.userId)?(await getData('players', ite.userId)):null;
    if(!playerInfo) return;

    if(playerInfo.teamId)
    {
        const teamInfos = await getData("teams", playerInfo.teamId);
        if(teamInfos?.name) playerInfo.teamName = teamInfos?.name;
    } else
         playerInfo.teamName = null;

    if(ite.lastCalcDate < lastSendDate) return; //not uptodate
    lastCalcDate = ite.lastCalcDate;
    const webinfo = {

        date :      ite.lastCalcDate,
        uid:        ite.userId,
        name:       playerInfo.name,
        teamId :    playerInfo.teamId??"-",
        teamName :  playerInfo.teamName??"-",
        speed:      ite.speed,
        heading:    ite.hdg,
        tws:        ite.tws,
        twd:        ite.metaDash.twd,
        twa:        ite.twa,
        twaAuto :   ite.isRegulated,
        sail:       ite.sail || "-",
        foil :      (ite.metaDash.xplained?ite.metaDash.realFoilFactor:"-"),
        xf :        (ite.metaDash.xplained?ite.metaDash.xfactor:"-"),
        xfs :       (ite.metaDash.xplained?ite.metaDash.sailCoverage:"-"),
        posLat :    (ite.pos ? ite.pos.lat : "-"),
        posLong :   (ite.pos ?  ite.pos.lon : "-"),
        state :     ite.state,
        rank :      (ite.rank ?  ite.rank : "-"),
        stamina:    "-", 
        dist:       (ite.metaDash.dtf ? ite.metaDash.dtf : 99999999999.0),
        guessOpt:   (pOption.guessOptions?pOption.guessOptions:0)
    };
    mesData["fleet"][ite.userId] = webinfo;

}

