import * as msgInjest from './data/msgIngestDef.js';
import {
    ensureOffscreen,
    sendToOffscreen,
    startNmeaOffscreen,
    stopNmeaOffscreen,
    updateNmeaOffscreenSnapshot,
} from './ensureOffscreen.js';
import { computeOwnIte, computeFleetIte } from './iteRun.js';
import { createKeyChangeListener, getAllData, getData, saveData, deleteByRaceLeg } from '../common/dbOpes.js';
import { loadUserPrefs } from '../common/userPrefs.js';
import { buildEmbeddedToolbarHtml, getbuildEmbeddedToolbarContent } from '../dashboard/ui/embeddedToolbar.js';
import { manageDashState } from './dashState.js';
import {
  syncLatestWindpacks,
  buildRunInfo,
  syncLatestWindpacksWindowed,
  ensureWindpackByRunIdFh,
  WIND_MODEL,
} from './windBackground.js';

import { 
    getTeamListITYC,getRaceListITYC,getPlayerListITYC,getRaceOptionsListITYC,
    sendLegDataITYC,sendInfoOptITYC,getPolarHashITYC,itycPolarSync
} from './itycInterface.js'; 

import {getRaceListZezo,getRaceListVrZen,openRouterSiteBack,openPolarSiteBack} from '../common/callExternal.js'

import {
    setNmeaActiveRace,
    setNmeaPlayerInfos,
    setNmeaFleetInfos,
    buildNmeaSnapshotFromDb,
    setNmeaState
} from './nmeaWorkers.js'
import cfg from '@/config.json';
const version = '1.0';
let debuggeeTab;
let dashboardTab;

const pending = new Map();
const CLOSED_RACE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const PURGE_STORES = [
    'legFleetInfos',
    'legPlayersInfos',
    'legPlayersOptions',
    'legPlayersOrder',
    'playersTracks',
];
let closedRacePurgePromise = null;



// marquer l’état interne
saveData('internal', { id: 'state', state: 'dashInstalled' });
void loadUserPrefs();

/* =========================================================
*  Offscreen / Heavy jobs handling
* ======================================================= */

chrome.runtime.onMessage.addListener((msg, _sender, _sendResponse) => {
    // gestion des retours de jobs offscreen → target: 'bg'
    if (msg?.target !== 'bg') return;

    if (msg.type === 'job:done' && pending.has(msg.id)) {
        pending.get(msg.id).resolve(msg.summary);
        pending.delete(msg.id);
    }
    if (msg.type === 'job:error' && pending.has(msg.id)) {
        pending.get(msg.id).reject(new Error(msg.error || 'Offscreen/Worker error'));
        pending.delete(msg.id);
    }

    if (msg.type === 'nmea/state') {
        setNmeaState(msg.state);
    }
});

export async function runHeavyJob(descriptor) {
    await ensureOffscreen();

    const id = crypto.randomUUID();
    const resP = new Promise((resolve, reject) =>
        pending.set(id, { resolve, reject })
    );

    await sendToOffscreen('job:start', {
        id,
        descriptor,
    });

    return resP;
}

async function pushNmeaSnapshot() {
    const snapshot = await buildNmeaSnapshotFromDb();
    await updateNmeaOffscreenSnapshot(snapshot);
    return snapshot;
}

async function syncNmeaLifecycleFromPrefs() {
    const snapshot = await buildNmeaSnapshotFromDb();

    if (snapshot.requested) {
        await startNmeaOffscreen(snapshot);
    } else {
        await stopNmeaOffscreen(snapshot);
    }
}

function normalizeEpochMs(value) {
    const timestamp = Number(value);
    if (!Number.isFinite(timestamp) || timestamp <= 0) return null;
    return timestamp < 1e12 ? timestamp * 1000 : timestamp;
}

