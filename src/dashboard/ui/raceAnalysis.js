import { getUserPrefs } from '../../common/userPrefs.js';
import { getITYCPolarUrl } from '../../common/callExternal.js';

import { isSailisInOptions } from  '../../polar/utils.js';
import { computePolarState } from '../../polar/polarEngine.js'; 
import { roundTo } from '../../common/utils.js';
import { sailColors, sailNames } from './constant.js';
import { initRaceAnalysis2, updateRaceAnalysis2 } from './raceAnalysis2.js';

import {
  getOpenedRaceId,
  getPolar,
  getLegPlayerInfos
} from '../app/memoData.js';

import {plotPolarTwsChart,
plotPolarVmgChart,
plotPolarVmcChart,
plotPolarTwaChart,
plotPolarBestVmgTwaChart} from './charts/polarGraph.js'

/* =========================================================================
 *  STATE / CONSTANTES
 * ========================================================================= */

let divPolarGraph = null;
let divPolarTws = null;
let divPolarTwa = null;
let divPolarDensity = null;
let inputSpikeSensitivity = null;

let R = 300;

// offsets “de base”
const staticDx = 30.5;
const staticDy = 20.5;

// offsets “dynamiques” suivant le zoom/pan
let GRAPH_DX = staticDx;
let GRAPH_DY = staticDy;

let selRace = null;
let mouseX;
let mouseY;
let densityGraphHeight = 200;
let densityGraphWidth = 600;
let densityGraph_Dx = 30.5;
let densityGraph_Dy = 20.5;

let _polarsData = [];
let _polarsDataTWA = [];
let _currentResultset = {};
let _maxFoilFactor = 1;

const _chartScale = {
  graduationValue: 5,
  nbGraduations: 5,
  max: 25
};

let _twa = 0;
let _tws = 0;
let _raceId = '';
let _options = [];

let polarScaling = 1;
let polarScalingOld = 1;
let minSize = 300;

let scaleOffsetX = 0;
let scaleOffsetY = 0;
let mouseTWA = 40;

/* =========================================================================
 *  API PRINCIPALE
 * ========================================================================= */
let polarRafId = null;
let polarRafWithScale = false;

function showExpertAnalysis(displayValue = 'block') {
  document.querySelectorAll('.expertAnalysis').forEach((el) => {
    el.style.display = displayValue;
  });
}

export function isExpertAnalysisMode() {
  return document.getElementById('analysis_mode_expert')?.checked ?? true;
}

export function applyRaceAnalysisMode() {
  const iframe = document.getElementById('ityc_frame');
  if (!iframe) return;

  if (isExpertAnalysisMode()) {
    iframe.style.display = 'none';
    showExpertAnalysis();
    return;
  }

  showExpertAnalysis('none');

  const itycUrl = getITYCPolarUrl();
  if (itycUrl && iframe.src !== itycUrl) {
    iframe.src = itycUrl;
  }
  iframe.style.display = 'block';
}

function schedulePolarRedraw(polar, drawTheme, withScale = false) {
    polarRafWithScale = polarRafWithScale || withScale;
    if (polarRafId !== null) return;

    polarRafId = requestAnimationFrame(() => {
        polarRafId = null;
        plot_polar(polar, drawTheme, polarRafWithScale);
        polarRafWithScale = false;
    });
}
function refreshPolarChart(rid, ite, options, polar, drawTheme, tws, twa, twd) {
  const cog = ite.metaDash?.cog === undefined ? undefined:ite.metaDash?.cog;
  if(polar == null || polar.tws == undefined || polar.twa == undefined || polar.sail == undefined || polar.foil == undefined)
  {
    document.getElementById('polar_date').innerHTML = 'No polar data';
    showExpertAnalysis('none');
    return;
  } 
  getDataArray(rid, options, polar,twa, tws, twd, cog );
  
  divPolarTws.value = roundTo(tws, 2);
  divPolarTwa.innerHTML = `${roundTo(twa, 2)} °`;
  document.getElementById('polar_name').innerHTML = polar.label;

  const polarDate = `Update at : ${polar._updatedAt}`;
  document.getElementById('polar_date').innerHTML = polarDate;

  schedulePolarRedraw(polar, drawTheme, false);
  plotPolarTwsChart(_drawData,_currentResultset.current.__tws);
  plotPolarVmgChart(_drawData,_currentResultset.current.__tws);
  plotPolarVmcChart(_drawData,_currentResultset.current.__tws,_currentResultset.current.__twd);
  plotPolarTwaChart(_drawDataTWA,_currentResultset.current.__twa);
  requestPolarBestVMGData(rid, options, polar);
  updateRaceAnalysis2({ raceId: rid, options, polar });
    
}

