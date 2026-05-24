import {getConnectedPlayerInfos, getLegPlayersOptions, getLegRank, getLegRankUpdate, getPlayersList, getRaceInfo, getTeamsList, getVsrPlayerRank, getVsrRankUpdate, getVsrTeamRank} from "../app/memoData.js";
import {getUserPrefs} from "../../common/userPrefs.js";
import {drawOptions, getRankingCategory,haveOptions,convertGuessOptionsToPlayerOptions} from "./common.js";

const RANKING_PAGE_SIZE = 100;
const rankingTexts = Object.freeze({
    fr: {
        noData: "Pas de donnees disponibles.",
        loadedAt: "Charge le",
        previousPage: "Page precedente",
        nextPage: "Page suivante",
    },
    en: {
        noData: "No data available.",
        loadedAt: "Loaded",
        previousPage: "Previous page",
        nextPage: "Next page",
    },
});

const rankingTabs = Object.freeze([
    { id: "playerVsr", label: "Player VSR" },
    { id: "teamVsr", label: "Team VSR" },
    { id: "course", label: "Course" },
]);

const courseRankingTabs = Object.freeze([
    { id: "global", label: "Global" },
    { id: "interTeam", label: "Inter teams" },
    { id: "team", label: "Team" },
    { id: "friends", label: "Amis" },
]);

let activeRankingTab = "playerVsr";
let activeCourseRankingTab = "global";
const boundRankingHosts = new WeakSet();
const rankingPageState = {
    playerVsr: 1,
    teamVsr: 1,
    courseGlobal: 1,
    courseInterTeam: 1,
    courseTeam: 1,
    courseFriends: 1,
};

const coursePartitionByTab = Object.freeze({
    global: 0,
    interTeam: 16,
    team: 8,
    friends: 5,
});

function getTexts()
{
    return getUserPrefs()?.lang === "en" ? rankingTexts.en : rankingTexts.fr;
}

function createElement(tagName, attributes = {}, children = [])
{
    const element = document.createElement(tagName);
    for (const [key, value] of Object.entries(attributes)) {
        if (value === null || value === undefined) continue;
        if (key === "className") element.className = value;
        else if (key === "textContent") element.textContent = value;
        else if (typeof value === "boolean") {
            if (value) element.setAttribute(key, key);
        }
        else element.setAttribute(key, value);
    }

    children.forEach((child) => {
        if (typeof child === "string") element.append(document.createTextNode(child));
        else if (child) element.append(child);
    });

    return element;
}

function buildTabButton(tab, activeId, dataAttribute)
{
    const isActive = tab.id === activeId;
    return createElement("button", {
        type: "button",
        className: "race-ranking-tab" + (isActive ? " is-active" : ""),
        [dataAttribute]: tab.id,
        role: "tab",
        "aria-selected": String(isActive),
        tabindex: isActive ? "0" : "-1",
        textContent: tab.label,
    });
}

function buildTabList(tabs, activeId, dataAttribute, label)
{
    return createElement("div", {
        className: "race-ranking-tabs",
        role: "tablist",
        "aria-label": label,
    }, tabs.map((tab) => buildTabButton(tab, activeId, dataAttribute)));
}

function getActiveLabel(tabs, activeId)
{
    return tabs.find((tab) => tab.id === activeId)?.label ?? "";
}

function clampPage(viewId, rowsCount)
{
    const pagesCount = Math.max(1, Math.ceil(rowsCount / RANKING_PAGE_SIZE));
    const currentPage = rankingPageState[viewId] ?? 1;
    rankingPageState[viewId] = Math.min(Math.max(1, currentPage), pagesCount);
    return {
        currentPage: rankingPageState[viewId],
        pagesCount,
    };
}

function getActiveViewId()
{
    if (activeRankingTab === "course") return `course${activeCourseRankingTab[0].toUpperCase()}${activeCourseRankingTab.slice(1)}`;
    return activeRankingTab;
}

