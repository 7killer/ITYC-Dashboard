import * as msgInjest from './data/msgIngestDef.js';
import { ensureOffscreen } from './ensureOffscreen.js';
import { computeOwnIte, computeFleetIte } from './iteRun.js';
import { createKeyChangeListener, getData, saveData } from '../common/dbOpes.js';
import { buildEmbeddedToolbarHtml, getbuildEmbeddedToolbarContent } from '../dashboard/ui/embeddedToolbar.js';
import { manageDashState } from './dashState.js';
import { syncLatestWindpacks, buildRunInfo, syncLatestWindpacksWindowed } from './windBackground.js';

const version = '1.0';
let debuggeeTab;
let dashboardTab;

const pending = new Map();

// modèle vent par défaut
const WIND_MODEL = 'gfs0p25';

// marquer l’état interne
saveData('internal', { id: 'state', state: 'dashInstalled' });

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
});

export async function runHeavyJob(descriptor) {
    await ensureOffscreen();

    const id = crypto.randomUUID();
    const resP = new Promise((resolve, reject) =>
        pending.set(id, { resolve, reject })
    );

    await chrome.runtime.sendMessage({
        target: 'offscreen',
        type: 'job:start',
        id,
        descriptor,
    });

    return resP;
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
});

chrome.alarms.onAlarm.addListener((alarm) => {
if (alarm.name === 'wind-sync-5d') {
 (async () => {
   try {
     await syncLatestWindpacksWindowed();
   } catch (e) {
     console.error('[wind] erreur sur alarm sync-5d', e);
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
                } else if (event === 'getfleet') {
                    await msgInjest.ingestFleetData(postData, body);
                }
            }
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

        case 'wind/getRunInfo': {
            (async () => {
                try {
                    const info = await buildRunInfo();
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