export function buildRaceAnalyseAdvance(twsI = null, twdI = null, twaI = null) {
  if (!isExpertAnalysisMode()) {
    applyRaceAnalysisMode();
    return;
  }

  const userPrefs = getUserPrefs();
  const connectedRace = getOpenedRaceId();
  const raceItes = getLegPlayerInfos();
  const polar = getPolar();

  if (!polar || polar.length == 0) {
    showExpertAnalysis('none');
    return;
  }

  applyRaceAnalysisMode();
      
  const rid = `${connectedRace.raceId}-${connectedRace.legNum}`;

  const ite = raceItes?.ites?.[0] ?? {twa : 90,tws : 10,twd : 90,cog : undefined};
    
  if (!divPolarTws) initialize();

  const opt = raceItes.options?.options;

  const tws = twsI ?? (ite.tws === undefined ? 10 : ite.tws);
  const twa = twaI ?? (ite.twa === undefined ? 90 : (ite.twa < 0 ? -ite.twa : ite.twa));
  const twd = twdI ?? (ite.metaDash?.twd === undefined ? (ite.twd === undefined?90:ite.twd) : ite.metaDash.twd);

  if (opt?.foil) {
    document.getElementById('polarDivFoil').style = 'display:block;';
  } else {
    document.getElementById('polarDivFoil').style = 'display:none;';
  }
  refreshPolarChart(rid, ite, opt, polar, userPrefs.theme, tws, twa, twd);
}

/* =========================================================================
 *  DATA
 * ========================================================================= */
function getDataArray(rid, options, boatPolars,twa, tws, twd, cog) {
    // Lis une seule fois la sensibilité spikes (DOM) et délègue au moteur
    const spikeInput = document.getElementById("polar_spike_sensitivity");
    const prefsSpikeSensitivity = getUserPrefs()?.analysis?.polarViewers?.spikeSensitivity;
    const spikeSensitivity = spikeInput
        ? parseFloat(spikeInput.value) || prefsSpikeSensitivity || 0.002
        : prefsSpikeSensitivity || 0.002;
    const state = computePolarState(
        twa,
        tws,
        twd,
        cog,
        rid,
        options,
        boatPolars,
        spikeSensitivity,
        // twaStep: 0.5 // tu peux passer en param si tu veux changer la résolution
    );

    // On remplit tes anciennes structures pour ne pas toucher au reste du code
    _polarsData = state.polarsData;
    _polarsDataTWA = state.polarsDataTWA;
    
    _maxFoilFactor = state.maxFoilFactor;

    _currentResultset = {
        max: state.max,
        bestVMG: state.bestVMG,
        current: state.current,
        sailsSpeeds: state.sailsSpeeds
    };

    // Si tu utilises encore _drawData / _drawDataTWA pour les graphes Chart.js,
    // tu peux continuer à appeler tes fonctions getPolarTWSData / getPolarTWAData ici :
    getPolarTWSData(state.current.__twa);
    getPolarTWAData(state.current.__tws);
    // Et leur injecter les spikes VMG / VMC issus du moteur
    _drawData.spikesVmg = state.spikesVmg;
    _drawData.spikesVmc = state.spikesVmc;
    _drawDataTWA.spikes = state.spikesTws;
}

let _drawData = [];
let bestVmgWorker = null;
let bestVmgRequestSeq = 0;
let bestVmgLastKey = '';

function getBestVmgWorker() {
  if (bestVmgWorker) return bestVmgWorker;

  bestVmgWorker = new Worker(new URL('../../polar/polarMapWorker.js', import.meta.url), { type: 'module' });
  bestVmgWorker.onerror = (error) => {
    console.warn('[raceAnalysis] Best VMG curve worker error:', error?.message || error);
  };
  bestVmgWorker.onmessage = (event) => {
    const message = event.data;
    if (message?.requestId !== bestVmgRequestSeq) return;

    if (message.type === 'bestVmgCurveReady') {
      _drawDataBestVMG = message.data;
      plotPolarBestVmgTwaChart(_drawDataBestVMG);
    } else if (message.type === 'bestVmgCurveError') {
      console.warn('[raceAnalysis] Best VMG curve worker error:', message.error);
    }
  };

  return bestVmgWorker;
}

function getBestVmgRequestKey(rid, options, boatPolars) {
  const optionsKey = Object.keys(options ?? {})
    .sort()
    .map((key) => `${key}:${options[key] ? 1 : 0}`)
    .join('|');

  return [
    rid ?? '',
    boatPolars?._id ?? boatPolars?.id ?? '',
    boatPolars?._updatedAt ?? '',
    boatPolars?.label ?? '',
    boatPolars?.globalSpeedRatio ?? '',
    optionsKey,
  ].join('::');
}

function requestPolarBestVMGData(rid, options, boatPolars) {
  const key = getBestVmgRequestKey(rid, options, boatPolars);
  if (key === bestVmgLastKey && _drawDataBestVMG?.tws?.length) {
    plotPolarBestVmgTwaChart(_drawDataBestVMG);
    return;
  }

  bestVmgLastKey = key;
  getBestVmgWorker().postMessage({
    type: 'buildBestVmgCurve',
    requestId: ++bestVmgRequestSeq,
    raceId: rid,
    options,
    boatPolars,
    config: {
      twsStep: 0.1,
      twaStep: 0.1,
    },
  });
}