function buildPager(viewId, rowsCount)
{
    const texts = getTexts();
    const { currentPage, pagesCount } = clampPage(viewId, rowsCount);
    return createElement("div", { className: "race-ranking-pager" }, [
        createElement("button", {
            type: "button",
            className: "race-ranking-page-button",
            "data-ranking-page-action": "prev",
            disabled: currentPage <= 1,
            "aria-label": texts.previousPage,
            textContent: "<",
        }),
        createElement("span", {
            className: "race-ranking-page-label",
            textContent: `${currentPage} / ${pagesCount}`,
        }),
        createElement("button", {
            type: "button",
            className: "race-ranking-page-button",
            "data-ranking-page-action": "next",
            disabled: currentPage >= pagesCount,
            "aria-label": texts.nextPage,
            textContent: ">",
        }),
    ]);
}

function buildCell(text, className = "")
{
    return createElement("td", { className, textContent: text ?? "-" });
}

function buildOptionsCell(playerOptions)
{
    const {optionsTxt, optionsTitle, optionsStyle} = drawOptions(playerOptions, true);
    const cell = buildCell(optionsTxt || "-", "options");
    if (optionsTitle) cell.setAttribute("title", optionsTitle);
    const cssText = /^style="([^"]*)"$/.exec(optionsStyle)?.[1];
    if (cssText) cell.style.cssText = cssText;
    return cell;
}

function buildCategoryCell(playerOptions)
{
    if (haveOptions(playerOptions?.options)) {
        return buildCell(getRankingCategory(playerOptions.options), "category");
    }

    if (playerOptions?.guessOptions) {
        const cell = buildCell(getRankingCategory(convertGuessOptionsToPlayerOptions(playerOptions.guessOptions)), "category");
        cell.style.fontStyle = "italic";
        return cell;
    }

    return buildCell("?", "category");
}

function formatNumber(value)
{
    if (value === null || value === undefined || value === "") return "-";
    return Number.isFinite(Number(value)) ? Number(value).toLocaleString("fr-FR") : String(value);
}

function formatDistance(value)
{
    if (value === null || value === undefined || value === "") return "-";
    const distance = Number(value);
    if (!Number.isFinite(distance)) return String(value);
    return distance.toLocaleString("fr-FR", {
        maximumFractionDigits: 2,
    });
}

function formatGapTime(value)
{
    const time = Number(value);
    if (!Number.isFinite(time) || time <= 0) return "-";

    let remaining = Math.floor(time / 1000);
    const milliseconds = Math.floor(time % 1000);
    const days = Math.floor(remaining / 86400);
    remaining -= days * 86400;
    const hours = Math.floor(remaining / 3600);
    remaining -= hours * 3600;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining - minutes * 60;
    const parts = [];

    if (days !== 0) parts.push(`${days}d`);
    if (hours !== 0) parts.push(`${hours}H`);
    if (minutes !== 0) parts.push(`${minutes}m`);
    if (seconds !== 0) parts.push(`${seconds}s`);
    if (parts.length === 0 && milliseconds !== 0) parts.push(`${milliseconds}ms`);
    if (parts.length === 0) return "-";

    return `+ ${parts.join(" ")}`;
}

function formatRankingGap(entry, firstRank)
{
    const firstDistance = Number(firstRank?.distance);
    const currentDistance = Number(entry?.distance);
    const firstTime = Number(firstRank?.time);
    const currentTime = Number(entry?.time);

    if (!Number.isFinite(firstDistance) || !Number.isFinite(currentDistance)) return "-";

    if (firstDistance === 0 && currentDistance === 0) {
        if (!Number.isFinite(firstTime) || !Number.isFinite(currentTime)) return "-";
        return formatGapTime(currentTime - firstTime);
    }

    return `+ ${formatDistance(currentDistance - firstDistance)} nm`;
}

