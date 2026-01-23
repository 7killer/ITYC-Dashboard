import {DateUTC,formatPosition, getRankingCategory
} from './common.js';

import {getRaceInfo,getLegPlayerInfos} from '../app/memoData.js'

import {getUserPrefs, saveUserPrefs} from "../../common/userPrefs.js"
import {creditsMaxAwardedByPriceLevel} from './constant.js'
/***** helpers DOM très compacts *****/
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  // props: { class, dataset, style, on: {click: fn}, ...attributes }
  for (const [k, v] of Object.entries(props || {})) {
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'style') Object.assign(el.style, v);
    else if (k === 'on') for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
    else if (v !== undefined && v !== null) el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    el.append(c instanceof Node ? c : document.createTextNode(c ?? ''));
  }
  return el;
}
const frag = (...nodes) => nodes.reduce((f, n) => (f.append(n), f), document.createDocumentFragment());



/***** petites aides *****/
const optionKeys = [
  ['foil','Foils'],
  ['winch','Winch'],
  ['hull','Hull'],
  ['light','Light'],
  ['reach','Reach'],
  ['heavy','Heavy'],
  ['radio','Radio'],
  ['magicFurler','Magic Furler'],
  ['comfortLoungePug','Comfort Lounge'],
  ['vrtexJacket','VRTex Jacket'],
];

function isTaken(playerOptions, key) {
    return !!(playerOptions && playerOptions[key] === true);
}
function totalOptionCredits(raceInfo,playerOptions) {
  let sum = 0;
  if (!raceInfo?.optionPrices) return sum;
  for (const [k] of optionKeys) if (isTaken(playerOptions, k)) sum += raceInfo.optionPrices[k] || 0;
  return sum;
}

/***** blocs UI *****/
function card(title, bodyNodes, {icon=null} = {}) {
  return h('section', {class:'card'},
    h('div', {class:'card-header'},
      icon ? h('span', {class:'badge'}, icon) : null,
      h('h3', null, title)
    ),
    h('div', {class:'card-body'}, ...(Array.isArray(bodyNodes) ? bodyNodes : [bodyNodes]))
  );
}

function tableModern({head=[], rows=[]}) {
  const thead = h('thead', null, h('tr', null, ...head.map(t => h('th', null, t))));
  const tbody = h('tbody', null, ...rows.map(r => h('tr', null, ...r.map((c,i) => h('td', {class: i.className || ''}, c)))));
  return h('div', {class:'table-wrap'}, h('table', {class:'table-modern'}, thead, tbody));
}

/***** sections *****/
function viewIdentity(raceInfo,playerOptions) {
  const rid = raceInfo.raceId+"_"+raceInfo.legNum;
  const img = h('img', {src:`https://static.virtualregatta.com/offshore/leg/${rid}.jpg`, style: { height: '48px', borderRadius: '8px' }});
  const badge = h('span', {class:'badge'}, img, 'Race');
  const grid = h('div', {class:'kv'},
    h('div', {class:'k'}, 'Race Name (Id)'), h('div', {class:'v'}, `${raceInfo.legName} (${rid})`),
    h('div', {class:'k'}, 'Boat Name'), h('div', {class:'v'}, raceInfo.boatName ?? '-'),
    h('div', {class:'k'}, 'Wind Model'), h('div', {class:'v'}, `GFS ${(raceInfo.fineWinds ? '0.25' : '1.0')}°`),
    h('div', {class:'k'}, 'VSR Level'), h('div', {class:'v'}, `VSR${raceInfo.vsrLevel}`),
    h('div', {class:'k'}, 'Price'), h('div', {class:'v'}, `Cat. ${raceInfo.priceLevel}`),
    h('div', {class:'k'}, 'Category'), h('div', {class:'v'}, getRankingCategory(playerOptions?.options)),
  );
  return card('Race Details', [h('div', {class:'chips'}, badge), grid]);
}

function viewCredits(raceInfo,playerIte) {

  const awarded = (playerIte?.rank > 0)
    ? Math.round(creditsMaxAwardedByPriceLevel[raceInfo.priceLevel-1] / (Math.pow(playerIte.rank, 0.4)))
    : '-';

  const head = ['Game Credits','Free Credits','Current Race Credits (Total Options)','Gains',
    ...optionKeys.map(([,label]) => label)
  ];
  const takenTotal = totalOptionCredits(raceInfo,playerIte?.options?.options);
  const takenCells = optionKeys.map(([k]) => {
    const takenStyle = isTaken(playerIte?.options?.options,k) ? {outline:'2px solid #25d366'} : {};
    return h('span', {class: 'chip', style: takenStyle}, String(raceInfo?.optionPrices?.[k] ?? '-'))
  });
  const rows = [[
    String(playerIte?.info?.credits ?? '-'),
    String(raceInfo.freeCredits ?? '-'),
    `${(playerIte?.info?.credits || playerIte?.info?.credits===0) ? playerIte.info.credits : '???'}  `,
    String(awarded),
    ...takenCells
  ]];

  // insert the (-total) info visuellement à côté
  rows[0][2] = frag(
    h('span', null, rows[0][2]),
    ' ',
    h('span', {class:'chip', style:{borderColor:'tomato', color:'tomato'}}, `(-${takenTotal})`)
  );

  return card('Credits (Option équipée)', tableModern({head, rows}));
}

