
import { Chart} from "chart.js";
import { applyChartDefaultsForTheme, roundTo } from "./chartCommon.js";
import {
  registerTimeSeriesPlugins,
  createLinkedLineChart,
  resetZoomGroup,
} from "./timeSeriesCharts.js";

let __itycAddonChartsRegistered = false;
function ensureAddonChartsRegistered() {
  if (__itycAddonChartsRegistered) return;
  // Chart is expected as global (legacy addon) OR imported by the bundler elsewhere.
//  registerTimeSeriesPlugins(Chart);
  __itycAddonChartsRegistered = true;
}

const POLAR_TWS_GROUP_ID = "polarTws";
const POLAR_TWA_GROUP_ID = "polarTwa";

let polarTWSChart;
let polarVMGChart;
let polarVMCChart;
let polarTWAChart;

function buildSpikeLines(spikes, baseXValues) {
  const summit = document.getElementById("sel_polar_summit")?.checked;
  const hole = document.getElementById("sel_polar_hole")?.checked;

  if (!summit && !hole) return [];
  const base0 = Number(baseXValues?.[0] ?? 0);

  const out = [];
  for (const s of spikes ?? []) {
    if (s?.type === "summit" && !summit) continue;
    if (s?.type === "hole" && !hole) continue;

    const idx = Math.round((Number(s.idx) - base0) * 10); // assumes 0.1 step => *10
    if (!Number.isFinite(idx)) continue;

    out.push({ index: idx, type: s.type });
  }
  return out;
}

export function plotPolarTwsChart(drawData, currentTws) {
  ensureAddonChartsRegistered();
  applyChartDefaultsForTheme(Chart);

  const spikes = buildSpikeLines(drawData?.spikes, drawData.twa);

  document.getElementById("polarChartTitle_name").innerHTML =
    "Vitesse Bateau (nds) TWS " + currentTws + "nds";

  if (polarTWSChart) polarTWSChart.destroy();

  polarTWSChart = createLinkedLineChart(Chart, {
    canvasId: "polarTWSChart",
    title: "Auto",
    unitSuffix: " nds",
    groupId: POLAR_TWA_GROUP_ID,
    xValues: drawData.twa,
    yValues: drawData.spd,
    lineAtIndex: spikes,
    colorAt: (i) => drawData.pointColorBest?.[i],
    dashAt: (i) =>
      drawData.theoSail?.[i] !== undefined &&
      drawData.bestSail?.[i] !== undefined &&
      drawData.theoSail[i] !== drawData.bestSail[i]
        ? [6, 6]
        : null,
    xTickLabel: (v) =>
      dynamicWindsSpeedAxisTicks(v," °"),
    tooltipTitle: (items) => {
      const x = items?.[0]?.parsed?.x;
      return "TWA : " + roundTo(x, 1) + " °";
    },
    tooltipLabel: (ctx) => {
      const i = ctx.dataIndex;
      const y = ctx.parsed?.y;
      if (y == null) return "";
      let label = `${ctx.dataset.label} : ${Number(y).toFixed(3)} nds`;
      if (typeof sailNames !== "undefined" && drawData.bestSail?.[i] != null) {
        label += " " + sailNames[drawData.bestSail[i]];
      }
      return label;
    },
    yTitle: "Vitesse Bateau (nds) TWS : " + currentTws + " nds",
  });
}

export function plotPolarVmgChart(drawData, currentTws) {
  ensureAddonChartsRegistered();
  applyChartDefaultsForTheme(Chart);

  const spikes = buildSpikeLines(drawData?.spikesVmg, drawData.twa);

  document.getElementById("polarChartVMGTitle_name").innerHTML =
    "VMG (nds) TWS " + currentTws + "nds";

  if (polarVMGChart) polarVMGChart.destroy();

  polarVMGChart = createLinkedLineChart(Chart, {
    canvasId: "polarVMGChart",
    title: "Auto",
    unitSuffix: " nds",
    groupId: POLAR_TWA_GROUP_ID,
    xValues: drawData.twa,
    yValues: drawData.vmg,
    lineAtIndex: spikes,
    colorAt: (i) => drawData.pointColorBest?.[i],
    dashAt: (i) =>
      drawData.theoSail?.[i] !== undefined &&
      drawData.bestSail?.[i] !== undefined &&
      drawData.theoSail[i] !== drawData.bestSail[i]
        ? [6, 6]
        : null,
    xTickLabel: (v) =>
      dynamicWindsSpeedAxisTicks(v, " °"),
    tooltipTitle: (items) => {
      const x = items?.[0]?.parsed?.x;
      return "TWA : " + roundTo(x, 1) + " °";
    },
    tooltipLabel: (ctx) => {
      const i = ctx.dataIndex;
      const y = ctx.parsed?.y;
      if (y == null) return "";
      let label = `${ctx.dataset.label} : ${Number(y).toFixed(3)} nds`;
      if (typeof sailNames !== "undefined" && drawData.bestSail?.[i] != null) {
        label += " " + sailNames[drawData.bestSail[i]];
      }
      return label;
    },
    yTitle: "VMG (nds) TWS : " + currentTws + " nds",
  });
}

