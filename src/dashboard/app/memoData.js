
import {getData,getAllData,getLatestEntriesPerUser,getEntriesForTriplet,getLegPlayersOptionsByRaceLeg,getLegPlayersTracksByType} from '../../common/dbOpes.js';

let connectedPlayerId;
let connectedPlayerInfos = [];
let openedRaceId ={raceId : null, legNum : null, polarId :null};
let openedRaceIdHistory = [];
let raceInfo = [];
let legListUpdate = 0;
let raceList = [];
let playersUpdate = 0;
let playersList = [];
let teamsUpdate = 0;
let teamList = [];
let polarsUpdate = 0;
let polar = [];
let legFleetInfosUpdate = 0;
let legFleetInfos = [];
let legPlayersInfosUpdate = 0;
let legPlayerInfos = [];
let legPlayerInfosHistory = [];
let legPlayersOptionsUpdate = 0;
let legPlayersOptions = [];
let paramStamina = [];
let legPlayersOrderUpdate = 0;
let legPlayersOrder = [];
let legSelectedPlayers = [];
let legPlayersTracksUpdate = 0;
let legPlayersTracks = [];


export async function initMemo()
{
    const currentId = await getData('internal', 'lastLoggedUser');
    const currentRace = await getData('internal', 'lastOpennedRace');

    if(currentId) connectedPlayerId = currentId.loggedUser; else connectedPlayerId = null; 

    await updatePlayersList();
    await updateTeamsList();
    await updateConnectedPlayerInfos();

    if(currentRace && currentRace.raceId && currentRace.legNum)
    {
        openedRaceId.raceId = currentRace.raceId;
        openedRaceId.legNum = currentRace.legNum;
        await updateOpenedRaceId()
        await updatePolar();
        await updateLegFleetInfos();
        await updateLegPlayerInfos();
        await updateLegPlayersOrder();
        await updateLegPlayersOptions();
        await updateLegPlayersTracks();

    } else
    {
        raceList = [];
        raceInfo = [];
        polar = [];
        legFleetInfos = [];
        legPlayerInfos = [];
        legPlayerInfosHistory = [];
        legPlayersOptions = [];
        legPlayersTracks = [];
    }
    openedRaceIdHistory = [];
    legPlayerInfosHistory = [];
    legSelectedPlayers = [];
    
    paramStamina = [];
    await updateParamStamina();
    legListUpdate = await getData('internal', 'legListUpdate');
    playersUpdate = await getData('internal', 'playersUpdate');
    teamsUpdate = await getData('internal', 'teamsUpdate');
    polarsUpdate = await getData('internal', 'polarsUpdate');
    legFleetInfosUpdate = await getData('internal', 'legFleetInfosDashUpdate');
    legPlayersInfosUpdate = await getData('internal', 'legPlayersInfosDashUpdate');
    legPlayersOptionsUpdate = await getData('internal', 'legPlayersOptionsUpdate');
}

async function updateParamStamina() {
    const setting = await getData("internal","paramStamina")    .catch(error => {
        console.error("getParamstamina error :", error);
    }); 
    if(setting?.paramStamina)
        paramStamina = setting.paramStamina;     
}
export function getRaceInfo(){
    return raceInfo;
}
export function getParamStamina(){
    return paramStamina;
}

export function setLegSelectedPlayers(uid,selected)
{
    legSelectedPlayers[uid] = selected;
}

export function getLegSelectedPlayersState(uid)
{
    if(legSelectedPlayers[uid]) return true;
    else return false;
}


export function getOpenedRaceHistory() 
{
    return openedRaceIdHistory;
}
export function getLegPlayerInfosHistory() 
{
    return legPlayerInfosHistory;
}

export function getLegListUpdate()
{
    return legListUpdate;
}
export function setLegListUpdate(ts)
{
    legListUpdate = ts;
}

