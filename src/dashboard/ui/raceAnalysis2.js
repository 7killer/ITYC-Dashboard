import { getTheme } from './charts/chartCommon.js';
import { sailColors, sailNames } from './constant.js';

const MAP_CONFIG = {
  twsMin: 0.5,
  twsMax: 50,
  twaMin: 0,
  twaMax: 180,
  twsStep: 0.5,
  twaStep: 1,
  contourStep: 1.5,
};

const MARGIN = { left: 56, right: 18, top: 18, bottom: 42 };

let canvas = null;
let ctx = null;
let worker = null;
let requestSeq = 0;
let lastRequestKey = '';
let pending = false;
let mapData = null;
let hover = null;
let isPanning = false;
let panStart = null;

let viewport = {
  xMin: 0,
  xMax: 50,
  yMin: 0,
  yMax: 180,
};

function createWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('../../polar/polarMapWorker.js', import.meta.url), { type: 'module' });
  worker.onerror = (error) => {
    pending = false;
    drawStatus(error?.message || 'Polar map worker error');
  };
  worker.onmessage = (event) => {
    const message = event.data;
    if (message?.requestId !== requestSeq) return;

    pending = false;
    if (message.type === 'polarMapReady') {
      mapData = message.data;
      resetView();
      render();
    } else if (message.type === 'polarMapError') {
      drawStatus(message.error || 'Polar map error');
    }
  };
  return worker;
}

function requestKey({ raceId, options, polar }) {
  const opts = Object.keys(options ?? {})
    .sort()
    .map((key) => `${key}:${options[key] ? 1 : 0}`)
    .join('|');

  return [
    raceId ?? '',
    polar?._id ?? polar?.id ?? '',
    polar?._updatedAt ?? '',
    polar?.label ?? '',
    opts,
    JSON.stringify(MAP_CONFIG),
  ].join('::');
}

function resetView() {
  viewport = {
    xMin: 0,
    xMax: MAP_CONFIG.twsMax,
    yMin: MAP_CONFIG.twaMin,
    yMax: MAP_CONFIG.twaMax,
  };
}

function getPlotRect() {
  return {
    left: MARGIN.left,
    top: MARGIN.top,
    width: Math.max(1, canvas.clientWidth - MARGIN.left - MARGIN.right),
    height: Math.max(1, canvas.clientHeight - MARGIN.top - MARGIN.bottom),
  };
}

function resizeCanvas() {
  if (!canvas) return;
  const parent = canvas.parentElement;
  const width = Math.max(1, parent?.clientWidth || canvas.clientWidth || 600);
  const height = Math.max(1, parent?.clientHeight || canvas.clientHeight || 300);
  const ratio = window.devicePixelRatio || 1;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function worldToScreen(x, y, rect = getPlotRect()) {
  return {
    x: rect.left + ((x - viewport.xMin) / (viewport.xMax - viewport.xMin)) * rect.width,
    y: rect.top + ((viewport.yMax - y) / (viewport.yMax - viewport.yMin)) * rect.height,
  };
}

function screenToWorld(x, y, rect = getPlotRect()) {
  return {
    x: viewport.xMin + ((x - rect.left) / rect.width) * (viewport.xMax - viewport.xMin),
    y: viewport.yMax - ((y - rect.top) / rect.height) * (viewport.yMax - viewport.yMin),
  };
}

function clampViewport() {
  const minSpanX = 2;
  const minSpanY = 8;
  const bounds = { xMin: 0, xMax: MAP_CONFIG.twsMax, yMin: MAP_CONFIG.twaMin, yMax: MAP_CONFIG.twaMax };

  if (viewport.xMax - viewport.xMin < minSpanX) viewport.xMax = viewport.xMin + minSpanX;
  if (viewport.yMax - viewport.yMin < minSpanY) viewport.yMax = viewport.yMin + minSpanY;

  if (viewport.xMin < bounds.xMin) {
    viewport.xMax += bounds.xMin - viewport.xMin;
    viewport.xMin = bounds.xMin;
  }
  if (viewport.xMax > bounds.xMax) {
    viewport.xMin -= viewport.xMax - bounds.xMax;
    viewport.xMax = bounds.xMax;
  }
  if (viewport.yMin < bounds.yMin) {
    viewport.yMax += bounds.yMin - viewport.yMin;
    viewport.yMin = bounds.yMin;
  }
  if (viewport.yMax > bounds.yMax) {
    viewport.yMin -= viewport.yMax - bounds.yMax;
    viewport.yMax = bounds.yMax;
  }

  viewport.xMin = Math.max(bounds.xMin, viewport.xMin);
  viewport.xMax = Math.min(bounds.xMax, viewport.xMax);
  viewport.yMin = Math.max(bounds.yMin, viewport.yMin);
  viewport.yMax = Math.min(bounds.yMax, viewport.yMax);
}

function clear() {
  const theme = getTheme();
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  ctx.fillStyle = theme === 'dark' ? '#202124' : '#ffffff';
  ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
}

function drawStatus(text) {
  if (!canvas || !ctx) return;
  resizeCanvas();
  clear();
  ctx.save();
  ctx.fillStyle = getTheme() === 'dark' ? '#c8c8c8' : '#333333';
  ctx.font = '12px Arial';
  ctx.fillText(text, MARGIN.left, MARGIN.top + 18);
  ctx.restore();
}

function drawSailZones(rect) {
  const tws = mapData.twsValues;
  const twa = mapData.twaValues;
  const sails = mapData.sails;
  const width = mapData.width;
  const height = mapData.height;

  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.left, rect.top, rect.width, rect.height);
  ctx.clip();

  for (let yIndex = 0; yIndex < height - 1; yIndex++) {
    const y0 = twa[yIndex];
    const y1 = twa[yIndex + 1];
    if (y1 < viewport.yMin || y0 > viewport.yMax) continue;

    for (let xIndex = 0; xIndex < width - 1; xIndex++) {
      const x0 = tws[xIndex];
      const x1 = tws[xIndex + 1];
      if (x1 < viewport.xMin || x0 > viewport.xMax) continue;

      const sail = sails[(yIndex * width) + xIndex];
      const p0 = worldToScreen(x0, y0, rect);
      const p1 = worldToScreen(x1, y1, rect);
      ctx.fillStyle = sailColors[sail] || '#777777';
      ctx.fillRect(p0.x, p1.y, Math.max(1, p1.x - p0.x + 0.5), Math.max(1, p0.y - p1.y + 0.5));
    }
  }

  ctx.restore();
}

