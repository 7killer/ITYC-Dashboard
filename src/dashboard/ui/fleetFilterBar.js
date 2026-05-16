import {getUserPrefs, saveUserPrefs} from "../../common/userPrefs.js";
import {tabSwitch} from "../app/tab.js";
import {getConnectedPlayerId,
        getRaceInfo,
        getLegPlayerInfos,
        getLegFleetInfos
} from '../app/memoData.js'

const TYPE_FILTERS = [
    {key: "team", labelFr: "Teams", labelEn: "Teams", color: "Red"},
    {key: "friends", labelFr: "Amis", labelEn: "Friends", color: "LimeGreen"},
    {key: "top", labelFr: "Top VSR", labelEn: "Top VSR", color: "GoldenRod"},
    {key: "sponsors", labelFr: "Sponsors", labelEn: "Sponsors", color: "DarkSlateBlue"},
    {key: "certified", labelFr: "Certifie", labelEn: "Certified", color: "DodgerBlue"},
    {key: "real", labelFr: "Reels", labelEn: "Reals", color: "Chocolate"},
    {key: "opponents", labelFr: "Adversaires", labelEn: "Opponents", color: "LightGray"},
    {key: "selected", labelFr: "Selectionne", labelEn: "Selected", color: "HotPink"},
    {key: "inRace", labelFr: "En course", labelEn: "Racing", color: "DodgerBlue"},
    {key: "waiting", labelFr: "En Attente", labelEn: "Waiting", color: "DimGray"},
    {key: "arrived", labelFr: "Arrivee", labelEn: "Arrived", color: "Lime"}
];

export const FLEET_DYNAMIC_FILTER_VARIABLES = [
    {key: "twa", labelFr: "TWA", labelEn: "TWA", min: 0, max: 180, unitFr: "deg", unitEn: "deg"},
    {key: "tws", labelFr: "TWS", labelEn: "TWS", min: 0, max: 80, unitFr: "kts", unitEn: "kts"},
    {key: "hdg", labelFr: "HDG", labelEn: "HDG", min: 0, max: 360, unitFr: "deg", unitEn: "deg"},
    {key: "twd", labelFr: "TWD", labelEn: "TWD", min: 0, max: 360, unitFr: "deg", unitEn: "deg"},
    {key: "speed", labelFr: "Vitesse", labelEn: "Speed", min: 0, max: 80, unitFr: "kts", unitEn: "kts"},
    {key: "rank", labelFr: "Classement", labelEn: "Rank", min: 1, max: null, unitFr: "", unitEn: ""},
    {key: "sail", labelFr: "Voile", labelEn: "Sail", list: ["Jib", "Spi", "LJ", "C0", "LG", "HG", "Stay"], unitFr: "", unitEn: ""},
    {key: "autoSail", labelFr: "Voile Auto", labelEn: "Auto Sail", list: ["Active", "Desactive"], unitFr: "", unitEn: ""},
    {key: "avgSpeed", labelFr: "avgSpeed", labelEn: "avgSpeed", min: 0, max: 80, unitFr: "kts", unitEn: "kts"},
    {key: "xfactor", labelFr: "Facteur", labelEn: "Factor", min: 0, max: 2, unitFr: "", unitEn: ""},
    {key: "distance", labelFr: "Distance", labelEn: "Distance", min: 0, max: null, unitFr: "nm", unitEn: "nm"},
    {key: "options", labelFr: "Options", labelEn: "Options", list: ["Hull", "Winch Pro", "Foil", "Magic Furler", "Vrtex jacket", "ComfortPug", "Reach", "Light", "Heavy", "All", "all(guess)"], unitFr: "", unitEn: ""}
];

const DEFAULT_ACTIVE_KEYS = new Set(["team", "friends", "top", "sponsors", "certified", "selected"]);
const filterUiState = {
    typeStates: new Map(),
    selectedTeams: new Map(),
    teams: [],
    dynamicFilters: [],
    nextDynamicId: 1
};

let initialized = false;

const NUMERIC_OPERATORS = [
    {value: "lt", label: "<"},
    {value: "lte", label: "<="},
    {value: "eq", label: "="},
    {value: "gte", label: ">="},
    {value: "gt", label: ">"}
];

