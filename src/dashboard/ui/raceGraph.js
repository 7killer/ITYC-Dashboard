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
import zoomPlugin from "chartjs-plugin-zoom";

/* =========================================================
 * Constants
 * ======================================================= */

export const labelsChartWinds = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 80];
export const labelsChartTWA = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180];

/* =========================================================
 * Internal state (chart instances)
 * ======================================================= */

let twsChart, twaChart, twdChart, hdgChart, bsChart, staminaChart;
let theme = "dark";

/* =========================================================
 * Helpers
 * ======================================================= */

function fix(n, d = 3) {
  const v = Number(n);
  if (!Number.isFinite(v)) return n;
  return Number.parseFloat(v.toFixed(d));
}

export function buildDate(ts) {
  const d = new Date(Number(ts));
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return ss === "00" ? `${hh}h${mm}` : `${hh}h${mm}:${ss}`;
}

function applyChartDefaultsForTheme() {
  if (theme === "dark") {
    Chart.defaults.borderColor = "rgba(255,255,255,0.3)";
    Chart.defaults.color = "rgba(255,255,255,0.6)";
  } else {
    Chart.defaults.borderColor = "rgba(0,0,0,0.2)";
    Chart.defaults.color = "rgba(0,0,0,0.7)";
  }
}

function getGridColor() {
  return theme === "dark" ? "rgba(255,255,255,0.2)" : Chart.defaults.borderColor;
}

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

function getCanvas(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Chart canvas not found: #${id}`);
  return el;
}

/**
 * Preserve current X range (zoom/pan window).
 * Returns null if no explicit range is set.
 */
function getXRange(chart) {
  const x = chart?.scales?.x;
  if (!x) return null;

  // if chart already has explicit min/max, prefer those
  const optMin = chart?.options?.scales?.x?.min;
  const optMax = chart?.options?.scales?.x?.max;

  const min = (typeof x.min === "number") ? x.min : optMin;
  const max = (typeof x.max === "number") ? x.max : optMax;

  if (typeof min !== "number" || typeof max !== "number") return null;
  return { min, max };
}

function applyXRange(chart, range) {
  if (!chart || !range) return;
  chart.options.scales = chart.options.scales || {};
  chart.options.scales.x = chart.options.scales.x || {};
  chart.options.scales.x.min = range.min;
  chart.options.scales.x.max = range.max;
}

/* =========================================================
 * Overlay plugin: crosshair vertical line (based on tooltip)
 * ======================================================= */

const itycOverlayPlugin = {
  id: "itycOverlay",
  afterDraw(chart) {
    const { ctx, tooltip, scales } = chart;
    const yScale = scales?.y;
    if (!ctx || !tooltip || !yScale) return;

    const active = tooltip.getActiveElements?.() ?? [];
    if (!active.length) return;

    const x = active[0].element.x;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, yScale.top);
    ctx.lineTo(x, yScale.bottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#4ee1b0";
    ctx.stroke();
    ctx.restore();
  },
};

/* =========================================================
 * Crosshair sync plugin (grouped)
 * ======================================================= */

const itycSync = (() => {
  /** @type {Map<string, Set<Chart>>} */
  const groups = new Map();

  function add(chart, groupId) {
    if (!groupId) return;
    if (!groups.has(groupId)) groups.set(groupId, new Set());
    groups.get(groupId).add(chart);
  }

  function remove(chart) {
    for (const set of groups.values()) set.delete(chart);
  }

  function clearOthers(source, groupId) {
    const set = groups.get(groupId);
    if (!set) return;
    for (const ch of set) {
      if (ch === source) continue;
      ch.setActiveElements([]);
      ch.tooltip?.setActiveElements([], { x: 0, y: 0 });
      ch.update("none");
    }
  }

  function syncIndex(source, groupId, index, pos) {
    const set = groups.get(groupId);
    if (!set) return;

    for (const ch of set) {
      if (ch === source) continue;
      const meta = ch.getDatasetMeta(0);
      const el = meta?.data?.[index];
      if (!el) continue;

      ch.setActiveElements([{ datasetIndex: 0, index }]);
      ch.tooltip?.setActiveElements([{ datasetIndex: 0, index }], pos);
      ch.update("none");
    }
  }

  return { add, remove, clearOthers, syncIndex };
})();