function getPolarTWSData(twa) {
  _drawData = {
    twa: [],
    spd: [],
    vmg: [],
    vmc: [],
    theoSail: [],
    pointColorBest: [],
    bestSail: [],
    pointColorTheo: [],
    spikes: _currentResultset.current.spikes
  };

  const actualSailId = _polarsData[twa].best.sail;

  for (let j = 0; j <= 1800; j++) {
    const i = j / 10;
    if (_polarsData[i].best.sail === '') {
      _polarsData[i].best.sail = 1;
    }

    // best sail (avec options)
    if (
      _polarsData[i].all[actualSailId] * 1.014 > _polarsData[i].best.speed &&
      _polarsData[i].best.sail !== actualSailId
    ) {
      _drawData.bestSail.push(actualSailId);
      _drawData.pointColorBest.push(sailColors[actualSailId]);
    } else {
      _drawData.bestSail.push(_polarsData[i].best.sail);
      _drawData.pointColorBest.push(sailColors[_polarsData[i].best.sail]);
    }

    _drawData.theoSail.push(_polarsData[i].best.sail);
    _drawData.pointColorTheo.push(sailColors[_polarsData[i].best.sail]);

    _drawData.twa.push(i);
    _drawData.spd.push(_polarsData[i].best.speed);
    _drawData.vmg.push(_polarsData[i].best.vmg);
    _drawData.vmc.push(_polarsData[i].best.vmc);
  }
}

let _drawDataTWA = [];
let _drawDataBestVMG = [];

function getPolarTWAData(tws) {
  _drawDataTWA = {
    tws: [],
    spd: [],
    theoSail: [],
    pointColorBest: [],
    bestSail: [],
    pointColorTheo: []
  };

  const twsF = Number(roundTo(tws, 1));
  const actualSailId = _polarsDataTWA[twsF].best.sail;
  for (let j = 5; j <= 450; j++) {
    const i = j / 10;
    if (_polarsDataTWA[i].best.sail === '') {
      _polarsDataTWA[i].best.sail = 1;
    }

    if (
      _polarsDataTWA[i].all[actualSailId] * 1.014 > _polarsDataTWA[i].best.speed &&
      _polarsDataTWA[i].best.sail !== actualSailId
    ) {
      _drawDataTWA.bestSail.push(actualSailId);
      _drawDataTWA.pointColorBest.push(sailColors[actualSailId]);
    } else {
      _drawDataTWA.bestSail.push(_polarsDataTWA[i].best.sail);
      _drawDataTWA.pointColorBest.push(
        sailColors[_polarsDataTWA[i].best.sail]
      );
    }

    _drawDataTWA.theoSail.push(_polarsDataTWA[i].best.sail);
    _drawDataTWA.pointColorTheo.push(
      sailColors[_polarsDataTWA[i].best.sail]
    );

    _drawDataTWA.tws.push(i);
    _drawDataTWA.spd.push(_polarsDataTWA[i].best.speed);
  }
}

function getSpikesArray(polarsData, derivatives, sensitivity, startVal, mode = 'speed') {
  const spikes = [];

  for (let i = 1; i < derivatives.length; i++) {
    const delta = Math.abs(derivatives[i] - derivatives[i - 1]);
    if (delta <= sensitivity) continue;

    let type = '';

    if (Math.sign(derivatives[i]) === Math.sign(derivatives[i - 1])) {
      if (Math.sign(derivatives[i]) > 0) {
        type = Math.abs(derivatives[i - 1]) < Math.abs(derivatives[i]) ? 'hole' : 'sum';
      } else {
        type = Math.abs(derivatives[i - 1]) < Math.abs(derivatives[i]) ? 'sum' : 'hole';
      }
    } else if (Math.sign(derivatives[i - 1]) > 0 && Math.sign(derivatives[i]) <= 0) {
      type = 'sum';
    } else if (Math.sign(derivatives[i - 1]) < 0 && Math.sign(derivatives[i]) >= 0) {
      type = 'hole';
    } else if (Math.sign(derivatives[i - 1]) === 0) {
      type = Math.sign(derivatives[i]) > 0 ? 'hole' : 'sum';
    }

    const idx = Math.round(((i / 10) + startVal) * 10) / 10;

    let bSpeed = 0;
    if (mode === 'speed' || mode === 'twa') {
      bSpeed = polarsData[idx].best.speed;
    } else if (mode === 'vmg') {
      bSpeed = polarsData[idx].best.vmg;
    } else if (mode === 'vmc') {
      bSpeed = polarsData[idx].best.vmc;
    }

    if (bSpeed < 0) {
      type = type === 'sum' ? 'hole' : 'sum';
    }

    spikes.push({
      idx,
      speed: bSpeed,
      sail: polarsData[idx].best.sail,
      type
    });
  }

  return spikes;
}

/* =========================================================================
 *  DESSIN POLAIRE
 * ========================================================================= */

