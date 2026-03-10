/* ITYC - Graphs (Chart.js) - modernized
   - Chart.js v4 compatible
   - Crosshair vertical line via plugin
   - Crosshair sync between charts
   - Zoom + pan sync between charts (chartjs-plugin-zoom)
   - Refresh data without resetting zoom/pan (update datasets, preserve x.min/x.max)
*/

/* global document */
import { getLegPlayerInfos } from "../app/memoData.js";
import { getUserPrefs } from "../../common/userPrefs.js";

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { sailNames, sailColors } from "./constant.js";
import {
  registerTimeSeriesPlugins,
  createTimeSeriesChart,
  updateTimeSeriesChart,
  resetZoomGroup,
} from "./charts/timeSeriesCharts.js";

import { applyChartDefaultsForTheme, buildDate } from "./charts/chartCommon.js";
export { buildDate };

/* =========================================================
 * Constants
 * ======================================================= */

export const labelsChartWinds = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 80];
export const labelsChartTWA = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180];
const TIMESERIES_GROUP_ID = "timeseries";

/* =========================================================
 * Internal state (chart instances)
 * ======================================================= */

let twsChart, twaChart, twdChart, hdgChart, bsChart, staminaChart;
let theme = "dark";
let currentTheme = "dark";
let _chartRegistered = false;

/* =========================================================
 * Helpers
 * ======================================================= */
function mod10SailId(sailId) {
  const n = Math.abs(Number(sailId) || 0);
  return n % 10;
}

function colorForSailId(sailId) {
  return sailColors[mod10SailId(sailId)] ?? sailColors[0];
}

function nameForSailId(sailId) {
  return sailNames[mod10SailId(sailId)] ?? String(sailId);
}

/* =========================================================
 * Data conversion: iterations -> chart data
 * ======================================================= */

function buildGraphDataFromRaceItes() {
  const racePlayerInfos = getLegPlayerInfos();
  if (!racePlayerInfos?.ites) return null;

  const raceItes = racePlayerInfos.ites;

  const list = Array.isArray(raceItes)
    ? raceItes
    : Object.keys(raceItes || {})
        .filter((k) => k !== "info" && k !== "options" && k !== "team")
        .map((k) => raceItes[k]);

  const rows = (list || [])
    .filter((it) => it && Number.isFinite(+it.iteDate) && !("action" in it))
    .sort((a, b) => a.iteDate - b.iteDate);

  const data = {
    ts: [],
    tws: [],
    twa: [],
    twd: [],
    hdg: [],
    bs: [],
    stamina: [],
    sailId: [],
  };

  for (const it of rows) {
    const twd = it.twd ?? it.metaDash?.twd ?? 0;
    const t = +it.iteDate;

    data.ts.push(t);
    data.tws.push(Number.isFinite(+it.tws) ? +it.tws : null);
    data.twa.push(Number.isFinite(+it.twa) ? +it.twa : null);
    data.twd.push(Number.isFinite(+twd) ? +twd : null);
    data.hdg.push(Number.isFinite(+it.hdg) ? +it.hdg : null);
    data.bs.push(Number.isFinite(+it.speed) ? +it.speed : null);

    const st = it.metaDash?.realStamina ?? it.stamina ?? 0;
    data.stamina.push(Number.isFinite(+st) ? +st : null);

    const sid = Number.isFinite(+it.sail) ? +it.sail : 0;
    data.sailId.push(sid);
  }

  const userPrefs = getUserPrefs();
  theme = userPrefs.theme;

  return data;
}
function ensureChartRegisteredOnce() {
  if (_chartRegistered) return;

  Chart.register(
    LineController,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
    Filler
  );

  registerTimeSeriesPlugins(Chart);
  _chartRegistered = true;
}
/* =========================================================
 * Public API
 * ======================================================= */

export function raceGraphOnLoad() {
  ensureChartRegisteredOnce();

  const userPrefs = getUserPrefs();
  currentTheme = userPrefs?.theme || "dark";
  applyChartDefaultsForTheme(Chart);
}

/**
 * Met à jour tous les charts "time series".
 * - First call => create charts
 * - Next calls => update datasets WITHOUT resetting zoom/pan
 */