const itycSyncPlugin = {
  id: "itycSyncPlugin",

  afterInit(chart, _args, opts) {
    itycSync.add(chart, opts?.groupId);
  },

  beforeDestroy(chart) {
    itycSync.remove(chart);
  },

  afterEvent(chart, args, opts) {
    const groupId = opts?.groupId;
    if (!groupId) return;

    const e = args.event;
    if (!e) return;

    // leave canvas => clear others
    if (e.type === "mouseout" || e.type === "mouseleave") {
      itycSync.clearOthers(chart, groupId);
      return;
    }

    // sync only on move
    if (e.type !== "mousemove" && e.type !== "touchmove") return;

    const native = e.native ?? e;

    // "index" mode = nearest x index
    const els = chart.getElementsAtEventForMode(native, "index", { intersect: false }, false);
    const first = els?.[0];
    if (!first) return;

    const index = first.index;
    const pos = { x: e.x ?? 0, y: e.y ?? 0 };

    itycSync.syncIndex(chart, groupId, index, pos);
  },
};

/* =========================================================
 * Zoom/Pan sync (grouped)
 * ======================================================= */

const itycZoomSync = (() => {
  /** @type {Map<string, Set<Chart>>} */
  const groups = new Map();

  function add(chart, groupId) {
    if (!groupId) return;
    if (!groups.has(groupId)) groups.set(groupId, new Set());
    groups.get(groupId).add(chart);
  }

  function remove(chart) {
    for (const set of groups.values()) set.delete(chart);
  }

  function applyRange(source, groupId, min, max) {
    const set = groups.get(groupId);
    if (!set) return;

    for (const ch of set) {
      if (ch === source) continue;

      // avoid infinite loop onZoomComplete/onPanComplete
      if (ch.$_itycApplyingZoomSync) continue;
      ch.$_itycApplyingZoomSync = true;

      if (!ch.options.scales) ch.options.scales = {};
      if (!ch.options.scales.x) ch.options.scales.x = {};
      ch.options.scales.x.min = min;
      ch.options.scales.x.max = max;

      ch.update("none");
      ch.$_itycApplyingZoomSync = false;
    }
  }

  function reset(source, groupId) {
    const set = groups.get(groupId);
    if (!set) return;

    for (const ch of set) {
      if (ch === source) continue;

      if (ch.$_itycApplyingZoomSync) continue;
      ch.$_itycApplyingZoomSync = true;

      if (ch.options?.scales?.x) {
        delete ch.options.scales.x.min;
        delete ch.options.scales.x.max;
      }

      if (typeof ch.resetZoom === "function") ch.resetZoom();
      else ch.update("none");

      ch.$_itycApplyingZoomSync = false;
    }
  }

  return { add, remove, applyRange, reset };
})();

const itycZoomSyncPlugin = {
  id: "itycZoomSyncPlugin",
  afterInit(chart, _args, opts) {
    itycZoomSync.add(chart, opts?.groupId);
  },
  beforeDestroy(chart) {
    itycZoomSync.remove(chart);
  },
};

/* =========================================================
 * Zoom options (with sync hooks)
 * ======================================================= */

function makeZoomOptions(groupId = "timeseries") {
  return {
    pan: {
      enabled: true,
      mode: "x",
      onPanComplete({ chart }) {
        if (chart.$_itycApplyingZoomSync) return;
        const x = chart.scales?.x;
        if (!x) return;
        itycZoomSync.applyRange(chart, groupId, x.min, x.max);
      },
    },
    zoom: {
      wheel: { enabled: true, speed: 0.05 },
      pinch: { enabled: true },
      mode: "x",
      onZoomComplete({ chart }) {
        if (chart.$_itycApplyingZoomSync) return;
        const x = chart.scales?.x;
        if (!x) return;
        itycZoomSync.applyRange(chart, groupId, x.min, x.max);
      },
    },
  };
}

/* =========================================================
 * Factory: create a time series chart
 * ======================================================= */