function radial(angle, radiusOffset, extraLght, bHideLabel, ctx, addLabel, arrDashStyle) {
  const c = ctx;
  const ra = (angle - 90) * Math.PI / 180;

  if (arrDashStyle && arrDashStyle.length === 2) {
    c.setLineDash(arrDashStyle);
  } else {
    c.setLineDash([]);
  }

  c.moveTo(0, 0);
  c.lineTo(Math.cos(ra) * (R + extraLght), Math.sin(ra) * (R + extraLght));

  if (!bHideLabel) {
    const xLabel = Math.cos(ra) * (R + radiusOffset);
    const textLabel = angle + (addLabel || '');
    c.fillText(textLabel, xLabel, Math.sin(ra) * (R + radiusOffset));
  }
}

function line(c, start, end, arrDashStyle) {
  if (arrDashStyle && arrDashStyle.length === 2) {
    c.setLineDash(arrDashStyle);
  } else {
    c.setLineDash([]);
  }
  c.moveTo(start.x, start.y);
  c.lineTo(end.x, end.y);
}

function plot_scale(c, maxSpeed, drawTheme) {
  c.textAlign = 'right';
  c.lineWidth = 0.4;
  c.textBaseline = 'middle';
  c.strokeStyle = drawTheme === 'dark' ? '#a5a5a5' : 'black';
  c.fillStyle = c.strokeStyle;

  // Radiales TWA
  c.beginPath();
  c.textAlign = 'left';
  for (let i = 0; i <= 180; i += 10) {
    radial(i, 12, 5, false, c, '°');
  }
  c.stroke();

  if (maxSpeed === undefined) maxSpeed = 20;

  _chartScale.graduationValue =
    maxSpeed <= 5 ? 1 :
    maxSpeed <= 10 ? 2 :
    maxSpeed <= 15 ? 3 :
    maxSpeed <= 20 ? 4 :
    maxSpeed <= 30 ? 5 : 10;

  _chartScale.nbGraduations =
    Math.ceil((maxSpeed + 0.3) / _chartScale.graduationValue);

  _chartScale.max = _chartScale.graduationValue * _chartScale.nbGraduations;

  c.textAlign = 'right';
  c.fillText('0kt ', -2, 0);

  for (let i = 1; i <= _chartScale.nbGraduations; i++) {
    c.beginPath();
    c.arc(0, 0, (R / _chartScale.nbGraduations) * i, -Math.PI / 2, +Math.PI / 2, false);
    c.stroke();
  }

  // affichage des spikes en radial
  const showSummit = document.getElementById('sel_polar_summit').checked;
  const showHole = document.getElementById('sel_polar_hole').checked;

  if (
    (showSummit || showHole) &&
    _currentResultset.current.spikes &&
    _currentResultset.current.spikes.length >= 1
  ) {
    c.lineWidth = 1.2;

    for (let i = 0; i < _currentResultset.current.spikes.length; i++) {
      const spike = _currentResultset.current.spikes[i];

      if (
        (showHole && spike.type === 'hole') ||
        (showSummit && spike.type === 'sum')
      ) {
        c.beginPath();

        if (spike.type === 'sum') {
          c.strokeStyle = '#00FF00';
          c.fillStyle = '#00FF00';
        } else if (spike.type === 'hole') {
          c.strokeStyle = '#FF0000';
          c.fillStyle = '#FF0000';
        } else {
          c.strokeStyle = drawTheme === 'dark' ? '#add8e6' : '#9b7233';
          c.fillStyle = c.strokeStyle;
        }

        radial(spike.idx, 12, 0, true, c, '');
        c.stroke();
      }
    }
  }
}

function plotBoatSpeedAxis(c, drawTheme) {
  c.save();
  c.fillStyle = drawTheme === 'dark' ? '#202124' : 'white';
  c.fillRect(-GRAPH_DX, -R, staticDx, R * 2);
  c.restore();

  c.textAlign = 'right';
  c.lineWidth = 0.8;
  c.textBaseline = 'middle';
  c.strokeStyle = drawTheme === 'dark' ? '#a5a5a5' : 'black';
  c.fillStyle = c.strokeStyle;

  const start = { x: -(GRAPH_DX - staticDx), y: R + 5 };
  const end = { x: -(GRAPH_DX - staticDx), y: -R - 5 };
  line(c, start, end);
  c.stroke();

  c.lineWidth = 0.4;
  for (let i = 1; i <= _chartScale.nbGraduations; i++) {
    c.beginPath();
    c.fillStyle = drawTheme === 'dark' ? '#a5a5a5' : 'black';
    c.strokeStyle = c.fillStyle;

    const yb = Math.sqrt(
      Math.pow((R * i) / _chartScale.nbGraduations, 2) -
      Math.pow((GRAPH_DX - staticDx), 2)
    );
    const label = `${i * _chartScale.graduationValue}kts`;

    c.fillText(label, -(GRAPH_DX - staticDx) - 2, yb);
    c.fillText(label, -(GRAPH_DX - staticDx) - 2, -yb);
    c.stroke();
  }
}