function viewStages(raceInfo, playerIte) {
  const userPrefs = getUserPrefs();
  const head = ['Type','Name','Id','Position','Position2','Status'];

  const rows = [];

  // Start
  rows.push([
    '🚩 Start',
    raceInfo.start?.name ?? '-',
    'Start',
    formatPosition(raceInfo.start.lat, raceInfo.start.lon),!!
    ' - ',
    frag('Date : ', h('span',{class:'pill pill--muted'}, DateUTC(raceInfo.start.date,1,userPrefs.global.localTime ?3:4)))
  ]);

  // Checkpoints
  if (Array.isArray(raceInfo.checkpoints)) {
    for (const cp of raceInfo.checkpoints) {
      let cpName = (cp.display && cp.display !== 'none') ? cp.display : 'Invisible';
      cpName = cpName.charAt(0).toUpperCase() + cpName.slice(1);
      if (cpName === 'Buoy') cpName = '🏳️ ' + cpName;

      const passed = (playerIte?.ites[0]?.gateGroupCounters && playerIte.ites[0].gateGroupCounters[cp.group - 1]) ? h('span',{class:'pill pill--ok'},'Passed') : ' - ';

      rows.push([
        cpName,
        cp.name ?? '',
        `${cp.group}.${cp.id}`,
        formatPosition(cp.start.lat, cp.start.lon),
        (cp.end ? formatPosition(cp.end.lat, cp.end.lon) : ' - '),
        passed
      ]);
    }
  }

  // End
  rows.push([
    '🏁 End',
    raceInfo.end?.name ?? '-',
    'End',
    formatPosition(raceInfo.end.lat, raceInfo.end.lon),
    (raceInfo.end?.radius ? `Radius : ${raceInfo.end.radius} mn` : ' - '),
    frag('Date : ', h('span',{class:'pill pill--muted'}, DateUTC(raceInfo.end.date,1,userPrefs.global.localTime ?3:4)))
  ]);

  return card('Race Stages', tableModern({head, rows}));
}

function viewIceLimits(raceInfo) {
  const south = raceInfo?.ice_limits?.south;
  if (!Array.isArray(south) || south.length === 0) return null;

  // ignore dummy pattern (même logique que ton code)
  const isDummy = (south.length === 5
    && south[0].lat === -90 && south[0].lon === -180
    && south[2].lat === -90 && south[2].lon === 0
    && south[4].lat === -90 && south[4].lon === 180);
  if (isDummy) return null;

  const head = ['Section', 'Position', 'Position2'];
  const rows = [];

  for (let i=1; i<south.length; i++) {
    rows.push([
      `Section ${i+1}`,
      formatPosition(south[i-1].lat, south[i-1].lon),
      formatPosition(south[i].lat, south[i].lon),
    ]);
  }

  return card('Limites des glaces', tableModern({head, rows}));
}

function viewRestrictedZones(raceInfo) {
  const rz = raceInfo?.restrictedZones;
  if (!Array.isArray(rz) || rz.length === 0) return null;

  // transforme en lignes: une ligne par coordonnée, nom répété par rowspan visuel (on s’affranchit du rowspan pour responsive)
  const head = ['Nom','Position'];
  const rows = [];
  for (const z of rz) {
    const name = z.name ?? '—';
    for (const p of (z.vertices || [])) {
      rows.push([name, formatPosition(p.lat, p.lon)]);
    }
  }
  return card('Zones interdites', tableModern({head, rows}));
}

/***** rendu principal *****/
export function buildRaceBookHtml() {
    const host = document.getElementById('raceBook');
    if (!host) return;
    const raceInfo = getRaceInfo();
    const playerIte = getLegPlayerInfos();


    if(!raceInfo || raceInfo?.length == 0 ) {
        host.replaceChildren(
          card('Race Details', h('div', {class:'centered'}, 'No data available. Please enter a race.'))
        );
        return;
    }
    const identity = viewIdentity(raceInfo,playerIte?.options?.options);
    const credits  = viewCredits(raceInfo,playerIte);
    const stages   = viewStages(raceInfo,playerIte);
    const ice      = viewIceLimits(raceInfo,playerIte);
    const rz       = viewRestrictedZones(raceInfo,playerIte);
    // grille principale : identité + crédits côte à côte quand large
    const gridTop = h('div', {class:'rb-grid'}, identity, credits);

    host.replaceChildren(
    gridTop,
    stages,
    ice || document.createComment('no ice limits'),
    rz  || document.createComment('no restricted zones'),
    );
}