const EQUALITY_OPERATORS = [
    {value: "eq", label: "=="},
    {value: "neq", label: "!="}
];

function t(item, frKey = "labelFr", enKey = "labelEn") {
    return getUserPrefs()?.lang === "en" ? item[enKey] : item[frKey];
}

function getTypeState(key) {
    if (!filterUiState.typeStates.has(key)) {
        const prefsValue = getUserPrefs()?.filters?.types?.[key];
        filterUiState.typeStates.set(key, prefsValue ?? (DEFAULT_ACTIVE_KEYS.has(key) ? "active" : "ignored"));
    }
    return filterUiState.typeStates.get(key);
}

function nextTypeState(state) {
    if (state === "ignored") return "active";
    if (state === "active") return "excluded";
    return "ignored";
}

function createButton(text, className, attrs = {}) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    for (const [key, value] of Object.entries(attrs)) {
        button.setAttribute(key, value);
    }
    return button;
}

function renderTypeFilters() {
    const container = document.getElementById("fleetFilterTypeList");
    if (!container) return;
    container.replaceChildren();
    for (const item of TYPE_FILTERS) {
        const state = getTypeState(item.key);
        const button = createButton("", `fleet-filter-pill is-${state}`, {
            "data-filter-key": item.key,
            "aria-pressed": String(state === "active"),
            title: "Ignored / Active / Excluded"
        });
        button.innerHTML = `<span class="fleet-filter-dot" style="color:${item.color};">&#x2B24;</span>${t(item)}`;
        button.addEventListener("click", async () => {
            await setTypeState(item.key, nextTypeState(getTypeState(item.key)));
        });
        container.append(button);
    }
}

async function setTypeState(key, state) {
    filterUiState.typeStates.set(key, state);
    const checkbox = document.getElementById(`sel_${key === "real" ? "reals" : key}`);
    if (checkbox) checkbox.checked = state === "active";
    await persistFleetFilters();
    tabSwitch();
    renderTypeFilters();
    renderActiveChips();
}

function renderDynamicVariables() {
    const select = document.getElementById("fleetFilterDynamicVariable");
    if (!select) return;
    select.replaceChildren(...FLEET_DYNAMIC_FILTER_VARIABLES.map((item) => {
        const option = document.createElement("option");
        option.value = item.key;
        option.textContent = t(item);
        return option;
    }));
    select.addEventListener("change", renderDynamicValueMode);
    renderDynamicValueMode();
}

function renderDynamicValueMode() {
    const select = document.getElementById("fleetFilterDynamicVariable");
    const operator = document.getElementById("fleetFilterDynamicOperator");
    const numeric = document.getElementById("fleetFilterDynamicValue");
    const list = document.getElementById("fleetFilterDynamicList");
    const unit = document.getElementById("fleetFilterDynamicUnit");
    const variable = FLEET_DYNAMIC_FILTER_VARIABLES.find((item) => item.key === select?.value);
    if (!variable || !operator || !numeric || !list || !unit) return;

    list.replaceChildren();
    const hasList = Array.isArray(variable.list);
    const operators = ["sail", "autoSail", "options"].includes(variable.key) ? EQUALITY_OPERATORS : NUMERIC_OPERATORS;
    operator.replaceChildren(...operators.map(({value, label}) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        return option;
    }));
    numeric.hidden = hasList;
    list.hidden = !hasList;
    if (hasList) {
        list.replaceChildren(...variable.list.map((value) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            return option;
        }));
    } else {
        numeric.min = variable.min ?? "";
        numeric.max = variable.max ?? "";
        numeric.placeholder = variable.min != null ? String(variable.min) : "";
    }
    unit.textContent = getUserPrefs()?.lang === "en" ? variable.unitEn : variable.unitFr;
}