export function getLegList()
{
    return raceList; 
}
export async function updateLegList() {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const legList = await getAllData('legList');

    if (!Array.isArray(legList) || legList.length === 0) {
      /*if (cfg.debugDB)*/ console.warn('[updateLegList] legList vide ou non-tableau:', legList);
      raceList = {};            // objet, pas tableau
      raceInfo = null;
      return { raceList, raceInfo };
    }

    // Exclure les courses finies depuis > 1 semaine
    const filtered = legList.filter(leg => {
      const endDate = leg?.end?.date ? new Date(leg.end.date) : null;
      const isFinishedOld =
        leg?.status === 'finished' &&
        endDate instanceof Date &&
        !Number.isNaN(endDate.valueOf()) &&
        endDate < oneWeekAgo;

      return !isFinishedOld && leg?.id !== 'update';
    });

    // Tri par date de départ croissante
    filtered.sort((a, b) => {
      const da = new Date(a?.start?.date || 0);
      const db = new Date(b?.start?.date || 0);
      return da - db;
    });

    // Construire la map des courses
    const map = Object.create(null);
    let foundRaceInfo = null;

    for (const leg of filtered) {
      const fullRaceId = `${leg.raceId}-${leg.legNum}`;
      map[fullRaceId] = {
        raceId: leg.raceId,
        legNum: leg.legNum,
        name: leg.legName,
      };

      if (
        openedRaceId?.raceId != null &&
        openedRaceId?.legNum != null &&
        openedRaceId.raceId === leg.raceId &&
        openedRaceId.legNum === leg.legNum
      ) {
        foundRaceInfo = leg;
      }
    }

    raceList = map;     // ✅ objet associatif
    raceInfo = foundRaceInfo ?? null;

    /*if (cfg.debugDB) */console.log('[updateLegList] races:', Object.keys(raceList).length, 'raceInfo:', !!raceInfo);
    return { raceList, raceInfo };
  } catch (error) {
    console.error('[updateLegList] error:', error);
    // À toi de voir si tu veux réinitialiser ou préserver l’ancien état
    raceList = raceList ?? {};
    raceInfo = raceInfo ?? null;
    return { raceList, raceInfo };
  }
}

/*
export async function updateLegList()
{
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const legList = await getAllData("legList")
    .catch(error => {
        console.error("getLegList error :", error);
    });
    // Filtrage : exclusion des courses terminées depuis + d'une semaine
    const filtered = legList.filter(leg => {
    const endDate = leg.end?.date ? new Date(leg.end.date) : null;
    const isFinishedOld =
        leg.status === "finished" &&
        endDate &&
        endDate < oneWeekAgo;
        return !isFinishedOld && leg.id !== "update";
    });

    // Tri par date de départ croissante
    filtered.sort((a, b) => {
        const da = new Date(a.start?.date || 0);
        const db = new Date(b.start?.date || 0);
        return da - db;
    });

    raceList = [];
    if (filtered.length !== 0) {
        filtered.forEach(leg => {
            const raceListItem = {raceId : leg.raceId, legNum:leg.legNum,name : leg.legName};
            const fullRaceId = leg.raceId + '-' + leg.legNum;
            raceList[fullRaceId] = raceListItem;

            if(openedRaceId?.raceId && openedRaceId?.legNum
                && openedRaceId.raceId == leg.raceId && openedRaceId.legNum == leg.legNum 
            ) {
                raceInfo = leg;
            }
        });
    }
}
*/
export function getPlayersUpdate()
{
    return playersUpdate;
}
export function setPlayersUpdate(ts)
{
    playersUpdate = ts;
}

export function getPlayersList()
{
    return playersList;
}

export async function updatePlayersList()
{
    const playersDatas = await getAllData("players").catch(error => {
        console.error("getplayerList error :", error);
    }); 
    playersList = [];
    if (playersDatas.length !== 0) {
        playersDatas.forEach(player => {
            playersList[player.id] = player;
            if(player.id == connectedPlayerId)
            {
                connectedPlayerInfos = player;
            }
        });
    }         
}

export function getTeamsUpdate()
{
    return teamsUpdate;
}
export function setTeamsUpdate(ts)
{
    teamsUpdate = ts;
}

export function getTeamsList()
{
    return teamList;
}

export async function updateTeamsList()
{
    const teamsDatas = await getAllData("teams")
    .catch(error => {
        console.error("getTeamsList error :", error);
    });
    teamList = [];
    if (teamsDatas.length !== 0) {
        teamsDatas.forEach(team => {
            teamList[team.id] = team;
        });
    }
   
}

export function getPolarsUpdate()
{
    return polarsUpdate;
}
export function setPolarsUpdate(ts)
{
    polarsUpdate = ts;
}
export function getPolar()
{
    return polar;
}

export async function updatePolar()
{
    if(raceInfo?.polarId)
    {
        const polarData = await getData("polars",raceInfo.polarId)
                        .catch(error => {console.error("getPolar error :", error);});
        polar = [];
        if(polarData)
            polar = polarData;    
    }
}

export function getLegFleetInfosUpdate()
{
    return legFleetInfosUpdate;
}
export function setLegFleetInfosUpdate(ts)
{
    legFleetInfosUpdate = ts;
}
export function getLegFleetInfos()
{
    return legFleetInfos;
}