function drawContours(rect) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.left, rect.top, rect.width, rect.height);
  ctx.clip();
  ctx.strokeStyle = getTheme() === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.82)';
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1;
  ctx.font = '11px Arial';

  for (const contour of mapData.contours) {
    const segments = contour.segments;
    if (!segments?.length) continue;

    ctx.beginPath();
    let labelPoint = null;

    for (let i = 0; i < segments.length; i += 4) {
      const x0 = segments[i];
      const y0 = segments[i + 1];
      const x1 = segments[i + 2];
      const y1 = segments[i + 3];
      if (
        Math.max(x0, x1) < viewport.xMin || Math.min(x0, x1) > viewport.xMax ||
        Math.max(y0, y1) < viewport.yMin || Math.min(y0, y1) > viewport.yMax
      ) continue;

      const p0 = worldToScreen(x0, y0, rect);
      const p1 = worldToScreen(x1, y1, rect);
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);

      if (!labelPoint && i > segments.length * 0.35) {
        labelPoint = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
      }
    }

    ctx.stroke();
    if (labelPoint) {
      const text = Number(contour.level).toFixed(1);
      const width = ctx.measureText(text).width + 4;
      ctx.fillStyle = 'rgba(255,255,255,0.72)';
      ctx.fillRect(labelPoint.x - 2, labelPoint.y - 11, width, 13);
      ctx.fillStyle = '#050505';
      ctx.fillText(text, labelPoint.x, labelPoint.y - 1);
    }
  }

  ctx.restore();
}

function drawAxes(rect) {
  const theme = getTheme();
  const textColor = theme === 'dark' ? '#c8c8c8' : '#222222';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.22)';

  ctx.save();
  ctx.strokeStyle = gridColor;
  ctx.fillStyle = textColor;
  ctx.lineWidth = 1;
  ctx.font = '11px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (let x = 0; x <= MAP_CONFIG.twsMax; x += 5) {
    if (x < viewport.xMin || x > viewport.xMax) continue;
    const p = worldToScreen(x, viewport.yMin, rect);
    ctx.beginPath();
    ctx.moveTo(p.x, rect.top);
    ctx.lineTo(p.x, rect.top + rect.height);
    ctx.stroke();
    ctx.fillText(String(x), p.x, rect.top + rect.height + 6);
  }

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let y = 0; y <= 180; y += 20) {
    if (y < viewport.yMin || y > viewport.yMax) continue;
    const p = worldToScreen(viewport.xMin, y, rect);
    ctx.beginPath();
    ctx.moveTo(rect.left, p.y);
    ctx.lineTo(rect.left + rect.width, p.y);
    ctx.stroke();
    ctx.fillText(String(y), rect.left - 8, p.y);
  }

  ctx.strokeStyle = textColor;
  ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.font = '12px Arial';
  ctx.fillText('TWS (nds)', rect.left + rect.width / 2, canvas.clientHeight - 4);

  ctx.save();
  ctx.translate(14, rect.top + rect.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('TWA (deg)', 0, 0);
  ctx.restore();

  ctx.restore();
}

