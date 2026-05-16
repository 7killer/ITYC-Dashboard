import { getSpeeds } from './utils.js';
import { roundTo } from '../common/utils.js';

const DEFAULT_CONFIG = {
  twsMin: 0.5,
  twsMax: 50,
  twaMin: 0,
  twaMax: 180,
  twsStep: 0.5,
  twaStep: 1,
  contourStep: 1.5,
};

function buildAxis(min, max, step) {
  const values = [];
  for (let value = min; value <= max + 1e-9; value += step) {
    values.push(Number(roundTo(value, 3)));
  }
  return values;
}

function getGridValue(values, width, xIndex, yIndex) {
  return values[(yIndex * width) + xIndex];
}

function addCrossing(points, level, a, b, pa, pb) {
  if (a === b) return;
  if ((level < Math.min(a, b)) || (level > Math.max(a, b))) return;

  const ratio = (level - a) / (b - a);
  if (ratio < 0 || ratio > 1) return;

  points.push({
    x: pa.x + (pb.x - pa.x) * ratio,
    y: pa.y + (pb.y - pa.y) * ratio,
  });
}

function buildContourSegments(twsValues, twaValues, speeds, width, height, levels) {
  const contours = [];

  for (const level of levels) {
    const segments = [];

    for (let yIndex = 0; yIndex < height - 1; yIndex++) {
      const y0 = twaValues[yIndex];
      const y1 = twaValues[yIndex + 1];

      for (let xIndex = 0; xIndex < width - 1; xIndex++) {
        const x0 = twsValues[xIndex];
        const x1 = twsValues[xIndex + 1];

        const v00 = getGridValue(speeds, width, xIndex, yIndex);
        const v10 = getGridValue(speeds, width, xIndex + 1, yIndex);
        const v11 = getGridValue(speeds, width, xIndex + 1, yIndex + 1);
        const v01 = getGridValue(speeds, width, xIndex, yIndex + 1);

        if (![v00, v10, v11, v01].every(Number.isFinite)) continue;

        const points = [];
        addCrossing(points, level, v00, v10, { x: x0, y: y0 }, { x: x1, y: y0 });
        addCrossing(points, level, v10, v11, { x: x1, y: y0 }, { x: x1, y: y1 });
        addCrossing(points, level, v11, v01, { x: x1, y: y1 }, { x: x0, y: y1 });
        addCrossing(points, level, v01, v00, { x: x0, y: y1 }, { x: x0, y: y0 });

        if (points.length === 2) {
          segments.push(points[0].x, points[0].y, points[1].x, points[1].y);
        } else if (points.length === 4) {
          segments.push(points[0].x, points[0].y, points[1].x, points[1].y);
          segments.push(points[2].x, points[2].y, points[3].x, points[3].y);
        }
      }
    }

    contours.push({
      level,
      segments: new Float32Array(segments),
    });
  }

  return contours;
}

export function buildPolarMapData({ raceId, options, boatPolars, config = {} }) {
  if (!boatPolars) throw new Error('buildPolarMapData: boatPolars missing');

  const cfg = { ...DEFAULT_CONFIG, ...config };
  const twsValues = buildAxis(cfg.twsMin, cfg.twsMax, cfg.twsStep);
  const twaValues = buildAxis(cfg.twaMin, cfg.twaMax, cfg.twaStep);
  const width = twsValues.length;
  const height = twaValues.length;
  const speeds = new Float32Array(width * height);
  const sails = new Uint8Array(width * height);

  let maxSpeed = 0;

  for (let yIndex = 0; yIndex < height; yIndex++) {
    const twa = twaValues[yIndex];

    for (let xIndex = 0; xIndex < width; xIndex++) {
      const tws = twsValues[xIndex];
      const data = getSpeeds(boatPolars, options, tws, twa);
      const best = data?.best;
      const idx = (yIndex * width) + xIndex;
      const speed = Number(best?.speed ?? 0);

      speeds[idx] = speed;
      sails[idx] = Number(best?.sail ?? 0);
      if (speed > maxSpeed) maxSpeed = speed;
    }
  }

  const levels = [];
  for (let level = cfg.contourStep; level <= maxSpeed + 1e-9; level += cfg.contourStep) {
    levels.push(Number(roundTo(level, 1)));
  }

  return {
    raceId,
    config: cfg,
    width,
    height,
    twsValues: new Float32Array(twsValues),
    twaValues: new Float32Array(twaValues),
    speeds,
    sails,
    maxSpeed,
    contours: buildContourSegments(twsValues, twaValues, speeds, width, height, levels),
  };
}

export function getPolarMapTransferables(data) {
  return [
    data.twsValues.buffer,
    data.twaValues.buffer,
    data.speeds.buffer,
    data.sails.buffer,
    ...data.contours.map((contour) => contour.segments.buffer),
  ];
}