function plotMaxValues(c) {
  c.save();

  // VMG upwind
  c.fillStyle = 'rgba(255, 0, 0, 0.15)';
  c.beginPath();
  c.moveTo(0, 0);
  c.arc(
    0,
    0,
    R,
    -Math.PI / 2,
    (_currentResultset.bestVMG.upwind.twa * Math.PI) / 180 - Math.PI / 2,
    false
  );
  c.closePath();
  c.fill();

  // VMG downwind
  c.fillStyle = 'rgba(255, 0, 0, 0.15)';
  c.beginPath();
  c.moveTo(0, 0);
  c.arc(
    0,
    0,
    R,
    Math.PI / 2,
    (_currentResultset.bestVMG.downwind.twa * Math.PI) / 180 - Math.PI / 2,
    true
  );
  c.closePath();
  c.fill();

  // radiales VMG
  c.fillStyle = 'red';
  c.strokeStyle = 'red';
  c.beginPath();
  radial(_currentResultset.bestVMG.upwind.twa, 50, 40, false, c, '°', [3, 5]);
  radial(_currentResultset.bestVMG.downwind.twa, 50, 40, false, c, '°', [3, 5]);
  c.stroke();

  c.restore();
}

function plotFoilRange(c) {
  if (_maxFoilFactor === 1) return;

  for (let twa = 0; twa < 180; twa++) {
    const hue = -500 * _polarsData[twa].best.foilFactor + 560;
    const angleStart = (twa + 0) * Math.PI / 180 - Math.PI / 2;
    const angleEnd = (twa + 1) * Math.PI / 180 - Math.PI / 2;

    c.beginPath();
    c.moveTo(0, 0);
    c.fillStyle = `hsla(${hue}, 100%, 50%, 1)`;
    c.arc(0, 0, R + 4, angleStart, angleEnd, false);
    c.arc(0, 0, R + 1, angleEnd, angleStart, true);
    c.closePath();
    c.fill();
  }
}

function plot_polar(polar, drawTheme, withScale = false) {
  onShow();
  if (!polar) return;

  const c = divPolarGraph.getContext('2d');
  let tws = parseFloat(divPolarTws.value);
  let twa = divPolarTwa.innerHTML.replace(' °', '');
  const full_sail = document.getElementById('sel_polar_full_sail').checked;
  let last_sail = -1;
  let nb_displayed_sail = 0;

  let twaStart = 0;
  let twaEnd = 180;

  twa = Number(roundTo(twa, 1));

  // clear
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, c.canvas.width, c.canvas.height);

  if (withScale) polar_apply_scale(c);

  c.translate(GRAPH_DX, R + GRAPH_DY);

  c.fillStyle = drawTheme === 'dark' ? '#202124' : 'white';
  c.fillRect(0, 0, R + staticDx, R + staticDy);
  c.fillRect(0, 0, R + staticDx, -R + staticDy);

  c.font = 'bold 10px Arial';
  plot_scale(c, _currentResultset.max.speed, drawTheme);
  plotMaxValues(c);

  c.save();

  if (!full_sail) {
    c.beginPath();
    c.moveTo(0, 0);
    c.font = 'bold 14px Arial';
    c.lineWidth = 3;

    // meilleure voile uniquement
    for (let i = twaStart; i <= twaEnd; i += 0.1) {
      const ii = Number(roundTo(i, 1));
      const speed = _polarsData[ii].best.speed;
      const sail = _polarsData[ii].best.sail;

      c.lineTo(0, -speed * R / _chartScale.max);

      if (sail !== last_sail) {
        c.stroke();
        c.strokeStyle = sailColors[sail];
        c.fillStyle = c.strokeStyle;
        c.beginPath();
        c.lineTo(0, -speed * R / _chartScale.max);

        nb_displayed_sail++;
        if (nb_displayed_sail === 2) {
          c.textAlign = 'right';
          c.fillText(sailNames[last_sail % 10], -10, -10 + (-speed * R / _chartScale.max));
        }
        if (nb_displayed_sail >= 2) {
          c.textAlign = 'left';
          c.fillText(sailNames[sail % 10], 10, -10 + (-speed * R / _chartScale.max));
        }

        last_sail = sail;
      }

      c.rotate(Math.PI / 1800);
    }
    c.stroke();
  } else {
    // toutes les voiles
    for (const sailDef of polar.sail) {
      if (isSailisInOptions(sailDef.id, _currentResultset.current.__options)) {
        c.save();
        c.beginPath();
        c.moveTo(0, 0);
        c.strokeStyle = sailColors[sailDef.id];
        c.fillStyle = `${c.strokeStyle}1A`;
        c.lineWidth = sailDef.id === _currentResultset.current.bestSail ? 2 : 1;

        for (let i = twaStart; i <= twaEnd; i += 0.1) {
          const ii = Number(roundTo(i, 1));
          const speed = _polarsData[ii].all[sailDef.id];
          c.lineTo(0, -speed * R / _chartScale.max);
          c.rotate(Math.PI / 1800);
        }

        c.stroke();
        c.fill();
        c.restore();
      }
    }

    c.lineWidth = 1;
  }

  c.restore();

  // ligne de TWA actuelle
  if (!Number.isNaN(twa)) {
    document.getElementById('polar_speed').innerHTML =
      `${roundTo(_currentResultset.current.speed, 3)} nds`;

    document.getElementById('polar_vmg').innerHTML =
      `${Math.abs(
        Math.round(
          roundTo(_currentResultset.current.speed, 3) *
          Math.cos(twa * Math.PI / 180) *
          1000
        ) / 1000
      )} nds`;

    document.getElementById('polar_sail').innerHTML =
      sailNames[_currentResultset.current.bestSail];

    c.save();
    c.beginPath();
    c.lineWidth = 2;
    c.strokeStyle = drawTheme === 'dark' ? 'lightblue' : 'blue';
    c.fillStyle = c.strokeStyle;

    radial(
      twa,
      85,
      40,
      false,
      c,
      `° : ${roundTo(_polarsData[twa].best.speed, 3)} nds`
    );
    c.stroke();

    const ra = (twa - 90) * Math.PI / 180;
    c.lineWidth = 8;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(Math.cos(ra) * (R + 40), Math.sin(ra) * (R + 40));
    c.lineTo(Math.cos(ra) * (R + 40), Math.sin(ra) * (R + 40));
    c.stroke();
    c.restore();

    // limites de changement de voile
    c.save();
    c.font = 'bold 10px Arial';
    c.strokeStyle =  sailColors[_currentResultset.current.bestSail];
    c.fillStyle = c.strokeStyle;
    c.lineWidth = 2;

    if (_currentResultset.current.bestSailTWAMin !== 0) {
      c.beginPath();
      radial(
        roundTo(_currentResultset.current.bestSailTWAMin, 1),
        35,
        20,
        false,
        c,
        '°',
        [3, 5]
      );
      c.stroke();
    }

    if (
      _currentResultset.current.bestSailTWAMax !== 0 &&
      _currentResultset.current.bestSailTWAMax !== 180
    ) {
      c.beginPath();
      radial(
        roundTo(_currentResultset.current.bestSailTWAMax, 1),
        35,
        20,
        false,
        c,
        '°',
        [3, 5]
      );
      c.stroke();
    }

    c.restore();
    limitsOptimumsHtml();
  }

  plotBoatSpeedAxis(c, drawTheme);

  if (document.getElementById('sel_polar_foil').checked) {
    plotFoilRange(c);
  }

  sailsSpeedHtml(twa, polar);
  spikesSpeedHtml();
}

