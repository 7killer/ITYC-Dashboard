import {
    formatGPRMC,
    formatIIMWV,
    formatIIVWR,
    formatIIHDT,
    formatRPM,
    nmeaChecksum,
    formatAIVDM_AIS_msg1,
    formatAIVDM_AIS_msg5,
} from './nmeaUtils.js';

const NMEA_DELAY = 1000;
const NMEA_DELAY_MAX = NMEA_DELAY * 120;
const AIS_DELAY = 60000;

const state = {
    requested: false,
    running: false,
    proxyPort: '8081',

    raceId: null,
    legNum: null,
    currentUserId: null,
    playerInfo: null,
    fleetInfo: [],

    retry: 0,
    interval: NMEA_DELAY,
    aisInterval: AIS_DELAY,
    nmeaTimer: null,
    aisTimer: null,
};

async function setNmeaStateDb(stateValue) {
    await chrome.runtime.sendMessage({
        target: 'bg',
        type: 'nmea/state',
        state: stateValue,
    });
}

function applySnapshot(snapshot = {}) {
    if ('requested' in snapshot) state.requested = !!snapshot.requested;
    if ('proxyPort' in snapshot && snapshot.proxyPort != null) {
        state.proxyPort = String(snapshot.proxyPort);
    }

    if ('raceId' in snapshot) state.raceId = snapshot.raceId ?? null;
    if ('legNum' in snapshot) state.legNum = snapshot.legNum ?? null;
    if ('currentUserId' in snapshot) state.currentUserId = snapshot.currentUserId ?? null;
    if ('playerInfo' in snapshot) state.playerInfo = snapshot.playerInfo ?? null;
    if ('fleetInfo' in snapshot) state.fleetInfo = Array.isArray(snapshot.fleetInfo) ? snapshot.fleetInfo : [];
}

function clearTimers() {
    if (state.nmeaTimer) {
        clearInterval(state.nmeaTimer);
        state.nmeaTimer = null;
    }
    if (state.aisTimer) {
        clearInterval(state.aisTimer);
        state.aisTimer = null;
    }
}

async function startLoop() {
    if (state.running) return;

    state.running = true;
    state.retry = 0;
    state.interval = NMEA_DELAY;

    await setNmeaStateDb('ok');

    await sendNmeaBurst();
    state.nmeaTimer = setInterval(() => {
        void sendNmeaBurst();
    }, NMEA_DELAY);

    await sendAisBurst();
    state.aisTimer = setInterval(() => {
        void sendAisBurst();
    }, state.aisInterval);
}

async function stopLoop() {
    state.running = false;
    clearTimers();
    state.retry = 0;
    state.interval = NMEA_DELAY;
    await setNmeaStateDb('off');
}

function canSendNmea() {
    return (
        state.requested &&
        state.running &&
        state.raceId &&
        state.legNum &&
        state.playerInfo
    );
}

function canSendAis() {
    return (
        state.requested &&
        state.running &&
        state.raceId &&
        state.legNum &&
        Array.isArray(state.fleetInfo) &&
        state.fleetInfo.length > 0 &&
        state.interval <= NMEA_DELAY_MAX
    );
}

async function sendNmeaBurst() {
    try {
        if (!canSendNmea()) return;

        if (state.retry++ > 2) {
            state.interval *= 2;
            if (state.interval > NMEA_DELAY_MAX) state.interval = NMEA_DELAY_MAX;
        }

        const rid = `${state.raceId}.${state.legNum}`;
        const p = state.playerInfo;

        const sentences = [
            formatGPRMC(p),
            formatIIMWV(p),
            formatIIVWR(p),
            formatIIHDT(p),
            formatRPM(p),
        ];

        for (const body of sentences) {
            await sendSentence(rid, `$${body}*${nmeaChecksum(body)}`);
        }
    } catch (e) {
        console.error('[offscreen:nmea] sendNmeaBurst error', e);
    }
}

async function sendAisBurst() {
    try {
        if (!canSendAis()) return;

        const rid = `${state.raceId}.${state.legNum}`;

        for (const pInfos of state.fleetInfo) {
            const aivdm1 = formatAIVDM_AIS_msg1(pInfos.mmsi, pInfos);
            await sendSentence(rid, `!${aivdm1}*${nmeaChecksum(aivdm1)}`);

            const aivdm5 = formatAIVDM_AIS_msg5(pInfos.mmsi, pInfos);
            await sendSentence(rid, `!${aivdm5}*${nmeaChecksum(aivdm5)}`);
        }
    } catch (e) {
        console.error('[offscreen:nmea] sendAisBurst error', e);
    }
}

async function sendSentence(raceId, sentence) {
    return await new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('POST', `http://localhost:${state.proxyPort}/nmea/${raceId}`, true);
        request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        request.timeout = 2000;

        request.onreadystatechange = function () {
            if (request.readyState !== 4) return;

            if (request.status === 200) {
                state.retry = 0;
                void setNmeaStateDb('ok');
                resolve(true);
            } else {
                const nmeaState = (state.interval >= NMEA_DELAY_MAX) ? 'error' : 'warn';
                void setNmeaStateDb(nmeaState);
                resolve(false);
            }
        };

        request.onerror = function () {
            const nmeaState = (state.interval >= NMEA_DELAY_MAX) ? 'error' : 'warn';
            void setNmeaStateDb(nmeaState);
            reject(new Error('xhr error'));
        };

        request.ontimeout = function () {
            const nmeaState = (state.interval >= NMEA_DELAY_MAX) ? 'error' : 'warn';
            void setNmeaStateDb(nmeaState);
            reject(new Error('xhr timeout'));
        };

        request.send(sentence);
    });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.target !== 'offscreen') return;

    (async () => {
        try {
            switch (msg.type) {
                case 'nmea/start':
                    applySnapshot(msg.snapshot);
                    await startLoop();
                    sendResponse({ ok: true });
                    break;

                case 'nmea/stop':
                    applySnapshot(msg.snapshot);
                    await stopLoop();
                    sendResponse({ ok: true });
                    break;

                case 'nmea/updateSnapshot':
                    applySnapshot(msg.snapshot);
                    sendResponse({ ok: true });
                    break;

                case 'nmea/getState':
                    sendResponse({
                        ok: true,
                        state: {
                            requested: state.requested,
                            running: state.running,
                            proxyPort: state.proxyPort,
                            raceId: state.raceId,
                            legNum: state.legNum,
                            currentUserId: state.currentUserId,
                            playerInfo: state.playerInfo,
                            fleetInfoCount: state.fleetInfo.length,
                        },
                    });
                    break;

                default:
                    sendResponse({ ok: false, error: `Unknown message type: ${msg.type}` });
                    break;
            }
        } catch (error) {
            console.error('[offscreen:nmea] message error', error);
            sendResponse({ ok: false, error: String(error) });
        }
    })();

    return true;
});