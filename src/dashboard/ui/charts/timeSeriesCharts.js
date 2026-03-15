import zoomPlugin from "chartjs-plugin-zoom";
import { buildDate, fix, getGridColor } from "./chartCommon.js";

/* =========================================================
 * Overlay plugin: crosshair vertical line (based on tooltip)
 * ======================================================= */
export const itycOverlayPlugin = {
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
  /** @type {Map<string, Set<any>>} */
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

export const itycSyncPlugin = {
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

    if (e.type === "mouseout" || e.type === "mouseleave") {
      itycSync.clearOthers(chart, groupId);
      return;
    }
    if (e.type !== "mousemove" && e.type !== "touchmove") return;

    const native = e.native ?? e;
    const els = chart.getElementsAtEventForMode(
      native,
      "index",
      { intersect: false },
      false
    );
    const first = els?.[0];
    if (!first) return;

    itycSync.syncIndex(chart, groupId, first.index, { x: e.x ?? 0, y: e.y ?? 0 });
  },
};

/* =========================================================
 * Zoom sync plugin (grouped)
 * ======================================================= */
const itycZoomSync = (() => {
  /** @type {Map<string, Set<any>>} */
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
      if (ch.$_itycApplyingZoomSync) continue;
      ch.$_itycApplyingZoomSync = true;

      ch.options.scales ||= {};
      ch.options.scales.x ||= {};
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

export const itycZoomSyncPlugin = {
  id: "itycZoomSyncPlugin",
  afterInit(chart, _args, opts) {
    itycZoomSync.add(chart, opts?.groupId);
  },
  beforeDestroy(chart) {
    itycZoomSync.remove(chart);
  },
};

export function makeZoomOptions(groupId = "linked") {
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
function getDynamicLinearStepSize(min, max) {
  const delta = Number(max) - Number(min);

  let stepSize = 10;
  if (delta <= 0.05) stepSize = 0.01;
  else if (delta <= 0.1) stepSize = 0.02;
  else if (delta <= 0.5) stepSize = 0.1;
  else if (delta <= 1) stepSize = 0.2;
  else if (delta <= 5) stepSize = 1;
  else if (delta <= 10) stepSize = 2;
  else if (delta <= 40) stepSize = 5;

  return stepSize;
}

function applyDynamicLinearTicks(chart, axisKey = "x") {
  const scale = chart?.scales?.[axisKey];
  if (!scale) return;

  const min = Number(scale.min);
  const max = Number(scale.max);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return;

  chart.options.scales ||= {};
  chart.options.scales[axisKey] ||= {};
  chart.options.scales[axisKey].ticks ||= {};
  chart.options.scales[axisKey].ticks.stepSize = getDynamicLinearStepSize(min, max);
}

/* =========================================================
 * Preserve current X range (zoom/pan window)
 * ======================================================= */
function getXRange(chart) {
  const x = chart?.scales?.x;
  if (!x) return null;

  const optMin = chart?.options?.scales?.x?.min;
  const optMax = chart?.options?.scales?.x?.max;

  const min = typeof x.min === "number" ? x.min : optMin;
  const max = typeof x.max === "number" ? x.max : optMax;

  if (typeof min !== "number" || typeof max !== "number") return null;
  return { min, max };
}
function applyXRange(chart, range) {
  if (!chart || !range) return;
  chart.options.scales ||= {};
  chart.options.scales.x ||= {};
  chart.options.scales.x.min = range.min;
  chart.options.scales.x.max = range.max;
}

/* =========================================================
 * Plugin: vertical lines at dataset indices (spikes)
 * ======================================================= */
export const itycLineAtIndexPlugin = {
  id: "itycLineAtIndex",
  afterDraw(chart, _args, opts) {
    const lines = opts?.lines;
    if (!lines?.length) return;

    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.length) return;

    const { ctx, chartArea } = chart;
    ctx.save();
    ctx.lineWidth = 1;

    for (const l of lines) {
      const idx = Number(l.index);
      if (!Number.isFinite(idx) || !meta.data[idx]) continue;

      const x = meta.data[idx].x;
      ctx.strokeStyle = l.color || (l.type === "hole" ? "#ff4d4d" : "#4ee1b0");
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.stroke();
    }
    ctx.restore();
  },
};

/* =========================================================
 * Register all plugins required by linked charts
 * ======================================================= */
export function registerTimeSeriesPlugins(Chart) {
  Chart.register(
    zoomPlugin,
    itycOverlayPlugin,
    itycSyncPlugin,
    itycZoomSyncPlugin,
    itycLineAtIndexPlugin
  );
}

/* =========================================================
 * Time series factory (raceGraph)
 * X = timestamp (linear), ticks show HHhMM
 * ======================================================= */
function getCanvas(canvasId) {
  const el = document.getElementById(canvasId);
  if (!el) throw new Error(`Chart canvas not found: #${canvasId}`);
  return el;
}

export function createTimeSeriesChart(Chart, {
  canvasId,
  title,
  unitSuffix = "",
  ts,
  series,
  sailId,
  groupId = "timeseries",
  colorForId = () => undefined,
  nameForId = (id) => String(id),
  theme = "dark",
}) {
  const gridColor = getGridColor(Chart, theme);
  const points = ts.map((t, i) => ({ x: t, y: series[i] }));

  const ds = {
    label: title,
    data: points,
    pointRadius: 0,
    parsing: false,
    _ityc: { ts, series, sailId },
    borderColor: colorForId(sailId?.[0] ?? 0),
    segment: {
      borderColor(ctx) {
        const i = ctx.p0DataIndex;
        return colorForId(ds._ityc.sailId?.[i] ?? 0);
      },
    },
  };

  return new Chart(getCanvas(canvasId), {
    type: "line",
    data: { datasets: [ds] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      parsing: false,
      normalized: true,
      interaction: { mode: "index", intersect: false },
      plugins: {
        zoom: makeZoomOptions(groupId),
        itycSyncPlugin: { groupId },
        itycZoomSyncPlugin: { groupId },
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
              const s = ref.series;
              const sid = ref.sailId;

              let label = context.dataset.label ? `${context.dataset.label} : ` : "";
              if (y !== null && y !== undefined) {
                label += `${fix(y, 3)}${unitSuffix}`;
                if (i > 0 && s?.[i] != null && s?.[i - 1] != null) {
                  const d = fix(Number(s[i]) - Number(s[i - 1]), 3);
                  label += ` ${d > 0 ? `+${d}` : d}`;
                }
                const sail = sid?.[i];
                if (sail !== undefined) label += ` (${nameForId(sail)})`;
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
          ticks: { callback(v) { return buildDate(v); } },
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

export function updateTimeSeriesChart(chart, { ts, series, sailId }) {
  if (!chart) return;
  const ds = chart.data.datasets?.[0];
  if (!ds) return;

  const range = getXRange(chart);
  ds.data = ts.map((t, i) => ({ x: t, y: series[i] }));
  ds._ityc = { ts, series, sailId };
  applyXRange(chart, range);
  chart.update("none");
}

/* =========================================================
 * Generic linked chart factory (addon polar charts, etc.)
 * X = any linear value (TWA, etc.)
 * ======================================================= */
export function createLinkedLineChart(Chart, {
  canvasId,
  title,
  unitSuffix = "",
  groupId = "linked",
  xValues,
  yValues,
  lineAtIndex = [], // [{index, type?, color?}]
  colorAt = () => undefined,
  dashAt = () => null,
  xTickLabel = (v) => String(v),
  xMin = undefined,
  xMax = undefined,
  tooltipTitle = (items) => (items?.[0]?.label ?? ""),
  tooltipLabel = (ctx) => {
    const y = ctx.parsed?.y;
    return `${title}: ${Number(y ?? 0).toFixed(3)}${unitSuffix}`;
  },
  yTitle = title,
  theme = "dark",
}) {
  const gridColor = getGridColor(Chart, theme);
  const zoomOptions = makeZoomOptions(groupId);
  const points = xValues.map((x, i) => ({ x, y: yValues[i] }));

  const ds = {
    label: title,
    data: points,
    parsing: false,
    pointRadius: 0,
    segment: {
      borderColor: (c) => colorAt(c.p0DataIndex),
      borderDash:  (c) => dashAt(c.p0DataIndex) ?? undefined,
    },
  };

  const chart = new Chart(getCanvas(canvasId), {
    type: "line",
    data: { datasets: [ds] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      parsing: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        zoom: {
          ...zoomOptions,
          pan: {
            ...zoomOptions.pan,
            onPanComplete({ chart }) {
              applyDynamicLinearTicks(chart, "x");
              if (typeof zoomOptions.pan?.onPanComplete === "function") {
                zoomOptions.pan.onPanComplete({ chart });
              }
              chart.update("none");
            },
          },
          zoom: {
            ...zoomOptions.zoom,
            onZoomComplete({ chart }) {
              applyDynamicLinearTicks(chart, "x");
              if (typeof zoomOptions.zoom?.onZoomComplete === "function") {
                zoomOptions.zoom.onZoomComplete({ chart });
              }
              chart.update("none");
            },
          },
        },
        itycSyncPlugin: { groupId },
        itycZoomSyncPlugin: { groupId },
        itycLineAtIndex: { lines: lineAtIndex },
        legend: { display: true },
        tooltip: {
          xAlign: "left",
          yAlign: "top",
          callbacks: {
            title: tooltipTitle,
            label: tooltipLabel,
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          min: xMin,
          max: xMax,
          grid: { color: gridColor },
          ticks: { autoSkip: false, maxRotation: 0, minRotation: 0, callback: xTickLabel },
        },
        y: {
          grid: { color: gridColor },
          title: { display: true, text: yTitle },
          ticks: {
            callback(v) {
              if (v === 0) return v;
              return `${Number(v).toFixed(3)}${unitSuffix}`;
            },
          },
        },
      },
    },
  });
  applyDynamicLinearTicks(chart, "x");
  chart.update("none");
  return chart;
}

export function updateLinkedLineChart(chart, { xValues, yValues, lineAtIndex }) {
  if (!chart) return;
  const ds = chart.data.datasets?.[0];
  if (!ds) return;

  const range = getXRange(chart);
  ds.data = xValues.map((x, i) => ({ x, y: yValues[i] }));
  applyXRange(chart, range);

  // update spikes if provided
  if (lineAtIndex) {
    chart.options.plugins ||= {};
    chart.options.plugins.itycLineAtIndex ||= {};
    chart.options.plugins.itycLineAtIndex.lines = lineAtIndex;
  }

  chart.update("none");
}

/* =========================================================
 * Reset zoom for a whole group
 * ======================================================= */
export function resetZoomGroup(sourceChart, groupId = "linked") {
  itycZoomSync.reset(sourceChart, groupId);
}