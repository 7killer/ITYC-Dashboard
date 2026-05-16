
import { Chart} from "chart.js";
import { applyChartDefaultsForTheme, getGridColor, roundTo } from "./chartCommon.js";
import {
  registerTimeSeriesPlugins,
  createLinkedLineChart,
  makeZoomOptions,
  resetZoomGroup,
} from "./timeSeriesCharts.js";
import { sailColors, sailNames } from "../constant.js";

let __itycAddonChartsRegistered = false;
function ensureAddonChartsRegistered() {
  if (__itycAddonChartsRegistered) return;
  // Chart is expected as global (legacy addon) OR imported by the bundler elsewhere.
//  registerTimeSeriesPlugins(Chart);
  __itycAddonChartsRegistered = true;
}

const POLAR_TWS_GROUP_ID = "polarTws";
const POLAR_TWA_GROUP_ID = "polarTwa";
const POLAR_BVMG_GROUP_ID = "polarBestVmg";

let polarTWSChart;
let polarVMGChart;
let polarVMCChart;
let polarTWAChart;
let polarBestVmgTwaChart;

function getCanvas(canvasId) {
  const el = document.getElementById(canvasId);
  if (!el) throw new Error(`Chart canvas not found: #${canvasId}`);
  return el;
}

function colorForSail(sailId, fallback) {
  return sailColors?.[Number(sailId)] || fallback;
}

function buildSpikeLines(spikes, baseXValues) {
  const summit = document.getElementById("sel_polar_summit")?.checked;
  const hole = document.getElementById("sel_polar_hole")?.checked;

  if (!summit && !hole) return [];
  const base0 = Number(baseXValues?.[0] ?? 0);

  const out = [];
  for (const s of spikes ?? []) {
    if (s?.type === "sum" && !summit) continue;
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

export function plotPolarBestVmgTwaChart(drawData) {
  ensureAddonChartsRegistered();
  applyChartDefaultsForTheme(Chart);

  const titleEl = document.getElementById("polarChartBestVMGTitle_name");
  if (titleEl) titleEl.innerHTML = "Best VMG TWA";

  if (polarBestVmgTwaChart) polarBestVmgTwaChart.destroy();

  const groupId = POLAR_BVMG_GROUP_ID;
  const gridColor = getGridColor(Chart);
  const zoomOptions = makeZoomOptions(groupId);

  polarBestVmgTwaChart = new Chart(getCanvas("polarBestVMGTWAChart"), {
    type: "line",
    data: {
      datasets: [
        {
          label: "Best VMG DW",
          data: drawData.tws.map((x, i) => ({ x, y: drawData.downwindTwa[i] })),
          parsing: false,
          pointRadius: 0,
          borderColor: "#f08a00",
          backgroundColor: "#f08a00",
          _itycSails: drawData.downwindSail,
          segment: {
            borderColor: (ctx) => colorForSail(drawData.downwindSail?.[ctx.p0DataIndex], "#f08a00"),
          },
        },
        {
          label: "Best VMG UP",
          data: drawData.tws.map((x, i) => ({ x, y: drawData.upwindTwa[i] })),
          parsing: false,
          pointRadius: 0,
          borderColor: "#ff6a70",
          backgroundColor: "#ff6a70",
          _itycSails: drawData.upwindSail,
          segment: {
            borderColor: (ctx) => colorForSail(drawData.upwindSail?.[ctx.p0DataIndex], "#ff6a70"),
          },
        },
      ],
    },
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
              if (typeof zoomOptions.pan?.onPanComplete === "function") {
                zoomOptions.pan.onPanComplete({ chart });
              }
              chart.update("none");
            },
          },
          zoom: {
            ...zoomOptions.zoom,
            onZoomComplete({ chart }) {
              if (typeof zoomOptions.zoom?.onZoomComplete === "function") {
                zoomOptions.zoom.onZoomComplete({ chart });
              }
              chart.update("none");
            },
          },
        },
        itycSyncPlugin: { groupId },
        itycZoomSyncPlugin: { groupId },
        legend: { display: true },
        tooltip: {
          xAlign: "left",
          yAlign: "top",
          callbacks: {
            title: (items) => {
              const x = items?.[0]?.parsed?.x;
              return "TWS : " + roundTo(x, 1) + " nds";
            },
            labelColor: (ctx) => {
              const sailId = ctx.dataset?._itycSails?.[ctx.dataIndex];
              const color = colorForSail(sailId, ctx.dataset?.borderColor || "#ffffff");
              return {
                borderColor: color,
                backgroundColor: color,
              };
            },
            label: (ctx) => {
              const y = ctx.parsed?.y;
              if (y == null) return "";
              const sailId = ctx.dataset?._itycSails?.[ctx.dataIndex];
              const sailName = sailNames?.[sailId] ? ` ${sailNames[sailId]}` : "";
              return `${ctx.dataset.label} : ${Number(y).toFixed(1)} °${sailName}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          grid: { color: gridColor },
          ticks: {
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
            stepSize: 10,
            callback: (v) => dynamicWindsSpeedAxisTicks(v, " nds"),
          },
        },
        y: {
          grid: { color: gridColor },
          title: { display: true, text: "True Wind Angle (°)" },
          ticks: {
            stepSize: 4,
            callback(v) {
              return `${Number(v).toFixed(0)} °`;
            },
          },
        },
      },
    },
  });
}

export function plotPolarResetZoomTWS() {
  if (!polarTWSChart) return;
  polarTWSChart.resetZoom?.();
  resetZoomGroup(polarTWSChart, POLAR_TWA_GROUP_ID);
}

export function plotPolarResetZoomTWA() {
  if (!polarTWAChart) return;
  polarTWAChart.resetZoom?.();
  resetZoomGroup(polarTWAChart, POLAR_TWS_GROUP_ID);
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

export function plotPolarResetZoomBestVMG() {
  if (!polarBestVmgTwaChart) return;
  polarBestVmgTwaChart.resetZoom?.();
  resetZoomGroup(polarBestVmgTwaChart, POLAR_BVMG_GROUP_ID);
}

// Backward-compatible globals (legacy HTML usage)
if (typeof window !== "undefined") {
  window.plotPolarTwsChart = plotPolarTwsChart;
  window.plotPolarVmgChart = plotPolarVmgChart;
  window.plotPolarVmcChart = plotPolarVmcChart;
  window.plotPolarTwaChart = plotPolarTwaChart;
  window.plotPolarBestVmgTwaChart = plotPolarBestVmgTwaChart;

  window.plotPolarResetZoomTWS = plotPolarResetZoomTWS;
  window.plotPolarResetZoomTWA = plotPolarResetZoomTWA;
  window.plotPolarResetZoomVMG = plotPolarResetZoomVMG;
  window.plotPolarResetZoomVMC = plotPolarResetZoomVMC;
  window.plotPolarResetZoomBestVMG = plotPolarResetZoomBestVMG;
}
function dynamicWindsSpeedAxisTicks(tickValue, unit = "") {
  const tick = Math.round(Number(tickValue) * 10) / 10;
  return Number.isFinite(tick) ? `${tick}${unit}` : "";
}
