
import {processDBOperations} from './dbOpes.js';

const MIN_ZEZO_INTERVAL_MS = 15 * 60 * 1000; // 5 minutes

const RACE_LIST_ZEZO_URL="http://zezo.org/races2.json"
let lastRaceListFetchTs   = 0;
let raceListInFlightPromise = null;

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