/* =========================================================================
 *  HTML HELPERS
 * ========================================================================= */

function sailsSpeedHtml(twa, polar) {
  let tabSails = '<thead>' +
    '<tr><th  colspan="3">Voiles</th></tr>' +
    '</thead>' +
    '<tbody>';

  for (const sailDef of polar.sail) {
    if (isSailisInOptions(sailDef.id, _currentResultset.current.__options)) {
      let style = '';
      if (sailDef.id === _currentResultset.current.bestSail) {
        style = 'style="font-weight: 1000;font-size: large;"';
      }

      tabSails += '<tr>' +
        '<td><span class="ingTBD"></span></td>' +
        `<td ${style}>${sailNames[sailDef.id]}</td>` +
        `<td>${_polarsData[twa].all[sailDef.id]}`;

      if (
        (_polarsData[twa].all[sailDef.id] * 1.014) > _currentResultset.current.speed &&
        sailDef.id !== _currentResultset.current.bestSail
      ) {
        tabSails += ` (${roundTo(_currentResultset.current.speed, 3)})`;
      }

      tabSails += ' nds</td></tr>';
    }
  }

  tabSails += '</tbody>';
  document.getElementById('polarTableSailInfo').innerHTML = tabSails;
}

function spikesSpeedHtml() {
  const showSummit = document.getElementById('sel_polar_summit').checked;
  const showHole = document.getElementById('sel_polar_hole').checked;

  if (!showSummit && !showHole) {
    document.getElementById('polarTableSpikeInfo').innerHTML = '';
    document.getElementById('polarDivSpikeInfo').style = 'display:none;';
    return;
  }
  let title = '';
  if(showSummit)
  {
    title = 'Pics';
    if(showHole)
      title += ' / ';
  }
  if(showHole)
    title += 'Creux';
  
  let tabSpikes = '<thead>' +
    '<tr><th  colspan="9">'+ title + '</th></tr>' +
    '<tr><th>TWA</th><th>Speed</th><th>Sails</th><th class="spikeGroupStart">TWA</th><th>Speed</th><th>Sails</th><th class="spikeGroupStart">TWA</th><th>Speed</th><th>Sails</th></tr>' +
    '</thead>' +
    '<tbody>';

  const spikes = _currentResultset.current.spikes;

  if (!spikes || spikes.length < 1) {
    tabSpikes = '<tr><td colspan="9">Pas de pics/creux détecté</td></tr>';
  } else {
    let noneDrawn = true;
    let lineNumber = 0;
    for (let i = 0; i < spikes.length; i++) {
      const spike = spikes[i];
      if (
        (showHole && spike.type === 'hole') ||
        (showSummit && spike.type === 'sum')
      ) {
        if(lineNumber == 0) tabSpikes += '<tr>';
        lineNumber += 1;
        const colorType = spike.type === 'hole' ? 'red' : 'green';
        tabSpikes +=  `<td style="color:${colorType}">${spike.idx} °</td>` +
          `<td style="color:${colorType}">${spike.speed.toFixed(3)} nds</td>` +
          `<td style="color:${colorType}">${sailNames[spike.sail]}</td>`;

        noneDrawn = false;
        if(lineNumber == 3)
        {
          tabSpikes += '</tr>';
          lineNumber = 0;
        }
      }
         
    }
    if(lineNumber !=0)
    {      
      tabSpikes += '<td colspan="'+ 3*(3-lineNumber) +'"></td>';
      tabSpikes += '</tr>';
    }

    if (noneDrawn) {
      if (showSummit) {
        tabSpikes = '<tr><td colspan="9">Pas de pics'
        if (showHole) {
          tabSpikes += '/creux'
        }
        tabSpikes += ' détecté</td></tr>';
      } else {
        tabSpikes = '<tr><td colspan="9">Pas de creu détecté</td></tr>';
      }
    }
  }

  tabSpikes += '</tbody>';
  document.getElementById('polarTableSpikeInfo').innerHTML = tabSpikes;
  document.getElementById('polarDivSpikeInfo').style = 'display:block;';
}