function renderTeams() {
    const select = document.getElementById("fleetFilterTeamSelect");
    const addButton = document.getElementById("fleetFilterAddTeam");
    if (!select || !addButton) return;
    select.replaceChildren();
    if (filterUiState.teams.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = getUserPrefs()?.lang === "en" ? "No team in fleet" : "Aucune team dans la flotte";
        select.append(option);
        addButton.disabled = true;
        return;
    }
    const availableTeams = filterUiState.teams.filter((team) => !filterUiState.selectedTeams.has(team.id));
    const list = availableTeams.length > 0 ? availableTeams : filterUiState.teams;
    for (const team of list) {
        const option = document.createElement("option");
        option.value = team.id;
        option.textContent = team.name;
        select.append(option);
    }
    addButton.disabled = availableTeams.length === 0;
}

function renderActiveChips() {
    const teamContainer = document.getElementById("fleetFilterActiveTeams");
    const dynamicContainer = document.getElementById("fleetFilterActiveDynamic");
    if (teamContainer) {
        teamContainer.replaceChildren(...Array.from(filterUiState.selectedTeams.values())
            .map((team) => chip(team.name, async () => {
                filterUiState.selectedTeams.delete(team.id);
                await persistFleetFilters();
                tabSwitch();
                renderTeams();
                renderActiveChips();
            })));
    }
    if (dynamicContainer) {
        dynamicContainer.replaceChildren(...filterUiState.dynamicFilters.map((item) => chip(item.label, async () => {
            filterUiState.dynamicFilters = filterUiState.dynamicFilters.filter((filter) => filter.id !== item.id);
            await persistFleetFilters();
            tabSwitch();
            renderActiveChips();
        })));
    }
}

function chip(text, onRemove) {
    const button = createButton(`${text} x`, "fleet-filter-chip");
    button.addEventListener("click", onRemove);
    return button;
}

function syncFromPrefs() {
    const prefs = getUserPrefs();
    const filters = prefs.filters ?? {};
    for (const item of TYPE_FILTERS) {
        const state = filters.types?.[item.key] ?? (DEFAULT_ACTIVE_KEYS.has(item.key) ? "active" : "ignored");
        filterUiState.typeStates.set(item.key, state);
        const checkbox = document.getElementById(`sel_${item.key === "real" ? "reals" : item.key}`);
        if (checkbox) checkbox.checked = state === "active";
    }
    filterUiState.selectedTeams = new Map((filters.teams ?? []).map((team) => [String(team.id), {
        id: String(team.id),
        name: team.name ?? String(team.id)
    }]));
    filterUiState.dynamicFilters = (filters.dynamic ?? []).map((filter, index) => ({
        ...filter,
        id: filter.id ?? index + 1
    }));
    filterUiState.nextDynamicId = filterUiState.dynamicFilters.reduce((nextId, filter) => Math.max(nextId, Number(filter.id) + 1), 1);
    const search = document.getElementById("fleetFilterSearch");
    if (search) search.value = filters.searchText ?? "";
}

function setPopupOpen(open) {
    const popup = document.getElementById("fleetFilterPopup");
    const toggle = document.getElementById("fleetFilterToggle");
    if (!popup || !toggle) return;
    popup.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
}

async function addSelectedTeam() {
    const select = document.getElementById("fleetFilterTeamSelect");
    if (!select?.value) return;
    const team = filterUiState.teams.find((item) => item.id === select.value);
    filterUiState.selectedTeams.set(select.value, {
        id: select.value,
        name: team?.name ?? select.options[select.selectedIndex]?.textContent ?? select.value
    });
    await persistFleetFilters();
    tabSwitch();
    renderTeams();
    renderActiveChips();
}

async function addDynamicFilter() {
    const variableSelect = document.getElementById("fleetFilterDynamicVariable");
    const operatorSelect = document.getElementById("fleetFilterDynamicOperator");
    const numericInput = document.getElementById("fleetFilterDynamicValue");
    const listSelect = document.getElementById("fleetFilterDynamicList");
    const variable = FLEET_DYNAMIC_FILTER_VARIABLES.find((item) => item.key === variableSelect?.value);
    if (!variable || !operatorSelect) return;

    const hasList = Array.isArray(variable.list);
    const value = hasList ? listSelect?.value : numericInput?.value;
    if (value === "" || value == null) return;

    const operator = operatorSelect.options[operatorSelect.selectedIndex]?.textContent ?? operatorSelect.value;
    const unit = getUserPrefs()?.lang === "en" ? variable.unitEn : variable.unitFr;
    const label = hasList
        ? `${t(variable)} = ${value}`
        : `${t(variable)} ${operator} ${value}${unit ? unit : ""}`;
    filterUiState.dynamicFilters.push({
        id: filterUiState.nextDynamicId++,
        variable: variable.key,
        operator: operatorSelect.value,
        value,
        label
    });
    await persistFleetFilters();
    tabSwitch();
    renderActiveChips();
}

