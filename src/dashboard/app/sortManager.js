
import {getUserPrefs} from "../../common/userPrefs.js"
import {cleanSpecial, isOptionsActivated, roundTo} from "../../common/utils.js"
import cfg from '@/config.json';
let sortOrder = 0;
let sortField = "none";

const SAIL_NAMES = [0, "Jib", "Spi", "Stay", "LJ", "C0", "HG", "LG", 8, 9];


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

export function getFleetFilterTypeState(key) {
    return getUserPrefs()?.filters?.types?.[key] ?? "ignored";
}

function normalizeFilterText(value) {
    return cleanSpecial(String(value ?? "")).toLowerCase();
}

function getTypeConditions(playerIte) {
    return {
        friends: (playerIte.type2 === "followed"),
        team: (playerIte.type2 === "team" || playerIte.team === true),
        opponents: (playerIte.type2 === "normal"),
        top: (playerIte.type === "top" || playerIte.type2 === "top"),
        certified: (playerIte.type2 === "certified"),
        real: (playerIte.type2 === "real" || playerIte.type === "real"),
        sponsors: (playerIte.type === "sponsor" || playerIte.type2 === "sponsor"),
        selected: (playerIte.choice === true),
        inRace: (playerIte.state === "racing"),
        waiting: (playerIte.state === "waiting" || playerIte.state === "staying"),
        arrived: (playerIte.state === "arrived")
    };
}

function passTypeFilters(playerIte, typeFilters = {}) {
    const conditions = getTypeConditions(playerIte);
    const activeKeys = Object.entries(typeFilters).filter(([, state]) => state === "active").map(([key]) => key);
    const excludedKeys = Object.entries(typeFilters).filter(([, state]) => state === "excluded").map(([key]) => key);

    if (excludedKeys.some((key) => conditions[key])) return false;
    if (activeKeys.length === 0) return true;
    return activeKeys.some((key) => conditions[key]);
}

function getDisplayName(playerIte, playerFleetInfos) {
    const baseName = playerFleetInfos?.info?.name ?? playerIte?.name ?? playerIte?.displayName ?? "";
    if (playerIte?.type === "sponsor" && playerIte?.branding?.name) {
        return `${baseName}(${playerIte.branding.name})`;
    }
    return baseName;
}

function passSearchFilter(playerIte, playerFleetInfos, searchText) {
    const needle = normalizeFilterText(searchText);
    if (!needle) return true;
    return normalizeFilterText(getDisplayName(playerIte, playerFleetInfos)).includes(needle);
}

function passTeamFilters(playerIte, playerFleetInfos, selectedTeams = []) {
    if (!Array.isArray(selectedTeams) || selectedTeams.length === 0) return true;
    const teamId = playerFleetInfos?.team?.id ?? playerIte?.team?.id;
    const teamName = playerFleetInfos?.team?.name ?? playerIte?.team?.name ?? "";
    return selectedTeams.some((team) => {
        const selectedId = team?.id == null ? "" : String(team.id);
        const selectedName = team?.name ?? "";
        return (selectedId && selectedId === String(teamId)) || (selectedName && selectedName === teamName);
    });
}

function getDynamicValue(filter, playerIte, playerFleetInfos, raceInfo) {
    const metaDash = playerIte?.metaDash;
    switch (filter.variable) {
        case "twa": return Math.abs(playerIte?.twa ?? 0);
        case "tws": return playerIte?.tws;
        case "hdg": return playerIte?.hdg;
        case "twd": return playerIte?.twd ? playerIte.twd : metaDash?.twd;
        case "speed": return playerIte?.speed;
        case "rank": return playerIte?.rank;
        case "sail": return SAIL_NAMES[(playerIte?.sail ?? 0) % 10];
        case "autoSail": return playerIte?.isRegulated ? "Active" : "Desactive";
        case "avgSpeed": return raceInfo?.raceType === "record" ? metaDash?.avgSpeed : "";
        case "xfactor": return roundTo(metaDash?.xfactor, 4);
        case "distance": return metaDash?.dtf === metaDash?.dtfC ? roundTo(metaDash?.dtfC, 3) : roundTo(metaDash?.dtf, 3);
        case "options": return playerFleetInfos?.options ?? playerIte?.options;
        default: return undefined;
    }
}

function compareDynamicValue(actual, operator, expected) {
    if (actual == null || actual === "") return false;
    if (operator === "eq" || operator === "neq") {
        const result = normalizeFilterText(actual) === normalizeFilterText(expected);
        return operator === "eq" ? result : !result;
    }

    const actualNumber = Number(actual);
    const expectedNumber = Number(expected);
    if (!Number.isFinite(actualNumber) || !Number.isFinite(expectedNumber)) return false;

    switch (operator) {
        case "lt": return actualNumber < expectedNumber;
        case "lte": return actualNumber <= expectedNumber;
        case "gte": return actualNumber >= expectedNumber;
        case "gt": return actualNumber > expectedNumber;
        default: return actualNumber === expectedNumber;
    }
}

function passDynamicFilters(playerIte, playerFleetInfos, raceInfo, dynamicFilters = []) {
    if (!Array.isArray(dynamicFilters) || dynamicFilters.length === 0) return true;
    return dynamicFilters.every((filter) => {
        if (filter.variable === "options") return true;
        return compareDynamicValue(getDynamicValue(filter, playerIte, playerFleetInfos, raceInfo), filter.operator, filter.value);
    });
}

export function isDisplayEnabled(playerIte, userId, connectPlayerId, context = {}) {
    const userPrefs = getUserPrefs();
    const userFilters = userPrefs.filters;
    const playerFleetInfos = context.playerFleetInfos ?? null;
    const raceInfo = context.raceInfo ?? null;

    if (userId === connectPlayerId) return true;

    if(cfg.debugFilter1)
    {
        console.groupCollapsed(`[isDisplayEnabled] Check for user ${userId}`);
        console.log("→ connectPlayerId :", connectPlayerId);
        console.log("→ playerIte :", playerIte);
        console.log("→ userFilters :", userFilters);
    }
    const conditions = {
        search: passSearchFilter(playerIte, playerFleetInfos, userFilters?.searchText),
        type: passTypeFilters(playerIte, userFilters?.types),
        teams: passTeamFilters(playerIte, playerFleetInfos, userFilters?.teams),
        dynamic: passDynamicFilters(playerIte, playerFleetInfos, raceInfo, userFilters?.dynamic)
    };

    const result = Object.values(conditions).every(Boolean);
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
            return isOptionsActivated(pInfos.options) ? Object.keys(pInfos.options).length : 0;

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