function formatLocalDateNoSeconds(timestamp)
{
    const ts = Number(timestamp);
    if (!Number.isFinite(ts) || ts <= 0) return null;

    const locale = getUserPrefs()?.lang === "en" ? "en-GB" : "fr-FR";
    return new Date(ts).toLocaleString(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function buildLoadedAtMeta()
{
    if (activeRankingTab === "course" && activeCourseRankingTab in coursePartitionByTab) {
        const legCourseRank = getLegRank()?.[coursePartitionByTab[activeCourseRankingTab]];
        const formattedDate = formatLocalDateNoSeconds(getLegRankUpdate());
        if (!formattedDate) return null;

        return createElement("span", {
            className: "race-ranking-meta",
            textContent: `${getTexts().loadedAt} ${formattedDate} | ${formatNumber(legCourseRank?.rank?.length ?? 0)} / ${formatNumber(legCourseRank?.info?.documentsCount)}`,
        });
    }

    if (activeRankingTab !== "playerVsr" && activeRankingTab !== "teamVsr") return null;

    const formattedDate = formatLocalDateNoSeconds(getVsrRankUpdate());
    if (!formattedDate) return null;

    return createElement("span", {
        className: "race-ranking-meta",
        textContent: `${getTexts().loadedAt} ${formattedDate}`,
    });
}

function getCourseRankingTitle(activeTitle)
{
    if (activeRankingTab !== "course") return activeTitle;

    const raceInfo = getRaceInfo();
    const raceName = raceInfo?.legName ?? raceInfo?.name ?? raceInfo?.displayName ?? raceInfo?.title;
    if (!raceName || !raceInfo?.raceId || !raceInfo?.legNum) return activeTitle;

    const teamName = activeCourseRankingTab === "team" ? getConnectedPlayerInfos()?.team?.name : "";
    const teamLabel = teamName ? ` - ${teamName}` : "";

    return `${activeTitle} - ${raceName}${teamLabel} (${raceInfo.raceId}-${raceInfo.legNum})`;
}

function getPlayerName(userId, playersList)
{
    return playersList[userId]?.name ?? userId ?? "-";
}

function getPlayerTeamName(userId, playersList, teamsList)
{
    const teamId = playersList[userId]?.teamId;
    if (!teamId) return "-";
    return teamsList[teamId]?.name ?? "-";
}

function getTeamName(teamId, teamsList)
{
    return teamsList[teamId]?.name ?? teamId ?? "-";
}

function buildEmptyState(text)
{
    return createElement("div", { className: "race-ranking-empty", textContent: text });
}

function buildPlayerVsrTable()
{
    const ranking = getVsrPlayerRank();
    if (!Array.isArray(ranking) || ranking.length === 0) {
        return buildEmptyState(getTexts().noData);
    }

    const playersList = getPlayersList();
    const teamsList = getTeamsList();
    const { currentPage } = clampPage("playerVsr", ranking.length);
    const start = (currentPage - 1) * RANKING_PAGE_SIZE;
    const rows = ranking.slice(start, start + RANKING_PAGE_SIZE);

    const thead = createElement("thead", {}, [
        createElement("tr", {}, [
            createElement("th", { textContent: "Rank" }),
            createElement("th", { textContent: "Nom du joueur" }),
            createElement("th", { textContent: "Teams" }),
            createElement("th", { textContent: "Points" }),
        ]),
    ]);

    const tbody = createElement("tbody", {}, rows.map((entry) => createElement("tr", {}, [
        buildCell(formatNumber(entry.rank), "rank"),
        buildCell(getPlayerName(entry.userId, playersList), "username"),
        buildCell(getPlayerTeamName(entry.userId, playersList, teamsList), "teamname"),
        buildCell(formatNumber(entry.points), "points"),
    ])));

    return createElement("div", { className: "table-wrap race-ranking-table-wrap" }, [
        createElement("table", { className: "table-modern race-ranking-table" }, [thead, tbody]),
    ]);
}

function buildTeamVsrTable()
{
    const ranking = getVsrTeamRank();
    if (!Array.isArray(ranking) || ranking.length === 0) {
        return buildEmptyState(getTexts().noData);
    }

    const teamsList = getTeamsList();
    const { currentPage } = clampPage("teamVsr", ranking.length);
    const start = (currentPage - 1) * RANKING_PAGE_SIZE;
    const rows = ranking.slice(start, start + RANKING_PAGE_SIZE);

    const thead = createElement("thead", {}, [
        createElement("tr", {}, [
            createElement("th", { textContent: "Rank" }),
            createElement("th", { textContent: "Nom de la team" }),
            createElement("th", { textContent: "Points" }),
        ]),
    ]);

    const tbody = createElement("tbody", {}, rows.map((entry) => createElement("tr", {}, [
        buildCell(formatNumber(entry.rank), "rank"),
        buildCell(getTeamName(entry.teamId, teamsList), "teamname"),
        buildCell(formatNumber(entry.points), "points"),
    ])));

    return createElement("div", { className: "table-wrap race-ranking-table-wrap" }, [
        createElement("table", { className: "table-modern race-ranking-table race-ranking-team-table" }, [thead, tbody]),
    ]);
}

function buildCourseRankTable(partition, viewId)
{
    const legCourseRank = getLegRank()?.[partition];
    const ranking = legCourseRank?.rank;
    if (!Array.isArray(ranking) || ranking.length === 0) {
        return buildEmptyState(getTexts().noData);
    }

    const playersList = getPlayersList();
    const teamsList = getTeamsList();
    const legPlayersOptions = getLegPlayersOptions();
    const { currentPage } = clampPage(viewId, ranking.length);
    const start = (currentPage - 1) * RANKING_PAGE_SIZE;
    const rows = ranking.slice(start, start + RANKING_PAGE_SIZE);
    const firstRank = ranking[0] ?? {};

    const thead = createElement("thead", {}, [
        createElement("tr", {}, [
            createElement("th", { textContent: "Rank" }),
            createElement("th", { textContent: "Nom du joueur" }),
            createElement("th", { textContent: "Pays" }),
            createElement("th", { textContent: "Options" }),
            createElement("th", { textContent: "Gap" }),
            createElement("th", { textContent: "Team" }),
            createElement("th", { textContent: "Category" }),
        ]),
    ]);

    const tbody = createElement("tbody", {}, rows.map((entry) => {
        const playerOptions = legPlayersOptions[entry.userId];
        return createElement("tr", {}, [
            buildCell(formatNumber(entry.rank), "rank"),
            buildCell(getPlayerName(entry.userId, playersList), "username"),
            buildCell(entry.country || "-", "country"),
            buildOptionsCell(playerOptions),
            buildCell(formatRankingGap(entry, firstRank), "gap"),
            buildCell(getPlayerTeamName(entry.userId, playersList, teamsList), "teamname"),
            buildCategoryCell(playerOptions),
        ]);
    }));

    return createElement("div", { className: "table-wrap race-ranking-table-wrap" }, [
        createElement("table", { className: "table-modern race-ranking-table race-ranking-course-table" }, [thead, tbody]),
    ]);
}

function buildCourseInterTeamTable()
{
    const legCourseRank = getLegRank()?.[coursePartitionByTab.interTeam];
    const ranking = legCourseRank?.rank;
    if (!Array.isArray(ranking) || ranking.length === 0) {
        return buildEmptyState(getTexts().noData);
    }

    const teamsList = getTeamsList();
    const viewId = "courseInterTeam";
    const { currentPage } = clampPage(viewId, ranking.length);
    const start = (currentPage - 1) * RANKING_PAGE_SIZE;
    const rows = ranking.slice(start, start + RANKING_PAGE_SIZE);

    const thead = createElement("thead", {}, [
        createElement("tr", {}, [
            createElement("th", { textContent: "Rank" }),
            createElement("th", { textContent: "Nom de la team" }),
            createElement("th", { textContent: "Arrived" }),
            createElement("th", { textContent: "Racing" }),
        ]),
    ]);

    const tbody = createElement("tbody", {}, rows.map((entry) => createElement("tr", {}, [
        buildCell(formatNumber(entry.rank), "rank"),
        buildCell(getTeamName(entry.teamId, teamsList), "teamname"),
        buildCell(formatNumber(entry.arrived), "arrived"),
        buildCell(formatNumber(entry.racing), "racing"),
    ])));

    return createElement("div", { className: "table-wrap race-ranking-table-wrap" }, [
        createElement("table", { className: "table-modern race-ranking-table race-ranking-inter-team-table" }, [thead, tbody]),
    ]);
}

function buildCoursePlayerRankTable(partition, viewId, showTeamColumn = true)
{
    const legPlayerRank = getLegRank()?.[partition];
    const ranking = legPlayerRank?.rank;
    if (!Array.isArray(ranking) || ranking.length === 0) {
        return buildEmptyState(getTexts().noData);
    }

    const globalRankByUserId = new Map((getLegRank()?.[coursePartitionByTab.global]?.rank ?? [])
        .map((entry) => [entry.userId, entry.rank]));
    const playersList = getPlayersList();
    const teamsList = getTeamsList();
    const legPlayersOptions = getLegPlayersOptions();
    const { currentPage } = clampPage(viewId, ranking.length);
    const start = (currentPage - 1) * RANKING_PAGE_SIZE;
    const rows = ranking.slice(start, start + RANKING_PAGE_SIZE);
    const firstRank = ranking[0] ?? {};

    const thead = createElement("thead", {}, [
        createElement("tr", {}, [
            createElement("th", { textContent: "Rank" }),
            createElement("th", { textContent: "RaceRank" }),
            createElement("th", { textContent: "Nom du joueur" }),
            createElement("th", { textContent: "Pays" }),
            createElement("th", { textContent: "Options" }),
            createElement("th", { textContent: "Gap" }),
            showTeamColumn ? createElement("th", { textContent: "Teams" }) : null,
            createElement("th", { textContent: "Category" }),
        ].filter(Boolean)),
    ]);

    const tbody = createElement("tbody", {}, rows.map((entry) => {
        const playerOptions = legPlayersOptions[entry.userId];
        return createElement("tr", {}, [
            buildCell(formatNumber(entry.rank), "rank"),
            buildCell(formatNumber(globalRankByUserId.get(entry.userId)), "raceRank"),
            buildCell(getPlayerName(entry.userId, playersList), "username"),
            buildCell(entry.country || "-", "country"),
            buildOptionsCell(playerOptions),
            buildCell(formatRankingGap(entry, firstRank), "gap"),
            showTeamColumn ? buildCell(getPlayerTeamName(entry.userId, playersList, teamsList), "teamname") : null,
            buildCategoryCell(playerOptions),
        ].filter(Boolean));
    }));

    return createElement("div", { className: "table-wrap race-ranking-table-wrap" }, [
        createElement("table", { className: "table-modern race-ranking-table race-ranking-course-team-table" }, [thead, tbody]),
    ]);
}

function buildRankingContent()
{
    if (activeRankingTab === "playerVsr") return buildPlayerVsrTable();
    if (activeRankingTab === "teamVsr") return buildTeamVsrTable();
    if (activeRankingTab === "course" && activeCourseRankingTab === "interTeam") return buildCourseInterTeamTable();
    if (activeRankingTab === "course" && activeCourseRankingTab === "team") {
        return buildCoursePlayerRankTable(coursePartitionByTab.team, "courseTeam", false);
    }
    if (activeRankingTab === "course" && activeCourseRankingTab === "friends") {
        return buildCoursePlayerRankTable(coursePartitionByTab.friends, "courseFriends");
    }
    if (activeRankingTab === "course" && activeCourseRankingTab in coursePartitionByTab) {
        return buildCourseRankTable(coursePartitionByTab[activeCourseRankingTab], getActiveViewId());
    }
    return buildEmptyState(getTexts().noData);
}

function buildRankingPanel()
{
    const activeTitle = activeRankingTab === "course"
        ? getActiveLabel(courseRankingTabs, activeCourseRankingTab)
        : getActiveLabel(rankingTabs, activeRankingTab);
    const rowsCount = activeRankingTab === "playerVsr"
        ? getVsrPlayerRank().length
        : activeRankingTab === "teamVsr"
            ? getVsrTeamRank().length
            : activeRankingTab === "course" && activeCourseRankingTab in coursePartitionByTab
                ? (getLegRank()?.[coursePartitionByTab[activeCourseRankingTab]]?.rank?.length ?? 0)
                : 0;
    const activeViewId = getActiveViewId();

    return createElement("section", { className: "card race-ranking-card" }, [
        createElement("div", { className: "card-header" }, [
            createElement("span", { className: "badge", textContent: "Rank" }),
            createElement("h3", { id: "t_ranking2", textContent: getCourseRankingTitle(activeTitle) }),
            buildLoadedAtMeta(),
            rowsCount > RANKING_PAGE_SIZE ? buildPager(activeViewId, rowsCount) : null,
        ]),
        createElement("div", { className: "card-body race-ranking-body" }, [
            createElement("div", {
                id: "rankingContent",
                className: "race-ranking-content",
                "data-ranking-view": activeRankingTab,
                "data-ranking-course-view": activeRankingTab === "course" ? activeCourseRankingTab : "",
            }, [
                buildRankingContent(),
            ]),
        ]),
    ]);
}

function handleRankingClick(ev)
{
    const rankingTab = ev.target.closest?.("[data-ranking-tab]");
    if (rankingTab) {
        activeRankingTab = rankingTab.dataset.rankingTab;
        buildRaceRankingHtml();
        return;
    }

    const pageButton = ev.target.closest?.("[data-ranking-page-action]");
    if (pageButton) {
        const viewId = getActiveViewId();
        const currentPage = rankingPageState[viewId] ?? 1;
        rankingPageState[viewId] = pageButton.dataset.rankingPageAction === "next"
            ? currentPage + 1
            : currentPage - 1;
        buildRaceRankingHtml();
        return;
    }

    const courseTab = ev.target.closest?.("[data-ranking-course-tab]");
    if (courseTab) {
        activeCourseRankingTab = courseTab.dataset.rankingCourseTab;
        buildRaceRankingHtml();
    }
}

function bindRankingEvents(host)
{
    if (!host || boundRankingHosts.has(host)) return;
    boundRankingHosts.add(host);
    host.addEventListener("click", handleRankingClick);
}

function buildRankingTabs()
{
    const tabs = [
        buildTabList(rankingTabs, activeRankingTab, "data-ranking-tab", "Ranking"),
    ];

    if (activeRankingTab === "course") {
        tabs.push(buildTabList(courseRankingTabs, activeCourseRankingTab, "data-ranking-course-tab", "Course ranking"));
    }

    return tabs;
}

export function clearRaceRankingDock()
{
    const dock = document.getElementById("rankingTabsDock");
    if (!dock) return;
    dock.hidden = true;
    dock.replaceChildren();
}

export function buildRaceRankingHtml()
{
    const host = document.getElementById("ranking");
    if (!host) return;

    bindRankingEvents(host);
    const dock = document.getElementById("rankingTabsDock");
    const rankingTabsContent = buildRankingTabs();

    if (dock) {
        bindRankingEvents(dock);
        dock.hidden = false;
        dock.replaceChildren(...rankingTabsContent);
        host.replaceChildren(buildRankingPanel());
        return;
    }

    host.replaceChildren(...rankingTabsContent, buildRankingPanel());
}
