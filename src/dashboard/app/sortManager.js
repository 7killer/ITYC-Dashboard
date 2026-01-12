
import {getUserPrefs} from "../../common/userPrefs.js"
import cfg from '@/config.json';
let sortOrder = 0;
let sortField = "none";


export const FLEET_SORT_KEY_BY_TH_ID = {
    th_lu:      "lastCalcDate",
    th_name:    "displayName",
    th_teamname:"teamname",
    th_rank:    "rank",
    th_racetime:"raceTime",
    th_dtu:     "distanceToUs",
    th_dtf:     "dtf",
    th_twd:     "twd",
    th_tws:     "tws",
    th_twa:     "twa",
    th_hdg:     "heading",
    th_speed:   "speed",
    th_vmg:     "vmg",
    th_sail:    "sail",
    th_factor:  "xfactor",
    th_foils:   "xoption_foils",
    th_sd:      "startDate",
    th_eRT:     "eRT",
    th_avgS:    "avgSpeed",
    th_options: "xoption_options",
    th_state:   "state",
    // pas de tri pour: th_rt, th_psn, th_remove
};

export function setSortField(value)
{
    sortField = value;
}

export function setSortOrder(value)
{
    sortOrder = value;
}

export function getSortField()
{
    return sortField;
}

export function getSortOrder()
{
    return sortOrder;
}


export function isDisplayEnabled(playerIte, userId, connectPlayerId) {
    const userPrefs = getUserPrefs();
    const userFilters = userPrefs.filters;

    if(cfg.debugFilter1)
    {
        console.groupCollapsed(`[isDisplayEnabled] Check for user ${userId}`);
        console.log("→ connectPlayerId :", connectPlayerId);
        console.log("→ playerIte :", playerIte);
        console.log("→ userFilters :", userFilters);
    }
    const conditions = {
        self: (userId === connectPlayerId),
        followed: (playerIte.type2 === "followed" && userFilters.friends),
        team: (playerIte.type2 === "team" && userFilters.team),
        normal: (playerIte.type2 === "normal" && userFilters.opponents),
        top: ((playerIte.type === "top" || playerIte.type2 === "top") && userFilters.top),
        certified: (playerIte.type2 === "certified" && userFilters.certified),
        real: (playerIte.type2 === "real" && userFilters.real),
        sponsor: ((playerIte.type === "sponsor" || playerIte.type2 === "sponsor") && userFilters.sponsors),
        selected: (playerIte.choice === true && userFilters.selected),
        inRace: (playerIte.state === "racing" && userFilters.inRace)
    };

    const result = Object.values(conditions).some(Boolean);
    if(cfg.debugFilter1)
    {

        // Log des résultats de chaque condition
        Object.entries(conditions).forEach(([key, value]) => {
            console.log(`  ${key.padEnd(10)}:`, value);
        });

        console.log("✅ Result :", result);
        console.groupEnd();
    }

    return result;
}

function getFleetSortValue(pInfos, sortField) {
    const ite     = pInfos?.ite;
    const iteDash = ite?.metaDash;

    switch (sortField) {
        case "lastCalcDate":   // Date
            return ite?.iteDate ?? 0;

        case "displayName":    // Skipper
            return pInfos.info?.name ?? "";

        case "teamname":       // Team
            return pInfos.team?.name ?? "";

        case "rank":
            return ite?.rank ?? Number.POSITIVE_INFINITY;

        case "raceTime":
            return iteDash?.raceTime ?? Number.POSITIVE_INFINITY;

        case "distanceToUs":   // DTU
            return iteDash?.DTU ?? Number.POSITIVE_INFINITY;

        case "dtf":
            return iteDash?.dtf ?? Number.POSITIVE_INFINITY;

        case "twd":
            return (ite?.twd ?? iteDash?.twd ?? 0);

        case "tws":
            return ite?.tws ?? 0;

        case "twa":
            return Math.abs(ite?.twa ?? 0);

        case "heading":
            return ite?.hdg ?? 0;

        case "speed":
            return ite?.speed ?? 0;

        case "vmg":
            return iteDash?.vmg ?? 0;

        case "sail":
            return ite?.sail ?? 0;

        case "xfactor":
            return iteDash?.xfactor ?? 0;

        case "xoption_foils":
            return iteDash?.realFoilFactor ?? 0;

        case "startDate":
            return ite?.startDate ?? 0;

        case "eRT":
            return iteDash?.eRT ?? Number.POSITIVE_INFINITY;

        case "avgSpeed":
            return iteDash?.avgSpeed ?? 0;

        case "xoption_options":
            // ex : nombre d’options activées
            return pInfos.options ? Object.keys(pInfos.options).length : 0;

        case "state":
            // ordre custom des états
            const order = {
                racing: 1,
                waiting: 2,
                staying: 3,
                arrived: 4
            };
            return order[ite?.state] ?? 999;

        default:
            return 0;
    }
}

export function compareFleetPlayers(pA, pB, sortField, sortAsc) {
    const A = getFleetSortValue(pA, sortField);
    const B = getFleetSortValue(pB, sortField);

    const aNull = (A === null || A === undefined);
    const bNull = (B === null || B === undefined);
    if (aNull && !bNull) return 1;
    if (!aNull && bNull) return -1;
    if (aNull && bNull)  return 0;

    let cmp;
    if (typeof A === "string" || typeof B === "string") {
        cmp = String(A).localeCompare(String(B));
    } else {
        cmp = (A < B) ? -1 : (A > B) ? 1 : 0;
    }

    return sortAsc ? cmp : -cmp;
}