export async function updateLegFleetInfos()
{
    if(raceInfo?.raceId && raceInfo?.legNum)
    { 
        const now = Date.now();
        const fifteenMinutesAgo = now - 15 * 60 * 1000;
        const raceId = raceInfo.raceId;
        const legNum = raceInfo.legNum;

        const { items, meta } = await getLatestEntriesPerUser(raceId, legNum, {
            since: fifteenMinutesAgo,
            until: now,
            timeout: 4000,
            storeName: 'legFleetInfos'
        });
        if(!items || items?.length == 0) return; 

        legFleetInfos = [];
        for (const item of Object.entries(items)) {
            if(!'userId' in item[1]) continue;
            const userId = item[1].userId;

            const playerOptionRace = legPlayersOptions[userId]?legPlayersOptions[userId]:{options:[],guessOptions:0};
            const playerInfo = playersList[userId];
            const teamInfo = playerInfo?.teamId?(teamList[playerInfo.teamId]?teamList[playerInfo.teamId]:{id:null,name:""}):{id:null,name:""};
            const itePlayer = {
                ite :item[1],             // ← ton tableau d’entrées
                info: playerInfo,
                team : teamInfo,
                options: playerOptionRace,
            };
            
            legFleetInfos[userId] = itePlayer; 

            if(item[1].choice) legSelectedPlayers[userId] = true;
        }
    } else
        legFleetInfos = [];
}


export function getLegPlayersInfosUpdate()
{
    return legPlayersInfosUpdate;
}
export function setLegPlayersInfosUpdate(ts)
{
    legPlayersInfosUpdate = ts;
}
export function getLegPlayerInfos()
{
    return legPlayerInfos;
}
export async function updateLegPlayerInfos()
{
    if(raceInfo?.raceId && raceInfo?.legNum && connectedPlayerId)
    { 
        const raceId = raceInfo.raceId;
        const legNum = raceInfo.legNum;
        const { items, meta } = await getEntriesForTriplet(    raceId,legNum,connectedPlayerId,{limit:24*10*60,since:Date.now() - 10*24*60 * 60 * 1000, });
        if(meta.timeout || !items || items.length == 0) return;
        const playerInfo = playersList[connectedPlayerId];
        const teamInfo = playerInfo?.teamId?(teamList[playerInfo.teamId]?teamList[playerInfo.teamId]:{id:null,name:""}):{id:null,name:""};
        const playerOptionRace = legPlayersOptions[connectedPlayerId]?legPlayersOptions[connectedPlayerId]:{options:[],guessOptions:0};
        const legPlayerIte = {
            ites : items,             // ← ton tableau d’entrées
            info: playerInfo,
            team : teamInfo,
            options: playerOptionRace,
        };
        legPlayerInfos = legPlayerIte;
    } else
        legPlayerInfos = [];
}


export function getLegPlayersOrderUpdate()
{
    return legPlayersOrderUpdate;
}
export function setLegPlayersOrderUpdate(ts)
{
    legPlayersOrderUpdate = ts;
}
export function getLegPlayersOrder()
{
    return legPlayersOrder;
}
export async function updateLegPlayersOrder()
{
    if(raceInfo?.raceId && raceInfo?.legNum && connectedPlayerId)
    { 
        const raceId = raceInfo.raceId;
        const legNum = raceInfo.legNum;
        const { items, meta } = await getEntriesForTriplet(    raceId,legNum,connectedPlayerId,{    storeName : 'legPlayersOrder',limit:24*10*60,since:Date.now() - 10*24*60 * 60 * 1000, });
        if(meta.timeout || !items || items.length == 0) return;
        
        legPlayersOrder = items;
    } else
        legPlayersOrder = [];
}

export function getLegPlayersOptionsUpdate()
{
    return legPlayersOptionsUpdate;
}
export function setLegPlayersOptionsUpdate(ts)
{
    legPlayersOptionsUpdate = ts;
}


export function getLegPlayersOptions()
{
    return legPlayersOptions;
}

export async function updateLegPlayersOptions()
{
    if(raceInfo?.raceId && raceInfo?.legNum && connectedPlayerId)
    { 
        const raceId = raceInfo.raceId;
        const legNum = raceInfo.legNum;

        const playersOptList = await getLegPlayersOptionsByRaceLeg(raceId,legNum)
                        .catch(error => {console.error("getlayersOptions error :", error);});
        legPlayersOptions = (playersOptList && playersOptList.length !=0)?playersOptList:[]; 
    }
}


export function getLegPlayersTracksUpdate()
{
    return legPlayersTracksUpdate;
}
export function setLegPlayersTracksUpdate(ts)
{
    legPlayersTracksUpdate = ts;
}


export function getLegPlayersTracksFleet()
{
    return legPlayersTracks.fleet?legPlayersTracks.fleet:[];
}

export function getLegPlayersTrackLeader()
{
    return legPlayersTracks.leader?legPlayersTracks.leader:[];
}