function limitsOptimumsHtml() {
  let tabLO = '<thead>' +
    '<tr><th colspan="2">Limits</th></tr>' +
    '</thead>' +
    '<tbody>';

  tabLO += '<tr><td colspan="2">Max Speed</td></tr>';
  tabLO += `<tr><td>Twa</td><td>${roundTo(_currentResultset.max.twa, 2)} °</td></tr>`;
  tabLO += `<tr><td>Speed</td><td>${roundTo(_currentResultset.max.speed, 3)} nds</td></tr>`;
  tabLO += `<tr><td>Sail</td><td>${sailNames[_currentResultset.max.sail]}</td></tr>`;

  tabLO += '<tr><td colspan="2"></td></tr>';
  tabLO += '<tr><td colspan="2">Best VMG</td></tr>';
  tabLO += `<tr><td>Twa Up</td><td>${roundTo(_currentResultset.bestVMG.upwind.twa, 2)} °</td></tr>`;
  tabLO += `<tr><td>Twa Dw</td><td>${roundTo(_currentResultset.bestVMG.downwind.twa, 2)} °</td></tr>`;
  tabLO += '<tr><td colspan="2"></td></tr>';

  tabLO += `<tr><td colspan="2">Limite voiles ${sailNames[_currentResultset.current.bestSail]}</td></tr>`;
  tabLO += `<tr><td colspan="2">TWS : ${_currentResultset.current.__tws} nds</td></tr>`;
  tabLO += `<tr><td>Twa Min</td><td>${roundTo(_currentResultset.current.bestSailTWAMin, 2)} °</td></tr>`;
  tabLO += `<tr><td>Twa Max</td><td>${roundTo(_currentResultset.current.bestSailTWAMax, 2)} °</td></tr>`;
  tabLO += '</tbody>';

  document.getElementById('polarTablelimitInfo').innerHTML = tabLO;
}

/* =========================================================================
 *  EVENTS / INTERACTIONS
 * ========================================================================= */

function polar_change_speed(e) {
  let tws = parseFloat(divPolarTws.value);

  if (Number.isNaN(tws)) return;

  if (e) {
    const id = e.target.id;

    if (id === 'polar_minus_1') {
      tws -= 1;
    } else if (id === 'polar_minus_0_1') {
      tws -= 0.1;
    } else if (id === 'polar_plus_0_1') {
      tws += 0.1;
    } else if (id === 'polar_plus_1') {
      tws += 1;
    } else if (id === 'polar_tws') {
      tws = e.target.value;
    }
  }

  if (tws < 0.1) tws = 0.1;
  if (tws > 50) tws = 50;

  buildRaceAnalyseAdvance(
    tws,
    _currentResultset.current.__twd,
    _currentResultset.current.__twa
  );
}

function polar_change_full_sail() {
  const userPrefs = getUserPrefs();
  const polar = getPolar();
  if (!polar) return;
  schedulePolarRedraw(polar, userPrefs.theme, false);
}

function getMousePos(c, e) {
  const rect = c.getBoundingClientRect();
  return {
    x: e.clientX - rect.left - GRAPH_DX,
    y: e.clientY - rect.top - GRAPH_DY
  };
}

function polar_apply_scale() {
  if (polarScaling > 1) {
    const alpha = (1 - polarScaling) / polarScalingOld;
    scaleOffsetX = alpha * mouseX;
    scaleOffsetY = alpha * mouseY;
  } else {
    scaleOffsetX = 0;
    scaleOffsetY = 0;
  }

  R = minSize * polarScaling;
  GRAPH_DX = staticDx + scaleOffsetX;
  GRAPH_DY = staticDy + scaleOffsetY;
}