function drawHover(rect) {
  if (!hover || !mapData) return;

  const world = screenToWorld(hover.x, hover.y, rect);
  if (world.x < viewport.xMin || world.x > viewport.xMax || world.y < viewport.yMin || world.y > viewport.yMax) return;

  const xIndex = Math.min(mapData.width - 1, Math.max(0, Math.round((world.x - MAP_CONFIG.twsMin) / MAP_CONFIG.twsStep)));
  const yIndex = Math.min(mapData.height - 1, Math.max(0, Math.round((world.y - MAP_CONFIG.twaMin) / MAP_CONFIG.twaStep)));
  const idx = (yIndex * mapData.width) + xIndex;
  const tws = mapData.twsValues[xIndex];
  const twa = mapData.twaValues[yIndex];
  const speed = mapData.speeds[idx];
  const sail = mapData.sails[idx];
  const p = worldToScreen(tws, twa, rect);
  const lines = [
    `TWS ${Number(tws).toFixed(1)} nds`,
    `TWA ${Number(twa).toFixed(0)} deg`,
    `${Number(speed).toFixed(2)} nds ${sailNames[sail] || ''}`,
  ];

  ctx.save();
  ctx.strokeStyle = '#4ee1b0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(p.x, rect.top);
  ctx.lineTo(p.x, rect.top + rect.height);
  ctx.moveTo(rect.left, p.y);
  ctx.lineTo(rect.left + rect.width, p.y);
  ctx.stroke();

  ctx.font = '11px Arial';
  const boxWidth = Math.max(...lines.map((line) => ctx.measureText(line).width)) + 16;
  const boxHeight = 54;
  const boxX = Math.min(canvas.clientWidth - boxWidth - 6, p.x + 10);
  const boxY = Math.max(6, Math.min(canvas.clientHeight - boxHeight - 6, p.y - boxHeight - 8));

  ctx.fillStyle = getTheme() === 'dark' ? 'rgba(20,20,20,0.92)' : 'rgba(255,255,255,0.94)';
  ctx.strokeStyle = sailColors[sail] || '#999999';
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
  ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
  ctx.fillStyle = getTheme() === 'dark' ? '#eeeeee' : '#111111';
  lines.forEach((line, i) => ctx.fillText(line, boxX + 8, boxY + 15 + i * 14));
  ctx.restore();
}

function render() {
  if (!canvas || !ctx) return;
  resizeCanvas();
  clear();

  if (pending && !mapData) {
    drawStatus('Calcul polar map...');
    return;
  }
  if (!mapData) {
    drawStatus('No polar map data');
    return;
  }

  const rect = getPlotRect();
  drawSailZones(rect);
  drawContours(rect);
  drawAxes(rect);
  drawHover(rect);
}

function eventPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function onWheel(event) {
  if (!mapData) return;
  event.preventDefault();
  const rect = getPlotRect();
  const pt = eventPoint(event);
  const before = screenToWorld(pt.x, pt.y, rect);
  const factor = event.deltaY < 0 ? 0.85 : 1.18;
  const xSpan = (viewport.xMax - viewport.xMin) * factor;
  const ySpan = (viewport.yMax - viewport.yMin) * factor;
  const xRatio = (before.x - viewport.xMin) / (viewport.xMax - viewport.xMin);
  const yRatio = (before.y - viewport.yMin) / (viewport.yMax - viewport.yMin);

  viewport.xMin = before.x - xSpan * xRatio;
  viewport.xMax = viewport.xMin + xSpan;
  viewport.yMin = before.y - ySpan * yRatio;
  viewport.yMax = viewport.yMin + ySpan;
  clampViewport();
  render();
}

function onMouseDown(event) {
  if (!mapData) return;
  isPanning = true;
  panStart = { point: eventPoint(event), viewport: { ...viewport } };
  canvas.style.cursor = 'grabbing';
}

function onMouseMove(event) {
  const pt = eventPoint(event);
  hover = pt;

  if (isPanning && panStart) {
    const rect = getPlotRect();
    const dx = (pt.x - panStart.point.x) / rect.width * (panStart.viewport.xMax - panStart.viewport.xMin);
    const dy = (pt.y - panStart.point.y) / rect.height * (panStart.viewport.yMax - panStart.viewport.yMin);

    viewport.xMin = panStart.viewport.xMin - dx;
    viewport.xMax = panStart.viewport.xMax - dx;
    viewport.yMin = panStart.viewport.yMin + dy;
    viewport.yMax = panStart.viewport.yMax + dy;
    clampViewport();
  }

  render();
}

function stopPan() {
  isPanning = false;
  panStart = null;
  if (canvas) canvas.style.cursor = 'crosshair';
}

export function initRaceAnalysis2(canvasId = 'polarDensity') {
  if (canvas) return;
  canvas = document.getElementById(canvasId);
  if (!canvas) return;

  ctx = canvas.getContext('2d');
  canvas.style.cursor = 'crosshair';
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseleave', () => { hover = null; stopPan(); render(); });
  canvas.addEventListener('dblclick', () => { resetView(); render(); });
  window.addEventListener('mouseup', stopPan);
  window.addEventListener('resize', render);
}

export function updateRaceAnalysis2({ raceId, options, polar }) {
  initRaceAnalysis2();
  if (!canvas || !polar) return;

  const key = requestKey({ raceId, options, polar });
  if (key === lastRequestKey && mapData) {
    render();
    return;
  }

  lastRequestKey = key;
  pending = true;
  drawStatus('Calcul polar map...');
  createWorker().postMessage({
    type: 'buildPolarMap',
    requestId: ++requestSeq,
    raceId,
    options,
    boatPolars: polar,
    config: MAP_CONFIG,
  });
}