export function plotPolarVmcChart(drawData, currentTws) {
  ensureAddonChartsRegistered();
  applyChartDefaultsForTheme(Chart);

  const spikes = buildSpikeLines(drawData?.spikesVmc, drawData.twa);

  document.getElementById("polarChartVMCTitle_name").innerHTML =
    "VMC (nds) TWS " + currentTws + "nds";

  if (polarVMCChart) polarVMCChart.destroy();

  polarVMCChart = createLinkedLineChart(Chart, {
    canvasId: "polarVMCChart",
    title: "Auto",
    unitSuffix: " nds",
    groupId: POLAR_TWA_GROUP_ID,
    xValues: drawData.twa,
    yValues: drawData.vmc,
    lineAtIndex: spikes,
    colorAt: (i) => drawData.pointColorBest?.[i],
    dashAt: (i) =>
      drawData.theoSail?.[i] !== undefined &&
      drawData.bestSail?.[i] !== undefined &&
      drawData.theoSail[i] !== drawData.bestSail[i]
        ? [6, 6]
        : null,
    xTickLabel: (v) =>
      dynamicWindsSpeedAxisTicks(v," °"),
    tooltipTitle: (items) => {
      const x = items?.[0]?.parsed?.x;
      return "TWA : " + roundTo(x, 1) + " °";
    },
    tooltipLabel: (ctx) => {
      const i = ctx.dataIndex;
      const y = ctx.parsed?.y;
      if (y == null) return "";
      let label = `${ctx.dataset.label} : ${Number(y).toFixed(3)} nds`;
      if (typeof sailNames !== "undefined" && drawData.bestSail?.[i] != null) {
        label += " " + sailNames[drawData.bestSail[i]];
      }
      return label;
    },
    yTitle: "VMC (nds) TWS : " + currentTws + " nds",
  });
}

export function plotPolarTwaChart(drawData, currentTwa) {
  ensureAddonChartsRegistered();
  applyChartDefaultsForTheme(Chart);

  const spikes = buildSpikeLines(drawData?.spikes, drawData.tws);

  document.getElementById("polarChartTitleTWA_name").innerHTML =
    "Vitesse Bateau (nds) TWA " + currentTwa + "°";

  if (polarTWAChart) polarTWAChart.destroy();

  polarTWAChart = createLinkedLineChart(Chart, {
    canvasId: "polarTWAChart",
    title: "Auto",
    unitSuffix: " nds",
    groupId: POLAR_TWS_GROUP_ID,
    xValues: drawData.tws,
    yValues: drawData.spd,
    lineAtIndex: spikes,
    colorAt: (i) => drawData.pointColorBest?.[i],
    dashAt: (i) =>
      drawData.theoSail?.[i] !== undefined &&
      drawData.bestSail?.[i] !== undefined &&
      drawData.theoSail[i] !== drawData.bestSail[i]
        ? [6, 6]
        : null,
    xTickLabel: (v) =>
      dynamicWindsSpeedAxisTicks(v, " nds"),
    tooltipTitle: (items) => {
      const x = items?.[0]?.parsed?.x;
      return "TWS : " + roundTo(x, 1) + " nds";
    },
    tooltipLabel: (ctx) => {
      const i = ctx.dataIndex;
      const y = ctx.parsed?.y;
      if (y == null) return "";
      let label = `${ctx.dataset.label} : ${Number(y).toFixed(3)} nds`;
      if (typeof sailNames !== "undefined" && drawData.bestSail?.[i] != null) {
        label += " " + sailNames[drawData.bestSail[i]];
      }
      return label;
    },
    yTitle: "Vitesse (nds) - TWA : " + currentTwa + "°",
  });
}

export function plotPolarResetZoomTWS() {
  if (!polarTWSChart) return;
  polarTWSChart.resetZoom?.();
  resetZoomGroup(polarTWSChart, POLAR_GROUP_ID);
}

export function plotPolarResetZoomTWA() {
  if (!polarTWAChart) return;
  polarTWAChart.resetZoom?.();
  resetZoomGroup(polarTWAChart, POLAR_TWA_GROUP_ID);
}

export function plotPolarResetZoomVMG() {
  if (!polarVMGChart) return;
  polarVMGChart.resetZoom?.();
  resetZoomGroup(polarVMGChart, POLAR_TWA_GROUP_ID);
}

export function plotPolarResetZoomVMC() {
  if (!polarVMCChart) return;
  polarVMCChart.resetZoom?.();
  resetZoomGroup(polarVMCChart, POLAR_TWA_GROUP_ID);
}

// Backward-compatible globals (legacy HTML usage)
if (typeof window !== "undefined") {
  window.plotPolarTwsChart = plotPolarTwsChart;
  window.plotPolarVmgChart = plotPolarVmgChart;
  window.plotPolarVmcChart = plotPolarVmcChart;
  window.plotPolarTwaChart = plotPolarTwaChart;

  window.plotPolarResetZoomTWS = plotPolarResetZoomTWS;
  window.plotPolarResetZoomTWA = plotPolarResetZoomTWA;
  window.plotPolarResetZoomVMG = plotPolarResetZoomVMG;
  window.plotPolarResetZoomVMC = plotPolarResetZoomVMC;
}
function dynamicWindsSpeedAxisTicks(tickValue, unit = "") {
  const tick = Math.round(Number(tickValue) * 10) / 10;
  return Number.isFinite(tick) ? `${tick}${unit}` : "";
}