export function polar_mouse_wheel(e) {
  if (_currentResultset.current.__raceId === undefined) return;

  if (e.deltaY > 0) {
    polarScaling = polarScaling - 0.2 > 1 ? polarScaling - 0.2 : 1;
  } else {
    polarScaling += 0.2;
  }

  const userPrefs = getUserPrefs();
  const polar = getPolar();
  if (!polar) return;

  schedulePolarRedraw(polar, userPrefs.theme, true);
  polarScalingOld = polarScaling;

  e.preventDefault();
}

function polar_change_twa(e) {
  if (_currentResultset.current.__raceId === undefined || !e) return;

  const eltId = e.target?.id;
  let twa = _currentResultset.current.__twa;
  let doRefresh = false;

  if (eltId === 'polar_twa_minus_1') {
    twa = Number(roundTo(twa, 0));
    twa = twa > 0 ? twa - 1 : 0;
    doRefresh = true;
  } else if (eltId === 'polar_twa_minus_0_1') {
    twa = Number(roundTo(twa, 1));
    twa = twa > 0.1 ? twa - 0.1 : 0;
    doRefresh = true;
  } else if (eltId === 'polar_twa_plus_0_1') {
    twa = Number(roundTo(twa, 1));
    twa = twa < 179.9 ? twa + 0.1 : 180;
    doRefresh = true;
  } else if (eltId === 'polar_twa_plus_1') {
    twa = Number(roundTo(twa, 0));
    twa = twa < 180 ? twa + 1 : 180;
    doRefresh = true;
  } else {
    const pos = getMousePos(divPolarGraph, e);
    twa = Number(roundTo(Math.atan2(pos.x, R - pos.y) * 180 / Math.PI, 2));

    if (twa < 0 && twa > -90) twa = 0;
    if (twa < 0 && twa < -90) twa = 180;

    if (e.buttons === 1) {
      doRefresh = true;
    } else {
      mouseX = pos.x;
      mouseY = pos.y;
      mouseTWA = twa;
    }
  }

  if (doRefresh) {
    buildRaceAnalyseAdvance(
      _currentResultset.current.__tws,
      _currentResultset.current.__twd,
      twa
    );
  }
}

function polar_reset() {
  buildRaceAnalyseAdvance();
}

/* =========================================================================
 *  INIT / LAYOUT
 * ========================================================================= */

function initialize() {
  if (divPolarTws) return; // déjà initialisé

  divPolarTws = document.getElementById('polar_tws');
  divPolarTwa = document.getElementById('polar_twa');
  divPolarGraph = document.getElementById('polarGraph');
  divPolarDensity = document.getElementById('polarDensity');
  initRaceAnalysis2('polarDensity');
  inputSpikeSensitivity = document.getElementById('polar_spike_sensitivity');
  selRace = document.getElementById('sel_race');
  const polarViewersPrefs = getUserPrefs()?.analysis?.polarViewers;

  if (inputSpikeSensitivity && polarViewersPrefs?.spikeSensitivity != null) {
    inputSpikeSensitivity.value = polarViewersPrefs.spikeSensitivity;
  }

  divPolarGraph.width = divPolarGraph.offsetWidth;
  divPolarGraph.height = divPolarGraph.offsetHeight;

  document.getElementById('polar_minus_1')
    .addEventListener('click', polar_change_speed);
  document.getElementById('polar_minus_0_1')
    .addEventListener('click', polar_change_speed);
  document.getElementById('polar_plus_0_1')
    .addEventListener('click', polar_change_speed);
  document.getElementById('polar_plus_1')
    .addEventListener('click', polar_change_speed);
  divPolarTws.addEventListener('change', polar_change_speed);
  inputSpikeSensitivity.addEventListener('change', polar_change_speed);

  divPolarGraph.addEventListener('mousemove', polar_change_twa);
  divPolarGraph.addEventListener('mousedown', polar_change_twa);
  divPolarGraph.addEventListener('wheel', polar_mouse_wheel);

  document.getElementById('polar_twa_minus_0_1')
    .addEventListener('click', polar_change_twa);
  document.getElementById('polar_twa_minus_1')
    .addEventListener('click', polar_change_twa);
  document.getElementById('polar_twa_plus_0_1')
    .addEventListener('click', polar_change_twa);
  document.getElementById('polar_twa_plus_1')
    .addEventListener('click', polar_change_twa);
}

function onShow() {
  const t = document.getElementById('polarGraphDiv');

  divPolarGraph.style.width = `${t.offsetWidth}px`;
  divPolarGraph.style.height = `${t.offsetHeight}px`;
  divPolarGraph.width = t.offsetWidth;
  divPolarGraph.height = t.offsetHeight;

  minSize = (t.offsetHeight) / 2 - staticDx;
  R = minSize * polarScaling;
  GRAPH_DX = staticDx + scaleOffsetX;
  GRAPH_DY = staticDy + scaleOffsetY;
}

function onShowD() {
  const t = document.getElementById('polarDensityDiv');
  const w = t.offsetWidth;
  const h = t.offsetHeight;

  divPolarDensity.style.width = `${w}px`;
  divPolarDensity.style.height = `${h}px`;
  divPolarDensity.width = w;
  divPolarDensity.height = h;

  densityGraphWidth = (w * 2) / 3;
}