export function getLegPlayersTracksGhost()
{
    if(!connectedPlayerId || !legPlayersTracks.ghosts 
        || legPlayersTracks.ghosts.lenght == 0 
        || legPlayersTracks.ghosts[connectedPlayerId] == 0)
         return [];
    return legPlayersTracks.ghosts[connectedPlayerId];
}

export async function updateLegPlayersTracks()
{
    if(raceInfo?.raceId && raceInfo?.legNum)
    { 
        const raceId = raceInfo.raceId;
        const legNum = raceInfo.legNum;

        legPlayersTracks = {};
        const fleetTracksList = await getLegPlayersTracksByType(raceId,legNum,'fleet',{ asMap: true })
                .catch(error => {console.error("fleetTracksList error :", error);});
        legPlayersTracks.fleet  = (fleetTracksList && fleetTracksList.length !=0)?fleetTracksList:[]; 
        const leaderTrackList = await getLegPlayersTracksByType(raceId,legNum,'leader',{ asMap: true })
                .catch(error => {console.error("leaderTrackList error :", error);});
        legPlayersTracks.leader  = (leaderTrackList && leaderTrackList.length !=0)?leaderTrackList:[]; 
        const goshtTrackList = await getLegPlayersTracksByType(raceId,legNum,'ghost',{ asMap: true })
                .catch(error => {console.error("goshtTrackList error :", error);});
        legPlayersTracks.ghosts  = (goshtTrackList && goshtTrackList.length !=0)?goshtTrackList:[]; 
        
        
        
        
        
    /*    const { items, meta } = await getLegPlayersTracksByType(    raceId,legNum,'fleet',{ asMap: true });
        if(meta.timeout || !items || items.length == 0) legPlayersTracks.fleet = [];
        else legPlayersTracks.fleet = items;

        const { items2, meta2 } = await getLegPlayersTracksByType(    raceId,legNum,'leader');
        if(meta2.timeout || !items2 || items2.length == 0) legPlayersTracks.leader = [];
        else legPlayersTracks.leader = items2;

        const { items3, meta3 } = await getLegPlayersTracksByType(    raceId,legNum,'ghost');
        if(meta3.timeout || !items3 || items3.length == 0) legPlayersTracks.ghosts = [];
        else legPlayersTracks.ghosts = items3;*/
    }
}


export function getConnectedPlayerId()
{
    return connectedPlayerId;
}
export function setConnectedPlayerId(uid)
{
    connectedPlayerId = uid;
    /* update connecterPlayerInfos */
}
export function getConnectedPlayerInfos()
{
    return connectedPlayerInfos;
}
export async function updateConnectedPlayerInfos()
{
    if(playersList[connectedPlayerId])
    {
        const playerInfo = playersList[connectedPlayerId];
        const teamInfo = playerInfo?.teamId?(teamList[playerInfo.teamId]?teamList[playerInfo.teamId]:{id:null,name:""}):{id:null,name:""};
        connectedPlayerInfos = {...playerInfo,team:teamInfo};
        legSelectedPlayers[connectedPlayerId] = true;
    } else
        connectedPlayerInfos  = [];
}

export function getOpenedRaceId()
{
    return openedRaceId;
}

export async function updateOpenedRaceId()
{
    await updateLegList();
    openedRaceId.polarId = raceInfo.polar_id;
    legSelectedPlayers = [];
    if(connectedPlayerId) legSelectedPlayers[connectedPlayerId] = true;
}

export function setOpenedRaceId(rid, legNum) {


    if (!openedRaceIdHistory) openedRaceIdHistory = {};
    if (!legPlayerInfosHistory) legPlayerInfosHistory = {};

    if(openedRaceId?.raceId && openedRaceId?.legNum)
    {
        const key = `${openedRaceId.raceId}-${openedRaceId.legNum}`;

        if (!openedRaceIdHistory[key]) {
            openedRaceIdHistory[key] = { raceId: openedRaceId.raceId, legNum : openedRaceId.legNum };
            console.log(`[setOpenedRaceId] Ajouté à l'historique : ${key}`);
        }

        if (legPlayersInfos) {
            legPlayerInfosHistory[key] = structuredClone(legPlayersInfos);
            console.log(`[setOpenedRaceId] Copie legPlayersInfos -> legPlayerInfosHistory[${key}]`);
        } else if (!legPlayerInfosHistory[key]) {
            legPlayerInfosHistory[key] = {};
            console.log(`[setOpenedRaceId] Initialisation legPlayerInfosHistory[${key}] vide`);
        }
    }
    openedRaceId.raceId = rid;
    openedRaceId.legNum = legNum;

    updateParamStamina();

}