function getClosedRaceLegs(legList, now = Date.now()) {
    if (!Array.isArray(legList) || legList.length === 0) return [];

    const cutoff = now - CLOSED_RACE_RETENTION_MS;
    const seen = new Set();

    return legList.filter((leg) => {
        const endDate = normalizeEpochMs(leg?.end?.date);
        if (!endDate || endDate > cutoff) return false;

        const raceId = Number(leg?.raceId);
        const legNum = Number(leg?.legNum);
        if (!Number.isFinite(raceId) || !Number.isFinite(legNum)) return false;

        const key = `${raceId}-${legNum}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function purgeClosedRaceData() {
    if (closedRacePurgePromise) return closedRacePurgePromise;

    closedRacePurgePromise = (async () => {
        try {
            const legList = await getAllData('legList');
            const closedRaceLegs = getClosedRaceLegs(legList);

            if (closedRaceLegs.length === 0) return;

            let deletedCount = 0;

            for (const leg of closedRaceLegs) {
                for (const storeName of PURGE_STORES) {
                    deletedCount += await deleteByRaceLeg(storeName, leg.raceId, leg.legNum);
                }
            }

            if (deletedCount > 0) {
                const ts = Date.now();
                await saveData('internal', { id: 'legFleetInfosUpdate', ts }, null, { updateIfExists: true });
                await saveData('internal', { id: 'legFleetInfosDashUpdate', ts }, null, { updateIfExists: true });
                await saveData('internal', { id: 'legPlayersInfosUpdate', ts }, null, { updateIfExists: true });
                await saveData('internal', { id: 'legPlayersInfosDashUpdate', ts }, null, { updateIfExists: true });
                await saveData('internal', { id: 'legPlayersOptionsUpdate', ts }, null, { updateIfExists: true });
                await saveData('internal', { id: 'legPlayersOrderUpdate', ts }, null, { updateIfExists: true });
                await saveData('internal', { id: 'playersTracksUpdate', ts }, null, { updateIfExists: true });
            }
        } catch (error) {
            console.error('[bg] closed race purge failed', error);
        } finally {
            closedRacePurgePromise = null;
        }
    })();

    return closedRacePurgePromise;
}

/* =========================================================
*  Action / Tab management (VR + dashboard)
* ======================================================= */

chrome.action.onClicked.addListener(onStartDash);

function onStartDash(tab) {
    if (tab && tab.url && tab.url.indexOf('virtualregatta.com') >= 0) {
        debuggeeTab = tab;
        onAttach(tab.id);
    }
}

function onAttach(tabId) {
    if (chrome.runtime.lastError) {
        console.error('[bg] onAttach error:', chrome.runtime.lastError.message);
    } else {
        if (!dashboardTab) {
            chrome.tabs.create(
                { url: 'dashboard.html?' + tabId, active: false },
                function (tab) {
                dashboardTab = tab;
                }
            );
        }
    }
}

function autoReloadTab(tabs) {
    tabs.forEach((tab) => {
        if (tab.url && tab.url.indexOf(chrome.runtime.id + '/dashboard.html') >= 0) {
            dashboardTab = tab;
            chrome.tabs.reload(tab.id);
            console.log('autoreload:', tab.id, tab.url);
        }
    });
}

chrome.tabs.onUpdated.addListener(checkForValidUrl);
chrome.tabs.onActivated.addListener(function (activeInfo) {
chrome.tabs.get(activeInfo.tabId, function (tab) {
 checkForValidUrl(activeInfo.tabId, null, tab);
});
});

function checkForValidUrl(tabId, changeInfo, tabInfo) {
    try {
        if (tabInfo && tabInfo.url && tabInfo.url.indexOf('virtualregatta.com') >= 0) {
            if (!debuggeeTab) {
                debuggeeTab = tabInfo;
            }
            if (!dashboardTab) {
                // navigateur relancé avec dash fermé → on essaie de le retrouver
                chrome.tabs.query({}).then(autoReloadTab);
            }
        }
    } catch (e) {
        console.log('Tab is gone:', tabId, e);
    }
}

chrome.tabs.onRemoved.addListener(onTabRemoved);

function onTabRemoved(tabId, removeInfo) {
    if (debuggeeTab && tabId === debuggeeTab.id) {
        try {
            debuggeeTab = undefined;
        if (dashboardTab) chrome.tabs.remove(dashboardTab.id);
            dashboardTab = undefined;
        } catch (e) {
            console.log(JSON.stringify(e));
        }
    } else if (dashboardTab && tabId === dashboardTab.id) {
        dashboardTab = undefined;
    }
}

/* =========================================================
*  DeclarativeContent (icon + activation)
* ======================================================= */

// Précharger l’icon 128px pour declarativeContent
let icon128Promise = (async function loadIcon128() {
    const img = await createImageBitmap(
    await (await fetch(chrome.runtime.getURL('icon.png'))).blob()
    );
    const { width: w, height: h } = img;
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    return ctx.getImageData(0, 0, w, h);
})();

// Config declarativeContent
(async () => {
    const icon128 = await icon128Promise;

    chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
        chrome.declarativeContent.onPageChanged.addRules([
            {
                conditions: [
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: { hostPrefix: 'www.virtualregatta.', pathContains: '/offshore-' },
                }),
                ],
                actions: [
                new chrome.declarativeContent.SetIcon({
                    imageData: {
                    128: icon128,
                    },
                }),
                chrome.declarativeContent.ShowAction
                    ? new chrome.declarativeContent.ShowAction()
                    : new chrome.declarativeContent.ShowPageAction(),
                ],
            },
        ]);
        });
})();

/* =========================================================
*  OnInstalled + Alarm vent 5j
* ======================================================= */

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    try {
    await chrome.windows.create({
        url: chrome.runtime.getURL('popup.html'),
        type: 'popup',
        height: 150,
        width: 300,
    });
    } catch (error) {
        console.log(error);
    }
    }

    // sync vent toutes les 2 minutes
    chrome.alarms.create('wind-sync-5d', {
        delayInMinutes: 1,
        periodInMinutes: 2,
    });
    chrome.alarms.create('ityc-infos-update', {
        delayInMinutes: 15,
        periodInMinutes: 15,
    });

    
    try {
        await syncLatestWindpacksWindowed();
        await getTeamListITYC({ forceRefresh: true });
        await getPlayerListITYC({ forceRefresh: true });
        await getRaceListITYC({ forceRefresh: true });
        await getPolarHashITYC({ forceRefresh: true });
        await getRaceListZezo({ forceRefresh: true });
        await getRaceListVrZen({ forceRefresh: true });
        
        await syncNmeaLifecycleFromPrefs();
    } catch (e) {
        console.error('[teams] [players] [raceList] [synchroWind] [nmea] initial sync onInstalled failed', e);
    }  
});

chrome.runtime.onStartup.addListener(() => {
    (async () => {
        try {
            await syncLatestWindpacksWindowed();
            await getTeamListITYC(); 
            await getPlayerListITYC();
            await getRaceListITYC();
            await getPolarHashITYC();
            await getRaceListZezo();
            await getRaceListVrZen();
            await syncNmeaLifecycleFromPrefs();
        } catch (e) {
            console.error('[teams] [players] [raceList] [synchroWind] [nmea] initial sync onStartup failed', e);
        }
    })();
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'wind-sync-5d') {
        (async () => {
            try {
                await syncLatestWindpacksWindowed();
            } catch (e) {
                console.error('[synchroWind] erreur sur alarm sync-5d', e);
            }
        })();
    } else if (alarm.name === 'ityc-infos-update') {
        (async () => {
            try {
                await getTeamListITYC();
                await getPlayerListITYC();
                await getRaceListITYC();
                await getPolarHashITYC();
            } catch (e) {
                console.error('[teams] [players] [raceList] periodic sync failed', e);
            }
        })();
    }
});

/* =========================================================
*  VR external messages (proxy HTTP)
* ======================================================= */

chrome.runtime.onMessageExternal.addListener(
    async function (request, sender, sendResponse) {
        const msg = request;
        let rstTimer = false;

        console.log('bg R external', msg.type);

        if (msg.type === 'data') {
            if (msg.req && msg.req.Accept) {
                // json ranking request non géré
                sendResponse({ type: 'dummy' });
                return;
            }

            const postData = JSON.parse(msg.req);
            const eventClass = postData['@class'];
            const body = JSON.parse(msg.resp.replace(/\bNaN\b|\bInfinity\b/g, 'null'));

            if (eventClass === 'AccountDetailsRequest') {
                await msgInjest.ingestAccountDetails(body);
            } else if (eventClass === 'LogEventRequest') {
                const eventKey = postData.eventKey;
                if (eventKey === 'Leg_GetList') {
                    await msgInjest.ingestRaceList(body);
                } else if (eventKey === 'Game_EndLegPrep') {
                    await msgInjest.ingestEndLegPrep(body);
                } else if (eventKey === 'Game_GetSettings') {
                    await msgInjest.ingestGameSetting(body);
                } else if (eventKey === 'Race_SelectorData') {
                    await msgInjest.ingestPolars(body);
                    await itycPolarSync(body);
                } else if (eventKey === 'Game_AddBoatAction') {
                    await msgInjest.ingestBoatAction(body);
                } else if (eventKey === 'Game_GetGhostTrack') {
                    await msgInjest.ingestGhostTrack(postData, body);
                }
            } else {
                const event = msg.url.substring(msg.url.lastIndexOf('/') + 1);
                if (event === 'getboatinfos') {
                    const ret = await msgInjest.ingestBoatInfos(body);
                    rstTimer = ret.rstTimer;
                    await sendLegDataITYC(body);
                    await sendInfoOptITYC(body);
                } else if (event === 'getfleet') {
                    await msgInjest.ingestFleetData(postData, body);
                }
            }
        } else if(msg.type=="openZezo") {
            await openRouterSiteBack("zezo");  
        } else if(msg.type=="openVrzen") {
            await openRouterSiteBack("vrzen"); 
        } else if(msg.type=="openItyc") {
            await openPolarSiteBack("ITYC"); 
        } else if(msg.type=="openToxxct") {
            await openPolarSiteBack("POLAR");
        }
        void chrome.runtime.getPlatformInfo();

        const embeddedToolbar = getbuildEmbeddedToolbarContent();
        embeddedToolbar.rstTimer = rstTimer;
        sendResponse({ ...embeddedToolbar, type: 'update' });
    }
);

/* =========================================================
*  Listeners sur IndexedDB (internal)
* ======================================================= */

const dashStateInfosListener = createKeyChangeListener('internal', 'state');
dashStateInfosListener.start({
    referenceValue: { state: '' },
        onChange: async ({ oldValue, newValue }) => {
        const currentId = await getData('internal', 'lastLoggedUser');
        const currentRace = await getData('internal', 'lastOpennedRace');
        if (!currentRace || !currentId) return;
        await buildEmbeddedToolbarHtml(
            currentRace.raceId,
            currentRace.legNum,
            currentId.loggedUser
        );
        await getRaceOptionsListITYC(currentRace.raceId,currentRace.legNum);
    },
});

const legPlayersInfosListener = createKeyChangeListener(
    'internal',
    'legPlayersInfosUpdate'
);
legPlayersInfosListener.start({
    referenceValue: { loggedUser: Date.now() },
    onChange: async ({ oldValue, newValue }) => {
        const currentId = await getData('internal', 'lastLoggedUser');
        const currentRace = await getData('internal', 'lastOpennedRace');
        if (!currentId || !currentRace) return;
        await manageDashState('raceOpened');
        await computeOwnIte(
            currentRace.raceId,
            currentRace.legNum,
            currentId.loggedUser
        );
        await buildEmbeddedToolbarHtml(
            currentRace.raceId,
            currentRace.legNum,
            currentId.loggedUser
        );
        await setNmeaPlayerInfos(
            currentRace.raceId,
            currentRace.legNum,
            currentId.loggedUser
        );
        await pushNmeaSnapshot();
    },
});

const legFleetInfosListener = createKeyChangeListener(
    'internal',
    'legFleetInfosUpdate'
);
legFleetInfosListener.start({
    referenceValue: { loggedUser: Date.now() },
    onChange: async ({ oldValue, newValue }) => {
        const currentRace = await getData('internal', 'lastOpennedRace');
        if (!currentRace) return;
        await manageDashState('raceOpened');
        await computeFleetIte(currentRace.raceId, currentRace.legNum);
        await setNmeaFleetInfos(currentRace.raceId, currentRace.legNum);
        await pushNmeaSnapshot();
    },
});

const connectedUserListener = createKeyChangeListener(
    'internal',
    'lastLoggedUser'
);
connectedUserListener.start({
    referenceValue: { loggedUser: null },
    onChange: async ({ oldValue, newValue }) => {
        if (newValue && newValue.loggedUser) {
            const currentRace = await getData('internal', 'lastOpennedRace');
            if (!currentRace) return;
            await manageDashState('playerConnected');
            await buildEmbeddedToolbarHtml(
                currentRace.raceId,
                currentRace.legNum,
                newValue.loggedUser
            );
        }
    },
});

const connectedRaceListener = createKeyChangeListener(
    'internal',
    'lastOpennedRace'
);
connectedRaceListener.start({
    referenceValue: { raceId: null, legNum: null },
    onChange: async ({ oldValue, newValue }) => {
        const currentId = await getData('internal', 'lastLoggedUser');
        if (!currentId) return;
        await manageDashState('raceOpened');
        await buildEmbeddedToolbarHtml(
            newValue.raceId,
            newValue.legNum,
            currentId.loggedUser
        );
        await setNmeaActiveRace(newValue.raceId,newValue.legNum);
        await getRaceOptionsListITYC(newValue.raceId,newValue.legNum);
        await pushNmeaSnapshot();
    },
});

const userPrefsListener = createKeyChangeListener(
    'internal',
    'userPrefs'
);
userPrefsListener.start({
    referenceValue: { prefs: null },
    onChange: async ({ oldValue, newValue }) => {
        await syncNmeaLifecycleFromPrefs();
    },
});

const legListListener = createKeyChangeListener(
    'internal',
    'legListUpdate'
);
legListListener.start({
    referenceValue: { ts: 0 },
    onChange: async () => {
        await purgeClosedRaceData();
    },
});

/* =========================================================
*  Messages internes (ping + vent)
* ======================================================= */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) return;

    // 1) Ping simple optionnel
    if (message.type === 'bg/ping') {
        console.log('bg R ping', message.type);
        sendResponse({ type: 'alive', rstTimer: false, gameSize: 80 });
        return; // sync
    }

    // 2) API vent (async)
    switch (message.type) {
        case 'wind/syncLatest': {
        (async () => {
                try {
                    const info = await syncLatestWindpacks();
                    sendResponse({ ok: true, info });
                } catch (e) {
                    console.error('[wind] syncLatest error', e);
                    sendResponse({ ok: false, error: String(e) });
                }
            })();
                return true;
            }
        case 'wind/ensureWindpack': {
            (async () => {
                try {
                    const model = message?.model || WIND_MODEL;
                    const runId = message?.runId;
                    const fh = message?.fh;
                    if (!runId && runId !== 0) throw new Error('Missing runId');
                    if (fh == null) throw new Error('Missing fh');

                    const rec = await ensureWindpackByRunIdFh(model, String(runId), Number(fh));
                    sendResponse({ ok: true, record: { model: rec.model, runId: rec.runId, fh: rec.fh, validTimeUnix: rec.validTimeUnix } });
                } catch (e) {
                    console.error('[wind] ensureWindpack error', e);
                    sendResponse({ ok: false, error: String(e) });
                }
            })();
            return true;
        }

        case 'wind/getRunInfo': {
            (async () => {
                try {
                   const which = (message?.which === 'previous') ? 'previous' : 'latest';

                    if (which === 'previous') {
                        try { await syncLatestWindpacks(); } catch (e) {
                            console.warn('[wind] warmup sync (previous) failed', e);
                        }
                    }
 
                    const info = await buildRunInfo({ which });
                    sendResponse({ ok: true, info });
                } catch (e) {
                    console.error('[wind] getRunInfo error', e);
                    sendResponse({ ok: false, error: String(e) });
                }
            })();
                return true;
            }

        default:
        // autres messages → ignorés ici (ou gérés par d'autres listeners plus haut)
        break;
    }
});