async function onSearchInput() {
    await persistFleetFilters();
    tabSwitch();
}

async function persistFleetFilters() {
    const prefs = getUserPrefs();
    prefs.filters = {
        searchText: document.getElementById("fleetFilterSearch")?.value ?? "",
        types: Object.fromEntries(TYPE_FILTERS.map((item) => [item.key, getTypeState(item.key)])),
        teams: Array.from(filterUiState.selectedTeams.values()),
        dynamic: filterUiState.dynamicFilters.map((filter) => ({...filter}))
    };
    await saveUserPrefs(prefs);
}

export function initFleetFilterBar() {
    if (initialized) return;
    initialized = true;
    syncFromPrefs();
    renderTypeFilters();
    renderDynamicVariables();
    renderTeams();
    renderActiveChips();

    document.getElementById("fleetFilterSearch")?.addEventListener("input", onSearchInput);
    document.getElementById("fleetFilterToggle")?.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const popup = document.getElementById("fleetFilterPopup");
        const shouldOpen = !!popup?.hidden;
        if (shouldOpen) updateFleetFilterBar();
        setPopupOpen(shouldOpen);
    });
    document.getElementById("fleetFilterPopup")?.addEventListener("click", (ev) => ev.stopPropagation());
    document.addEventListener("click", () => setPopupOpen(false));
    document.getElementById("fleetFilterAddTeam")?.addEventListener("click", addSelectedTeam);
    document.getElementById("fleetFilterAddDynamic")?.addEventListener("click", addDynamicFilter);
    document.getElementById("fleetFilterReset")?.addEventListener("click", async () => {
        filterUiState.selectedTeams.clear();
        filterUiState.dynamicFilters = [];
        for (const item of TYPE_FILTERS) {
            filterUiState.typeStates.set(item.key, DEFAULT_ACTIVE_KEYS.has(item.key) ? "active" : "ignored");
        }
        const search = document.getElementById("fleetFilterSearch");
        if (search) search.value = "";
        await persistFleetFilters();
        tabSwitch();
        renderTypeFilters();
        renderTeams();
        renderActiveChips();
    });
}

export function updateFleetFilterBar() {
       const raceInfo         = getRaceInfo();
        const raceItes         = getLegPlayerInfos();
        const raceItesFleet    = getLegFleetInfos();
        const connectedPlayerId = getConnectedPlayerId();
    
        if (!raceInfo || raceInfo?.length === 0) return;
    
        // pas de flotte
        if (!raceItesFleet || Object.keys(raceItesFleet).length === 0) {
            return;
        }
    
        if (raceItes && raceItes.ites && raceItes.ites.length > 0) {
            raceItes.ite = raceItes.ites[0];
        }
    
        const connectedPlayerKey = String(connectedPlayerId);
        if (!Object.hasOwn(raceItesFleet, connectedPlayerKey)) {
            raceItesFleet[connectedPlayerKey] = raceItes;
        }
    
        const rows = Object.entries(raceItesFleet).map(([userId, entry]) => ({
            userId,
            pInfos: userId === connectedPlayerKey ? raceItes : entry
        }));
        updateFleetFilterTeams(rows);
}

function updateFleetFilterTeams(rows = []) {
    const teamMap = new Map();
    for (const {pInfos} of rows) {
        const id = pInfos?.team?.id;
        const name = pInfos?.team?.name;
        if (id && name) teamMap.set(String(id), {id: String(id), name});
    }
    filterUiState.teams = Array.from(teamMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    for (const team of filterUiState.teams) {
        if (filterUiState.selectedTeams.has(team.id)) filterUiState.selectedTeams.set(team.id, team);
    }
    renderTeams();
    renderActiveChips();
}