export function upDateGraph() {
  const data = buildGraphDataFromRaceItes();

  if (!data) {
    [twsChart, twaChart, twdChart, hdgChart, bsChart, staminaChart].forEach((c) => c?.destroy());
    twsChart = twaChart = twdChart = hdgChart = bsChart = staminaChart = undefined;
    return;
  }

  applyChartDefaultsForTheme(Chart,currentTheme);

  // If already created -> update only (keep zoom/pan)
  if (twsChart) {
    updateTimeSeriesChart(twsChart, { ts: data.ts, series: data.tws, sailId: data.sailId });
    updateTimeSeriesChart(twaChart, { ts: data.ts, series: data.twa, sailId: data.sailId });
    updateTimeSeriesChart(twdChart, { ts: data.ts, series: data.twd, sailId: data.sailId });
    updateTimeSeriesChart(hdgChart, { ts: data.ts, series: data.hdg, sailId: data.sailId });
    updateTimeSeriesChart(bsChart, { ts: data.ts, series: data.bs, sailId: data.sailId });
    updateTimeSeriesChart(staminaChart, { ts: data.ts, series: data.stamina, sailId: data.sailId });
    return;
  }

  // First time -> create charts
  twsChart = createTimeSeriesChart(Chart, {
    canvasId: "twsChart",
    title: "True Wind Speed",
    unitSuffix: "nds",
    ts: data.ts,
    series: data.tws,
    sailId: data.sailId,
    groupId: TIMESERIES_GROUP_ID,
    colorForId: colorForSailId,
    nameForId: nameForSailId,
    theme: currentTheme,
  });

  twaChart = createTimeSeriesChart(Chart, {
    canvasId: "twaChart",
    title: "True Wind Angle",
    unitSuffix: "°",
    ts: data.ts,
    series: data.twa,
    sailId: data.sailId,
    groupId: TIMESERIES_GROUP_ID,
    colorForId: colorForSailId,
    nameForId: nameForSailId,
    theme: currentTheme,
  });

  twdChart = createTimeSeriesChart(Chart, {
    canvasId: "twdChart",
    title: "True Wind Direction",
    unitSuffix: "°",
    ts: data.ts,
    series: data.twd,
    sailId: data.sailId,
    groupId: TIMESERIES_GROUP_ID,
    colorForId: colorForSailId,
    nameForId: nameForSailId,
    theme: currentTheme,
  });

  hdgChart = createTimeSeriesChart(Chart, {
    canvasId: "hdgChart",
    title: "Boat heading",
    unitSuffix: "°",
    ts: data.ts,
    series: data.hdg,
    sailId: data.sailId,
    groupId: TIMESERIES_GROUP_ID,
    colorForId: colorForSailId,
    nameForId: nameForSailId,
    theme: currentTheme,
  });

  bsChart = createTimeSeriesChart(Chart, {
    canvasId: "bsChart",
    title: "Boat Speed",
    unitSuffix: "nds",
    ts: data.ts,
    series: data.bs,
    sailId: data.sailId,
    groupId: TIMESERIES_GROUP_ID,
    colorForId: colorForSailId,
    nameForId: nameForSailId,
    theme: currentTheme,
  });

  staminaChart = createTimeSeriesChart(Chart ,{
    canvasId: "staminaChart",
    title: "Stamina",
    unitSuffix: "%",
    ts: data.ts,
    series: data.stamina,
    sailId: data.sailId,
    groupId: TIMESERIES_GROUP_ID,
    colorForId: colorForSailId,
    nameForId: nameForSailId,
    theme: currentTheme,
  });

  console.log("twsChart size:", twsChart?.width, twsChart?.height);
}

/**
 * If charts are created while tab is hidden: call AFTER showing the tab.
 */
export function resizeGraphs() {
  [twsChart, twaChart, twdChart, hdgChart, bsChart, staminaChart]
    .filter(Boolean)
    .forEach((c) => {
      c.resize();
      c.update("none");
    });
}

/**
 * Reset zoom for all charts (synced)
 */
export function resetAllGraphsZoom() {
  const source = twsChart ?? twaChart ?? twdChart ?? hdgChart ?? bsChart ?? staminaChart;
  if (!source) return;
  source.resetZoom?.();
  resetZoomGroup(source, TIMESERIES_GROUP_ID);
}