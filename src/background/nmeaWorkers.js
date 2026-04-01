import {formatGPRMC,formatIIMWV, formatIIVWR, formatIIHDT, formatRPM,
    nmeaChecksum, crc32, 
    formatAIVDM_AIS_msg1, formatAIVDM_AIS_msg5
} from './nmeaUtils.js'
import {getData,saveData,getLatestEntriesPerUser,getLatestAndPreviousByTriplet} from '../common/dbOpes.js';
import {isDisplayEnabled} from '../dashboard/app/sortManager.js'

const NmeaState = {

    proxyPort: "8081",
    raceId: null,
    legNum : null,
    playerInfo : null,
    fleetInfo : [],
    currentUserId : null,
    state : 'off'
}

export function setNmeaActiveRace(raceId,legNum)
{
    NmeaState.raceId = raceId;
    NmeaState.legNum = legNum;
}

export async function setNmeaState(state)
{
    if(NmeaState.state!=state)
    {
        void saveData(
            'internal',
            { id: 'NMEAstate', state: state },
            null,
            { updateIfExists: true }
        );
        NmeaState.state=state;
    }
}

export async function setNmeaPlayerInfos(raceId,legNum,userId)
{

    if(!raceId || !legNum || !userId) return;
    const { latest, meta } = await getLatestAndPreviousByTriplet(raceId, legNum, userId , {storeName: 'legPlayersInfos'});
    if(meta.timedOut || !latest) return;

    if(NmeaState.raceId != raceId || NmeaState.legNum != legNum) setNmeaActiveRace(raceId,legNum);
    NmeaState.currentUserId = userId;
    NmeaState.playerInfo = 
    {
        iteDate :   latest.iteDate,
        pos :       latest.pos,
        speed :     latest.speed,
        hdg :       latest.hdg,
        tws :       latest.tws,
        twa :       latest.twa,
        realStamina : (latest.metaDash?.realStamina?latest.metaDash?.realStamina:latest.stamina),
        sail :      latest.sail,
    };
}

export async function setNmeaFleetInfos(raceId, legNum)
{
    
    if(!raceId || !legNum || !NmeaState.currentUserId) return;
    if(NmeaState.raceId != raceId || NmeaState.legNum != legNum) setNmeaActiveRace(raceId,legNum);

    NmeaState.fleetInfo = [];
    const now = Date.now();
    const fifteenMinutesAgo = now - 15 * 60 * 1000;
    
    const { items, meta } = await getLatestEntriesPerUser(raceId, legNum, {
        since: fifteenMinutesAgo,
        until: now,
        timeout: 4000,
        storeName: 'legFleetInfos'
    });
    if(meta.timedOut || !items || items.length == 0) return;
    for (const [userId, entry] of Object.entries(items)) {

        if(isDisplayEnabled(entry, userId,NmeaState.currentUserId) && NmeaState.currentUserId != userId)
        {
            const pDbcInfos = (await getData('players', userId)) ??null;
    
            if(!pDbcInfos?.name) continue;

            const mmsi = crc32(pDbcInfos.name) & 0x3FFFFFFF;
            const pInfos = {
                mmsi : mmsi,
                displayName : pDbcInfos?.name,
                speed : entry.speed,
                pos : entry.pos,
                hdg : entry.hdg,
            };
            NmeaState.fleetInfo.push(pInfos);
        }
    }
}

export async function loadNmeaPrefs()
{
    const dbUserPrefs = await getData('internal', 'userPrefs').catch(() => null);
    const prefs = dbUserPrefs?.prefs ?? null;

    return {
        requested: prefs?.nmea?.requested ,
        port: String(prefs?.nmea?.port ?? 8081),
    };
}

export async function buildNmeaSnapshotFromDb()
{
    const currentRace = await getData('internal', 'lastOpennedRace').catch(() => null);
    const currentId = await getData('internal', 'lastLoggedUser').catch(() => null);
    const prefs = await loadNmeaPrefs();

    NmeaState.proxyPort = prefs.port;

    if (!currentRace?.raceId || !currentRace?.legNum) {
        return {
            requested: prefs.requested,
            proxyPort: prefs.port,
            raceId: null,
            legNum: null,
            currentUserId: currentId?.loggedUser ?? null,
            playerInfo: null,
            fleetInfo: [],
        };
    }

    setNmeaActiveRace(currentRace.raceId, currentRace.legNum);

    if (currentId?.loggedUser) {
        await setNmeaPlayerInfos(
            currentRace.raceId,
            currentRace.legNum,
            currentId.loggedUser
        );
        await setNmeaFleetInfos(
            currentRace.raceId,
            currentRace.legNum
        );
    }

    return {
        requested: prefs.requested,
        proxyPort: prefs.port,
        raceId: NmeaState.raceId,
        legNum: NmeaState.legNum,
        currentUserId: NmeaState.currentUserId,
        playerInfo: NmeaState.playerInfo,
        fleetInfo: NmeaState.fleetInfo,
    };
}