function createTimeSeriesChart({ canvasId, title, unitSuffix, ts, series, sailId }) {
  const gridColor = getGridColor();
  const points = ts.map((t, i) => ({ x: t, y: series[i] }));

  // dataset object is referenced by segment callback => keep a stable ref
  const ds = {
    label: title,
    data: points,
    pointRadius: 0,
    parsing: false,

    // store raw arrays here so tooltip/segment work after updates
    _ityc: { ts, series, sailId },

    borderColor: colorForSailId(sailId?.[0] ?? 0),
    segment: {
      borderColor(ctx) {
        const i = ctx.p0DataIndex;
        return colorForSailId(ds._ityc.sailId?.[i] ?? 0);
      },
    },
  };

  return new Chart(getCanvas(canvasId), {
    type: "line",
    data: {
      datasets: [ds],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      parsing: false,
      normalized: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        zoom: makeZoomOptions("timeseries"),
        itycSyncPlugin: { groupId: "timeseries" },
        itycZoomSyncPlugin: { groupId: "timeseries" },
        tooltip: {
          callbacks: {
            title(items) {
              const x = items?.[0]?.parsed?.x;
              return `Time : ${buildDate(x)}`;
            },
            label(context) {
              const i = context.dataIndex;
              const y = context.parsed?.y;

              const ref = context.dataset?._ityc || {};
              const series = ref.series;
              const sailId = ref.sailId;

              let label = context.dataset.label ? `${context.dataset.label} : ` : "";
              if (y !== null && y !== undefined) {
                label += `${fix(y, 3)}${unitSuffix}`;

                if (i > 0 && series?.[i] != null && series?.[i - 1] != null) {
                  const d = fix(Number(series[i]) - Number(series[i - 1]), 3);
                  label += ` ${d > 0 ? `+${d}` : d}`;
                }

                const sid = sailId?.[i];
                if (sid !== undefined) label += ` (${nameForSailId(sid)})`;
              }
              return label;
            },
          },
        },
        legend: { display: true },
      },
      scales: {
        x: {
          type: "linear",
          grid: { color: gridColor },
          ticks: {
            callback(v) {
              return buildDate(v);
            },
          },
        },
        y: {
          grid: { color: gridColor },
          title: { display: true, text: title },
          ticks: {
            callback(v) {
              if (v === 0) return v;
              return `${fix(v, 3)}${unitSuffix}`;
            },
          },
        },
      },
    },
  });
}

/**
 * Update an existing time-series chart with new data WITHOUT resetting zoom/pan.
 */
function updateTimeSeriesChart(chart, { ts, series, sailId }) {
  if (!chart) return;

  const ds = chart.data.datasets?.[0];
  if (!ds) return;

  // preserve current zoom/pan range
  const range = getXRange(chart);

  // update dataset points + stored raw arrays
  ds.data = ts.map((t, i) => ({ x: t, y: series[i] }));
  ds._ityc = { ts, series, sailId };

  // keep same range
  applyXRange(chart, range);

  chart.update("none");
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

/* =========================================================
 * Public API
 * ======================================================= */

export function raceGraphOnLoad() {
  Chart.register(
    LineController,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
    Filler,
    zoomPlugin,
    itycOverlayPlugin,
    itycSyncPlugin,
    itycZoomSyncPlugin
  );

  const userPrefs = getUserPrefs();
  theme = userPrefs.theme;
  applyChartDefaultsForTheme();
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
  twsChart = createTimeSeriesChart({
    canvasId: "twsChart",
    title: "True Wind Speed",
    unitSuffix: "nds",
    ts: data.ts,
    series: data.tws,
    sailId: data.sailId,
  });

  twaChart = createTimeSeriesChart({
    canvasId: "twaChart",
    title: "True Wind Angle",
    unitSuffix: "°",
    ts: data.ts,
    series: data.twa,
    sailId: data.sailId,
  });

  twdChart = createTimeSeriesChart({
    canvasId: "twdChart",
    title: "True Wind Direction",
    unitSuffix: "°",
    ts: data.ts,
    series: data.twd,
    sailId: data.sailId,
  });

  hdgChart = createTimeSeriesChart({
    canvasId: "hdgChart",
    title: "Boat heading",
    unitSuffix: "°",
    ts: data.ts,
    series: data.hdg,
    sailId: data.sailId,
  });

  bsChart = createTimeSeriesChart({
    canvasId: "bsChart",
    title: "Boat Speed",
    unitSuffix: "nds",
    ts: data.ts,
    series: data.bs,
    sailId: data.sailId,
  });

  staminaChart = createTimeSeriesChart({
    canvasId: "staminaChart",
    title: "Stamina",
    unitSuffix: "%",
    ts: data.ts,
    series: data.stamina,
    sailId: data.sailId,
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
  itycZoomSync.reset(source, "timeseries");
}