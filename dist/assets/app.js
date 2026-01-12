import "./modulepreload-polyfill-7faf532e.js";
import { g as getData, a as getAllData, b as getLatestEntriesPerUser, c as getEntriesForTriplet, d as getLegPlayersOptionsByRaceLeg, e as getLegPlayersTracksByType, r as raceTableHeaders, f as roundTo, h as formatHM, i as formatTimeNotif, j as raceTableLines, k as infoSail, l as getUserPrefs, m as genthRacelog, n as dateUTCSmall, D as DateUTC, s as sailNames, o as formatPosition, p as formatSeconds, q as getxFactorStyle, t as gentdRacelog, u as getBG, v as genth, w as category, x as categoryStyleDark, y as categoryStyle, z as sailColors, A as gentd, B as formatTime, C as formatDHMS, E as formatShortDate, F as isBitSet, G as guessOptionBits, H as getRankingCategory, I as creditsMaxAwardedByPriceLevel, J as commonjsGlobal, K as getDefaultExportFromCjs, L as toRad, M as formatTimestampToReadableDate, N as gcDistance, O as courseAngle, P as display_selbox, Q as changeState, R as cleanSpecial, S as convertDMS2Dec, T as saveUserPrefs, U as switchTheme, V as loadUserPrefs, W as createKeyChangeListener } from "./_commonjsHelpers-e72aeee2.js";
const style = "";
let connectedPlayerId;
let connectedPlayerInfos = [];
let openedRaceId = { raceId: null, legNum: null, polarId: null };
let openedRaceIdHistory = [];
let raceInfo = [];
let legListUpdate = 0;
let raceList = [];
let playersUpdate = 0;
let playersList = [];
let teamsUpdate = 0;
let teamList = [];
let polarsUpdate = 0;
let legFleetInfosUpdate = 0;
let legFleetInfos = [];
let legPlayersInfosUpdate = 0;
let legPlayerInfos = [];
let legPlayerInfosHistory = [];
let legPlayersOptionsUpdate = 0;
let legPlayersOptions = [];
let paramStamina = [];
let legPlayersOrderUpdate = 0;
let legPlayersOrder = [];
let legSelectedPlayers = [];
let legPlayersTracksUpdate = 0;
let legPlayersTracks = [];
async function initMemo() {
  const currentId = await getData("internal", "lastLoggedUser");
  const currentRace = await getData("internal", "lastOpennedRace");
  if (currentId)
    connectedPlayerId = currentId.loggedUser;
  else
    connectedPlayerId = null;
  await updatePlayersList();
  await updateTeamsList();
  await updateConnectedPlayerInfos();
  if (currentRace && currentRace.raceId && currentRace.legNum) {
    openedRaceId.raceId = currentRace.raceId;
    openedRaceId.legNum = currentRace.legNum;
    await updateOpenedRaceId();
    await updatePolar();
    await updateLegFleetInfos();
    await updateLegPlayerInfos();
    await updateLegPlayersOrder();
    await updateLegPlayersOptions();
    await updateLegPlayersTracks();
  } else {
    raceList = [];
    raceInfo = [];
    legFleetInfos = [];
    legPlayerInfos = [];
    legPlayerInfosHistory = [];
    legPlayersOptions = [];
    legPlayersTracks = [];
  }
  openedRaceIdHistory = [];
  legPlayerInfosHistory = [];
  legSelectedPlayers = [];
  paramStamina = [];
  await updateParamStamina();
  legListUpdate = await getData("internal", "legListUpdate");
  playersUpdate = await getData("internal", "playersUpdate");
  teamsUpdate = await getData("internal", "teamsUpdate");
  polarsUpdate = await getData("internal", "polarsUpdate");
  legFleetInfosUpdate = await getData("internal", "legFleetInfosDashUpdate");
  legPlayersInfosUpdate = await getData("internal", "legPlayersInfosDashUpdate");
  legPlayersOptionsUpdate = await getData("internal", "legPlayersOptionsUpdate");
}
async function updateParamStamina() {
  const setting = await getData("internal", "paramStamina").catch((error) => {
    console.error("getParamstamina error :", error);
  });
  if (setting == null ? void 0 : setting.paramStamina)
    paramStamina = setting.paramStamina;
}
function getRaceInfo$1() {
  return raceInfo;
}
function getParamStamina() {
  return paramStamina;
}
function setLegSelectedPlayers(uid, selected) {
  legSelectedPlayers[uid] = selected;
}
function getLegSelectedPlayersState(uid) {
  if (legSelectedPlayers[uid])
    return true;
  else
    return false;
}
function getOpenedRaceHistory() {
  return openedRaceIdHistory;
}
function getLegPlayerInfosHistory() {
  return legPlayerInfosHistory;
}
function getLegListUpdate() {
  return legListUpdate;
}
function setLegListUpdate(ts) {
  legListUpdate = ts;
}
function getLegList() {
  return raceList;
}
async function updateLegList() {
  try {
    const oneWeekAgo = /* @__PURE__ */ new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const legList = await getAllData("legList");
    if (!Array.isArray(legList) || legList.length === 0) {
      console.warn("[updateLegList] legList vide ou non-tableau:", legList);
      raceList = {};
      raceInfo = null;
      return { raceList, raceInfo };
    }
    const filtered = legList.filter((leg) => {
      var _a;
      const endDate = ((_a = leg == null ? void 0 : leg.end) == null ? void 0 : _a.date) ? new Date(leg.end.date) : null;
      const isFinishedOld = (leg == null ? void 0 : leg.status) === "finished" && endDate instanceof Date && !Number.isNaN(endDate.valueOf()) && endDate < oneWeekAgo;
      return !isFinishedOld && (leg == null ? void 0 : leg.id) !== "update";
    });
    filtered.sort((a, b) => {
      var _a, _b;
      const da = new Date(((_a = a == null ? void 0 : a.start) == null ? void 0 : _a.date) || 0);
      const db = new Date(((_b = b == null ? void 0 : b.start) == null ? void 0 : _b.date) || 0);
      return da - db;
    });
    const map = /* @__PURE__ */ Object.create(null);
    let foundRaceInfo = null;
    for (const leg of filtered) {
      const fullRaceId = `${leg.raceId}-${leg.legNum}`;
      map[fullRaceId] = {
        raceId: leg.raceId,
        legNum: leg.legNum,
        name: leg.legName
      };
      if ((openedRaceId == null ? void 0 : openedRaceId.raceId) != null && (openedRaceId == null ? void 0 : openedRaceId.legNum) != null && openedRaceId.raceId === leg.raceId && openedRaceId.legNum === leg.legNum) {
        foundRaceInfo = leg;
      }
    }
    raceList = map;
    raceInfo = foundRaceInfo ?? null;
    console.log("[updateLegList] races:", Object.keys(raceList).length, "raceInfo:", !!raceInfo);
    return { raceList, raceInfo };
  } catch (error) {
    console.error("[updateLegList] error:", error);
    raceList = raceList ?? {};
    raceInfo = raceInfo ?? null;
    return { raceList, raceInfo };
  }
}
function getPlayersUpdate() {
  return playersUpdate;
}
function setPlayersUpdate(ts) {
  playersUpdate = ts;
}
function getPlayersList() {
  return playersList;
}
async function updatePlayersList() {
  const playersDatas = await getAllData("players").catch((error) => {
    console.error("getplayerList error :", error);
  });
  playersList = [];
  if (playersDatas.length !== 0) {
    playersDatas.forEach((player) => {
      playersList[player.id] = player;
      if (player.id == connectedPlayerId) {
        connectedPlayerInfos = player;
      }
    });
  }
}
function getTeamsUpdate() {
  return teamsUpdate;
}
function setTeamsUpdate(ts) {
  teamsUpdate = ts;
}
async function updateTeamsList() {
  const teamsDatas = await getAllData("teams").catch((error) => {
    console.error("getTeamsList error :", error);
  });
  teamList = [];
  if (teamsDatas.length !== 0) {
    teamsDatas.forEach((team) => {
      teamList[team.id] = team;
    });
  }
}
function getPolarsUpdate() {
  return polarsUpdate;
}
function setPolarsUpdate(ts) {
  polarsUpdate = ts;
}
async function updatePolar() {
  if (raceInfo == null ? void 0 : raceInfo.polarId) {
    await getData("polars", raceInfo.polarId).catch((error) => {
      console.error("getPolar error :", error);
    });
  }
}
function getLegFleetInfosUpdate() {
  return legFleetInfosUpdate;
}
function setLegFleetInfosUpdate(ts) {
  legFleetInfosUpdate = ts;
}
function getLegFleetInfos() {
  return legFleetInfos;
}
async function updateLegFleetInfos() {
  if ((raceInfo == null ? void 0 : raceInfo.raceId) && (raceInfo == null ? void 0 : raceInfo.legNum)) {
    const now = Date.now();
    const fifteenMinutesAgo = now - 15 * 60 * 1e3;
    const raceId = raceInfo.raceId;
    const legNum = raceInfo.legNum;
    const { items, meta } = await getLatestEntriesPerUser(raceId, legNum, {
      since: fifteenMinutesAgo,
      until: now,
      timeout: 4e3,
      storeName: "legFleetInfos"
    });
    if (!items || (items == null ? void 0 : items.length) == 0)
      return;
    legFleetInfos = [];
    for (const item of Object.entries(items)) {
      if (false in item[1])
        continue;
      const userId = item[1].userId;
      const playerOptionRace = legPlayersOptions[userId] ? legPlayersOptions[userId] : { options: [], guessOptions: 0 };
      const playerInfo = playersList[userId];
      const teamInfo = (playerInfo == null ? void 0 : playerInfo.teamId) ? teamList[playerInfo.teamId] ? teamList[playerInfo.teamId] : { id: null, name: "" } : { id: null, name: "" };
      const itePlayer = {
        ite: item[1],
        // ← ton tableau d’entrées
        info: playerInfo,
        team: teamInfo,
        options: playerOptionRace
      };
      legFleetInfos[userId] = itePlayer;
      if (item[1].choice)
        legSelectedPlayers[userId] = true;
    }
  } else
    legFleetInfos = [];
}
function getLegPlayersInfosUpdate() {
  return legPlayersInfosUpdate;
}
function setLegPlayersInfosUpdate(ts) {
  legPlayersInfosUpdate = ts;
}
function getLegPlayerInfos() {
  return legPlayerInfos;
}
async function updateLegPlayerInfos() {
  if ((raceInfo == null ? void 0 : raceInfo.raceId) && (raceInfo == null ? void 0 : raceInfo.legNum) && connectedPlayerId) {
    const raceId = raceInfo.raceId;
    const legNum = raceInfo.legNum;
    const { items, meta } = await getEntriesForTriplet(raceId, legNum, connectedPlayerId, { limit: 24 * 10 * 60, since: Date.now() - 10 * 24 * 60 * 60 * 1e3 });
    if (meta.timeout || !items || items.length == 0)
      return;
    const playerInfo = playersList[connectedPlayerId];
    const teamInfo = (playerInfo == null ? void 0 : playerInfo.teamId) ? teamList[playerInfo.teamId] ? teamList[playerInfo.teamId] : { id: null, name: "" } : { id: null, name: "" };
    const playerOptionRace = legPlayersOptions[connectedPlayerId] ? legPlayersOptions[connectedPlayerId] : { options: [], guessOptions: 0 };
    const legPlayerIte = {
      ites: items,
      // ← ton tableau d’entrées
      info: playerInfo,
      team: teamInfo,
      options: playerOptionRace
    };
    legPlayerInfos = legPlayerIte;
  } else
    legPlayerInfos = [];
}
function getLegPlayersOrderUpdate() {
  return legPlayersOrderUpdate;
}
function setLegPlayersOrderUpdate(ts) {
  legPlayersOrderUpdate = ts;
}
function getLegPlayersOrder() {
  return legPlayersOrder;
}
async function updateLegPlayersOrder() {
  if ((raceInfo == null ? void 0 : raceInfo.raceId) && (raceInfo == null ? void 0 : raceInfo.legNum) && connectedPlayerId) {
    const raceId = raceInfo.raceId;
    const legNum = raceInfo.legNum;
    const { items, meta } = await getEntriesForTriplet(raceId, legNum, connectedPlayerId, { storeName: "legPlayersOrder", limit: 24 * 10 * 60, since: Date.now() - 10 * 24 * 60 * 60 * 1e3 });
    if (meta.timeout || !items || items.length == 0)
      return;
    legPlayersOrder = items;
  } else
    legPlayersOrder = [];
}
function getLegPlayersOptionsUpdate() {
  return legPlayersOptionsUpdate;
}
function setLegPlayersOptionsUpdate(ts) {
  legPlayersOptionsUpdate = ts;
}
async function updateLegPlayersOptions() {
  if ((raceInfo == null ? void 0 : raceInfo.raceId) && (raceInfo == null ? void 0 : raceInfo.legNum) && connectedPlayerId) {
    const raceId = raceInfo.raceId;
    const legNum = raceInfo.legNum;
    const playersOptList = await getLegPlayersOptionsByRaceLeg(raceId, legNum).catch((error) => {
      console.error("getlayersOptions error :", error);
    });
    legPlayersOptions = playersOptList && playersOptList.length != 0 ? playersOptList : [];
  }
}
function getLegPlayersTracksUpdate() {
  return legPlayersTracksUpdate;
}
function setLegPlayersTracksUpdate(ts) {
  legPlayersTracksUpdate = ts;
}
function getLegPlayersTracksFleet() {
  return legPlayersTracks.fleet ? legPlayersTracks.fleet : [];
}
function getLegPlayersTrackLeader() {
  return legPlayersTracks.leader ? legPlayersTracks.leader : [];
}
function getLegPlayersTracksGhost() {
  if (!connectedPlayerId || !legPlayersTracks.ghosts || legPlayersTracks.ghosts.lenght == 0 || legPlayersTracks.ghosts[connectedPlayerId] == 0)
    return [];
  return legPlayersTracks.ghosts[connectedPlayerId];
}
async function updateLegPlayersTracks() {
  if ((raceInfo == null ? void 0 : raceInfo.raceId) && (raceInfo == null ? void 0 : raceInfo.legNum)) {
    const raceId = raceInfo.raceId;
    const legNum = raceInfo.legNum;
    legPlayersTracks = {};
    const fleetTracksList = await getLegPlayersTracksByType(raceId, legNum, "fleet", { asMap: true }).catch((error) => {
      console.error("fleetTracksList error :", error);
    });
    legPlayersTracks.fleet = fleetTracksList && fleetTracksList.length != 0 ? fleetTracksList : [];
    const leaderTrackList = await getLegPlayersTracksByType(raceId, legNum, "leader", { asMap: true }).catch((error) => {
      console.error("leaderTrackList error :", error);
    });
    legPlayersTracks.leader = leaderTrackList && leaderTrackList.length != 0 ? leaderTrackList : [];
    const goshtTrackList = await getLegPlayersTracksByType(raceId, legNum, "ghost", { asMap: true }).catch((error) => {
      console.error("goshtTrackList error :", error);
    });
    legPlayersTracks.ghosts = goshtTrackList && goshtTrackList.length != 0 ? goshtTrackList : [];
  }
}
function getConnectedPlayerId() {
  return connectedPlayerId;
}
function setConnectedPlayerId(uid) {
  connectedPlayerId = uid;
}
function getConnectedPlayerInfos() {
  return connectedPlayerInfos;
}
async function updateConnectedPlayerInfos() {
  if (playersList[connectedPlayerId]) {
    const playerInfo = playersList[connectedPlayerId];
    const teamInfo = (playerInfo == null ? void 0 : playerInfo.teamId) ? teamList[playerInfo.teamId] ? teamList[playerInfo.teamId] : { id: null, name: "" } : { id: null, name: "" };
    connectedPlayerInfos = { ...playerInfo, team: teamInfo };
    legSelectedPlayers[connectedPlayerId] = true;
  } else
    connectedPlayerInfos = [];
}
function getOpenedRaceId() {
  return openedRaceId;
}
async function updateOpenedRaceId() {
  await updateLegList();
  openedRaceId.polarId = raceInfo.polar_id;
  legSelectedPlayers = [];
  if (connectedPlayerId)
    legSelectedPlayers[connectedPlayerId] = true;
}
function setOpenedRaceId(rid, legNum) {
  if (!openedRaceIdHistory)
    openedRaceIdHistory = {};
  if (!legPlayerInfosHistory)
    legPlayerInfosHistory = {};
  if ((openedRaceId == null ? void 0 : openedRaceId.raceId) && (openedRaceId == null ? void 0 : openedRaceId.legNum)) {
    const key = `${openedRaceId.raceId}-${openedRaceId.legNum}`;
    if (!openedRaceIdHistory[key]) {
      openedRaceIdHistory[key] = { raceId: openedRaceId.raceId, legNum: openedRaceId.legNum };
      console.log(`[setOpenedRaceId] Ajouté à l'historique : ${key}`);
    }
    if (legPlayersInfos) {
      legPlayerInfosHistory[key] = structuredClone(legPlayersInfos);
      console.log(`[setOpenedRaceId] Copie legPlayersInfos -> legPlayerInfosHistory[${key}]`);
    } else if (!legPlayerInfosHistory[key]) {
      legPlayerInfosHistory[key] = {};
      console.log(`[setOpenedRaceId] Initialisation legPlayerInfosHistory[${key}] vide`);
    }
  }
  openedRaceId.raceId = rid;
  openedRaceId.legNum = legNum;
  updateParamStamina();
}
function setText(id, value) {
  const el = document.getElementById(id);
  if (el)
    el.textContent = value;
}
function updateVIPTag(isVIP) {
  const vipTag = document.getElementById("lb_boatvip");
  if (!vipTag)
    return;
  if (isVIP) {
    vipTag.textContent = " VIP ";
    vipTag.style.backgroundColor = "#f7da03";
    vipTag.style.color = "black";
  } else {
    vipTag.textContent = "";
    vipTag.style.backgroundColor = getComputedStyle(document.body).backgroundColor;
    vipTag.style.color = "";
  }
}
function onPlayerConnect() {
  const playerInfo = getConnectedPlayerInfos();
  if (playerInfo.length == 0)
    return;
  setText("lb_boatname", playerInfo.name);
  setText("lb_credits", playerInfo.credits);
  updateVIPTag(playerInfo.isVIP);
  if (playerInfo.team.length != 0) {
    setText("lb_teamname", playerInfo.team.name);
  }
}
function onRaceOpen() {
  const raceInfo2 = getRaceInfo$1();
  if ((raceInfo2 == null ? void 0 : raceInfo2.raceId) == null || (raceInfo2 == null ? void 0 : raceInfo2.legNum) == null)
    return;
  const raceKey = raceInfo2.raceId + "-" + raceInfo2.legNum;
  document.getElementById("sel_race").value = raceKey;
}
function updateRaceListDisplay() {
  const raceList2 = getLegList();
  const sel = document.getElementById("sel_race");
  [...sel.options].forEach((opt) => {
    if (opt.dataset.dynamic === "true")
      sel.removeChild(opt);
  });
  if (Object.keys(raceList2).length === 0) {
    const opt = document.createElement("option");
    opt.textContent = "Aucune course disponible";
    opt.disabled = true;
    opt.selected = true;
    opt.dataset.dynamic = "true";
    sel.appendChild(opt);
  } else {
    Object.values(raceList2).forEach((leg) => {
      const opt = document.createElement("option");
      const raceKey = leg.raceId + "-" + leg.legNum;
      opt.value = raceKey;
      opt.textContent = `${leg.name} (${raceKey})`;
      opt.dataset.dynamic = "true";
      sel.appendChild(opt);
    });
    onRaceOpen();
  }
}
function buildRaceStatusHtml() {
  var _a;
  const userPrefs = getUserPrefs();
  const connectedRace = getOpenedRaceId();
  const raceInfo2 = getRaceInfo$1();
  const raceItes = getLegPlayerInfos();
  const raceList2 = getLegList();
  if (!raceInfo2 || (raceInfo2 == null ? void 0 : raceInfo2.length) == 0 || !raceItes)
    return;
  let raceStatusHeader = '<tr><th title="Call Router" colspan="2">RT</th><th title="Call Polars">PL</th><th title="Call WindInfo">WI</th><th title="Call ITYC">ITYC</th><th title="Open compass">C</th><th>Race</th><th>Time</th>' + raceTableHeaders() + '<th title="Auto Sail time remaining">aSail</th><th title="Boat speed">Speed</th><th title="Boat VMG">VMG</th><th>Best VMG</th><th>Best speed</th><th title="Stamina">Stamina</th>';
  if (userPrefs.lang == "fr") {
    raceStatusHeader += '<th title="Temps de manoeuvre théorique">Virement</th><th title="Temps de manoeuvre théorique">Empannage</th><th title="Temps de manoeuvre théorique">Voile</th>';
  } else {
    raceStatusHeader += '<th title="Approximated manoeuvring loose">Tack</th><th title="Approximated manoeuvring loose">Gybe</th><th title="Approximated manoeuvring loose">Sail</th>';
  }
  raceStatusHeader += '<th title="Boat is aground">Agnd</th><th title="Boat is maneuvering, half speed">Mnvr</th>';
  if (userPrefs.raceData.lastCmd)
    raceStatusHeader += "<th >Last Command</th>";
  raceStatusHeader += '<th title="ITYC option Status">Co</th>';
  raceStatusHeader += "</tr>";
  let tableContent = buildRaceStatusHtmlLine(raceInfo2, ((_a = raceItes == null ? void 0 : raceItes.ites) == null ? void 0 : _a[0]) ?? null);
  const openedRaceIdHistory2 = getOpenedRaceHistory();
  const legPlayerInfosHistory2 = getLegPlayerInfosHistory();
  for (const legId of Object.entries(openedRaceIdHistory2)) {
    if (connectedRace.raceId != legId.raceId || connectedRace.legNum != legId.legNum) {
      const key = `${legId.raceId}-${legId.legNum}`;
      const legIte = legPlayerInfosHistory2[key];
      const legInfo = raceList2[key];
      if ((legIte == null ? void 0 : legIte.ites) && legInfo)
        tableContent += buildRaceStatusHtmlLine(legInfo, legIte.ites[0]);
    }
  }
  const tablecontainer = document.getElementById("raceStatus");
  tablecontainer.innerHTML = '<table id="raceStatusTable"><thead>' + raceStatusHeader + "</thead><tbody>" + tableContent + "</tbody></table>";
}
function buildRaceStatusHtmlLine(raceInfo2, raceIte) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
  if (!raceIte || !raceInfo2)
    return "";
  const userPrefs = getUserPrefs();
  let lastCommand = "-";
  let lastCommandBG = "";
  let agroundBG = raceIte.aground ? "LightRed" : "lightgreen";
  let mnvrBG = ((_a = raceIte.metaDash) == null ? void 0 : _a.manoeuvering) ? "LightRed" : "lightgreen";
  if (userPrefs.theme == "dark") {
    agroundBG = raceIte.aground ? "darkred" : "darkgreen";
    mnvrBG = ((_b = raceIte.metaDash) == null ? void 0 : _b.manoeuvering) ? "darkred" : "darkgreen";
  }
  let info = "-";
  if (raceInfo2.raceType === "leg") {
    info = "<span>" + raceInfo2.legName + "</span>";
  } else if (raceInfo2.raceType === "record") {
    if (raceInfo2.record) {
      info = "<span>Record, Attempt " + parseInt(raceInfo2.record.attemptCounter) + "</span>";
    } else {
      info = "<span>-</span>";
    }
  }
  if ((_c = raceInfo2.record) == null ? void 0 : _c.lastRankingGateName) {
    info += "<br/><span>@ " + raceInfo2.record.lastRankingGateName + "</span>";
  }
  let trstyle = "hov";
  const raceIdFull = getOpenedRaceId();
  if (raceInfo2.id === raceIdFull.raceId || raceInfo2.legNum === raceIdFull.legNum)
    trstyle += " sel";
  const best = (_d = raceIte.metaDash) == null ? void 0 : _d.bVmg;
  const bestVMGString = best ? best.twaUp + '<span class="textMini">°</span> | ' + best.twaDown + '<span class="textMini">°</span>' : "-";
  const bestVMGTilte = best ? roundTo(best.vmgUp, 3) + '<span class="textMini"> kts</span> | ' + roundTo(Math.abs(best.vmgDown), 3) + '<span class="textMini"> kts</span>' : "-";
  const bspeedTitle = best ? roundTo(best.bspeed, 3) + ' <span class="textMini">kts</span><br>' + best.btwa + '<span class="textMini">°</span>' : "-";
  let lastCalcStyle = "";
  if (((_e = raceIte.metaDash) == null ? void 0 : _e.deltaReceiveCompute) > 9e5) {
    lastCalcStyle = 'style="background-color: red;';
    lastCalcStyle += userPrefs.theme == "dark" ? ' color:black;"' : '"';
  }
  const manoeuver = (_f = raceIte.metaDash) == null ? void 0 : _f.manoeuver;
  const tack = manoeuver ? "<p>-" + manoeuver.tack.pena.dist + "nm | " + manoeuver.tack.pena.time + "s</p><p>" + manoeuver.tack.energyLoose + "% | " + manoeuver.tack.energyRecovery + "min</p>" : "-";
  const gybe = manoeuver ? "<p>-" + manoeuver.gybe.pena.dist + "nm | " + manoeuver.gybe.pena.time + "s</p><p>" + manoeuver.gybe.energyLoose + "% | " + manoeuver.gybe.energyRecovery + "min</p>" : "-";
  const sail = manoeuver ? "<p>-" + manoeuver.sail.pena.dist + "nm | " + manoeuver.sail.pena.time + "s</p><p>" + manoeuver.sail.energyLoose + "% | " + manoeuver.sail.energyRecovery + "min</p>" : "-";
  let staminaStyle = "";
  let staminaTxt = "-";
  const stamina = (_g = raceIte.metaDash) == null ? void 0 : _g.realStamina;
  const paramStamina2 = getParamStamina();
  if (stamina) {
    if (stamina < (paramStamina2 == null ? void 0 : paramStamina2.tiredness[0]))
      staminaStyle = 'style="color:red"';
    else if (stamina < (paramStamina2 == null ? void 0 : paramStamina2.tiredness[1]))
      staminaStyle = 'style="color:orange"';
    else
      staminaStyle = 'style="color:green"';
    staminaTxt = roundTo(stamina, 2) + "%";
    staminaTxt += " (x" + roundTo(manoeuver.staminaFactor, 2) + ")";
  }
  let fullStamina = '<td class="stamina" ';
  if (((_h = raceIte.metaDash) == null ? void 0 : _h.coffeeBoost) != 0 || ((_i = raceIte.metaDash) == null ? void 0 : _i.chocoBoost) != 0) {
    fullStamina += '><div class="textMini">';
    if (((_j = raceIte.metaDash) == null ? void 0 : _j.chocoBoost) != 0) {
      fullStamina += "🍫+" + roundTo(raceIte.metaDash.chocoBoost, 2) + "%";
      fullStamina += " ⌚" + formatHM(raceIte.metaDash.chocoExp - Date.now());
    }
    fullStamina += "</div>";
    fullStamina += "<div " + staminaStyle + ">";
    fullStamina += staminaTxt;
    fullStamina += "</div>";
    fullStamina += '<div class="textMini">';
    if (((_k = raceIte.metaDash) == null ? void 0 : _k.coffeeBoost) != 0) {
      fullStamina += "☕+" + roundTo(raceIte.metaDash.coffeeBoost, 2) + "%";
      fullStamina += " ⌚" + formatHM(raceIte.metaDash.coffeeExp - Date.now());
    }
    fullStamina += "</div>";
    fullStamina += "</td>";
  } else {
    fullStamina += staminaStyle + ">" + staminaTxt + "</td>";
  }
  let itycLedColor = "LightGrey";
  const rid = raceInfo2.raceId + "-" + raceInfo2.legNum;
  const zezoUrl = raceInfo2.zezoUrl ? raceInfo2.zezoUrl : null;
  let returnVal = '<tr class="' + trstyle + '" id="rs:' + rid + '">';
  returnVal += zezoUrl ? '<td class="tdc"><span id="rt:' + rid + '">&#x2388;</span></td>' : "<td>&nbsp;</td>";
  returnVal += '<td class="tdc"><span id="vrz:' + rid + '">&#x262F;</span></td>';
  returnVal += '<td class="tdc"><span id="pl:' + rid + '">&#x26F5;</span></td>';
  returnVal += '<td class="tdc"><span id="wi:' + rid + '"><img class="icon" src="./img/wind.svg"/></span></td>';
  returnVal += '<td class="tdc"><span id="ityc:' + rid + '">&#x2620;</span></td>';
  returnVal += '<td class="tdc"><span id="cp:' + rid + '"><img class="icon" src="./img/compass.svg"/></span></td>';
  returnVal += '<td class="name">' + raceInfo2.legName + "</td>";
  returnVal += '<td class="time" ' + lastCalcStyle + ">" + formatTimeNotif(raceIte.iteDate) + "</td>";
  returnVal += raceTableLines(raceIte, best);
  returnVal += infoSail(raceIte, false);
  returnVal += '<td class="speed1">' + roundTo(raceIte.speed, 3) + "</td>";
  returnVal += '<td class="speed2">' + (((_l = raceIte.metaDash) == null ? void 0 : _l.vmg) ? roundTo(raceIte.metaDash.vmg, 3) : "-") + "</td>";
  returnVal += '<td class="bvmg"><p>' + bestVMGString + "</p>";
  if (userPrefs.raceData.VMGSpeed)
    returnVal += "<p>(" + bestVMGTilte + ")</p>";
  returnVal += "</td>";
  returnVal += '<td class="bspeed">' + bspeedTitle + "</td>";
  returnVal += fullStamina;
  returnVal += '<td class="tack">' + tack + "</td>";
  returnVal += '<td class="gybe">' + gybe + "</td>";
  returnVal += '<td class="sailPenalties">' + sail + "</td>";
  returnVal += '<td class="agrd" style="background-color:' + agroundBG + ';">' + (raceIte.aground ? "AGROUND" : "No") + "</td>";
  returnVal += '<td class="man" style="background-color:' + mnvrBG + ';">' + (((_m = raceIte.metaDash) == null ? void 0 : _m.manoeuvering) ? "Yes" : "No") + "</td>";
  if (userPrefs.raceData.lastCmd)
    returnVal += "<td " + lastCommandBG + '">' + lastCommand + "</td>";
  returnVal += '<td><span style="color:' + itycLedColor + ';font-size:16px;"><b>&#9679</b></span></td>';
  returnVal += "</tr>";
  return returnVal;
}
function buildRaceLogHtml() {
  const userPrefs = getUserPrefs();
  const raceInfo2 = getRaceInfo$1();
  const racePlayerInfos = getLegPlayerInfos();
  const raceOrder = getLegPlayersOrder();
  if (!raceInfo2 || (raceInfo2 == null ? void 0 : raceInfo2.length) == 0 || !(racePlayerInfos == null ? void 0 : racePlayerInfos.ites))
    return;
  let raceItes = racePlayerInfos.ites;
  if (raceOrder == null ? void 0 : raceOrder.length) {
    raceItes = [...raceItes, ...raceOrder].sort((a, b) => b.iteDate - a.iteDate);
  }
  const raceLogTableHeader = "<tr>" + genthRacelog("th_rl_date", "dateTime", "Time" + dateUTCSmall()) + raceTableHeaders() + genthRacelog("th_rl_aSail", "aSail", "aSail", "Auto Sail time remaining") + genthRacelog("th_rl_reportedSpeed", "reportedSpeed", "vR (kn)", "Reported speed") + genthRacelog("th_rl_calcSpeed", "calcSpeed", "vC (kn)", "Calculated speed (Δd/Δt)") + genthRacelog("th_rl_foils", "foils", "Foils", "Foiling factor") + genthRacelog("th_rl_factor", "factor", "Factor", "Speed factor") + genthRacelog("th_rl_stamina", "stamina", "Stamina", "Stamina Value. (penalities factor)") + genthRacelog("th_rl_deltaDistance", "deltaDistance", "Δd (nm)", "Calculated distance") + genthRacelog("th_rl_deltaTime", "deltaTime", "Δt (s)", "Time between positions") + genthRacelog("th_rl_psn", "position", "Position") + genthRacelog("th_rl_sail", "sail", "Sail", "Sail change time remaining") + genthRacelog("th_rl_gybe", "gybe", "Gybe", "Gybing time remaining") + genthRacelog("th_rl_tack", "tack", "Tack", "Tacking time remaining") + "</tr>";
  let raceLogContent = "";
  if (raceItes.length == 0)
    return;
  for (let idx2 = 0; idx2 < raceItes.length; idx2++) {
    const raceLogLine = raceItes[idx2];
    if ("action" in raceLogLine) {
      raceLogContent += buildRaceLogLineCmd(raceLogLine);
    } else {
      raceLogContent += buildRaceLogLine(raceLogLine);
    }
  }
  Object.keys(raceItes).forEach((key) => {
    if (key != "info" && key != "options" && key != "team") {
      const raceLogLine = raceItes[key];
      if ("action" in raceLogLine) {
        raceLogContent += buildRaceLogLineCmd(raceLogLine);
      } else {
        raceLogContent += buildRaceLogLine(raceLogLine);
      }
    }
  });
  const utcStyle = userPrefs.global.localTime ? "display: none;" : "";
  const utcLocalStyle = userPrefs.global.localTime ? "" : "display: none;";
  const logTxt = `
        <style>
            #UTC { ${utcStyle} }
            #UTCLocal { ${utcLocalStyle} }
        </style>
        <table>
            <thead class="sticky">${raceLogTableHeader}</thead>
            <tbody>${raceLogContent}</tbody>
        </table>`;
  document.getElementById("recordlog").innerHTML = logTxt;
  updateToggleRaceLogCommandsLines();
}
function buildRaceLogLineCmd(raceLogLine) {
  if (!raceLogLine.action)
    return "";
  return '<tr class="commandLine hovred"><td class="time">' + DateUTC(raceLogLine.iteDate, 1) + '</td><td colspan="19"><b>Command @ ' + (raceLogLine.serverTs ? DateUTC(raceLogLine.serverTs, 2) : DateUTC(raceLogLine.iteDate)) + "</b> • <b>Actions</b> → " + printLastCommand(raceLogLine.action) + "</td></tr>";
}
function printLastCommand(order) {
  let lastCommand = "";
  const action = order.action;
  if (order.type == "order") {
    lastCommand += "<span class='lastCommandOrder'>" + (action.autoTwa ? " TWA" : " HDG") + " " + roundTo(action.deg, 0) + "°</span> • ";
  } else if (order.type == "sail") {
    lastCommand += " Sail <span class='lastCommandOrder'>" + sailNames[action.sailId] + "</span>";
  } else if (order.type == "prog") {
    action.map(function(progCmd) {
      const progTime = DateUTC(progCmd.timestamp, 1);
      lastCommand += "<span class='lastCommandOrder'>" + (progCmd.autoTwa ? " TWA" : " HDG") + " " + roundTo(progCmd.deg, 0) + "°</span> @ " + progTime + " • ";
    });
  } else if (order.type == "wp") {
    action.map(function(waypoint) {
      lastCommand += " WP <span class='lastCommandOrder'>" + formatPosition(waypoint.lat, waypoint.lon) + "</span> • ";
    });
  }
  lastCommand = lastCommand.replace(/ \•([^•]*)$/, "");
  return lastCommand;
}
function buildRaceLogLine(raceIte) {
  function isDifferingSpeed(realSpeed, calculatedSpeed) {
    return Math.abs(1 - realSpeed / calculatedSpeed) > 0.01;
  }
  const iteDash = raceIte.metaDash;
  const userPrefs = getUserPrefs();
  const darkTheme = userPrefs.theme == "dark";
  if (!raceIte.tws || !iteDash)
    return "";
  let speedCStyle = "";
  let speedTStyle = "";
  let deltaDist = "";
  if ("deltaD" in iteDash && "speedC" in iteDash && "deltaD_T" in iteDash) {
    deltaDist = roundTo(iteDash.deltaD, 3);
    if (isDifferingSpeed(raceIte.speed, iteDash.speedC)) {
      speedCStyle = 'style="background-color: yellow;';
      speedCStyle += darkTheme ? ' color:black;"' : '"';
    } else if (iteDash.speedT && isDifferingSpeed(raceIte.speed)) {
      speedTStyle = 'style="background-color: ' + (darkTheme ? "darkred" : "LightRed") + ';"';
      deltaDist = deltaDist + " (" + roundTo(iteDash.deltaD_T, 3) + ")";
    }
  }
  if (iteDash.manoeuvering) {
    speedCStyle = 'style="background-color: ' + (darkTheme ? "darkred" : "LightRed") + ';"';
  }
  const sailChange = formatSeconds(raceIte.tsEndOfSailChange - raceIte.iteDate);
  const gybing = formatSeconds(raceIte.tsEndOfGybe - raceIte.iteDate);
  const tacking = formatSeconds(raceIte.tsEndOfTack - raceIte.iteDate);
  let staminaStyle = "";
  let staminaTxt = "-";
  const stamina = iteDash.realStamina;
  const paramStamina2 = getParamStamina();
  if (stamina) {
    if (stamina < (paramStamina2 == null ? void 0 : paramStamina2.tiredness[0]))
      staminaStyle = 'style="color:red"';
    else if (stamina < (paramStamina2 == null ? void 0 : paramStamina2.tiredness[1]))
      staminaStyle = 'style="color:orange"';
    else
      staminaStyle = 'style="color:green"';
    staminaTxt = roundTo(stamina, 2) + "%";
    staminaTxt += iteDash.manoeuver.staminaFactor ? " (x" + roundTo(iteDash.manoeuver.staminaFactor, 2) + ")" : "";
  }
  const xfactorStyle = getxFactorStyle(raceIte);
  let xfactorTxt = roundTo(iteDash.xfactor, 4);
  if (iteDash.sailCoverage != 0 && iteDash.xplained) {
    xfactorTxt += " " + iteDash.sailCoverage + "%";
  }
  const foilTxt = iteDash.realFoilFactor == null ? "-" : roundTo(iteDash.realFoilFactor, 0) + "%";
  return '<tr class="hovred">' + gentdRacelog("time", "time", null, "Time", DateUTC(raceIte.iteDate, 1)) + raceTableLines(raceIte, iteDash.bVmg) + infoSail(raceIte, false, false) + gentdRacelog("speed1", "reportedSpeed", null, "vR (kn)", roundTo(raceIte.speed, 3)) + gentdRacelog("speed2", "calcSpeed", speedCStyle, "vC (kn)", roundTo(iteDash.speedC, 3) + " (" + sailNames[raceIte.sail % 10] + ")") + gentdRacelog("foils", "foils", null, "Foils", foilTxt) + gentdRacelog("xfactor", "factor", xfactorStyle, "Factor", xfactorTxt) + gentdRacelog("stamina", "stamina", staminaStyle, "Stamina", stamina ? roundTo(stamina, 2) + "%" : "-") + gentdRacelog("deltaD", "deltaDistance", speedTStyle, "Δd (nm)", deltaDist) + gentdRacelog("deltaT", "deltaTime", null, "Δt (s)", roundTo(iteDash.deltaT, 0)) + gentdRacelog("position", "position", null, "Position", formatPosition(raceIte.pos.lat, raceIte.pos.lon)) + '<td class="sailPenalties" ' + getBG(iteDash.tsEndOfSailChange, raceIte.metaDash.previousIteDate) + ">" + sailChange + '</td><td class="gybe" ' + getBG(iteDash.tsEndOfGybe, iteDash.previousIteDate) + ">" + gybing + '</td><td class="tack" ' + getBG(iteDash.tsEndOfTack, iteDash.previousIteDate) + ">" + tacking + "</td></tr>";
}
function updateToggleRaceLogCommandsLines() {
  const userPrefs = getUserPrefs();
  const commandLines = document.querySelectorAll("tr.commandLine");
  commandLines.forEach(function(line, index) {
    if (userPrefs.raceLog.hideLastCmd) {
      if (index > 4) {
        line.style.display = "none";
      }
    } else {
      line.style.display = "";
    }
  });
}
let sortOrder = 0;
let sortField = "none";
const FLEET_SORT_KEY_BY_TH_ID = {
  th_lu: "lastCalcDate",
  th_name: "displayName",
  th_teamname: "teamname",
  th_rank: "rank",
  th_racetime: "raceTime",
  th_dtu: "distanceToUs",
  th_dtf: "dtf",
  th_twd: "twd",
  th_tws: "tws",
  th_twa: "twa",
  th_hdg: "heading",
  th_speed: "speed",
  th_vmg: "vmg",
  th_sail: "sail",
  th_factor: "xfactor",
  th_foils: "xoption_foils",
  th_sd: "startDate",
  th_eRT: "eRT",
  th_avgS: "avgSpeed",
  th_options: "xoption_options",
  th_state: "state"
  // pas de tri pour: th_rt, th_psn, th_remove
};
function setSortField(value) {
  sortField = value;
}
function setSortOrder(value) {
  sortOrder = value;
}
function getSortField() {
  return sortField;
}
function getSortOrder() {
  return sortOrder;
}
function isDisplayEnabled(playerIte, userId, connectPlayerId) {
  const userPrefs = getUserPrefs();
  const userFilters = userPrefs.filters;
  {
    console.groupCollapsed(`[isDisplayEnabled] Check for user ${userId}`);
    console.log("→ connectPlayerId :", connectPlayerId);
    console.log("→ playerIte :", playerIte);
    console.log("→ userFilters :", userFilters);
  }
  const conditions = {
    self: userId === connectPlayerId,
    followed: playerIte.type2 === "followed" && userFilters.friends,
    team: playerIte.type2 === "team" && userFilters.team,
    normal: playerIte.type2 === "normal" && userFilters.opponents,
    top: (playerIte.type === "top" || playerIte.type2 === "top") && userFilters.top,
    certified: playerIte.type2 === "certified" && userFilters.certified,
    real: playerIte.type2 === "real" && userFilters.real,
    sponsor: (playerIte.type === "sponsor" || playerIte.type2 === "sponsor") && userFilters.sponsors,
    selected: playerIte.choice === true && userFilters.selected,
    inRace: playerIte.state === "racing" && userFilters.inRace
  };
  const result = Object.values(conditions).some(Boolean);
  {
    Object.entries(conditions).forEach(([key, value]) => {
      console.log(`  ${key.padEnd(10)}:`, value);
    });
    console.log("✅ Result :", result);
    console.groupEnd();
  }
  return result;
}
function getFleetSortValue(pInfos, sortField2) {
  var _a, _b;
  const ite = pInfos == null ? void 0 : pInfos.ite;
  const iteDash = ite == null ? void 0 : ite.metaDash;
  switch (sortField2) {
    case "lastCalcDate":
      return (ite == null ? void 0 : ite.iteDate) ?? 0;
    case "displayName":
      return ((_a = pInfos.info) == null ? void 0 : _a.name) ?? "";
    case "teamname":
      return ((_b = pInfos.team) == null ? void 0 : _b.name) ?? "";
    case "rank":
      return (ite == null ? void 0 : ite.rank) ?? Number.POSITIVE_INFINITY;
    case "raceTime":
      return (iteDash == null ? void 0 : iteDash.raceTime) ?? Number.POSITIVE_INFINITY;
    case "distanceToUs":
      return (iteDash == null ? void 0 : iteDash.DTU) ?? Number.POSITIVE_INFINITY;
    case "dtf":
      return (iteDash == null ? void 0 : iteDash.dtf) ?? Number.POSITIVE_INFINITY;
    case "twd":
      return (ite == null ? void 0 : ite.twd) ?? (iteDash == null ? void 0 : iteDash.twd) ?? 0;
    case "tws":
      return (ite == null ? void 0 : ite.tws) ?? 0;
    case "twa":
      return Math.abs((ite == null ? void 0 : ite.twa) ?? 0);
    case "heading":
      return (ite == null ? void 0 : ite.hdg) ?? 0;
    case "speed":
      return (ite == null ? void 0 : ite.speed) ?? 0;
    case "vmg":
      return (iteDash == null ? void 0 : iteDash.vmg) ?? 0;
    case "sail":
      return (ite == null ? void 0 : ite.sail) ?? 0;
    case "xfactor":
      return (iteDash == null ? void 0 : iteDash.xfactor) ?? 0;
    case "xoption_foils":
      return (iteDash == null ? void 0 : iteDash.realFoilFactor) ?? 0;
    case "startDate":
      return (ite == null ? void 0 : ite.startDate) ?? 0;
    case "eRT":
      return (iteDash == null ? void 0 : iteDash.eRT) ?? Number.POSITIVE_INFINITY;
    case "avgSpeed":
      return (iteDash == null ? void 0 : iteDash.avgSpeed) ?? 0;
    case "xoption_options":
      return pInfos.options ? Object.keys(pInfos.options).length : 0;
    case "state":
      const order = {
        racing: 1,
        waiting: 2,
        staying: 3,
        arrived: 4
      };
      return order[ite == null ? void 0 : ite.state] ?? 999;
    default:
      return 0;
  }
}
function compareFleetPlayers(pA, pB, sortField2, sortAsc) {
  const A = getFleetSortValue(pA, sortField2);
  const B = getFleetSortValue(pB, sortField2);
  const aNull = A === null || A === void 0;
  const bNull = B === null || B === void 0;
  if (aNull && !bNull)
    return 1;
  if (!aNull && bNull)
    return -1;
  if (aNull && bNull)
    return 0;
  let cmp;
  if (typeof A === "string" || typeof B === "string") {
    cmp = String(A).localeCompare(String(B));
  } else {
    cmp = A < B ? -1 : A > B ? 1 : 0;
  }
  return sortAsc ? cmp : -cmp;
}
function buildRaceFleetHtml() {
  const raceInfo2 = getRaceInfo$1();
  const raceItes = getLegPlayerInfos();
  const raceItesFleet = getLegFleetInfos();
  const connectedPlayerId2 = getConnectedPlayerId();
  if (!raceInfo2 || (raceInfo2 == null ? void 0 : raceInfo2.length) === 0)
    return;
  if (!raceItesFleet || Object.keys(raceItesFleet).length === 0) {
    document.getElementById("friendList").innerHTML = `
            <table id="raceidTable">
            <thead><tr><th>No friend positions received yet. Please enter a race.</th></tr></thead>
            </table>`;
    return;
  }
  if (raceItes && raceItes.ites && raceItes.ites.length > 0) {
    raceItes.ite = raceItes.ites[0];
  }
  const sortField2 = getSortField();
  const sortAsc = getSortOrder();
  let raceFleetTableHeader = "<tr>" + genth("th_rt", "RT", "Call Router", void 0) + genth("th_lu", "Date" + dateUTCSmall(), void 0, sortField2 == "lastCalcDate", sortAsc) + genth("th_name", "Skipper", void 0, sortField2 == "displayName", sortAsc) + genth("th_teamname", "Team", void 0, sortField2 == "teamname", sortAsc) + genth("th_rank", "Rank", void 0, sortField2 == "rank", sortAsc) + (raceInfo2.raceType !== "record" ? genth("th_racetime", "RaceTime", "Current Race Time", sortField2 == "raceTime", sortAsc) : "") + genth("th_dtu", "DTU", "Distance to Us", sortField2 == "distanceToUs", sortAsc) + genth("th_dtf", "DTF", "Distance to Finish", sortField2 == "dtf", sortAsc) + genth("th_twd", "TWD", "True Wind Direction", sortField2 == "twd", sortAsc) + genth("th_tws", "TWS", "True Wind Speed", sortField2 == "tws", sortAsc) + genth("th_twa", "TWA", "True Wind Angle", sortField2 == "twa", sortAsc) + genth("th_hdg", "HDG", "Heading", sortField2 == "heading", sortAsc) + genth("th_speed", "Speed", "Boat Speed", sortField2 == "speed", sortAsc) + genth("th_vmg", "VMG", "Velocity Made Good", sortField2 == "vmg", sortAsc) + genth("th_sail", "Sail", "Sail Used", sortField2 == "sail", sortAsc) + genth("th_factor", "Factor", "Speed factor over no-options boat", sortField2 == "xfactor", sortAsc) + genth("th_foils", "Foils", "Boat assumed to have Foils. Unknown if no foiling conditions", sortField2 == "xoption_foils", sortAsc);
  if (raceInfo2.raceType === "record") {
    raceFleetTableHeader += genth("th_sd", "Race Time", "Current Race Time", sortField2 == "startDate", sortAsc) + genth("th_eRT", "ERT", "Estimated Total Race Time", sortField2 == "eRT", sortAsc) + genth("th_avgS", "avgS", "Average Speed", sortField2 == "avgSpeed", sortAsc);
  }
  raceFleetTableHeader += genth("th_psn", "Position", void 0) + genth("th_options", "Options", "Options according to Usercard", sortField2 == "xoption_options", sortAsc) + genth("th_state", "State", "Waiting or Staying, Racing, Arrived, Aground or Bad TWA", sortField2 == "state", sortAsc) + genth("th_remove", "", "Remove selected boats from the fleet list", void 0) + "</tr>";
  const rows = Object.entries(raceItesFleet).map(([userId, entry]) => {
    const pInfos = userId == connectedPlayerId2 ? raceItes : entry;
    return { userId, pInfos };
  });
  rows.sort((a, b) => {
    const isAme = a.userId === connectedPlayerId2;
    const isBme = b.userId === connectedPlayerId2;
    if (isAme && !isBme)
      return -1;
    if (!isAme && isBme)
      return 1;
    return compareFleetPlayers(a.pInfos, b.pInfos, sortField2, sortAsc);
  });
  let raceFleetLines = "";
  for (const { userId, pInfos } of rows) {
    raceFleetLines += buildRaceFleetLine(pInfos, raceInfo2, connectedPlayerId2);
  }
  const fleetHTML = '<table><thead class="sticky">' + raceFleetTableHeader + "</thead><tbody>" + raceFleetLines + "</tbody></table>";
  document.getElementById("friendList").innerHTML = fleetHTML;
  addEventListenersToRemoveSelectedBoatButtons();
  addEventListenersToSelectedLine();
  addEventListenersFleetSort();
}
function buildRaceFleetLine(playerFleetInfos, raceInfo2, connectedPlayerId2) {
  var _a, _b;
  if (!playerFleetInfos || !raceInfo2)
    return "";
  const playerIte = playerFleetInfos.ite;
  if (!playerIte)
    return "";
  const iteDash = playerIte.metaDash;
  if (!iteDash)
    return "";
  const userPrefs = getUserPrefs();
  const darkTheme = userPrefs.theme == "dark";
  const userId = playerIte.userId;
  const isDisplay = isDisplayEnabled(playerIte, userId, connectedPlayerId2) && (!userPrefs.filters.inRace || r.state == "racing");
  if (!isDisplay)
    return "";
  let iconState = "";
  let txtTitle = "";
  if (playerIte.state == null) {
    iconState = "";
  } else if (playerIte.state == "racing" && playerIte.speed == 0 && playerIte.twa != 0) {
    iconState = '<span style="color:Red;">&#x2B24;</span>';
    txtTitle = "AGROUND !";
  } else if (playerIte.state == "racing" && playerIte.speed != 0) {
    iconState = '<span style="color:DodgerBlue;">&#x2B24;</span>';
    txtTitle = "Racing";
  } else if (playerIte.state == "arrived") {
    iconState = '<span style="color:Lime;">&#x2B24;</span>';
    txtTitle = "Arrived";
  } else if (playerIte.state == "waiting") {
    iconState = '<span style="color:DimGray;">&#x2a02;</span>';
    txtTitle = "Waiting";
  } else if (playerIte.state == "staying") {
    iconState = '<span style="color:DimGray;">&#x2a02;</span>';
    txtTitle = "Staying";
  } else {
    iconState = "-";
  }
  let bull = "";
  if (getLegSelectedPlayersState(userId)) {
    bull = '<span style="color:HotPink;font-size:16px;"><b>&#9679;</b></span>';
  }
  if (playerIte.team == true) {
    bull += '<span style="color:Red;font-size:16px;"><b>&#9679;</b></span>';
  }
  if (playerIte.followed == true || playerIte.isFollowed == true) {
    bull += '<span style="color:LimeGreen;font-size:16px;"><b>&#9679</b></span>';
  } else if (playerIte.type == "real") {
    bull = '<span style="color:Chocolate;font-size:16px;"><b>&#9679;</b></span>';
  } else {
    bull += '<span style="color:LightGrey;font-size:16px;"><b>&#9679;</b></span>';
  }
  if (playerIte.type == "top") {
    bull += '<span style="color:GoldenRod;font-size:16px;"><b>&#9679;</b></span>';
  }
  if (playerIte.type == "certified") {
    bull += '<span style="color:DodgerBlue;font-size:16px;"><b>&#9679;</b></span>';
  }
  if (playerIte.type == "sponsor") {
    bull += '<span style="color:DarkSlateBlue;font-size:16px;"><b>&#9679;</b></span>';
  }
  if (userId == connectedPlayerId2) {
    bull = "<span>&#11088</span>";
  }
  const teamName = ((_a = playerFleetInfos.team) == null ? void 0 : _a.id) ? playerFleetInfos.team.name : "";
  const xfactorStyle = iteDash ? getxFactorStyle(playerIte) : "";
  let xfactorTxt = "-";
  if (iteDash) {
    xfactorTxt = roundTo(iteDash.xfactor, 4);
    if (iteDash.sailCoverage != 0 && iteDash.xplained) {
      xfactorTxt += " " + iteDash.sailCoverage + "%";
    }
  }
  const isTWAMode = playerIte.isRegulated;
  let lock = "";
  if (isTWAMode == false)
    lock = "<span title='TWA Unlocked' class='cursorHelp'>&#x25EF;</span>";
  else if (isTWAMode == true)
    lock = "<span title='TWA Locked' class='cursorHelp'>&#x24B6;</span>";
  const twaFG = 'style="color: ' + (playerIte.twa < 0 ? "red" : "green") + ';"';
  const hdgFG = isTWAMode ? darkTheme ? "white" : "black" : darkTheme ? "darkcyan" : "blue";
  const hdgBold = isTWAMode ? "font-weight: normal;" : "font-weight: bold;";
  const { optionsTxt, optionsTitle, optionsStyle, foilsType } = drawOptions(playerFleetInfos.options);
  let routerIcon = "&nbsp;";
  if (userPrefs.router.sel = "zezo")
    if (raceInfo2.zezoUrl)
      routerIcon = '<span id="rt:' + userId + '">&#x2388;</span>';
    else
      routerIcon = '<span id="vrz:' + userId + '">&#x262F;</span>';
  const nameClass = userId == connectedPlayerId2 ? "highlightMe" : "";
  const categoryIdx = category.indexOf(playerIte.type);
  const nameStyle = userId == connectedPlayerId2 ? "color: #b86dff; font-weight: bold; " : "color:" + (darkTheme ? categoryStyleDark[categoryIdx].nameStyle : categoryStyle[categoryIdx].nameStyle) + ";";
  const autoSail = playerIte.sail > 10 ? "<span title='Auto Sails' class='cursorHelp'>&#x24B6;</span>" : "";
  const name = playerIte.type == "sponsor" ? ((_b = playerIte.branding) == null ? void 0 : _b.name) ? playerFleetInfos.info.name + "(" + playerIte.branding.name + ")" : playerFleetInfos.info.name : playerFleetInfos.info.name;
  const sailStyle = 'style="color:' + sailColors[playerIte.sail] + '"';
  const sailName = sailNames[playerIte.sail % 10] || "-";
  const foils = (iteDash == null ? void 0 : iteDash.realFoilFactor) == null ? foilsType ? "no" : "?" : roundTo(iteDash.realFoilFactor, 1) + "%";
  return '<tr class="' + nameClass + ' hovred" id="ui:' + userId + '"><td class="tdc">' + routerIcon + "</td>" + gentd("Time", "", null, formatTime(playerIte.iteDate, 1)) + '<td class="Skipper" style="' + nameStyle + '"><div class="bull">' + bull + "</div> " + name + "</td>" + gentd("Team", "", null, teamName) + gentd("Rank", "", null, playerIte.rank ? playerIte.rank : "-") + (raceInfo2.raceType !== "record" ? gentd("RaceTime", "", null, iteDash.raceTime ? formatDHMS(iteDash.raceTime) : "-") : "") + gentd("DTU", "", null, iteDash.DTU ? roundTo(iteDash.DTU, 3) : "-") + gentd("DTF", "", null, iteDash.dtf == iteDash.dtfC ? "(" + roundTo(iteDash.dtfC, 3) + ")" : roundTo(iteDash.dtf, 3)) + gentd("TWD", "", null, roundTo(playerIte.twd ? playerIte.twd : iteDash.twd, 3)) + gentd("TWS", "", null, roundTo(playerIte.tws, 3)) + gentd("TWA", twaFG, null, roundTo(Math.abs(playerIte.twa), 3)) + gentd("TWAIcon", 'style="color:grey; align:center; text-align:center;"', null, lock) + gentd("HDG", 'style="color:' + hdgFG + '";"' + hdgBold, null, roundTo(playerIte.hdg, 3)) + gentd("Speed", "", null, roundTo(playerIte.speed, 3)) + gentd("VMG", "", null, roundTo(iteDash.vmg, 3)) + gentd("Sail", "", null, "<span " + sailStyle + ">&#x25e2&#x25e3  </span>" + sailName) + gentd("SailIcon", 'style="color:grey; align:center; text-align:center;"', null, autoSail) + gentd("Factor", xfactorStyle, null, xfactorTxt) + gentd("Foils", "", null, foils) + recordRaceFields(raceInfo2, playerIte) + gentd("Position", "", null, playerIte.pos ? formatPosition(playerIte.pos.lat, playerIte.pos.lon) : "-") + gentd("Options", optionsStyle, optionsTitle, optionsTxt) + gentd("State", "", txtTitle, iconState) + gentd("Remove", "", null, getLegSelectedPlayersState(userId) && userId != connectedPlayerId2 ? '<span class="removeSelectedBoat" data-id="' + userId + '" title="Remove this boat: ' + name + '">❌</span>' : "") + "</tr>";
}
function recordRaceFields(raceInfo2, playerIte) {
  const userPrefs = getUserPrefs();
  if (raceInfo2.raceType === "record") {
    const localTimes = userPrefs.global.localTime;
    if (playerIte.state === "racing" && playerIte.distanceToEnd) {
      let t;
      if (playerIte.metaDash.eRT)
        t = '<td class="eRT" title= "End : ' + formatShortDate(playerIte.metaDash.eRT, void 0, localTimes) + '">' + formatDHMS(playerIte.metaDash.eRT) + "</td>";
      else
        t = '<td class="eRT" title= "End : unknow"></td>';
      return '<td class="eRT" title= "Start : ' + formatShortDate(playerIte.startDate, void 0, localTimes) + '">' + formatDHMS(playerIte.metaDash.raceTime) + "</td>" + t + '<td class="avg">' + roundTo(playerIte.metaDash.avgSpeed, 2) + "</td>";
    } else {
      if (playerIte.startDate && playerIte.state === "racing" && playerIte.startDate != "-") {
        let retVal = '<td class="eRT" title= "Start : ' + formatShortDate(playerIte.startDate, void 0, localTimes) + '">' + formatDHMS(playerIte.metaDash.raceTime) + "</td>";
        retVal += '<td class="eRT"> - </td><td class="avg"> - </td>';
        return retVal;
      } else
        return '<td class="eRT"> - </td><td class="eRT"> - </td><td class="avg"> - </td>';
    }
  } else {
    return "";
  }
}
function drawOptions(playerOptions) {
  const userPrefs = getUserPrefs();
  let optionsTxt = "";
  let optionsStyle = "";
  let optionsTitle = "";
  let foilsType = false;
  if (!playerOptions)
    return { optionsTxt: "", optionsTitle: "", optionsStyle: "", foilsType: false };
  let optSail = "";
  let optPerf = "";
  if (playerOptions.options) {
    const pOptions = playerOptions.options;
    if (pOptions.light || pOptions.reach || pOptions.heavy)
      optSail = "[";
    if (pOptions.reach)
      optSail += "reach,";
    if (pOptions.light)
      optSail += "light,";
    if (pOptions.heavy)
      optSail += "heavy,";
    if (pOptions.foil || pOptions.winch || pOptions.hull || pOptions.comfortLoungePug || pOptions.magicFurler || pOptions.vrtexJacket)
      optPerf = "[";
    if (pOptions.winch)
      optPerf += "winch,";
    if (pOptions.foil) {
      optPerf += "foil,";
      foilsType = true;
    }
    if (pOptions.hull)
      optPerf += "hull,";
    if (pOptions.comfortLoungePug)
      optPerf += "comfortLoungePug,";
    if (pOptions.magicFurler)
      optPerf += "magicFurler,";
    if (pOptions.vrtexJacket)
      optPerf += "vrtexJacket,";
  } else if (playerOptions.guessOptions && playerOptions.guessOptions != 0) {
    const pOptions = playerOptions.guessOptions;
    if (isBitSet(pOptions, guessOptionBits["reach"]) || isBitSet(pOptions, guessOptionBits["light"]) || isBitSet(pOptions, guessOptionBits["heavy"]))
      optSail = "[";
    if (isBitSet(pOptions, guessOptionBits["reach"]))
      optSail += "reach,";
    if (isBitSet(pOptions, guessOptionBits["light"]))
      optSail += "light,";
    if (isBitSet(pOptions, guessOptionBits["heavy"]))
      optSail += "heavy,";
    if (isBitSet(pOptions, guessOptionBits["winchDetected"]) && isBitSet(pOptions, guessOptionBits["winch"]) || isBitSet(pOptions, guessOptionBits["foilDetected"]) && isBitSet(pOptions, guessOptionBits["foil"]) || isBitSet(pOptions, guessOptionBits["hullDetected"]) && isBitSet(pOptions, guessOptionBits["hull"]))
      optPerf = "[";
    if (isBitSet(pOptions, guessOptionBits["winchDetected"]) && isBitSet(pOptions, guessOptionBits["winch"]))
      optPerf += "winch,";
    if (isBitSet(pOptions, guessOptionBits["foilDetected"]) && isBitSet(pOptions, guessOptionBits["foil"])) {
      optPerf += "foil,";
      foilsType = true;
    }
    if (isBitSet(pOptions, guessOptionBits["hullDetected"]) && isBitSet(pOptions, guessOptionBits["hull"]))
      optPerf += "hull,";
    optionsStyle = 'style="font-style: italic;"';
  }
  if (optSail.length != 0) {
    optSail = optSail.substring(0, optSail.length - 1);
    optSail += "]";
  }
  if (optPerf.length != 0) {
    optPerf = optPerf.substring(0, optPerf.length - 1);
    optPerf += "]";
  }
  if (optSail.length != 0 && optPerf.length != 0)
    optionsTxt = optSail + " " + optPerf;
  else if (optSail.length != 0 && optPerf.length == 0)
    optionsTxt = optSail;
  else if (optSail.length == 0 && optPerf.length != 0)
    optionsTxt = optPerf;
  else if (!playerOptions.guessOptions || playerOptions.guessOptions == 0)
    optionsTxt = "?";
  optionsTitle = optionsTxt;
  if (userPrefs.fleet.shortOption) {
    optionsTxt = optionsTxt.replace("All Options", "AO");
    optionsTxt = optionsTxt.replace("Full Pack", "FP");
    optionsTxt = optionsTxt.replace("reach", "R");
    optionsTxt = optionsTxt.replace("light", "L");
    optionsTxt = optionsTxt.replace("heavy", "H");
    optionsTxt = optionsTxt.replace("winch", "W");
    optionsTxt = optionsTxt.replace("foil", "F");
    optionsTxt = optionsTxt.replace("hull", "h");
    optionsTxt = optionsTxt.replace("magicFurler", "M");
    optionsTxt = optionsTxt.replace("vrtexJacket", "J");
    optionsTxt = optionsTxt.replace("comfortLoungePug", "C");
  }
  return { optionsTxt, optionsTitle, optionsStyle, foilsType };
}
function addEventListenersToRemoveSelectedBoatButtons() {
  document.querySelectorAll(".removeSelectedBoat").forEach(function(e) {
    e.addEventListener("click", function() {
      const boatId = this.getAttribute("data-id");
      setLegSelectedPlayers(boatId, false);
      buildRaceFleetHtml();
    });
  });
}
function addEventListenersToSelectedLine() {
  document.querySelectorAll("tr.hovred").forEach(function(row) {
    row.addEventListener("click", function() {
      row.classList.add("selectedLine");
      let siblings = Array.from(row.parentNode.children).filter(function(child) {
        return child !== row && child.classList.contains("hovred");
      });
      siblings.forEach(function(sibling) {
        sibling.classList.remove("selectedLine");
      });
    });
  });
}
function addEventListenersFleetSort() {
  const friendList = document.getElementById("friendList");
  if (!friendList)
    return;
  const header = friendList.querySelector("thead");
  if (!header)
    return;
  header.addEventListener("click", (event) => {
    const th = event.target.closest("th");
    if (!th || !th.id)
      return;
    const sortKey = FLEET_SORT_KEY_BY_TH_ID[th.id];
    if (!sortKey) {
      return;
    }
    if (getSortField() === sortKey) {
      setSortOrder(!getSortOrder());
    } else {
      setSortField(sortKey);
      setSortOrder(true);
    }
    buildRaceFleetHtml();
  });
}
function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k === "class")
      el.className = v;
    else if (k === "dataset")
      Object.assign(el.dataset, v);
    else if (k === "style")
      Object.assign(el.style, v);
    else if (k === "on")
      for (const [ev, fn] of Object.entries(v))
        el.addEventListener(ev, fn);
    else if (v !== void 0 && v !== null)
      el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    el.append(c instanceof Node ? c : document.createTextNode(c ?? ""));
  }
  return el;
}
const frag = (...nodes) => nodes.reduce((f, n) => (f.append(n), f), document.createDocumentFragment());
const optionKeys = [
  ["foil", "Foils"],
  ["winch", "Winch"],
  ["hull", "Hull"],
  ["light", "Light"],
  ["reach", "Reach"],
  ["heavy", "Heavy"],
  ["radio", "Radio"],
  ["magicFurler", "Magic Furler"],
  ["comfortLoungePug", "Comfort Lounge"],
  ["vrtexJacket", "VRTex Jacket"]
];
function isTaken(playerOptions, key) {
  return !!(playerOptions && playerOptions[key] === true);
}
function totalOptionCredits(raceInfo2, playerOptions) {
  let sum = 0;
  if (!(raceInfo2 == null ? void 0 : raceInfo2.optionPrices))
    return sum;
  for (const [k] of optionKeys)
    if (isTaken(playerOptions, k))
      sum += raceInfo2.optionPrices[k] || 0;
  return sum;
}
function card(title, bodyNodes, { icon = null } = {}) {
  return h(
    "section",
    { class: "card" },
    h(
      "div",
      { class: "card-header" },
      icon ? h("span", { class: "badge" }, icon) : null,
      h("h3", null, title)
    ),
    h("div", { class: "card-body" }, ...Array.isArray(bodyNodes) ? bodyNodes : [bodyNodes])
  );
}
function tableModern({ head = [], rows = [] }) {
  const thead = h("thead", null, h("tr", null, ...head.map((t) => h("th", null, t))));
  const tbody = h("tbody", null, ...rows.map((r2) => h("tr", null, ...r2.map((c, i) => h("td", { class: i.className || "" }, c)))));
  return h("div", { class: "table-wrap" }, h("table", { class: "table-modern" }, thead, tbody));
}
function viewIdentity(raceInfo2, playerOptions) {
  const rid = raceInfo2.raceId + "_" + raceInfo2.legNum;
  const img = h("img", { src: `https://static.virtualregatta.com/offshore/leg/${rid}.jpg`, style: { height: "48px", borderRadius: "8px" } });
  const badge = h("span", { class: "badge" }, img, "Race");
  const grid = h(
    "div",
    { class: "kv" },
    h("div", { class: "k" }, "Race Name (Id)"),
    h("div", { class: "v" }, `${raceInfo2.legName} (${rid})`),
    h("div", { class: "k" }, "Boat Name"),
    h("div", { class: "v" }, raceInfo2.boatName ?? "-"),
    h("div", { class: "k" }, "Wind Model"),
    h("div", { class: "v" }, `GFS ${raceInfo2.fineWinds ? "0.25" : "1.0"}°`),
    h("div", { class: "k" }, "VSR Level"),
    h("div", { class: "v" }, `VSR${raceInfo2.vsrLevel}`),
    h("div", { class: "k" }, "Price"),
    h("div", { class: "v" }, `Cat. ${raceInfo2.priceLevel}`),
    h("div", { class: "k" }, "Category"),
    h("div", { class: "v" }, getRankingCategory(playerOptions == null ? void 0 : playerOptions.options))
  );
  return card("Race Details", [h("div", { class: "chips" }, badge), grid]);
}
function viewCredits(raceInfo2, playerIte) {
  var _a, _b, _c, _d;
  const awarded = (playerIte == null ? void 0 : playerIte.rank) > 0 ? Math.round(creditsMaxAwardedByPriceLevel[raceInfo2.priceLevel - 1] / Math.pow(playerIte.rank, 0.4)) : "-";
  const head = [
    "Game Credits",
    "Free Credits",
    "Current Race Credits (Total Options)",
    "Gains",
    ...optionKeys.map(([, label]) => label)
  ];
  const takenTotal = totalOptionCredits(raceInfo2, (_a = playerIte == null ? void 0 : playerIte.options) == null ? void 0 : _a.options);
  const takenCells = optionKeys.map(([k]) => {
    var _a2;
    const takenStyle = isTaken((_a2 = playerIte == null ? void 0 : playerIte.options) == null ? void 0 : _a2.options, k) ? { outline: "2px solid #25d366" } : {};
    return h("span", { class: "chip", style: takenStyle }, String((raceInfo2 == null ? void 0 : raceInfo2.optionPrices[k]) ?? "-"));
  });
  const rows = [[
    String(((_b = playerIte == null ? void 0 : playerIte.info) == null ? void 0 : _b.credits) ?? "-"),
    String(raceInfo2.freeCredits ?? "-"),
    `${((_c = playerIte == null ? void 0 : playerIte.info) == null ? void 0 : _c.credits) || ((_d = playerIte == null ? void 0 : playerIte.info) == null ? void 0 : _d.credits) === 0 ? playerIte.info.credits : "???"}  `,
    String(awarded),
    ...takenCells
  ]];
  rows[0][2] = frag(
    h("span", null, rows[0][2]),
    " ",
    h("span", { class: "chip", style: { borderColor: "tomato", color: "tomato" } }, `(-${takenTotal})`)
  );
  return card("Credits (Option équipée)", tableModern({ head, rows }));
}
function viewStages(raceInfo2, playerIte) {
  var _a, _b, _c, _d;
  const userPrefs = getUserPrefs();
  const head = ["Type", "Name", "Id", "Position", "Position2", "Status"];
  const rows = [];
  rows.push([
    "🚩 Start",
    ((_a = raceInfo2.start) == null ? void 0 : _a.name) ?? "-",
    "Start",
    formatPosition(raceInfo2.start.lat, raceInfo2.start.lon),
    true,
    frag("Date : ", h("span", { class: "pill pill--muted" }, DateUTC(raceInfo2.start.date, 1, userPrefs.global.localTime ? 3 : 4)))
  ]);
  if (Array.isArray(raceInfo2.checkpoints)) {
    for (const cp of raceInfo2.checkpoints) {
      let cpName = cp.display && cp.display !== "none" ? cp.display : "Invisible";
      cpName = cpName.charAt(0).toUpperCase() + cpName.slice(1);
      if (cpName === "Buoy")
        cpName = "🏳️ " + cpName;
      const passed = ((_b = playerIte == null ? void 0 : playerIte.ites[0]) == null ? void 0 : _b.gateGroupCounters) && playerIte.ites[0].gateGroupCounters[cp.group - 1] ? h("span", { class: "pill pill--ok" }, "Passed") : " - ";
      rows.push([
        cpName,
        cp.name ?? "",
        `${cp.group}.${cp.id}`,
        formatPosition(cp.start.lat, cp.start.lon),
        cp.end ? formatPosition(cp.end.lat, cp.end.lon) : " - ",
        passed
      ]);
    }
  }
  rows.push([
    "🏁 End",
    ((_c = raceInfo2.end) == null ? void 0 : _c.name) ?? "-",
    "End",
    formatPosition(raceInfo2.end.lat, raceInfo2.end.lon),
    ((_d = raceInfo2.end) == null ? void 0 : _d.radius) ? `Radius : ${raceInfo2.end.radius} mn` : " - ",
    frag("Date : ", h("span", { class: "pill pill--muted" }, DateUTC(raceInfo2.end.date, 1, userPrefs.global.localTime ? 3 : 4)))
  ]);
  return card("Race Stages", tableModern({ head, rows }));
}
function viewIceLimits(raceInfo2) {
  var _a;
  const south = (_a = raceInfo2 == null ? void 0 : raceInfo2.ice_limits) == null ? void 0 : _a.south;
  if (!Array.isArray(south) || south.length === 0)
    return null;
  const isDummy = south.length === 5 && south[0].lat === -90 && south[0].lon === -180 && south[2].lat === -90 && south[2].lon === 0 && south[4].lat === -90 && south[4].lon === 180;
  if (isDummy)
    return null;
  const head = ["Section", "Position", "Position2"];
  const rows = [];
  for (let i = 1; i < south.length; i++) {
    rows.push([
      `Section ${i + 1}`,
      formatPosition(south[i - 1].lat, south[i - 1].lon),
      formatPosition(south[i].lat, south[i].lon)
    ]);
  }
  return card("Limites des glaces", tableModern({ head, rows }));
}
function viewRestrictedZones(raceInfo2) {
  const rz = raceInfo2 == null ? void 0 : raceInfo2.restrictedZones;
  if (!Array.isArray(rz) || rz.length === 0)
    return null;
  const head = ["Nom", "Position"];
  const rows = [];
  for (const z of rz) {
    const name = z.name ?? "—";
    for (const p of z.vertices || []) {
      rows.push([name, formatPosition(p.lat, p.lon)]);
    }
  }
  return card("Zones interdites", tableModern({ head, rows }));
}
function buildRaceBookHtml() {
  var _a;
  const host = document.getElementById("raceBook");
  if (!host)
    return;
  const raceInfo2 = getRaceInfo$1();
  const playerIte = getLegPlayerInfos();
  if (!raceInfo2 || (raceInfo2 == null ? void 0 : raceInfo2.length) == 0) {
    host.replaceChildren(
      card("Race Details", h("div", { class: "centered" }, "No data available. Please enter a race."))
    );
    return;
  }
  const identity = viewIdentity(raceInfo2, (_a = playerIte == null ? void 0 : playerIte.options) == null ? void 0 : _a.options);
  const credits = viewCredits(raceInfo2, playerIte);
  const stages = viewStages(raceInfo2, playerIte);
  const ice = viewIceLimits(raceInfo2);
  const rz = viewRestrictedZones(raceInfo2);
  const gridTop = h("div", { class: "rb-grid" }, identity, credits);
  host.replaceChildren(
    gridTop,
    stages,
    ice || document.createComment("no ice limits"),
    rz || document.createComment("no restricted zones")
  );
}
var leafletSrc = { exports: {} };
/* @preserve
 * Leaflet 1.9.4, a JS library for interactive maps. https://leafletjs.com
 * (c) 2010-2023 Vladimir Agafonkin, (c) 2010-2011 CloudMade
 */
var hasRequiredLeafletSrc;
function requireLeafletSrc() {
  if (hasRequiredLeafletSrc)
    return leafletSrc.exports;
  hasRequiredLeafletSrc = 1;
  (function(module, exports) {
    (function(global, factory) {
      factory(exports);
    })(commonjsGlobal, function(exports2) {
      var version = "1.9.4";
      function extend(dest) {
        var i, j, len, src;
        for (j = 1, len = arguments.length; j < len; j++) {
          src = arguments[j];
          for (i in src) {
            dest[i] = src[i];
          }
        }
        return dest;
      }
      var create$2 = Object.create || function() {
        function F() {
        }
        return function(proto) {
          F.prototype = proto;
          return new F();
        };
      }();
      function bind(fn, obj) {
        var slice = Array.prototype.slice;
        if (fn.bind) {
          return fn.bind.apply(fn, slice.call(arguments, 1));
        }
        var args = slice.call(arguments, 2);
        return function() {
          return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
        };
      }
      var lastId = 0;
      function stamp(obj) {
        if (!("_leaflet_id" in obj)) {
          obj["_leaflet_id"] = ++lastId;
        }
        return obj._leaflet_id;
      }
      function throttle(fn, time, context) {
        var lock, args, wrapperFn, later;
        later = function() {
          lock = false;
          if (args) {
            wrapperFn.apply(context, args);
            args = false;
          }
        };
        wrapperFn = function() {
          if (lock) {
            args = arguments;
          } else {
            fn.apply(context, arguments);
            setTimeout(later, time);
            lock = true;
          }
        };
        return wrapperFn;
      }
      function wrapNum(x, range, includeMax) {
        var max = range[1], min = range[0], d = max - min;
        return x === max && includeMax ? x : ((x - min) % d + d) % d + min;
      }
      function falseFn() {
        return false;
      }
      function formatNum(num, precision) {
        if (precision === false) {
          return num;
        }
        var pow = Math.pow(10, precision === void 0 ? 6 : precision);
        return Math.round(num * pow) / pow;
      }
      function trim(str) {
        return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, "");
      }
      function splitWords(str) {
        return trim(str).split(/\s+/);
      }
      function setOptions(obj, options) {
        if (!Object.prototype.hasOwnProperty.call(obj, "options")) {
          obj.options = obj.options ? create$2(obj.options) : {};
        }
        for (var i in options) {
          obj.options[i] = options[i];
        }
        return obj.options;
      }
      function getParamString(obj, existingUrl, uppercase) {
        var params = [];
        for (var i in obj) {
          params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + "=" + encodeURIComponent(obj[i]));
        }
        return (!existingUrl || existingUrl.indexOf("?") === -1 ? "?" : "&") + params.join("&");
      }
      var templateRe = /\{ *([\w_ -]+) *\}/g;
      function template(str, data) {
        return str.replace(templateRe, function(str2, key) {
          var value = data[key];
          if (value === void 0) {
            throw new Error("No value provided for variable " + str2);
          } else if (typeof value === "function") {
            value = value(data);
          }
          return value;
        });
      }
      var isArray = Array.isArray || function(obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
      };
      function indexOf(array, el) {
        for (var i = 0; i < array.length; i++) {
          if (array[i] === el) {
            return i;
          }
        }
        return -1;
      }
      var emptyImageUrl = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
      function getPrefixed(name) {
        return window["webkit" + name] || window["moz" + name] || window["ms" + name];
      }
      var lastTime = 0;
      function timeoutDefer(fn) {
        var time = +/* @__PURE__ */ new Date(), timeToCall = Math.max(0, 16 - (time - lastTime));
        lastTime = time + timeToCall;
        return window.setTimeout(fn, timeToCall);
      }
      var requestFn = window.requestAnimationFrame || getPrefixed("RequestAnimationFrame") || timeoutDefer;
      var cancelFn = window.cancelAnimationFrame || getPrefixed("CancelAnimationFrame") || getPrefixed("CancelRequestAnimationFrame") || function(id) {
        window.clearTimeout(id);
      };
      function requestAnimFrame(fn, context, immediate) {
        if (immediate && requestFn === timeoutDefer) {
          fn.call(context);
        } else {
          return requestFn.call(window, bind(fn, context));
        }
      }
      function cancelAnimFrame(id) {
        if (id) {
          cancelFn.call(window, id);
        }
      }
      var Util2 = {
        __proto__: null,
        extend,
        create: create$2,
        bind,
        get lastId() {
          return lastId;
        },
        stamp,
        throttle,
        wrapNum,
        falseFn,
        formatNum,
        trim,
        splitWords,
        setOptions,
        getParamString,
        template,
        isArray,
        indexOf,
        emptyImageUrl,
        requestFn,
        cancelFn,
        requestAnimFrame,
        cancelAnimFrame
      };
      function Class() {
      }
      Class.extend = function(props) {
        var NewClass = function() {
          setOptions(this);
          if (this.initialize) {
            this.initialize.apply(this, arguments);
          }
          this.callInitHooks();
        };
        var parentProto = NewClass.__super__ = this.prototype;
        var proto = create$2(parentProto);
        proto.constructor = NewClass;
        NewClass.prototype = proto;
        for (var i in this) {
          if (Object.prototype.hasOwnProperty.call(this, i) && i !== "prototype" && i !== "__super__") {
            NewClass[i] = this[i];
          }
        }
        if (props.statics) {
          extend(NewClass, props.statics);
        }
        if (props.includes) {
          checkDeprecatedMixinEvents(props.includes);
          extend.apply(null, [proto].concat(props.includes));
        }
        extend(proto, props);
        delete proto.statics;
        delete proto.includes;
        if (proto.options) {
          proto.options = parentProto.options ? create$2(parentProto.options) : {};
          extend(proto.options, props.options);
        }
        proto._initHooks = [];
        proto.callInitHooks = function() {
          if (this._initHooksCalled) {
            return;
          }
          if (parentProto.callInitHooks) {
            parentProto.callInitHooks.call(this);
          }
          this._initHooksCalled = true;
          for (var i2 = 0, len = proto._initHooks.length; i2 < len; i2++) {
            proto._initHooks[i2].call(this);
          }
        };
        return NewClass;
      };
      Class.include = function(props) {
        var parentOptions = this.prototype.options;
        extend(this.prototype, props);
        if (props.options) {
          this.prototype.options = parentOptions;
          this.mergeOptions(props.options);
        }
        return this;
      };
      Class.mergeOptions = function(options) {
        extend(this.prototype.options, options);
        return this;
      };
      Class.addInitHook = function(fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        var init = typeof fn === "function" ? fn : function() {
          this[fn].apply(this, args);
        };
        this.prototype._initHooks = this.prototype._initHooks || [];
        this.prototype._initHooks.push(init);
        return this;
      };
      function checkDeprecatedMixinEvents(includes) {
        if (typeof L === "undefined" || !L || !L.Mixin) {
          return;
        }
        includes = isArray(includes) ? includes : [includes];
        for (var i = 0; i < includes.length; i++) {
          if (includes[i] === L.Mixin.Events) {
            console.warn("Deprecated include of L.Mixin.Events: this property will be removed in future releases, please inherit from L.Evented instead.", new Error().stack);
          }
        }
      }
      var Events = {
        /* @method on(type: String, fn: Function, context?: Object): this
         * Adds a listener function (`fn`) to a particular event type of the object. You can optionally specify the context of the listener (object the this keyword will point to). You can also pass several space-separated types (e.g. `'click dblclick'`).
         *
         * @alternative
         * @method on(eventMap: Object): this
         * Adds a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`
         */
        on: function(types, fn, context) {
          if (typeof types === "object") {
            for (var type in types) {
              this._on(type, types[type], fn);
            }
          } else {
            types = splitWords(types);
            for (var i = 0, len = types.length; i < len; i++) {
              this._on(types[i], fn, context);
            }
          }
          return this;
        },
        /* @method off(type: String, fn?: Function, context?: Object): this
         * Removes a previously added listener function. If no function is specified, it will remove all the listeners of that particular event from the object. Note that if you passed a custom context to `on`, you must pass the same context to `off` in order to remove the listener.
         *
         * @alternative
         * @method off(eventMap: Object): this
         * Removes a set of type/listener pairs.
         *
         * @alternative
         * @method off: this
         * Removes all listeners to all events on the object. This includes implicitly attached events.
         */
        off: function(types, fn, context) {
          if (!arguments.length) {
            delete this._events;
          } else if (typeof types === "object") {
            for (var type in types) {
              this._off(type, types[type], fn);
            }
          } else {
            types = splitWords(types);
            var removeAll = arguments.length === 1;
            for (var i = 0, len = types.length; i < len; i++) {
              if (removeAll) {
                this._off(types[i]);
              } else {
                this._off(types[i], fn, context);
              }
            }
          }
          return this;
        },
        // attach listener (without syntactic sugar now)
        _on: function(type, fn, context, _once) {
          if (typeof fn !== "function") {
            console.warn("wrong listener type: " + typeof fn);
            return;
          }
          if (this._listens(type, fn, context) !== false) {
            return;
          }
          if (context === this) {
            context = void 0;
          }
          var newListener = { fn, ctx: context };
          if (_once) {
            newListener.once = true;
          }
          this._events = this._events || {};
          this._events[type] = this._events[type] || [];
          this._events[type].push(newListener);
        },
        _off: function(type, fn, context) {
          var listeners, i, len;
          if (!this._events) {
            return;
          }
          listeners = this._events[type];
          if (!listeners) {
            return;
          }
          if (arguments.length === 1) {
            if (this._firingCount) {
              for (i = 0, len = listeners.length; i < len; i++) {
                listeners[i].fn = falseFn;
              }
            }
            delete this._events[type];
            return;
          }
          if (typeof fn !== "function") {
            console.warn("wrong listener type: " + typeof fn);
            return;
          }
          var index2 = this._listens(type, fn, context);
          if (index2 !== false) {
            var listener = listeners[index2];
            if (this._firingCount) {
              listener.fn = falseFn;
              this._events[type] = listeners = listeners.slice();
            }
            listeners.splice(index2, 1);
          }
        },
        // @method fire(type: String, data?: Object, propagate?: Boolean): this
        // Fires an event of the specified type. You can optionally provide a data
        // object — the first argument of the listener function will contain its
        // properties. The event can optionally be propagated to event parents.
        fire: function(type, data, propagate) {
          if (!this.listens(type, propagate)) {
            return this;
          }
          var event = extend({}, data, {
            type,
            target: this,
            sourceTarget: data && data.sourceTarget || this
          });
          if (this._events) {
            var listeners = this._events[type];
            if (listeners) {
              this._firingCount = this._firingCount + 1 || 1;
              for (var i = 0, len = listeners.length; i < len; i++) {
                var l = listeners[i];
                var fn = l.fn;
                if (l.once) {
                  this.off(type, fn, l.ctx);
                }
                fn.call(l.ctx || this, event);
              }
              this._firingCount--;
            }
          }
          if (propagate) {
            this._propagateEvent(event);
          }
          return this;
        },
        // @method listens(type: String, propagate?: Boolean): Boolean
        // @method listens(type: String, fn: Function, context?: Object, propagate?: Boolean): Boolean
        // Returns `true` if a particular event type has any listeners attached to it.
        // The verification can optionally be propagated, it will return `true` if parents have the listener attached to it.
        listens: function(type, fn, context, propagate) {
          if (typeof type !== "string") {
            console.warn('"string" type argument expected');
          }
          var _fn = fn;
          if (typeof fn !== "function") {
            propagate = !!fn;
            _fn = void 0;
            context = void 0;
          }
          var listeners = this._events && this._events[type];
          if (listeners && listeners.length) {
            if (this._listens(type, _fn, context) !== false) {
              return true;
            }
          }
          if (propagate) {
            for (var id in this._eventParents) {
              if (this._eventParents[id].listens(type, fn, context, propagate)) {
                return true;
              }
            }
          }
          return false;
        },
        // returns the index (number) or false
        _listens: function(type, fn, context) {
          if (!this._events) {
            return false;
          }
          var listeners = this._events[type] || [];
          if (!fn) {
            return !!listeners.length;
          }
          if (context === this) {
            context = void 0;
          }
          for (var i = 0, len = listeners.length; i < len; i++) {
            if (listeners[i].fn === fn && listeners[i].ctx === context) {
              return i;
            }
          }
          return false;
        },
        // @method once(…): this
        // Behaves as [`on(…)`](#evented-on), except the listener will only get fired once and then removed.
        once: function(types, fn, context) {
          if (typeof types === "object") {
            for (var type in types) {
              this._on(type, types[type], fn, true);
            }
          } else {
            types = splitWords(types);
            for (var i = 0, len = types.length; i < len; i++) {
              this._on(types[i], fn, context, true);
            }
          }
          return this;
        },
        // @method addEventParent(obj: Evented): this
        // Adds an event parent - an `Evented` that will receive propagated events
        addEventParent: function(obj) {
          this._eventParents = this._eventParents || {};
          this._eventParents[stamp(obj)] = obj;
          return this;
        },
        // @method removeEventParent(obj: Evented): this
        // Removes an event parent, so it will stop receiving propagated events
        removeEventParent: function(obj) {
          if (this._eventParents) {
            delete this._eventParents[stamp(obj)];
          }
          return this;
        },
        _propagateEvent: function(e) {
          for (var id in this._eventParents) {
            this._eventParents[id].fire(e.type, extend({
              layer: e.target,
              propagatedFrom: e.target
            }, e), true);
          }
        }
      };
      Events.addEventListener = Events.on;
      Events.removeEventListener = Events.clearAllEventListeners = Events.off;
      Events.addOneTimeEventListener = Events.once;
      Events.fireEvent = Events.fire;
      Events.hasEventListeners = Events.listens;
      var Evented = Class.extend(Events);
      function Point(x, y, round) {
        this.x = round ? Math.round(x) : x;
        this.y = round ? Math.round(y) : y;
      }
      var trunc = Math.trunc || function(v) {
        return v > 0 ? Math.floor(v) : Math.ceil(v);
      };
      Point.prototype = {
        // @method clone(): Point
        // Returns a copy of the current point.
        clone: function() {
          return new Point(this.x, this.y);
        },
        // @method add(otherPoint: Point): Point
        // Returns the result of addition of the current and the given points.
        add: function(point) {
          return this.clone()._add(toPoint(point));
        },
        _add: function(point) {
          this.x += point.x;
          this.y += point.y;
          return this;
        },
        // @method subtract(otherPoint: Point): Point
        // Returns the result of subtraction of the given point from the current.
        subtract: function(point) {
          return this.clone()._subtract(toPoint(point));
        },
        _subtract: function(point) {
          this.x -= point.x;
          this.y -= point.y;
          return this;
        },
        // @method divideBy(num: Number): Point
        // Returns the result of division of the current point by the given number.
        divideBy: function(num) {
          return this.clone()._divideBy(num);
        },
        _divideBy: function(num) {
          this.x /= num;
          this.y /= num;
          return this;
        },
        // @method multiplyBy(num: Number): Point
        // Returns the result of multiplication of the current point by the given number.
        multiplyBy: function(num) {
          return this.clone()._multiplyBy(num);
        },
        _multiplyBy: function(num) {
          this.x *= num;
          this.y *= num;
          return this;
        },
        // @method scaleBy(scale: Point): Point
        // Multiply each coordinate of the current point by each coordinate of
        // `scale`. In linear algebra terms, multiply the point by the
        // [scaling matrix](https://en.wikipedia.org/wiki/Scaling_%28geometry%29#Matrix_representation)
        // defined by `scale`.
        scaleBy: function(point) {
          return new Point(this.x * point.x, this.y * point.y);
        },
        // @method unscaleBy(scale: Point): Point
        // Inverse of `scaleBy`. Divide each coordinate of the current point by
        // each coordinate of `scale`.
        unscaleBy: function(point) {
          return new Point(this.x / point.x, this.y / point.y);
        },
        // @method round(): Point
        // Returns a copy of the current point with rounded coordinates.
        round: function() {
          return this.clone()._round();
        },
        _round: function() {
          this.x = Math.round(this.x);
          this.y = Math.round(this.y);
          return this;
        },
        // @method floor(): Point
        // Returns a copy of the current point with floored coordinates (rounded down).
        floor: function() {
          return this.clone()._floor();
        },
        _floor: function() {
          this.x = Math.floor(this.x);
          this.y = Math.floor(this.y);
          return this;
        },
        // @method ceil(): Point
        // Returns a copy of the current point with ceiled coordinates (rounded up).
        ceil: function() {
          return this.clone()._ceil();
        },
        _ceil: function() {
          this.x = Math.ceil(this.x);
          this.y = Math.ceil(this.y);
          return this;
        },
        // @method trunc(): Point
        // Returns a copy of the current point with truncated coordinates (rounded towards zero).
        trunc: function() {
          return this.clone()._trunc();
        },
        _trunc: function() {
          this.x = trunc(this.x);
          this.y = trunc(this.y);
          return this;
        },
        // @method distanceTo(otherPoint: Point): Number
        // Returns the cartesian distance between the current and the given points.
        distanceTo: function(point) {
          point = toPoint(point);
          var x = point.x - this.x, y = point.y - this.y;
          return Math.sqrt(x * x + y * y);
        },
        // @method equals(otherPoint: Point): Boolean
        // Returns `true` if the given point has the same coordinates.
        equals: function(point) {
          point = toPoint(point);
          return point.x === this.x && point.y === this.y;
        },
        // @method contains(otherPoint: Point): Boolean
        // Returns `true` if both coordinates of the given point are less than the corresponding current point coordinates (in absolute values).
        contains: function(point) {
          point = toPoint(point);
          return Math.abs(point.x) <= Math.abs(this.x) && Math.abs(point.y) <= Math.abs(this.y);
        },
        // @method toString(): String
        // Returns a string representation of the point for debugging purposes.
        toString: function() {
          return "Point(" + formatNum(this.x) + ", " + formatNum(this.y) + ")";
        }
      };
      function toPoint(x, y, round) {
        if (x instanceof Point) {
          return x;
        }
        if (isArray(x)) {
          return new Point(x[0], x[1]);
        }
        if (x === void 0 || x === null) {
          return x;
        }
        if (typeof x === "object" && "x" in x && "y" in x) {
          return new Point(x.x, x.y);
        }
        return new Point(x, y, round);
      }
      function Bounds(a, b) {
        if (!a) {
          return;
        }
        var points = b ? [a, b] : a;
        for (var i = 0, len = points.length; i < len; i++) {
          this.extend(points[i]);
        }
      }
      Bounds.prototype = {
        // @method extend(point: Point): this
        // Extends the bounds to contain the given point.
        // @alternative
        // @method extend(otherBounds: Bounds): this
        // Extend the bounds to contain the given bounds
        extend: function(obj) {
          var min2, max2;
          if (!obj) {
            return this;
          }
          if (obj instanceof Point || typeof obj[0] === "number" || "x" in obj) {
            min2 = max2 = toPoint(obj);
          } else {
            obj = toBounds(obj);
            min2 = obj.min;
            max2 = obj.max;
            if (!min2 || !max2) {
              return this;
            }
          }
          if (!this.min && !this.max) {
            this.min = min2.clone();
            this.max = max2.clone();
          } else {
            this.min.x = Math.min(min2.x, this.min.x);
            this.max.x = Math.max(max2.x, this.max.x);
            this.min.y = Math.min(min2.y, this.min.y);
            this.max.y = Math.max(max2.y, this.max.y);
          }
          return this;
        },
        // @method getCenter(round?: Boolean): Point
        // Returns the center point of the bounds.
        getCenter: function(round) {
          return toPoint(
            (this.min.x + this.max.x) / 2,
            (this.min.y + this.max.y) / 2,
            round
          );
        },
        // @method getBottomLeft(): Point
        // Returns the bottom-left point of the bounds.
        getBottomLeft: function() {
          return toPoint(this.min.x, this.max.y);
        },
        // @method getTopRight(): Point
        // Returns the top-right point of the bounds.
        getTopRight: function() {
          return toPoint(this.max.x, this.min.y);
        },
        // @method getTopLeft(): Point
        // Returns the top-left point of the bounds (i.e. [`this.min`](#bounds-min)).
        getTopLeft: function() {
          return this.min;
        },
        // @method getBottomRight(): Point
        // Returns the bottom-right point of the bounds (i.e. [`this.max`](#bounds-max)).
        getBottomRight: function() {
          return this.max;
        },
        // @method getSize(): Point
        // Returns the size of the given bounds
        getSize: function() {
          return this.max.subtract(this.min);
        },
        // @method contains(otherBounds: Bounds): Boolean
        // Returns `true` if the rectangle contains the given one.
        // @alternative
        // @method contains(point: Point): Boolean
        // Returns `true` if the rectangle contains the given point.
        contains: function(obj) {
          var min, max;
          if (typeof obj[0] === "number" || obj instanceof Point) {
            obj = toPoint(obj);
          } else {
            obj = toBounds(obj);
          }
          if (obj instanceof Bounds) {
            min = obj.min;
            max = obj.max;
          } else {
            min = max = obj;
          }
          return min.x >= this.min.x && max.x <= this.max.x && min.y >= this.min.y && max.y <= this.max.y;
        },
        // @method intersects(otherBounds: Bounds): Boolean
        // Returns `true` if the rectangle intersects the given bounds. Two bounds
        // intersect if they have at least one point in common.
        intersects: function(bounds) {
          bounds = toBounds(bounds);
          var min = this.min, max = this.max, min2 = bounds.min, max2 = bounds.max, xIntersects = max2.x >= min.x && min2.x <= max.x, yIntersects = max2.y >= min.y && min2.y <= max.y;
          return xIntersects && yIntersects;
        },
        // @method overlaps(otherBounds: Bounds): Boolean
        // Returns `true` if the rectangle overlaps the given bounds. Two bounds
        // overlap if their intersection is an area.
        overlaps: function(bounds) {
          bounds = toBounds(bounds);
          var min = this.min, max = this.max, min2 = bounds.min, max2 = bounds.max, xOverlaps = max2.x > min.x && min2.x < max.x, yOverlaps = max2.y > min.y && min2.y < max.y;
          return xOverlaps && yOverlaps;
        },
        // @method isValid(): Boolean
        // Returns `true` if the bounds are properly initialized.
        isValid: function() {
          return !!(this.min && this.max);
        },
        // @method pad(bufferRatio: Number): Bounds
        // Returns bounds created by extending or retracting the current bounds by a given ratio in each direction.
        // For example, a ratio of 0.5 extends the bounds by 50% in each direction.
        // Negative values will retract the bounds.
        pad: function(bufferRatio) {
          var min = this.min, max = this.max, heightBuffer = Math.abs(min.x - max.x) * bufferRatio, widthBuffer = Math.abs(min.y - max.y) * bufferRatio;
          return toBounds(
            toPoint(min.x - heightBuffer, min.y - widthBuffer),
            toPoint(max.x + heightBuffer, max.y + widthBuffer)
          );
        },
        // @method equals(otherBounds: Bounds): Boolean
        // Returns `true` if the rectangle is equivalent to the given bounds.
        equals: function(bounds) {
          if (!bounds) {
            return false;
          }
          bounds = toBounds(bounds);
          return this.min.equals(bounds.getTopLeft()) && this.max.equals(bounds.getBottomRight());
        }
      };
      function toBounds(a, b) {
        if (!a || a instanceof Bounds) {
          return a;
        }
        return new Bounds(a, b);
      }
      function LatLngBounds(corner1, corner2) {
        if (!corner1) {
          return;
        }
        var latlngs = corner2 ? [corner1, corner2] : corner1;
        for (var i = 0, len = latlngs.length; i < len; i++) {
          this.extend(latlngs[i]);
        }
      }
      LatLngBounds.prototype = {
        // @method extend(latlng: LatLng): this
        // Extend the bounds to contain the given point
        // @alternative
        // @method extend(otherBounds: LatLngBounds): this
        // Extend the bounds to contain the given bounds
        extend: function(obj) {
          var sw = this._southWest, ne = this._northEast, sw2, ne2;
          if (obj instanceof LatLng) {
            sw2 = obj;
            ne2 = obj;
          } else if (obj instanceof LatLngBounds) {
            sw2 = obj._southWest;
            ne2 = obj._northEast;
            if (!sw2 || !ne2) {
              return this;
            }
          } else {
            return obj ? this.extend(toLatLng(obj) || toLatLngBounds(obj)) : this;
          }
          if (!sw && !ne) {
            this._southWest = new LatLng(sw2.lat, sw2.lng);
            this._northEast = new LatLng(ne2.lat, ne2.lng);
          } else {
            sw.lat = Math.min(sw2.lat, sw.lat);
            sw.lng = Math.min(sw2.lng, sw.lng);
            ne.lat = Math.max(ne2.lat, ne.lat);
            ne.lng = Math.max(ne2.lng, ne.lng);
          }
          return this;
        },
        // @method pad(bufferRatio: Number): LatLngBounds
        // Returns bounds created by extending or retracting the current bounds by a given ratio in each direction.
        // For example, a ratio of 0.5 extends the bounds by 50% in each direction.
        // Negative values will retract the bounds.
        pad: function(bufferRatio) {
          var sw = this._southWest, ne = this._northEast, heightBuffer = Math.abs(sw.lat - ne.lat) * bufferRatio, widthBuffer = Math.abs(sw.lng - ne.lng) * bufferRatio;
          return new LatLngBounds(
            new LatLng(sw.lat - heightBuffer, sw.lng - widthBuffer),
            new LatLng(ne.lat + heightBuffer, ne.lng + widthBuffer)
          );
        },
        // @method getCenter(): LatLng
        // Returns the center point of the bounds.
        getCenter: function() {
          return new LatLng(
            (this._southWest.lat + this._northEast.lat) / 2,
            (this._southWest.lng + this._northEast.lng) / 2
          );
        },
        // @method getSouthWest(): LatLng
        // Returns the south-west point of the bounds.
        getSouthWest: function() {
          return this._southWest;
        },
        // @method getNorthEast(): LatLng
        // Returns the north-east point of the bounds.
        getNorthEast: function() {
          return this._northEast;
        },
        // @method getNorthWest(): LatLng
        // Returns the north-west point of the bounds.
        getNorthWest: function() {
          return new LatLng(this.getNorth(), this.getWest());
        },
        // @method getSouthEast(): LatLng
        // Returns the south-east point of the bounds.
        getSouthEast: function() {
          return new LatLng(this.getSouth(), this.getEast());
        },
        // @method getWest(): Number
        // Returns the west longitude of the bounds
        getWest: function() {
          return this._southWest.lng;
        },
        // @method getSouth(): Number
        // Returns the south latitude of the bounds
        getSouth: function() {
          return this._southWest.lat;
        },
        // @method getEast(): Number
        // Returns the east longitude of the bounds
        getEast: function() {
          return this._northEast.lng;
        },
        // @method getNorth(): Number
        // Returns the north latitude of the bounds
        getNorth: function() {
          return this._northEast.lat;
        },
        // @method contains(otherBounds: LatLngBounds): Boolean
        // Returns `true` if the rectangle contains the given one.
        // @alternative
        // @method contains (latlng: LatLng): Boolean
        // Returns `true` if the rectangle contains the given point.
        contains: function(obj) {
          if (typeof obj[0] === "number" || obj instanceof LatLng || "lat" in obj) {
            obj = toLatLng(obj);
          } else {
            obj = toLatLngBounds(obj);
          }
          var sw = this._southWest, ne = this._northEast, sw2, ne2;
          if (obj instanceof LatLngBounds) {
            sw2 = obj.getSouthWest();
            ne2 = obj.getNorthEast();
          } else {
            sw2 = ne2 = obj;
          }
          return sw2.lat >= sw.lat && ne2.lat <= ne.lat && sw2.lng >= sw.lng && ne2.lng <= ne.lng;
        },
        // @method intersects(otherBounds: LatLngBounds): Boolean
        // Returns `true` if the rectangle intersects the given bounds. Two bounds intersect if they have at least one point in common.
        intersects: function(bounds) {
          bounds = toLatLngBounds(bounds);
          var sw = this._southWest, ne = this._northEast, sw2 = bounds.getSouthWest(), ne2 = bounds.getNorthEast(), latIntersects = ne2.lat >= sw.lat && sw2.lat <= ne.lat, lngIntersects = ne2.lng >= sw.lng && sw2.lng <= ne.lng;
          return latIntersects && lngIntersects;
        },
        // @method overlaps(otherBounds: LatLngBounds): Boolean
        // Returns `true` if the rectangle overlaps the given bounds. Two bounds overlap if their intersection is an area.
        overlaps: function(bounds) {
          bounds = toLatLngBounds(bounds);
          var sw = this._southWest, ne = this._northEast, sw2 = bounds.getSouthWest(), ne2 = bounds.getNorthEast(), latOverlaps = ne2.lat > sw.lat && sw2.lat < ne.lat, lngOverlaps = ne2.lng > sw.lng && sw2.lng < ne.lng;
          return latOverlaps && lngOverlaps;
        },
        // @method toBBoxString(): String
        // Returns a string with bounding box coordinates in a 'southwest_lng,southwest_lat,northeast_lng,northeast_lat' format. Useful for sending requests to web services that return geo data.
        toBBoxString: function() {
          return [this.getWest(), this.getSouth(), this.getEast(), this.getNorth()].join(",");
        },
        // @method equals(otherBounds: LatLngBounds, maxMargin?: Number): Boolean
        // Returns `true` if the rectangle is equivalent (within a small margin of error) to the given bounds. The margin of error can be overridden by setting `maxMargin` to a small number.
        equals: function(bounds, maxMargin) {
          if (!bounds) {
            return false;
          }
          bounds = toLatLngBounds(bounds);
          return this._southWest.equals(bounds.getSouthWest(), maxMargin) && this._northEast.equals(bounds.getNorthEast(), maxMargin);
        },
        // @method isValid(): Boolean
        // Returns `true` if the bounds are properly initialized.
        isValid: function() {
          return !!(this._southWest && this._northEast);
        }
      };
      function toLatLngBounds(a, b) {
        if (a instanceof LatLngBounds) {
          return a;
        }
        return new LatLngBounds(a, b);
      }
      function LatLng(lat, lng, alt) {
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error("Invalid LatLng object: (" + lat + ", " + lng + ")");
        }
        this.lat = +lat;
        this.lng = +lng;
        if (alt !== void 0) {
          this.alt = +alt;
        }
      }
      LatLng.prototype = {
        // @method equals(otherLatLng: LatLng, maxMargin?: Number): Boolean
        // Returns `true` if the given `LatLng` point is at the same position (within a small margin of error). The margin of error can be overridden by setting `maxMargin` to a small number.
        equals: function(obj, maxMargin) {
          if (!obj) {
            return false;
          }
          obj = toLatLng(obj);
          var margin = Math.max(
            Math.abs(this.lat - obj.lat),
            Math.abs(this.lng - obj.lng)
          );
          return margin <= (maxMargin === void 0 ? 1e-9 : maxMargin);
        },
        // @method toString(): String
        // Returns a string representation of the point (for debugging purposes).
        toString: function(precision) {
          return "LatLng(" + formatNum(this.lat, precision) + ", " + formatNum(this.lng, precision) + ")";
        },
        // @method distanceTo(otherLatLng: LatLng): Number
        // Returns the distance (in meters) to the given `LatLng` calculated using the [Spherical Law of Cosines](https://en.wikipedia.org/wiki/Spherical_law_of_cosines).
        distanceTo: function(other) {
          return Earth.distance(this, toLatLng(other));
        },
        // @method wrap(): LatLng
        // Returns a new `LatLng` object with the longitude wrapped so it's always between -180 and +180 degrees.
        wrap: function() {
          return Earth.wrapLatLng(this);
        },
        // @method toBounds(sizeInMeters: Number): LatLngBounds
        // Returns a new `LatLngBounds` object in which each boundary is `sizeInMeters/2` meters apart from the `LatLng`.
        toBounds: function(sizeInMeters) {
          var latAccuracy = 180 * sizeInMeters / 40075017, lngAccuracy = latAccuracy / Math.cos(Math.PI / 180 * this.lat);
          return toLatLngBounds(
            [this.lat - latAccuracy, this.lng - lngAccuracy],
            [this.lat + latAccuracy, this.lng + lngAccuracy]
          );
        },
        clone: function() {
          return new LatLng(this.lat, this.lng, this.alt);
        }
      };
      function toLatLng(a, b, c) {
        if (a instanceof LatLng) {
          return a;
        }
        if (isArray(a) && typeof a[0] !== "object") {
          if (a.length === 3) {
            return new LatLng(a[0], a[1], a[2]);
          }
          if (a.length === 2) {
            return new LatLng(a[0], a[1]);
          }
          return null;
        }
        if (a === void 0 || a === null) {
          return a;
        }
        if (typeof a === "object" && "lat" in a) {
          return new LatLng(a.lat, "lng" in a ? a.lng : a.lon, a.alt);
        }
        if (b === void 0) {
          return null;
        }
        return new LatLng(a, b, c);
      }
      var CRS = {
        // @method latLngToPoint(latlng: LatLng, zoom: Number): Point
        // Projects geographical coordinates into pixel coordinates for a given zoom.
        latLngToPoint: function(latlng, zoom2) {
          var projectedPoint = this.projection.project(latlng), scale2 = this.scale(zoom2);
          return this.transformation._transform(projectedPoint, scale2);
        },
        // @method pointToLatLng(point: Point, zoom: Number): LatLng
        // The inverse of `latLngToPoint`. Projects pixel coordinates on a given
        // zoom into geographical coordinates.
        pointToLatLng: function(point, zoom2) {
          var scale2 = this.scale(zoom2), untransformedPoint = this.transformation.untransform(point, scale2);
          return this.projection.unproject(untransformedPoint);
        },
        // @method project(latlng: LatLng): Point
        // Projects geographical coordinates into coordinates in units accepted for
        // this CRS (e.g. meters for EPSG:3857, for passing it to WMS services).
        project: function(latlng) {
          return this.projection.project(latlng);
        },
        // @method unproject(point: Point): LatLng
        // Given a projected coordinate returns the corresponding LatLng.
        // The inverse of `project`.
        unproject: function(point) {
          return this.projection.unproject(point);
        },
        // @method scale(zoom: Number): Number
        // Returns the scale used when transforming projected coordinates into
        // pixel coordinates for a particular zoom. For example, it returns
        // `256 * 2^zoom` for Mercator-based CRS.
        scale: function(zoom2) {
          return 256 * Math.pow(2, zoom2);
        },
        // @method zoom(scale: Number): Number
        // Inverse of `scale()`, returns the zoom level corresponding to a scale
        // factor of `scale`.
        zoom: function(scale2) {
          return Math.log(scale2 / 256) / Math.LN2;
        },
        // @method getProjectedBounds(zoom: Number): Bounds
        // Returns the projection's bounds scaled and transformed for the provided `zoom`.
        getProjectedBounds: function(zoom2) {
          if (this.infinite) {
            return null;
          }
          var b = this.projection.bounds, s = this.scale(zoom2), min = this.transformation.transform(b.min, s), max = this.transformation.transform(b.max, s);
          return new Bounds(min, max);
        },
        // @method distance(latlng1: LatLng, latlng2: LatLng): Number
        // Returns the distance between two geographical coordinates.
        // @property code: String
        // Standard code name of the CRS passed into WMS services (e.g. `'EPSG:3857'`)
        //
        // @property wrapLng: Number[]
        // An array of two numbers defining whether the longitude (horizontal) coordinate
        // axis wraps around a given range and how. Defaults to `[-180, 180]` in most
        // geographical CRSs. If `undefined`, the longitude axis does not wrap around.
        //
        // @property wrapLat: Number[]
        // Like `wrapLng`, but for the latitude (vertical) axis.
        // wrapLng: [min, max],
        // wrapLat: [min, max],
        // @property infinite: Boolean
        // If true, the coordinate space will be unbounded (infinite in both axes)
        infinite: false,
        // @method wrapLatLng(latlng: LatLng): LatLng
        // Returns a `LatLng` where lat and lng has been wrapped according to the
        // CRS's `wrapLat` and `wrapLng` properties, if they are outside the CRS's bounds.
        wrapLatLng: function(latlng) {
          var lng = this.wrapLng ? wrapNum(latlng.lng, this.wrapLng, true) : latlng.lng, lat = this.wrapLat ? wrapNum(latlng.lat, this.wrapLat, true) : latlng.lat, alt = latlng.alt;
          return new LatLng(lat, lng, alt);
        },
        // @method wrapLatLngBounds(bounds: LatLngBounds): LatLngBounds
        // Returns a `LatLngBounds` with the same size as the given one, ensuring
        // that its center is within the CRS's bounds.
        // Only accepts actual `L.LatLngBounds` instances, not arrays.
        wrapLatLngBounds: function(bounds) {
          var center = bounds.getCenter(), newCenter = this.wrapLatLng(center), latShift = center.lat - newCenter.lat, lngShift = center.lng - newCenter.lng;
          if (latShift === 0 && lngShift === 0) {
            return bounds;
          }
          var sw = bounds.getSouthWest(), ne = bounds.getNorthEast(), newSw = new LatLng(sw.lat - latShift, sw.lng - lngShift), newNe = new LatLng(ne.lat - latShift, ne.lng - lngShift);
          return new LatLngBounds(newSw, newNe);
        }
      };
      var Earth = extend({}, CRS, {
        wrapLng: [-180, 180],
        // Mean Earth Radius, as recommended for use by
        // the International Union of Geodesy and Geophysics,
        // see https://rosettacode.org/wiki/Haversine_formula
        R: 6371e3,
        // distance between two geographical points using spherical law of cosines approximation
        distance: function(latlng1, latlng2) {
          var rad = Math.PI / 180, lat1 = latlng1.lat * rad, lat2 = latlng2.lat * rad, sinDLat = Math.sin((latlng2.lat - latlng1.lat) * rad / 2), sinDLon = Math.sin((latlng2.lng - latlng1.lng) * rad / 2), a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon, c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return this.R * c;
        }
      });
      var earthRadius = 6378137;
      var SphericalMercator = {
        R: earthRadius,
        MAX_LATITUDE: 85.0511287798,
        project: function(latlng) {
          var d = Math.PI / 180, max = this.MAX_LATITUDE, lat = Math.max(Math.min(max, latlng.lat), -max), sin = Math.sin(lat * d);
          return new Point(
            this.R * latlng.lng * d,
            this.R * Math.log((1 + sin) / (1 - sin)) / 2
          );
        },
        unproject: function(point) {
          var d = 180 / Math.PI;
          return new LatLng(
            (2 * Math.atan(Math.exp(point.y / this.R)) - Math.PI / 2) * d,
            point.x * d / this.R
          );
        },
        bounds: function() {
          var d = earthRadius * Math.PI;
          return new Bounds([-d, -d], [d, d]);
        }()
      };
      function Transformation(a, b, c, d) {
        if (isArray(a)) {
          this._a = a[0];
          this._b = a[1];
          this._c = a[2];
          this._d = a[3];
          return;
        }
        this._a = a;
        this._b = b;
        this._c = c;
        this._d = d;
      }
      Transformation.prototype = {
        // @method transform(point: Point, scale?: Number): Point
        // Returns a transformed point, optionally multiplied by the given scale.
        // Only accepts actual `L.Point` instances, not arrays.
        transform: function(point, scale2) {
          return this._transform(point.clone(), scale2);
        },
        // destructive transform (faster)
        _transform: function(point, scale2) {
          scale2 = scale2 || 1;
          point.x = scale2 * (this._a * point.x + this._b);
          point.y = scale2 * (this._c * point.y + this._d);
          return point;
        },
        // @method untransform(point: Point, scale?: Number): Point
        // Returns the reverse transformation of the given point, optionally divided
        // by the given scale. Only accepts actual `L.Point` instances, not arrays.
        untransform: function(point, scale2) {
          scale2 = scale2 || 1;
          return new Point(
            (point.x / scale2 - this._b) / this._a,
            (point.y / scale2 - this._d) / this._c
          );
        }
      };
      function toTransformation(a, b, c, d) {
        return new Transformation(a, b, c, d);
      }
      var EPSG3857 = extend({}, Earth, {
        code: "EPSG:3857",
        projection: SphericalMercator,
        transformation: function() {
          var scale2 = 0.5 / (Math.PI * SphericalMercator.R);
          return toTransformation(scale2, 0.5, -scale2, 0.5);
        }()
      });
      var EPSG900913 = extend({}, EPSG3857, {
        code: "EPSG:900913"
      });
      function svgCreate(name) {
        return document.createElementNS("http://www.w3.org/2000/svg", name);
      }
      function pointsToPath(rings, closed) {
        var str = "", i, j, len, len2, points, p;
        for (i = 0, len = rings.length; i < len; i++) {
          points = rings[i];
          for (j = 0, len2 = points.length; j < len2; j++) {
            p = points[j];
            str += (j ? "L" : "M") + p.x + " " + p.y;
          }
          str += closed ? Browser.svg ? "z" : "x" : "";
        }
        return str || "M0 0";
      }
      var style2 = document.documentElement.style;
      var ie = "ActiveXObject" in window;
      var ielt9 = ie && !document.addEventListener;
      var edge = "msLaunchUri" in navigator && !("documentMode" in document);
      var webkit = userAgentContains("webkit");
      var android = userAgentContains("android");
      var android23 = userAgentContains("android 2") || userAgentContains("android 3");
      var webkitVer = parseInt(/WebKit\/([0-9]+)|$/.exec(navigator.userAgent)[1], 10);
      var androidStock = android && userAgentContains("Google") && webkitVer < 537 && !("AudioNode" in window);
      var opera = !!window.opera;
      var chrome2 = !edge && userAgentContains("chrome");
      var gecko = userAgentContains("gecko") && !webkit && !opera && !ie;
      var safari = !chrome2 && userAgentContains("safari");
      var phantom = userAgentContains("phantom");
      var opera12 = "OTransition" in style2;
      var win = navigator.platform.indexOf("Win") === 0;
      var ie3d = ie && "transition" in style2;
      var webkit3d = "WebKitCSSMatrix" in window && "m11" in new window.WebKitCSSMatrix() && !android23;
      var gecko3d = "MozPerspective" in style2;
      var any3d = !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d) && !opera12 && !phantom;
      var mobile = typeof orientation !== "undefined" || userAgentContains("mobile");
      var mobileWebkit = mobile && webkit;
      var mobileWebkit3d = mobile && webkit3d;
      var msPointer = !window.PointerEvent && window.MSPointerEvent;
      var pointer = !!(window.PointerEvent || msPointer);
      var touchNative = "ontouchstart" in window || !!window.TouchEvent;
      var touch = !window.L_NO_TOUCH && (touchNative || pointer);
      var mobileOpera = mobile && opera;
      var mobileGecko = mobile && gecko;
      var retina = (window.devicePixelRatio || window.screen.deviceXDPI / window.screen.logicalXDPI) > 1;
      var passiveEvents = function() {
        var supportsPassiveOption = false;
        try {
          var opts = Object.defineProperty({}, "passive", {
            get: function() {
              supportsPassiveOption = true;
            }
          });
          window.addEventListener("testPassiveEventSupport", falseFn, opts);
          window.removeEventListener("testPassiveEventSupport", falseFn, opts);
        } catch (e) {
        }
        return supportsPassiveOption;
      }();
      var canvas$1 = function() {
        return !!document.createElement("canvas").getContext;
      }();
      var svg$1 = !!(document.createElementNS && svgCreate("svg").createSVGRect);
      var inlineSvg = !!svg$1 && function() {
        var div = document.createElement("div");
        div.innerHTML = "<svg/>";
        return (div.firstChild && div.firstChild.namespaceURI) === "http://www.w3.org/2000/svg";
      }();
      var vml = !svg$1 && function() {
        try {
          var div = document.createElement("div");
          div.innerHTML = '<v:shape adj="1"/>';
          var shape = div.firstChild;
          shape.style.behavior = "url(#default#VML)";
          return shape && typeof shape.adj === "object";
        } catch (e) {
          return false;
        }
      }();
      var mac = navigator.platform.indexOf("Mac") === 0;
      var linux = navigator.platform.indexOf("Linux") === 0;
      function userAgentContains(str) {
        return navigator.userAgent.toLowerCase().indexOf(str) >= 0;
      }
      var Browser = {
        ie,
        ielt9,
        edge,
        webkit,
        android,
        android23,
        androidStock,
        opera,
        chrome: chrome2,
        gecko,
        safari,
        phantom,
        opera12,
        win,
        ie3d,
        webkit3d,
        gecko3d,
        any3d,
        mobile,
        mobileWebkit,
        mobileWebkit3d,
        msPointer,
        pointer,
        touch,
        touchNative,
        mobileOpera,
        mobileGecko,
        retina,
        passiveEvents,
        canvas: canvas$1,
        svg: svg$1,
        vml,
        inlineSvg,
        mac,
        linux
      };
      var POINTER_DOWN = Browser.msPointer ? "MSPointerDown" : "pointerdown";
      var POINTER_MOVE = Browser.msPointer ? "MSPointerMove" : "pointermove";
      var POINTER_UP = Browser.msPointer ? "MSPointerUp" : "pointerup";
      var POINTER_CANCEL = Browser.msPointer ? "MSPointerCancel" : "pointercancel";
      var pEvent = {
        touchstart: POINTER_DOWN,
        touchmove: POINTER_MOVE,
        touchend: POINTER_UP,
        touchcancel: POINTER_CANCEL
      };
      var handle = {
        touchstart: _onPointerStart,
        touchmove: _handlePointer,
        touchend: _handlePointer,
        touchcancel: _handlePointer
      };
      var _pointers = {};
      var _pointerDocListener = false;
      function addPointerListener(obj, type, handler) {
        if (type === "touchstart") {
          _addPointerDocListener();
        }
        if (!handle[type]) {
          console.warn("wrong event specified:", type);
          return falseFn;
        }
        handler = handle[type].bind(this, handler);
        obj.addEventListener(pEvent[type], handler, false);
        return handler;
      }
      function removePointerListener(obj, type, handler) {
        if (!pEvent[type]) {
          console.warn("wrong event specified:", type);
          return;
        }
        obj.removeEventListener(pEvent[type], handler, false);
      }
      function _globalPointerDown(e) {
        _pointers[e.pointerId] = e;
      }
      function _globalPointerMove(e) {
        if (_pointers[e.pointerId]) {
          _pointers[e.pointerId] = e;
        }
      }
      function _globalPointerUp(e) {
        delete _pointers[e.pointerId];
      }
      function _addPointerDocListener() {
        if (!_pointerDocListener) {
          document.addEventListener(POINTER_DOWN, _globalPointerDown, true);
          document.addEventListener(POINTER_MOVE, _globalPointerMove, true);
          document.addEventListener(POINTER_UP, _globalPointerUp, true);
          document.addEventListener(POINTER_CANCEL, _globalPointerUp, true);
          _pointerDocListener = true;
        }
      }
      function _handlePointer(handler, e) {
        if (e.pointerType === (e.MSPOINTER_TYPE_MOUSE || "mouse")) {
          return;
        }
        e.touches = [];
        for (var i in _pointers) {
          e.touches.push(_pointers[i]);
        }
        e.changedTouches = [e];
        handler(e);
      }
      function _onPointerStart(handler, e) {
        if (e.MSPOINTER_TYPE_TOUCH && e.pointerType === e.MSPOINTER_TYPE_TOUCH) {
          preventDefault(e);
        }
        _handlePointer(handler, e);
      }
      function makeDblclick(event) {
        var newEvent = {}, prop, i;
        for (i in event) {
          prop = event[i];
          newEvent[i] = prop && prop.bind ? prop.bind(event) : prop;
        }
        event = newEvent;
        newEvent.type = "dblclick";
        newEvent.detail = 2;
        newEvent.isTrusted = false;
        newEvent._simulated = true;
        return newEvent;
      }
      var delay = 200;
      function addDoubleTapListener(obj, handler) {
        obj.addEventListener("dblclick", handler);
        var last = 0, detail;
        function simDblclick(e) {
          if (e.detail !== 1) {
            detail = e.detail;
            return;
          }
          if (e.pointerType === "mouse" || e.sourceCapabilities && !e.sourceCapabilities.firesTouchEvents) {
            return;
          }
          var path = getPropagationPath(e);
          if (path.some(function(el) {
            return el instanceof HTMLLabelElement && el.attributes.for;
          }) && !path.some(function(el) {
            return el instanceof HTMLInputElement || el instanceof HTMLSelectElement;
          })) {
            return;
          }
          var now = Date.now();
          if (now - last <= delay) {
            detail++;
            if (detail === 2) {
              handler(makeDblclick(e));
            }
          } else {
            detail = 1;
          }
          last = now;
        }
        obj.addEventListener("click", simDblclick);
        return {
          dblclick: handler,
          simDblclick
        };
      }
      function removeDoubleTapListener(obj, handlers) {
        obj.removeEventListener("dblclick", handlers.dblclick);
        obj.removeEventListener("click", handlers.simDblclick);
      }
      var TRANSFORM = testProp(
        ["transform", "webkitTransform", "OTransform", "MozTransform", "msTransform"]
      );
      var TRANSITION = testProp(
        ["webkitTransition", "transition", "OTransition", "MozTransition", "msTransition"]
      );
      var TRANSITION_END = TRANSITION === "webkitTransition" || TRANSITION === "OTransition" ? TRANSITION + "End" : "transitionend";
      function get(id) {
        return typeof id === "string" ? document.getElementById(id) : id;
      }
      function getStyle(el, style3) {
        var value = el.style[style3] || el.currentStyle && el.currentStyle[style3];
        if ((!value || value === "auto") && document.defaultView) {
          var css = document.defaultView.getComputedStyle(el, null);
          value = css ? css[style3] : null;
        }
        return value === "auto" ? null : value;
      }
      function create$1(tagName, className, container) {
        var el = document.createElement(tagName);
        el.className = className || "";
        if (container) {
          container.appendChild(el);
        }
        return el;
      }
      function remove(el) {
        var parent = el.parentNode;
        if (parent) {
          parent.removeChild(el);
        }
      }
      function empty(el) {
        while (el.firstChild) {
          el.removeChild(el.firstChild);
        }
      }
      function toFront(el) {
        var parent = el.parentNode;
        if (parent && parent.lastChild !== el) {
          parent.appendChild(el);
        }
      }
      function toBack(el) {
        var parent = el.parentNode;
        if (parent && parent.firstChild !== el) {
          parent.insertBefore(el, parent.firstChild);
        }
      }
      function hasClass(el, name) {
        if (el.classList !== void 0) {
          return el.classList.contains(name);
        }
        var className = getClass(el);
        return className.length > 0 && new RegExp("(^|\\s)" + name + "(\\s|$)").test(className);
      }
      function addClass(el, name) {
        if (el.classList !== void 0) {
          var classes = splitWords(name);
          for (var i = 0, len = classes.length; i < len; i++) {
            el.classList.add(classes[i]);
          }
        } else if (!hasClass(el, name)) {
          var className = getClass(el);
          setClass(el, (className ? className + " " : "") + name);
        }
      }
      function removeClass(el, name) {
        if (el.classList !== void 0) {
          el.classList.remove(name);
        } else {
          setClass(el, trim((" " + getClass(el) + " ").replace(" " + name + " ", " ")));
        }
      }
      function setClass(el, name) {
        if (el.className.baseVal === void 0) {
          el.className = name;
        } else {
          el.className.baseVal = name;
        }
      }
      function getClass(el) {
        if (el.correspondingElement) {
          el = el.correspondingElement;
        }
        return el.className.baseVal === void 0 ? el.className : el.className.baseVal;
      }
      function setOpacity(el, value) {
        if ("opacity" in el.style) {
          el.style.opacity = value;
        } else if ("filter" in el.style) {
          _setOpacityIE(el, value);
        }
      }
      function _setOpacityIE(el, value) {
        var filter = false, filterName = "DXImageTransform.Microsoft.Alpha";
        try {
          filter = el.filters.item(filterName);
        } catch (e) {
          if (value === 1) {
            return;
          }
        }
        value = Math.round(value * 100);
        if (filter) {
          filter.Enabled = value !== 100;
          filter.Opacity = value;
        } else {
          el.style.filter += " progid:" + filterName + "(opacity=" + value + ")";
        }
      }
      function testProp(props) {
        var style3 = document.documentElement.style;
        for (var i = 0; i < props.length; i++) {
          if (props[i] in style3) {
            return props[i];
          }
        }
        return false;
      }
      function setTransform(el, offset, scale2) {
        var pos = offset || new Point(0, 0);
        el.style[TRANSFORM] = (Browser.ie3d ? "translate(" + pos.x + "px," + pos.y + "px)" : "translate3d(" + pos.x + "px," + pos.y + "px,0)") + (scale2 ? " scale(" + scale2 + ")" : "");
      }
      function setPosition(el, point) {
        el._leaflet_pos = point;
        if (Browser.any3d) {
          setTransform(el, point);
        } else {
          el.style.left = point.x + "px";
          el.style.top = point.y + "px";
        }
      }
      function getPosition(el) {
        return el._leaflet_pos || new Point(0, 0);
      }
      var disableTextSelection;
      var enableTextSelection;
      var _userSelect;
      if ("onselectstart" in document) {
        disableTextSelection = function() {
          on(window, "selectstart", preventDefault);
        };
        enableTextSelection = function() {
          off(window, "selectstart", preventDefault);
        };
      } else {
        var userSelectProperty = testProp(
          ["userSelect", "WebkitUserSelect", "OUserSelect", "MozUserSelect", "msUserSelect"]
        );
        disableTextSelection = function() {
          if (userSelectProperty) {
            var style3 = document.documentElement.style;
            _userSelect = style3[userSelectProperty];
            style3[userSelectProperty] = "none";
          }
        };
        enableTextSelection = function() {
          if (userSelectProperty) {
            document.documentElement.style[userSelectProperty] = _userSelect;
            _userSelect = void 0;
          }
        };
      }
      function disableImageDrag() {
        on(window, "dragstart", preventDefault);
      }
      function enableImageDrag() {
        off(window, "dragstart", preventDefault);
      }
      var _outlineElement, _outlineStyle;
      function preventOutline(element) {
        while (element.tabIndex === -1) {
          element = element.parentNode;
        }
        if (!element.style) {
          return;
        }
        restoreOutline();
        _outlineElement = element;
        _outlineStyle = element.style.outlineStyle;
        element.style.outlineStyle = "none";
        on(window, "keydown", restoreOutline);
      }
      function restoreOutline() {
        if (!_outlineElement) {
          return;
        }
        _outlineElement.style.outlineStyle = _outlineStyle;
        _outlineElement = void 0;
        _outlineStyle = void 0;
        off(window, "keydown", restoreOutline);
      }
      function getSizedParentNode(element) {
        do {
          element = element.parentNode;
        } while ((!element.offsetWidth || !element.offsetHeight) && element !== document.body);
        return element;
      }
      function getScale(element) {
        var rect = element.getBoundingClientRect();
        return {
          x: rect.width / element.offsetWidth || 1,
          y: rect.height / element.offsetHeight || 1,
          boundingClientRect: rect
        };
      }
      var DomUtil = {
        __proto__: null,
        TRANSFORM,
        TRANSITION,
        TRANSITION_END,
        get,
        getStyle,
        create: create$1,
        remove,
        empty,
        toFront,
        toBack,
        hasClass,
        addClass,
        removeClass,
        setClass,
        getClass,
        setOpacity,
        testProp,
        setTransform,
        setPosition,
        getPosition,
        get disableTextSelection() {
          return disableTextSelection;
        },
        get enableTextSelection() {
          return enableTextSelection;
        },
        disableImageDrag,
        enableImageDrag,
        preventOutline,
        restoreOutline,
        getSizedParentNode,
        getScale
      };
      function on(obj, types, fn, context) {
        if (types && typeof types === "object") {
          for (var type in types) {
            addOne(obj, type, types[type], fn);
          }
        } else {
          types = splitWords(types);
          for (var i = 0, len = types.length; i < len; i++) {
            addOne(obj, types[i], fn, context);
          }
        }
        return this;
      }
      var eventsKey = "_leaflet_events";
      function off(obj, types, fn, context) {
        if (arguments.length === 1) {
          batchRemove(obj);
          delete obj[eventsKey];
        } else if (types && typeof types === "object") {
          for (var type in types) {
            removeOne(obj, type, types[type], fn);
          }
        } else {
          types = splitWords(types);
          if (arguments.length === 2) {
            batchRemove(obj, function(type2) {
              return indexOf(types, type2) !== -1;
            });
          } else {
            for (var i = 0, len = types.length; i < len; i++) {
              removeOne(obj, types[i], fn, context);
            }
          }
        }
        return this;
      }
      function batchRemove(obj, filterFn) {
        for (var id in obj[eventsKey]) {
          var type = id.split(/\d/)[0];
          if (!filterFn || filterFn(type)) {
            removeOne(obj, type, null, null, id);
          }
        }
      }
      var mouseSubst = {
        mouseenter: "mouseover",
        mouseleave: "mouseout",
        wheel: !("onwheel" in window) && "mousewheel"
      };
      function addOne(obj, type, fn, context) {
        var id = type + stamp(fn) + (context ? "_" + stamp(context) : "");
        if (obj[eventsKey] && obj[eventsKey][id]) {
          return this;
        }
        var handler = function(e) {
          return fn.call(context || obj, e || window.event);
        };
        var originalHandler = handler;
        if (!Browser.touchNative && Browser.pointer && type.indexOf("touch") === 0) {
          handler = addPointerListener(obj, type, handler);
        } else if (Browser.touch && type === "dblclick") {
          handler = addDoubleTapListener(obj, handler);
        } else if ("addEventListener" in obj) {
          if (type === "touchstart" || type === "touchmove" || type === "wheel" || type === "mousewheel") {
            obj.addEventListener(mouseSubst[type] || type, handler, Browser.passiveEvents ? { passive: false } : false);
          } else if (type === "mouseenter" || type === "mouseleave") {
            handler = function(e) {
              e = e || window.event;
              if (isExternalTarget(obj, e)) {
                originalHandler(e);
              }
            };
            obj.addEventListener(mouseSubst[type], handler, false);
          } else {
            obj.addEventListener(type, originalHandler, false);
          }
        } else {
          obj.attachEvent("on" + type, handler);
        }
        obj[eventsKey] = obj[eventsKey] || {};
        obj[eventsKey][id] = handler;
      }
      function removeOne(obj, type, fn, context, id) {
        id = id || type + stamp(fn) + (context ? "_" + stamp(context) : "");
        var handler = obj[eventsKey] && obj[eventsKey][id];
        if (!handler) {
          return this;
        }
        if (!Browser.touchNative && Browser.pointer && type.indexOf("touch") === 0) {
          removePointerListener(obj, type, handler);
        } else if (Browser.touch && type === "dblclick") {
          removeDoubleTapListener(obj, handler);
        } else if ("removeEventListener" in obj) {
          obj.removeEventListener(mouseSubst[type] || type, handler, false);
        } else {
          obj.detachEvent("on" + type, handler);
        }
        obj[eventsKey][id] = null;
      }
      function stopPropagation(e) {
        if (e.stopPropagation) {
          e.stopPropagation();
        } else if (e.originalEvent) {
          e.originalEvent._stopped = true;
        } else {
          e.cancelBubble = true;
        }
        return this;
      }
      function disableScrollPropagation(el) {
        addOne(el, "wheel", stopPropagation);
        return this;
      }
      function disableClickPropagation(el) {
        on(el, "mousedown touchstart dblclick contextmenu", stopPropagation);
        el["_leaflet_disable_click"] = true;
        return this;
      }
      function preventDefault(e) {
        if (e.preventDefault) {
          e.preventDefault();
        } else {
          e.returnValue = false;
        }
        return this;
      }
      function stop(e) {
        preventDefault(e);
        stopPropagation(e);
        return this;
      }
      function getPropagationPath(ev) {
        if (ev.composedPath) {
          return ev.composedPath();
        }
        var path = [];
        var el = ev.target;
        while (el) {
          path.push(el);
          el = el.parentNode;
        }
        return path;
      }
      function getMousePosition(e, container) {
        if (!container) {
          return new Point(e.clientX, e.clientY);
        }
        var scale2 = getScale(container), offset = scale2.boundingClientRect;
        return new Point(
          // offset.left/top values are in page scale (like clientX/Y),
          // whereas clientLeft/Top (border width) values are the original values (before CSS scale applies).
          (e.clientX - offset.left) / scale2.x - container.clientLeft,
          (e.clientY - offset.top) / scale2.y - container.clientTop
        );
      }
      var wheelPxFactor = Browser.linux && Browser.chrome ? window.devicePixelRatio : Browser.mac ? window.devicePixelRatio * 3 : window.devicePixelRatio > 0 ? 2 * window.devicePixelRatio : 1;
      function getWheelDelta(e) {
        return Browser.edge ? e.wheelDeltaY / 2 : (
          // Don't trust window-geometry-based delta
          e.deltaY && e.deltaMode === 0 ? -e.deltaY / wheelPxFactor : (
            // Pixels
            e.deltaY && e.deltaMode === 1 ? -e.deltaY * 20 : (
              // Lines
              e.deltaY && e.deltaMode === 2 ? -e.deltaY * 60 : (
                // Pages
                e.deltaX || e.deltaZ ? 0 : (
                  // Skip horizontal/depth wheel events
                  e.wheelDelta ? (e.wheelDeltaY || e.wheelDelta) / 2 : (
                    // Legacy IE pixels
                    e.detail && Math.abs(e.detail) < 32765 ? -e.detail * 20 : (
                      // Legacy Moz lines
                      e.detail ? e.detail / -32765 * 60 : (
                        // Legacy Moz pages
                        0
                      )
                    )
                  )
                )
              )
            )
          )
        );
      }
      function isExternalTarget(el, e) {
        var related = e.relatedTarget;
        if (!related) {
          return true;
        }
        try {
          while (related && related !== el) {
            related = related.parentNode;
          }
        } catch (err) {
          return false;
        }
        return related !== el;
      }
      var DomEvent = {
        __proto__: null,
        on,
        off,
        stopPropagation,
        disableScrollPropagation,
        disableClickPropagation,
        preventDefault,
        stop,
        getPropagationPath,
        getMousePosition,
        getWheelDelta,
        isExternalTarget,
        addListener: on,
        removeListener: off
      };
      var PosAnimation = Evented.extend({
        // @method run(el: HTMLElement, newPos: Point, duration?: Number, easeLinearity?: Number)
        // Run an animation of a given element to a new position, optionally setting
        // duration in seconds (`0.25` by default) and easing linearity factor (3rd
        // argument of the [cubic bezier curve](https://cubic-bezier.com/#0,0,.5,1),
        // `0.5` by default).
        run: function(el, newPos, duration, easeLinearity) {
          this.stop();
          this._el = el;
          this._inProgress = true;
          this._duration = duration || 0.25;
          this._easeOutPower = 1 / Math.max(easeLinearity || 0.5, 0.2);
          this._startPos = getPosition(el);
          this._offset = newPos.subtract(this._startPos);
          this._startTime = +/* @__PURE__ */ new Date();
          this.fire("start");
          this._animate();
        },
        // @method stop()
        // Stops the animation (if currently running).
        stop: function() {
          if (!this._inProgress) {
            return;
          }
          this._step(true);
          this._complete();
        },
        _animate: function() {
          this._animId = requestAnimFrame(this._animate, this);
          this._step();
        },
        _step: function(round) {
          var elapsed = +/* @__PURE__ */ new Date() - this._startTime, duration = this._duration * 1e3;
          if (elapsed < duration) {
            this._runFrame(this._easeOut(elapsed / duration), round);
          } else {
            this._runFrame(1);
            this._complete();
          }
        },
        _runFrame: function(progress, round) {
          var pos = this._startPos.add(this._offset.multiplyBy(progress));
          if (round) {
            pos._round();
          }
          setPosition(this._el, pos);
          this.fire("step");
        },
        _complete: function() {
          cancelAnimFrame(this._animId);
          this._inProgress = false;
          this.fire("end");
        },
        _easeOut: function(t) {
          return 1 - Math.pow(1 - t, this._easeOutPower);
        }
      });
      var Map2 = Evented.extend({
        options: {
          // @section Map State Options
          // @option crs: CRS = L.CRS.EPSG3857
          // The [Coordinate Reference System](#crs) to use. Don't change this if you're not
          // sure what it means.
          crs: EPSG3857,
          // @option center: LatLng = undefined
          // Initial geographic center of the map
          center: void 0,
          // @option zoom: Number = undefined
          // Initial map zoom level
          zoom: void 0,
          // @option minZoom: Number = *
          // Minimum zoom level of the map.
          // If not specified and at least one `GridLayer` or `TileLayer` is in the map,
          // the lowest of their `minZoom` options will be used instead.
          minZoom: void 0,
          // @option maxZoom: Number = *
          // Maximum zoom level of the map.
          // If not specified and at least one `GridLayer` or `TileLayer` is in the map,
          // the highest of their `maxZoom` options will be used instead.
          maxZoom: void 0,
          // @option layers: Layer[] = []
          // Array of layers that will be added to the map initially
          layers: [],
          // @option maxBounds: LatLngBounds = null
          // When this option is set, the map restricts the view to the given
          // geographical bounds, bouncing the user back if the user tries to pan
          // outside the view. To set the restriction dynamically, use
          // [`setMaxBounds`](#map-setmaxbounds) method.
          maxBounds: void 0,
          // @option renderer: Renderer = *
          // The default method for drawing vector layers on the map. `L.SVG`
          // or `L.Canvas` by default depending on browser support.
          renderer: void 0,
          // @section Animation Options
          // @option zoomAnimation: Boolean = true
          // Whether the map zoom animation is enabled. By default it's enabled
          // in all browsers that support CSS3 Transitions except Android.
          zoomAnimation: true,
          // @option zoomAnimationThreshold: Number = 4
          // Won't animate zoom if the zoom difference exceeds this value.
          zoomAnimationThreshold: 4,
          // @option fadeAnimation: Boolean = true
          // Whether the tile fade animation is enabled. By default it's enabled
          // in all browsers that support CSS3 Transitions except Android.
          fadeAnimation: true,
          // @option markerZoomAnimation: Boolean = true
          // Whether markers animate their zoom with the zoom animation, if disabled
          // they will disappear for the length of the animation. By default it's
          // enabled in all browsers that support CSS3 Transitions except Android.
          markerZoomAnimation: true,
          // @option transform3DLimit: Number = 2^23
          // Defines the maximum size of a CSS translation transform. The default
          // value should not be changed unless a web browser positions layers in
          // the wrong place after doing a large `panBy`.
          transform3DLimit: 8388608,
          // Precision limit of a 32-bit float
          // @section Interaction Options
          // @option zoomSnap: Number = 1
          // Forces the map's zoom level to always be a multiple of this, particularly
          // right after a [`fitBounds()`](#map-fitbounds) or a pinch-zoom.
          // By default, the zoom level snaps to the nearest integer; lower values
          // (e.g. `0.5` or `0.1`) allow for greater granularity. A value of `0`
          // means the zoom level will not be snapped after `fitBounds` or a pinch-zoom.
          zoomSnap: 1,
          // @option zoomDelta: Number = 1
          // Controls how much the map's zoom level will change after a
          // [`zoomIn()`](#map-zoomin), [`zoomOut()`](#map-zoomout), pressing `+`
          // or `-` on the keyboard, or using the [zoom controls](#control-zoom).
          // Values smaller than `1` (e.g. `0.5`) allow for greater granularity.
          zoomDelta: 1,
          // @option trackResize: Boolean = true
          // Whether the map automatically handles browser window resize to update itself.
          trackResize: true
        },
        initialize: function(id, options) {
          options = setOptions(this, options);
          this._handlers = [];
          this._layers = {};
          this._zoomBoundLayers = {};
          this._sizeChanged = true;
          this._initContainer(id);
          this._initLayout();
          this._onResize = bind(this._onResize, this);
          this._initEvents();
          if (options.maxBounds) {
            this.setMaxBounds(options.maxBounds);
          }
          if (options.zoom !== void 0) {
            this._zoom = this._limitZoom(options.zoom);
          }
          if (options.center && options.zoom !== void 0) {
            this.setView(toLatLng(options.center), options.zoom, { reset: true });
          }
          this.callInitHooks();
          this._zoomAnimated = TRANSITION && Browser.any3d && !Browser.mobileOpera && this.options.zoomAnimation;
          if (this._zoomAnimated) {
            this._createAnimProxy();
            on(this._proxy, TRANSITION_END, this._catchTransitionEnd, this);
          }
          this._addLayers(this.options.layers);
        },
        // @section Methods for modifying map state
        // @method setView(center: LatLng, zoom: Number, options?: Zoom/pan options): this
        // Sets the view of the map (geographical center and zoom) with the given
        // animation options.
        setView: function(center, zoom2, options) {
          zoom2 = zoom2 === void 0 ? this._zoom : this._limitZoom(zoom2);
          center = this._limitCenter(toLatLng(center), zoom2, this.options.maxBounds);
          options = options || {};
          this._stop();
          if (this._loaded && !options.reset && options !== true) {
            if (options.animate !== void 0) {
              options.zoom = extend({ animate: options.animate }, options.zoom);
              options.pan = extend({ animate: options.animate, duration: options.duration }, options.pan);
            }
            var moved = this._zoom !== zoom2 ? this._tryAnimatedZoom && this._tryAnimatedZoom(center, zoom2, options.zoom) : this._tryAnimatedPan(center, options.pan);
            if (moved) {
              clearTimeout(this._sizeTimer);
              return this;
            }
          }
          this._resetView(center, zoom2, options.pan && options.pan.noMoveStart);
          return this;
        },
        // @method setZoom(zoom: Number, options?: Zoom/pan options): this
        // Sets the zoom of the map.
        setZoom: function(zoom2, options) {
          if (!this._loaded) {
            this._zoom = zoom2;
            return this;
          }
          return this.setView(this.getCenter(), zoom2, { zoom: options });
        },
        // @method zoomIn(delta?: Number, options?: Zoom options): this
        // Increases the zoom of the map by `delta` ([`zoomDelta`](#map-zoomdelta) by default).
        zoomIn: function(delta, options) {
          delta = delta || (Browser.any3d ? this.options.zoomDelta : 1);
          return this.setZoom(this._zoom + delta, options);
        },
        // @method zoomOut(delta?: Number, options?: Zoom options): this
        // Decreases the zoom of the map by `delta` ([`zoomDelta`](#map-zoomdelta) by default).
        zoomOut: function(delta, options) {
          delta = delta || (Browser.any3d ? this.options.zoomDelta : 1);
          return this.setZoom(this._zoom - delta, options);
        },
        // @method setZoomAround(latlng: LatLng, zoom: Number, options: Zoom options): this
        // Zooms the map while keeping a specified geographical point on the map
        // stationary (e.g. used internally for scroll zoom and double-click zoom).
        // @alternative
        // @method setZoomAround(offset: Point, zoom: Number, options: Zoom options): this
        // Zooms the map while keeping a specified pixel on the map (relative to the top-left corner) stationary.
        setZoomAround: function(latlng, zoom2, options) {
          var scale2 = this.getZoomScale(zoom2), viewHalf = this.getSize().divideBy(2), containerPoint = latlng instanceof Point ? latlng : this.latLngToContainerPoint(latlng), centerOffset = containerPoint.subtract(viewHalf).multiplyBy(1 - 1 / scale2), newCenter = this.containerPointToLatLng(viewHalf.add(centerOffset));
          return this.setView(newCenter, zoom2, { zoom: options });
        },
        _getBoundsCenterZoom: function(bounds, options) {
          options = options || {};
          bounds = bounds.getBounds ? bounds.getBounds() : toLatLngBounds(bounds);
          var paddingTL = toPoint(options.paddingTopLeft || options.padding || [0, 0]), paddingBR = toPoint(options.paddingBottomRight || options.padding || [0, 0]), zoom2 = this.getBoundsZoom(bounds, false, paddingTL.add(paddingBR));
          zoom2 = typeof options.maxZoom === "number" ? Math.min(options.maxZoom, zoom2) : zoom2;
          if (zoom2 === Infinity) {
            return {
              center: bounds.getCenter(),
              zoom: zoom2
            };
          }
          var paddingOffset = paddingBR.subtract(paddingTL).divideBy(2), swPoint = this.project(bounds.getSouthWest(), zoom2), nePoint = this.project(bounds.getNorthEast(), zoom2), center = this.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom2);
          return {
            center,
            zoom: zoom2
          };
        },
        // @method fitBounds(bounds: LatLngBounds, options?: fitBounds options): this
        // Sets a map view that contains the given geographical bounds with the
        // maximum zoom level possible.
        fitBounds: function(bounds, options) {
          bounds = toLatLngBounds(bounds);
          if (!bounds.isValid()) {
            throw new Error("Bounds are not valid.");
          }
          var target = this._getBoundsCenterZoom(bounds, options);
          return this.setView(target.center, target.zoom, options);
        },
        // @method fitWorld(options?: fitBounds options): this
        // Sets a map view that mostly contains the whole world with the maximum
        // zoom level possible.
        fitWorld: function(options) {
          return this.fitBounds([[-90, -180], [90, 180]], options);
        },
        // @method panTo(latlng: LatLng, options?: Pan options): this
        // Pans the map to a given center.
        panTo: function(center, options) {
          return this.setView(center, this._zoom, { pan: options });
        },
        // @method panBy(offset: Point, options?: Pan options): this
        // Pans the map by a given number of pixels (animated).
        panBy: function(offset, options) {
          offset = toPoint(offset).round();
          options = options || {};
          if (!offset.x && !offset.y) {
            return this.fire("moveend");
          }
          if (options.animate !== true && !this.getSize().contains(offset)) {
            this._resetView(this.unproject(this.project(this.getCenter()).add(offset)), this.getZoom());
            return this;
          }
          if (!this._panAnim) {
            this._panAnim = new PosAnimation();
            this._panAnim.on({
              "step": this._onPanTransitionStep,
              "end": this._onPanTransitionEnd
            }, this);
          }
          if (!options.noMoveStart) {
            this.fire("movestart");
          }
          if (options.animate !== false) {
            addClass(this._mapPane, "leaflet-pan-anim");
            var newPos = this._getMapPanePos().subtract(offset).round();
            this._panAnim.run(this._mapPane, newPos, options.duration || 0.25, options.easeLinearity);
          } else {
            this._rawPanBy(offset);
            this.fire("move").fire("moveend");
          }
          return this;
        },
        // @method flyTo(latlng: LatLng, zoom?: Number, options?: Zoom/pan options): this
        // Sets the view of the map (geographical center and zoom) performing a smooth
        // pan-zoom animation.
        flyTo: function(targetCenter, targetZoom, options) {
          options = options || {};
          if (options.animate === false || !Browser.any3d) {
            return this.setView(targetCenter, targetZoom, options);
          }
          this._stop();
          var from = this.project(this.getCenter()), to = this.project(targetCenter), size = this.getSize(), startZoom = this._zoom;
          targetCenter = toLatLng(targetCenter);
          targetZoom = targetZoom === void 0 ? startZoom : targetZoom;
          var w0 = Math.max(size.x, size.y), w1 = w0 * this.getZoomScale(startZoom, targetZoom), u1 = to.distanceTo(from) || 1, rho = 1.42, rho2 = rho * rho;
          function r2(i) {
            var s1 = i ? -1 : 1, s2 = i ? w1 : w0, t1 = w1 * w1 - w0 * w0 + s1 * rho2 * rho2 * u1 * u1, b1 = 2 * s2 * rho2 * u1, b = t1 / b1, sq = Math.sqrt(b * b + 1) - b;
            var log = sq < 1e-9 ? -18 : Math.log(sq);
            return log;
          }
          function sinh(n) {
            return (Math.exp(n) - Math.exp(-n)) / 2;
          }
          function cosh(n) {
            return (Math.exp(n) + Math.exp(-n)) / 2;
          }
          function tanh(n) {
            return sinh(n) / cosh(n);
          }
          var r0 = r2(0);
          function w(s) {
            return w0 * (cosh(r0) / cosh(r0 + rho * s));
          }
          function u(s) {
            return w0 * (cosh(r0) * tanh(r0 + rho * s) - sinh(r0)) / rho2;
          }
          function easeOut(t) {
            return 1 - Math.pow(1 - t, 1.5);
          }
          var start = Date.now(), S = (r2(1) - r0) / rho, duration = options.duration ? 1e3 * options.duration : 1e3 * S * 0.8;
          function frame() {
            var t = (Date.now() - start) / duration, s = easeOut(t) * S;
            if (t <= 1) {
              this._flyToFrame = requestAnimFrame(frame, this);
              this._move(
                this.unproject(from.add(to.subtract(from).multiplyBy(u(s) / u1)), startZoom),
                this.getScaleZoom(w0 / w(s), startZoom),
                { flyTo: true }
              );
            } else {
              this._move(targetCenter, targetZoom)._moveEnd(true);
            }
          }
          this._moveStart(true, options.noMoveStart);
          frame.call(this);
          return this;
        },
        // @method flyToBounds(bounds: LatLngBounds, options?: fitBounds options): this
        // Sets the view of the map with a smooth animation like [`flyTo`](#map-flyto),
        // but takes a bounds parameter like [`fitBounds`](#map-fitbounds).
        flyToBounds: function(bounds, options) {
          var target = this._getBoundsCenterZoom(bounds, options);
          return this.flyTo(target.center, target.zoom, options);
        },
        // @method setMaxBounds(bounds: LatLngBounds): this
        // Restricts the map view to the given bounds (see the [maxBounds](#map-maxbounds) option).
        setMaxBounds: function(bounds) {
          bounds = toLatLngBounds(bounds);
          if (this.listens("moveend", this._panInsideMaxBounds)) {
            this.off("moveend", this._panInsideMaxBounds);
          }
          if (!bounds.isValid()) {
            this.options.maxBounds = null;
            return this;
          }
          this.options.maxBounds = bounds;
          if (this._loaded) {
            this._panInsideMaxBounds();
          }
          return this.on("moveend", this._panInsideMaxBounds);
        },
        // @method setMinZoom(zoom: Number): this
        // Sets the lower limit for the available zoom levels (see the [minZoom](#map-minzoom) option).
        setMinZoom: function(zoom2) {
          var oldZoom = this.options.minZoom;
          this.options.minZoom = zoom2;
          if (this._loaded && oldZoom !== zoom2) {
            this.fire("zoomlevelschange");
            if (this.getZoom() < this.options.minZoom) {
              return this.setZoom(zoom2);
            }
          }
          return this;
        },
        // @method setMaxZoom(zoom: Number): this
        // Sets the upper limit for the available zoom levels (see the [maxZoom](#map-maxzoom) option).
        setMaxZoom: function(zoom2) {
          var oldZoom = this.options.maxZoom;
          this.options.maxZoom = zoom2;
          if (this._loaded && oldZoom !== zoom2) {
            this.fire("zoomlevelschange");
            if (this.getZoom() > this.options.maxZoom) {
              return this.setZoom(zoom2);
            }
          }
          return this;
        },
        // @method panInsideBounds(bounds: LatLngBounds, options?: Pan options): this
        // Pans the map to the closest view that would lie inside the given bounds (if it's not already), controlling the animation using the options specific, if any.
        panInsideBounds: function(bounds, options) {
          this._enforcingBounds = true;
          var center = this.getCenter(), newCenter = this._limitCenter(center, this._zoom, toLatLngBounds(bounds));
          if (!center.equals(newCenter)) {
            this.panTo(newCenter, options);
          }
          this._enforcingBounds = false;
          return this;
        },
        // @method panInside(latlng: LatLng, options?: padding options): this
        // Pans the map the minimum amount to make the `latlng` visible. Use
        // padding options to fit the display to more restricted bounds.
        // If `latlng` is already within the (optionally padded) display bounds,
        // the map will not be panned.
        panInside: function(latlng, options) {
          options = options || {};
          var paddingTL = toPoint(options.paddingTopLeft || options.padding || [0, 0]), paddingBR = toPoint(options.paddingBottomRight || options.padding || [0, 0]), pixelCenter = this.project(this.getCenter()), pixelPoint = this.project(latlng), pixelBounds = this.getPixelBounds(), paddedBounds = toBounds([pixelBounds.min.add(paddingTL), pixelBounds.max.subtract(paddingBR)]), paddedSize = paddedBounds.getSize();
          if (!paddedBounds.contains(pixelPoint)) {
            this._enforcingBounds = true;
            var centerOffset = pixelPoint.subtract(paddedBounds.getCenter());
            var offset = paddedBounds.extend(pixelPoint).getSize().subtract(paddedSize);
            pixelCenter.x += centerOffset.x < 0 ? -offset.x : offset.x;
            pixelCenter.y += centerOffset.y < 0 ? -offset.y : offset.y;
            this.panTo(this.unproject(pixelCenter), options);
            this._enforcingBounds = false;
          }
          return this;
        },
        // @method invalidateSize(options: Zoom/pan options): this
        // Checks if the map container size changed and updates the map if so —
        // call it after you've changed the map size dynamically, also animating
        // pan by default. If `options.pan` is `false`, panning will not occur.
        // If `options.debounceMoveend` is `true`, it will delay `moveend` event so
        // that it doesn't happen often even if the method is called many
        // times in a row.
        // @alternative
        // @method invalidateSize(animate: Boolean): this
        // Checks if the map container size changed and updates the map if so —
        // call it after you've changed the map size dynamically, also animating
        // pan by default.
        invalidateSize: function(options) {
          if (!this._loaded) {
            return this;
          }
          options = extend({
            animate: false,
            pan: true
          }, options === true ? { animate: true } : options);
          var oldSize = this.getSize();
          this._sizeChanged = true;
          this._lastCenter = null;
          var newSize = this.getSize(), oldCenter = oldSize.divideBy(2).round(), newCenter = newSize.divideBy(2).round(), offset = oldCenter.subtract(newCenter);
          if (!offset.x && !offset.y) {
            return this;
          }
          if (options.animate && options.pan) {
            this.panBy(offset);
          } else {
            if (options.pan) {
              this._rawPanBy(offset);
            }
            this.fire("move");
            if (options.debounceMoveend) {
              clearTimeout(this._sizeTimer);
              this._sizeTimer = setTimeout(bind(this.fire, this, "moveend"), 200);
            } else {
              this.fire("moveend");
            }
          }
          return this.fire("resize", {
            oldSize,
            newSize
          });
        },
        // @section Methods for modifying map state
        // @method stop(): this
        // Stops the currently running `panTo` or `flyTo` animation, if any.
        stop: function() {
          this.setZoom(this._limitZoom(this._zoom));
          if (!this.options.zoomSnap) {
            this.fire("viewreset");
          }
          return this._stop();
        },
        // @section Geolocation methods
        // @method locate(options?: Locate options): this
        // Tries to locate the user using the Geolocation API, firing a [`locationfound`](#map-locationfound)
        // event with location data on success or a [`locationerror`](#map-locationerror) event on failure,
        // and optionally sets the map view to the user's location with respect to
        // detection accuracy (or to the world view if geolocation failed).
        // Note that, if your page doesn't use HTTPS, this method will fail in
        // modern browsers ([Chrome 50 and newer](https://sites.google.com/a/chromium.org/dev/Home/chromium-security/deprecating-powerful-features-on-insecure-origins))
        // See `Locate options` for more details.
        locate: function(options) {
          options = this._locateOptions = extend({
            timeout: 1e4,
            watch: false
            // setView: false
            // maxZoom: <Number>
            // maximumAge: 0
            // enableHighAccuracy: false
          }, options);
          if (!("geolocation" in navigator)) {
            this._handleGeolocationError({
              code: 0,
              message: "Geolocation not supported."
            });
            return this;
          }
          var onResponse = bind(this._handleGeolocationResponse, this), onError = bind(this._handleGeolocationError, this);
          if (options.watch) {
            this._locationWatchId = navigator.geolocation.watchPosition(onResponse, onError, options);
          } else {
            navigator.geolocation.getCurrentPosition(onResponse, onError, options);
          }
          return this;
        },
        // @method stopLocate(): this
        // Stops watching location previously initiated by `map.locate({watch: true})`
        // and aborts resetting the map view if map.locate was called with
        // `{setView: true}`.
        stopLocate: function() {
          if (navigator.geolocation && navigator.geolocation.clearWatch) {
            navigator.geolocation.clearWatch(this._locationWatchId);
          }
          if (this._locateOptions) {
            this._locateOptions.setView = false;
          }
          return this;
        },
        _handleGeolocationError: function(error) {
          if (!this._container._leaflet_id) {
            return;
          }
          var c = error.code, message = error.message || (c === 1 ? "permission denied" : c === 2 ? "position unavailable" : "timeout");
          if (this._locateOptions.setView && !this._loaded) {
            this.fitWorld();
          }
          this.fire("locationerror", {
            code: c,
            message: "Geolocation error: " + message + "."
          });
        },
        _handleGeolocationResponse: function(pos) {
          if (!this._container._leaflet_id) {
            return;
          }
          var lat = pos.coords.latitude, lng = pos.coords.longitude, latlng = new LatLng(lat, lng), bounds = latlng.toBounds(pos.coords.accuracy * 2), options = this._locateOptions;
          if (options.setView) {
            var zoom2 = this.getBoundsZoom(bounds);
            this.setView(latlng, options.maxZoom ? Math.min(zoom2, options.maxZoom) : zoom2);
          }
          var data = {
            latlng,
            bounds,
            timestamp: pos.timestamp
          };
          for (var i in pos.coords) {
            if (typeof pos.coords[i] === "number") {
              data[i] = pos.coords[i];
            }
          }
          this.fire("locationfound", data);
        },
        // TODO Appropriate docs section?
        // @section Other Methods
        // @method addHandler(name: String, HandlerClass: Function): this
        // Adds a new `Handler` to the map, given its name and constructor function.
        addHandler: function(name, HandlerClass) {
          if (!HandlerClass) {
            return this;
          }
          var handler = this[name] = new HandlerClass(this);
          this._handlers.push(handler);
          if (this.options[name]) {
            handler.enable();
          }
          return this;
        },
        // @method remove(): this
        // Destroys the map and clears all related event listeners.
        remove: function() {
          this._initEvents(true);
          if (this.options.maxBounds) {
            this.off("moveend", this._panInsideMaxBounds);
          }
          if (this._containerId !== this._container._leaflet_id) {
            throw new Error("Map container is being reused by another instance");
          }
          try {
            delete this._container._leaflet_id;
            delete this._containerId;
          } catch (e) {
            this._container._leaflet_id = void 0;
            this._containerId = void 0;
          }
          if (this._locationWatchId !== void 0) {
            this.stopLocate();
          }
          this._stop();
          remove(this._mapPane);
          if (this._clearControlPos) {
            this._clearControlPos();
          }
          if (this._resizeRequest) {
            cancelAnimFrame(this._resizeRequest);
            this._resizeRequest = null;
          }
          this._clearHandlers();
          if (this._loaded) {
            this.fire("unload");
          }
          var i;
          for (i in this._layers) {
            this._layers[i].remove();
          }
          for (i in this._panes) {
            remove(this._panes[i]);
          }
          this._layers = [];
          this._panes = [];
          delete this._mapPane;
          delete this._renderer;
          return this;
        },
        // @section Other Methods
        // @method createPane(name: String, container?: HTMLElement): HTMLElement
        // Creates a new [map pane](#map-pane) with the given name if it doesn't exist already,
        // then returns it. The pane is created as a child of `container`, or
        // as a child of the main map pane if not set.
        createPane: function(name, container) {
          var className = "leaflet-pane" + (name ? " leaflet-" + name.replace("Pane", "") + "-pane" : ""), pane = create$1("div", className, container || this._mapPane);
          if (name) {
            this._panes[name] = pane;
          }
          return pane;
        },
        // @section Methods for Getting Map State
        // @method getCenter(): LatLng
        // Returns the geographical center of the map view
        getCenter: function() {
          this._checkIfLoaded();
          if (this._lastCenter && !this._moved()) {
            return this._lastCenter.clone();
          }
          return this.layerPointToLatLng(this._getCenterLayerPoint());
        },
        // @method getZoom(): Number
        // Returns the current zoom level of the map view
        getZoom: function() {
          return this._zoom;
        },
        // @method getBounds(): LatLngBounds
        // Returns the geographical bounds visible in the current map view
        getBounds: function() {
          var bounds = this.getPixelBounds(), sw = this.unproject(bounds.getBottomLeft()), ne = this.unproject(bounds.getTopRight());
          return new LatLngBounds(sw, ne);
        },
        // @method getMinZoom(): Number
        // Returns the minimum zoom level of the map (if set in the `minZoom` option of the map or of any layers), or `0` by default.
        getMinZoom: function() {
          return this.options.minZoom === void 0 ? this._layersMinZoom || 0 : this.options.minZoom;
        },
        // @method getMaxZoom(): Number
        // Returns the maximum zoom level of the map (if set in the `maxZoom` option of the map or of any layers).
        getMaxZoom: function() {
          return this.options.maxZoom === void 0 ? this._layersMaxZoom === void 0 ? Infinity : this._layersMaxZoom : this.options.maxZoom;
        },
        // @method getBoundsZoom(bounds: LatLngBounds, inside?: Boolean, padding?: Point): Number
        // Returns the maximum zoom level on which the given bounds fit to the map
        // view in its entirety. If `inside` (optional) is set to `true`, the method
        // instead returns the minimum zoom level on which the map view fits into
        // the given bounds in its entirety.
        getBoundsZoom: function(bounds, inside, padding) {
          bounds = toLatLngBounds(bounds);
          padding = toPoint(padding || [0, 0]);
          var zoom2 = this.getZoom() || 0, min = this.getMinZoom(), max = this.getMaxZoom(), nw = bounds.getNorthWest(), se = bounds.getSouthEast(), size = this.getSize().subtract(padding), boundsSize = toBounds(this.project(se, zoom2), this.project(nw, zoom2)).getSize(), snap = Browser.any3d ? this.options.zoomSnap : 1, scalex = size.x / boundsSize.x, scaley = size.y / boundsSize.y, scale2 = inside ? Math.max(scalex, scaley) : Math.min(scalex, scaley);
          zoom2 = this.getScaleZoom(scale2, zoom2);
          if (snap) {
            zoom2 = Math.round(zoom2 / (snap / 100)) * (snap / 100);
            zoom2 = inside ? Math.ceil(zoom2 / snap) * snap : Math.floor(zoom2 / snap) * snap;
          }
          return Math.max(min, Math.min(max, zoom2));
        },
        // @method getSize(): Point
        // Returns the current size of the map container (in pixels).
        getSize: function() {
          if (!this._size || this._sizeChanged) {
            this._size = new Point(
              this._container.clientWidth || 0,
              this._container.clientHeight || 0
            );
            this._sizeChanged = false;
          }
          return this._size.clone();
        },
        // @method getPixelBounds(): Bounds
        // Returns the bounds of the current map view in projected pixel
        // coordinates (sometimes useful in layer and overlay implementations).
        getPixelBounds: function(center, zoom2) {
          var topLeftPoint = this._getTopLeftPoint(center, zoom2);
          return new Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));
        },
        // TODO: Check semantics - isn't the pixel origin the 0,0 coord relative to
        // the map pane? "left point of the map layer" can be confusing, specially
        // since there can be negative offsets.
        // @method getPixelOrigin(): Point
        // Returns the projected pixel coordinates of the top left point of
        // the map layer (useful in custom layer and overlay implementations).
        getPixelOrigin: function() {
          this._checkIfLoaded();
          return this._pixelOrigin;
        },
        // @method getPixelWorldBounds(zoom?: Number): Bounds
        // Returns the world's bounds in pixel coordinates for zoom level `zoom`.
        // If `zoom` is omitted, the map's current zoom level is used.
        getPixelWorldBounds: function(zoom2) {
          return this.options.crs.getProjectedBounds(zoom2 === void 0 ? this.getZoom() : zoom2);
        },
        // @section Other Methods
        // @method getPane(pane: String|HTMLElement): HTMLElement
        // Returns a [map pane](#map-pane), given its name or its HTML element (its identity).
        getPane: function(pane) {
          return typeof pane === "string" ? this._panes[pane] : pane;
        },
        // @method getPanes(): Object
        // Returns a plain object containing the names of all [panes](#map-pane) as keys and
        // the panes as values.
        getPanes: function() {
          return this._panes;
        },
        // @method getContainer: HTMLElement
        // Returns the HTML element that contains the map.
        getContainer: function() {
          return this._container;
        },
        // @section Conversion Methods
        // @method getZoomScale(toZoom: Number, fromZoom: Number): Number
        // Returns the scale factor to be applied to a map transition from zoom level
        // `fromZoom` to `toZoom`. Used internally to help with zoom animations.
        getZoomScale: function(toZoom, fromZoom) {
          var crs = this.options.crs;
          fromZoom = fromZoom === void 0 ? this._zoom : fromZoom;
          return crs.scale(toZoom) / crs.scale(fromZoom);
        },
        // @method getScaleZoom(scale: Number, fromZoom: Number): Number
        // Returns the zoom level that the map would end up at, if it is at `fromZoom`
        // level and everything is scaled by a factor of `scale`. Inverse of
        // [`getZoomScale`](#map-getZoomScale).
        getScaleZoom: function(scale2, fromZoom) {
          var crs = this.options.crs;
          fromZoom = fromZoom === void 0 ? this._zoom : fromZoom;
          var zoom2 = crs.zoom(scale2 * crs.scale(fromZoom));
          return isNaN(zoom2) ? Infinity : zoom2;
        },
        // @method project(latlng: LatLng, zoom: Number): Point
        // Projects a geographical coordinate `LatLng` according to the projection
        // of the map's CRS, then scales it according to `zoom` and the CRS's
        // `Transformation`. The result is pixel coordinate relative to
        // the CRS origin.
        project: function(latlng, zoom2) {
          zoom2 = zoom2 === void 0 ? this._zoom : zoom2;
          return this.options.crs.latLngToPoint(toLatLng(latlng), zoom2);
        },
        // @method unproject(point: Point, zoom: Number): LatLng
        // Inverse of [`project`](#map-project).
        unproject: function(point, zoom2) {
          zoom2 = zoom2 === void 0 ? this._zoom : zoom2;
          return this.options.crs.pointToLatLng(toPoint(point), zoom2);
        },
        // @method layerPointToLatLng(point: Point): LatLng
        // Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
        // returns the corresponding geographical coordinate (for the current zoom level).
        layerPointToLatLng: function(point) {
          var projectedPoint = toPoint(point).add(this.getPixelOrigin());
          return this.unproject(projectedPoint);
        },
        // @method latLngToLayerPoint(latlng: LatLng): Point
        // Given a geographical coordinate, returns the corresponding pixel coordinate
        // relative to the [origin pixel](#map-getpixelorigin).
        latLngToLayerPoint: function(latlng) {
          var projectedPoint = this.project(toLatLng(latlng))._round();
          return projectedPoint._subtract(this.getPixelOrigin());
        },
        // @method wrapLatLng(latlng: LatLng): LatLng
        // Returns a `LatLng` where `lat` and `lng` has been wrapped according to the
        // map's CRS's `wrapLat` and `wrapLng` properties, if they are outside the
        // CRS's bounds.
        // By default this means longitude is wrapped around the dateline so its
        // value is between -180 and +180 degrees.
        wrapLatLng: function(latlng) {
          return this.options.crs.wrapLatLng(toLatLng(latlng));
        },
        // @method wrapLatLngBounds(bounds: LatLngBounds): LatLngBounds
        // Returns a `LatLngBounds` with the same size as the given one, ensuring that
        // its center is within the CRS's bounds.
        // By default this means the center longitude is wrapped around the dateline so its
        // value is between -180 and +180 degrees, and the majority of the bounds
        // overlaps the CRS's bounds.
        wrapLatLngBounds: function(latlng) {
          return this.options.crs.wrapLatLngBounds(toLatLngBounds(latlng));
        },
        // @method distance(latlng1: LatLng, latlng2: LatLng): Number
        // Returns the distance between two geographical coordinates according to
        // the map's CRS. By default this measures distance in meters.
        distance: function(latlng1, latlng2) {
          return this.options.crs.distance(toLatLng(latlng1), toLatLng(latlng2));
        },
        // @method containerPointToLayerPoint(point: Point): Point
        // Given a pixel coordinate relative to the map container, returns the corresponding
        // pixel coordinate relative to the [origin pixel](#map-getpixelorigin).
        containerPointToLayerPoint: function(point) {
          return toPoint(point).subtract(this._getMapPanePos());
        },
        // @method layerPointToContainerPoint(point: Point): Point
        // Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
        // returns the corresponding pixel coordinate relative to the map container.
        layerPointToContainerPoint: function(point) {
          return toPoint(point).add(this._getMapPanePos());
        },
        // @method containerPointToLatLng(point: Point): LatLng
        // Given a pixel coordinate relative to the map container, returns
        // the corresponding geographical coordinate (for the current zoom level).
        containerPointToLatLng: function(point) {
          var layerPoint = this.containerPointToLayerPoint(toPoint(point));
          return this.layerPointToLatLng(layerPoint);
        },
        // @method latLngToContainerPoint(latlng: LatLng): Point
        // Given a geographical coordinate, returns the corresponding pixel coordinate
        // relative to the map container.
        latLngToContainerPoint: function(latlng) {
          return this.layerPointToContainerPoint(this.latLngToLayerPoint(toLatLng(latlng)));
        },
        // @method mouseEventToContainerPoint(ev: MouseEvent): Point
        // Given a MouseEvent object, returns the pixel coordinate relative to the
        // map container where the event took place.
        mouseEventToContainerPoint: function(e) {
          return getMousePosition(e, this._container);
        },
        // @method mouseEventToLayerPoint(ev: MouseEvent): Point
        // Given a MouseEvent object, returns the pixel coordinate relative to
        // the [origin pixel](#map-getpixelorigin) where the event took place.
        mouseEventToLayerPoint: function(e) {
          return this.containerPointToLayerPoint(this.mouseEventToContainerPoint(e));
        },
        // @method mouseEventToLatLng(ev: MouseEvent): LatLng
        // Given a MouseEvent object, returns geographical coordinate where the
        // event took place.
        mouseEventToLatLng: function(e) {
          return this.layerPointToLatLng(this.mouseEventToLayerPoint(e));
        },
        // map initialization methods
        _initContainer: function(id) {
          var container = this._container = get(id);
          if (!container) {
            throw new Error("Map container not found.");
          } else if (container._leaflet_id) {
            throw new Error("Map container is already initialized.");
          }
          on(container, "scroll", this._onScroll, this);
          this._containerId = stamp(container);
        },
        _initLayout: function() {
          var container = this._container;
          this._fadeAnimated = this.options.fadeAnimation && Browser.any3d;
          addClass(container, "leaflet-container" + (Browser.touch ? " leaflet-touch" : "") + (Browser.retina ? " leaflet-retina" : "") + (Browser.ielt9 ? " leaflet-oldie" : "") + (Browser.safari ? " leaflet-safari" : "") + (this._fadeAnimated ? " leaflet-fade-anim" : ""));
          var position = getStyle(container, "position");
          if (position !== "absolute" && position !== "relative" && position !== "fixed" && position !== "sticky") {
            container.style.position = "relative";
          }
          this._initPanes();
          if (this._initControlPos) {
            this._initControlPos();
          }
        },
        _initPanes: function() {
          var panes = this._panes = {};
          this._paneRenderers = {};
          this._mapPane = this.createPane("mapPane", this._container);
          setPosition(this._mapPane, new Point(0, 0));
          this.createPane("tilePane");
          this.createPane("overlayPane");
          this.createPane("shadowPane");
          this.createPane("markerPane");
          this.createPane("tooltipPane");
          this.createPane("popupPane");
          if (!this.options.markerZoomAnimation) {
            addClass(panes.markerPane, "leaflet-zoom-hide");
            addClass(panes.shadowPane, "leaflet-zoom-hide");
          }
        },
        // private methods that modify map state
        // @section Map state change events
        _resetView: function(center, zoom2, noMoveStart) {
          setPosition(this._mapPane, new Point(0, 0));
          var loading = !this._loaded;
          this._loaded = true;
          zoom2 = this._limitZoom(zoom2);
          this.fire("viewprereset");
          var zoomChanged = this._zoom !== zoom2;
          this._moveStart(zoomChanged, noMoveStart)._move(center, zoom2)._moveEnd(zoomChanged);
          this.fire("viewreset");
          if (loading) {
            this.fire("load");
          }
        },
        _moveStart: function(zoomChanged, noMoveStart) {
          if (zoomChanged) {
            this.fire("zoomstart");
          }
          if (!noMoveStart) {
            this.fire("movestart");
          }
          return this;
        },
        _move: function(center, zoom2, data, supressEvent) {
          if (zoom2 === void 0) {
            zoom2 = this._zoom;
          }
          var zoomChanged = this._zoom !== zoom2;
          this._zoom = zoom2;
          this._lastCenter = center;
          this._pixelOrigin = this._getNewPixelOrigin(center);
          if (!supressEvent) {
            if (zoomChanged || data && data.pinch) {
              this.fire("zoom", data);
            }
            this.fire("move", data);
          } else if (data && data.pinch) {
            this.fire("zoom", data);
          }
          return this;
        },
        _moveEnd: function(zoomChanged) {
          if (zoomChanged) {
            this.fire("zoomend");
          }
          return this.fire("moveend");
        },
        _stop: function() {
          cancelAnimFrame(this._flyToFrame);
          if (this._panAnim) {
            this._panAnim.stop();
          }
          return this;
        },
        _rawPanBy: function(offset) {
          setPosition(this._mapPane, this._getMapPanePos().subtract(offset));
        },
        _getZoomSpan: function() {
          return this.getMaxZoom() - this.getMinZoom();
        },
        _panInsideMaxBounds: function() {
          if (!this._enforcingBounds) {
            this.panInsideBounds(this.options.maxBounds);
          }
        },
        _checkIfLoaded: function() {
          if (!this._loaded) {
            throw new Error("Set map center and zoom first.");
          }
        },
        // DOM event handling
        // @section Interaction events
        _initEvents: function(remove2) {
          this._targets = {};
          this._targets[stamp(this._container)] = this;
          var onOff = remove2 ? off : on;
          onOff(this._container, "click dblclick mousedown mouseup mouseover mouseout mousemove contextmenu keypress keydown keyup", this._handleDOMEvent, this);
          if (this.options.trackResize) {
            onOff(window, "resize", this._onResize, this);
          }
          if (Browser.any3d && this.options.transform3DLimit) {
            (remove2 ? this.off : this.on).call(this, "moveend", this._onMoveEnd);
          }
        },
        _onResize: function() {
          cancelAnimFrame(this._resizeRequest);
          this._resizeRequest = requestAnimFrame(
            function() {
              this.invalidateSize({ debounceMoveend: true });
            },
            this
          );
        },
        _onScroll: function() {
          this._container.scrollTop = 0;
          this._container.scrollLeft = 0;
        },
        _onMoveEnd: function() {
          var pos = this._getMapPanePos();
          if (Math.max(Math.abs(pos.x), Math.abs(pos.y)) >= this.options.transform3DLimit) {
            this._resetView(this.getCenter(), this.getZoom());
          }
        },
        _findEventTargets: function(e, type) {
          var targets = [], target, isHover = type === "mouseout" || type === "mouseover", src = e.target || e.srcElement, dragging = false;
          while (src) {
            target = this._targets[stamp(src)];
            if (target && (type === "click" || type === "preclick") && this._draggableMoved(target)) {
              dragging = true;
              break;
            }
            if (target && target.listens(type, true)) {
              if (isHover && !isExternalTarget(src, e)) {
                break;
              }
              targets.push(target);
              if (isHover) {
                break;
              }
            }
            if (src === this._container) {
              break;
            }
            src = src.parentNode;
          }
          if (!targets.length && !dragging && !isHover && this.listens(type, true)) {
            targets = [this];
          }
          return targets;
        },
        _isClickDisabled: function(el) {
          while (el && el !== this._container) {
            if (el["_leaflet_disable_click"]) {
              return true;
            }
            el = el.parentNode;
          }
        },
        _handleDOMEvent: function(e) {
          var el = e.target || e.srcElement;
          if (!this._loaded || el["_leaflet_disable_events"] || e.type === "click" && this._isClickDisabled(el)) {
            return;
          }
          var type = e.type;
          if (type === "mousedown") {
            preventOutline(el);
          }
          this._fireDOMEvent(e, type);
        },
        _mouseEvents: ["click", "dblclick", "mouseover", "mouseout", "contextmenu"],
        _fireDOMEvent: function(e, type, canvasTargets) {
          if (e.type === "click") {
            var synth = extend({}, e);
            synth.type = "preclick";
            this._fireDOMEvent(synth, synth.type, canvasTargets);
          }
          var targets = this._findEventTargets(e, type);
          if (canvasTargets) {
            var filtered = [];
            for (var i = 0; i < canvasTargets.length; i++) {
              if (canvasTargets[i].listens(type, true)) {
                filtered.push(canvasTargets[i]);
              }
            }
            targets = filtered.concat(targets);
          }
          if (!targets.length) {
            return;
          }
          if (type === "contextmenu") {
            preventDefault(e);
          }
          var target = targets[0];
          var data = {
            originalEvent: e
          };
          if (e.type !== "keypress" && e.type !== "keydown" && e.type !== "keyup") {
            var isMarker = target.getLatLng && (!target._radius || target._radius <= 10);
            data.containerPoint = isMarker ? this.latLngToContainerPoint(target.getLatLng()) : this.mouseEventToContainerPoint(e);
            data.layerPoint = this.containerPointToLayerPoint(data.containerPoint);
            data.latlng = isMarker ? target.getLatLng() : this.layerPointToLatLng(data.layerPoint);
          }
          for (i = 0; i < targets.length; i++) {
            targets[i].fire(type, data, true);
            if (data.originalEvent._stopped || targets[i].options.bubblingMouseEvents === false && indexOf(this._mouseEvents, type) !== -1) {
              return;
            }
          }
        },
        _draggableMoved: function(obj) {
          obj = obj.dragging && obj.dragging.enabled() ? obj : this;
          return obj.dragging && obj.dragging.moved() || this.boxZoom && this.boxZoom.moved();
        },
        _clearHandlers: function() {
          for (var i = 0, len = this._handlers.length; i < len; i++) {
            this._handlers[i].disable();
          }
        },
        // @section Other Methods
        // @method whenReady(fn: Function, context?: Object): this
        // Runs the given function `fn` when the map gets initialized with
        // a view (center and zoom) and at least one layer, or immediately
        // if it's already initialized, optionally passing a function context.
        whenReady: function(callback, context) {
          if (this._loaded) {
            callback.call(context || this, { target: this });
          } else {
            this.on("load", callback, context);
          }
          return this;
        },
        // private methods for getting map state
        _getMapPanePos: function() {
          return getPosition(this._mapPane) || new Point(0, 0);
        },
        _moved: function() {
          var pos = this._getMapPanePos();
          return pos && !pos.equals([0, 0]);
        },
        _getTopLeftPoint: function(center, zoom2) {
          var pixelOrigin = center && zoom2 !== void 0 ? this._getNewPixelOrigin(center, zoom2) : this.getPixelOrigin();
          return pixelOrigin.subtract(this._getMapPanePos());
        },
        _getNewPixelOrigin: function(center, zoom2) {
          var viewHalf = this.getSize()._divideBy(2);
          return this.project(center, zoom2)._subtract(viewHalf)._add(this._getMapPanePos())._round();
        },
        _latLngToNewLayerPoint: function(latlng, zoom2, center) {
          var topLeft = this._getNewPixelOrigin(center, zoom2);
          return this.project(latlng, zoom2)._subtract(topLeft);
        },
        _latLngBoundsToNewLayerBounds: function(latLngBounds, zoom2, center) {
          var topLeft = this._getNewPixelOrigin(center, zoom2);
          return toBounds([
            this.project(latLngBounds.getSouthWest(), zoom2)._subtract(topLeft),
            this.project(latLngBounds.getNorthWest(), zoom2)._subtract(topLeft),
            this.project(latLngBounds.getSouthEast(), zoom2)._subtract(topLeft),
            this.project(latLngBounds.getNorthEast(), zoom2)._subtract(topLeft)
          ]);
        },
        // layer point of the current center
        _getCenterLayerPoint: function() {
          return this.containerPointToLayerPoint(this.getSize()._divideBy(2));
        },
        // offset of the specified place to the current center in pixels
        _getCenterOffset: function(latlng) {
          return this.latLngToLayerPoint(latlng).subtract(this._getCenterLayerPoint());
        },
        // adjust center for view to get inside bounds
        _limitCenter: function(center, zoom2, bounds) {
          if (!bounds) {
            return center;
          }
          var centerPoint = this.project(center, zoom2), viewHalf = this.getSize().divideBy(2), viewBounds = new Bounds(centerPoint.subtract(viewHalf), centerPoint.add(viewHalf)), offset = this._getBoundsOffset(viewBounds, bounds, zoom2);
          if (Math.abs(offset.x) <= 1 && Math.abs(offset.y) <= 1) {
            return center;
          }
          return this.unproject(centerPoint.add(offset), zoom2);
        },
        // adjust offset for view to get inside bounds
        _limitOffset: function(offset, bounds) {
          if (!bounds) {
            return offset;
          }
          var viewBounds = this.getPixelBounds(), newBounds = new Bounds(viewBounds.min.add(offset), viewBounds.max.add(offset));
          return offset.add(this._getBoundsOffset(newBounds, bounds));
        },
        // returns offset needed for pxBounds to get inside maxBounds at a specified zoom
        _getBoundsOffset: function(pxBounds, maxBounds, zoom2) {
          var projectedMaxBounds = toBounds(
            this.project(maxBounds.getNorthEast(), zoom2),
            this.project(maxBounds.getSouthWest(), zoom2)
          ), minOffset = projectedMaxBounds.min.subtract(pxBounds.min), maxOffset = projectedMaxBounds.max.subtract(pxBounds.max), dx = this._rebound(minOffset.x, -maxOffset.x), dy = this._rebound(minOffset.y, -maxOffset.y);
          return new Point(dx, dy);
        },
        _rebound: function(left, right) {
          return left + right > 0 ? Math.round(left - right) / 2 : Math.max(0, Math.ceil(left)) - Math.max(0, Math.floor(right));
        },
        _limitZoom: function(zoom2) {
          var min = this.getMinZoom(), max = this.getMaxZoom(), snap = Browser.any3d ? this.options.zoomSnap : 1;
          if (snap) {
            zoom2 = Math.round(zoom2 / snap) * snap;
          }
          return Math.max(min, Math.min(max, zoom2));
        },
        _onPanTransitionStep: function() {
          this.fire("move");
        },
        _onPanTransitionEnd: function() {
          removeClass(this._mapPane, "leaflet-pan-anim");
          this.fire("moveend");
        },
        _tryAnimatedPan: function(center, options) {
          var offset = this._getCenterOffset(center)._trunc();
          if ((options && options.animate) !== true && !this.getSize().contains(offset)) {
            return false;
          }
          this.panBy(offset, options);
          return true;
        },
        _createAnimProxy: function() {
          var proxy = this._proxy = create$1("div", "leaflet-proxy leaflet-zoom-animated");
          this._panes.mapPane.appendChild(proxy);
          this.on("zoomanim", function(e) {
            var prop = TRANSFORM, transform = this._proxy.style[prop];
            setTransform(this._proxy, this.project(e.center, e.zoom), this.getZoomScale(e.zoom, 1));
            if (transform === this._proxy.style[prop] && this._animatingZoom) {
              this._onZoomTransitionEnd();
            }
          }, this);
          this.on("load moveend", this._animMoveEnd, this);
          this._on("unload", this._destroyAnimProxy, this);
        },
        _destroyAnimProxy: function() {
          remove(this._proxy);
          this.off("load moveend", this._animMoveEnd, this);
          delete this._proxy;
        },
        _animMoveEnd: function() {
          var c = this.getCenter(), z = this.getZoom();
          setTransform(this._proxy, this.project(c, z), this.getZoomScale(z, 1));
        },
        _catchTransitionEnd: function(e) {
          if (this._animatingZoom && e.propertyName.indexOf("transform") >= 0) {
            this._onZoomTransitionEnd();
          }
        },
        _nothingToAnimate: function() {
          return !this._container.getElementsByClassName("leaflet-zoom-animated").length;
        },
        _tryAnimatedZoom: function(center, zoom2, options) {
          if (this._animatingZoom) {
            return true;
          }
          options = options || {};
          if (!this._zoomAnimated || options.animate === false || this._nothingToAnimate() || Math.abs(zoom2 - this._zoom) > this.options.zoomAnimationThreshold) {
            return false;
          }
          var scale2 = this.getZoomScale(zoom2), offset = this._getCenterOffset(center)._divideBy(1 - 1 / scale2);
          if (options.animate !== true && !this.getSize().contains(offset)) {
            return false;
          }
          requestAnimFrame(function() {
            this._moveStart(true, options.noMoveStart || false)._animateZoom(center, zoom2, true);
          }, this);
          return true;
        },
        _animateZoom: function(center, zoom2, startAnim, noUpdate) {
          if (!this._mapPane) {
            return;
          }
          if (startAnim) {
            this._animatingZoom = true;
            this._animateToCenter = center;
            this._animateToZoom = zoom2;
            addClass(this._mapPane, "leaflet-zoom-anim");
          }
          this.fire("zoomanim", {
            center,
            zoom: zoom2,
            noUpdate
          });
          if (!this._tempFireZoomEvent) {
            this._tempFireZoomEvent = this._zoom !== this._animateToZoom;
          }
          this._move(this._animateToCenter, this._animateToZoom, void 0, true);
          setTimeout(bind(this._onZoomTransitionEnd, this), 250);
        },
        _onZoomTransitionEnd: function() {
          if (!this._animatingZoom) {
            return;
          }
          if (this._mapPane) {
            removeClass(this._mapPane, "leaflet-zoom-anim");
          }
          this._animatingZoom = false;
          this._move(this._animateToCenter, this._animateToZoom, void 0, true);
          if (this._tempFireZoomEvent) {
            this.fire("zoom");
          }
          delete this._tempFireZoomEvent;
          this.fire("move");
          this._moveEnd(true);
        }
      });
      function createMap(id, options) {
        return new Map2(id, options);
      }
      var Control = Class.extend({
        // @section
        // @aka Control Options
        options: {
          // @option position: String = 'topright'
          // The position of the control (one of the map corners). Possible values are `'topleft'`,
          // `'topright'`, `'bottomleft'` or `'bottomright'`
          position: "topright"
        },
        initialize: function(options) {
          setOptions(this, options);
        },
        /* @section
         * Classes extending L.Control will inherit the following methods:
         *
         * @method getPosition: string
         * Returns the position of the control.
         */
        getPosition: function() {
          return this.options.position;
        },
        // @method setPosition(position: string): this
        // Sets the position of the control.
        setPosition: function(position) {
          var map = this._map;
          if (map) {
            map.removeControl(this);
          }
          this.options.position = position;
          if (map) {
            map.addControl(this);
          }
          return this;
        },
        // @method getContainer: HTMLElement
        // Returns the HTMLElement that contains the control.
        getContainer: function() {
          return this._container;
        },
        // @method addTo(map: Map): this
        // Adds the control to the given map.
        addTo: function(map) {
          this.remove();
          this._map = map;
          var container = this._container = this.onAdd(map), pos = this.getPosition(), corner = map._controlCorners[pos];
          addClass(container, "leaflet-control");
          if (pos.indexOf("bottom") !== -1) {
            corner.insertBefore(container, corner.firstChild);
          } else {
            corner.appendChild(container);
          }
          this._map.on("unload", this.remove, this);
          return this;
        },
        // @method remove: this
        // Removes the control from the map it is currently active on.
        remove: function() {
          if (!this._map) {
            return this;
          }
          remove(this._container);
          if (this.onRemove) {
            this.onRemove(this._map);
          }
          this._map.off("unload", this.remove, this);
          this._map = null;
          return this;
        },
        _refocusOnMap: function(e) {
          if (this._map && e && e.screenX > 0 && e.screenY > 0) {
            this._map.getContainer().focus();
          }
        }
      });
      var control = function(options) {
        return new Control(options);
      };
      Map2.include({
        // @method addControl(control: Control): this
        // Adds the given control to the map
        addControl: function(control2) {
          control2.addTo(this);
          return this;
        },
        // @method removeControl(control: Control): this
        // Removes the given control from the map
        removeControl: function(control2) {
          control2.remove();
          return this;
        },
        _initControlPos: function() {
          var corners = this._controlCorners = {}, l = "leaflet-", container = this._controlContainer = create$1("div", l + "control-container", this._container);
          function createCorner(vSide, hSide) {
            var className = l + vSide + " " + l + hSide;
            corners[vSide + hSide] = create$1("div", className, container);
          }
          createCorner("top", "left");
          createCorner("top", "right");
          createCorner("bottom", "left");
          createCorner("bottom", "right");
        },
        _clearControlPos: function() {
          for (var i in this._controlCorners) {
            remove(this._controlCorners[i]);
          }
          remove(this._controlContainer);
          delete this._controlCorners;
          delete this._controlContainer;
        }
      });
      var Layers = Control.extend({
        // @section
        // @aka Control.Layers options
        options: {
          // @option collapsed: Boolean = true
          // If `true`, the control will be collapsed into an icon and expanded on mouse hover, touch, or keyboard activation.
          collapsed: true,
          position: "topright",
          // @option autoZIndex: Boolean = true
          // If `true`, the control will assign zIndexes in increasing order to all of its layers so that the order is preserved when switching them on/off.
          autoZIndex: true,
          // @option hideSingleBase: Boolean = false
          // If `true`, the base layers in the control will be hidden when there is only one.
          hideSingleBase: false,
          // @option sortLayers: Boolean = false
          // Whether to sort the layers. When `false`, layers will keep the order
          // in which they were added to the control.
          sortLayers: false,
          // @option sortFunction: Function = *
          // A [compare function](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
          // that will be used for sorting the layers, when `sortLayers` is `true`.
          // The function receives both the `L.Layer` instances and their names, as in
          // `sortFunction(layerA, layerB, nameA, nameB)`.
          // By default, it sorts layers alphabetically by their name.
          sortFunction: function(layerA, layerB, nameA, nameB) {
            return nameA < nameB ? -1 : nameB < nameA ? 1 : 0;
          }
        },
        initialize: function(baseLayers, overlays, options) {
          setOptions(this, options);
          this._layerControlInputs = [];
          this._layers = [];
          this._lastZIndex = 0;
          this._handlingClick = false;
          this._preventClick = false;
          for (var i in baseLayers) {
            this._addLayer(baseLayers[i], i);
          }
          for (i in overlays) {
            this._addLayer(overlays[i], i, true);
          }
        },
        onAdd: function(map) {
          this._initLayout();
          this._update();
          this._map = map;
          map.on("zoomend", this._checkDisabledLayers, this);
          for (var i = 0; i < this._layers.length; i++) {
            this._layers[i].layer.on("add remove", this._onLayerChange, this);
          }
          return this._container;
        },
        addTo: function(map) {
          Control.prototype.addTo.call(this, map);
          return this._expandIfNotCollapsed();
        },
        onRemove: function() {
          this._map.off("zoomend", this._checkDisabledLayers, this);
          for (var i = 0; i < this._layers.length; i++) {
            this._layers[i].layer.off("add remove", this._onLayerChange, this);
          }
        },
        // @method addBaseLayer(layer: Layer, name: String): this
        // Adds a base layer (radio button entry) with the given name to the control.
        addBaseLayer: function(layer, name) {
          this._addLayer(layer, name);
          return this._map ? this._update() : this;
        },
        // @method addOverlay(layer: Layer, name: String): this
        // Adds an overlay (checkbox entry) with the given name to the control.
        addOverlay: function(layer, name) {
          this._addLayer(layer, name, true);
          return this._map ? this._update() : this;
        },
        // @method removeLayer(layer: Layer): this
        // Remove the given layer from the control.
        removeLayer: function(layer) {
          layer.off("add remove", this._onLayerChange, this);
          var obj = this._getLayer(stamp(layer));
          if (obj) {
            this._layers.splice(this._layers.indexOf(obj), 1);
          }
          return this._map ? this._update() : this;
        },
        // @method expand(): this
        // Expand the control container if collapsed.
        expand: function() {
          addClass(this._container, "leaflet-control-layers-expanded");
          this._section.style.height = null;
          var acceptableHeight = this._map.getSize().y - (this._container.offsetTop + 50);
          if (acceptableHeight < this._section.clientHeight) {
            addClass(this._section, "leaflet-control-layers-scrollbar");
            this._section.style.height = acceptableHeight + "px";
          } else {
            removeClass(this._section, "leaflet-control-layers-scrollbar");
          }
          this._checkDisabledLayers();
          return this;
        },
        // @method collapse(): this
        // Collapse the control container if expanded.
        collapse: function() {
          removeClass(this._container, "leaflet-control-layers-expanded");
          return this;
        },
        _initLayout: function() {
          var className = "leaflet-control-layers", container = this._container = create$1("div", className), collapsed = this.options.collapsed;
          container.setAttribute("aria-haspopup", true);
          disableClickPropagation(container);
          disableScrollPropagation(container);
          var section = this._section = create$1("section", className + "-list");
          if (collapsed) {
            this._map.on("click", this.collapse, this);
            on(container, {
              mouseenter: this._expandSafely,
              mouseleave: this.collapse
            }, this);
          }
          var link = this._layersLink = create$1("a", className + "-toggle", container);
          link.href = "#";
          link.title = "Layers";
          link.setAttribute("role", "button");
          on(link, {
            keydown: function(e) {
              if (e.keyCode === 13) {
                this._expandSafely();
              }
            },
            // Certain screen readers intercept the key event and instead send a click event
            click: function(e) {
              preventDefault(e);
              this._expandSafely();
            }
          }, this);
          if (!collapsed) {
            this.expand();
          }
          this._baseLayersList = create$1("div", className + "-base", section);
          this._separator = create$1("div", className + "-separator", section);
          this._overlaysList = create$1("div", className + "-overlays", section);
          container.appendChild(section);
        },
        _getLayer: function(id) {
          for (var i = 0; i < this._layers.length; i++) {
            if (this._layers[i] && stamp(this._layers[i].layer) === id) {
              return this._layers[i];
            }
          }
        },
        _addLayer: function(layer, name, overlay) {
          if (this._map) {
            layer.on("add remove", this._onLayerChange, this);
          }
          this._layers.push({
            layer,
            name,
            overlay
          });
          if (this.options.sortLayers) {
            this._layers.sort(bind(function(a, b) {
              return this.options.sortFunction(a.layer, b.layer, a.name, b.name);
            }, this));
          }
          if (this.options.autoZIndex && layer.setZIndex) {
            this._lastZIndex++;
            layer.setZIndex(this._lastZIndex);
          }
          this._expandIfNotCollapsed();
        },
        _update: function() {
          if (!this._container) {
            return this;
          }
          empty(this._baseLayersList);
          empty(this._overlaysList);
          this._layerControlInputs = [];
          var baseLayersPresent, overlaysPresent, i, obj, baseLayersCount = 0;
          for (i = 0; i < this._layers.length; i++) {
            obj = this._layers[i];
            this._addItem(obj);
            overlaysPresent = overlaysPresent || obj.overlay;
            baseLayersPresent = baseLayersPresent || !obj.overlay;
            baseLayersCount += !obj.overlay ? 1 : 0;
          }
          if (this.options.hideSingleBase) {
            baseLayersPresent = baseLayersPresent && baseLayersCount > 1;
            this._baseLayersList.style.display = baseLayersPresent ? "" : "none";
          }
          this._separator.style.display = overlaysPresent && baseLayersPresent ? "" : "none";
          return this;
        },
        _onLayerChange: function(e) {
          if (!this._handlingClick) {
            this._update();
          }
          var obj = this._getLayer(stamp(e.target));
          var type = obj.overlay ? e.type === "add" ? "overlayadd" : "overlayremove" : e.type === "add" ? "baselayerchange" : null;
          if (type) {
            this._map.fire(type, obj);
          }
        },
        // IE7 bugs out if you create a radio dynamically, so you have to do it this hacky way (see https://stackoverflow.com/a/119079)
        _createRadioElement: function(name, checked) {
          var radioHtml = '<input type="radio" class="leaflet-control-layers-selector" name="' + name + '"' + (checked ? ' checked="checked"' : "") + "/>";
          var radioFragment = document.createElement("div");
          radioFragment.innerHTML = radioHtml;
          return radioFragment.firstChild;
        },
        _addItem: function(obj) {
          var label = document.createElement("label"), checked = this._map.hasLayer(obj.layer), input;
          if (obj.overlay) {
            input = document.createElement("input");
            input.type = "checkbox";
            input.className = "leaflet-control-layers-selector";
            input.defaultChecked = checked;
          } else {
            input = this._createRadioElement("leaflet-base-layers_" + stamp(this), checked);
          }
          this._layerControlInputs.push(input);
          input.layerId = stamp(obj.layer);
          on(input, "click", this._onInputClick, this);
          var name = document.createElement("span");
          name.innerHTML = " " + obj.name;
          var holder = document.createElement("span");
          label.appendChild(holder);
          holder.appendChild(input);
          holder.appendChild(name);
          var container = obj.overlay ? this._overlaysList : this._baseLayersList;
          container.appendChild(label);
          this._checkDisabledLayers();
          return label;
        },
        _onInputClick: function() {
          if (this._preventClick) {
            return;
          }
          var inputs = this._layerControlInputs, input, layer;
          var addedLayers = [], removedLayers = [];
          this._handlingClick = true;
          for (var i = inputs.length - 1; i >= 0; i--) {
            input = inputs[i];
            layer = this._getLayer(input.layerId).layer;
            if (input.checked) {
              addedLayers.push(layer);
            } else if (!input.checked) {
              removedLayers.push(layer);
            }
          }
          for (i = 0; i < removedLayers.length; i++) {
            if (this._map.hasLayer(removedLayers[i])) {
              this._map.removeLayer(removedLayers[i]);
            }
          }
          for (i = 0; i < addedLayers.length; i++) {
            if (!this._map.hasLayer(addedLayers[i])) {
              this._map.addLayer(addedLayers[i]);
            }
          }
          this._handlingClick = false;
          this._refocusOnMap();
        },
        _checkDisabledLayers: function() {
          var inputs = this._layerControlInputs, input, layer, zoom2 = this._map.getZoom();
          for (var i = inputs.length - 1; i >= 0; i--) {
            input = inputs[i];
            layer = this._getLayer(input.layerId).layer;
            input.disabled = layer.options.minZoom !== void 0 && zoom2 < layer.options.minZoom || layer.options.maxZoom !== void 0 && zoom2 > layer.options.maxZoom;
          }
        },
        _expandIfNotCollapsed: function() {
          if (this._map && !this.options.collapsed) {
            this.expand();
          }
          return this;
        },
        _expandSafely: function() {
          var section = this._section;
          this._preventClick = true;
          on(section, "click", preventDefault);
          this.expand();
          var that = this;
          setTimeout(function() {
            off(section, "click", preventDefault);
            that._preventClick = false;
          });
        }
      });
      var layers = function(baseLayers, overlays, options) {
        return new Layers(baseLayers, overlays, options);
      };
      var Zoom = Control.extend({
        // @section
        // @aka Control.Zoom options
        options: {
          position: "topleft",
          // @option zoomInText: String = '<span aria-hidden="true">+</span>'
          // The text set on the 'zoom in' button.
          zoomInText: '<span aria-hidden="true">+</span>',
          // @option zoomInTitle: String = 'Zoom in'
          // The title set on the 'zoom in' button.
          zoomInTitle: "Zoom in",
          // @option zoomOutText: String = '<span aria-hidden="true">&#x2212;</span>'
          // The text set on the 'zoom out' button.
          zoomOutText: '<span aria-hidden="true">&#x2212;</span>',
          // @option zoomOutTitle: String = 'Zoom out'
          // The title set on the 'zoom out' button.
          zoomOutTitle: "Zoom out"
        },
        onAdd: function(map) {
          var zoomName = "leaflet-control-zoom", container = create$1("div", zoomName + " leaflet-bar"), options = this.options;
          this._zoomInButton = this._createButton(
            options.zoomInText,
            options.zoomInTitle,
            zoomName + "-in",
            container,
            this._zoomIn
          );
          this._zoomOutButton = this._createButton(
            options.zoomOutText,
            options.zoomOutTitle,
            zoomName + "-out",
            container,
            this._zoomOut
          );
          this._updateDisabled();
          map.on("zoomend zoomlevelschange", this._updateDisabled, this);
          return container;
        },
        onRemove: function(map) {
          map.off("zoomend zoomlevelschange", this._updateDisabled, this);
        },
        disable: function() {
          this._disabled = true;
          this._updateDisabled();
          return this;
        },
        enable: function() {
          this._disabled = false;
          this._updateDisabled();
          return this;
        },
        _zoomIn: function(e) {
          if (!this._disabled && this._map._zoom < this._map.getMaxZoom()) {
            this._map.zoomIn(this._map.options.zoomDelta * (e.shiftKey ? 3 : 1));
          }
        },
        _zoomOut: function(e) {
          if (!this._disabled && this._map._zoom > this._map.getMinZoom()) {
            this._map.zoomOut(this._map.options.zoomDelta * (e.shiftKey ? 3 : 1));
          }
        },
        _createButton: function(html, title, className, container, fn) {
          var link = create$1("a", className, container);
          link.innerHTML = html;
          link.href = "#";
          link.title = title;
          link.setAttribute("role", "button");
          link.setAttribute("aria-label", title);
          disableClickPropagation(link);
          on(link, "click", stop);
          on(link, "click", fn, this);
          on(link, "click", this._refocusOnMap, this);
          return link;
        },
        _updateDisabled: function() {
          var map = this._map, className = "leaflet-disabled";
          removeClass(this._zoomInButton, className);
          removeClass(this._zoomOutButton, className);
          this._zoomInButton.setAttribute("aria-disabled", "false");
          this._zoomOutButton.setAttribute("aria-disabled", "false");
          if (this._disabled || map._zoom === map.getMinZoom()) {
            addClass(this._zoomOutButton, className);
            this._zoomOutButton.setAttribute("aria-disabled", "true");
          }
          if (this._disabled || map._zoom === map.getMaxZoom()) {
            addClass(this._zoomInButton, className);
            this._zoomInButton.setAttribute("aria-disabled", "true");
          }
        }
      });
      Map2.mergeOptions({
        zoomControl: true
      });
      Map2.addInitHook(function() {
        if (this.options.zoomControl) {
          this.zoomControl = new Zoom();
          this.addControl(this.zoomControl);
        }
      });
      var zoom = function(options) {
        return new Zoom(options);
      };
      var Scale = Control.extend({
        // @section
        // @aka Control.Scale options
        options: {
          position: "bottomleft",
          // @option maxWidth: Number = 100
          // Maximum width of the control in pixels. The width is set dynamically to show round values (e.g. 100, 200, 500).
          maxWidth: 100,
          // @option metric: Boolean = True
          // Whether to show the metric scale line (m/km).
          metric: true,
          // @option imperial: Boolean = True
          // Whether to show the imperial scale line (mi/ft).
          imperial: true
          // @option updateWhenIdle: Boolean = false
          // If `true`, the control is updated on [`moveend`](#map-moveend), otherwise it's always up-to-date (updated on [`move`](#map-move)).
        },
        onAdd: function(map) {
          var className = "leaflet-control-scale", container = create$1("div", className), options = this.options;
          this._addScales(options, className + "-line", container);
          map.on(options.updateWhenIdle ? "moveend" : "move", this._update, this);
          map.whenReady(this._update, this);
          return container;
        },
        onRemove: function(map) {
          map.off(this.options.updateWhenIdle ? "moveend" : "move", this._update, this);
        },
        _addScales: function(options, className, container) {
          if (options.metric) {
            this._mScale = create$1("div", className, container);
          }
          if (options.imperial) {
            this._iScale = create$1("div", className, container);
          }
        },
        _update: function() {
          var map = this._map, y = map.getSize().y / 2;
          var maxMeters = map.distance(
            map.containerPointToLatLng([0, y]),
            map.containerPointToLatLng([this.options.maxWidth, y])
          );
          this._updateScales(maxMeters);
        },
        _updateScales: function(maxMeters) {
          if (this.options.metric && maxMeters) {
            this._updateMetric(maxMeters);
          }
          if (this.options.imperial && maxMeters) {
            this._updateImperial(maxMeters);
          }
        },
        _updateMetric: function(maxMeters) {
          var meters = this._getRoundNum(maxMeters), label = meters < 1e3 ? meters + " m" : meters / 1e3 + " km";
          this._updateScale(this._mScale, label, meters / maxMeters);
        },
        _updateImperial: function(maxMeters) {
          var maxFeet = maxMeters * 3.2808399, maxMiles, miles, feet;
          if (maxFeet > 5280) {
            maxMiles = maxFeet / 5280;
            miles = this._getRoundNum(maxMiles);
            this._updateScale(this._iScale, miles + " mi", miles / maxMiles);
          } else {
            feet = this._getRoundNum(maxFeet);
            this._updateScale(this._iScale, feet + " ft", feet / maxFeet);
          }
        },
        _updateScale: function(scale2, text, ratio) {
          scale2.style.width = Math.round(this.options.maxWidth * ratio) + "px";
          scale2.innerHTML = text;
        },
        _getRoundNum: function(num) {
          var pow10 = Math.pow(10, (Math.floor(num) + "").length - 1), d = num / pow10;
          d = d >= 10 ? 10 : d >= 5 ? 5 : d >= 3 ? 3 : d >= 2 ? 2 : 1;
          return pow10 * d;
        }
      });
      var scale = function(options) {
        return new Scale(options);
      };
      var ukrainianFlag = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" class="leaflet-attribution-flag"><path fill="#4C7BE1" d="M0 0h12v4H0z"/><path fill="#FFD500" d="M0 4h12v3H0z"/><path fill="#E0BC00" d="M0 7h12v1H0z"/></svg>';
      var Attribution = Control.extend({
        // @section
        // @aka Control.Attribution options
        options: {
          position: "bottomright",
          // @option prefix: String|false = 'Leaflet'
          // The HTML text shown before the attributions. Pass `false` to disable.
          prefix: '<a href="https://leafletjs.com" title="A JavaScript library for interactive maps">' + (Browser.inlineSvg ? ukrainianFlag + " " : "") + "Leaflet</a>"
        },
        initialize: function(options) {
          setOptions(this, options);
          this._attributions = {};
        },
        onAdd: function(map) {
          map.attributionControl = this;
          this._container = create$1("div", "leaflet-control-attribution");
          disableClickPropagation(this._container);
          for (var i in map._layers) {
            if (map._layers[i].getAttribution) {
              this.addAttribution(map._layers[i].getAttribution());
            }
          }
          this._update();
          map.on("layeradd", this._addAttribution, this);
          return this._container;
        },
        onRemove: function(map) {
          map.off("layeradd", this._addAttribution, this);
        },
        _addAttribution: function(ev) {
          if (ev.layer.getAttribution) {
            this.addAttribution(ev.layer.getAttribution());
            ev.layer.once("remove", function() {
              this.removeAttribution(ev.layer.getAttribution());
            }, this);
          }
        },
        // @method setPrefix(prefix: String|false): this
        // The HTML text shown before the attributions. Pass `false` to disable.
        setPrefix: function(prefix) {
          this.options.prefix = prefix;
          this._update();
          return this;
        },
        // @method addAttribution(text: String): this
        // Adds an attribution text (e.g. `'&copy; OpenStreetMap contributors'`).
        addAttribution: function(text) {
          if (!text) {
            return this;
          }
          if (!this._attributions[text]) {
            this._attributions[text] = 0;
          }
          this._attributions[text]++;
          this._update();
          return this;
        },
        // @method removeAttribution(text: String): this
        // Removes an attribution text.
        removeAttribution: function(text) {
          if (!text) {
            return this;
          }
          if (this._attributions[text]) {
            this._attributions[text]--;
            this._update();
          }
          return this;
        },
        _update: function() {
          if (!this._map) {
            return;
          }
          var attribs = [];
          for (var i in this._attributions) {
            if (this._attributions[i]) {
              attribs.push(i);
            }
          }
          var prefixAndAttribs = [];
          if (this.options.prefix) {
            prefixAndAttribs.push(this.options.prefix);
          }
          if (attribs.length) {
            prefixAndAttribs.push(attribs.join(", "));
          }
          this._container.innerHTML = prefixAndAttribs.join(' <span aria-hidden="true">|</span> ');
        }
      });
      Map2.mergeOptions({
        attributionControl: true
      });
      Map2.addInitHook(function() {
        if (this.options.attributionControl) {
          new Attribution().addTo(this);
        }
      });
      var attribution = function(options) {
        return new Attribution(options);
      };
      Control.Layers = Layers;
      Control.Zoom = Zoom;
      Control.Scale = Scale;
      Control.Attribution = Attribution;
      control.layers = layers;
      control.zoom = zoom;
      control.scale = scale;
      control.attribution = attribution;
      var Handler = Class.extend({
        initialize: function(map) {
          this._map = map;
        },
        // @method enable(): this
        // Enables the handler
        enable: function() {
          if (this._enabled) {
            return this;
          }
          this._enabled = true;
          this.addHooks();
          return this;
        },
        // @method disable(): this
        // Disables the handler
        disable: function() {
          if (!this._enabled) {
            return this;
          }
          this._enabled = false;
          this.removeHooks();
          return this;
        },
        // @method enabled(): Boolean
        // Returns `true` if the handler is enabled
        enabled: function() {
          return !!this._enabled;
        }
        // @section Extension methods
        // Classes inheriting from `Handler` must implement the two following methods:
        // @method addHooks()
        // Called when the handler is enabled, should add event hooks.
        // @method removeHooks()
        // Called when the handler is disabled, should remove the event hooks added previously.
      });
      Handler.addTo = function(map, name) {
        map.addHandler(name, this);
        return this;
      };
      var Mixin = { Events };
      var START = Browser.touch ? "touchstart mousedown" : "mousedown";
      var Draggable = Evented.extend({
        options: {
          // @section
          // @aka Draggable options
          // @option clickTolerance: Number = 3
          // The max number of pixels a user can shift the mouse pointer during a click
          // for it to be considered a valid click (as opposed to a mouse drag).
          clickTolerance: 3
        },
        // @constructor L.Draggable(el: HTMLElement, dragHandle?: HTMLElement, preventOutline?: Boolean, options?: Draggable options)
        // Creates a `Draggable` object for moving `el` when you start dragging the `dragHandle` element (equals `el` itself by default).
        initialize: function(element, dragStartTarget, preventOutline2, options) {
          setOptions(this, options);
          this._element = element;
          this._dragStartTarget = dragStartTarget || element;
          this._preventOutline = preventOutline2;
        },
        // @method enable()
        // Enables the dragging ability
        enable: function() {
          if (this._enabled) {
            return;
          }
          on(this._dragStartTarget, START, this._onDown, this);
          this._enabled = true;
        },
        // @method disable()
        // Disables the dragging ability
        disable: function() {
          if (!this._enabled) {
            return;
          }
          if (Draggable._dragging === this) {
            this.finishDrag(true);
          }
          off(this._dragStartTarget, START, this._onDown, this);
          this._enabled = false;
          this._moved = false;
        },
        _onDown: function(e) {
          if (!this._enabled) {
            return;
          }
          this._moved = false;
          if (hasClass(this._element, "leaflet-zoom-anim")) {
            return;
          }
          if (e.touches && e.touches.length !== 1) {
            if (Draggable._dragging === this) {
              this.finishDrag();
            }
            return;
          }
          if (Draggable._dragging || e.shiftKey || e.which !== 1 && e.button !== 1 && !e.touches) {
            return;
          }
          Draggable._dragging = this;
          if (this._preventOutline) {
            preventOutline(this._element);
          }
          disableImageDrag();
          disableTextSelection();
          if (this._moving) {
            return;
          }
          this.fire("down");
          var first = e.touches ? e.touches[0] : e, sizedParent = getSizedParentNode(this._element);
          this._startPoint = new Point(first.clientX, first.clientY);
          this._startPos = getPosition(this._element);
          this._parentScale = getScale(sizedParent);
          var mouseevent = e.type === "mousedown";
          on(document, mouseevent ? "mousemove" : "touchmove", this._onMove, this);
          on(document, mouseevent ? "mouseup" : "touchend touchcancel", this._onUp, this);
        },
        _onMove: function(e) {
          if (!this._enabled) {
            return;
          }
          if (e.touches && e.touches.length > 1) {
            this._moved = true;
            return;
          }
          var first = e.touches && e.touches.length === 1 ? e.touches[0] : e, offset = new Point(first.clientX, first.clientY)._subtract(this._startPoint);
          if (!offset.x && !offset.y) {
            return;
          }
          if (Math.abs(offset.x) + Math.abs(offset.y) < this.options.clickTolerance) {
            return;
          }
          offset.x /= this._parentScale.x;
          offset.y /= this._parentScale.y;
          preventDefault(e);
          if (!this._moved) {
            this.fire("dragstart");
            this._moved = true;
            addClass(document.body, "leaflet-dragging");
            this._lastTarget = e.target || e.srcElement;
            if (window.SVGElementInstance && this._lastTarget instanceof window.SVGElementInstance) {
              this._lastTarget = this._lastTarget.correspondingUseElement;
            }
            addClass(this._lastTarget, "leaflet-drag-target");
          }
          this._newPos = this._startPos.add(offset);
          this._moving = true;
          this._lastEvent = e;
          this._updatePosition();
        },
        _updatePosition: function() {
          var e = { originalEvent: this._lastEvent };
          this.fire("predrag", e);
          setPosition(this._element, this._newPos);
          this.fire("drag", e);
        },
        _onUp: function() {
          if (!this._enabled) {
            return;
          }
          this.finishDrag();
        },
        finishDrag: function(noInertia) {
          removeClass(document.body, "leaflet-dragging");
          if (this._lastTarget) {
            removeClass(this._lastTarget, "leaflet-drag-target");
            this._lastTarget = null;
          }
          off(document, "mousemove touchmove", this._onMove, this);
          off(document, "mouseup touchend touchcancel", this._onUp, this);
          enableImageDrag();
          enableTextSelection();
          var fireDragend = this._moved && this._moving;
          this._moving = false;
          Draggable._dragging = false;
          if (fireDragend) {
            this.fire("dragend", {
              noInertia,
              distance: this._newPos.distanceTo(this._startPos)
            });
          }
        }
      });
      function clipPolygon(points, bounds, round) {
        var clippedPoints, edges = [1, 4, 2, 8], i, j, k, a, b, len, edge2, p;
        for (i = 0, len = points.length; i < len; i++) {
          points[i]._code = _getBitCode(points[i], bounds);
        }
        for (k = 0; k < 4; k++) {
          edge2 = edges[k];
          clippedPoints = [];
          for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
            a = points[i];
            b = points[j];
            if (!(a._code & edge2)) {
              if (b._code & edge2) {
                p = _getEdgeIntersection(b, a, edge2, bounds, round);
                p._code = _getBitCode(p, bounds);
                clippedPoints.push(p);
              }
              clippedPoints.push(a);
            } else if (!(b._code & edge2)) {
              p = _getEdgeIntersection(b, a, edge2, bounds, round);
              p._code = _getBitCode(p, bounds);
              clippedPoints.push(p);
            }
          }
          points = clippedPoints;
        }
        return points;
      }
      function polygonCenter(latlngs, crs) {
        var i, j, p1, p2, f, area, x, y, center;
        if (!latlngs || latlngs.length === 0) {
          throw new Error("latlngs not passed");
        }
        if (!isFlat(latlngs)) {
          console.warn("latlngs are not flat! Only the first ring will be used");
          latlngs = latlngs[0];
        }
        var centroidLatLng = toLatLng([0, 0]);
        var bounds = toLatLngBounds(latlngs);
        var areaBounds = bounds.getNorthWest().distanceTo(bounds.getSouthWest()) * bounds.getNorthEast().distanceTo(bounds.getNorthWest());
        if (areaBounds < 1700) {
          centroidLatLng = centroid(latlngs);
        }
        var len = latlngs.length;
        var points = [];
        for (i = 0; i < len; i++) {
          var latlng = toLatLng(latlngs[i]);
          points.push(crs.project(toLatLng([latlng.lat - centroidLatLng.lat, latlng.lng - centroidLatLng.lng])));
        }
        area = x = y = 0;
        for (i = 0, j = len - 1; i < len; j = i++) {
          p1 = points[i];
          p2 = points[j];
          f = p1.y * p2.x - p2.y * p1.x;
          x += (p1.x + p2.x) * f;
          y += (p1.y + p2.y) * f;
          area += f * 3;
        }
        if (area === 0) {
          center = points[0];
        } else {
          center = [x / area, y / area];
        }
        var latlngCenter = crs.unproject(toPoint(center));
        return toLatLng([latlngCenter.lat + centroidLatLng.lat, latlngCenter.lng + centroidLatLng.lng]);
      }
      function centroid(coords) {
        var latSum = 0;
        var lngSum = 0;
        var len = 0;
        for (var i = 0; i < coords.length; i++) {
          var latlng = toLatLng(coords[i]);
          latSum += latlng.lat;
          lngSum += latlng.lng;
          len++;
        }
        return toLatLng([latSum / len, lngSum / len]);
      }
      var PolyUtil = {
        __proto__: null,
        clipPolygon,
        polygonCenter,
        centroid
      };
      function simplify(points, tolerance) {
        if (!tolerance || !points.length) {
          return points.slice();
        }
        var sqTolerance = tolerance * tolerance;
        points = _reducePoints(points, sqTolerance);
        points = _simplifyDP(points, sqTolerance);
        return points;
      }
      function pointToSegmentDistance(p, p1, p2) {
        return Math.sqrt(_sqClosestPointOnSegment(p, p1, p2, true));
      }
      function closestPointOnSegment(p, p1, p2) {
        return _sqClosestPointOnSegment(p, p1, p2);
      }
      function _simplifyDP(points, sqTolerance) {
        var len = points.length, ArrayConstructor = typeof Uint8Array !== void 0 + "" ? Uint8Array : Array, markers = new ArrayConstructor(len);
        markers[0] = markers[len - 1] = 1;
        _simplifyDPStep(points, markers, sqTolerance, 0, len - 1);
        var i, newPoints = [];
        for (i = 0; i < len; i++) {
          if (markers[i]) {
            newPoints.push(points[i]);
          }
        }
        return newPoints;
      }
      function _simplifyDPStep(points, markers, sqTolerance, first, last) {
        var maxSqDist = 0, index2, i, sqDist;
        for (i = first + 1; i <= last - 1; i++) {
          sqDist = _sqClosestPointOnSegment(points[i], points[first], points[last], true);
          if (sqDist > maxSqDist) {
            index2 = i;
            maxSqDist = sqDist;
          }
        }
        if (maxSqDist > sqTolerance) {
          markers[index2] = 1;
          _simplifyDPStep(points, markers, sqTolerance, first, index2);
          _simplifyDPStep(points, markers, sqTolerance, index2, last);
        }
      }
      function _reducePoints(points, sqTolerance) {
        var reducedPoints = [points[0]];
        for (var i = 1, prev = 0, len = points.length; i < len; i++) {
          if (_sqDist(points[i], points[prev]) > sqTolerance) {
            reducedPoints.push(points[i]);
            prev = i;
          }
        }
        if (prev < len - 1) {
          reducedPoints.push(points[len - 1]);
        }
        return reducedPoints;
      }
      var _lastCode;
      function clipSegment(a, b, bounds, useLastCode, round) {
        var codeA = useLastCode ? _lastCode : _getBitCode(a, bounds), codeB = _getBitCode(b, bounds), codeOut, p, newCode;
        _lastCode = codeB;
        while (true) {
          if (!(codeA | codeB)) {
            return [a, b];
          }
          if (codeA & codeB) {
            return false;
          }
          codeOut = codeA || codeB;
          p = _getEdgeIntersection(a, b, codeOut, bounds, round);
          newCode = _getBitCode(p, bounds);
          if (codeOut === codeA) {
            a = p;
            codeA = newCode;
          } else {
            b = p;
            codeB = newCode;
          }
        }
      }
      function _getEdgeIntersection(a, b, code, bounds, round) {
        var dx = b.x - a.x, dy = b.y - a.y, min = bounds.min, max = bounds.max, x, y;
        if (code & 8) {
          x = a.x + dx * (max.y - a.y) / dy;
          y = max.y;
        } else if (code & 4) {
          x = a.x + dx * (min.y - a.y) / dy;
          y = min.y;
        } else if (code & 2) {
          x = max.x;
          y = a.y + dy * (max.x - a.x) / dx;
        } else if (code & 1) {
          x = min.x;
          y = a.y + dy * (min.x - a.x) / dx;
        }
        return new Point(x, y, round);
      }
      function _getBitCode(p, bounds) {
        var code = 0;
        if (p.x < bounds.min.x) {
          code |= 1;
        } else if (p.x > bounds.max.x) {
          code |= 2;
        }
        if (p.y < bounds.min.y) {
          code |= 4;
        } else if (p.y > bounds.max.y) {
          code |= 8;
        }
        return code;
      }
      function _sqDist(p1, p2) {
        var dx = p2.x - p1.x, dy = p2.y - p1.y;
        return dx * dx + dy * dy;
      }
      function _sqClosestPointOnSegment(p, p1, p2, sqDist) {
        var x = p1.x, y = p1.y, dx = p2.x - x, dy = p2.y - y, dot = dx * dx + dy * dy, t;
        if (dot > 0) {
          t = ((p.x - x) * dx + (p.y - y) * dy) / dot;
          if (t > 1) {
            x = p2.x;
            y = p2.y;
          } else if (t > 0) {
            x += dx * t;
            y += dy * t;
          }
        }
        dx = p.x - x;
        dy = p.y - y;
        return sqDist ? dx * dx + dy * dy : new Point(x, y);
      }
      function isFlat(latlngs) {
        return !isArray(latlngs[0]) || typeof latlngs[0][0] !== "object" && typeof latlngs[0][0] !== "undefined";
      }
      function _flat(latlngs) {
        console.warn("Deprecated use of _flat, please use L.LineUtil.isFlat instead.");
        return isFlat(latlngs);
      }
      function polylineCenter(latlngs, crs) {
        var i, halfDist, segDist, dist, p1, p2, ratio, center;
        if (!latlngs || latlngs.length === 0) {
          throw new Error("latlngs not passed");
        }
        if (!isFlat(latlngs)) {
          console.warn("latlngs are not flat! Only the first ring will be used");
          latlngs = latlngs[0];
        }
        var centroidLatLng = toLatLng([0, 0]);
        var bounds = toLatLngBounds(latlngs);
        var areaBounds = bounds.getNorthWest().distanceTo(bounds.getSouthWest()) * bounds.getNorthEast().distanceTo(bounds.getNorthWest());
        if (areaBounds < 1700) {
          centroidLatLng = centroid(latlngs);
        }
        var len = latlngs.length;
        var points = [];
        for (i = 0; i < len; i++) {
          var latlng = toLatLng(latlngs[i]);
          points.push(crs.project(toLatLng([latlng.lat - centroidLatLng.lat, latlng.lng - centroidLatLng.lng])));
        }
        for (i = 0, halfDist = 0; i < len - 1; i++) {
          halfDist += points[i].distanceTo(points[i + 1]) / 2;
        }
        if (halfDist === 0) {
          center = points[0];
        } else {
          for (i = 0, dist = 0; i < len - 1; i++) {
            p1 = points[i];
            p2 = points[i + 1];
            segDist = p1.distanceTo(p2);
            dist += segDist;
            if (dist > halfDist) {
              ratio = (dist - halfDist) / segDist;
              center = [
                p2.x - ratio * (p2.x - p1.x),
                p2.y - ratio * (p2.y - p1.y)
              ];
              break;
            }
          }
        }
        var latlngCenter = crs.unproject(toPoint(center));
        return toLatLng([latlngCenter.lat + centroidLatLng.lat, latlngCenter.lng + centroidLatLng.lng]);
      }
      var LineUtil = {
        __proto__: null,
        simplify,
        pointToSegmentDistance,
        closestPointOnSegment,
        clipSegment,
        _getEdgeIntersection,
        _getBitCode,
        _sqClosestPointOnSegment,
        isFlat,
        _flat,
        polylineCenter
      };
      var LonLat = {
        project: function(latlng) {
          return new Point(latlng.lng, latlng.lat);
        },
        unproject: function(point) {
          return new LatLng(point.y, point.x);
        },
        bounds: new Bounds([-180, -90], [180, 90])
      };
      var Mercator = {
        R: 6378137,
        R_MINOR: 6356752314245179e-9,
        bounds: new Bounds([-2003750834279e-5, -1549657073972e-5], [2003750834279e-5, 1876465623138e-5]),
        project: function(latlng) {
          var d = Math.PI / 180, r2 = this.R, y = latlng.lat * d, tmp = this.R_MINOR / r2, e = Math.sqrt(1 - tmp * tmp), con = e * Math.sin(y);
          var ts = Math.tan(Math.PI / 4 - y / 2) / Math.pow((1 - con) / (1 + con), e / 2);
          y = -r2 * Math.log(Math.max(ts, 1e-10));
          return new Point(latlng.lng * d * r2, y);
        },
        unproject: function(point) {
          var d = 180 / Math.PI, r2 = this.R, tmp = this.R_MINOR / r2, e = Math.sqrt(1 - tmp * tmp), ts = Math.exp(-point.y / r2), phi = Math.PI / 2 - 2 * Math.atan(ts);
          for (var i = 0, dphi = 0.1, con; i < 15 && Math.abs(dphi) > 1e-7; i++) {
            con = e * Math.sin(phi);
            con = Math.pow((1 - con) / (1 + con), e / 2);
            dphi = Math.PI / 2 - 2 * Math.atan(ts * con) - phi;
            phi += dphi;
          }
          return new LatLng(phi * d, point.x * d / r2);
        }
      };
      var index = {
        __proto__: null,
        LonLat,
        Mercator,
        SphericalMercator
      };
      var EPSG3395 = extend({}, Earth, {
        code: "EPSG:3395",
        projection: Mercator,
        transformation: function() {
          var scale2 = 0.5 / (Math.PI * Mercator.R);
          return toTransformation(scale2, 0.5, -scale2, 0.5);
        }()
      });
      var EPSG4326 = extend({}, Earth, {
        code: "EPSG:4326",
        projection: LonLat,
        transformation: toTransformation(1 / 180, 1, -1 / 180, 0.5)
      });
      var Simple = extend({}, CRS, {
        projection: LonLat,
        transformation: toTransformation(1, 0, -1, 0),
        scale: function(zoom2) {
          return Math.pow(2, zoom2);
        },
        zoom: function(scale2) {
          return Math.log(scale2) / Math.LN2;
        },
        distance: function(latlng1, latlng2) {
          var dx = latlng2.lng - latlng1.lng, dy = latlng2.lat - latlng1.lat;
          return Math.sqrt(dx * dx + dy * dy);
        },
        infinite: true
      });
      CRS.Earth = Earth;
      CRS.EPSG3395 = EPSG3395;
      CRS.EPSG3857 = EPSG3857;
      CRS.EPSG900913 = EPSG900913;
      CRS.EPSG4326 = EPSG4326;
      CRS.Simple = Simple;
      var Layer = Evented.extend({
        // Classes extending `L.Layer` will inherit the following options:
        options: {
          // @option pane: String = 'overlayPane'
          // By default the layer will be added to the map's [overlay pane](#map-overlaypane). Overriding this option will cause the layer to be placed on another pane by default.
          pane: "overlayPane",
          // @option attribution: String = null
          // String to be shown in the attribution control, e.g. "© OpenStreetMap contributors". It describes the layer data and is often a legal obligation towards copyright holders and tile providers.
          attribution: null,
          bubblingMouseEvents: true
        },
        /* @section
         * Classes extending `L.Layer` will inherit the following methods:
         *
         * @method addTo(map: Map|LayerGroup): this
         * Adds the layer to the given map or layer group.
         */
        addTo: function(map) {
          map.addLayer(this);
          return this;
        },
        // @method remove: this
        // Removes the layer from the map it is currently active on.
        remove: function() {
          return this.removeFrom(this._map || this._mapToAdd);
        },
        // @method removeFrom(map: Map): this
        // Removes the layer from the given map
        //
        // @alternative
        // @method removeFrom(group: LayerGroup): this
        // Removes the layer from the given `LayerGroup`
        removeFrom: function(obj) {
          if (obj) {
            obj.removeLayer(this);
          }
          return this;
        },
        // @method getPane(name? : String): HTMLElement
        // Returns the `HTMLElement` representing the named pane on the map. If `name` is omitted, returns the pane for this layer.
        getPane: function(name) {
          return this._map.getPane(name ? this.options[name] || name : this.options.pane);
        },
        addInteractiveTarget: function(targetEl) {
          this._map._targets[stamp(targetEl)] = this;
          return this;
        },
        removeInteractiveTarget: function(targetEl) {
          delete this._map._targets[stamp(targetEl)];
          return this;
        },
        // @method getAttribution: String
        // Used by the `attribution control`, returns the [attribution option](#gridlayer-attribution).
        getAttribution: function() {
          return this.options.attribution;
        },
        _layerAdd: function(e) {
          var map = e.target;
          if (!map.hasLayer(this)) {
            return;
          }
          this._map = map;
          this._zoomAnimated = map._zoomAnimated;
          if (this.getEvents) {
            var events = this.getEvents();
            map.on(events, this);
            this.once("remove", function() {
              map.off(events, this);
            }, this);
          }
          this.onAdd(map);
          this.fire("add");
          map.fire("layeradd", { layer: this });
        }
      });
      Map2.include({
        // @method addLayer(layer: Layer): this
        // Adds the given layer to the map
        addLayer: function(layer) {
          if (!layer._layerAdd) {
            throw new Error("The provided object is not a Layer.");
          }
          var id = stamp(layer);
          if (this._layers[id]) {
            return this;
          }
          this._layers[id] = layer;
          layer._mapToAdd = this;
          if (layer.beforeAdd) {
            layer.beforeAdd(this);
          }
          this.whenReady(layer._layerAdd, layer);
          return this;
        },
        // @method removeLayer(layer: Layer): this
        // Removes the given layer from the map.
        removeLayer: function(layer) {
          var id = stamp(layer);
          if (!this._layers[id]) {
            return this;
          }
          if (this._loaded) {
            layer.onRemove(this);
          }
          delete this._layers[id];
          if (this._loaded) {
            this.fire("layerremove", { layer });
            layer.fire("remove");
          }
          layer._map = layer._mapToAdd = null;
          return this;
        },
        // @method hasLayer(layer: Layer): Boolean
        // Returns `true` if the given layer is currently added to the map
        hasLayer: function(layer) {
          return stamp(layer) in this._layers;
        },
        /* @method eachLayer(fn: Function, context?: Object): this
         * Iterates over the layers of the map, optionally specifying context of the iterator function.
         * ```
         * map.eachLayer(function(layer){
         *     layer.bindPopup('Hello');
         * });
         * ```
         */
        eachLayer: function(method, context) {
          for (var i in this._layers) {
            method.call(context, this._layers[i]);
          }
          return this;
        },
        _addLayers: function(layers2) {
          layers2 = layers2 ? isArray(layers2) ? layers2 : [layers2] : [];
          for (var i = 0, len = layers2.length; i < len; i++) {
            this.addLayer(layers2[i]);
          }
        },
        _addZoomLimit: function(layer) {
          if (!isNaN(layer.options.maxZoom) || !isNaN(layer.options.minZoom)) {
            this._zoomBoundLayers[stamp(layer)] = layer;
            this._updateZoomLevels();
          }
        },
        _removeZoomLimit: function(layer) {
          var id = stamp(layer);
          if (this._zoomBoundLayers[id]) {
            delete this._zoomBoundLayers[id];
            this._updateZoomLevels();
          }
        },
        _updateZoomLevels: function() {
          var minZoom = Infinity, maxZoom = -Infinity, oldZoomSpan = this._getZoomSpan();
          for (var i in this._zoomBoundLayers) {
            var options = this._zoomBoundLayers[i].options;
            minZoom = options.minZoom === void 0 ? minZoom : Math.min(minZoom, options.minZoom);
            maxZoom = options.maxZoom === void 0 ? maxZoom : Math.max(maxZoom, options.maxZoom);
          }
          this._layersMaxZoom = maxZoom === -Infinity ? void 0 : maxZoom;
          this._layersMinZoom = minZoom === Infinity ? void 0 : minZoom;
          if (oldZoomSpan !== this._getZoomSpan()) {
            this.fire("zoomlevelschange");
          }
          if (this.options.maxZoom === void 0 && this._layersMaxZoom && this.getZoom() > this._layersMaxZoom) {
            this.setZoom(this._layersMaxZoom);
          }
          if (this.options.minZoom === void 0 && this._layersMinZoom && this.getZoom() < this._layersMinZoom) {
            this.setZoom(this._layersMinZoom);
          }
        }
      });
      var LayerGroup = Layer.extend({
        initialize: function(layers2, options) {
          setOptions(this, options);
          this._layers = {};
          var i, len;
          if (layers2) {
            for (i = 0, len = layers2.length; i < len; i++) {
              this.addLayer(layers2[i]);
            }
          }
        },
        // @method addLayer(layer: Layer): this
        // Adds the given layer to the group.
        addLayer: function(layer) {
          var id = this.getLayerId(layer);
          this._layers[id] = layer;
          if (this._map) {
            this._map.addLayer(layer);
          }
          return this;
        },
        // @method removeLayer(layer: Layer): this
        // Removes the given layer from the group.
        // @alternative
        // @method removeLayer(id: Number): this
        // Removes the layer with the given internal ID from the group.
        removeLayer: function(layer) {
          var id = layer in this._layers ? layer : this.getLayerId(layer);
          if (this._map && this._layers[id]) {
            this._map.removeLayer(this._layers[id]);
          }
          delete this._layers[id];
          return this;
        },
        // @method hasLayer(layer: Layer): Boolean
        // Returns `true` if the given layer is currently added to the group.
        // @alternative
        // @method hasLayer(id: Number): Boolean
        // Returns `true` if the given internal ID is currently added to the group.
        hasLayer: function(layer) {
          var layerId = typeof layer === "number" ? layer : this.getLayerId(layer);
          return layerId in this._layers;
        },
        // @method clearLayers(): this
        // Removes all the layers from the group.
        clearLayers: function() {
          return this.eachLayer(this.removeLayer, this);
        },
        // @method invoke(methodName: String, …): this
        // Calls `methodName` on every layer contained in this group, passing any
        // additional parameters. Has no effect if the layers contained do not
        // implement `methodName`.
        invoke: function(methodName) {
          var args = Array.prototype.slice.call(arguments, 1), i, layer;
          for (i in this._layers) {
            layer = this._layers[i];
            if (layer[methodName]) {
              layer[methodName].apply(layer, args);
            }
          }
          return this;
        },
        onAdd: function(map) {
          this.eachLayer(map.addLayer, map);
        },
        onRemove: function(map) {
          this.eachLayer(map.removeLayer, map);
        },
        // @method eachLayer(fn: Function, context?: Object): this
        // Iterates over the layers of the group, optionally specifying context of the iterator function.
        // ```js
        // group.eachLayer(function (layer) {
        // 	layer.bindPopup('Hello');
        // });
        // ```
        eachLayer: function(method, context) {
          for (var i in this._layers) {
            method.call(context, this._layers[i]);
          }
          return this;
        },
        // @method getLayer(id: Number): Layer
        // Returns the layer with the given internal ID.
        getLayer: function(id) {
          return this._layers[id];
        },
        // @method getLayers(): Layer[]
        // Returns an array of all the layers added to the group.
        getLayers: function() {
          var layers2 = [];
          this.eachLayer(layers2.push, layers2);
          return layers2;
        },
        // @method setZIndex(zIndex: Number): this
        // Calls `setZIndex` on every layer contained in this group, passing the z-index.
        setZIndex: function(zIndex) {
          return this.invoke("setZIndex", zIndex);
        },
        // @method getLayerId(layer: Layer): Number
        // Returns the internal ID for a layer
        getLayerId: function(layer) {
          return stamp(layer);
        }
      });
      var layerGroup = function(layers2, options) {
        return new LayerGroup(layers2, options);
      };
      var FeatureGroup = LayerGroup.extend({
        addLayer: function(layer) {
          if (this.hasLayer(layer)) {
            return this;
          }
          layer.addEventParent(this);
          LayerGroup.prototype.addLayer.call(this, layer);
          return this.fire("layeradd", { layer });
        },
        removeLayer: function(layer) {
          if (!this.hasLayer(layer)) {
            return this;
          }
          if (layer in this._layers) {
            layer = this._layers[layer];
          }
          layer.removeEventParent(this);
          LayerGroup.prototype.removeLayer.call(this, layer);
          return this.fire("layerremove", { layer });
        },
        // @method setStyle(style: Path options): this
        // Sets the given path options to each layer of the group that has a `setStyle` method.
        setStyle: function(style3) {
          return this.invoke("setStyle", style3);
        },
        // @method bringToFront(): this
        // Brings the layer group to the top of all other layers
        bringToFront: function() {
          return this.invoke("bringToFront");
        },
        // @method bringToBack(): this
        // Brings the layer group to the back of all other layers
        bringToBack: function() {
          return this.invoke("bringToBack");
        },
        // @method getBounds(): LatLngBounds
        // Returns the LatLngBounds of the Feature Group (created from bounds and coordinates of its children).
        getBounds: function() {
          var bounds = new LatLngBounds();
          for (var id in this._layers) {
            var layer = this._layers[id];
            bounds.extend(layer.getBounds ? layer.getBounds() : layer.getLatLng());
          }
          return bounds;
        }
      });
      var featureGroup = function(layers2, options) {
        return new FeatureGroup(layers2, options);
      };
      var Icon = Class.extend({
        /* @section
         * @aka Icon options
         *
         * @option iconUrl: String = null
         * **(required)** The URL to the icon image (absolute or relative to your script path).
         *
         * @option iconRetinaUrl: String = null
         * The URL to a retina sized version of the icon image (absolute or relative to your
         * script path). Used for Retina screen devices.
         *
         * @option iconSize: Point = null
         * Size of the icon image in pixels.
         *
         * @option iconAnchor: Point = null
         * The coordinates of the "tip" of the icon (relative to its top left corner). The icon
         * will be aligned so that this point is at the marker's geographical location. Centered
         * by default if size is specified, also can be set in CSS with negative margins.
         *
         * @option popupAnchor: Point = [0, 0]
         * The coordinates of the point from which popups will "open", relative to the icon anchor.
         *
         * @option tooltipAnchor: Point = [0, 0]
         * The coordinates of the point from which tooltips will "open", relative to the icon anchor.
         *
         * @option shadowUrl: String = null
         * The URL to the icon shadow image. If not specified, no shadow image will be created.
         *
         * @option shadowRetinaUrl: String = null
         *
         * @option shadowSize: Point = null
         * Size of the shadow image in pixels.
         *
         * @option shadowAnchor: Point = null
         * The coordinates of the "tip" of the shadow (relative to its top left corner) (the same
         * as iconAnchor if not specified).
         *
         * @option className: String = ''
         * A custom class name to assign to both icon and shadow images. Empty by default.
         */
        options: {
          popupAnchor: [0, 0],
          tooltipAnchor: [0, 0],
          // @option crossOrigin: Boolean|String = false
          // Whether the crossOrigin attribute will be added to the tiles.
          // If a String is provided, all tiles will have their crossOrigin attribute set to the String provided. This is needed if you want to access tile pixel data.
          // Refer to [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes) for valid String values.
          crossOrigin: false
        },
        initialize: function(options) {
          setOptions(this, options);
        },
        // @method createIcon(oldIcon?: HTMLElement): HTMLElement
        // Called internally when the icon has to be shown, returns a `<img>` HTML element
        // styled according to the options.
        createIcon: function(oldIcon) {
          return this._createIcon("icon", oldIcon);
        },
        // @method createShadow(oldIcon?: HTMLElement): HTMLElement
        // As `createIcon`, but for the shadow beneath it.
        createShadow: function(oldIcon) {
          return this._createIcon("shadow", oldIcon);
        },
        _createIcon: function(name, oldIcon) {
          var src = this._getIconUrl(name);
          if (!src) {
            if (name === "icon") {
              throw new Error("iconUrl not set in Icon options (see the docs).");
            }
            return null;
          }
          var img = this._createImg(src, oldIcon && oldIcon.tagName === "IMG" ? oldIcon : null);
          this._setIconStyles(img, name);
          if (this.options.crossOrigin || this.options.crossOrigin === "") {
            img.crossOrigin = this.options.crossOrigin === true ? "" : this.options.crossOrigin;
          }
          return img;
        },
        _setIconStyles: function(img, name) {
          var options = this.options;
          var sizeOption = options[name + "Size"];
          if (typeof sizeOption === "number") {
            sizeOption = [sizeOption, sizeOption];
          }
          var size = toPoint(sizeOption), anchor = toPoint(name === "shadow" && options.shadowAnchor || options.iconAnchor || size && size.divideBy(2, true));
          img.className = "leaflet-marker-" + name + " " + (options.className || "");
          if (anchor) {
            img.style.marginLeft = -anchor.x + "px";
            img.style.marginTop = -anchor.y + "px";
          }
          if (size) {
            img.style.width = size.x + "px";
            img.style.height = size.y + "px";
          }
        },
        _createImg: function(src, el) {
          el = el || document.createElement("img");
          el.src = src;
          return el;
        },
        _getIconUrl: function(name) {
          return Browser.retina && this.options[name + "RetinaUrl"] || this.options[name + "Url"];
        }
      });
      function icon(options) {
        return new Icon(options);
      }
      var IconDefault = Icon.extend({
        options: {
          iconUrl: "marker-icon.png",
          iconRetinaUrl: "marker-icon-2x.png",
          shadowUrl: "marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          tooltipAnchor: [16, -28],
          shadowSize: [41, 41]
        },
        _getIconUrl: function(name) {
          if (typeof IconDefault.imagePath !== "string") {
            IconDefault.imagePath = this._detectIconPath();
          }
          return (this.options.imagePath || IconDefault.imagePath) + Icon.prototype._getIconUrl.call(this, name);
        },
        _stripUrl: function(path) {
          var strip = function(str, re, idx2) {
            var match = re.exec(str);
            return match && match[idx2];
          };
          path = strip(path, /^url\((['"])?(.+)\1\)$/, 2);
          return path && strip(path, /^(.*)marker-icon\.png$/, 1);
        },
        _detectIconPath: function() {
          var el = create$1("div", "leaflet-default-icon-path", document.body);
          var path = getStyle(el, "background-image") || getStyle(el, "backgroundImage");
          document.body.removeChild(el);
          path = this._stripUrl(path);
          if (path) {
            return path;
          }
          var link = document.querySelector('link[href$="leaflet.css"]');
          if (!link) {
            return "";
          }
          return link.href.substring(0, link.href.length - "leaflet.css".length - 1);
        }
      });
      var MarkerDrag = Handler.extend({
        initialize: function(marker2) {
          this._marker = marker2;
        },
        addHooks: function() {
          var icon2 = this._marker._icon;
          if (!this._draggable) {
            this._draggable = new Draggable(icon2, icon2, true);
          }
          this._draggable.on({
            dragstart: this._onDragStart,
            predrag: this._onPreDrag,
            drag: this._onDrag,
            dragend: this._onDragEnd
          }, this).enable();
          addClass(icon2, "leaflet-marker-draggable");
        },
        removeHooks: function() {
          this._draggable.off({
            dragstart: this._onDragStart,
            predrag: this._onPreDrag,
            drag: this._onDrag,
            dragend: this._onDragEnd
          }, this).disable();
          if (this._marker._icon) {
            removeClass(this._marker._icon, "leaflet-marker-draggable");
          }
        },
        moved: function() {
          return this._draggable && this._draggable._moved;
        },
        _adjustPan: function(e) {
          var marker2 = this._marker, map = marker2._map, speed = this._marker.options.autoPanSpeed, padding = this._marker.options.autoPanPadding, iconPos = getPosition(marker2._icon), bounds = map.getPixelBounds(), origin = map.getPixelOrigin();
          var panBounds = toBounds(
            bounds.min._subtract(origin).add(padding),
            bounds.max._subtract(origin).subtract(padding)
          );
          if (!panBounds.contains(iconPos)) {
            var movement = toPoint(
              (Math.max(panBounds.max.x, iconPos.x) - panBounds.max.x) / (bounds.max.x - panBounds.max.x) - (Math.min(panBounds.min.x, iconPos.x) - panBounds.min.x) / (bounds.min.x - panBounds.min.x),
              (Math.max(panBounds.max.y, iconPos.y) - panBounds.max.y) / (bounds.max.y - panBounds.max.y) - (Math.min(panBounds.min.y, iconPos.y) - panBounds.min.y) / (bounds.min.y - panBounds.min.y)
            ).multiplyBy(speed);
            map.panBy(movement, { animate: false });
            this._draggable._newPos._add(movement);
            this._draggable._startPos._add(movement);
            setPosition(marker2._icon, this._draggable._newPos);
            this._onDrag(e);
            this._panRequest = requestAnimFrame(this._adjustPan.bind(this, e));
          }
        },
        _onDragStart: function() {
          this._oldLatLng = this._marker.getLatLng();
          this._marker.closePopup && this._marker.closePopup();
          this._marker.fire("movestart").fire("dragstart");
        },
        _onPreDrag: function(e) {
          if (this._marker.options.autoPan) {
            cancelAnimFrame(this._panRequest);
            this._panRequest = requestAnimFrame(this._adjustPan.bind(this, e));
          }
        },
        _onDrag: function(e) {
          var marker2 = this._marker, shadow = marker2._shadow, iconPos = getPosition(marker2._icon), latlng = marker2._map.layerPointToLatLng(iconPos);
          if (shadow) {
            setPosition(shadow, iconPos);
          }
          marker2._latlng = latlng;
          e.latlng = latlng;
          e.oldLatLng = this._oldLatLng;
          marker2.fire("move", e).fire("drag", e);
        },
        _onDragEnd: function(e) {
          cancelAnimFrame(this._panRequest);
          delete this._oldLatLng;
          this._marker.fire("moveend").fire("dragend", e);
        }
      });
      var Marker = Layer.extend({
        // @section
        // @aka Marker options
        options: {
          // @option icon: Icon = *
          // Icon instance to use for rendering the marker.
          // See [Icon documentation](#L.Icon) for details on how to customize the marker icon.
          // If not specified, a common instance of `L.Icon.Default` is used.
          icon: new IconDefault(),
          // Option inherited from "Interactive layer" abstract class
          interactive: true,
          // @option keyboard: Boolean = true
          // Whether the marker can be tabbed to with a keyboard and clicked by pressing enter.
          keyboard: true,
          // @option title: String = ''
          // Text for the browser tooltip that appear on marker hover (no tooltip by default).
          // [Useful for accessibility](https://leafletjs.com/examples/accessibility/#markers-must-be-labelled).
          title: "",
          // @option alt: String = 'Marker'
          // Text for the `alt` attribute of the icon image.
          // [Useful for accessibility](https://leafletjs.com/examples/accessibility/#markers-must-be-labelled).
          alt: "Marker",
          // @option zIndexOffset: Number = 0
          // By default, marker images zIndex is set automatically based on its latitude. Use this option if you want to put the marker on top of all others (or below), specifying a high value like `1000` (or high negative value, respectively).
          zIndexOffset: 0,
          // @option opacity: Number = 1.0
          // The opacity of the marker.
          opacity: 1,
          // @option riseOnHover: Boolean = false
          // If `true`, the marker will get on top of others when you hover the mouse over it.
          riseOnHover: false,
          // @option riseOffset: Number = 250
          // The z-index offset used for the `riseOnHover` feature.
          riseOffset: 250,
          // @option pane: String = 'markerPane'
          // `Map pane` where the markers icon will be added.
          pane: "markerPane",
          // @option shadowPane: String = 'shadowPane'
          // `Map pane` where the markers shadow will be added.
          shadowPane: "shadowPane",
          // @option bubblingMouseEvents: Boolean = false
          // When `true`, a mouse event on this marker will trigger the same event on the map
          // (unless [`L.DomEvent.stopPropagation`](#domevent-stoppropagation) is used).
          bubblingMouseEvents: false,
          // @option autoPanOnFocus: Boolean = true
          // When `true`, the map will pan whenever the marker is focused (via
          // e.g. pressing `tab` on the keyboard) to ensure the marker is
          // visible within the map's bounds
          autoPanOnFocus: true,
          // @section Draggable marker options
          // @option draggable: Boolean = false
          // Whether the marker is draggable with mouse/touch or not.
          draggable: false,
          // @option autoPan: Boolean = false
          // Whether to pan the map when dragging this marker near its edge or not.
          autoPan: false,
          // @option autoPanPadding: Point = Point(50, 50)
          // Distance (in pixels to the left/right and to the top/bottom) of the
          // map edge to start panning the map.
          autoPanPadding: [50, 50],
          // @option autoPanSpeed: Number = 10
          // Number of pixels the map should pan by.
          autoPanSpeed: 10
        },
        /* @section
         *
         * In addition to [shared layer methods](#Layer) like `addTo()` and `remove()` and [popup methods](#Popup) like bindPopup() you can also use the following methods:
         */
        initialize: function(latlng, options) {
          setOptions(this, options);
          this._latlng = toLatLng(latlng);
        },
        onAdd: function(map) {
          this._zoomAnimated = this._zoomAnimated && map.options.markerZoomAnimation;
          if (this._zoomAnimated) {
            map.on("zoomanim", this._animateZoom, this);
          }
          this._initIcon();
          this.update();
        },
        onRemove: function(map) {
          if (this.dragging && this.dragging.enabled()) {
            this.options.draggable = true;
            this.dragging.removeHooks();
          }
          delete this.dragging;
          if (this._zoomAnimated) {
            map.off("zoomanim", this._animateZoom, this);
          }
          this._removeIcon();
          this._removeShadow();
        },
        getEvents: function() {
          return {
            zoom: this.update,
            viewreset: this.update
          };
        },
        // @method getLatLng: LatLng
        // Returns the current geographical position of the marker.
        getLatLng: function() {
          return this._latlng;
        },
        // @method setLatLng(latlng: LatLng): this
        // Changes the marker position to the given point.
        setLatLng: function(latlng) {
          var oldLatLng = this._latlng;
          this._latlng = toLatLng(latlng);
          this.update();
          return this.fire("move", { oldLatLng, latlng: this._latlng });
        },
        // @method setZIndexOffset(offset: Number): this
        // Changes the [zIndex offset](#marker-zindexoffset) of the marker.
        setZIndexOffset: function(offset) {
          this.options.zIndexOffset = offset;
          return this.update();
        },
        // @method getIcon: Icon
        // Returns the current icon used by the marker
        getIcon: function() {
          return this.options.icon;
        },
        // @method setIcon(icon: Icon): this
        // Changes the marker icon.
        setIcon: function(icon2) {
          this.options.icon = icon2;
          if (this._map) {
            this._initIcon();
            this.update();
          }
          if (this._popup) {
            this.bindPopup(this._popup, this._popup.options);
          }
          return this;
        },
        getElement: function() {
          return this._icon;
        },
        update: function() {
          if (this._icon && this._map) {
            var pos = this._map.latLngToLayerPoint(this._latlng).round();
            this._setPos(pos);
          }
          return this;
        },
        _initIcon: function() {
          var options = this.options, classToAdd = "leaflet-zoom-" + (this._zoomAnimated ? "animated" : "hide");
          var icon2 = options.icon.createIcon(this._icon), addIcon = false;
          if (icon2 !== this._icon) {
            if (this._icon) {
              this._removeIcon();
            }
            addIcon = true;
            if (options.title) {
              icon2.title = options.title;
            }
            if (icon2.tagName === "IMG") {
              icon2.alt = options.alt || "";
            }
          }
          addClass(icon2, classToAdd);
          if (options.keyboard) {
            icon2.tabIndex = "0";
            icon2.setAttribute("role", "button");
          }
          this._icon = icon2;
          if (options.riseOnHover) {
            this.on({
              mouseover: this._bringToFront,
              mouseout: this._resetZIndex
            });
          }
          if (this.options.autoPanOnFocus) {
            on(icon2, "focus", this._panOnFocus, this);
          }
          var newShadow = options.icon.createShadow(this._shadow), addShadow = false;
          if (newShadow !== this._shadow) {
            this._removeShadow();
            addShadow = true;
          }
          if (newShadow) {
            addClass(newShadow, classToAdd);
            newShadow.alt = "";
          }
          this._shadow = newShadow;
          if (options.opacity < 1) {
            this._updateOpacity();
          }
          if (addIcon) {
            this.getPane().appendChild(this._icon);
          }
          this._initInteraction();
          if (newShadow && addShadow) {
            this.getPane(options.shadowPane).appendChild(this._shadow);
          }
        },
        _removeIcon: function() {
          if (this.options.riseOnHover) {
            this.off({
              mouseover: this._bringToFront,
              mouseout: this._resetZIndex
            });
          }
          if (this.options.autoPanOnFocus) {
            off(this._icon, "focus", this._panOnFocus, this);
          }
          remove(this._icon);
          this.removeInteractiveTarget(this._icon);
          this._icon = null;
        },
        _removeShadow: function() {
          if (this._shadow) {
            remove(this._shadow);
          }
          this._shadow = null;
        },
        _setPos: function(pos) {
          if (this._icon) {
            setPosition(this._icon, pos);
          }
          if (this._shadow) {
            setPosition(this._shadow, pos);
          }
          this._zIndex = pos.y + this.options.zIndexOffset;
          this._resetZIndex();
        },
        _updateZIndex: function(offset) {
          if (this._icon) {
            this._icon.style.zIndex = this._zIndex + offset;
          }
        },
        _animateZoom: function(opt) {
          var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();
          this._setPos(pos);
        },
        _initInteraction: function() {
          if (!this.options.interactive) {
            return;
          }
          addClass(this._icon, "leaflet-interactive");
          this.addInteractiveTarget(this._icon);
          if (MarkerDrag) {
            var draggable = this.options.draggable;
            if (this.dragging) {
              draggable = this.dragging.enabled();
              this.dragging.disable();
            }
            this.dragging = new MarkerDrag(this);
            if (draggable) {
              this.dragging.enable();
            }
          }
        },
        // @method setOpacity(opacity: Number): this
        // Changes the opacity of the marker.
        setOpacity: function(opacity) {
          this.options.opacity = opacity;
          if (this._map) {
            this._updateOpacity();
          }
          return this;
        },
        _updateOpacity: function() {
          var opacity = this.options.opacity;
          if (this._icon) {
            setOpacity(this._icon, opacity);
          }
          if (this._shadow) {
            setOpacity(this._shadow, opacity);
          }
        },
        _bringToFront: function() {
          this._updateZIndex(this.options.riseOffset);
        },
        _resetZIndex: function() {
          this._updateZIndex(0);
        },
        _panOnFocus: function() {
          var map = this._map;
          if (!map) {
            return;
          }
          var iconOpts = this.options.icon.options;
          var size = iconOpts.iconSize ? toPoint(iconOpts.iconSize) : toPoint(0, 0);
          var anchor = iconOpts.iconAnchor ? toPoint(iconOpts.iconAnchor) : toPoint(0, 0);
          map.panInside(this._latlng, {
            paddingTopLeft: anchor,
            paddingBottomRight: size.subtract(anchor)
          });
        },
        _getPopupAnchor: function() {
          return this.options.icon.options.popupAnchor;
        },
        _getTooltipAnchor: function() {
          return this.options.icon.options.tooltipAnchor;
        }
      });
      function marker(latlng, options) {
        return new Marker(latlng, options);
      }
      var Path = Layer.extend({
        // @section
        // @aka Path options
        options: {
          // @option stroke: Boolean = true
          // Whether to draw stroke along the path. Set it to `false` to disable borders on polygons or circles.
          stroke: true,
          // @option color: String = '#3388ff'
          // Stroke color
          color: "#3388ff",
          // @option weight: Number = 3
          // Stroke width in pixels
          weight: 3,
          // @option opacity: Number = 1.0
          // Stroke opacity
          opacity: 1,
          // @option lineCap: String= 'round'
          // A string that defines [shape to be used at the end](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-linecap) of the stroke.
          lineCap: "round",
          // @option lineJoin: String = 'round'
          // A string that defines [shape to be used at the corners](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-linejoin) of the stroke.
          lineJoin: "round",
          // @option dashArray: String = null
          // A string that defines the stroke [dash pattern](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-dasharray). Doesn't work on `Canvas`-powered layers in [some old browsers](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/setLineDash#Browser_compatibility).
          dashArray: null,
          // @option dashOffset: String = null
          // A string that defines the [distance into the dash pattern to start the dash](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-dashoffset). Doesn't work on `Canvas`-powered layers in [some old browsers](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/setLineDash#Browser_compatibility).
          dashOffset: null,
          // @option fill: Boolean = depends
          // Whether to fill the path with color. Set it to `false` to disable filling on polygons or circles.
          fill: false,
          // @option fillColor: String = *
          // Fill color. Defaults to the value of the [`color`](#path-color) option
          fillColor: null,
          // @option fillOpacity: Number = 0.2
          // Fill opacity.
          fillOpacity: 0.2,
          // @option fillRule: String = 'evenodd'
          // A string that defines [how the inside of a shape](https://developer.mozilla.org/docs/Web/SVG/Attribute/fill-rule) is determined.
          fillRule: "evenodd",
          // className: '',
          // Option inherited from "Interactive layer" abstract class
          interactive: true,
          // @option bubblingMouseEvents: Boolean = true
          // When `true`, a mouse event on this path will trigger the same event on the map
          // (unless [`L.DomEvent.stopPropagation`](#domevent-stoppropagation) is used).
          bubblingMouseEvents: true
        },
        beforeAdd: function(map) {
          this._renderer = map.getRenderer(this);
        },
        onAdd: function() {
          this._renderer._initPath(this);
          this._reset();
          this._renderer._addPath(this);
        },
        onRemove: function() {
          this._renderer._removePath(this);
        },
        // @method redraw(): this
        // Redraws the layer. Sometimes useful after you changed the coordinates that the path uses.
        redraw: function() {
          if (this._map) {
            this._renderer._updatePath(this);
          }
          return this;
        },
        // @method setStyle(style: Path options): this
        // Changes the appearance of a Path based on the options in the `Path options` object.
        setStyle: function(style3) {
          setOptions(this, style3);
          if (this._renderer) {
            this._renderer._updateStyle(this);
            if (this.options.stroke && style3 && Object.prototype.hasOwnProperty.call(style3, "weight")) {
              this._updateBounds();
            }
          }
          return this;
        },
        // @method bringToFront(): this
        // Brings the layer to the top of all path layers.
        bringToFront: function() {
          if (this._renderer) {
            this._renderer._bringToFront(this);
          }
          return this;
        },
        // @method bringToBack(): this
        // Brings the layer to the bottom of all path layers.
        bringToBack: function() {
          if (this._renderer) {
            this._renderer._bringToBack(this);
          }
          return this;
        },
        getElement: function() {
          return this._path;
        },
        _reset: function() {
          this._project();
          this._update();
        },
        _clickTolerance: function() {
          return (this.options.stroke ? this.options.weight / 2 : 0) + (this._renderer.options.tolerance || 0);
        }
      });
      var CircleMarker = Path.extend({
        // @section
        // @aka CircleMarker options
        options: {
          fill: true,
          // @option radius: Number = 10
          // Radius of the circle marker, in pixels
          radius: 10
        },
        initialize: function(latlng, options) {
          setOptions(this, options);
          this._latlng = toLatLng(latlng);
          this._radius = this.options.radius;
        },
        // @method setLatLng(latLng: LatLng): this
        // Sets the position of a circle marker to a new location.
        setLatLng: function(latlng) {
          var oldLatLng = this._latlng;
          this._latlng = toLatLng(latlng);
          this.redraw();
          return this.fire("move", { oldLatLng, latlng: this._latlng });
        },
        // @method getLatLng(): LatLng
        // Returns the current geographical position of the circle marker
        getLatLng: function() {
          return this._latlng;
        },
        // @method setRadius(radius: Number): this
        // Sets the radius of a circle marker. Units are in pixels.
        setRadius: function(radius) {
          this.options.radius = this._radius = radius;
          return this.redraw();
        },
        // @method getRadius(): Number
        // Returns the current radius of the circle
        getRadius: function() {
          return this._radius;
        },
        setStyle: function(options) {
          var radius = options && options.radius || this._radius;
          Path.prototype.setStyle.call(this, options);
          this.setRadius(radius);
          return this;
        },
        _project: function() {
          this._point = this._map.latLngToLayerPoint(this._latlng);
          this._updateBounds();
        },
        _updateBounds: function() {
          var r2 = this._radius, r22 = this._radiusY || r2, w = this._clickTolerance(), p = [r2 + w, r22 + w];
          this._pxBounds = new Bounds(this._point.subtract(p), this._point.add(p));
        },
        _update: function() {
          if (this._map) {
            this._updatePath();
          }
        },
        _updatePath: function() {
          this._renderer._updateCircle(this);
        },
        _empty: function() {
          return this._radius && !this._renderer._bounds.intersects(this._pxBounds);
        },
        // Needed by the `Canvas` renderer for interactivity
        _containsPoint: function(p) {
          return p.distanceTo(this._point) <= this._radius + this._clickTolerance();
        }
      });
      function circleMarker(latlng, options) {
        return new CircleMarker(latlng, options);
      }
      var Circle = CircleMarker.extend({
        initialize: function(latlng, options, legacyOptions) {
          if (typeof options === "number") {
            options = extend({}, legacyOptions, { radius: options });
          }
          setOptions(this, options);
          this._latlng = toLatLng(latlng);
          if (isNaN(this.options.radius)) {
            throw new Error("Circle radius cannot be NaN");
          }
          this._mRadius = this.options.radius;
        },
        // @method setRadius(radius: Number): this
        // Sets the radius of a circle. Units are in meters.
        setRadius: function(radius) {
          this._mRadius = radius;
          return this.redraw();
        },
        // @method getRadius(): Number
        // Returns the current radius of a circle. Units are in meters.
        getRadius: function() {
          return this._mRadius;
        },
        // @method getBounds(): LatLngBounds
        // Returns the `LatLngBounds` of the path.
        getBounds: function() {
          var half = [this._radius, this._radiusY || this._radius];
          return new LatLngBounds(
            this._map.layerPointToLatLng(this._point.subtract(half)),
            this._map.layerPointToLatLng(this._point.add(half))
          );
        },
        setStyle: Path.prototype.setStyle,
        _project: function() {
          var lng = this._latlng.lng, lat = this._latlng.lat, map = this._map, crs = map.options.crs;
          if (crs.distance === Earth.distance) {
            var d = Math.PI / 180, latR = this._mRadius / Earth.R / d, top = map.project([lat + latR, lng]), bottom = map.project([lat - latR, lng]), p = top.add(bottom).divideBy(2), lat2 = map.unproject(p).lat, lngR = Math.acos((Math.cos(latR * d) - Math.sin(lat * d) * Math.sin(lat2 * d)) / (Math.cos(lat * d) * Math.cos(lat2 * d))) / d;
            if (isNaN(lngR) || lngR === 0) {
              lngR = latR / Math.cos(Math.PI / 180 * lat);
            }
            this._point = p.subtract(map.getPixelOrigin());
            this._radius = isNaN(lngR) ? 0 : p.x - map.project([lat2, lng - lngR]).x;
            this._radiusY = p.y - top.y;
          } else {
            var latlng2 = crs.unproject(crs.project(this._latlng).subtract([this._mRadius, 0]));
            this._point = map.latLngToLayerPoint(this._latlng);
            this._radius = this._point.x - map.latLngToLayerPoint(latlng2).x;
          }
          this._updateBounds();
        }
      });
      function circle(latlng, options, legacyOptions) {
        return new Circle(latlng, options, legacyOptions);
      }
      var Polyline = Path.extend({
        // @section
        // @aka Polyline options
        options: {
          // @option smoothFactor: Number = 1.0
          // How much to simplify the polyline on each zoom level. More means
          // better performance and smoother look, and less means more accurate representation.
          smoothFactor: 1,
          // @option noClip: Boolean = false
          // Disable polyline clipping.
          noClip: false
        },
        initialize: function(latlngs, options) {
          setOptions(this, options);
          this._setLatLngs(latlngs);
        },
        // @method getLatLngs(): LatLng[]
        // Returns an array of the points in the path, or nested arrays of points in case of multi-polyline.
        getLatLngs: function() {
          return this._latlngs;
        },
        // @method setLatLngs(latlngs: LatLng[]): this
        // Replaces all the points in the polyline with the given array of geographical points.
        setLatLngs: function(latlngs) {
          this._setLatLngs(latlngs);
          return this.redraw();
        },
        // @method isEmpty(): Boolean
        // Returns `true` if the Polyline has no LatLngs.
        isEmpty: function() {
          return !this._latlngs.length;
        },
        // @method closestLayerPoint(p: Point): Point
        // Returns the point closest to `p` on the Polyline.
        closestLayerPoint: function(p) {
          var minDistance = Infinity, minPoint = null, closest = _sqClosestPointOnSegment, p1, p2;
          for (var j = 0, jLen = this._parts.length; j < jLen; j++) {
            var points = this._parts[j];
            for (var i = 1, len = points.length; i < len; i++) {
              p1 = points[i - 1];
              p2 = points[i];
              var sqDist = closest(p, p1, p2, true);
              if (sqDist < minDistance) {
                minDistance = sqDist;
                minPoint = closest(p, p1, p2);
              }
            }
          }
          if (minPoint) {
            minPoint.distance = Math.sqrt(minDistance);
          }
          return minPoint;
        },
        // @method getCenter(): LatLng
        // Returns the center ([centroid](https://en.wikipedia.org/wiki/Centroid)) of the polyline.
        getCenter: function() {
          if (!this._map) {
            throw new Error("Must add layer to map before using getCenter()");
          }
          return polylineCenter(this._defaultShape(), this._map.options.crs);
        },
        // @method getBounds(): LatLngBounds
        // Returns the `LatLngBounds` of the path.
        getBounds: function() {
          return this._bounds;
        },
        // @method addLatLng(latlng: LatLng, latlngs?: LatLng[]): this
        // Adds a given point to the polyline. By default, adds to the first ring of
        // the polyline in case of a multi-polyline, but can be overridden by passing
        // a specific ring as a LatLng array (that you can earlier access with [`getLatLngs`](#polyline-getlatlngs)).
        addLatLng: function(latlng, latlngs) {
          latlngs = latlngs || this._defaultShape();
          latlng = toLatLng(latlng);
          latlngs.push(latlng);
          this._bounds.extend(latlng);
          return this.redraw();
        },
        _setLatLngs: function(latlngs) {
          this._bounds = new LatLngBounds();
          this._latlngs = this._convertLatLngs(latlngs);
        },
        _defaultShape: function() {
          return isFlat(this._latlngs) ? this._latlngs : this._latlngs[0];
        },
        // recursively convert latlngs input into actual LatLng instances; calculate bounds along the way
        _convertLatLngs: function(latlngs) {
          var result = [], flat = isFlat(latlngs);
          for (var i = 0, len = latlngs.length; i < len; i++) {
            if (flat) {
              result[i] = toLatLng(latlngs[i]);
              this._bounds.extend(result[i]);
            } else {
              result[i] = this._convertLatLngs(latlngs[i]);
            }
          }
          return result;
        },
        _project: function() {
          var pxBounds = new Bounds();
          this._rings = [];
          this._projectLatlngs(this._latlngs, this._rings, pxBounds);
          if (this._bounds.isValid() && pxBounds.isValid()) {
            this._rawPxBounds = pxBounds;
            this._updateBounds();
          }
        },
        _updateBounds: function() {
          var w = this._clickTolerance(), p = new Point(w, w);
          if (!this._rawPxBounds) {
            return;
          }
          this._pxBounds = new Bounds([
            this._rawPxBounds.min.subtract(p),
            this._rawPxBounds.max.add(p)
          ]);
        },
        // recursively turns latlngs into a set of rings with projected coordinates
        _projectLatlngs: function(latlngs, result, projectedBounds) {
          var flat = latlngs[0] instanceof LatLng, len = latlngs.length, i, ring;
          if (flat) {
            ring = [];
            for (i = 0; i < len; i++) {
              ring[i] = this._map.latLngToLayerPoint(latlngs[i]);
              projectedBounds.extend(ring[i]);
            }
            result.push(ring);
          } else {
            for (i = 0; i < len; i++) {
              this._projectLatlngs(latlngs[i], result, projectedBounds);
            }
          }
        },
        // clip polyline by renderer bounds so that we have less to render for performance
        _clipPoints: function() {
          var bounds = this._renderer._bounds;
          this._parts = [];
          if (!this._pxBounds || !this._pxBounds.intersects(bounds)) {
            return;
          }
          if (this.options.noClip) {
            this._parts = this._rings;
            return;
          }
          var parts = this._parts, i, j, k, len, len2, segment, points;
          for (i = 0, k = 0, len = this._rings.length; i < len; i++) {
            points = this._rings[i];
            for (j = 0, len2 = points.length; j < len2 - 1; j++) {
              segment = clipSegment(points[j], points[j + 1], bounds, j, true);
              if (!segment) {
                continue;
              }
              parts[k] = parts[k] || [];
              parts[k].push(segment[0]);
              if (segment[1] !== points[j + 1] || j === len2 - 2) {
                parts[k].push(segment[1]);
                k++;
              }
            }
          }
        },
        // simplify each clipped part of the polyline for performance
        _simplifyPoints: function() {
          var parts = this._parts, tolerance = this.options.smoothFactor;
          for (var i = 0, len = parts.length; i < len; i++) {
            parts[i] = simplify(parts[i], tolerance);
          }
        },
        _update: function() {
          if (!this._map) {
            return;
          }
          this._clipPoints();
          this._simplifyPoints();
          this._updatePath();
        },
        _updatePath: function() {
          this._renderer._updatePoly(this);
        },
        // Needed by the `Canvas` renderer for interactivity
        _containsPoint: function(p, closed) {
          var i, j, k, len, len2, part, w = this._clickTolerance();
          if (!this._pxBounds || !this._pxBounds.contains(p)) {
            return false;
          }
          for (i = 0, len = this._parts.length; i < len; i++) {
            part = this._parts[i];
            for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
              if (!closed && j === 0) {
                continue;
              }
              if (pointToSegmentDistance(p, part[k], part[j]) <= w) {
                return true;
              }
            }
          }
          return false;
        }
      });
      function polyline(latlngs, options) {
        return new Polyline(latlngs, options);
      }
      Polyline._flat = _flat;
      var Polygon = Polyline.extend({
        options: {
          fill: true
        },
        isEmpty: function() {
          return !this._latlngs.length || !this._latlngs[0].length;
        },
        // @method getCenter(): LatLng
        // Returns the center ([centroid](http://en.wikipedia.org/wiki/Centroid)) of the Polygon.
        getCenter: function() {
          if (!this._map) {
            throw new Error("Must add layer to map before using getCenter()");
          }
          return polygonCenter(this._defaultShape(), this._map.options.crs);
        },
        _convertLatLngs: function(latlngs) {
          var result = Polyline.prototype._convertLatLngs.call(this, latlngs), len = result.length;
          if (len >= 2 && result[0] instanceof LatLng && result[0].equals(result[len - 1])) {
            result.pop();
          }
          return result;
        },
        _setLatLngs: function(latlngs) {
          Polyline.prototype._setLatLngs.call(this, latlngs);
          if (isFlat(this._latlngs)) {
            this._latlngs = [this._latlngs];
          }
        },
        _defaultShape: function() {
          return isFlat(this._latlngs[0]) ? this._latlngs[0] : this._latlngs[0][0];
        },
        _clipPoints: function() {
          var bounds = this._renderer._bounds, w = this.options.weight, p = new Point(w, w);
          bounds = new Bounds(bounds.min.subtract(p), bounds.max.add(p));
          this._parts = [];
          if (!this._pxBounds || !this._pxBounds.intersects(bounds)) {
            return;
          }
          if (this.options.noClip) {
            this._parts = this._rings;
            return;
          }
          for (var i = 0, len = this._rings.length, clipped; i < len; i++) {
            clipped = clipPolygon(this._rings[i], bounds, true);
            if (clipped.length) {
              this._parts.push(clipped);
            }
          }
        },
        _updatePath: function() {
          this._renderer._updatePoly(this, true);
        },
        // Needed by the `Canvas` renderer for interactivity
        _containsPoint: function(p) {
          var inside = false, part, p1, p2, i, j, k, len, len2;
          if (!this._pxBounds || !this._pxBounds.contains(p)) {
            return false;
          }
          for (i = 0, len = this._parts.length; i < len; i++) {
            part = this._parts[i];
            for (j = 0, len2 = part.length, k = len2 - 1; j < len2; k = j++) {
              p1 = part[j];
              p2 = part[k];
              if (p1.y > p.y !== p2.y > p.y && p.x < (p2.x - p1.x) * (p.y - p1.y) / (p2.y - p1.y) + p1.x) {
                inside = !inside;
              }
            }
          }
          return inside || Polyline.prototype._containsPoint.call(this, p, true);
        }
      });
      function polygon(latlngs, options) {
        return new Polygon(latlngs, options);
      }
      var GeoJSON = FeatureGroup.extend({
        /* @section
         * @aka GeoJSON options
         *
         * @option pointToLayer: Function = *
         * A `Function` defining how GeoJSON points spawn Leaflet layers. It is internally
         * called when data is added, passing the GeoJSON point feature and its `LatLng`.
         * The default is to spawn a default `Marker`:
         * ```js
         * function(geoJsonPoint, latlng) {
         * 	return L.marker(latlng);
         * }
         * ```
         *
         * @option style: Function = *
         * A `Function` defining the `Path options` for styling GeoJSON lines and polygons,
         * called internally when data is added.
         * The default value is to not override any defaults:
         * ```js
         * function (geoJsonFeature) {
         * 	return {}
         * }
         * ```
         *
         * @option onEachFeature: Function = *
         * A `Function` that will be called once for each created `Feature`, after it has
         * been created and styled. Useful for attaching events and popups to features.
         * The default is to do nothing with the newly created layers:
         * ```js
         * function (feature, layer) {}
         * ```
         *
         * @option filter: Function = *
         * A `Function` that will be used to decide whether to include a feature or not.
         * The default is to include all features:
         * ```js
         * function (geoJsonFeature) {
         * 	return true;
         * }
         * ```
         * Note: dynamically changing the `filter` option will have effect only on newly
         * added data. It will _not_ re-evaluate already included features.
         *
         * @option coordsToLatLng: Function = *
         * A `Function` that will be used for converting GeoJSON coordinates to `LatLng`s.
         * The default is the `coordsToLatLng` static method.
         *
         * @option markersInheritOptions: Boolean = false
         * Whether default Markers for "Point" type Features inherit from group options.
         */
        initialize: function(geojson, options) {
          setOptions(this, options);
          this._layers = {};
          if (geojson) {
            this.addData(geojson);
          }
        },
        // @method addData( <GeoJSON> data ): this
        // Adds a GeoJSON object to the layer.
        addData: function(geojson) {
          var features = isArray(geojson) ? geojson : geojson.features, i, len, feature;
          if (features) {
            for (i = 0, len = features.length; i < len; i++) {
              feature = features[i];
              if (feature.geometries || feature.geometry || feature.features || feature.coordinates) {
                this.addData(feature);
              }
            }
            return this;
          }
          var options = this.options;
          if (options.filter && !options.filter(geojson)) {
            return this;
          }
          var layer = geometryToLayer(geojson, options);
          if (!layer) {
            return this;
          }
          layer.feature = asFeature(geojson);
          layer.defaultOptions = layer.options;
          this.resetStyle(layer);
          if (options.onEachFeature) {
            options.onEachFeature(geojson, layer);
          }
          return this.addLayer(layer);
        },
        // @method resetStyle( <Path> layer? ): this
        // Resets the given vector layer's style to the original GeoJSON style, useful for resetting style after hover events.
        // If `layer` is omitted, the style of all features in the current layer is reset.
        resetStyle: function(layer) {
          if (layer === void 0) {
            return this.eachLayer(this.resetStyle, this);
          }
          layer.options = extend({}, layer.defaultOptions);
          this._setLayerStyle(layer, this.options.style);
          return this;
        },
        // @method setStyle( <Function> style ): this
        // Changes styles of GeoJSON vector layers with the given style function.
        setStyle: function(style3) {
          return this.eachLayer(function(layer) {
            this._setLayerStyle(layer, style3);
          }, this);
        },
        _setLayerStyle: function(layer, style3) {
          if (layer.setStyle) {
            if (typeof style3 === "function") {
              style3 = style3(layer.feature);
            }
            layer.setStyle(style3);
          }
        }
      });
      function geometryToLayer(geojson, options) {
        var geometry = geojson.type === "Feature" ? geojson.geometry : geojson, coords = geometry ? geometry.coordinates : null, layers2 = [], pointToLayer = options && options.pointToLayer, _coordsToLatLng = options && options.coordsToLatLng || coordsToLatLng, latlng, latlngs, i, len;
        if (!coords && !geometry) {
          return null;
        }
        switch (geometry.type) {
          case "Point":
            latlng = _coordsToLatLng(coords);
            return _pointToLayer(pointToLayer, geojson, latlng, options);
          case "MultiPoint":
            for (i = 0, len = coords.length; i < len; i++) {
              latlng = _coordsToLatLng(coords[i]);
              layers2.push(_pointToLayer(pointToLayer, geojson, latlng, options));
            }
            return new FeatureGroup(layers2);
          case "LineString":
          case "MultiLineString":
            latlngs = coordsToLatLngs(coords, geometry.type === "LineString" ? 0 : 1, _coordsToLatLng);
            return new Polyline(latlngs, options);
          case "Polygon":
          case "MultiPolygon":
            latlngs = coordsToLatLngs(coords, geometry.type === "Polygon" ? 1 : 2, _coordsToLatLng);
            return new Polygon(latlngs, options);
          case "GeometryCollection":
            for (i = 0, len = geometry.geometries.length; i < len; i++) {
              var geoLayer = geometryToLayer({
                geometry: geometry.geometries[i],
                type: "Feature",
                properties: geojson.properties
              }, options);
              if (geoLayer) {
                layers2.push(geoLayer);
              }
            }
            return new FeatureGroup(layers2);
          case "FeatureCollection":
            for (i = 0, len = geometry.features.length; i < len; i++) {
              var featureLayer = geometryToLayer(geometry.features[i], options);
              if (featureLayer) {
                layers2.push(featureLayer);
              }
            }
            return new FeatureGroup(layers2);
          default:
            throw new Error("Invalid GeoJSON object.");
        }
      }
      function _pointToLayer(pointToLayerFn, geojson, latlng, options) {
        return pointToLayerFn ? pointToLayerFn(geojson, latlng) : new Marker(latlng, options && options.markersInheritOptions && options);
      }
      function coordsToLatLng(coords) {
        return new LatLng(coords[1], coords[0], coords[2]);
      }
      function coordsToLatLngs(coords, levelsDeep, _coordsToLatLng) {
        var latlngs = [];
        for (var i = 0, len = coords.length, latlng; i < len; i++) {
          latlng = levelsDeep ? coordsToLatLngs(coords[i], levelsDeep - 1, _coordsToLatLng) : (_coordsToLatLng || coordsToLatLng)(coords[i]);
          latlngs.push(latlng);
        }
        return latlngs;
      }
      function latLngToCoords(latlng, precision) {
        latlng = toLatLng(latlng);
        return latlng.alt !== void 0 ? [formatNum(latlng.lng, precision), formatNum(latlng.lat, precision), formatNum(latlng.alt, precision)] : [formatNum(latlng.lng, precision), formatNum(latlng.lat, precision)];
      }
      function latLngsToCoords(latlngs, levelsDeep, closed, precision) {
        var coords = [];
        for (var i = 0, len = latlngs.length; i < len; i++) {
          coords.push(levelsDeep ? latLngsToCoords(latlngs[i], isFlat(latlngs[i]) ? 0 : levelsDeep - 1, closed, precision) : latLngToCoords(latlngs[i], precision));
        }
        if (!levelsDeep && closed && coords.length > 0) {
          coords.push(coords[0].slice());
        }
        return coords;
      }
      function getFeature(layer, newGeometry) {
        return layer.feature ? extend({}, layer.feature, { geometry: newGeometry }) : asFeature(newGeometry);
      }
      function asFeature(geojson) {
        if (geojson.type === "Feature" || geojson.type === "FeatureCollection") {
          return geojson;
        }
        return {
          type: "Feature",
          properties: {},
          geometry: geojson
        };
      }
      var PointToGeoJSON = {
        toGeoJSON: function(precision) {
          return getFeature(this, {
            type: "Point",
            coordinates: latLngToCoords(this.getLatLng(), precision)
          });
        }
      };
      Marker.include(PointToGeoJSON);
      Circle.include(PointToGeoJSON);
      CircleMarker.include(PointToGeoJSON);
      Polyline.include({
        toGeoJSON: function(precision) {
          var multi = !isFlat(this._latlngs);
          var coords = latLngsToCoords(this._latlngs, multi ? 1 : 0, false, precision);
          return getFeature(this, {
            type: (multi ? "Multi" : "") + "LineString",
            coordinates: coords
          });
        }
      });
      Polygon.include({
        toGeoJSON: function(precision) {
          var holes = !isFlat(this._latlngs), multi = holes && !isFlat(this._latlngs[0]);
          var coords = latLngsToCoords(this._latlngs, multi ? 2 : holes ? 1 : 0, true, precision);
          if (!holes) {
            coords = [coords];
          }
          return getFeature(this, {
            type: (multi ? "Multi" : "") + "Polygon",
            coordinates: coords
          });
        }
      });
      LayerGroup.include({
        toMultiPoint: function(precision) {
          var coords = [];
          this.eachLayer(function(layer) {
            coords.push(layer.toGeoJSON(precision).geometry.coordinates);
          });
          return getFeature(this, {
            type: "MultiPoint",
            coordinates: coords
          });
        },
        // @method toGeoJSON(precision?: Number|false): Object
        // Coordinates values are rounded with [`formatNum`](#util-formatnum) function with given `precision`.
        // Returns a [`GeoJSON`](https://en.wikipedia.org/wiki/GeoJSON) representation of the layer group (as a GeoJSON `FeatureCollection`, `GeometryCollection`, or `MultiPoint`).
        toGeoJSON: function(precision) {
          var type = this.feature && this.feature.geometry && this.feature.geometry.type;
          if (type === "MultiPoint") {
            return this.toMultiPoint(precision);
          }
          var isGeometryCollection = type === "GeometryCollection", jsons = [];
          this.eachLayer(function(layer) {
            if (layer.toGeoJSON) {
              var json = layer.toGeoJSON(precision);
              if (isGeometryCollection) {
                jsons.push(json.geometry);
              } else {
                var feature = asFeature(json);
                if (feature.type === "FeatureCollection") {
                  jsons.push.apply(jsons, feature.features);
                } else {
                  jsons.push(feature);
                }
              }
            }
          });
          if (isGeometryCollection) {
            return getFeature(this, {
              geometries: jsons,
              type: "GeometryCollection"
            });
          }
          return {
            type: "FeatureCollection",
            features: jsons
          };
        }
      });
      function geoJSON(geojson, options) {
        return new GeoJSON(geojson, options);
      }
      var geoJson = geoJSON;
      var ImageOverlay = Layer.extend({
        // @section
        // @aka ImageOverlay options
        options: {
          // @option opacity: Number = 1.0
          // The opacity of the image overlay.
          opacity: 1,
          // @option alt: String = ''
          // Text for the `alt` attribute of the image (useful for accessibility).
          alt: "",
          // @option interactive: Boolean = false
          // If `true`, the image overlay will emit [mouse events](#interactive-layer) when clicked or hovered.
          interactive: false,
          // @option crossOrigin: Boolean|String = false
          // Whether the crossOrigin attribute will be added to the image.
          // If a String is provided, the image will have its crossOrigin attribute set to the String provided. This is needed if you want to access image pixel data.
          // Refer to [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes) for valid String values.
          crossOrigin: false,
          // @option errorOverlayUrl: String = ''
          // URL to the overlay image to show in place of the overlay that failed to load.
          errorOverlayUrl: "",
          // @option zIndex: Number = 1
          // The explicit [zIndex](https://developer.mozilla.org/docs/Web/CSS/CSS_Positioning/Understanding_z_index) of the overlay layer.
          zIndex: 1,
          // @option className: String = ''
          // A custom class name to assign to the image. Empty by default.
          className: ""
        },
        initialize: function(url, bounds, options) {
          this._url = url;
          this._bounds = toLatLngBounds(bounds);
          setOptions(this, options);
        },
        onAdd: function() {
          if (!this._image) {
            this._initImage();
            if (this.options.opacity < 1) {
              this._updateOpacity();
            }
          }
          if (this.options.interactive) {
            addClass(this._image, "leaflet-interactive");
            this.addInteractiveTarget(this._image);
          }
          this.getPane().appendChild(this._image);
          this._reset();
        },
        onRemove: function() {
          remove(this._image);
          if (this.options.interactive) {
            this.removeInteractiveTarget(this._image);
          }
        },
        // @method setOpacity(opacity: Number): this
        // Sets the opacity of the overlay.
        setOpacity: function(opacity) {
          this.options.opacity = opacity;
          if (this._image) {
            this._updateOpacity();
          }
          return this;
        },
        setStyle: function(styleOpts) {
          if (styleOpts.opacity) {
            this.setOpacity(styleOpts.opacity);
          }
          return this;
        },
        // @method bringToFront(): this
        // Brings the layer to the top of all overlays.
        bringToFront: function() {
          if (this._map) {
            toFront(this._image);
          }
          return this;
        },
        // @method bringToBack(): this
        // Brings the layer to the bottom of all overlays.
        bringToBack: function() {
          if (this._map) {
            toBack(this._image);
          }
          return this;
        },
        // @method setUrl(url: String): this
        // Changes the URL of the image.
        setUrl: function(url) {
          this._url = url;
          if (this._image) {
            this._image.src = url;
          }
          return this;
        },
        // @method setBounds(bounds: LatLngBounds): this
        // Update the bounds that this ImageOverlay covers
        setBounds: function(bounds) {
          this._bounds = toLatLngBounds(bounds);
          if (this._map) {
            this._reset();
          }
          return this;
        },
        getEvents: function() {
          var events = {
            zoom: this._reset,
            viewreset: this._reset
          };
          if (this._zoomAnimated) {
            events.zoomanim = this._animateZoom;
          }
          return events;
        },
        // @method setZIndex(value: Number): this
        // Changes the [zIndex](#imageoverlay-zindex) of the image overlay.
        setZIndex: function(value) {
          this.options.zIndex = value;
          this._updateZIndex();
          return this;
        },
        // @method getBounds(): LatLngBounds
        // Get the bounds that this ImageOverlay covers
        getBounds: function() {
          return this._bounds;
        },
        // @method getElement(): HTMLElement
        // Returns the instance of [`HTMLImageElement`](https://developer.mozilla.org/docs/Web/API/HTMLImageElement)
        // used by this overlay.
        getElement: function() {
          return this._image;
        },
        _initImage: function() {
          var wasElementSupplied = this._url.tagName === "IMG";
          var img = this._image = wasElementSupplied ? this._url : create$1("img");
          addClass(img, "leaflet-image-layer");
          if (this._zoomAnimated) {
            addClass(img, "leaflet-zoom-animated");
          }
          if (this.options.className) {
            addClass(img, this.options.className);
          }
          img.onselectstart = falseFn;
          img.onmousemove = falseFn;
          img.onload = bind(this.fire, this, "load");
          img.onerror = bind(this._overlayOnError, this, "error");
          if (this.options.crossOrigin || this.options.crossOrigin === "") {
            img.crossOrigin = this.options.crossOrigin === true ? "" : this.options.crossOrigin;
          }
          if (this.options.zIndex) {
            this._updateZIndex();
          }
          if (wasElementSupplied) {
            this._url = img.src;
            return;
          }
          img.src = this._url;
          img.alt = this.options.alt;
        },
        _animateZoom: function(e) {
          var scale2 = this._map.getZoomScale(e.zoom), offset = this._map._latLngBoundsToNewLayerBounds(this._bounds, e.zoom, e.center).min;
          setTransform(this._image, offset, scale2);
        },
        _reset: function() {
          var image = this._image, bounds = new Bounds(
            this._map.latLngToLayerPoint(this._bounds.getNorthWest()),
            this._map.latLngToLayerPoint(this._bounds.getSouthEast())
          ), size = bounds.getSize();
          setPosition(image, bounds.min);
          image.style.width = size.x + "px";
          image.style.height = size.y + "px";
        },
        _updateOpacity: function() {
          setOpacity(this._image, this.options.opacity);
        },
        _updateZIndex: function() {
          if (this._image && this.options.zIndex !== void 0 && this.options.zIndex !== null) {
            this._image.style.zIndex = this.options.zIndex;
          }
        },
        _overlayOnError: function() {
          this.fire("error");
          var errorUrl = this.options.errorOverlayUrl;
          if (errorUrl && this._url !== errorUrl) {
            this._url = errorUrl;
            this._image.src = errorUrl;
          }
        },
        // @method getCenter(): LatLng
        // Returns the center of the ImageOverlay.
        getCenter: function() {
          return this._bounds.getCenter();
        }
      });
      var imageOverlay = function(url, bounds, options) {
        return new ImageOverlay(url, bounds, options);
      };
      var VideoOverlay = ImageOverlay.extend({
        // @section
        // @aka VideoOverlay options
        options: {
          // @option autoplay: Boolean = true
          // Whether the video starts playing automatically when loaded.
          // On some browsers autoplay will only work with `muted: true`
          autoplay: true,
          // @option loop: Boolean = true
          // Whether the video will loop back to the beginning when played.
          loop: true,
          // @option keepAspectRatio: Boolean = true
          // Whether the video will save aspect ratio after the projection.
          // Relevant for supported browsers. See [browser compatibility](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit)
          keepAspectRatio: true,
          // @option muted: Boolean = false
          // Whether the video starts on mute when loaded.
          muted: false,
          // @option playsInline: Boolean = true
          // Mobile browsers will play the video right where it is instead of open it up in fullscreen mode.
          playsInline: true
        },
        _initImage: function() {
          var wasElementSupplied = this._url.tagName === "VIDEO";
          var vid = this._image = wasElementSupplied ? this._url : create$1("video");
          addClass(vid, "leaflet-image-layer");
          if (this._zoomAnimated) {
            addClass(vid, "leaflet-zoom-animated");
          }
          if (this.options.className) {
            addClass(vid, this.options.className);
          }
          vid.onselectstart = falseFn;
          vid.onmousemove = falseFn;
          vid.onloadeddata = bind(this.fire, this, "load");
          if (wasElementSupplied) {
            var sourceElements = vid.getElementsByTagName("source");
            var sources = [];
            for (var j = 0; j < sourceElements.length; j++) {
              sources.push(sourceElements[j].src);
            }
            this._url = sourceElements.length > 0 ? sources : [vid.src];
            return;
          }
          if (!isArray(this._url)) {
            this._url = [this._url];
          }
          if (!this.options.keepAspectRatio && Object.prototype.hasOwnProperty.call(vid.style, "objectFit")) {
            vid.style["objectFit"] = "fill";
          }
          vid.autoplay = !!this.options.autoplay;
          vid.loop = !!this.options.loop;
          vid.muted = !!this.options.muted;
          vid.playsInline = !!this.options.playsInline;
          for (var i = 0; i < this._url.length; i++) {
            var source = create$1("source");
            source.src = this._url[i];
            vid.appendChild(source);
          }
        }
        // @method getElement(): HTMLVideoElement
        // Returns the instance of [`HTMLVideoElement`](https://developer.mozilla.org/docs/Web/API/HTMLVideoElement)
        // used by this overlay.
      });
      function videoOverlay(video, bounds, options) {
        return new VideoOverlay(video, bounds, options);
      }
      var SVGOverlay = ImageOverlay.extend({
        _initImage: function() {
          var el = this._image = this._url;
          addClass(el, "leaflet-image-layer");
          if (this._zoomAnimated) {
            addClass(el, "leaflet-zoom-animated");
          }
          if (this.options.className) {
            addClass(el, this.options.className);
          }
          el.onselectstart = falseFn;
          el.onmousemove = falseFn;
        }
        // @method getElement(): SVGElement
        // Returns the instance of [`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)
        // used by this overlay.
      });
      function svgOverlay(el, bounds, options) {
        return new SVGOverlay(el, bounds, options);
      }
      var DivOverlay = Layer.extend({
        // @section
        // @aka DivOverlay options
        options: {
          // @option interactive: Boolean = false
          // If true, the popup/tooltip will listen to the mouse events.
          interactive: false,
          // @option offset: Point = Point(0, 0)
          // The offset of the overlay position.
          offset: [0, 0],
          // @option className: String = ''
          // A custom CSS class name to assign to the overlay.
          className: "",
          // @option pane: String = undefined
          // `Map pane` where the overlay will be added.
          pane: void 0,
          // @option content: String|HTMLElement|Function = ''
          // Sets the HTML content of the overlay while initializing. If a function is passed the source layer will be
          // passed to the function. The function should return a `String` or `HTMLElement` to be used in the overlay.
          content: ""
        },
        initialize: function(options, source) {
          if (options && (options instanceof LatLng || isArray(options))) {
            this._latlng = toLatLng(options);
            setOptions(this, source);
          } else {
            setOptions(this, options);
            this._source = source;
          }
          if (this.options.content) {
            this._content = this.options.content;
          }
        },
        // @method openOn(map: Map): this
        // Adds the overlay to the map.
        // Alternative to `map.openPopup(popup)`/`.openTooltip(tooltip)`.
        openOn: function(map) {
          map = arguments.length ? map : this._source._map;
          if (!map.hasLayer(this)) {
            map.addLayer(this);
          }
          return this;
        },
        // @method close(): this
        // Closes the overlay.
        // Alternative to `map.closePopup(popup)`/`.closeTooltip(tooltip)`
        // and `layer.closePopup()`/`.closeTooltip()`.
        close: function() {
          if (this._map) {
            this._map.removeLayer(this);
          }
          return this;
        },
        // @method toggle(layer?: Layer): this
        // Opens or closes the overlay bound to layer depending on its current state.
        // Argument may be omitted only for overlay bound to layer.
        // Alternative to `layer.togglePopup()`/`.toggleTooltip()`.
        toggle: function(layer) {
          if (this._map) {
            this.close();
          } else {
            if (arguments.length) {
              this._source = layer;
            } else {
              layer = this._source;
            }
            this._prepareOpen();
            this.openOn(layer._map);
          }
          return this;
        },
        onAdd: function(map) {
          this._zoomAnimated = map._zoomAnimated;
          if (!this._container) {
            this._initLayout();
          }
          if (map._fadeAnimated) {
            setOpacity(this._container, 0);
          }
          clearTimeout(this._removeTimeout);
          this.getPane().appendChild(this._container);
          this.update();
          if (map._fadeAnimated) {
            setOpacity(this._container, 1);
          }
          this.bringToFront();
          if (this.options.interactive) {
            addClass(this._container, "leaflet-interactive");
            this.addInteractiveTarget(this._container);
          }
        },
        onRemove: function(map) {
          if (map._fadeAnimated) {
            setOpacity(this._container, 0);
            this._removeTimeout = setTimeout(bind(remove, void 0, this._container), 200);
          } else {
            remove(this._container);
          }
          if (this.options.interactive) {
            removeClass(this._container, "leaflet-interactive");
            this.removeInteractiveTarget(this._container);
          }
        },
        // @namespace DivOverlay
        // @method getLatLng: LatLng
        // Returns the geographical point of the overlay.
        getLatLng: function() {
          return this._latlng;
        },
        // @method setLatLng(latlng: LatLng): this
        // Sets the geographical point where the overlay will open.
        setLatLng: function(latlng) {
          this._latlng = toLatLng(latlng);
          if (this._map) {
            this._updatePosition();
            this._adjustPan();
          }
          return this;
        },
        // @method getContent: String|HTMLElement
        // Returns the content of the overlay.
        getContent: function() {
          return this._content;
        },
        // @method setContent(htmlContent: String|HTMLElement|Function): this
        // Sets the HTML content of the overlay. If a function is passed the source layer will be passed to the function.
        // The function should return a `String` or `HTMLElement` to be used in the overlay.
        setContent: function(content) {
          this._content = content;
          this.update();
          return this;
        },
        // @method getElement: String|HTMLElement
        // Returns the HTML container of the overlay.
        getElement: function() {
          return this._container;
        },
        // @method update: null
        // Updates the overlay content, layout and position. Useful for updating the overlay after something inside changed, e.g. image loaded.
        update: function() {
          if (!this._map) {
            return;
          }
          this._container.style.visibility = "hidden";
          this._updateContent();
          this._updateLayout();
          this._updatePosition();
          this._container.style.visibility = "";
          this._adjustPan();
        },
        getEvents: function() {
          var events = {
            zoom: this._updatePosition,
            viewreset: this._updatePosition
          };
          if (this._zoomAnimated) {
            events.zoomanim = this._animateZoom;
          }
          return events;
        },
        // @method isOpen: Boolean
        // Returns `true` when the overlay is visible on the map.
        isOpen: function() {
          return !!this._map && this._map.hasLayer(this);
        },
        // @method bringToFront: this
        // Brings this overlay in front of other overlays (in the same map pane).
        bringToFront: function() {
          if (this._map) {
            toFront(this._container);
          }
          return this;
        },
        // @method bringToBack: this
        // Brings this overlay to the back of other overlays (in the same map pane).
        bringToBack: function() {
          if (this._map) {
            toBack(this._container);
          }
          return this;
        },
        // prepare bound overlay to open: update latlng pos / content source (for FeatureGroup)
        _prepareOpen: function(latlng) {
          var source = this._source;
          if (!source._map) {
            return false;
          }
          if (source instanceof FeatureGroup) {
            source = null;
            var layers2 = this._source._layers;
            for (var id in layers2) {
              if (layers2[id]._map) {
                source = layers2[id];
                break;
              }
            }
            if (!source) {
              return false;
            }
            this._source = source;
          }
          if (!latlng) {
            if (source.getCenter) {
              latlng = source.getCenter();
            } else if (source.getLatLng) {
              latlng = source.getLatLng();
            } else if (source.getBounds) {
              latlng = source.getBounds().getCenter();
            } else {
              throw new Error("Unable to get source layer LatLng.");
            }
          }
          this.setLatLng(latlng);
          if (this._map) {
            this.update();
          }
          return true;
        },
        _updateContent: function() {
          if (!this._content) {
            return;
          }
          var node = this._contentNode;
          var content = typeof this._content === "function" ? this._content(this._source || this) : this._content;
          if (typeof content === "string") {
            node.innerHTML = content;
          } else {
            while (node.hasChildNodes()) {
              node.removeChild(node.firstChild);
            }
            node.appendChild(content);
          }
          this.fire("contentupdate");
        },
        _updatePosition: function() {
          if (!this._map) {
            return;
          }
          var pos = this._map.latLngToLayerPoint(this._latlng), offset = toPoint(this.options.offset), anchor = this._getAnchor();
          if (this._zoomAnimated) {
            setPosition(this._container, pos.add(anchor));
          } else {
            offset = offset.add(pos).add(anchor);
          }
          var bottom = this._containerBottom = -offset.y, left = this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x;
          this._container.style.bottom = bottom + "px";
          this._container.style.left = left + "px";
        },
        _getAnchor: function() {
          return [0, 0];
        }
      });
      Map2.include({
        _initOverlay: function(OverlayClass, content, latlng, options) {
          var overlay = content;
          if (!(overlay instanceof OverlayClass)) {
            overlay = new OverlayClass(options).setContent(content);
          }
          if (latlng) {
            overlay.setLatLng(latlng);
          }
          return overlay;
        }
      });
      Layer.include({
        _initOverlay: function(OverlayClass, old, content, options) {
          var overlay = content;
          if (overlay instanceof OverlayClass) {
            setOptions(overlay, options);
            overlay._source = this;
          } else {
            overlay = old && !options ? old : new OverlayClass(options, this);
            overlay.setContent(content);
          }
          return overlay;
        }
      });
      var Popup = DivOverlay.extend({
        // @section
        // @aka Popup options
        options: {
          // @option pane: String = 'popupPane'
          // `Map pane` where the popup will be added.
          pane: "popupPane",
          // @option offset: Point = Point(0, 7)
          // The offset of the popup position.
          offset: [0, 7],
          // @option maxWidth: Number = 300
          // Max width of the popup, in pixels.
          maxWidth: 300,
          // @option minWidth: Number = 50
          // Min width of the popup, in pixels.
          minWidth: 50,
          // @option maxHeight: Number = null
          // If set, creates a scrollable container of the given height
          // inside a popup if its content exceeds it.
          // The scrollable container can be styled using the
          // `leaflet-popup-scrolled` CSS class selector.
          maxHeight: null,
          // @option autoPan: Boolean = true
          // Set it to `false` if you don't want the map to do panning animation
          // to fit the opened popup.
          autoPan: true,
          // @option autoPanPaddingTopLeft: Point = null
          // The margin between the popup and the top left corner of the map
          // view after autopanning was performed.
          autoPanPaddingTopLeft: null,
          // @option autoPanPaddingBottomRight: Point = null
          // The margin between the popup and the bottom right corner of the map
          // view after autopanning was performed.
          autoPanPaddingBottomRight: null,
          // @option autoPanPadding: Point = Point(5, 5)
          // Equivalent of setting both top left and bottom right autopan padding to the same value.
          autoPanPadding: [5, 5],
          // @option keepInView: Boolean = false
          // Set it to `true` if you want to prevent users from panning the popup
          // off of the screen while it is open.
          keepInView: false,
          // @option closeButton: Boolean = true
          // Controls the presence of a close button in the popup.
          closeButton: true,
          // @option autoClose: Boolean = true
          // Set it to `false` if you want to override the default behavior of
          // the popup closing when another popup is opened.
          autoClose: true,
          // @option closeOnEscapeKey: Boolean = true
          // Set it to `false` if you want to override the default behavior of
          // the ESC key for closing of the popup.
          closeOnEscapeKey: true,
          // @option closeOnClick: Boolean = *
          // Set it if you want to override the default behavior of the popup closing when user clicks
          // on the map. Defaults to the map's [`closePopupOnClick`](#map-closepopuponclick) option.
          // @option className: String = ''
          // A custom CSS class name to assign to the popup.
          className: ""
        },
        // @namespace Popup
        // @method openOn(map: Map): this
        // Alternative to `map.openPopup(popup)`.
        // Adds the popup to the map and closes the previous one.
        openOn: function(map) {
          map = arguments.length ? map : this._source._map;
          if (!map.hasLayer(this) && map._popup && map._popup.options.autoClose) {
            map.removeLayer(map._popup);
          }
          map._popup = this;
          return DivOverlay.prototype.openOn.call(this, map);
        },
        onAdd: function(map) {
          DivOverlay.prototype.onAdd.call(this, map);
          map.fire("popupopen", { popup: this });
          if (this._source) {
            this._source.fire("popupopen", { popup: this }, true);
            if (!(this._source instanceof Path)) {
              this._source.on("preclick", stopPropagation);
            }
          }
        },
        onRemove: function(map) {
          DivOverlay.prototype.onRemove.call(this, map);
          map.fire("popupclose", { popup: this });
          if (this._source) {
            this._source.fire("popupclose", { popup: this }, true);
            if (!(this._source instanceof Path)) {
              this._source.off("preclick", stopPropagation);
            }
          }
        },
        getEvents: function() {
          var events = DivOverlay.prototype.getEvents.call(this);
          if (this.options.closeOnClick !== void 0 ? this.options.closeOnClick : this._map.options.closePopupOnClick) {
            events.preclick = this.close;
          }
          if (this.options.keepInView) {
            events.moveend = this._adjustPan;
          }
          return events;
        },
        _initLayout: function() {
          var prefix = "leaflet-popup", container = this._container = create$1(
            "div",
            prefix + " " + (this.options.className || "") + " leaflet-zoom-animated"
          );
          var wrapper = this._wrapper = create$1("div", prefix + "-content-wrapper", container);
          this._contentNode = create$1("div", prefix + "-content", wrapper);
          disableClickPropagation(container);
          disableScrollPropagation(this._contentNode);
          on(container, "contextmenu", stopPropagation);
          this._tipContainer = create$1("div", prefix + "-tip-container", container);
          this._tip = create$1("div", prefix + "-tip", this._tipContainer);
          if (this.options.closeButton) {
            var closeButton = this._closeButton = create$1("a", prefix + "-close-button", container);
            closeButton.setAttribute("role", "button");
            closeButton.setAttribute("aria-label", "Close popup");
            closeButton.href = "#close";
            closeButton.innerHTML = '<span aria-hidden="true">&#215;</span>';
            on(closeButton, "click", function(ev) {
              preventDefault(ev);
              this.close();
            }, this);
          }
        },
        _updateLayout: function() {
          var container = this._contentNode, style3 = container.style;
          style3.width = "";
          style3.whiteSpace = "nowrap";
          var width = container.offsetWidth;
          width = Math.min(width, this.options.maxWidth);
          width = Math.max(width, this.options.minWidth);
          style3.width = width + 1 + "px";
          style3.whiteSpace = "";
          style3.height = "";
          var height = container.offsetHeight, maxHeight = this.options.maxHeight, scrolledClass = "leaflet-popup-scrolled";
          if (maxHeight && height > maxHeight) {
            style3.height = maxHeight + "px";
            addClass(container, scrolledClass);
          } else {
            removeClass(container, scrolledClass);
          }
          this._containerWidth = this._container.offsetWidth;
        },
        _animateZoom: function(e) {
          var pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center), anchor = this._getAnchor();
          setPosition(this._container, pos.add(anchor));
        },
        _adjustPan: function() {
          if (!this.options.autoPan) {
            return;
          }
          if (this._map._panAnim) {
            this._map._panAnim.stop();
          }
          if (this._autopanning) {
            this._autopanning = false;
            return;
          }
          var map = this._map, marginBottom = parseInt(getStyle(this._container, "marginBottom"), 10) || 0, containerHeight = this._container.offsetHeight + marginBottom, containerWidth = this._containerWidth, layerPos = new Point(this._containerLeft, -containerHeight - this._containerBottom);
          layerPos._add(getPosition(this._container));
          var containerPos = map.layerPointToContainerPoint(layerPos), padding = toPoint(this.options.autoPanPadding), paddingTL = toPoint(this.options.autoPanPaddingTopLeft || padding), paddingBR = toPoint(this.options.autoPanPaddingBottomRight || padding), size = map.getSize(), dx = 0, dy = 0;
          if (containerPos.x + containerWidth + paddingBR.x > size.x) {
            dx = containerPos.x + containerWidth - size.x + paddingBR.x;
          }
          if (containerPos.x - dx - paddingTL.x < 0) {
            dx = containerPos.x - paddingTL.x;
          }
          if (containerPos.y + containerHeight + paddingBR.y > size.y) {
            dy = containerPos.y + containerHeight - size.y + paddingBR.y;
          }
          if (containerPos.y - dy - paddingTL.y < 0) {
            dy = containerPos.y - paddingTL.y;
          }
          if (dx || dy) {
            if (this.options.keepInView) {
              this._autopanning = true;
            }
            map.fire("autopanstart").panBy([dx, dy]);
          }
        },
        _getAnchor: function() {
          return toPoint(this._source && this._source._getPopupAnchor ? this._source._getPopupAnchor() : [0, 0]);
        }
      });
      var popup = function(options, source) {
        return new Popup(options, source);
      };
      Map2.mergeOptions({
        closePopupOnClick: true
      });
      Map2.include({
        // @method openPopup(popup: Popup): this
        // Opens the specified popup while closing the previously opened (to make sure only one is opened at one time for usability).
        // @alternative
        // @method openPopup(content: String|HTMLElement, latlng: LatLng, options?: Popup options): this
        // Creates a popup with the specified content and options and opens it in the given point on a map.
        openPopup: function(popup2, latlng, options) {
          this._initOverlay(Popup, popup2, latlng, options).openOn(this);
          return this;
        },
        // @method closePopup(popup?: Popup): this
        // Closes the popup previously opened with [openPopup](#map-openpopup) (or the given one).
        closePopup: function(popup2) {
          popup2 = arguments.length ? popup2 : this._popup;
          if (popup2) {
            popup2.close();
          }
          return this;
        }
      });
      Layer.include({
        // @method bindPopup(content: String|HTMLElement|Function|Popup, options?: Popup options): this
        // Binds a popup to the layer with the passed `content` and sets up the
        // necessary event listeners. If a `Function` is passed it will receive
        // the layer as the first argument and should return a `String` or `HTMLElement`.
        bindPopup: function(content, options) {
          this._popup = this._initOverlay(Popup, this._popup, content, options);
          if (!this._popupHandlersAdded) {
            this.on({
              click: this._openPopup,
              keypress: this._onKeyPress,
              remove: this.closePopup,
              move: this._movePopup
            });
            this._popupHandlersAdded = true;
          }
          return this;
        },
        // @method unbindPopup(): this
        // Removes the popup previously bound with `bindPopup`.
        unbindPopup: function() {
          if (this._popup) {
            this.off({
              click: this._openPopup,
              keypress: this._onKeyPress,
              remove: this.closePopup,
              move: this._movePopup
            });
            this._popupHandlersAdded = false;
            this._popup = null;
          }
          return this;
        },
        // @method openPopup(latlng?: LatLng): this
        // Opens the bound popup at the specified `latlng` or at the default popup anchor if no `latlng` is passed.
        openPopup: function(latlng) {
          if (this._popup) {
            if (!(this instanceof FeatureGroup)) {
              this._popup._source = this;
            }
            if (this._popup._prepareOpen(latlng || this._latlng)) {
              this._popup.openOn(this._map);
            }
          }
          return this;
        },
        // @method closePopup(): this
        // Closes the popup bound to this layer if it is open.
        closePopup: function() {
          if (this._popup) {
            this._popup.close();
          }
          return this;
        },
        // @method togglePopup(): this
        // Opens or closes the popup bound to this layer depending on its current state.
        togglePopup: function() {
          if (this._popup) {
            this._popup.toggle(this);
          }
          return this;
        },
        // @method isPopupOpen(): boolean
        // Returns `true` if the popup bound to this layer is currently open.
        isPopupOpen: function() {
          return this._popup ? this._popup.isOpen() : false;
        },
        // @method setPopupContent(content: String|HTMLElement|Popup): this
        // Sets the content of the popup bound to this layer.
        setPopupContent: function(content) {
          if (this._popup) {
            this._popup.setContent(content);
          }
          return this;
        },
        // @method getPopup(): Popup
        // Returns the popup bound to this layer.
        getPopup: function() {
          return this._popup;
        },
        _openPopup: function(e) {
          if (!this._popup || !this._map) {
            return;
          }
          stop(e);
          var target = e.layer || e.target;
          if (this._popup._source === target && !(target instanceof Path)) {
            if (this._map.hasLayer(this._popup)) {
              this.closePopup();
            } else {
              this.openPopup(e.latlng);
            }
            return;
          }
          this._popup._source = target;
          this.openPopup(e.latlng);
        },
        _movePopup: function(e) {
          this._popup.setLatLng(e.latlng);
        },
        _onKeyPress: function(e) {
          if (e.originalEvent.keyCode === 13) {
            this._openPopup(e);
          }
        }
      });
      var Tooltip = DivOverlay.extend({
        // @section
        // @aka Tooltip options
        options: {
          // @option pane: String = 'tooltipPane'
          // `Map pane` where the tooltip will be added.
          pane: "tooltipPane",
          // @option offset: Point = Point(0, 0)
          // Optional offset of the tooltip position.
          offset: [0, 0],
          // @option direction: String = 'auto'
          // Direction where to open the tooltip. Possible values are: `right`, `left`,
          // `top`, `bottom`, `center`, `auto`.
          // `auto` will dynamically switch between `right` and `left` according to the tooltip
          // position on the map.
          direction: "auto",
          // @option permanent: Boolean = false
          // Whether to open the tooltip permanently or only on mouseover.
          permanent: false,
          // @option sticky: Boolean = false
          // If true, the tooltip will follow the mouse instead of being fixed at the feature center.
          sticky: false,
          // @option opacity: Number = 0.9
          // Tooltip container opacity.
          opacity: 0.9
        },
        onAdd: function(map) {
          DivOverlay.prototype.onAdd.call(this, map);
          this.setOpacity(this.options.opacity);
          map.fire("tooltipopen", { tooltip: this });
          if (this._source) {
            this.addEventParent(this._source);
            this._source.fire("tooltipopen", { tooltip: this }, true);
          }
        },
        onRemove: function(map) {
          DivOverlay.prototype.onRemove.call(this, map);
          map.fire("tooltipclose", { tooltip: this });
          if (this._source) {
            this.removeEventParent(this._source);
            this._source.fire("tooltipclose", { tooltip: this }, true);
          }
        },
        getEvents: function() {
          var events = DivOverlay.prototype.getEvents.call(this);
          if (!this.options.permanent) {
            events.preclick = this.close;
          }
          return events;
        },
        _initLayout: function() {
          var prefix = "leaflet-tooltip", className = prefix + " " + (this.options.className || "") + " leaflet-zoom-" + (this._zoomAnimated ? "animated" : "hide");
          this._contentNode = this._container = create$1("div", className);
          this._container.setAttribute("role", "tooltip");
          this._container.setAttribute("id", "leaflet-tooltip-" + stamp(this));
        },
        _updateLayout: function() {
        },
        _adjustPan: function() {
        },
        _setPosition: function(pos) {
          var subX, subY, map = this._map, container = this._container, centerPoint = map.latLngToContainerPoint(map.getCenter()), tooltipPoint = map.layerPointToContainerPoint(pos), direction = this.options.direction, tooltipWidth = container.offsetWidth, tooltipHeight = container.offsetHeight, offset = toPoint(this.options.offset), anchor = this._getAnchor();
          if (direction === "top") {
            subX = tooltipWidth / 2;
            subY = tooltipHeight;
          } else if (direction === "bottom") {
            subX = tooltipWidth / 2;
            subY = 0;
          } else if (direction === "center") {
            subX = tooltipWidth / 2;
            subY = tooltipHeight / 2;
          } else if (direction === "right") {
            subX = 0;
            subY = tooltipHeight / 2;
          } else if (direction === "left") {
            subX = tooltipWidth;
            subY = tooltipHeight / 2;
          } else if (tooltipPoint.x < centerPoint.x) {
            direction = "right";
            subX = 0;
            subY = tooltipHeight / 2;
          } else {
            direction = "left";
            subX = tooltipWidth + (offset.x + anchor.x) * 2;
            subY = tooltipHeight / 2;
          }
          pos = pos.subtract(toPoint(subX, subY, true)).add(offset).add(anchor);
          removeClass(container, "leaflet-tooltip-right");
          removeClass(container, "leaflet-tooltip-left");
          removeClass(container, "leaflet-tooltip-top");
          removeClass(container, "leaflet-tooltip-bottom");
          addClass(container, "leaflet-tooltip-" + direction);
          setPosition(container, pos);
        },
        _updatePosition: function() {
          var pos = this._map.latLngToLayerPoint(this._latlng);
          this._setPosition(pos);
        },
        setOpacity: function(opacity) {
          this.options.opacity = opacity;
          if (this._container) {
            setOpacity(this._container, opacity);
          }
        },
        _animateZoom: function(e) {
          var pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center);
          this._setPosition(pos);
        },
        _getAnchor: function() {
          return toPoint(this._source && this._source._getTooltipAnchor && !this.options.sticky ? this._source._getTooltipAnchor() : [0, 0]);
        }
      });
      var tooltip = function(options, source) {
        return new Tooltip(options, source);
      };
      Map2.include({
        // @method openTooltip(tooltip: Tooltip): this
        // Opens the specified tooltip.
        // @alternative
        // @method openTooltip(content: String|HTMLElement, latlng: LatLng, options?: Tooltip options): this
        // Creates a tooltip with the specified content and options and open it.
        openTooltip: function(tooltip2, latlng, options) {
          this._initOverlay(Tooltip, tooltip2, latlng, options).openOn(this);
          return this;
        },
        // @method closeTooltip(tooltip: Tooltip): this
        // Closes the tooltip given as parameter.
        closeTooltip: function(tooltip2) {
          tooltip2.close();
          return this;
        }
      });
      Layer.include({
        // @method bindTooltip(content: String|HTMLElement|Function|Tooltip, options?: Tooltip options): this
        // Binds a tooltip to the layer with the passed `content` and sets up the
        // necessary event listeners. If a `Function` is passed it will receive
        // the layer as the first argument and should return a `String` or `HTMLElement`.
        bindTooltip: function(content, options) {
          if (this._tooltip && this.isTooltipOpen()) {
            this.unbindTooltip();
          }
          this._tooltip = this._initOverlay(Tooltip, this._tooltip, content, options);
          this._initTooltipInteractions();
          if (this._tooltip.options.permanent && this._map && this._map.hasLayer(this)) {
            this.openTooltip();
          }
          return this;
        },
        // @method unbindTooltip(): this
        // Removes the tooltip previously bound with `bindTooltip`.
        unbindTooltip: function() {
          if (this._tooltip) {
            this._initTooltipInteractions(true);
            this.closeTooltip();
            this._tooltip = null;
          }
          return this;
        },
        _initTooltipInteractions: function(remove2) {
          if (!remove2 && this._tooltipHandlersAdded) {
            return;
          }
          var onOff = remove2 ? "off" : "on", events = {
            remove: this.closeTooltip,
            move: this._moveTooltip
          };
          if (!this._tooltip.options.permanent) {
            events.mouseover = this._openTooltip;
            events.mouseout = this.closeTooltip;
            events.click = this._openTooltip;
            if (this._map) {
              this._addFocusListeners();
            } else {
              events.add = this._addFocusListeners;
            }
          } else {
            events.add = this._openTooltip;
          }
          if (this._tooltip.options.sticky) {
            events.mousemove = this._moveTooltip;
          }
          this[onOff](events);
          this._tooltipHandlersAdded = !remove2;
        },
        // @method openTooltip(latlng?: LatLng): this
        // Opens the bound tooltip at the specified `latlng` or at the default tooltip anchor if no `latlng` is passed.
        openTooltip: function(latlng) {
          if (this._tooltip) {
            if (!(this instanceof FeatureGroup)) {
              this._tooltip._source = this;
            }
            if (this._tooltip._prepareOpen(latlng)) {
              this._tooltip.openOn(this._map);
              if (this.getElement) {
                this._setAriaDescribedByOnLayer(this);
              } else if (this.eachLayer) {
                this.eachLayer(this._setAriaDescribedByOnLayer, this);
              }
            }
          }
          return this;
        },
        // @method closeTooltip(): this
        // Closes the tooltip bound to this layer if it is open.
        closeTooltip: function() {
          if (this._tooltip) {
            return this._tooltip.close();
          }
        },
        // @method toggleTooltip(): this
        // Opens or closes the tooltip bound to this layer depending on its current state.
        toggleTooltip: function() {
          if (this._tooltip) {
            this._tooltip.toggle(this);
          }
          return this;
        },
        // @method isTooltipOpen(): boolean
        // Returns `true` if the tooltip bound to this layer is currently open.
        isTooltipOpen: function() {
          return this._tooltip.isOpen();
        },
        // @method setTooltipContent(content: String|HTMLElement|Tooltip): this
        // Sets the content of the tooltip bound to this layer.
        setTooltipContent: function(content) {
          if (this._tooltip) {
            this._tooltip.setContent(content);
          }
          return this;
        },
        // @method getTooltip(): Tooltip
        // Returns the tooltip bound to this layer.
        getTooltip: function() {
          return this._tooltip;
        },
        _addFocusListeners: function() {
          if (this.getElement) {
            this._addFocusListenersOnLayer(this);
          } else if (this.eachLayer) {
            this.eachLayer(this._addFocusListenersOnLayer, this);
          }
        },
        _addFocusListenersOnLayer: function(layer) {
          var el = typeof layer.getElement === "function" && layer.getElement();
          if (el) {
            on(el, "focus", function() {
              this._tooltip._source = layer;
              this.openTooltip();
            }, this);
            on(el, "blur", this.closeTooltip, this);
          }
        },
        _setAriaDescribedByOnLayer: function(layer) {
          var el = typeof layer.getElement === "function" && layer.getElement();
          if (el) {
            el.setAttribute("aria-describedby", this._tooltip._container.id);
          }
        },
        _openTooltip: function(e) {
          if (!this._tooltip || !this._map) {
            return;
          }
          if (this._map.dragging && this._map.dragging.moving() && !this._openOnceFlag) {
            this._openOnceFlag = true;
            var that = this;
            this._map.once("moveend", function() {
              that._openOnceFlag = false;
              that._openTooltip(e);
            });
            return;
          }
          this._tooltip._source = e.layer || e.target;
          this.openTooltip(this._tooltip.options.sticky ? e.latlng : void 0);
        },
        _moveTooltip: function(e) {
          var latlng = e.latlng, containerPoint, layerPoint;
          if (this._tooltip.options.sticky && e.originalEvent) {
            containerPoint = this._map.mouseEventToContainerPoint(e.originalEvent);
            layerPoint = this._map.containerPointToLayerPoint(containerPoint);
            latlng = this._map.layerPointToLatLng(layerPoint);
          }
          this._tooltip.setLatLng(latlng);
        }
      });
      var DivIcon = Icon.extend({
        options: {
          // @section
          // @aka DivIcon options
          iconSize: [12, 12],
          // also can be set through CSS
          // iconAnchor: (Point),
          // popupAnchor: (Point),
          // @option html: String|HTMLElement = ''
          // Custom HTML code to put inside the div element, empty by default. Alternatively,
          // an instance of `HTMLElement`.
          html: false,
          // @option bgPos: Point = [0, 0]
          // Optional relative position of the background, in pixels
          bgPos: null,
          className: "leaflet-div-icon"
        },
        createIcon: function(oldIcon) {
          var div = oldIcon && oldIcon.tagName === "DIV" ? oldIcon : document.createElement("div"), options = this.options;
          if (options.html instanceof Element) {
            empty(div);
            div.appendChild(options.html);
          } else {
            div.innerHTML = options.html !== false ? options.html : "";
          }
          if (options.bgPos) {
            var bgPos = toPoint(options.bgPos);
            div.style.backgroundPosition = -bgPos.x + "px " + -bgPos.y + "px";
          }
          this._setIconStyles(div, "icon");
          return div;
        },
        createShadow: function() {
          return null;
        }
      });
      function divIcon(options) {
        return new DivIcon(options);
      }
      Icon.Default = IconDefault;
      var GridLayer = Layer.extend({
        // @section
        // @aka GridLayer options
        options: {
          // @option tileSize: Number|Point = 256
          // Width and height of tiles in the grid. Use a number if width and height are equal, or `L.point(width, height)` otherwise.
          tileSize: 256,
          // @option opacity: Number = 1.0
          // Opacity of the tiles. Can be used in the `createTile()` function.
          opacity: 1,
          // @option updateWhenIdle: Boolean = (depends)
          // Load new tiles only when panning ends.
          // `true` by default on mobile browsers, in order to avoid too many requests and keep smooth navigation.
          // `false` otherwise in order to display new tiles _during_ panning, since it is easy to pan outside the
          // [`keepBuffer`](#gridlayer-keepbuffer) option in desktop browsers.
          updateWhenIdle: Browser.mobile,
          // @option updateWhenZooming: Boolean = true
          // By default, a smooth zoom animation (during a [touch zoom](#map-touchzoom) or a [`flyTo()`](#map-flyto)) will update grid layers every integer zoom level. Setting this option to `false` will update the grid layer only when the smooth animation ends.
          updateWhenZooming: true,
          // @option updateInterval: Number = 200
          // Tiles will not update more than once every `updateInterval` milliseconds when panning.
          updateInterval: 200,
          // @option zIndex: Number = 1
          // The explicit zIndex of the tile layer.
          zIndex: 1,
          // @option bounds: LatLngBounds = undefined
          // If set, tiles will only be loaded inside the set `LatLngBounds`.
          bounds: null,
          // @option minZoom: Number = 0
          // The minimum zoom level down to which this layer will be displayed (inclusive).
          minZoom: 0,
          // @option maxZoom: Number = undefined
          // The maximum zoom level up to which this layer will be displayed (inclusive).
          maxZoom: void 0,
          // @option maxNativeZoom: Number = undefined
          // Maximum zoom number the tile source has available. If it is specified,
          // the tiles on all zoom levels higher than `maxNativeZoom` will be loaded
          // from `maxNativeZoom` level and auto-scaled.
          maxNativeZoom: void 0,
          // @option minNativeZoom: Number = undefined
          // Minimum zoom number the tile source has available. If it is specified,
          // the tiles on all zoom levels lower than `minNativeZoom` will be loaded
          // from `minNativeZoom` level and auto-scaled.
          minNativeZoom: void 0,
          // @option noWrap: Boolean = false
          // Whether the layer is wrapped around the antimeridian. If `true`, the
          // GridLayer will only be displayed once at low zoom levels. Has no
          // effect when the [map CRS](#map-crs) doesn't wrap around. Can be used
          // in combination with [`bounds`](#gridlayer-bounds) to prevent requesting
          // tiles outside the CRS limits.
          noWrap: false,
          // @option pane: String = 'tilePane'
          // `Map pane` where the grid layer will be added.
          pane: "tilePane",
          // @option className: String = ''
          // A custom class name to assign to the tile layer. Empty by default.
          className: "",
          // @option keepBuffer: Number = 2
          // When panning the map, keep this many rows and columns of tiles before unloading them.
          keepBuffer: 2
        },
        initialize: function(options) {
          setOptions(this, options);
        },
        onAdd: function() {
          this._initContainer();
          this._levels = {};
          this._tiles = {};
          this._resetView();
        },
        beforeAdd: function(map) {
          map._addZoomLimit(this);
        },
        onRemove: function(map) {
          this._removeAllTiles();
          remove(this._container);
          map._removeZoomLimit(this);
          this._container = null;
          this._tileZoom = void 0;
        },
        // @method bringToFront: this
        // Brings the tile layer to the top of all tile layers.
        bringToFront: function() {
          if (this._map) {
            toFront(this._container);
            this._setAutoZIndex(Math.max);
          }
          return this;
        },
        // @method bringToBack: this
        // Brings the tile layer to the bottom of all tile layers.
        bringToBack: function() {
          if (this._map) {
            toBack(this._container);
            this._setAutoZIndex(Math.min);
          }
          return this;
        },
        // @method getContainer: HTMLElement
        // Returns the HTML element that contains the tiles for this layer.
        getContainer: function() {
          return this._container;
        },
        // @method setOpacity(opacity: Number): this
        // Changes the [opacity](#gridlayer-opacity) of the grid layer.
        setOpacity: function(opacity) {
          this.options.opacity = opacity;
          this._updateOpacity();
          return this;
        },
        // @method setZIndex(zIndex: Number): this
        // Changes the [zIndex](#gridlayer-zindex) of the grid layer.
        setZIndex: function(zIndex) {
          this.options.zIndex = zIndex;
          this._updateZIndex();
          return this;
        },
        // @method isLoading: Boolean
        // Returns `true` if any tile in the grid layer has not finished loading.
        isLoading: function() {
          return this._loading;
        },
        // @method redraw: this
        // Causes the layer to clear all the tiles and request them again.
        redraw: function() {
          if (this._map) {
            this._removeAllTiles();
            var tileZoom = this._clampZoom(this._map.getZoom());
            if (tileZoom !== this._tileZoom) {
              this._tileZoom = tileZoom;
              this._updateLevels();
            }
            this._update();
          }
          return this;
        },
        getEvents: function() {
          var events = {
            viewprereset: this._invalidateAll,
            viewreset: this._resetView,
            zoom: this._resetView,
            moveend: this._onMoveEnd
          };
          if (!this.options.updateWhenIdle) {
            if (!this._onMove) {
              this._onMove = throttle(this._onMoveEnd, this.options.updateInterval, this);
            }
            events.move = this._onMove;
          }
          if (this._zoomAnimated) {
            events.zoomanim = this._animateZoom;
          }
          return events;
        },
        // @section Extension methods
        // Layers extending `GridLayer` shall reimplement the following method.
        // @method createTile(coords: Object, done?: Function): HTMLElement
        // Called only internally, must be overridden by classes extending `GridLayer`.
        // Returns the `HTMLElement` corresponding to the given `coords`. If the `done` callback
        // is specified, it must be called when the tile has finished loading and drawing.
        createTile: function() {
          return document.createElement("div");
        },
        // @section
        // @method getTileSize: Point
        // Normalizes the [tileSize option](#gridlayer-tilesize) into a point. Used by the `createTile()` method.
        getTileSize: function() {
          var s = this.options.tileSize;
          return s instanceof Point ? s : new Point(s, s);
        },
        _updateZIndex: function() {
          if (this._container && this.options.zIndex !== void 0 && this.options.zIndex !== null) {
            this._container.style.zIndex = this.options.zIndex;
          }
        },
        _setAutoZIndex: function(compare) {
          var layers2 = this.getPane().children, edgeZIndex = -compare(-Infinity, Infinity);
          for (var i = 0, len = layers2.length, zIndex; i < len; i++) {
            zIndex = layers2[i].style.zIndex;
            if (layers2[i] !== this._container && zIndex) {
              edgeZIndex = compare(edgeZIndex, +zIndex);
            }
          }
          if (isFinite(edgeZIndex)) {
            this.options.zIndex = edgeZIndex + compare(-1, 1);
            this._updateZIndex();
          }
        },
        _updateOpacity: function() {
          if (!this._map) {
            return;
          }
          if (Browser.ielt9) {
            return;
          }
          setOpacity(this._container, this.options.opacity);
          var now = +/* @__PURE__ */ new Date(), nextFrame = false, willPrune = false;
          for (var key in this._tiles) {
            var tile = this._tiles[key];
            if (!tile.current || !tile.loaded) {
              continue;
            }
            var fade = Math.min(1, (now - tile.loaded) / 200);
            setOpacity(tile.el, fade);
            if (fade < 1) {
              nextFrame = true;
            } else {
              if (tile.active) {
                willPrune = true;
              } else {
                this._onOpaqueTile(tile);
              }
              tile.active = true;
            }
          }
          if (willPrune && !this._noPrune) {
            this._pruneTiles();
          }
          if (nextFrame) {
            cancelAnimFrame(this._fadeFrame);
            this._fadeFrame = requestAnimFrame(this._updateOpacity, this);
          }
        },
        _onOpaqueTile: falseFn,
        _initContainer: function() {
          if (this._container) {
            return;
          }
          this._container = create$1("div", "leaflet-layer " + (this.options.className || ""));
          this._updateZIndex();
          if (this.options.opacity < 1) {
            this._updateOpacity();
          }
          this.getPane().appendChild(this._container);
        },
        _updateLevels: function() {
          var zoom2 = this._tileZoom, maxZoom = this.options.maxZoom;
          if (zoom2 === void 0) {
            return void 0;
          }
          for (var z in this._levels) {
            z = Number(z);
            if (this._levels[z].el.children.length || z === zoom2) {
              this._levels[z].el.style.zIndex = maxZoom - Math.abs(zoom2 - z);
              this._onUpdateLevel(z);
            } else {
              remove(this._levels[z].el);
              this._removeTilesAtZoom(z);
              this._onRemoveLevel(z);
              delete this._levels[z];
            }
          }
          var level = this._levels[zoom2], map = this._map;
          if (!level) {
            level = this._levels[zoom2] = {};
            level.el = create$1("div", "leaflet-tile-container leaflet-zoom-animated", this._container);
            level.el.style.zIndex = maxZoom;
            level.origin = map.project(map.unproject(map.getPixelOrigin()), zoom2).round();
            level.zoom = zoom2;
            this._setZoomTransform(level, map.getCenter(), map.getZoom());
            falseFn(level.el.offsetWidth);
            this._onCreateLevel(level);
          }
          this._level = level;
          return level;
        },
        _onUpdateLevel: falseFn,
        _onRemoveLevel: falseFn,
        _onCreateLevel: falseFn,
        _pruneTiles: function() {
          if (!this._map) {
            return;
          }
          var key, tile;
          var zoom2 = this._map.getZoom();
          if (zoom2 > this.options.maxZoom || zoom2 < this.options.minZoom) {
            this._removeAllTiles();
            return;
          }
          for (key in this._tiles) {
            tile = this._tiles[key];
            tile.retain = tile.current;
          }
          for (key in this._tiles) {
            tile = this._tiles[key];
            if (tile.current && !tile.active) {
              var coords = tile.coords;
              if (!this._retainParent(coords.x, coords.y, coords.z, coords.z - 5)) {
                this._retainChildren(coords.x, coords.y, coords.z, coords.z + 2);
              }
            }
          }
          for (key in this._tiles) {
            if (!this._tiles[key].retain) {
              this._removeTile(key);
            }
          }
        },
        _removeTilesAtZoom: function(zoom2) {
          for (var key in this._tiles) {
            if (this._tiles[key].coords.z !== zoom2) {
              continue;
            }
            this._removeTile(key);
          }
        },
        _removeAllTiles: function() {
          for (var key in this._tiles) {
            this._removeTile(key);
          }
        },
        _invalidateAll: function() {
          for (var z in this._levels) {
            remove(this._levels[z].el);
            this._onRemoveLevel(Number(z));
            delete this._levels[z];
          }
          this._removeAllTiles();
          this._tileZoom = void 0;
        },
        _retainParent: function(x, y, z, minZoom) {
          var x2 = Math.floor(x / 2), y2 = Math.floor(y / 2), z2 = z - 1, coords2 = new Point(+x2, +y2);
          coords2.z = +z2;
          var key = this._tileCoordsToKey(coords2), tile = this._tiles[key];
          if (tile && tile.active) {
            tile.retain = true;
            return true;
          } else if (tile && tile.loaded) {
            tile.retain = true;
          }
          if (z2 > minZoom) {
            return this._retainParent(x2, y2, z2, minZoom);
          }
          return false;
        },
        _retainChildren: function(x, y, z, maxZoom) {
          for (var i = 2 * x; i < 2 * x + 2; i++) {
            for (var j = 2 * y; j < 2 * y + 2; j++) {
              var coords = new Point(i, j);
              coords.z = z + 1;
              var key = this._tileCoordsToKey(coords), tile = this._tiles[key];
              if (tile && tile.active) {
                tile.retain = true;
                continue;
              } else if (tile && tile.loaded) {
                tile.retain = true;
              }
              if (z + 1 < maxZoom) {
                this._retainChildren(i, j, z + 1, maxZoom);
              }
            }
          }
        },
        _resetView: function(e) {
          var animating = e && (e.pinch || e.flyTo);
          this._setView(this._map.getCenter(), this._map.getZoom(), animating, animating);
        },
        _animateZoom: function(e) {
          this._setView(e.center, e.zoom, true, e.noUpdate);
        },
        _clampZoom: function(zoom2) {
          var options = this.options;
          if (void 0 !== options.minNativeZoom && zoom2 < options.minNativeZoom) {
            return options.minNativeZoom;
          }
          if (void 0 !== options.maxNativeZoom && options.maxNativeZoom < zoom2) {
            return options.maxNativeZoom;
          }
          return zoom2;
        },
        _setView: function(center, zoom2, noPrune, noUpdate) {
          var tileZoom = Math.round(zoom2);
          if (this.options.maxZoom !== void 0 && tileZoom > this.options.maxZoom || this.options.minZoom !== void 0 && tileZoom < this.options.minZoom) {
            tileZoom = void 0;
          } else {
            tileZoom = this._clampZoom(tileZoom);
          }
          var tileZoomChanged = this.options.updateWhenZooming && tileZoom !== this._tileZoom;
          if (!noUpdate || tileZoomChanged) {
            this._tileZoom = tileZoom;
            if (this._abortLoading) {
              this._abortLoading();
            }
            this._updateLevels();
            this._resetGrid();
            if (tileZoom !== void 0) {
              this._update(center);
            }
            if (!noPrune) {
              this._pruneTiles();
            }
            this._noPrune = !!noPrune;
          }
          this._setZoomTransforms(center, zoom2);
        },
        _setZoomTransforms: function(center, zoom2) {
          for (var i in this._levels) {
            this._setZoomTransform(this._levels[i], center, zoom2);
          }
        },
        _setZoomTransform: function(level, center, zoom2) {
          var scale2 = this._map.getZoomScale(zoom2, level.zoom), translate = level.origin.multiplyBy(scale2).subtract(this._map._getNewPixelOrigin(center, zoom2)).round();
          if (Browser.any3d) {
            setTransform(level.el, translate, scale2);
          } else {
            setPosition(level.el, translate);
          }
        },
        _resetGrid: function() {
          var map = this._map, crs = map.options.crs, tileSize = this._tileSize = this.getTileSize(), tileZoom = this._tileZoom;
          var bounds = this._map.getPixelWorldBounds(this._tileZoom);
          if (bounds) {
            this._globalTileRange = this._pxBoundsToTileRange(bounds);
          }
          this._wrapX = crs.wrapLng && !this.options.noWrap && [
            Math.floor(map.project([0, crs.wrapLng[0]], tileZoom).x / tileSize.x),
            Math.ceil(map.project([0, crs.wrapLng[1]], tileZoom).x / tileSize.y)
          ];
          this._wrapY = crs.wrapLat && !this.options.noWrap && [
            Math.floor(map.project([crs.wrapLat[0], 0], tileZoom).y / tileSize.x),
            Math.ceil(map.project([crs.wrapLat[1], 0], tileZoom).y / tileSize.y)
          ];
        },
        _onMoveEnd: function() {
          if (!this._map || this._map._animatingZoom) {
            return;
          }
          this._update();
        },
        _getTiledPixelBounds: function(center) {
          var map = this._map, mapZoom = map._animatingZoom ? Math.max(map._animateToZoom, map.getZoom()) : map.getZoom(), scale2 = map.getZoomScale(mapZoom, this._tileZoom), pixelCenter = map.project(center, this._tileZoom).floor(), halfSize = map.getSize().divideBy(scale2 * 2);
          return new Bounds(pixelCenter.subtract(halfSize), pixelCenter.add(halfSize));
        },
        // Private method to load tiles in the grid's active zoom level according to map bounds
        _update: function(center) {
          var map = this._map;
          if (!map) {
            return;
          }
          var zoom2 = this._clampZoom(map.getZoom());
          if (center === void 0) {
            center = map.getCenter();
          }
          if (this._tileZoom === void 0) {
            return;
          }
          var pixelBounds = this._getTiledPixelBounds(center), tileRange = this._pxBoundsToTileRange(pixelBounds), tileCenter = tileRange.getCenter(), queue = [], margin = this.options.keepBuffer, noPruneRange = new Bounds(
            tileRange.getBottomLeft().subtract([margin, -margin]),
            tileRange.getTopRight().add([margin, -margin])
          );
          if (!(isFinite(tileRange.min.x) && isFinite(tileRange.min.y) && isFinite(tileRange.max.x) && isFinite(tileRange.max.y))) {
            throw new Error("Attempted to load an infinite number of tiles");
          }
          for (var key in this._tiles) {
            var c = this._tiles[key].coords;
            if (c.z !== this._tileZoom || !noPruneRange.contains(new Point(c.x, c.y))) {
              this._tiles[key].current = false;
            }
          }
          if (Math.abs(zoom2 - this._tileZoom) > 1) {
            this._setView(center, zoom2);
            return;
          }
          for (var j = tileRange.min.y; j <= tileRange.max.y; j++) {
            for (var i = tileRange.min.x; i <= tileRange.max.x; i++) {
              var coords = new Point(i, j);
              coords.z = this._tileZoom;
              if (!this._isValidTile(coords)) {
                continue;
              }
              var tile = this._tiles[this._tileCoordsToKey(coords)];
              if (tile) {
                tile.current = true;
              } else {
                queue.push(coords);
              }
            }
          }
          queue.sort(function(a, b) {
            return a.distanceTo(tileCenter) - b.distanceTo(tileCenter);
          });
          if (queue.length !== 0) {
            if (!this._loading) {
              this._loading = true;
              this.fire("loading");
            }
            var fragment = document.createDocumentFragment();
            for (i = 0; i < queue.length; i++) {
              this._addTile(queue[i], fragment);
            }
            this._level.el.appendChild(fragment);
          }
        },
        _isValidTile: function(coords) {
          var crs = this._map.options.crs;
          if (!crs.infinite) {
            var bounds = this._globalTileRange;
            if (!crs.wrapLng && (coords.x < bounds.min.x || coords.x > bounds.max.x) || !crs.wrapLat && (coords.y < bounds.min.y || coords.y > bounds.max.y)) {
              return false;
            }
          }
          if (!this.options.bounds) {
            return true;
          }
          var tileBounds = this._tileCoordsToBounds(coords);
          return toLatLngBounds(this.options.bounds).overlaps(tileBounds);
        },
        _keyToBounds: function(key) {
          return this._tileCoordsToBounds(this._keyToTileCoords(key));
        },
        _tileCoordsToNwSe: function(coords) {
          var map = this._map, tileSize = this.getTileSize(), nwPoint = coords.scaleBy(tileSize), sePoint = nwPoint.add(tileSize), nw = map.unproject(nwPoint, coords.z), se = map.unproject(sePoint, coords.z);
          return [nw, se];
        },
        // converts tile coordinates to its geographical bounds
        _tileCoordsToBounds: function(coords) {
          var bp = this._tileCoordsToNwSe(coords), bounds = new LatLngBounds(bp[0], bp[1]);
          if (!this.options.noWrap) {
            bounds = this._map.wrapLatLngBounds(bounds);
          }
          return bounds;
        },
        // converts tile coordinates to key for the tile cache
        _tileCoordsToKey: function(coords) {
          return coords.x + ":" + coords.y + ":" + coords.z;
        },
        // converts tile cache key to coordinates
        _keyToTileCoords: function(key) {
          var k = key.split(":"), coords = new Point(+k[0], +k[1]);
          coords.z = +k[2];
          return coords;
        },
        _removeTile: function(key) {
          var tile = this._tiles[key];
          if (!tile) {
            return;
          }
          remove(tile.el);
          delete this._tiles[key];
          this.fire("tileunload", {
            tile: tile.el,
            coords: this._keyToTileCoords(key)
          });
        },
        _initTile: function(tile) {
          addClass(tile, "leaflet-tile");
          var tileSize = this.getTileSize();
          tile.style.width = tileSize.x + "px";
          tile.style.height = tileSize.y + "px";
          tile.onselectstart = falseFn;
          tile.onmousemove = falseFn;
          if (Browser.ielt9 && this.options.opacity < 1) {
            setOpacity(tile, this.options.opacity);
          }
        },
        _addTile: function(coords, container) {
          var tilePos = this._getTilePos(coords), key = this._tileCoordsToKey(coords);
          var tile = this.createTile(this._wrapCoords(coords), bind(this._tileReady, this, coords));
          this._initTile(tile);
          if (this.createTile.length < 2) {
            requestAnimFrame(bind(this._tileReady, this, coords, null, tile));
          }
          setPosition(tile, tilePos);
          this._tiles[key] = {
            el: tile,
            coords,
            current: true
          };
          container.appendChild(tile);
          this.fire("tileloadstart", {
            tile,
            coords
          });
        },
        _tileReady: function(coords, err, tile) {
          if (err) {
            this.fire("tileerror", {
              error: err,
              tile,
              coords
            });
          }
          var key = this._tileCoordsToKey(coords);
          tile = this._tiles[key];
          if (!tile) {
            return;
          }
          tile.loaded = +/* @__PURE__ */ new Date();
          if (this._map._fadeAnimated) {
            setOpacity(tile.el, 0);
            cancelAnimFrame(this._fadeFrame);
            this._fadeFrame = requestAnimFrame(this._updateOpacity, this);
          } else {
            tile.active = true;
            this._pruneTiles();
          }
          if (!err) {
            addClass(tile.el, "leaflet-tile-loaded");
            this.fire("tileload", {
              tile: tile.el,
              coords
            });
          }
          if (this._noTilesToLoad()) {
            this._loading = false;
            this.fire("load");
            if (Browser.ielt9 || !this._map._fadeAnimated) {
              requestAnimFrame(this._pruneTiles, this);
            } else {
              setTimeout(bind(this._pruneTiles, this), 250);
            }
          }
        },
        _getTilePos: function(coords) {
          return coords.scaleBy(this.getTileSize()).subtract(this._level.origin);
        },
        _wrapCoords: function(coords) {
          var newCoords = new Point(
            this._wrapX ? wrapNum(coords.x, this._wrapX) : coords.x,
            this._wrapY ? wrapNum(coords.y, this._wrapY) : coords.y
          );
          newCoords.z = coords.z;
          return newCoords;
        },
        _pxBoundsToTileRange: function(bounds) {
          var tileSize = this.getTileSize();
          return new Bounds(
            bounds.min.unscaleBy(tileSize).floor(),
            bounds.max.unscaleBy(tileSize).ceil().subtract([1, 1])
          );
        },
        _noTilesToLoad: function() {
          for (var key in this._tiles) {
            if (!this._tiles[key].loaded) {
              return false;
            }
          }
          return true;
        }
      });
      function gridLayer(options) {
        return new GridLayer(options);
      }
      var TileLayer = GridLayer.extend({
        // @section
        // @aka TileLayer options
        options: {
          // @option minZoom: Number = 0
          // The minimum zoom level down to which this layer will be displayed (inclusive).
          minZoom: 0,
          // @option maxZoom: Number = 18
          // The maximum zoom level up to which this layer will be displayed (inclusive).
          maxZoom: 18,
          // @option subdomains: String|String[] = 'abc'
          // Subdomains of the tile service. Can be passed in the form of one string (where each letter is a subdomain name) or an array of strings.
          subdomains: "abc",
          // @option errorTileUrl: String = ''
          // URL to the tile image to show in place of the tile that failed to load.
          errorTileUrl: "",
          // @option zoomOffset: Number = 0
          // The zoom number used in tile URLs will be offset with this value.
          zoomOffset: 0,
          // @option tms: Boolean = false
          // If `true`, inverses Y axis numbering for tiles (turn this on for [TMS](https://en.wikipedia.org/wiki/Tile_Map_Service) services).
          tms: false,
          // @option zoomReverse: Boolean = false
          // If set to true, the zoom number used in tile URLs will be reversed (`maxZoom - zoom` instead of `zoom`)
          zoomReverse: false,
          // @option detectRetina: Boolean = false
          // If `true` and user is on a retina display, it will request four tiles of half the specified size and a bigger zoom level in place of one to utilize the high resolution.
          detectRetina: false,
          // @option crossOrigin: Boolean|String = false
          // Whether the crossOrigin attribute will be added to the tiles.
          // If a String is provided, all tiles will have their crossOrigin attribute set to the String provided. This is needed if you want to access tile pixel data.
          // Refer to [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes) for valid String values.
          crossOrigin: false,
          // @option referrerPolicy: Boolean|String = false
          // Whether the referrerPolicy attribute will be added to the tiles.
          // If a String is provided, all tiles will have their referrerPolicy attribute set to the String provided.
          // This may be needed if your map's rendering context has a strict default but your tile provider expects a valid referrer
          // (e.g. to validate an API token).
          // Refer to [HTMLImageElement.referrerPolicy](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/referrerPolicy) for valid String values.
          referrerPolicy: false
        },
        initialize: function(url, options) {
          this._url = url;
          options = setOptions(this, options);
          if (options.detectRetina && Browser.retina && options.maxZoom > 0) {
            options.tileSize = Math.floor(options.tileSize / 2);
            if (!options.zoomReverse) {
              options.zoomOffset++;
              options.maxZoom = Math.max(options.minZoom, options.maxZoom - 1);
            } else {
              options.zoomOffset--;
              options.minZoom = Math.min(options.maxZoom, options.minZoom + 1);
            }
            options.minZoom = Math.max(0, options.minZoom);
          } else if (!options.zoomReverse) {
            options.maxZoom = Math.max(options.minZoom, options.maxZoom);
          } else {
            options.minZoom = Math.min(options.maxZoom, options.minZoom);
          }
          if (typeof options.subdomains === "string") {
            options.subdomains = options.subdomains.split("");
          }
          this.on("tileunload", this._onTileRemove);
        },
        // @method setUrl(url: String, noRedraw?: Boolean): this
        // Updates the layer's URL template and redraws it (unless `noRedraw` is set to `true`).
        // If the URL does not change, the layer will not be redrawn unless
        // the noRedraw parameter is set to false.
        setUrl: function(url, noRedraw) {
          if (this._url === url && noRedraw === void 0) {
            noRedraw = true;
          }
          this._url = url;
          if (!noRedraw) {
            this.redraw();
          }
          return this;
        },
        // @method createTile(coords: Object, done?: Function): HTMLElement
        // Called only internally, overrides GridLayer's [`createTile()`](#gridlayer-createtile)
        // to return an `<img>` HTML element with the appropriate image URL given `coords`. The `done`
        // callback is called when the tile has been loaded.
        createTile: function(coords, done) {
          var tile = document.createElement("img");
          on(tile, "load", bind(this._tileOnLoad, this, done, tile));
          on(tile, "error", bind(this._tileOnError, this, done, tile));
          if (this.options.crossOrigin || this.options.crossOrigin === "") {
            tile.crossOrigin = this.options.crossOrigin === true ? "" : this.options.crossOrigin;
          }
          if (typeof this.options.referrerPolicy === "string") {
            tile.referrerPolicy = this.options.referrerPolicy;
          }
          tile.alt = "";
          tile.src = this.getTileUrl(coords);
          return tile;
        },
        // @section Extension methods
        // @uninheritable
        // Layers extending `TileLayer` might reimplement the following method.
        // @method getTileUrl(coords: Object): String
        // Called only internally, returns the URL for a tile given its coordinates.
        // Classes extending `TileLayer` can override this function to provide custom tile URL naming schemes.
        getTileUrl: function(coords) {
          var data = {
            r: Browser.retina ? "@2x" : "",
            s: this._getSubdomain(coords),
            x: coords.x,
            y: coords.y,
            z: this._getZoomForUrl()
          };
          if (this._map && !this._map.options.crs.infinite) {
            var invertedY = this._globalTileRange.max.y - coords.y;
            if (this.options.tms) {
              data["y"] = invertedY;
            }
            data["-y"] = invertedY;
          }
          return template(this._url, extend(data, this.options));
        },
        _tileOnLoad: function(done, tile) {
          if (Browser.ielt9) {
            setTimeout(bind(done, this, null, tile), 0);
          } else {
            done(null, tile);
          }
        },
        _tileOnError: function(done, tile, e) {
          var errorUrl = this.options.errorTileUrl;
          if (errorUrl && tile.getAttribute("src") !== errorUrl) {
            tile.src = errorUrl;
          }
          done(e, tile);
        },
        _onTileRemove: function(e) {
          e.tile.onload = null;
        },
        _getZoomForUrl: function() {
          var zoom2 = this._tileZoom, maxZoom = this.options.maxZoom, zoomReverse = this.options.zoomReverse, zoomOffset = this.options.zoomOffset;
          if (zoomReverse) {
            zoom2 = maxZoom - zoom2;
          }
          return zoom2 + zoomOffset;
        },
        _getSubdomain: function(tilePoint) {
          var index2 = Math.abs(tilePoint.x + tilePoint.y) % this.options.subdomains.length;
          return this.options.subdomains[index2];
        },
        // stops loading all tiles in the background layer
        _abortLoading: function() {
          var i, tile;
          for (i in this._tiles) {
            if (this._tiles[i].coords.z !== this._tileZoom) {
              tile = this._tiles[i].el;
              tile.onload = falseFn;
              tile.onerror = falseFn;
              if (!tile.complete) {
                tile.src = emptyImageUrl;
                var coords = this._tiles[i].coords;
                remove(tile);
                delete this._tiles[i];
                this.fire("tileabort", {
                  tile,
                  coords
                });
              }
            }
          }
        },
        _removeTile: function(key) {
          var tile = this._tiles[key];
          if (!tile) {
            return;
          }
          tile.el.setAttribute("src", emptyImageUrl);
          return GridLayer.prototype._removeTile.call(this, key);
        },
        _tileReady: function(coords, err, tile) {
          if (!this._map || tile && tile.getAttribute("src") === emptyImageUrl) {
            return;
          }
          return GridLayer.prototype._tileReady.call(this, coords, err, tile);
        }
      });
      function tileLayer(url, options) {
        return new TileLayer(url, options);
      }
      var TileLayerWMS = TileLayer.extend({
        // @section
        // @aka TileLayer.WMS options
        // If any custom options not documented here are used, they will be sent to the
        // WMS server as extra parameters in each request URL. This can be useful for
        // [non-standard vendor WMS parameters](https://docs.geoserver.org/stable/en/user/services/wms/vendor.html).
        defaultWmsParams: {
          service: "WMS",
          request: "GetMap",
          // @option layers: String = ''
          // **(required)** Comma-separated list of WMS layers to show.
          layers: "",
          // @option styles: String = ''
          // Comma-separated list of WMS styles.
          styles: "",
          // @option format: String = 'image/jpeg'
          // WMS image format (use `'image/png'` for layers with transparency).
          format: "image/jpeg",
          // @option transparent: Boolean = false
          // If `true`, the WMS service will return images with transparency.
          transparent: false,
          // @option version: String = '1.1.1'
          // Version of the WMS service to use
          version: "1.1.1"
        },
        options: {
          // @option crs: CRS = null
          // Coordinate Reference System to use for the WMS requests, defaults to
          // map CRS. Don't change this if you're not sure what it means.
          crs: null,
          // @option uppercase: Boolean = false
          // If `true`, WMS request parameter keys will be uppercase.
          uppercase: false
        },
        initialize: function(url, options) {
          this._url = url;
          var wmsParams = extend({}, this.defaultWmsParams);
          for (var i in options) {
            if (!(i in this.options)) {
              wmsParams[i] = options[i];
            }
          }
          options = setOptions(this, options);
          var realRetina = options.detectRetina && Browser.retina ? 2 : 1;
          var tileSize = this.getTileSize();
          wmsParams.width = tileSize.x * realRetina;
          wmsParams.height = tileSize.y * realRetina;
          this.wmsParams = wmsParams;
        },
        onAdd: function(map) {
          this._crs = this.options.crs || map.options.crs;
          this._wmsVersion = parseFloat(this.wmsParams.version);
          var projectionKey = this._wmsVersion >= 1.3 ? "crs" : "srs";
          this.wmsParams[projectionKey] = this._crs.code;
          TileLayer.prototype.onAdd.call(this, map);
        },
        getTileUrl: function(coords) {
          var tileBounds = this._tileCoordsToNwSe(coords), crs = this._crs, bounds = toBounds(crs.project(tileBounds[0]), crs.project(tileBounds[1])), min = bounds.min, max = bounds.max, bbox = (this._wmsVersion >= 1.3 && this._crs === EPSG4326 ? [min.y, min.x, max.y, max.x] : [min.x, min.y, max.x, max.y]).join(","), url = TileLayer.prototype.getTileUrl.call(this, coords);
          return url + getParamString(this.wmsParams, url, this.options.uppercase) + (this.options.uppercase ? "&BBOX=" : "&bbox=") + bbox;
        },
        // @method setParams(params: Object, noRedraw?: Boolean): this
        // Merges an object with the new parameters and re-requests tiles on the current screen (unless `noRedraw` was set to true).
        setParams: function(params, noRedraw) {
          extend(this.wmsParams, params);
          if (!noRedraw) {
            this.redraw();
          }
          return this;
        }
      });
      function tileLayerWMS(url, options) {
        return new TileLayerWMS(url, options);
      }
      TileLayer.WMS = TileLayerWMS;
      tileLayer.wms = tileLayerWMS;
      var Renderer = Layer.extend({
        // @section
        // @aka Renderer options
        options: {
          // @option padding: Number = 0.1
          // How much to extend the clip area around the map view (relative to its size)
          // e.g. 0.1 would be 10% of map view in each direction
          padding: 0.1
        },
        initialize: function(options) {
          setOptions(this, options);
          stamp(this);
          this._layers = this._layers || {};
        },
        onAdd: function() {
          if (!this._container) {
            this._initContainer();
            addClass(this._container, "leaflet-zoom-animated");
          }
          this.getPane().appendChild(this._container);
          this._update();
          this.on("update", this._updatePaths, this);
        },
        onRemove: function() {
          this.off("update", this._updatePaths, this);
          this._destroyContainer();
        },
        getEvents: function() {
          var events = {
            viewreset: this._reset,
            zoom: this._onZoom,
            moveend: this._update,
            zoomend: this._onZoomEnd
          };
          if (this._zoomAnimated) {
            events.zoomanim = this._onAnimZoom;
          }
          return events;
        },
        _onAnimZoom: function(ev) {
          this._updateTransform(ev.center, ev.zoom);
        },
        _onZoom: function() {
          this._updateTransform(this._map.getCenter(), this._map.getZoom());
        },
        _updateTransform: function(center, zoom2) {
          var scale2 = this._map.getZoomScale(zoom2, this._zoom), viewHalf = this._map.getSize().multiplyBy(0.5 + this.options.padding), currentCenterPoint = this._map.project(this._center, zoom2), topLeftOffset = viewHalf.multiplyBy(-scale2).add(currentCenterPoint).subtract(this._map._getNewPixelOrigin(center, zoom2));
          if (Browser.any3d) {
            setTransform(this._container, topLeftOffset, scale2);
          } else {
            setPosition(this._container, topLeftOffset);
          }
        },
        _reset: function() {
          this._update();
          this._updateTransform(this._center, this._zoom);
          for (var id in this._layers) {
            this._layers[id]._reset();
          }
        },
        _onZoomEnd: function() {
          for (var id in this._layers) {
            this._layers[id]._project();
          }
        },
        _updatePaths: function() {
          for (var id in this._layers) {
            this._layers[id]._update();
          }
        },
        _update: function() {
          var p = this.options.padding, size = this._map.getSize(), min = this._map.containerPointToLayerPoint(size.multiplyBy(-p)).round();
          this._bounds = new Bounds(min, min.add(size.multiplyBy(1 + p * 2)).round());
          this._center = this._map.getCenter();
          this._zoom = this._map.getZoom();
        }
      });
      var Canvas = Renderer.extend({
        // @section
        // @aka Canvas options
        options: {
          // @option tolerance: Number = 0
          // How much to extend the click tolerance around a path/object on the map.
          tolerance: 0
        },
        getEvents: function() {
          var events = Renderer.prototype.getEvents.call(this);
          events.viewprereset = this._onViewPreReset;
          return events;
        },
        _onViewPreReset: function() {
          this._postponeUpdatePaths = true;
        },
        onAdd: function() {
          Renderer.prototype.onAdd.call(this);
          this._draw();
        },
        _initContainer: function() {
          var container = this._container = document.createElement("canvas");
          on(container, "mousemove", this._onMouseMove, this);
          on(container, "click dblclick mousedown mouseup contextmenu", this._onClick, this);
          on(container, "mouseout", this._handleMouseOut, this);
          container["_leaflet_disable_events"] = true;
          this._ctx = container.getContext("2d");
        },
        _destroyContainer: function() {
          cancelAnimFrame(this._redrawRequest);
          delete this._ctx;
          remove(this._container);
          off(this._container);
          delete this._container;
        },
        _updatePaths: function() {
          if (this._postponeUpdatePaths) {
            return;
          }
          var layer;
          this._redrawBounds = null;
          for (var id in this._layers) {
            layer = this._layers[id];
            layer._update();
          }
          this._redraw();
        },
        _update: function() {
          if (this._map._animatingZoom && this._bounds) {
            return;
          }
          Renderer.prototype._update.call(this);
          var b = this._bounds, container = this._container, size = b.getSize(), m = Browser.retina ? 2 : 1;
          setPosition(container, b.min);
          container.width = m * size.x;
          container.height = m * size.y;
          container.style.width = size.x + "px";
          container.style.height = size.y + "px";
          if (Browser.retina) {
            this._ctx.scale(2, 2);
          }
          this._ctx.translate(-b.min.x, -b.min.y);
          this.fire("update");
        },
        _reset: function() {
          Renderer.prototype._reset.call(this);
          if (this._postponeUpdatePaths) {
            this._postponeUpdatePaths = false;
            this._updatePaths();
          }
        },
        _initPath: function(layer) {
          this._updateDashArray(layer);
          this._layers[stamp(layer)] = layer;
          var order = layer._order = {
            layer,
            prev: this._drawLast,
            next: null
          };
          if (this._drawLast) {
            this._drawLast.next = order;
          }
          this._drawLast = order;
          this._drawFirst = this._drawFirst || this._drawLast;
        },
        _addPath: function(layer) {
          this._requestRedraw(layer);
        },
        _removePath: function(layer) {
          var order = layer._order;
          var next = order.next;
          var prev = order.prev;
          if (next) {
            next.prev = prev;
          } else {
            this._drawLast = prev;
          }
          if (prev) {
            prev.next = next;
          } else {
            this._drawFirst = next;
          }
          delete layer._order;
          delete this._layers[stamp(layer)];
          this._requestRedraw(layer);
        },
        _updatePath: function(layer) {
          this._extendRedrawBounds(layer);
          layer._project();
          layer._update();
          this._requestRedraw(layer);
        },
        _updateStyle: function(layer) {
          this._updateDashArray(layer);
          this._requestRedraw(layer);
        },
        _updateDashArray: function(layer) {
          if (typeof layer.options.dashArray === "string") {
            var parts = layer.options.dashArray.split(/[, ]+/), dashArray = [], dashValue, i;
            for (i = 0; i < parts.length; i++) {
              dashValue = Number(parts[i]);
              if (isNaN(dashValue)) {
                return;
              }
              dashArray.push(dashValue);
            }
            layer.options._dashArray = dashArray;
          } else {
            layer.options._dashArray = layer.options.dashArray;
          }
        },
        _requestRedraw: function(layer) {
          if (!this._map) {
            return;
          }
          this._extendRedrawBounds(layer);
          this._redrawRequest = this._redrawRequest || requestAnimFrame(this._redraw, this);
        },
        _extendRedrawBounds: function(layer) {
          if (layer._pxBounds) {
            var padding = (layer.options.weight || 0) + 1;
            this._redrawBounds = this._redrawBounds || new Bounds();
            this._redrawBounds.extend(layer._pxBounds.min.subtract([padding, padding]));
            this._redrawBounds.extend(layer._pxBounds.max.add([padding, padding]));
          }
        },
        _redraw: function() {
          this._redrawRequest = null;
          if (this._redrawBounds) {
            this._redrawBounds.min._floor();
            this._redrawBounds.max._ceil();
          }
          this._clear();
          this._draw();
          this._redrawBounds = null;
        },
        _clear: function() {
          var bounds = this._redrawBounds;
          if (bounds) {
            var size = bounds.getSize();
            this._ctx.clearRect(bounds.min.x, bounds.min.y, size.x, size.y);
          } else {
            this._ctx.save();
            this._ctx.setTransform(1, 0, 0, 1, 0, 0);
            this._ctx.clearRect(0, 0, this._container.width, this._container.height);
            this._ctx.restore();
          }
        },
        _draw: function() {
          var layer, bounds = this._redrawBounds;
          this._ctx.save();
          if (bounds) {
            var size = bounds.getSize();
            this._ctx.beginPath();
            this._ctx.rect(bounds.min.x, bounds.min.y, size.x, size.y);
            this._ctx.clip();
          }
          this._drawing = true;
          for (var order = this._drawFirst; order; order = order.next) {
            layer = order.layer;
            if (!bounds || layer._pxBounds && layer._pxBounds.intersects(bounds)) {
              layer._updatePath();
            }
          }
          this._drawing = false;
          this._ctx.restore();
        },
        _updatePoly: function(layer, closed) {
          if (!this._drawing) {
            return;
          }
          var i, j, len2, p, parts = layer._parts, len = parts.length, ctx = this._ctx;
          if (!len) {
            return;
          }
          ctx.beginPath();
          for (i = 0; i < len; i++) {
            for (j = 0, len2 = parts[i].length; j < len2; j++) {
              p = parts[i][j];
              ctx[j ? "lineTo" : "moveTo"](p.x, p.y);
            }
            if (closed) {
              ctx.closePath();
            }
          }
          this._fillStroke(ctx, layer);
        },
        _updateCircle: function(layer) {
          if (!this._drawing || layer._empty()) {
            return;
          }
          var p = layer._point, ctx = this._ctx, r2 = Math.max(Math.round(layer._radius), 1), s = (Math.max(Math.round(layer._radiusY), 1) || r2) / r2;
          if (s !== 1) {
            ctx.save();
            ctx.scale(1, s);
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y / s, r2, 0, Math.PI * 2, false);
          if (s !== 1) {
            ctx.restore();
          }
          this._fillStroke(ctx, layer);
        },
        _fillStroke: function(ctx, layer) {
          var options = layer.options;
          if (options.fill) {
            ctx.globalAlpha = options.fillOpacity;
            ctx.fillStyle = options.fillColor || options.color;
            ctx.fill(options.fillRule || "evenodd");
          }
          if (options.stroke && options.weight !== 0) {
            if (ctx.setLineDash) {
              ctx.setLineDash(layer.options && layer.options._dashArray || []);
            }
            ctx.globalAlpha = options.opacity;
            ctx.lineWidth = options.weight;
            ctx.strokeStyle = options.color;
            ctx.lineCap = options.lineCap;
            ctx.lineJoin = options.lineJoin;
            ctx.stroke();
          }
        },
        // Canvas obviously doesn't have mouse events for individual drawn objects,
        // so we emulate that by calculating what's under the mouse on mousemove/click manually
        _onClick: function(e) {
          var point = this._map.mouseEventToLayerPoint(e), layer, clickedLayer;
          for (var order = this._drawFirst; order; order = order.next) {
            layer = order.layer;
            if (layer.options.interactive && layer._containsPoint(point)) {
              if (!(e.type === "click" || e.type === "preclick") || !this._map._draggableMoved(layer)) {
                clickedLayer = layer;
              }
            }
          }
          this._fireEvent(clickedLayer ? [clickedLayer] : false, e);
        },
        _onMouseMove: function(e) {
          if (!this._map || this._map.dragging.moving() || this._map._animatingZoom) {
            return;
          }
          var point = this._map.mouseEventToLayerPoint(e);
          this._handleMouseHover(e, point);
        },
        _handleMouseOut: function(e) {
          var layer = this._hoveredLayer;
          if (layer) {
            removeClass(this._container, "leaflet-interactive");
            this._fireEvent([layer], e, "mouseout");
            this._hoveredLayer = null;
            this._mouseHoverThrottled = false;
          }
        },
        _handleMouseHover: function(e, point) {
          if (this._mouseHoverThrottled) {
            return;
          }
          var layer, candidateHoveredLayer;
          for (var order = this._drawFirst; order; order = order.next) {
            layer = order.layer;
            if (layer.options.interactive && layer._containsPoint(point)) {
              candidateHoveredLayer = layer;
            }
          }
          if (candidateHoveredLayer !== this._hoveredLayer) {
            this._handleMouseOut(e);
            if (candidateHoveredLayer) {
              addClass(this._container, "leaflet-interactive");
              this._fireEvent([candidateHoveredLayer], e, "mouseover");
              this._hoveredLayer = candidateHoveredLayer;
            }
          }
          this._fireEvent(this._hoveredLayer ? [this._hoveredLayer] : false, e);
          this._mouseHoverThrottled = true;
          setTimeout(bind(function() {
            this._mouseHoverThrottled = false;
          }, this), 32);
        },
        _fireEvent: function(layers2, e, type) {
          this._map._fireDOMEvent(e, type || e.type, layers2);
        },
        _bringToFront: function(layer) {
          var order = layer._order;
          if (!order) {
            return;
          }
          var next = order.next;
          var prev = order.prev;
          if (next) {
            next.prev = prev;
          } else {
            return;
          }
          if (prev) {
            prev.next = next;
          } else if (next) {
            this._drawFirst = next;
          }
          order.prev = this._drawLast;
          this._drawLast.next = order;
          order.next = null;
          this._drawLast = order;
          this._requestRedraw(layer);
        },
        _bringToBack: function(layer) {
          var order = layer._order;
          if (!order) {
            return;
          }
          var next = order.next;
          var prev = order.prev;
          if (prev) {
            prev.next = next;
          } else {
            return;
          }
          if (next) {
            next.prev = prev;
          } else if (prev) {
            this._drawLast = prev;
          }
          order.prev = null;
          order.next = this._drawFirst;
          this._drawFirst.prev = order;
          this._drawFirst = order;
          this._requestRedraw(layer);
        }
      });
      function canvas(options) {
        return Browser.canvas ? new Canvas(options) : null;
      }
      var vmlCreate = function() {
        try {
          document.namespaces.add("lvml", "urn:schemas-microsoft-com:vml");
          return function(name) {
            return document.createElement("<lvml:" + name + ' class="lvml">');
          };
        } catch (e) {
        }
        return function(name) {
          return document.createElement("<" + name + ' xmlns="urn:schemas-microsoft.com:vml" class="lvml">');
        };
      }();
      var vmlMixin = {
        _initContainer: function() {
          this._container = create$1("div", "leaflet-vml-container");
        },
        _update: function() {
          if (this._map._animatingZoom) {
            return;
          }
          Renderer.prototype._update.call(this);
          this.fire("update");
        },
        _initPath: function(layer) {
          var container = layer._container = vmlCreate("shape");
          addClass(container, "leaflet-vml-shape " + (this.options.className || ""));
          container.coordsize = "1 1";
          layer._path = vmlCreate("path");
          container.appendChild(layer._path);
          this._updateStyle(layer);
          this._layers[stamp(layer)] = layer;
        },
        _addPath: function(layer) {
          var container = layer._container;
          this._container.appendChild(container);
          if (layer.options.interactive) {
            layer.addInteractiveTarget(container);
          }
        },
        _removePath: function(layer) {
          var container = layer._container;
          remove(container);
          layer.removeInteractiveTarget(container);
          delete this._layers[stamp(layer)];
        },
        _updateStyle: function(layer) {
          var stroke = layer._stroke, fill = layer._fill, options = layer.options, container = layer._container;
          container.stroked = !!options.stroke;
          container.filled = !!options.fill;
          if (options.stroke) {
            if (!stroke) {
              stroke = layer._stroke = vmlCreate("stroke");
            }
            container.appendChild(stroke);
            stroke.weight = options.weight + "px";
            stroke.color = options.color;
            stroke.opacity = options.opacity;
            if (options.dashArray) {
              stroke.dashStyle = isArray(options.dashArray) ? options.dashArray.join(" ") : options.dashArray.replace(/( *, *)/g, " ");
            } else {
              stroke.dashStyle = "";
            }
            stroke.endcap = options.lineCap.replace("butt", "flat");
            stroke.joinstyle = options.lineJoin;
          } else if (stroke) {
            container.removeChild(stroke);
            layer._stroke = null;
          }
          if (options.fill) {
            if (!fill) {
              fill = layer._fill = vmlCreate("fill");
            }
            container.appendChild(fill);
            fill.color = options.fillColor || options.color;
            fill.opacity = options.fillOpacity;
          } else if (fill) {
            container.removeChild(fill);
            layer._fill = null;
          }
        },
        _updateCircle: function(layer) {
          var p = layer._point.round(), r2 = Math.round(layer._radius), r22 = Math.round(layer._radiusY || r2);
          this._setPath(layer, layer._empty() ? "M0 0" : "AL " + p.x + "," + p.y + " " + r2 + "," + r22 + " 0," + 65535 * 360);
        },
        _setPath: function(layer, path) {
          layer._path.v = path;
        },
        _bringToFront: function(layer) {
          toFront(layer._container);
        },
        _bringToBack: function(layer) {
          toBack(layer._container);
        }
      };
      var create = Browser.vml ? vmlCreate : svgCreate;
      var SVG = Renderer.extend({
        _initContainer: function() {
          this._container = create("svg");
          this._container.setAttribute("pointer-events", "none");
          this._rootGroup = create("g");
          this._container.appendChild(this._rootGroup);
        },
        _destroyContainer: function() {
          remove(this._container);
          off(this._container);
          delete this._container;
          delete this._rootGroup;
          delete this._svgSize;
        },
        _update: function() {
          if (this._map._animatingZoom && this._bounds) {
            return;
          }
          Renderer.prototype._update.call(this);
          var b = this._bounds, size = b.getSize(), container = this._container;
          if (!this._svgSize || !this._svgSize.equals(size)) {
            this._svgSize = size;
            container.setAttribute("width", size.x);
            container.setAttribute("height", size.y);
          }
          setPosition(container, b.min);
          container.setAttribute("viewBox", [b.min.x, b.min.y, size.x, size.y].join(" "));
          this.fire("update");
        },
        // methods below are called by vector layers implementations
        _initPath: function(layer) {
          var path = layer._path = create("path");
          if (layer.options.className) {
            addClass(path, layer.options.className);
          }
          if (layer.options.interactive) {
            addClass(path, "leaflet-interactive");
          }
          this._updateStyle(layer);
          this._layers[stamp(layer)] = layer;
        },
        _addPath: function(layer) {
          if (!this._rootGroup) {
            this._initContainer();
          }
          this._rootGroup.appendChild(layer._path);
          layer.addInteractiveTarget(layer._path);
        },
        _removePath: function(layer) {
          remove(layer._path);
          layer.removeInteractiveTarget(layer._path);
          delete this._layers[stamp(layer)];
        },
        _updatePath: function(layer) {
          layer._project();
          layer._update();
        },
        _updateStyle: function(layer) {
          var path = layer._path, options = layer.options;
          if (!path) {
            return;
          }
          if (options.stroke) {
            path.setAttribute("stroke", options.color);
            path.setAttribute("stroke-opacity", options.opacity);
            path.setAttribute("stroke-width", options.weight);
            path.setAttribute("stroke-linecap", options.lineCap);
            path.setAttribute("stroke-linejoin", options.lineJoin);
            if (options.dashArray) {
              path.setAttribute("stroke-dasharray", options.dashArray);
            } else {
              path.removeAttribute("stroke-dasharray");
            }
            if (options.dashOffset) {
              path.setAttribute("stroke-dashoffset", options.dashOffset);
            } else {
              path.removeAttribute("stroke-dashoffset");
            }
          } else {
            path.setAttribute("stroke", "none");
          }
          if (options.fill) {
            path.setAttribute("fill", options.fillColor || options.color);
            path.setAttribute("fill-opacity", options.fillOpacity);
            path.setAttribute("fill-rule", options.fillRule || "evenodd");
          } else {
            path.setAttribute("fill", "none");
          }
        },
        _updatePoly: function(layer, closed) {
          this._setPath(layer, pointsToPath(layer._parts, closed));
        },
        _updateCircle: function(layer) {
          var p = layer._point, r2 = Math.max(Math.round(layer._radius), 1), r22 = Math.max(Math.round(layer._radiusY), 1) || r2, arc = "a" + r2 + "," + r22 + " 0 1,0 ";
          var d = layer._empty() ? "M0 0" : "M" + (p.x - r2) + "," + p.y + arc + r2 * 2 + ",0 " + arc + -r2 * 2 + ",0 ";
          this._setPath(layer, d);
        },
        _setPath: function(layer, path) {
          layer._path.setAttribute("d", path);
        },
        // SVG does not have the concept of zIndex so we resort to changing the DOM order of elements
        _bringToFront: function(layer) {
          toFront(layer._path);
        },
        _bringToBack: function(layer) {
          toBack(layer._path);
        }
      });
      if (Browser.vml) {
        SVG.include(vmlMixin);
      }
      function svg(options) {
        return Browser.svg || Browser.vml ? new SVG(options) : null;
      }
      Map2.include({
        // @namespace Map; @method getRenderer(layer: Path): Renderer
        // Returns the instance of `Renderer` that should be used to render the given
        // `Path`. It will ensure that the `renderer` options of the map and paths
        // are respected, and that the renderers do exist on the map.
        getRenderer: function(layer) {
          var renderer = layer.options.renderer || this._getPaneRenderer(layer.options.pane) || this.options.renderer || this._renderer;
          if (!renderer) {
            renderer = this._renderer = this._createRenderer();
          }
          if (!this.hasLayer(renderer)) {
            this.addLayer(renderer);
          }
          return renderer;
        },
        _getPaneRenderer: function(name) {
          if (name === "overlayPane" || name === void 0) {
            return false;
          }
          var renderer = this._paneRenderers[name];
          if (renderer === void 0) {
            renderer = this._createRenderer({ pane: name });
            this._paneRenderers[name] = renderer;
          }
          return renderer;
        },
        _createRenderer: function(options) {
          return this.options.preferCanvas && canvas(options) || svg(options);
        }
      });
      var Rectangle = Polygon.extend({
        initialize: function(latLngBounds, options) {
          Polygon.prototype.initialize.call(this, this._boundsToLatLngs(latLngBounds), options);
        },
        // @method setBounds(latLngBounds: LatLngBounds): this
        // Redraws the rectangle with the passed bounds.
        setBounds: function(latLngBounds) {
          return this.setLatLngs(this._boundsToLatLngs(latLngBounds));
        },
        _boundsToLatLngs: function(latLngBounds) {
          latLngBounds = toLatLngBounds(latLngBounds);
          return [
            latLngBounds.getSouthWest(),
            latLngBounds.getNorthWest(),
            latLngBounds.getNorthEast(),
            latLngBounds.getSouthEast()
          ];
        }
      });
      function rectangle(latLngBounds, options) {
        return new Rectangle(latLngBounds, options);
      }
      SVG.create = create;
      SVG.pointsToPath = pointsToPath;
      GeoJSON.geometryToLayer = geometryToLayer;
      GeoJSON.coordsToLatLng = coordsToLatLng;
      GeoJSON.coordsToLatLngs = coordsToLatLngs;
      GeoJSON.latLngToCoords = latLngToCoords;
      GeoJSON.latLngsToCoords = latLngsToCoords;
      GeoJSON.getFeature = getFeature;
      GeoJSON.asFeature = asFeature;
      Map2.mergeOptions({
        // @option boxZoom: Boolean = true
        // Whether the map can be zoomed to a rectangular area specified by
        // dragging the mouse while pressing the shift key.
        boxZoom: true
      });
      var BoxZoom = Handler.extend({
        initialize: function(map) {
          this._map = map;
          this._container = map._container;
          this._pane = map._panes.overlayPane;
          this._resetStateTimeout = 0;
          map.on("unload", this._destroy, this);
        },
        addHooks: function() {
          on(this._container, "mousedown", this._onMouseDown, this);
        },
        removeHooks: function() {
          off(this._container, "mousedown", this._onMouseDown, this);
        },
        moved: function() {
          return this._moved;
        },
        _destroy: function() {
          remove(this._pane);
          delete this._pane;
        },
        _resetState: function() {
          this._resetStateTimeout = 0;
          this._moved = false;
        },
        _clearDeferredResetState: function() {
          if (this._resetStateTimeout !== 0) {
            clearTimeout(this._resetStateTimeout);
            this._resetStateTimeout = 0;
          }
        },
        _onMouseDown: function(e) {
          if (!e.shiftKey || e.which !== 1 && e.button !== 1) {
            return false;
          }
          this._clearDeferredResetState();
          this._resetState();
          disableTextSelection();
          disableImageDrag();
          this._startPoint = this._map.mouseEventToContainerPoint(e);
          on(document, {
            contextmenu: stop,
            mousemove: this._onMouseMove,
            mouseup: this._onMouseUp,
            keydown: this._onKeyDown
          }, this);
        },
        _onMouseMove: function(e) {
          if (!this._moved) {
            this._moved = true;
            this._box = create$1("div", "leaflet-zoom-box", this._container);
            addClass(this._container, "leaflet-crosshair");
            this._map.fire("boxzoomstart");
          }
          this._point = this._map.mouseEventToContainerPoint(e);
          var bounds = new Bounds(this._point, this._startPoint), size = bounds.getSize();
          setPosition(this._box, bounds.min);
          this._box.style.width = size.x + "px";
          this._box.style.height = size.y + "px";
        },
        _finish: function() {
          if (this._moved) {
            remove(this._box);
            removeClass(this._container, "leaflet-crosshair");
          }
          enableTextSelection();
          enableImageDrag();
          off(document, {
            contextmenu: stop,
            mousemove: this._onMouseMove,
            mouseup: this._onMouseUp,
            keydown: this._onKeyDown
          }, this);
        },
        _onMouseUp: function(e) {
          if (e.which !== 1 && e.button !== 1) {
            return;
          }
          this._finish();
          if (!this._moved) {
            return;
          }
          this._clearDeferredResetState();
          this._resetStateTimeout = setTimeout(bind(this._resetState, this), 0);
          var bounds = new LatLngBounds(
            this._map.containerPointToLatLng(this._startPoint),
            this._map.containerPointToLatLng(this._point)
          );
          this._map.fitBounds(bounds).fire("boxzoomend", { boxZoomBounds: bounds });
        },
        _onKeyDown: function(e) {
          if (e.keyCode === 27) {
            this._finish();
            this._clearDeferredResetState();
            this._resetState();
          }
        }
      });
      Map2.addInitHook("addHandler", "boxZoom", BoxZoom);
      Map2.mergeOptions({
        // @option doubleClickZoom: Boolean|String = true
        // Whether the map can be zoomed in by double clicking on it and
        // zoomed out by double clicking while holding shift. If passed
        // `'center'`, double-click zoom will zoom to the center of the
        //  view regardless of where the mouse was.
        doubleClickZoom: true
      });
      var DoubleClickZoom = Handler.extend({
        addHooks: function() {
          this._map.on("dblclick", this._onDoubleClick, this);
        },
        removeHooks: function() {
          this._map.off("dblclick", this._onDoubleClick, this);
        },
        _onDoubleClick: function(e) {
          var map = this._map, oldZoom = map.getZoom(), delta = map.options.zoomDelta, zoom2 = e.originalEvent.shiftKey ? oldZoom - delta : oldZoom + delta;
          if (map.options.doubleClickZoom === "center") {
            map.setZoom(zoom2);
          } else {
            map.setZoomAround(e.containerPoint, zoom2);
          }
        }
      });
      Map2.addInitHook("addHandler", "doubleClickZoom", DoubleClickZoom);
      Map2.mergeOptions({
        // @option dragging: Boolean = true
        // Whether the map is draggable with mouse/touch or not.
        dragging: true,
        // @section Panning Inertia Options
        // @option inertia: Boolean = *
        // If enabled, panning of the map will have an inertia effect where
        // the map builds momentum while dragging and continues moving in
        // the same direction for some time. Feels especially nice on touch
        // devices. Enabled by default.
        inertia: true,
        // @option inertiaDeceleration: Number = 3000
        // The rate with which the inertial movement slows down, in pixels/second².
        inertiaDeceleration: 3400,
        // px/s^2
        // @option inertiaMaxSpeed: Number = Infinity
        // Max speed of the inertial movement, in pixels/second.
        inertiaMaxSpeed: Infinity,
        // px/s
        // @option easeLinearity: Number = 0.2
        easeLinearity: 0.2,
        // TODO refactor, move to CRS
        // @option worldCopyJump: Boolean = false
        // With this option enabled, the map tracks when you pan to another "copy"
        // of the world and seamlessly jumps to the original one so that all overlays
        // like markers and vector layers are still visible.
        worldCopyJump: false,
        // @option maxBoundsViscosity: Number = 0.0
        // If `maxBounds` is set, this option will control how solid the bounds
        // are when dragging the map around. The default value of `0.0` allows the
        // user to drag outside the bounds at normal speed, higher values will
        // slow down map dragging outside bounds, and `1.0` makes the bounds fully
        // solid, preventing the user from dragging outside the bounds.
        maxBoundsViscosity: 0
      });
      var Drag = Handler.extend({
        addHooks: function() {
          if (!this._draggable) {
            var map = this._map;
            this._draggable = new Draggable(map._mapPane, map._container);
            this._draggable.on({
              dragstart: this._onDragStart,
              drag: this._onDrag,
              dragend: this._onDragEnd
            }, this);
            this._draggable.on("predrag", this._onPreDragLimit, this);
            if (map.options.worldCopyJump) {
              this._draggable.on("predrag", this._onPreDragWrap, this);
              map.on("zoomend", this._onZoomEnd, this);
              map.whenReady(this._onZoomEnd, this);
            }
          }
          addClass(this._map._container, "leaflet-grab leaflet-touch-drag");
          this._draggable.enable();
          this._positions = [];
          this._times = [];
        },
        removeHooks: function() {
          removeClass(this._map._container, "leaflet-grab");
          removeClass(this._map._container, "leaflet-touch-drag");
          this._draggable.disable();
        },
        moved: function() {
          return this._draggable && this._draggable._moved;
        },
        moving: function() {
          return this._draggable && this._draggable._moving;
        },
        _onDragStart: function() {
          var map = this._map;
          map._stop();
          if (this._map.options.maxBounds && this._map.options.maxBoundsViscosity) {
            var bounds = toLatLngBounds(this._map.options.maxBounds);
            this._offsetLimit = toBounds(
              this._map.latLngToContainerPoint(bounds.getNorthWest()).multiplyBy(-1),
              this._map.latLngToContainerPoint(bounds.getSouthEast()).multiplyBy(-1).add(this._map.getSize())
            );
            this._viscosity = Math.min(1, Math.max(0, this._map.options.maxBoundsViscosity));
          } else {
            this._offsetLimit = null;
          }
          map.fire("movestart").fire("dragstart");
          if (map.options.inertia) {
            this._positions = [];
            this._times = [];
          }
        },
        _onDrag: function(e) {
          if (this._map.options.inertia) {
            var time = this._lastTime = +/* @__PURE__ */ new Date(), pos = this._lastPos = this._draggable._absPos || this._draggable._newPos;
            this._positions.push(pos);
            this._times.push(time);
            this._prunePositions(time);
          }
          this._map.fire("move", e).fire("drag", e);
        },
        _prunePositions: function(time) {
          while (this._positions.length > 1 && time - this._times[0] > 50) {
            this._positions.shift();
            this._times.shift();
          }
        },
        _onZoomEnd: function() {
          var pxCenter = this._map.getSize().divideBy(2), pxWorldCenter = this._map.latLngToLayerPoint([0, 0]);
          this._initialWorldOffset = pxWorldCenter.subtract(pxCenter).x;
          this._worldWidth = this._map.getPixelWorldBounds().getSize().x;
        },
        _viscousLimit: function(value, threshold) {
          return value - (value - threshold) * this._viscosity;
        },
        _onPreDragLimit: function() {
          if (!this._viscosity || !this._offsetLimit) {
            return;
          }
          var offset = this._draggable._newPos.subtract(this._draggable._startPos);
          var limit = this._offsetLimit;
          if (offset.x < limit.min.x) {
            offset.x = this._viscousLimit(offset.x, limit.min.x);
          }
          if (offset.y < limit.min.y) {
            offset.y = this._viscousLimit(offset.y, limit.min.y);
          }
          if (offset.x > limit.max.x) {
            offset.x = this._viscousLimit(offset.x, limit.max.x);
          }
          if (offset.y > limit.max.y) {
            offset.y = this._viscousLimit(offset.y, limit.max.y);
          }
          this._draggable._newPos = this._draggable._startPos.add(offset);
        },
        _onPreDragWrap: function() {
          var worldWidth = this._worldWidth, halfWidth = Math.round(worldWidth / 2), dx = this._initialWorldOffset, x = this._draggable._newPos.x, newX1 = (x - halfWidth + dx) % worldWidth + halfWidth - dx, newX2 = (x + halfWidth + dx) % worldWidth - halfWidth - dx, newX = Math.abs(newX1 + dx) < Math.abs(newX2 + dx) ? newX1 : newX2;
          this._draggable._absPos = this._draggable._newPos.clone();
          this._draggable._newPos.x = newX;
        },
        _onDragEnd: function(e) {
          var map = this._map, options = map.options, noInertia = !options.inertia || e.noInertia || this._times.length < 2;
          map.fire("dragend", e);
          if (noInertia) {
            map.fire("moveend");
          } else {
            this._prunePositions(+/* @__PURE__ */ new Date());
            var direction = this._lastPos.subtract(this._positions[0]), duration = (this._lastTime - this._times[0]) / 1e3, ease = options.easeLinearity, speedVector = direction.multiplyBy(ease / duration), speed = speedVector.distanceTo([0, 0]), limitedSpeed = Math.min(options.inertiaMaxSpeed, speed), limitedSpeedVector = speedVector.multiplyBy(limitedSpeed / speed), decelerationDuration = limitedSpeed / (options.inertiaDeceleration * ease), offset = limitedSpeedVector.multiplyBy(-decelerationDuration / 2).round();
            if (!offset.x && !offset.y) {
              map.fire("moveend");
            } else {
              offset = map._limitOffset(offset, map.options.maxBounds);
              requestAnimFrame(function() {
                map.panBy(offset, {
                  duration: decelerationDuration,
                  easeLinearity: ease,
                  noMoveStart: true,
                  animate: true
                });
              });
            }
          }
        }
      });
      Map2.addInitHook("addHandler", "dragging", Drag);
      Map2.mergeOptions({
        // @option keyboard: Boolean = true
        // Makes the map focusable and allows users to navigate the map with keyboard
        // arrows and `+`/`-` keys.
        keyboard: true,
        // @option keyboardPanDelta: Number = 80
        // Amount of pixels to pan when pressing an arrow key.
        keyboardPanDelta: 80
      });
      var Keyboard = Handler.extend({
        keyCodes: {
          left: [37],
          right: [39],
          down: [40],
          up: [38],
          zoomIn: [187, 107, 61, 171],
          zoomOut: [189, 109, 54, 173]
        },
        initialize: function(map) {
          this._map = map;
          this._setPanDelta(map.options.keyboardPanDelta);
          this._setZoomDelta(map.options.zoomDelta);
        },
        addHooks: function() {
          var container = this._map._container;
          if (container.tabIndex <= 0) {
            container.tabIndex = "0";
          }
          on(container, {
            focus: this._onFocus,
            blur: this._onBlur,
            mousedown: this._onMouseDown
          }, this);
          this._map.on({
            focus: this._addHooks,
            blur: this._removeHooks
          }, this);
        },
        removeHooks: function() {
          this._removeHooks();
          off(this._map._container, {
            focus: this._onFocus,
            blur: this._onBlur,
            mousedown: this._onMouseDown
          }, this);
          this._map.off({
            focus: this._addHooks,
            blur: this._removeHooks
          }, this);
        },
        _onMouseDown: function() {
          if (this._focused) {
            return;
          }
          var body = document.body, docEl = document.documentElement, top = body.scrollTop || docEl.scrollTop, left = body.scrollLeft || docEl.scrollLeft;
          this._map._container.focus();
          window.scrollTo(left, top);
        },
        _onFocus: function() {
          this._focused = true;
          this._map.fire("focus");
        },
        _onBlur: function() {
          this._focused = false;
          this._map.fire("blur");
        },
        _setPanDelta: function(panDelta) {
          var keys = this._panKeys = {}, codes = this.keyCodes, i, len;
          for (i = 0, len = codes.left.length; i < len; i++) {
            keys[codes.left[i]] = [-1 * panDelta, 0];
          }
          for (i = 0, len = codes.right.length; i < len; i++) {
            keys[codes.right[i]] = [panDelta, 0];
          }
          for (i = 0, len = codes.down.length; i < len; i++) {
            keys[codes.down[i]] = [0, panDelta];
          }
          for (i = 0, len = codes.up.length; i < len; i++) {
            keys[codes.up[i]] = [0, -1 * panDelta];
          }
        },
        _setZoomDelta: function(zoomDelta) {
          var keys = this._zoomKeys = {}, codes = this.keyCodes, i, len;
          for (i = 0, len = codes.zoomIn.length; i < len; i++) {
            keys[codes.zoomIn[i]] = zoomDelta;
          }
          for (i = 0, len = codes.zoomOut.length; i < len; i++) {
            keys[codes.zoomOut[i]] = -zoomDelta;
          }
        },
        _addHooks: function() {
          on(document, "keydown", this._onKeyDown, this);
        },
        _removeHooks: function() {
          off(document, "keydown", this._onKeyDown, this);
        },
        _onKeyDown: function(e) {
          if (e.altKey || e.ctrlKey || e.metaKey) {
            return;
          }
          var key = e.keyCode, map = this._map, offset;
          if (key in this._panKeys) {
            if (!map._panAnim || !map._panAnim._inProgress) {
              offset = this._panKeys[key];
              if (e.shiftKey) {
                offset = toPoint(offset).multiplyBy(3);
              }
              if (map.options.maxBounds) {
                offset = map._limitOffset(toPoint(offset), map.options.maxBounds);
              }
              if (map.options.worldCopyJump) {
                var newLatLng = map.wrapLatLng(map.unproject(map.project(map.getCenter()).add(offset)));
                map.panTo(newLatLng);
              } else {
                map.panBy(offset);
              }
            }
          } else if (key in this._zoomKeys) {
            map.setZoom(map.getZoom() + (e.shiftKey ? 3 : 1) * this._zoomKeys[key]);
          } else if (key === 27 && map._popup && map._popup.options.closeOnEscapeKey) {
            map.closePopup();
          } else {
            return;
          }
          stop(e);
        }
      });
      Map2.addInitHook("addHandler", "keyboard", Keyboard);
      Map2.mergeOptions({
        // @section Mouse wheel options
        // @option scrollWheelZoom: Boolean|String = true
        // Whether the map can be zoomed by using the mouse wheel. If passed `'center'`,
        // it will zoom to the center of the view regardless of where the mouse was.
        scrollWheelZoom: true,
        // @option wheelDebounceTime: Number = 40
        // Limits the rate at which a wheel can fire (in milliseconds). By default
        // user can't zoom via wheel more often than once per 40 ms.
        wheelDebounceTime: 40,
        // @option wheelPxPerZoomLevel: Number = 60
        // How many scroll pixels (as reported by [L.DomEvent.getWheelDelta](#domevent-getwheeldelta))
        // mean a change of one full zoom level. Smaller values will make wheel-zooming
        // faster (and vice versa).
        wheelPxPerZoomLevel: 60
      });
      var ScrollWheelZoom = Handler.extend({
        addHooks: function() {
          on(this._map._container, "wheel", this._onWheelScroll, this);
          this._delta = 0;
        },
        removeHooks: function() {
          off(this._map._container, "wheel", this._onWheelScroll, this);
        },
        _onWheelScroll: function(e) {
          var delta = getWheelDelta(e);
          var debounce = this._map.options.wheelDebounceTime;
          this._delta += delta;
          this._lastMousePos = this._map.mouseEventToContainerPoint(e);
          if (!this._startTime) {
            this._startTime = +/* @__PURE__ */ new Date();
          }
          var left = Math.max(debounce - (+/* @__PURE__ */ new Date() - this._startTime), 0);
          clearTimeout(this._timer);
          this._timer = setTimeout(bind(this._performZoom, this), left);
          stop(e);
        },
        _performZoom: function() {
          var map = this._map, zoom2 = map.getZoom(), snap = this._map.options.zoomSnap || 0;
          map._stop();
          var d2 = this._delta / (this._map.options.wheelPxPerZoomLevel * 4), d3 = 4 * Math.log(2 / (1 + Math.exp(-Math.abs(d2)))) / Math.LN2, d4 = snap ? Math.ceil(d3 / snap) * snap : d3, delta = map._limitZoom(zoom2 + (this._delta > 0 ? d4 : -d4)) - zoom2;
          this._delta = 0;
          this._startTime = null;
          if (!delta) {
            return;
          }
          if (map.options.scrollWheelZoom === "center") {
            map.setZoom(zoom2 + delta);
          } else {
            map.setZoomAround(this._lastMousePos, zoom2 + delta);
          }
        }
      });
      Map2.addInitHook("addHandler", "scrollWheelZoom", ScrollWheelZoom);
      var tapHoldDelay = 600;
      Map2.mergeOptions({
        // @section Touch interaction options
        // @option tapHold: Boolean
        // Enables simulation of `contextmenu` event, default is `true` for mobile Safari.
        tapHold: Browser.touchNative && Browser.safari && Browser.mobile,
        // @option tapTolerance: Number = 15
        // The max number of pixels a user can shift his finger during touch
        // for it to be considered a valid tap.
        tapTolerance: 15
      });
      var TapHold = Handler.extend({
        addHooks: function() {
          on(this._map._container, "touchstart", this._onDown, this);
        },
        removeHooks: function() {
          off(this._map._container, "touchstart", this._onDown, this);
        },
        _onDown: function(e) {
          clearTimeout(this._holdTimeout);
          if (e.touches.length !== 1) {
            return;
          }
          var first = e.touches[0];
          this._startPos = this._newPos = new Point(first.clientX, first.clientY);
          this._holdTimeout = setTimeout(bind(function() {
            this._cancel();
            if (!this._isTapValid()) {
              return;
            }
            on(document, "touchend", preventDefault);
            on(document, "touchend touchcancel", this._cancelClickPrevent);
            this._simulateEvent("contextmenu", first);
          }, this), tapHoldDelay);
          on(document, "touchend touchcancel contextmenu", this._cancel, this);
          on(document, "touchmove", this._onMove, this);
        },
        _cancelClickPrevent: function cancelClickPrevent() {
          off(document, "touchend", preventDefault);
          off(document, "touchend touchcancel", cancelClickPrevent);
        },
        _cancel: function() {
          clearTimeout(this._holdTimeout);
          off(document, "touchend touchcancel contextmenu", this._cancel, this);
          off(document, "touchmove", this._onMove, this);
        },
        _onMove: function(e) {
          var first = e.touches[0];
          this._newPos = new Point(first.clientX, first.clientY);
        },
        _isTapValid: function() {
          return this._newPos.distanceTo(this._startPos) <= this._map.options.tapTolerance;
        },
        _simulateEvent: function(type, e) {
          var simulatedEvent = new MouseEvent(type, {
            bubbles: true,
            cancelable: true,
            view: window,
            // detail: 1,
            screenX: e.screenX,
            screenY: e.screenY,
            clientX: e.clientX,
            clientY: e.clientY
            // button: 2,
            // buttons: 2
          });
          simulatedEvent._simulated = true;
          e.target.dispatchEvent(simulatedEvent);
        }
      });
      Map2.addInitHook("addHandler", "tapHold", TapHold);
      Map2.mergeOptions({
        // @section Touch interaction options
        // @option touchZoom: Boolean|String = *
        // Whether the map can be zoomed by touch-dragging with two fingers. If
        // passed `'center'`, it will zoom to the center of the view regardless of
        // where the touch events (fingers) were. Enabled for touch-capable web
        // browsers.
        touchZoom: Browser.touch,
        // @option bounceAtZoomLimits: Boolean = true
        // Set it to false if you don't want the map to zoom beyond min/max zoom
        // and then bounce back when pinch-zooming.
        bounceAtZoomLimits: true
      });
      var TouchZoom = Handler.extend({
        addHooks: function() {
          addClass(this._map._container, "leaflet-touch-zoom");
          on(this._map._container, "touchstart", this._onTouchStart, this);
        },
        removeHooks: function() {
          removeClass(this._map._container, "leaflet-touch-zoom");
          off(this._map._container, "touchstart", this._onTouchStart, this);
        },
        _onTouchStart: function(e) {
          var map = this._map;
          if (!e.touches || e.touches.length !== 2 || map._animatingZoom || this._zooming) {
            return;
          }
          var p1 = map.mouseEventToContainerPoint(e.touches[0]), p2 = map.mouseEventToContainerPoint(e.touches[1]);
          this._centerPoint = map.getSize()._divideBy(2);
          this._startLatLng = map.containerPointToLatLng(this._centerPoint);
          if (map.options.touchZoom !== "center") {
            this._pinchStartLatLng = map.containerPointToLatLng(p1.add(p2)._divideBy(2));
          }
          this._startDist = p1.distanceTo(p2);
          this._startZoom = map.getZoom();
          this._moved = false;
          this._zooming = true;
          map._stop();
          on(document, "touchmove", this._onTouchMove, this);
          on(document, "touchend touchcancel", this._onTouchEnd, this);
          preventDefault(e);
        },
        _onTouchMove: function(e) {
          if (!e.touches || e.touches.length !== 2 || !this._zooming) {
            return;
          }
          var map = this._map, p1 = map.mouseEventToContainerPoint(e.touches[0]), p2 = map.mouseEventToContainerPoint(e.touches[1]), scale2 = p1.distanceTo(p2) / this._startDist;
          this._zoom = map.getScaleZoom(scale2, this._startZoom);
          if (!map.options.bounceAtZoomLimits && (this._zoom < map.getMinZoom() && scale2 < 1 || this._zoom > map.getMaxZoom() && scale2 > 1)) {
            this._zoom = map._limitZoom(this._zoom);
          }
          if (map.options.touchZoom === "center") {
            this._center = this._startLatLng;
            if (scale2 === 1) {
              return;
            }
          } else {
            var delta = p1._add(p2)._divideBy(2)._subtract(this._centerPoint);
            if (scale2 === 1 && delta.x === 0 && delta.y === 0) {
              return;
            }
            this._center = map.unproject(map.project(this._pinchStartLatLng, this._zoom).subtract(delta), this._zoom);
          }
          if (!this._moved) {
            map._moveStart(true, false);
            this._moved = true;
          }
          cancelAnimFrame(this._animRequest);
          var moveFn = bind(map._move, map, this._center, this._zoom, { pinch: true, round: false }, void 0);
          this._animRequest = requestAnimFrame(moveFn, this, true);
          preventDefault(e);
        },
        _onTouchEnd: function() {
          if (!this._moved || !this._zooming) {
            this._zooming = false;
            return;
          }
          this._zooming = false;
          cancelAnimFrame(this._animRequest);
          off(document, "touchmove", this._onTouchMove, this);
          off(document, "touchend touchcancel", this._onTouchEnd, this);
          if (this._map.options.zoomAnimation) {
            this._map._animateZoom(this._center, this._map._limitZoom(this._zoom), true, this._map.options.zoomSnap);
          } else {
            this._map._resetView(this._center, this._map._limitZoom(this._zoom));
          }
        }
      });
      Map2.addInitHook("addHandler", "touchZoom", TouchZoom);
      Map2.BoxZoom = BoxZoom;
      Map2.DoubleClickZoom = DoubleClickZoom;
      Map2.Drag = Drag;
      Map2.Keyboard = Keyboard;
      Map2.ScrollWheelZoom = ScrollWheelZoom;
      Map2.TapHold = TapHold;
      Map2.TouchZoom = TouchZoom;
      exports2.Bounds = Bounds;
      exports2.Browser = Browser;
      exports2.CRS = CRS;
      exports2.Canvas = Canvas;
      exports2.Circle = Circle;
      exports2.CircleMarker = CircleMarker;
      exports2.Class = Class;
      exports2.Control = Control;
      exports2.DivIcon = DivIcon;
      exports2.DivOverlay = DivOverlay;
      exports2.DomEvent = DomEvent;
      exports2.DomUtil = DomUtil;
      exports2.Draggable = Draggable;
      exports2.Evented = Evented;
      exports2.FeatureGroup = FeatureGroup;
      exports2.GeoJSON = GeoJSON;
      exports2.GridLayer = GridLayer;
      exports2.Handler = Handler;
      exports2.Icon = Icon;
      exports2.ImageOverlay = ImageOverlay;
      exports2.LatLng = LatLng;
      exports2.LatLngBounds = LatLngBounds;
      exports2.Layer = Layer;
      exports2.LayerGroup = LayerGroup;
      exports2.LineUtil = LineUtil;
      exports2.Map = Map2;
      exports2.Marker = Marker;
      exports2.Mixin = Mixin;
      exports2.Path = Path;
      exports2.Point = Point;
      exports2.PolyUtil = PolyUtil;
      exports2.Polygon = Polygon;
      exports2.Polyline = Polyline;
      exports2.Popup = Popup;
      exports2.PosAnimation = PosAnimation;
      exports2.Projection = index;
      exports2.Rectangle = Rectangle;
      exports2.Renderer = Renderer;
      exports2.SVG = SVG;
      exports2.SVGOverlay = SVGOverlay;
      exports2.TileLayer = TileLayer;
      exports2.Tooltip = Tooltip;
      exports2.Transformation = Transformation;
      exports2.Util = Util2;
      exports2.VideoOverlay = VideoOverlay;
      exports2.bind = bind;
      exports2.bounds = toBounds;
      exports2.canvas = canvas;
      exports2.circle = circle;
      exports2.circleMarker = circleMarker;
      exports2.control = control;
      exports2.divIcon = divIcon;
      exports2.extend = extend;
      exports2.featureGroup = featureGroup;
      exports2.geoJSON = geoJSON;
      exports2.geoJson = geoJson;
      exports2.gridLayer = gridLayer;
      exports2.icon = icon;
      exports2.imageOverlay = imageOverlay;
      exports2.latLng = toLatLng;
      exports2.latLngBounds = toLatLngBounds;
      exports2.layerGroup = layerGroup;
      exports2.map = createMap;
      exports2.marker = marker;
      exports2.point = toPoint;
      exports2.polygon = polygon;
      exports2.polyline = polyline;
      exports2.popup = popup;
      exports2.rectangle = rectangle;
      exports2.setOptions = setOptions;
      exports2.stamp = stamp;
      exports2.svg = svg;
      exports2.svgOverlay = svgOverlay;
      exports2.tileLayer = tileLayer;
      exports2.tooltip = tooltip;
      exports2.transformation = toTransformation;
      exports2.version = version;
      exports2.videoOverlay = videoOverlay;
      var oldL = window.L;
      exports2.noConflict = function() {
        window.L = oldL;
        return this;
      };
      window.L = exports2;
    });
  })(leafletSrc, leafletSrc.exports);
  return leafletSrc.exports;
}
var leafletSrcExports = requireLeafletSrc();
const L$1 = /* @__PURE__ */ getDefaultExportFromCjs(leafletSrcExports);
const leaflet = "";
L.TileLayer.ColorFilter = L.TileLayer.extend({ intialize: function(t, i) {
  L.TileLayer.prototype.initialize.call(this, t, i);
}, colorFilter: function() {
  var r2 = ["blur:px", "brightness:%", "bright:brightness:%", "bri:brightness:%", "contrast:%", "con:contrast:%", "grayscale:%", "gray:grayscale:%", "hue-rotate:deg", "hue:hue-rotate:deg", "hue-rotation:hue-rotate:deg", "invert:%", "inv:invert:%", "opacity:%", "op:opacity:%", "saturate:%", "saturation:saturate:%", "sat:saturate:%", "sepia:%", "sep:sepia:%"];
  return (this.options.filter ? this.options.filter : []).map(function(t) {
    var i = t.toLowerCase().split(":");
    if (2 === i.length) {
      var e = r2.find(function(t2) {
        return t2.split(":")[0] === i[0];
      });
      if (e)
        return e = e.split(":"), i[1] += /^\d+$/.test(i[1]) ? e[e.length - 1] : "", "".concat(e[e.length - 2], "(").concat(i[1], ")");
    }
    return "";
  }).join(" ");
}, _initContainer: function() {
  L.TileLayer.prototype._initContainer.call(this);
  this._container.style.filter = this.colorFilter();
}, updateFilter: function(t) {
  this.options.filter = t, this._container && (this._container.style.filter = this.colorFilter());
} }), L.tileLayer.colorFilter = function(t, i) {
  return new L.TileLayer.ColorFilter(t, i);
};
L.Control.ScaleNautic = L.Control.Scale.extend({
  options: {
    nautic: false
  },
  _addScales: function(options, className, container) {
    L.Control.Scale.prototype._addScales.call(this, options, className, container);
    L.setOptions(options);
    if (this.options.nautic) {
      this._nScale = L.DomUtil.create("div", className, container);
    }
  },
  _updateScales: function(maxMeters) {
    L.Control.Scale.prototype._updateScales.call(this, maxMeters);
    if (this.options.nautic && maxMeters) {
      this._updateNautic(maxMeters);
    }
  },
  _updateNautic: function(maxMeters) {
    var scale = this._nScale, maxNauticalMiles = maxMeters / 1852, nauticalMiles;
    if (maxMeters >= 1852) {
      nauticalMiles = L.Control.Scale.prototype._getRoundNum.call(this, maxNauticalMiles);
    } else {
      nauticalMiles = maxNauticalMiles > 0.1 ? Math.round(maxNauticalMiles * 10) / 10 : Math.round(maxNauticalMiles * 100) / 100;
    }
    scale.style.width = Math.round(this.options.maxWidth * (nauticalMiles / maxNauticalMiles)) - 10 + "px";
    scale.innerHTML = nauticalMiles + " nm";
  }
});
L.control.scalenautic = function(options) {
  return new L.Control.ScaleNautic(options);
};
var leafletRuler$1 = { exports: {} };
(function(module, exports) {
  (function(factory, window2) {
    {
      module.exports = factory(requireLeafletSrc());
    }
    if (typeof window2 !== "undefined" && window2.L) {
      window2.L.Ruler = factory(L);
    }
  })(function(L2) {
    L2.Control.Ruler = L2.Control.extend({
      options: {
        position: "topright",
        circleMarker: {
          color: "red",
          radius: 2
        },
        lineStyle: {
          color: "red",
          dashArray: "1,6"
        },
        lengthUnit: {
          display: "km",
          decimal: 2,
          factor: null,
          label: "Distance:"
        },
        angleUnit: {
          display: "&deg;",
          decimal: 2,
          factor: null,
          label: "Bearing:"
        }
      },
      onAdd: function(map) {
        this._map = map;
        this._container = L2.DomUtil.create("div", "leaflet-bar");
        this._container.classList.add("leaflet-ruler");
        L2.DomEvent.disableClickPropagation(this._container);
        L2.DomEvent.on(this._container, "click", this._toggleMeasure, this);
        this._choice = false;
        this._defaultCursor = this._map._container.style.cursor;
        this._allLayers = L2.layerGroup();
        return this._container;
      },
      onRemove: function() {
        L2.DomEvent.off(this._container, "click", this._toggleMeasure, this);
      },
      _toggleMeasure: function() {
        this._choice = !this._choice;
        this._clickedLatLong = null;
        this._clickedPoints = [];
        this._totalLength = 0;
        if (this._choice) {
          this._map.doubleClickZoom.disable();
          L2.DomEvent.on(this._map._container, "keydown", this._escape, this);
          L2.DomEvent.on(this._map._container, "dblclick", this._closePath, this);
          this._container.classList.add("leaflet-ruler-clicked");
          this._clickCount = 0;
          this._tempLine = L2.featureGroup().addTo(this._allLayers);
          this._tempPoint = L2.featureGroup().addTo(this._allLayers);
          this._pointLayer = L2.featureGroup().addTo(this._allLayers);
          this._polylineLayer = L2.featureGroup().addTo(this._allLayers);
          this._allLayers.addTo(this._map);
          this._map._container.style.cursor = "crosshair";
          this._map.on("click", this._clicked, this);
          this._map.on("mousemove", this._moving, this);
        } else {
          this._map.doubleClickZoom.enable();
          L2.DomEvent.off(this._map._container, "keydown", this._escape, this);
          L2.DomEvent.off(this._map._container, "dblclick", this._closePath, this);
          this._container.classList.remove("leaflet-ruler-clicked");
          this._map.removeLayer(this._allLayers);
          this._allLayers = L2.layerGroup();
          this._map._container.style.cursor = this._defaultCursor;
          this._map.off("click", this._clicked, this);
          this._map.off("mousemove", this._moving, this);
        }
      },
      _clicked: function(e) {
        this._clickedLatLong = e.latlng;
        this._clickedPoints.push(this._clickedLatLong);
        L2.circleMarker(this._clickedLatLong, this.options.circleMarker).addTo(this._pointLayer);
        if (this._clickCount > 0 && !e.latlng.equals(this._clickedPoints[this._clickedPoints.length - 2])) {
          if (this._movingLatLong) {
            L2.polyline([this._clickedPoints[this._clickCount - 1], this._movingLatLong], this.options.lineStyle).addTo(this._polylineLayer);
          }
          var text;
          this._totalLength += this._result.Distance;
          if (this._clickCount > 1) {
            text = "<b>" + this.options.angleUnit.label + "</b>&nbsp;" + this._result.Bearing.toFixed(this.options.angleUnit.decimal) + "&nbsp;" + this.options.angleUnit.display + "<br><b>" + this.options.lengthUnit.label + "</b>&nbsp;" + this._totalLength.toFixed(this.options.lengthUnit.decimal) + "&nbsp;" + this.options.lengthUnit.display;
          } else {
            text = "<b>" + this.options.angleUnit.label + "</b>&nbsp;" + this._result.Bearing.toFixed(this.options.angleUnit.decimal) + "&nbsp;" + this.options.angleUnit.display + "<br><b>" + this.options.lengthUnit.label + "</b>&nbsp;" + this._result.Distance.toFixed(this.options.lengthUnit.decimal) + "&nbsp;" + this.options.lengthUnit.display;
          }
          L2.circleMarker(this._clickedLatLong, this.options.circleMarker).bindTooltip(text, { permanent: true, className: "result-tooltip" }).addTo(this._pointLayer).openTooltip();
        }
        this._clickCount++;
      },
      _moving: function(e) {
        if (this._clickedLatLong) {
          L2.DomEvent.off(this._container, "click", this._toggleMeasure, this);
          this._movingLatLong = e.latlng;
          if (this._tempLine) {
            this._map.removeLayer(this._tempLine);
            this._map.removeLayer(this._tempPoint);
          }
          var text;
          this._addedLength = 0;
          this._tempLine = L2.featureGroup();
          this._tempPoint = L2.featureGroup();
          this._tempLine.addTo(this._map);
          this._tempPoint.addTo(this._map);
          this._calculateBearingAndDistance();
          this._addedLength = this._result.Distance + this._totalLength;
          L2.polyline([this._clickedLatLong, this._movingLatLong], this.options.lineStyle).addTo(this._tempLine);
          if (this._clickCount > 1) {
            text = "<b>" + this.options.angleUnit.label + "</b>&nbsp;" + this._result.Bearing.toFixed(this.options.angleUnit.decimal) + "&nbsp;" + this.options.angleUnit.display + "<br><b>" + this.options.lengthUnit.label + "</b>&nbsp;" + this._addedLength.toFixed(this.options.lengthUnit.decimal) + "&nbsp;" + this.options.lengthUnit.display + '<br><div class="plus-length">(+' + this._result.Distance.toFixed(this.options.lengthUnit.decimal) + ")</div>";
          } else {
            text = "<b>" + this.options.angleUnit.label + "</b>&nbsp;" + this._result.Bearing.toFixed(this.options.angleUnit.decimal) + "&nbsp;" + this.options.angleUnit.display + "<br><b>" + this.options.lengthUnit.label + "</b>&nbsp;" + this._result.Distance.toFixed(this.options.lengthUnit.decimal) + "&nbsp;" + this.options.lengthUnit.display;
          }
          L2.circleMarker(this._movingLatLong, this.options.circleMarker).bindTooltip(text, { sticky: true, offset: L2.point(0, -40), className: "moving-tooltip" }).addTo(this._tempPoint).openTooltip();
        }
      },
      _escape: function(e) {
        if (e.keyCode === 27) {
          if (this._clickCount > 0) {
            this._closePath();
          } else {
            this._choice = true;
            this._toggleMeasure();
          }
        }
      },
      _calculateBearingAndDistance: function() {
        var f1 = this._clickedLatLong.lat, l1 = this._clickedLatLong.lng, f2 = this._movingLatLong.lat, l2 = this._movingLatLong.lng;
        var toRadian = Math.PI / 180;
        var y = Math.sin((l2 - l1) * toRadian) * Math.cos(f2 * toRadian);
        var x = Math.cos(f1 * toRadian) * Math.sin(f2 * toRadian) - Math.sin(f1 * toRadian) * Math.cos(f2 * toRadian) * Math.cos((l2 - l1) * toRadian);
        var brng = Math.atan2(y, x) * ((this.options.angleUnit.factor ? this.options.angleUnit.factor / 2 : 180) / Math.PI);
        brng += brng < 0 ? this.options.angleUnit.factor ? this.options.angleUnit.factor : 360 : 0;
        var R = this.options.lengthUnit.factor ? 6371 * this.options.lengthUnit.factor : 6371;
        var deltaF = (f2 - f1) * toRadian;
        var deltaL = (l2 - l1) * toRadian;
        var a = Math.sin(deltaF / 2) * Math.sin(deltaF / 2) + Math.cos(f1 * toRadian) * Math.cos(f2 * toRadian) * Math.sin(deltaL / 2) * Math.sin(deltaL / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var distance = R * c;
        this._result = {
          Bearing: brng,
          Distance: distance
        };
      },
      _closePath: function() {
        this._map.removeLayer(this._tempLine);
        this._map.removeLayer(this._tempPoint);
        if (this._clickCount <= 1)
          this._map.removeLayer(this._pointLayer);
        this._choice = false;
        L2.DomEvent.on(this._container, "click", this._toggleMeasure, this);
        this._toggleMeasure();
      }
    });
    L2.control.ruler = function(options) {
      return new L2.Control.Ruler(options);
    };
  }, window);
})(leafletRuler$1);
const leafletRuler = "";
/*! Leaflet.Coordinates 02-03-2016 */
L.Control.Coordinates = L.Control.extend({ options: { position: "bottomright", decimals: 4, decimalSeperator: ".", labelTemplateLat: "Lat: {y}", labelTemplateLng: "Lng: {x}", labelFormatterLat: void 0, labelFormatterLng: void 0, enableUserInput: true, useDMS: false, useLatLngOrder: false, centerUserCoordinates: false, markerType: L.marker, markerProps: {} }, onAdd: function(a) {
  this._map = a;
  var b = "leaflet-control-coordinates", c = this._container = L.DomUtil.create("div", b), d = this.options;
  this._labelcontainer = L.DomUtil.create("div", "uiElement label", c), this._label = L.DomUtil.create("span", "labelFirst", this._labelcontainer), this._inputcontainer = L.DomUtil.create("div", "uiElement input uiHidden", c);
  var e, f;
  return d.useLatLngOrder ? (f = L.DomUtil.create("span", "", this._inputcontainer), this._inputY = this._createInput("inputY", this._inputcontainer), e = L.DomUtil.create("span", "", this._inputcontainer), this._inputX = this._createInput("inputX", this._inputcontainer)) : (e = L.DomUtil.create("span", "", this._inputcontainer), this._inputX = this._createInput("inputX", this._inputcontainer), f = L.DomUtil.create("span", "", this._inputcontainer), this._inputY = this._createInput("inputY", this._inputcontainer)), e.innerHTML = d.labelTemplateLng.replace("{x}", ""), f.innerHTML = d.labelTemplateLat.replace("{y}", ""), L.DomEvent.on(this._inputX, "keyup", this._handleKeypress, this), L.DomEvent.on(this._inputY, "keyup", this._handleKeypress, this), a.on("mousemove", this._update, this), a.on("dragstart", this.collapse, this), a.whenReady(this._update, this), this._showsCoordinates = true, d.enableUserInput && L.DomEvent.addListener(this._container, "click", this._switchUI, this), c;
}, _createInput: function(a, b) {
  var c = L.DomUtil.create("input", a, b);
  return c.type = "text", L.DomEvent.disableClickPropagation(c), c;
}, _clearMarker: function() {
  this._map.removeLayer(this._marker);
}, _handleKeypress: function(a) {
  switch (a.keyCode) {
    case 27:
      this.collapse();
      break;
    case 13:
      this._handleSubmit(), this.collapse();
      break;
    default:
      this._handleSubmit();
  }
}, _handleSubmit: function() {
  var a = L.NumberFormatter.createValidNumber(this._inputX.value, this.options.decimalSeperator), b = L.NumberFormatter.createValidNumber(this._inputY.value, this.options.decimalSeperator);
  if (void 0 !== a && void 0 !== b) {
    var c = this._marker;
    c || (c = this._marker = this._createNewMarker(), c.on("click", this._clearMarker, this));
    var d = new L.LatLng(b, a);
    c.setLatLng(d), c.addTo(this._map), this.options.centerUserCoordinates && this._map.setView(d, this._map.getZoom());
  }
}, expand: function() {
  this._showsCoordinates = false, this._map.off("mousemove", this._update, this), L.DomEvent.addListener(this._container, "mousemove", L.DomEvent.stop), L.DomEvent.removeListener(this._container, "click", this._switchUI, this), L.DomUtil.addClass(this._labelcontainer, "uiHidden"), L.DomUtil.removeClass(this._inputcontainer, "uiHidden");
}, _createCoordinateLabel: function(a) {
  var b, c, d = this.options;
  return d.customLabelFcn ? d.customLabelFcn(a, d) : (b = d.labelLng ? d.labelFormatterLng(a.lng) : L.Util.template(d.labelTemplateLng, { x: this._getNumber(a.lng, d) }), c = d.labelFormatterLat ? d.labelFormatterLat(a.lat) : L.Util.template(d.labelTemplateLat, { y: this._getNumber(a.lat, d) }), d.useLatLngOrder ? c + " " + b : b + " " + c);
}, _getNumber: function(a, b) {
  return b.useDMS ? L.NumberFormatter.toDMS(a) : L.NumberFormatter.round(a, b.decimals, b.decimalSeperator);
}, collapse: function() {
  if (!this._showsCoordinates) {
    this._map.on("mousemove", this._update, this), this._showsCoordinates = true;
    this.options;
    if (L.DomEvent.addListener(this._container, "click", this._switchUI, this), L.DomEvent.removeListener(this._container, "mousemove", L.DomEvent.stop), L.DomUtil.addClass(this._inputcontainer, "uiHidden"), L.DomUtil.removeClass(this._labelcontainer, "uiHidden"), this._marker) {
      var a = this._createNewMarker(), b = this._marker.getLatLng();
      a.setLatLng(b);
      var c = L.DomUtil.create("div", ""), d = L.DomUtil.create("div", "", c);
      d.innerHTML = this._ordinateLabel(b);
      var e = L.DomUtil.create("a", "", c);
      e.innerHTML = "Remove", e.href = "#";
      var f = L.DomEvent.stopPropagation;
      L.DomEvent.on(e, "click", f).on(e, "mousedown", f).on(e, "dblclick", f).on(e, "click", L.DomEvent.preventDefault).on(e, "click", function() {
        this._map.removeLayer(a);
      }, this), a.bindPopup(c), a.addTo(this._map), this._map.removeLayer(this._marker), this._marker = null;
    }
  }
}, _switchUI: function(a) {
  L.DomEvent.stop(a), L.DomEvent.stopPropagation(a), L.DomEvent.preventDefault(a), this._showsCoordinates ? this.expand() : this.collapse();
}, onRemove: function(a) {
  a.off("mousemove", this._update, this);
}, _update: function(a) {
  var b = a.latlng, c = this.options;
  b && (b = b.wrap(), this._currentPos = b, this._inputY.value = L.NumberFormatter.round(b.lat, c.decimals, c.decimalSeperator), this._inputX.value = L.NumberFormatter.round(b.lng, c.decimals, c.decimalSeperator), this._label.innerHTML = this._createCoordinateLabel(b));
}, _createNewMarker: function() {
  return this.options.markerType(null, this.options.markerProps);
} }), L.control.coordinates = function(a) {
  return new L.Control.Coordinates(a);
}, L.Map.mergeOptions({ coordinateControl: false }), L.Map.addInitHook(function() {
  this.options.coordinateControl && (this.coordinateControl = new L.Control.Coordinates(), this.addControl(this.coordinateControl));
}), L.NumberFormatter = { round: function(a, b, c) {
  var d = L.Util.formatNum(a, b) + "", e = d.split(".");
  if (e[1]) {
    for (var f = b - e[1].length; f > 0; f--)
      e[1] += "0";
    d = e.join(c || ".");
  }
  return d;
}, toDMS: function(a) {
  var b = Math.floor(Math.abs(a)), c = 60 * (Math.abs(a) - b), d = Math.floor(c), e = 60 * (c - d), f = Math.round(e);
  60 == f && (d++, f = "00"), 60 == d && (b++, d = "00"), 10 > f && (f = "0" + f), 10 > d && (d = "0" + d);
  var g = "";
  return 0 > a && (g = "-"), "" + g + b + "&deg; " + d + "' " + f + "''";
}, createValidNumber: function(a, b) {
  if (a && a.length > 0) {
    var c = a.split(b || ".");
    try {
      var d = Number(c.join("."));
      return isNaN(d) ? void 0 : d;
    } catch (e) {
      return void 0;
    }
  }
  return void 0;
} };
const Leaflet_Coordinates0_1_5 = "";
(function(module, exports) {
  (function(global, factory) {
    factory(requireLeafletSrc());
  })(commonjsGlobal, function(L$12) {
    L$12 = L$12 && L$12.hasOwnProperty("default") ? L$12["default"] : L$12;
    function pointDistance(ptA, ptB) {
      var x = ptB.x - ptA.x;
      var y = ptB.y - ptA.y;
      return Math.sqrt(x * x + y * y);
    }
    var computeSegmentHeading = function computeSegmentHeading2(a, b) {
      return (Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI + 90 + 360) % 360;
    };
    var asRatioToPathLength = function asRatioToPathLength2(_ref, totalPathLength) {
      var value = _ref.value, isInPixels = _ref.isInPixels;
      return isInPixels ? value / totalPathLength : value;
    };
    function parseRelativeOrAbsoluteValue(value) {
      if (typeof value === "string" && value.indexOf("%") !== -1) {
        return {
          value: parseFloat(value) / 100,
          isInPixels: false
        };
      }
      var parsedValue = value ? parseFloat(value) : 0;
      return {
        value: parsedValue,
        isInPixels: parsedValue > 0
      };
    }
    var pointsEqual = function pointsEqual2(a, b) {
      return a.x === b.x && a.y === b.y;
    };
    function pointsToSegments(pts) {
      return pts.reduce(function(segments, b, idx2, points) {
        if (idx2 > 0 && !pointsEqual(b, points[idx2 - 1])) {
          var a = points[idx2 - 1];
          var distA = segments.length > 0 ? segments[segments.length - 1].distB : 0;
          var distAB = pointDistance(a, b);
          segments.push({
            a,
            b,
            distA,
            distB: distA + distAB,
            heading: computeSegmentHeading(a, b)
          });
        }
        return segments;
      }, []);
    }
    function projectPatternOnPointPath(pts, pattern2) {
      var segments = pointsToSegments(pts);
      var nbSegments = segments.length;
      if (nbSegments === 0) {
        return [];
      }
      var totalPathLength = segments[nbSegments - 1].distB;
      var offset = asRatioToPathLength(pattern2.offset, totalPathLength);
      var endOffset = asRatioToPathLength(pattern2.endOffset, totalPathLength);
      var repeat = asRatioToPathLength(pattern2.repeat, totalPathLength);
      var repeatIntervalPixels = totalPathLength * repeat;
      var startOffsetPixels = offset > 0 ? totalPathLength * offset : 0;
      var endOffsetPixels = endOffset > 0 ? totalPathLength * endOffset : 0;
      var positionOffsets = [];
      var positionOffset = startOffsetPixels;
      do {
        positionOffsets.push(positionOffset);
        positionOffset += repeatIntervalPixels;
      } while (repeatIntervalPixels > 0 && positionOffset < totalPathLength - endOffsetPixels);
      var segmentIndex = 0;
      var segment = segments[0];
      return positionOffsets.map(function(positionOffset2) {
        while (positionOffset2 > segment.distB && segmentIndex < nbSegments - 1) {
          segmentIndex++;
          segment = segments[segmentIndex];
        }
        var segmentRatio = (positionOffset2 - segment.distA) / (segment.distB - segment.distA);
        return {
          pt: interpolateBetweenPoints(segment.a, segment.b, segmentRatio),
          heading: segment.heading
        };
      });
    }
    function interpolateBetweenPoints(ptA, ptB, ratio) {
      if (ptB.x !== ptA.x) {
        return {
          x: ptA.x + ratio * (ptB.x - ptA.x),
          y: ptA.y + ratio * (ptB.y - ptA.y)
        };
      }
      return {
        x: ptA.x,
        y: ptA.y + (ptB.y - ptA.y) * ratio
      };
    }
    (function() {
      var proto_initIcon = L.Marker.prototype._initIcon;
      var proto_setPos = L.Marker.prototype._setPos;
      var oldIE = L.DomUtil.TRANSFORM === "msTransform";
      L.Marker.addInitHook(function() {
        var iconOptions = this.options.icon && this.options.icon.options;
        var iconAnchor = iconOptions && this.options.icon.options.iconAnchor;
        if (iconAnchor) {
          iconAnchor = iconAnchor[0] + "px " + iconAnchor[1] + "px";
        }
        this.options.rotationOrigin = this.options.rotationOrigin || iconAnchor || "center bottom";
        this.options.rotationAngle = this.options.rotationAngle || 0;
        this.on("drag", function(e) {
          e.target._applyRotation();
        });
      });
      L.Marker.include({
        _initIcon: function() {
          proto_initIcon.call(this);
        },
        _setPos: function(pos) {
          proto_setPos.call(this, pos);
          this._applyRotation();
        },
        _applyRotation: function() {
          if (this.options.rotationAngle) {
            this._icon.style[L.DomUtil.TRANSFORM + "Origin"] = this.options.rotationOrigin;
            if (oldIE) {
              this._icon.style[L.DomUtil.TRANSFORM] = "rotate(" + this.options.rotationAngle + "deg)";
            } else {
              this._icon.style[L.DomUtil.TRANSFORM] += " rotateZ(" + this.options.rotationAngle + "deg)";
            }
          }
        },
        setRotationAngle: function(angle) {
          this.options.rotationAngle = angle;
          this.update();
          return this;
        },
        setRotationOrigin: function(origin) {
          this.options.rotationOrigin = origin;
          this.update();
          return this;
        }
      });
    })();
    L$12.Symbol = L$12.Symbol || {};
    L$12.Symbol.Dash = L$12.Class.extend({
      options: {
        pixelSize: 10,
        pathOptions: {}
      },
      initialize: function initialize(options) {
        L$12.Util.setOptions(this, options);
        this.options.pathOptions.clickable = false;
      },
      buildSymbol: function buildSymbol(dirPoint, latLngs, map, index, total) {
        var opts = this.options;
        var d2r = Math.PI / 180;
        if (opts.pixelSize <= 1) {
          return L$12.polyline([dirPoint.latLng, dirPoint.latLng], opts.pathOptions);
        }
        var midPoint = map.project(dirPoint.latLng);
        var angle = -(dirPoint.heading - 90) * d2r;
        var a = L$12.point(midPoint.x + opts.pixelSize * Math.cos(angle + Math.PI) / 2, midPoint.y + opts.pixelSize * Math.sin(angle) / 2);
        var b = midPoint.add(midPoint.subtract(a));
        return L$12.polyline([map.unproject(a), map.unproject(b)], opts.pathOptions);
      }
    });
    L$12.Symbol.dash = function(options) {
      return new L$12.Symbol.Dash(options);
    };
    L$12.Symbol.ArrowHead = L$12.Class.extend({
      options: {
        polygon: true,
        pixelSize: 10,
        headAngle: 60,
        pathOptions: {
          stroke: false,
          weight: 2
        }
      },
      initialize: function initialize(options) {
        L$12.Util.setOptions(this, options);
        this.options.pathOptions.clickable = false;
      },
      buildSymbol: function buildSymbol(dirPoint, latLngs, map, index, total) {
        return this.options.polygon ? L$12.polygon(this._buildArrowPath(dirPoint, map), this.options.pathOptions) : L$12.polyline(this._buildArrowPath(dirPoint, map), this.options.pathOptions);
      },
      _buildArrowPath: function _buildArrowPath(dirPoint, map) {
        var d2r = Math.PI / 180;
        var tipPoint = map.project(dirPoint.latLng);
        var direction = -(dirPoint.heading - 90) * d2r;
        var radianArrowAngle = this.options.headAngle / 2 * d2r;
        var headAngle1 = direction + radianArrowAngle;
        var headAngle2 = direction - radianArrowAngle;
        var arrowHead1 = L$12.point(tipPoint.x - this.options.pixelSize * Math.cos(headAngle1), tipPoint.y + this.options.pixelSize * Math.sin(headAngle1));
        var arrowHead2 = L$12.point(tipPoint.x - this.options.pixelSize * Math.cos(headAngle2), tipPoint.y + this.options.pixelSize * Math.sin(headAngle2));
        return [map.unproject(arrowHead1), dirPoint.latLng, map.unproject(arrowHead2)];
      }
    });
    L$12.Symbol.arrowHead = function(options) {
      return new L$12.Symbol.ArrowHead(options);
    };
    L$12.Symbol.Marker = L$12.Class.extend({
      options: {
        markerOptions: {},
        rotate: false
      },
      initialize: function initialize(options) {
        L$12.Util.setOptions(this, options);
        this.options.markerOptions.clickable = false;
        this.options.markerOptions.draggable = false;
      },
      buildSymbol: function buildSymbol(directionPoint, latLngs, map, index, total) {
        if (this.options.rotate) {
          this.options.markerOptions.rotationAngle = directionPoint.heading + (this.options.angleCorrection || 0);
        }
        return L$12.marker(directionPoint.latLng, this.options.markerOptions);
      }
    });
    L$12.Symbol.marker = function(options) {
      return new L$12.Symbol.Marker(options);
    };
    var isCoord = function isCoord2(c) {
      return c instanceof L$12.LatLng || Array.isArray(c) && c.length === 2 && typeof c[0] === "number";
    };
    var isCoordArray = function isCoordArray2(ll) {
      return Array.isArray(ll) && isCoord(ll[0]);
    };
    L$12.PolylineDecorator = L$12.FeatureGroup.extend({
      options: {
        patterns: []
      },
      initialize: function initialize(paths, options) {
        L$12.FeatureGroup.prototype.initialize.call(this);
        L$12.Util.setOptions(this, options);
        this._map = null;
        this._paths = this._initPaths(paths);
        this._bounds = this._initBounds();
        this._patterns = this._initPatterns(this.options.patterns);
      },
      /**
      * Deals with all the different cases. input can be one of these types:
      * array of LatLng, array of 2-number arrays, Polyline, Polygon,
      * array of one of the previous.
      */
      _initPaths: function _initPaths(input, isPolygon) {
        var _this = this;
        if (isCoordArray(input)) {
          var coords = isPolygon ? input.concat([input[0]]) : input;
          return [coords];
        }
        if (input instanceof L$12.Polyline) {
          return this._initPaths(input.getLatLngs(), input instanceof L$12.Polygon);
        }
        if (Array.isArray(input)) {
          return input.reduce(function(flatArray, p) {
            return flatArray.concat(_this._initPaths(p, isPolygon));
          }, []);
        }
        return [];
      },
      // parse pattern definitions and precompute some values
      _initPatterns: function _initPatterns(patternDefs) {
        return patternDefs.map(this._parsePatternDef);
      },
      /**
      * Changes the patterns used by this decorator
      * and redraws the new one.
      */
      setPatterns: function setPatterns(patterns) {
        this.options.patterns = patterns;
        this._patterns = this._initPatterns(this.options.patterns);
        this.redraw();
      },
      /**
      * Changes the patterns used by this decorator
      * and redraws the new one.
      */
      setPaths: function setPaths(paths) {
        this._paths = this._initPaths(paths);
        this._bounds = this._initBounds();
        this.redraw();
      },
      /**
      * Parse the pattern definition
      */
      _parsePatternDef: function _parsePatternDef(patternDef, latLngs) {
        return {
          symbolFactory: patternDef.symbol,
          // Parse offset and repeat values, managing the two cases:
          // absolute (in pixels) or relative (in percentage of the polyline length)
          offset: parseRelativeOrAbsoluteValue(patternDef.offset),
          endOffset: parseRelativeOrAbsoluteValue(patternDef.endOffset),
          repeat: parseRelativeOrAbsoluteValue(patternDef.repeat)
        };
      },
      onAdd: function onAdd(map) {
        this._map = map;
        this._draw();
        this._map.on("moveend", this.redraw, this);
      },
      onRemove: function onRemove(map) {
        this._map.off("moveend", this.redraw, this);
        this._map = null;
        L$12.FeatureGroup.prototype.onRemove.call(this, map);
      },
      /**
      * As real pattern bounds depends on map zoom and bounds,
      * we just compute the total bounds of all paths decorated by this instance.
      */
      _initBounds: function _initBounds() {
        var allPathCoords = this._paths.reduce(function(acc, path) {
          return acc.concat(path);
        }, []);
        return L$12.latLngBounds(allPathCoords);
      },
      getBounds: function getBounds() {
        return this._bounds;
      },
      /**
      * Returns an array of ILayers object
      */
      _buildSymbols: function _buildSymbols(latLngs, symbolFactory, directionPoints) {
        var _this2 = this;
        return directionPoints.map(function(directionPoint, i) {
          return symbolFactory.buildSymbol(directionPoint, latLngs, _this2._map, i, directionPoints.length);
        });
      },
      /**
      * Compute pairs of LatLng and heading angle,
      * that define positions and directions of the symbols on the path
      */
      _getDirectionPoints: function _getDirectionPoints(latLngs, pattern2) {
        var _this3 = this;
        if (latLngs.length < 2) {
          return [];
        }
        var pathAsPoints = latLngs.map(function(latLng) {
          return _this3._map.project(latLng);
        });
        return projectPatternOnPointPath(pathAsPoints, pattern2).map(function(point) {
          return {
            latLng: _this3._map.unproject(L$12.point(point.pt)),
            heading: point.heading
          };
        });
      },
      redraw: function redraw() {
        if (!this._map) {
          return;
        }
        this.clearLayers();
        this._draw();
      },
      /**
      * Returns all symbols for a given pattern as an array of FeatureGroup
      */
      _getPatternLayers: function _getPatternLayers(pattern2) {
        var _this4 = this;
        var mapBounds = this._map.getBounds().pad(0.1);
        return this._paths.map(function(path) {
          var directionPoints = _this4._getDirectionPoints(path, pattern2).filter(function(point) {
            return mapBounds.contains(point.latLng);
          });
          return L$12.featureGroup(_this4._buildSymbols(path, pattern2.symbolFactory, directionPoints));
        });
      },
      /**
      * Draw all patterns
      */
      _draw: function _draw() {
        var _this5 = this;
        this._patterns.map(function(pattern2) {
          return _this5._getPatternLayers(pattern2);
        }).forEach(function(layers) {
          _this5.addLayer(L$12.featureGroup(layers));
        });
      }
    });
    L$12.polylineDecorator = function(paths, options) {
      return new L$12.PolylineDecorator(paths, options);
    };
  });
})();
(function(window2, document2, undefined$1) {
  L.AwesomeMarkers = {};
  L.AwesomeMarkers.version = "2.0.1";
  L.AwesomeMarkers.Icon = L.Icon.extend({
    options: {
      iconSize: [35, 45],
      iconAnchor: [17, 42],
      popupAnchor: [1, -32],
      shadowAnchor: [10, 12],
      shadowSize: [36, 16],
      className: "awesome-marker",
      prefix: "glyphicon",
      spinClass: "fa-spin",
      extraClasses: "",
      icon: "home",
      markerColor: "blue",
      iconColor: "white"
    },
    initialize: function(options) {
      options = L.Util.setOptions(this, options);
    },
    createIcon: function() {
      var div = document2.createElement("div"), options = this.options;
      if (options.icon) {
        div.innerHTML = this._createInner();
      }
      if (options.bgPos) {
        div.style.backgroundPosition = -options.bgPos.x + "px " + -options.bgPos.y + "px";
      }
      this._setIconStyles(div, "icon-" + options.markerColor);
      return div;
    },
    _createInner: function() {
      var iconClass, iconSpinClass = "", iconColorClass = "", iconColorStyle = "", options = this.options;
      if (options.icon.slice(0, options.prefix.length + 1) === options.prefix + "-") {
        iconClass = options.icon;
      } else {
        iconClass = options.prefix + "-" + options.icon;
      }
      if (options.spin && typeof options.spinClass === "string") {
        iconSpinClass = options.spinClass;
      }
      if (options.iconColor) {
        if (options.iconColor === "white" || options.iconColor === "black") {
          iconColorClass = "icon-" + options.iconColor;
        } else {
          iconColorStyle = "style='color: " + options.iconColor + "' ";
        }
      }
      return "<i " + iconColorStyle + "class='" + options.extraClasses + " " + options.prefix + " " + iconClass + " " + iconSpinClass + " " + iconColorClass + "'></i>";
    },
    _setIconStyles: function(img, name) {
      var options = this.options, size = L.point(options[name === "shadow" ? "shadowSize" : "iconSize"]), anchor;
      if (name === "shadow") {
        anchor = L.point(options.shadowAnchor || options.iconAnchor);
      } else {
        anchor = L.point(options.iconAnchor);
      }
      if (!anchor && size) {
        anchor = size.divideBy(2, true);
      }
      img.className = "awesome-marker-" + name + " " + options.className;
      if (anchor) {
        img.style.marginLeft = -anchor.x + "px";
        img.style.marginTop = -anchor.y + "px";
      }
      if (size) {
        img.style.width = size.x + "px";
        img.style.height = size.y + "px";
      }
    },
    createShadow: function() {
      var div = document2.createElement("div");
      this._setIconStyles(div, "shadow");
      return div;
    }
  });
  L.AwesomeMarkers.icon = function(options) {
    return new L.AwesomeMarkers.Icon(options);
  };
})(commonjsGlobal, document);
const leaflet_awesomeMarkers = "";
/*! leaflet.geodesic 2.7.2 - (c) Henry Thasler - https://github.com/henrythasler/Leaflet.Geodesic#readme */
var extendStatics = function(d, b) {
  extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
    d2.__proto__ = b2;
  } || function(d2, b2) {
    for (var p in b2)
      if (Object.prototype.hasOwnProperty.call(b2, p))
        d2[p] = b2[p];
  };
  return extendStatics(d, b);
};
function __extends(d, b) {
  if (typeof b !== "function" && b !== null)
    throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
  extendStatics(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
var __assign = function() {
  __assign = Object.assign || function __assign2(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p))
          t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
function __spreadArray(to, from, pack) {
  if (pack || arguments.length === 2)
    for (var i = 0, l = from.length, ar; i < l; i++) {
      if (ar || !(i in from)) {
        if (!ar)
          ar = Array.prototype.slice.call(from, 0, i);
        ar[i] = from[i];
      }
    }
  return to.concat(ar || Array.prototype.slice.call(from));
}
typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};
var GeodesicCore = (
  /** @class */
  function() {
    function GeodesicCore2(options) {
      this.options = { wrap: true, steps: 3 };
      this.ellipsoid = {
        a: 6378137,
        b: 63567523142e-4,
        f: 1 / 298.257223563
      };
      this.options = __assign(__assign({}, this.options), options);
    }
    GeodesicCore2.prototype.toRadians = function(degree) {
      return degree * Math.PI / 180;
    };
    GeodesicCore2.prototype.toDegrees = function(radians) {
      return radians * 180 / Math.PI;
    };
    GeodesicCore2.prototype.mod = function(n, p) {
      var r2 = n % p;
      return r2 < 0 ? r2 + p : r2;
    };
    GeodesicCore2.prototype.wrap360 = function(degrees) {
      if (0 <= degrees && degrees < 360) {
        return degrees;
      } else {
        return this.mod(degrees, 360);
      }
    };
    GeodesicCore2.prototype.wrap = function(degrees, max) {
      if (max === void 0) {
        max = 360;
      }
      if (-max <= degrees && degrees <= max) {
        return degrees;
      } else {
        return this.mod(degrees + max, 2 * max) - max;
      }
    };
    GeodesicCore2.prototype.direct = function(start, bearing, distance, maxInterations) {
      if (maxInterations === void 0) {
        maxInterations = 100;
      }
      var φ1 = this.toRadians(start.lat);
      var λ1 = this.toRadians(start.lng);
      var α1 = this.toRadians(bearing);
      var s = distance;
      var ε = Number.EPSILON * 1e3;
      var _a = this.ellipsoid, a = _a.a, b = _a.b, f = _a.f;
      var sinα1 = Math.sin(α1);
      var cosα1 = Math.cos(α1);
      var tanU1 = (1 - f) * Math.tan(φ1), cosU1 = 1 / Math.sqrt(1 + tanU1 * tanU1), sinU1 = tanU1 * cosU1;
      var σ1 = Math.atan2(tanU1, cosα1);
      var sinα = cosU1 * sinα1;
      var cosSqα = 1 - sinα * sinα;
      var uSq = cosSqα * (a * a - b * b) / (b * b);
      var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
      var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
      var σ = s / (b * A), sinσ = null, cosσ = null, Δσ = null;
      var cos2σₘ = null;
      var σʹ = null, iterations = 0;
      do {
        cos2σₘ = Math.cos(2 * σ1 + σ);
        sinσ = Math.sin(σ);
        cosσ = Math.cos(σ);
        Δσ = B * sinσ * (cos2σₘ + B / 4 * (cosσ * (-1 + 2 * cos2σₘ * cos2σₘ) - B / 6 * cos2σₘ * (-3 + 4 * sinσ * sinσ) * (-3 + 4 * cos2σₘ * cos2σₘ)));
        σʹ = σ;
        σ = s / (b * A) + Δσ;
      } while (Math.abs(σ - σʹ) > ε && ++iterations < maxInterations);
      if (iterations >= maxInterations) {
        throw new EvalError("Direct vincenty formula failed to converge after ".concat(maxInterations, " iterations \n                (start=").concat(start.lat, "/").concat(start.lng, "; bearing=").concat(bearing, "; distance=").concat(distance, ")"));
      }
      var x = sinU1 * sinσ - cosU1 * cosσ * cosα1;
      var φ2 = Math.atan2(sinU1 * cosσ + cosU1 * sinσ * cosα1, (1 - f) * Math.sqrt(sinα * sinα + x * x));
      var λ = Math.atan2(sinσ * sinα1, cosU1 * cosσ - sinU1 * sinσ * cosα1);
      var C = f / 16 * cosSqα * (4 + f * (4 - 3 * cosSqα));
      var dL = λ - (1 - C) * f * sinα * (σ + C * sinσ * (cos2σₘ + C * cosσ * (-1 + 2 * cos2σₘ * cos2σₘ)));
      var λ2 = λ1 + dL;
      var α2 = Math.atan2(sinα, -x);
      return {
        lat: this.toDegrees(φ2),
        lng: this.toDegrees(λ2),
        bearing: this.wrap360(this.toDegrees(α2))
      };
    };
    GeodesicCore2.prototype.inverse = function(start, dest, maxInterations, mitigateConvergenceError) {
      if (maxInterations === void 0) {
        maxInterations = 100;
      }
      if (mitigateConvergenceError === void 0) {
        mitigateConvergenceError = true;
      }
      var p1 = start, p2 = dest;
      var φ1 = this.toRadians(p1.lat), λ1 = this.toRadians(p1.lng);
      var φ2 = this.toRadians(p2.lat), λ2 = this.toRadians(p2.lng);
      var π = Math.PI;
      var ε = Number.EPSILON;
      var _a = this.ellipsoid, a = _a.a, b = _a.b, f = _a.f;
      var dL = λ2 - λ1;
      var tanU1 = (1 - f) * Math.tan(φ1), cosU1 = 1 / Math.sqrt(1 + tanU1 * tanU1), sinU1 = tanU1 * cosU1;
      var tanU2 = (1 - f) * Math.tan(φ2), cosU2 = 1 / Math.sqrt(1 + tanU2 * tanU2), sinU2 = tanU2 * cosU2;
      var antipodal = Math.abs(dL) > π / 2 || Math.abs(φ2 - φ1) > π / 2;
      var λ = dL, sinλ = null, cosλ = null;
      var σ = antipodal ? π : 0, sinσ = 0, cosσ = antipodal ? -1 : 1, sinSqσ = null;
      var cos2σₘ = 1;
      var sinα = null, cosSqα = 1;
      var C = null;
      var λʹ = null, iterations = 0;
      do {
        sinλ = Math.sin(λ);
        cosλ = Math.cos(λ);
        sinSqσ = cosU2 * sinλ * (cosU2 * sinλ) + (cosU1 * sinU2 - sinU1 * cosU2 * cosλ) * (cosU1 * sinU2 - sinU1 * cosU2 * cosλ);
        if (Math.abs(sinSqσ) < ε) {
          break;
        }
        sinσ = Math.sqrt(sinSqσ);
        cosσ = sinU1 * sinU2 + cosU1 * cosU2 * cosλ;
        σ = Math.atan2(sinσ, cosσ);
        sinα = cosU1 * cosU2 * sinλ / sinσ;
        cosSqα = 1 - sinα * sinα;
        cos2σₘ = cosSqα !== 0 ? cosσ - 2 * sinU1 * sinU2 / cosSqα : 0;
        C = f / 16 * cosSqα * (4 + f * (4 - 3 * cosSqα));
        λʹ = λ;
        λ = dL + (1 - C) * f * sinα * (σ + C * sinσ * (cos2σₘ + C * cosσ * (-1 + 2 * cos2σₘ * cos2σₘ)));
        var iterationCheck = antipodal ? Math.abs(λ) - π : Math.abs(λ);
        if (iterationCheck > π) {
          throw new EvalError("λ > π");
        }
      } while (Math.abs(λ - λʹ) > 1e-12 && ++iterations < maxInterations);
      if (iterations >= maxInterations) {
        if (mitigateConvergenceError) {
          return this.inverse(start, new leafletSrcExports.LatLng(dest.lat, dest.lng - 0.01), maxInterations, mitigateConvergenceError);
        } else {
          throw new EvalError("Inverse vincenty formula failed to converge after ".concat(maxInterations, " iterations \n                    (start=").concat(start.lat, "/").concat(start.lng, "; dest=").concat(dest.lat, "/").concat(dest.lng, ")"));
        }
      }
      var uSq = cosSqα * (a * a - b * b) / (b * b);
      var A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
      var B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
      var Δσ = B * sinσ * (cos2σₘ + B / 4 * (cosσ * (-1 + 2 * cos2σₘ * cos2σₘ) - B / 6 * cos2σₘ * (-3 + 4 * sinσ * sinσ) * (-3 + 4 * cos2σₘ * cos2σₘ)));
      var s = b * A * (σ - Δσ);
      var α1 = Math.abs(sinSqσ) < ε ? 0 : Math.atan2(cosU2 * sinλ, cosU1 * sinU2 - sinU1 * cosU2 * cosλ);
      var α2 = Math.abs(sinSqσ) < ε ? π : Math.atan2(cosU1 * sinλ, -sinU1 * cosU2 + cosU1 * sinU2 * cosλ);
      return {
        distance: s,
        initialBearing: Math.abs(s) < ε ? NaN : this.wrap360(this.toDegrees(α1)),
        finalBearing: Math.abs(s) < ε ? NaN : this.wrap360(this.toDegrees(α2))
      };
    };
    GeodesicCore2.prototype.intersection = function(firstPos, firstBearing, secondPos, secondBearing) {
      var φ1 = this.toRadians(firstPos.lat);
      var λ1 = this.toRadians(firstPos.lng);
      var φ2 = this.toRadians(secondPos.lat);
      var λ2 = this.toRadians(secondPos.lng);
      var θ13 = this.toRadians(firstBearing);
      var θ23 = this.toRadians(secondBearing);
      var Δφ = φ2 - φ1, Δλ = λ2 - λ1;
      var π = Math.PI;
      var ε = Number.EPSILON;
      var δ12 = 2 * Math.asin(Math.sqrt(Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)));
      if (Math.abs(δ12) < ε) {
        return firstPos;
      }
      var cosθa = (Math.sin(φ2) - Math.sin(φ1) * Math.cos(δ12)) / (Math.sin(δ12) * Math.cos(φ1));
      var cosθb = (Math.sin(φ1) - Math.sin(φ2) * Math.cos(δ12)) / (Math.sin(δ12) * Math.cos(φ2));
      var θa = Math.acos(Math.min(Math.max(cosθa, -1), 1));
      var θb = Math.acos(Math.min(Math.max(cosθb, -1), 1));
      var θ12 = Math.sin(λ2 - λ1) > 0 ? θa : 2 * π - θa;
      var θ21 = Math.sin(λ2 - λ1) > 0 ? 2 * π - θb : θb;
      var α1 = θ13 - θ12;
      var α2 = θ21 - θ23;
      if (Math.sin(α1) === 0 && Math.sin(α2) === 0) {
        return null;
      }
      if (Math.sin(α1) * Math.sin(α2) < 0) {
        return null;
      }
      var cosα3 = -Math.cos(α1) * Math.cos(α2) + Math.sin(α1) * Math.sin(α2) * Math.cos(δ12);
      var δ13 = Math.atan2(Math.sin(δ12) * Math.sin(α1) * Math.sin(α2), Math.cos(α2) + Math.cos(α1) * cosα3);
      var φ3 = Math.asin(Math.min(Math.max(Math.sin(φ1) * Math.cos(δ13) + Math.cos(φ1) * Math.sin(δ13) * Math.cos(θ13), -1), 1));
      var Δλ13 = Math.atan2(Math.sin(θ13) * Math.sin(δ13) * Math.cos(φ1), Math.cos(δ13) - Math.sin(φ1) * Math.sin(φ3));
      var λ3 = λ1 + Δλ13;
      return new leafletSrcExports.LatLng(this.toDegrees(φ3), this.toDegrees(λ3));
    };
    GeodesicCore2.prototype.midpoint = function(start, dest) {
      var φ1 = this.toRadians(start.lat);
      var λ1 = this.toRadians(start.lng);
      var φ2 = this.toRadians(dest.lat);
      var Δλ = this.toRadians(dest.lng - start.lng);
      var A = { x: Math.cos(φ1), y: 0, z: Math.sin(φ1) };
      var B = { x: Math.cos(φ2) * Math.cos(Δλ), y: Math.cos(φ2) * Math.sin(Δλ), z: Math.sin(φ2) };
      var C = { x: A.x + B.x, y: A.y + B.y, z: A.z + B.z };
      var φm = Math.atan2(C.z, Math.sqrt(C.x * C.x + C.y * C.y));
      var λm = λ1 + Math.atan2(C.y, C.x);
      return new leafletSrcExports.LatLng(this.toDegrees(φm), this.toDegrees(λm));
    };
    return GeodesicCore2;
  }()
);
var GeodesicGeometry = (
  /** @class */
  function() {
    function GeodesicGeometry2(options) {
      var _a;
      this.geodesic = new GeodesicCore();
      this.steps = (_a = options === null || options === void 0 ? void 0 : options.steps) !== null && _a !== void 0 ? _a : 3;
    }
    GeodesicGeometry2.prototype.recursiveMidpoint = function(start, dest, iterations) {
      var geom = [start, dest];
      var midpoint = this.geodesic.midpoint(start, dest);
      if (iterations > 0) {
        geom.splice.apply(geom, __spreadArray([0, 1], this.recursiveMidpoint(start, midpoint, iterations - 1), false));
        geom.splice.apply(geom, __spreadArray([geom.length - 2, 2], this.recursiveMidpoint(midpoint, dest, iterations - 1), false));
      } else {
        geom.splice(1, 0, midpoint);
      }
      return geom;
    };
    GeodesicGeometry2.prototype.line = function(start, dest) {
      return this.recursiveMidpoint(start, dest, Math.min(8, this.steps));
    };
    GeodesicGeometry2.prototype.multiLineString = function(latlngs) {
      var multiLineString = [];
      for (var _i = 0, latlngs_1 = latlngs; _i < latlngs_1.length; _i++) {
        var linestring = latlngs_1[_i];
        var segment = [];
        for (var j = 1; j < linestring.length; j++) {
          segment.splice.apply(segment, __spreadArray([segment.length - 1, 1], this.line(linestring[j - 1], linestring[j]), false));
        }
        multiLineString.push(segment);
      }
      return multiLineString;
    };
    GeodesicGeometry2.prototype.lineString = function(latlngs) {
      return this.multiLineString([latlngs])[0];
    };
    GeodesicGeometry2.prototype.splitLine = function(startPosition, destPosition) {
      var antimeridianWest = {
        point: new leafletSrcExports.LatLng(89.9, -180.0000001),
        // lng is slightly off, to detect intersections with lines starting exactly on the antimeridian
        bearing: 180
      };
      var antimeridianEast = {
        point: new leafletSrcExports.LatLng(89.9, 180.0000001),
        // lng is slightly off, to detect intersections with lines starting exactly on the antimeridian
        bearing: 180
      };
      var start = new leafletSrcExports.LatLng(startPosition.lat, startPosition.lng, startPosition.alt);
      var dest = new leafletSrcExports.LatLng(destPosition.lat, destPosition.lng, destPosition.alt);
      start.lng = this.geodesic.wrap(start.lng, 360);
      dest.lng = this.geodesic.wrap(dest.lng, 360);
      if (dest.lng - start.lng > 180) {
        dest.lng = dest.lng - 360;
      } else if (dest.lng - start.lng < -180) {
        dest.lng = dest.lng + 360;
      }
      var result = [
        [
          new leafletSrcExports.LatLng(start.lat, this.geodesic.wrap(start.lng, 180), start.alt),
          new leafletSrcExports.LatLng(dest.lat, this.geodesic.wrap(dest.lng, 180), dest.alt)
        ]
      ];
      if (start.lng >= -180 && start.lng <= 180) {
        if (dest.lng < -180) {
          var bearing = this.geodesic.inverse(start, dest).initialBearing;
          var intersection = this.geodesic.intersection(start, bearing, antimeridianWest.point, antimeridianWest.bearing);
          if (intersection) {
            result = [
              [start, intersection],
              [
                new leafletSrcExports.LatLng(intersection.lat, intersection.lng + 360),
                new leafletSrcExports.LatLng(dest.lat, dest.lng + 360, dest.alt)
              ]
            ];
          }
        } else if (dest.lng > 180) {
          var bearing = this.geodesic.inverse(start, dest).initialBearing;
          var intersection = this.geodesic.intersection(start, bearing, antimeridianEast.point, antimeridianEast.bearing);
          if (intersection) {
            result = [
              [start, intersection],
              [
                new leafletSrcExports.LatLng(intersection.lat, intersection.lng - 360),
                new leafletSrcExports.LatLng(dest.lat, dest.lng - 360, dest.alt)
              ]
            ];
          }
        }
      } else if (dest.lng >= -180 && dest.lng <= 180) {
        if (start.lng < -180) {
          var bearing = this.geodesic.inverse(start, dest).initialBearing;
          var intersection = this.geodesic.intersection(start, bearing, antimeridianWest.point, antimeridianWest.bearing);
          if (intersection) {
            result = [
              [
                new leafletSrcExports.LatLng(start.lat, start.lng + 360, start.alt),
                new leafletSrcExports.LatLng(intersection.lat, intersection.lng + 360)
              ],
              [intersection, dest]
            ];
          }
        } else if (start.lng > 180) {
          var bearing = this.geodesic.inverse(start, dest).initialBearing;
          var intersection = this.geodesic.intersection(start, bearing, antimeridianWest.point, antimeridianWest.bearing);
          if (intersection) {
            result = [
              [
                new leafletSrcExports.LatLng(start.lat, start.lng - 360, start.alt),
                new leafletSrcExports.LatLng(intersection.lat, intersection.lng - 360)
              ],
              [intersection, dest]
            ];
          }
        }
      }
      return result;
    };
    GeodesicGeometry2.prototype.splitMultiLineString = function(multilinestring) {
      var result = [];
      for (var _i = 0, multilinestring_1 = multilinestring; _i < multilinestring_1.length; _i++) {
        var linestring = multilinestring_1[_i];
        if (linestring.length === 1) {
          result.push(linestring);
          continue;
        }
        var segment = [];
        for (var j = 1; j < linestring.length; j++) {
          var split = this.splitLine(linestring[j - 1], linestring[j]);
          segment.pop();
          segment = segment.concat(split[0]);
          if (split.length > 1) {
            result.push(segment);
            segment = split[1];
          }
        }
        result.push(segment);
      }
      return result;
    };
    GeodesicGeometry2.prototype.wrapMultiLineString = function(multilinestring) {
      var result = [];
      for (var _i = 0, multilinestring_2 = multilinestring; _i < multilinestring_2.length; _i++) {
        var linestring = multilinestring_2[_i];
        var resultLine = [];
        var previous = null;
        for (var _a = 0, linestring_1 = linestring; _a < linestring_1.length; _a++) {
          var point = linestring_1[_a];
          if (previous === null) {
            resultLine.push(new leafletSrcExports.LatLng(point.lat, point.lng));
            previous = new leafletSrcExports.LatLng(point.lat, point.lng);
          } else {
            var offset = Math.round((point.lng - previous.lng) / 360);
            resultLine.push(new leafletSrcExports.LatLng(point.lat, point.lng - offset * 360));
            previous = new leafletSrcExports.LatLng(point.lat, point.lng - offset * 360);
          }
        }
        result.push(resultLine);
      }
      return result;
    };
    GeodesicGeometry2.prototype.circle = function(center, radius) {
      var vertices = [];
      for (var i = 0; i < this.steps; i++) {
        var point = this.geodesic.direct(center, 360 / this.steps * i, radius);
        vertices.push(new leafletSrcExports.LatLng(point.lat, point.lng));
      }
      vertices.push(new leafletSrcExports.LatLng(vertices[0].lat, vertices[0].lng));
      return vertices;
    };
    GeodesicGeometry2.prototype.splitCircle = function(linestring) {
      var result = this.splitMultiLineString([linestring]);
      if (result.length === 3) {
        result[2] = __spreadArray(__spreadArray([], result[2], true), result[0], true);
        result.shift();
      }
      return result;
    };
    GeodesicGeometry2.prototype.distance = function(start, dest) {
      return this.geodesic.inverse(new leafletSrcExports.LatLng(start.lat, this.geodesic.wrap(start.lng, 180)), new leafletSrcExports.LatLng(dest.lat, this.geodesic.wrap(dest.lng, 180))).distance;
    };
    GeodesicGeometry2.prototype.multilineDistance = function(multilinestring) {
      var dist = [];
      for (var _i = 0, multilinestring_3 = multilinestring; _i < multilinestring_3.length; _i++) {
        var linestring = multilinestring_3[_i];
        var segmentDistance = 0;
        for (var j = 1; j < linestring.length; j++) {
          segmentDistance += this.distance(linestring[j - 1], linestring[j]);
        }
        dist.push(segmentDistance);
      }
      return dist;
    };
    GeodesicGeometry2.prototype.updateStatistics = function(points, vertices) {
      var stats = { distanceArray: [], totalDistance: 0, points: 0, vertices: 0 };
      stats.distanceArray = this.multilineDistance(points);
      stats.totalDistance = stats.distanceArray.reduce(function(x, y) {
        return x + y;
      }, 0);
      stats.points = 0;
      for (var _i = 0, points_1 = points; _i < points_1.length; _i++) {
        var item = points_1[_i];
        stats.points += item.reduce(function(x) {
          return x + 1;
        }, 0);
      }
      stats.vertices = 0;
      for (var _a = 0, vertices_1 = vertices; _a < vertices_1.length; _a++) {
        var item = vertices_1[_a];
        stats.vertices += item.reduce(function(x) {
          return x + 1;
        }, 0);
      }
      return stats;
    };
    return GeodesicGeometry2;
  }()
);
function instanceOfLatLngLiteral(object) {
  return typeof object === "object" && object !== null && "lat" in object && "lng" in object && typeof object.lat === "number" && typeof object.lng === "number";
}
function instanceOfLatLngTuple(object) {
  return object instanceof Array && typeof object[0] === "number" && typeof object[1] === "number";
}
function instanceOfLatLngExpression(object) {
  return object instanceof leafletSrcExports.LatLng || instanceOfLatLngTuple(object) || instanceOfLatLngLiteral(object);
}
function latlngExpressiontoLatLng(input) {
  if (input instanceof leafletSrcExports.LatLng) {
    return input;
  } else if (instanceOfLatLngTuple(input)) {
    return new leafletSrcExports.LatLng(input[0], input[1], input[2]);
  } else if (instanceOfLatLngLiteral(input)) {
    return new leafletSrcExports.LatLng(input.lat, input.lng, input.alt);
  }
  throw new Error("L.LatLngExpression expected. Unknown object found.");
}
function latlngExpressionArraytoLatLngArray(input) {
  var latlng = [];
  var iterateOver = instanceOfLatLngExpression(input[0]) ? [input] : input;
  var unknownObjectError = new Error("L.LatLngExpression[] | L.LatLngExpression[][] expected. Unknown object found.");
  if (!(iterateOver instanceof Array)) {
    throw unknownObjectError;
  }
  for (var _i = 0, _a = iterateOver; _i < _a.length; _i++) {
    var group = _a[_i];
    if (!(group instanceof Array)) {
      throw unknownObjectError;
    }
    var sub = [];
    for (var _b = 0, group_1 = group; _b < group_1.length; _b++) {
      var point = group_1[_b];
      if (!instanceOfLatLngExpression(point)) {
        throw unknownObjectError;
      }
      sub.push(latlngExpressiontoLatLng(point));
    }
    latlng.push(sub);
  }
  return latlng;
}
var GeodesicLine = (
  /** @class */
  function(_super) {
    __extends(GeodesicLine2, _super);
    function GeodesicLine2(latlngs, options) {
      var _this = _super.call(this, [], options) || this;
      _this.defaultOptions = { wrap: true, steps: 3 };
      _this.statistics = { distanceArray: [], totalDistance: 0, points: 0, vertices: 0 };
      _this.points = [];
      leafletSrcExports.Util.setOptions(_this, __assign(__assign({}, _this.defaultOptions), options));
      _this.geom = new GeodesicGeometry(_this.options);
      if (latlngs !== void 0) {
        _this.setLatLngs(latlngs);
      }
      return _this;
    }
    GeodesicLine2.prototype.updateGeometry = function() {
      var geodesic = [];
      geodesic = this.geom.multiLineString(this.points);
      this.statistics = this.geom.updateStatistics(this.points, geodesic);
      if (this.options.wrap) {
        var split = this.geom.splitMultiLineString(geodesic);
        _super.prototype.setLatLngs.call(this, split);
      } else {
        _super.prototype.setLatLngs.call(this, this.geom.wrapMultiLineString(geodesic));
      }
    };
    GeodesicLine2.prototype.setLatLngs = function(latlngs) {
      this.points = latlngExpressionArraytoLatLngArray(latlngs);
      this.updateGeometry();
      return this;
    };
    GeodesicLine2.prototype.addLatLng = function(latlng, latlngs) {
      var point = latlngExpressiontoLatLng(latlng);
      if (this.points.length === 0) {
        this.points.push([point]);
      } else if (latlngs === void 0) {
        this.points[this.points.length - 1].push(point);
      } else {
        latlngs.push(point);
      }
      this.updateGeometry();
      return this;
    };
    GeodesicLine2.prototype.fromGeoJson = function(input) {
      var latlngs = [];
      var features = [];
      if (input.type === "FeatureCollection") {
        features = input.features;
      } else if (input.type === "Feature") {
        features = [input];
      } else if (["MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"].includes(input.type)) {
        features = [
          {
            type: "Feature",
            geometry: input,
            properties: {}
          }
        ];
      } else {
        console.log('[Leaflet.Geodesic] fromGeoJson() - Type "'.concat(input.type, '" not supported.'));
      }
      features.forEach(function(feature) {
        switch (feature.geometry.type) {
          case "MultiPoint":
          case "LineString":
            latlngs = __spreadArray(__spreadArray([], latlngs, true), [leafletSrcExports.GeoJSON.coordsToLatLngs(feature.geometry.coordinates, 0)], false);
            break;
          case "MultiLineString":
          case "Polygon":
            latlngs = __spreadArray(__spreadArray([], latlngs, true), leafletSrcExports.GeoJSON.coordsToLatLngs(feature.geometry.coordinates, 1), true);
            break;
          case "MultiPolygon":
            feature.geometry.coordinates.forEach(function(item) {
              latlngs = __spreadArray(__spreadArray([], latlngs, true), leafletSrcExports.GeoJSON.coordsToLatLngs(item, 1), true);
            });
            break;
          default:
            console.log('[Leaflet.Geodesic] fromGeoJson() - Type "'.concat(feature.geometry.type, '" not supported.'));
        }
      });
      if (latlngs.length) {
        this.setLatLngs(latlngs);
      }
      return this;
    };
    GeodesicLine2.prototype.distance = function(start, dest) {
      return this.geom.distance(latlngExpressiontoLatLng(start), latlngExpressiontoLatLng(dest));
    };
    return GeodesicLine2;
  }(leafletSrcExports.Polyline)
);
var GeodesicCircleClass = (
  /** @class */
  function(_super) {
    __extends(GeodesicCircleClass2, _super);
    function GeodesicCircleClass2(center, options) {
      var _a;
      var _this = _super.call(this, [], options) || this;
      _this.defaultOptions = { wrap: true, steps: 24, fill: true, noClip: true };
      _this.statistics = { distanceArray: [], totalDistance: 0, points: 0, vertices: 0 };
      leafletSrcExports.Util.setOptions(_this, __assign(__assign({}, _this.defaultOptions), options));
      var extendedOptions = _this.options;
      _this.radius = (_a = extendedOptions.radius) !== null && _a !== void 0 ? _a : 1e3 * 1e3;
      _this.center = center === void 0 ? new leafletSrcExports.LatLng(0, 0) : latlngExpressiontoLatLng(center);
      _this.geom = new GeodesicGeometry(_this.options);
      _this.update();
      return _this;
    }
    GeodesicCircleClass2.prototype.update = function() {
      var circle = this.geom.circle(this.center, this.radius);
      this.statistics = this.geom.updateStatistics([[this.center]], [circle]);
      this.statistics.totalDistance = this.geom.multilineDistance([circle]).reduce(function(x, y) {
        return x + y;
      }, 0);
      if (this.options.wrap) {
        var split = this.geom.splitCircle(circle);
        _super.prototype.setLatLngs.call(this, split);
      } else {
        _super.prototype.setLatLngs.call(this, circle);
      }
    };
    GeodesicCircleClass2.prototype.distanceTo = function(latlng) {
      var dest = latlngExpressiontoLatLng(latlng);
      return this.geom.distance(this.center, dest);
    };
    GeodesicCircleClass2.prototype.setLatLng = function(center, radius) {
      this.center = latlngExpressiontoLatLng(center);
      this.radius = radius !== null && radius !== void 0 ? radius : this.radius;
      this.update();
    };
    GeodesicCircleClass2.prototype.setRadius = function(radius, center) {
      this.radius = radius;
      this.center = center ? latlngExpressiontoLatLng(center) : this.center;
      this.update();
    };
    return GeodesicCircleClass2;
  }(leafletSrcExports.Polyline)
);
if (typeof window.L !== "undefined") {
  window.L.Geodesic = GeodesicLine;
  window.L.geodesic = function() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    return new (GeodesicLine.bind.apply(GeodesicLine, __spreadArray([void 0], args, false)))();
  };
  window.L.GeodesicCircle = GeodesicCircleClass;
  window.L.geodesiccircle = function() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    return new (GeodesicCircleClass.bind.apply(GeodesicCircleClass, __spreadArray([void 0], args, false)))();
  };
}
globalThis.L = L$1;
function ensureLayerControlClickable(ctrl) {
  const c = ctrl && ctrl._container;
  if (!c)
    return;
  c.style.zIndex = "10050";
  c.style.pointerEvents = "auto";
  if (!document.getElementById("leaflet-layercontrol-pointer-patch")) {
    const style2 = document.createElement("style");
    style2.id = "leaflet-layercontrol-pointer-patch";
    style2.textContent = `
      .leaflet-top.leaflet-right { pointer-events: none; }
      .leaflet-top.leaflet-right .leaflet-control { pointer-events: auto; }
      .leaflet-control-layers { z-index: 10050 !important; }
    `;
    document.head.appendChild(style2);
  }
  c.addEventListener("click", (ev) => {
    const label = ev.target.closest("label");
    if (!label)
      return;
    const input = label.querySelector("input.leaflet-control-layers-selector");
    if (!input)
      return;
    if (!input.checked) {
      input.checked = true;
      if (typeof ctrl._onInputClick === "function") {
        ctrl._onInputClick();
      }
    }
  });
}
window.POLAR = window.POLAR || {
  enabled: false,
  crs: null,
  wmsLayer: null
};
function hasProj4Leaflet$1() {
  return typeof window !== "undefined" && window.L && L$1.Proj && typeof window.proj4 === "function";
}
function buildPolarCRS() {
  if (!hasProj4Leaflet$1())
    return null;
  return new L$1.Proj.CRS(
    "EPSG:3413",
    "+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
    {
      resolutions: [8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1],
      origin: [-4194304, 4194304],
      bounds: L$1.bounds([-4194304, -4194304], [4194304, 4194304])
    }
  );
}
function createArcticWMS() {
  if (!hasProj4Leaflet$1())
    return null;
  if (!POLAR.crs)
    POLAR.crs = buildPolarCRS();
  return L$1.tileLayer.wms("https://gibs.earthdata.nasa.gov/wms/epsg3413/best/wms.cgi", {
    layers: "BlueMarble_ShadedRelief_Bathymetry",
    format: "image/png",
    transparent: false,
    version: "1.1.1",
    crs: POLAR.crs,
    attribution: "&copy; NASA GIBS"
  });
}
let mercatorDragHandler = null;
let mercatorDragHandlerMapId = null;
function applyBoundsForCurrentMode(map) {
  if (mercatorDragHandler && mercatorDragHandlerMapId && map && map._leaflet_id === mercatorDragHandlerMapId) {
    map.off("drag", mercatorDragHandler);
    mercatorDragHandler = null;
    mercatorDragHandlerMapId = null;
  }
  if (!POLAR.enabled) {
    const bounds = [
      [-89.98155760646617, -270],
      [89.99346179538875, 270]
    ];
    map.setMaxBounds(bounds);
    mercatorDragHandler = function() {
      map.panInsideBounds(bounds, { animate: false });
    };
    map.on("drag", mercatorDragHandler);
    mercatorDragHandlerMapId = map._leaflet_id;
  } else {
    map.setMaxBounds(null);
  }
}
function computeComfortView(isArctic, prevCenter, prevZoom) {
  const prevLat = prevCenter && Number.isFinite(prevCenter.lat) ? prevCenter.lat : 0;
  const prevLng = prevCenter && Number.isFinite(prevCenter.lng) ? prevCenter.lng : 0;
  const normLng = (prevLng + 540) % 360 - 180;
  if (isArctic) {
    const THRESHOLD_NORTH = 60;
    const alreadyInArctic = prevLat >= THRESHOLD_NORTH;
    const targetLat = alreadyInArctic ? prevLat : 85;
    const targetLng = normLng;
    const targetZoom = alreadyInArctic ? prevZoom ?? 3 : 3;
    return { center: L$1.latLng(targetLat, targetLng), zoom: targetZoom };
  }
  const clampedLat = Math.max(-85, Math.min(85, prevLat));
  return { center: L$1.latLng(clampedLat, normLng), zoom: prevZoom ?? 3 };
}
function initButtonToCenterViewMap(lat, lon, map) {
  let recenterButton = document.querySelector("#lMap #recenterButton");
  if (recenterButton) {
    updateCoordinatesToCenterViewMap(lat, lon);
  } else {
    let buttonHTML = `
        <div id="lMapControls" class="leaflet-control-custom leaflet-control leaflet-bar">
            <a id="recenterButton" title="Centrer" href="#">🎯</a>
        </div>`;
    let mapContainer = document.querySelector("#lMap .leaflet-top.leaflet-left");
    mapContainer.insertAdjacentHTML("afterbegin", buttonHTML);
    recenterButton = document.querySelector("#lMap #recenterButton");
    recenterButton.setAttribute("data-lat", lat);
    recenterButton.setAttribute("data-lon", lon);
    recenterButton.addEventListener("click", function(e) {
      e.preventDefault();
      let defaultZoom = 10;
      if (map.getZoom() >= defaultZoom)
        defaultZoom = map.getZoom();
      let lat2 = parseFloat(recenterButton.getAttribute("data-lat"));
      let lon2 = parseFloat(recenterButton.getAttribute("data-lon"));
      map.setView([lat2, lon2], defaultZoom);
    });
  }
}
function updateCoordinatesToCenterViewMap(lat, lon) {
  let recenterButton = document.querySelector("#lMap #recenterButton");
  if (recenterButton) {
    recenterButton.setAttribute("data-lat", lat);
    recenterButton.setAttribute("data-lon", lon);
  }
}
function enableCoordinateCopyingWithShortcut() {
  const coordinatesDisplay = document.querySelector(".leaflet-control-coordinates");
  if (coordinatesDisplay) {
    document.addEventListener("keydown", function(event) {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const isKeyC = event.key === "b" || event.key === "B";
      if (isCtrlOrCmd && isKeyC) {
        event.preventDefault();
        let coordinatesText = coordinatesDisplay.innerText.trim();
        coordinatesText = coordinatesText.replace(/\s+/g, "").replace(/([NS])(?=\d)/, "$1 ");
        coordinatesText && navigator.clipboard.writeText(coordinatesText).catch(console.error);
      }
    });
  }
}
const greenRRIcon = L$1.icon({
  iconUrl: "../img/greenIcon.png",
  shadowUrl: "../img/RRIconShadowNok.png",
  iconSize: [20, 35],
  // size of the icon
  shadowSize: [53, 51],
  // size of the shadow
  iconAnchor: [10, 35],
  // point of the icon which will correspond to marker's location
  shadowAnchor: [27, 45],
  // the same for the shadow
  popupAnchor: [0, -42]
  // point from which the popup should open relative to the iconAnchor
});
const redRLIcon = L$1.icon({
  iconUrl: "../img/redIcon.png",
  shadowUrl: "../img/RLIconShadowNok.png",
  iconSize: [20, 35],
  shadowSize: [53, 51],
  iconAnchor: [10, 35],
  shadowAnchor: [27, 45],
  popupAnchor: [0, -42]
});
const greenRRIconP = L$1.icon({
  iconUrl: "../img/greenIcon.png",
  shadowUrl: "../img/RRIconShadowOK.png",
  iconSize: [20, 35],
  shadowSize: [53, 51],
  iconAnchor: [10, 35],
  shadowAnchor: [27, 45],
  popupAnchor: [0, -42]
});
const redRLIconP = L$1.icon({
  iconUrl: "../img/redIcon.png",
  shadowUrl: "../img/RLIconShadowOK.png",
  iconSize: [20, 35],
  shadowSize: [53, 51],
  iconAnchor: [10, 35],
  shadowAnchor: [27, 45],
  popupAnchor: [0, -42]
});
const yellowRRIcon = L$1.icon({
  iconUrl: "../img/yellowIcon.png",
  shadowUrl: "../img/RRIconShadowNok.png",
  iconSize: [20, 35],
  shadowSize: [53, 51],
  iconAnchor: [10, 35],
  shadowAnchor: [27, 45],
  popupAnchor: [0, -42]
});
const yellowRLIcon = L$1.icon({
  iconUrl: "../img/yellowIcon.png",
  shadowUrl: "../img/RLIconShadowNok.png",
  iconSize: [20, 35],
  shadowSize: [53, 51],
  iconAnchor: [10, 35],
  shadowAnchor: [27, 45],
  popupAnchor: [0, -42]
});
const yellowRRIconP = L$1.icon({
  iconUrl: "../img/yellowIcon.png",
  shadowUrl: "../img/RRIconShadowOK.png",
  iconSize: [20, 35],
  shadowSize: [53, 51],
  iconAnchor: [10, 35],
  shadowAnchor: [27, 45],
  popupAnchor: [0, -42]
});
const yellowRLIconP = L$1.icon({
  iconUrl: "../img/yellowIcon.png",
  shadowUrl: "../img/RLIconShadowOK.png",
  iconSize: [20, 35],
  shadowSize: [53, 51],
  iconAnchor: [10, 35],
  shadowAnchor: [27, 45],
  popupAnchor: [0, -42]
});
function buildMarker(pos, layer, icond, title, zi, op, heading) {
  let ret = [];
  for (let i = 0; i < pos.length; i++) {
    if (!heading)
      heading = 0;
    if (heading == 180)
      heading = 179.9;
    const marker1 = L$1.marker(pos[i], { icon: icond, rotationAngle: heading });
    if (op)
      marker1.opacity = op;
    if (zi)
      marker1.zIndexOffset = zi;
    if (title) {
      marker1.bindPopup(title);
      marker1.on("mouseover", function(e) {
        e.target.bindPopup(title).openPopup();
      });
      marker1.on("mouseout", function(e) {
        e.target.closePopup();
      });
    }
    marker1.addTo(layer);
    ret.push(marker1);
  }
  return ret;
}
function buildTextIcon(icon, iconColor, markerColor, text) {
  return L$1.AwesomeMarkers.icon({
    icon,
    markerColor,
    iconColor,
    prefix: "fa",
    html: text
  });
}
function buildBoatIcon(fillColor, borderColor, opacity) {
  const MARKER = encodeURIComponent(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
    <svg width="100%" height="100%" viewBox="0 0 14 14" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:1.41421;">
    <path d="M4.784,13.635c0,0 -0.106,-2.924 0.006,-4.379c0.115,-1.502 0.318,-3.151 0.686,-4.632c0.163,-0.654 0.45,-1.623 0.755,-2.44c0.202,-0.54 0.407,-1.021 0.554,-1.352c0.038,-0.085 0.122,-0.139 0.215,-0.139c0.092,0 0.176,0.054 0.214,0.139c0.151,0.342 0.361,0.835 0.555,1.352c0.305,0.817 0.592,1.786 0.755,2.44c0.368,1.481 0.571,3.13 0.686,4.632c0.112,1.455 0.006,4.379 0.006,4.379l-4.432,0Z" style="fill:` + borderColor + `;"/><path d="M5.481,12.731c0,0 -0.073,-3.048 0.003,-4.22c0.06,-0.909 0.886,-3.522 1.293,-4.764c0.03,-0.098 0.121,-0.165 0.223,-0.165c0.103,0 0.193,0.067 0.224,0.164c0.406,1.243 1.232,3.856 1.292,4.765c0.076,1.172 0.003,4.22 0.003,4.22l-3.038,0Z" style="fill:` + fillColor + `;fill-opacity:` + opacity + `;"/> </svg>`);
  const MARKER_ICON_URL = `data:image/svg+xml;utf8,${MARKER}`;
  return L$1.icon({
    iconUrl: MARKER_ICON_URL,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -2]
  });
}
function buildCircle(pos, layer, trackcolor, size, opacity, title) {
  let ret = [];
  for (let i = 0; i < pos.length; i++) {
    const circleMark = L$1.circleMarker(
      pos[i],
      {
        radius: size,
        color: trackcolor,
        fillColor: trackcolor,
        fillOpacity: opacity
      }
    );
    if (title && title != "") {
      circleMark.bindPopup(title);
      circleMark.on("mouseover", function(e) {
        e.target.bindPopup(title).openPopup();
      });
      circleMark.on("mouseout", function(e) {
        e.target.closePopup();
      });
    }
    circleMark.addTo(layer);
    ret.push(circleMark);
  }
  return ret;
}
function buildCircleEndRace(pos, layer, trackcolor, size) {
  let ret = [];
  for (let i = 0; i < pos.length; i++) {
    const circleMark = L$1.circle(pos[i], {
      color: trackcolor,
      weight: 2,
      fill: false,
      radius: size
    });
    circleMark.addTo(layer);
    ret.push(circleMark);
  }
  return ret;
}
function buildTrace(tpath, layer, pointsContainer, color, weight, opacity, dashArray, dashOffset, mode = true) {
  let nbTrackLine = 0;
  let trackLine = [];
  for (let i = 0; i < tpath.length; i++) {
    let path = [];
    path[0] = [];
    path[1] = [];
    path[2] = [];
    for (var j = 0; j < tpath[i].length; j++) {
      const pos = buildPt2(tpath[i][j].lat, tpath[i][j].lng);
      path[0].push(pos[0]);
      path[1].push(pos[1]);
      path[2].push(pos[2]);
      pointsContainer.push(pos[1]);
    }
    for (j = 0; j < path.length; j++) {
      var trackLineP;
      if (mode) {
        trackLineP = L$1.geodesic(
          path[j],
          {
            color,
            opacity,
            weight,
            wrap: false
          }
        );
      } else {
        trackLineP = L$1.polyline(
          path[j],
          {
            color,
            opacity,
            weight,
            wrap: false
          }
        );
      }
      if (dashArray)
        trackLineP.options.dashArray = dashArray;
      if (dashOffset)
        trackLineP.options.dashOffset = dashOffset;
      trackLineP.on("mouseover", function() {
        trackLineP.setStyle({
          weight: opacity * 2
        });
      });
      trackLineP.on("mouseout", function() {
        trackLineP.setStyle({
          weight: opacity
        });
      });
      trackLine[nbTrackLine] = trackLineP;
      trackLine[nbTrackLine].addTo(layer);
      nbTrackLine++;
    }
  }
  return trackLine;
}
function buildPt(lat, lon) {
  if (!lat)
    lat = 0;
  if (!lon)
    lon = 0;
  return L$1.latLng(lat, lon);
}
function buildPt2(lat, lon) {
  if (!lat)
    lat = 0;
  if (!lon)
    lon = 0;
  let ret = [];
  ret[0] = L$1.latLng(lat, lon - 360, true);
  ret[1] = L$1.latLng(lat, lon);
  ret[2] = L$1.latLng(lat, lon + 360, true);
  return ret;
}
function buildPath(pathEntry, initLat, initLng, finishLat, finshLng) {
  let cpath = [];
  let cpathNum = 0;
  cpath[cpathNum] = [];
  let pos;
  if (!pathEntry)
    return cpath;
  let path = [];
  if (initLat && initLng) {
    path.push({ lat: initLat, lon: initLng });
  }
  for (const pts of pathEntry) {
    path.push(pts);
  }
  if (finishLat && finshLng) {
    path.push({ lat: finishLat, lon: finshLng });
  }
  let paths = convertLng0To360(path);
  pos = buildPt(paths[0].lat, paths[0].lon ? paths[0].lon : paths[0].lng);
  cpath[cpathNum].push(pos);
  if (paths.length > 1)
    for (let i = 1; i < paths.length; i++) {
      const lon = paths[i].lon ? paths[i].lon : paths[i].lng;
      const lat = paths[i].lat;
      pos = buildPt(lat, lon);
      cpath[cpathNum].push(pos);
    }
  return cpath;
}
const convertLng0To360 = (coordinates) => {
  const coordinatesWithOffset = [];
  let offset = 0;
  for (const point of coordinates) {
    const previousPoint = coordinatesWithOffset[coordinatesWithOffset.length - 1];
    const lon = point.lon ? point.lon : point.lng;
    const lonp = previousPoint ? previousPoint.lon ? previousPoint.lon : previousPoint.lng : null;
    if (previousPoint && lon > 90 && lonp < -90) {
      offset = -360;
    } else if (previousPoint && lonp > 90 && lon < -90) {
      offset = 360;
    }
    if (point.lon)
      point.lon += offset;
    else
      point.lng += offset;
    coordinatesWithOffset.push(point);
  }
  return coordinatesWithOffset;
};
function buildPath_bspline(pathEntry, initLat, initLng, finishLat, finshLng) {
  let cpath = [];
  let cpathNum = 0;
  cpath[cpathNum] = [];
  if (!pathEntry)
    return cpath;
  let path = [];
  if (initLat && initLng) {
    path.push({ lat: initLat, lon: initLng });
  }
  for (const pts of pathEntry) {
    path.push(pts);
  }
  if (finishLat && finshLng) {
    path.push({ lat: finishLat, lon: finshLng });
  }
  const paths = convertLng0To360(path);
  cpath[cpathNum].push(buildPt(paths[0].lat, paths[0].lon ? paths[0].lon : paths[0].lng));
  if (path.length > 1) {
    for (let i = 2; i < paths.length - 1; i++) {
      for (let t = 0; t < 1; t += 0.1) {
        const ax = (-paths[i - 2].lat + 3 * paths[i - 1].lat - 3 * paths[i].lat + paths[i + 1].lat) / 6;
        const ay = (-paths[i - 2].lon + 3 * paths[i - 1].lon - 3 * paths[i].lon + paths[i + 1].lon) / 6;
        const bx = (paths[i - 2].lat - 2 * paths[i - 1].lat + paths[i].lat) / 2;
        const by = (paths[i - 2].lon - 2 * paths[i - 1].lon + paths[i].lon) / 2;
        const cx = (-paths[i - 2].lat + paths[i].lat) / 2;
        const cy = (-paths[i - 2].lon + paths[i].lon) / 2;
        const dx = (paths[i - 2].lat + 4 * paths[i - 1].lat + paths[i].lat) / 6;
        const dy = (paths[i - 2].lon + 4 * paths[i - 1].lon + paths[i].lon) / 6;
        const lat = ax * Math.pow(t + 0.1, 3) + bx * Math.pow(t + 0.1, 2) + cx * (t + 0.1) + dx;
        const lon = ay * Math.pow(t + 0.1, 3) + by * Math.pow(t + 0.1, 2) + cy * (t + 0.1) + dy;
        const pos = buildPt(lat, lon);
        cpath[cpathNum].push(pos);
      }
    }
  }
  return cpath;
}
function createProjectionPoint(ts, lat, lon) {
  return {
    timeStamp: ts,
    lat,
    lon
  };
}
function darkenColor(hexColor, amount) {
  const color = hexColor.replace("#", "");
  const r2 = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const darkenedR = Math.max(0, r2 - amount);
  const darkenedG = Math.max(0, g - amount);
  const darkenedB = Math.max(0, b - amount);
  const darkenedHexColor = `#${componentToHex(darkenedR)}${componentToHex(darkenedG)}${componentToHex(darkenedB)}`;
  return darkenedHexColor;
}
function componentToHex(component) {
  const hex = component.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}
function buildMarkerTitle(point) {
  const userPrefs = getUserPrefs();
  const localTimes = userPrefs.global.localTime;
  let position = formatPosition(point.lat, point.lon);
  const currentDate = /* @__PURE__ */ new Date();
  const currentTs = currentDate.getTime();
  let newDate = currentDate;
  if (point.timestamp != "-")
    newDate = formatShortDate(point.timestamp, void 0, localTimes);
  const ttw = point.timestamp - currentTs;
  const textHDG = point.heading ? "HDG: <b>" + point.heading.replace(/&deg;/g, "°") + "</b><br>" : "";
  const textTWS = point.tws ? "TWS: " + point.tws + "<br>" : "";
  const textSpeed = point.speed ? "Speed: " + point.speed : "";
  let textTWA = point.twa ? "TWA: <b>" + point.twa.replace(/&deg;/g, "°") + "</b>" : "";
  textTWA += point.twa && point.heading ? "&nbsp;|&nbsp;" : "";
  let textTWD = point.twd ? "TWD: " + point.twd.replace(/&deg;/g, "°") : "";
  textTWD += point.twd && point.tws ? "&nbsp;|&nbsp;" : "";
  let textSail = point.sail ? "Sail: " + point.sail : "";
  if (point.boost && point.boost > 0)
    textSail += "⚠️";
  textSail += point.sail && point.speed ? "&nbsp;|&nbsp;" : "";
  if (point.desc)
    position += "<br>" + point.desc.replace(/�/g, "°");
  let textStamina = "";
  if (point.stamina && point.stamina > 0)
    textStamina = "🔋 " + point.stamina + "%";
  return "<b>" + newDate + "</b> (" + formatDHMS(ttw) + ")<br>" + position + "<br>" + textTWA + textHDG + textTWD + textTWS + textSail + textSpeed + "<br>" + textStamina;
}
function computeNextPos(pos, hdg, speed, time) {
  const dist5 = speed * time / (3600 * 60);
  const alpha = 360 - (hdg - 90);
  const lat5 = pos.lat + dist5 * Math.sin(toRad(alpha));
  let lng5 = pos.lng;
  lng5 += dist5 * Math.cos(toRad(alpha)) / Math.cos((toRad(lat5) + toRad(lat5)) / 2);
  if (lng5 > 180) {
    lng5 = lng5 - 360;
  }
  if (lng5 < -180) {
    lng5 = lng5 + 360;
  }
  return buildPt2(lat5, lng5);
}
function drawProjectionLine(pos, hdg, speed) {
  if (!hdg || !speed)
    return;
  if (!mapState || !mapState.map)
    return;
  const userPrefs = getUserPrefs();
  const map = mapState.map;
  if (mapState.me_PlLayer)
    map.removeLayer(mapState.me_PlLayer);
  mapState.me_PlLayer = L.layerGroup();
  let tpath = [];
  tpath.push(pos[1]);
  for (var i = 0; i < userPrefs.map.projectionLineLenght / 2; i++) {
    pos = computeNextPos(pos[1], hdg, speed, 2 * 60);
    tpath.push(pos[1]);
    const title = 2 * (i + 1) + "min";
    buildCircle(pos, mapState.me_PlLayer, userPrefs.map.projectionColor, 1.5, 1, title);
  }
  buildTrace(buildPath(tpath), mapState.me_PlLayer, mapState.refPoints, userPrefs.map.projectionColor, 1, 0.4, "10, 10", "5");
  mapState.me_PlLayer.addTo(map);
}
let cachedTileList = [];
let coastDrawnState = false;
async function initCachedTilesList() {
  cachedTileList = [];
  await chrome.runtime.getPackageDirectoryEntry((dir) => {
    dir.getDirectory("coasts", {}, function(cachedTilesDir) {
      new Promise((resolve) => {
        let dirReader = cachedTilesDir.createReader();
        let getEntries = () => {
          dirReader.readEntries(
            (entries) => {
              if (entries.length) {
                for (var i = 0; i < entries.length; ++i) {
                  cachedTileList.push(entries[i].name);
                }
                getEntries();
              }
            }
          );
        };
        getEntries();
      });
    });
  });
}
async function showCoastTiles() {
  const raceInfo2 = getRaceInfo$1();
  if (!mapState || !mapState.map || !raceInfo2)
    return;
  const map = mapState.map;
  const center = map.getCenter();
  const RANGE = 3;
  const GRID = 3;
  const clampLat = (lat) => Math.max(-90, Math.min(90, lat));
  const wrapLng = (lng) => {
    let x = lng;
    while (x > 180)
      x -= 360;
    while (x < -180)
      x += 360;
    return x;
  };
  const south = clampLat(center.lat - RANGE);
  const north = clampLat(center.lat + RANGE);
  const west = wrapLng(center.lng - RANGE);
  const east = wrapLng(center.lng + RANGE);
  const crossesDateline = west > east;
  const snapDown = (v) => Math.floor(v / GRID) * GRID;
  const snapUp = (v) => Math.ceil(v / GRID) * GRID;
  const latitudeStart = snapDown(Math.min(south, north));
  const latitudeEnd = snapUp(Math.max(south, north));
  const coastsToLoad = [];
  const pushIfExists = (x, y) => {
    const id = `coast_polygons_${x}_${y}.geojson.gzip`;
    if (cachedTileList.includes(id))
      coastsToLoad.push(id);
  };
  if (!crossesDateline) {
    const longitudeStart = snapDown(Math.min(west, east));
    const longitudeEnd = snapUp(Math.max(west, east));
    for (let x = longitudeStart; x <= longitudeEnd; x += 1) {
      for (let y = latitudeStart; y <= latitudeEnd; y += 1) {
        pushIfExists(x, y);
      }
    }
  } else {
    const start1 = snapDown(west);
    const end1 = 180;
    const start2 = -180;
    const end2 = snapUp(east);
    for (let x = start1; x <= end1; x += 1) {
      for (let y = latitudeStart; y <= latitudeEnd; y += 1) {
        pushIfExists(x, y);
      }
    }
    for (let x = start2; x <= end2; x += 1) {
      for (let y = latitudeStart; y <= latitudeEnd; y += 1) {
        pushIfExists(x, y);
      }
    }
  }
  coastLayersCleanAll(map);
  await Promise.all(
    coastsToLoad.map(async (id) => {
      const existing = mapState.coasts.get(id);
      if (existing) {
        existing.displayed = true;
        return;
      }
      try {
        const resp = await fetch(`../coasts/${id}`);
        if (!resp.ok)
          return;
        const blob = await resp.blob();
        const ds = new DecompressionStream("gzip");
        const decompressedStream = blob.stream().pipeThrough(ds);
        const jsonText = await new Response(decompressedStream).text();
        if (!jsonText)
          return;
        mapState.coasts.set(id, {
          id,
          json: JSON.parse(jsonText),
          layer: null,
          displayed: true
        });
      } catch (e) {
        console.warn("coast fetch failed", id, e);
      }
    })
  );
  coastDrawAllLayers(map);
}
function coastDrawAllLayers(map, force = false) {
  mapState.coasts.forEach((mapCoast) => {
    if (mapCoast.displayed) {
      if (force)
        mapCoast.layer = null;
      if (!mapCoast.layer) {
        mapCoast.layer = L$1.layerGroup();
        mapCoast.layer.__tag = "coastLines";
        L$1.geoJSON(mapCoast.json, { style: styleLines }).addTo(mapCoast.layer);
      }
      mapCoast.layer.addTo(map);
    }
  });
  coastDrawnState = true;
}
function coastLayersCleanAll(map, force = false) {
  map = map ? map : mapState.map;
  if (!map || !coastDrawnState && !force)
    return;
  map.eachLayer((l) => {
    if (l.__tag && l.__tag === "coastLines") {
      map.removeLayer(l);
    }
  });
  mapState.coasts.forEach((mapCoast) => {
    if (!force)
      mapCoast.displayed = false;
  });
  coastDrawnState = false;
}
function styleLines(feature) {
  const userPrefs = getUserPrefs();
  const borderColor = userPrefs.map.borderColor;
  return {
    color: borderColor,
    weight: 1,
    opacity: 0.7
  };
}
function onCoastColorChange() {
  const raceInfo2 = getRaceInfo$1();
  if (!mapState || !mapState.map || !raceInfo2)
    return;
  const map = mapState.map;
  coastLayersCleanAll(map, true);
  coastDrawAllLayers(map, true);
}
const mapState = {
  raceId: null,
  // id de la course actuellement affichée
  map: null,
  // instance Leaflet
  refPoints: [],
  // points pour fitBounds
  refLayer: null,
  // layerGroup pour traits de côte / ice / RZ
  route: [],
  // routes importées (importRoute / showRoute / hideRoute)
  bounds: null,
  resetUserZoom: 0,
  userZoom: false,
  // couches optionnelles, créées à la demande :
  checkPointLayer: null,
  fleetLayer: null,
  fleetLayerMarkers: null,
  fleetLayerTracks: null,
  wayPointLayer: null,
  meLayer: null,
  meLayerMarkers: null,
  meBoatLayer: null,
  leaderLayer: null,
  leaderMeLayer: null,
  coasts: /* @__PURE__ */ new Map(),
  mapCurrentZoom: 0
};
const MAP_CONTAINER_ID = "lMap";
const COAST_MIN_ZOOM = 7;
function updateBounds() {
  if (!mapState.map)
    return;
  mapState.bounds = L$1.latLngBounds(mapState.refPoints);
  mapState.map.fitBounds(mapState.bounds);
}
function updateMapCheckpoints(raceInfo2, playerIte) {
  var _a;
  if (!mapState.map)
    return;
  const map = mapState.map;
  if (!raceInfo2 || !map)
    return;
  if (mapState.checkPointLayer) {
    map.removeLayer(mapState.checkPointLayer);
  }
  mapState.checkPointLayer = L$1.layerGroup();
  const userPrefs = getUserPrefs();
  const showInvisibleDoors = userPrefs.map.invisibleBuoy;
  if (Array.isArray(raceInfo2.checkpoints)) {
    for (const cp of raceInfo2.checkpoints) {
      if (cp.display == "none" && !showInvisibleDoors) {
        continue;
      }
      let cpType = cp.display && cp.display !== "none" ? cp.display : "Invisible";
      cpType = cpType.charAt(0).toUpperCase() + cpType.slice(1);
      const position_s = buildPt2(cp.start.lat, cp.start.lon);
      const position_e = buildPt2(cp.end.lat, cp.end.lon);
      const passed = ((_a = playerIte == null ? void 0 : playerIte.ite) == null ? void 0 : _a.gateGroupCounters) && playerIte.ite.gateGroupCounters[cp.group - 1] ? true : false;
      let op = 1;
      if (passed)
        op = 0.6;
      const label_g = (passed ? "<div class='tagGatePassed'>PASSED</div>" : "") + "Checkpoint " + cp.group + "." + cp.id + ": <b>" + cp.name + "</b><br>";
      const label_g_more = "<br>Type: <b>" + cpType + "</b> | Engine: " + cp.engine;
      const side_s = cp.side == "stbd" ? "Starboard" : "Port";
      const side_e = cp.side == "stbd" ? "Port" : "Starboard";
      const label_s = label_g + formatPosition(cp.start.lat, cp.start.lon) + label_g_more + " | Side: " + side_s;
      const label_e = label_g + formatPosition(cp.end.lat, cp.end.lon) + label_g_more + " | Side: " + side_e;
      if (cp.display == "buoy" || cp.side == "stbd") {
        const iconStart = cp.side == "stbd" ? passed ? greenRRIconP : greenRRIcon : passed ? redRLIconP : redRLIcon;
        const iconEnd = cp.side == "stbd" ? passed ? redRLIconP : redRLIcon : passed ? greenRRIconP : greenRRIcon;
        buildMarker(position_s, mapState.checkPointLayer, iconStart, label_s, 8, op, 0);
        buildMarker(position_e, mapState.checkPointLayer, iconEnd, label_e, 8, op, 0);
      } else {
        const iconStart = cp.side == "stbd" ? passed ? yellowRRIconP : yellowRRIcon : passed ? yellowRLIconP : yellowRLIcon;
        buildMarker(position_s, mapState.checkPointLayer, iconStart, label_s, 8, op, 0);
      }
      mapState.refPoints.push(position_e[1]);
      mapState.refPoints.push(position_s[1]);
      const pathColor = passed ? "green" : "yellow";
      const tpath = [];
      tpath.push(position_e[1]);
      tpath.push(position_s[1]);
      buildTrace(buildPath(tpath), mapState.checkPointLayer, mapState.refPoints, pathColor, 1, op, "20, 20", "10");
    }
  }
  mapState.checkPointLayer.addTo(map);
  if (!mapState.userZoom)
    updateBounds();
}
function updateMapWaypoints(playerIte) {
  var _a, _b;
  const raceOrder = getLegPlayersOrder();
  if (!mapState || !mapState.map)
    return;
  const map = mapState.map;
  if (!playerIte)
    return;
  if (!raceOrder || raceOrder.lenght == 0 || ((_b = (_a = raceOrder[0]) == null ? void 0 : _a.action) == null ? void 0 : _b.type) !== "wp")
    return;
  if (mapState.wayPointLayer) {
    map.removeLayer(mapState.wayPointLayer);
  }
  mapState.wayPointLayer = L$1.layerGroup();
  const wpOrder = raceOrder[0].action.action;
  const lastWpIdx = playerIte.lastWpIdx;
  const currPos = playerIte.pos;
  let wpPts = [];
  wpOrder.forEach(({ lat, lon, idx: idx2 }) => {
    if (idx2 <= lastWpIdx)
      wpPts.push({ lat, lon });
  });
  let cpath = buildPath(wpPts, null, null, currPos.lat, currPos.lon);
  buildTrace(cpath, mapState.wayPointLayer, mapState.refPoints, "#FF00FF", 1.5, 0.7, [0, 1, 0, 1]);
  wpPts = [];
  wpOrder.forEach(({ lat, lon, idx: idx2 }) => {
    if (idx2 > lastWpIdx)
      wpPts.push({ lat, lon });
  });
  cpath = buildPath(wpOrder, currPos.lat, currPos.lon);
  buildTrace(cpath, mapState.wayPointLayer, mapState.refPoints, "#FF00FF", 1.5, 0.7);
  wpOrder.forEach(({ lat, lon, idx: idx2 }) => {
    const pos = buildPt2(lat, lon);
    const title = formatPosition(lat, lon);
    buildCircle(pos, mapState.wayPointLayer, "#FF00FF", 2, 1, title);
    mapState.refPoints.push(pos[1]);
  });
  mapState.wayPointLayer.addTo(map);
  if (!mapState.userZoom)
    updateBounds();
}
function updateMapMe(connectedPlayerId2, playerIte) {
  var _a;
  const trackFleet = getLegPlayersTracksFleet();
  const userPrefs = getUserPrefs();
  const localTimes = userPrefs.global.localTime;
  const displayMarkers = userPrefs.map.showMarkers;
  if (!mapState || !mapState.map)
    return;
  const map = mapState.map;
  const myTrack = trackFleet[connectedPlayerId2].track;
  if (!mapState.meLayer)
    mapState.meLayer = L$1.layerGroup();
  if (!mapState.meBoatLayer)
    mapState.meBoatLayer = L$1.layerGroup();
  if (!mapState.meLayerMarkers)
    mapState.meLayerMarkers = L$1.layerGroup();
  if (mapState.meLayer)
    map.removeLayer(mapState.meLayer);
  if (mapState.meLayerMarkers)
    map.removeLayer(mapState.meLayerMarkers);
  if (mapState.meBoatLayer)
    map.removeLayer(mapState.meBoatLayer);
  mapState.meLayer = L$1.layerGroup();
  mapState.meLayerMarkers = L$1.layerGroup();
  mapState.meBoatLayer = L$1.layerGroup();
  const myPos = { lat: playerIte.pos.lat, lon: playerIte.pos.lon };
  if (trackFleet && trackFleet.lenght != 0 && ((_a = trackFleet[connectedPlayerId2]) == null ? void 0 : _a.track)) {
    let myTrackPts = [];
    let isFirst = false;
    let prevPt = null;
    myTrack.forEach(({ lat, lon, ts, tag }) => {
      myTrackPts.push({ lat, lon });
      if (isFirst) {
        const title2 = "Me <br><b>" + formatShortDate(ts, void 0, localTimes) + "</b> | Speed: " + roundTo(Math.abs(gcDistance(myPos, { lat, lon }) / ((ts - prevPt.ts) / 1e3) * 3600), 2) + " kts<br>" + formatPosition(lat, lon) + (tag ? "<br>(Type: " + tag + ")" : "");
        buildCircle({ lat, lon }, mapState.meLayerMarkers, "#b86dff", 1.5, 1, title2);
        mapState.refPoints.push({ lat, lon });
      }
      isFirst = true;
      prevPt = { lat, lon, ts };
    });
    const myTrackpath = buildPath(myTrackPts, void 0, void 0, myPos.lat, myPos.lon);
    buildTrace(myTrackpath, mapState.meLayer, mapState.refPoints, "#b86dff", 1.5, 1);
  }
  mapState.meLayer.addTo(map);
  if (displayMarkers)
    mapState.meLayerMarkers.addTo(map);
  const myPosPt = buildPt2(myPos.lat, myPos.lon);
  const title = "Me (Last position: " + formatTimestampToReadableDate(playerIte.iteDate, 1) + ")<br>TWA: <b>" + roundTo(playerIte.twa, 3) + "°</b> | HDG: <b>" + roundTo(playerIte.hdg, 2) + "°</b><br>Sail: " + sailNames[playerIte.sail] + " | Speed: " + roundTo(playerIte.speed, 3) + " kts<br>TWS: " + roundTo(playerIte.tws, 3) + " kts | TWD: " + roundTo(playerIte.twd, 3) + "°";
  buildMarker(myPosPt, mapState.meBoatLayer, buildBoatIcon("#b86dff", "#000000", 0.4), title, 200, 0.5, playerIte.hdg);
  drawProjectionLine(myPosPt, playerIte.hdg, playerIte.speed);
  mapState.meBoatLayer.addTo(map);
  if (!mapState.userZoom)
    updateBounds();
}
function updateMapLeader(playerIte) {
  if (!mapState || !mapState.map)
    return;
  const map = mapState.map;
  if (mapState.leaderLayer)
    map.removeLayer(mapState.leaderLayer);
  if (mapState.leaderMeLayer)
    map.removeLayer(mapState.leaderMeLayer);
  mapState.leaderLayer = L$1.layerGroup();
  mapState.leaderMeLayer = L$1.layerGroup();
  const offset = (playerIte == null ? void 0 : playerIte.startDate) ? /* @__PURE__ */ new Date() - playerIte.startDate : /* @__PURE__ */ new Date();
  const trackLeaderMap = getLegPlayersTrackLeader();
  const trackLeader = trackLeaderMap && typeof trackLeaderMap === "object" ? Object.values(trackLeaderMap)[0] : null;
  if (trackLeader && trackLeader.track.length > 0) {
    const playersList2 = getPlayersList();
    const title = "Leader: <b>" + playersList2[trackLeader.userId].name + "</b><br>Elapsed: " + formatDHMS(offset);
    addGhostTrack(trackLeader.track, title, offset, "#FF8C00", mapState.leaderLayer);
  }
  const trackGhostMap = getLegPlayersTracksGhost();
  const trackGhost = trackGhostMap && typeof trackGhostMap === "object" ? Object.values(trackGhostMap)[0] : null;
  if (trackGhost && trackGhost.track.length > 0) {
    const title = "<b>Best Attempt</b><br>Elapsed: " + formatDHMS(offset);
    addGhostTrack(trackGhost.track, title, offset, "#b86dff", mapState.leaderMeLayer);
  }
}
function addGhostTrack(ghostTrack, title, offset, color, layer) {
  if (!ghostTrack || !mapState || !mapState.map)
    return;
  const ghostStartTS = ghostTrack[0].ts;
  const ghostPosTS = ghostStartTS + offset;
  let ghostPos;
  for (var i = 0; i < ghostTrack.length; i++) {
    const pos = buildPt2(ghostTrack[i].lat, ghostTrack[i].lon);
    mapState.refPoints.push(pos[1]);
    if (!ghostPos) {
      if (ghostTrack[i].ts >= ghostPosTS) {
        ghostPos = i;
      }
    }
  }
  buildTrace(buildPath(ghostTrack), layer, mapState.refPoints, color, 1, 0.6, "10, 10", "5");
  if (ghostPos) {
    const lat1 = ghostTrack[ghostPos].lat;
    const lon1 = ghostTrack[ghostPos].lon;
    const lat0 = ghostTrack[Math.max(ghostPos - 1, 0)].lat;
    const lon0 = ghostTrack[Math.max(ghostPos - 1, 0)].lon;
    const heading = courseAngle(lat0, lon0, lat1, lon1) * 180 / Math.PI;
    const d = (ghostPosTS - ghostTrack[ghostPos - 1].ts) / (ghostTrack[ghostPos].ts - ghostTrack[ghostPos - 1].ts);
    const lat = lat0 + (lat1 - lat0) * d;
    const lon = lon0 + (lon1 - lon0) * d;
    const pos = buildPt2(lat, lon);
    buildMarker(pos, layer, buildBoatIcon(color, color, 0.6), title, 20, 0.4, heading);
  }
  layer.addTo(mapState.map);
  if (!mapState.userZoom)
    updateBounds();
}
function updateMapFleet(raceInfo2, raceItesFleet, connectedPlayerId2) {
  if (!raceInfo2 || !raceItesFleet || !mapState || !mapState.map)
    return;
  const map = mapState.map;
  const trackFleet = getLegPlayersTracksFleet();
  const userPrefs = getUserPrefs();
  const displayMarkers = userPrefs.map.showMarkers;
  const displayTracks = userPrefs.map.showTracks;
  const localTimes = userPrefs.global.localTime;
  if (mapState.fleetLayer)
    map.removeLayer(mapState.fleetLayer);
  if (mapState.fleetLayerMarkers)
    map.removeLayer(mapState.fleetLayerMarkers);
  if (mapState.fleetLayerTracks)
    map.removeLayer(mapState.fleetLayerTracks);
  mapState.fleetLayer = L$1.layerGroup();
  mapState.fleetLayerMarkers = L$1.layerGroup();
  mapState.fleetLayerTracks = L$1.layerGroup();
  Object.entries(raceItesFleet).map(([userId, playerFleetInfos]) => {
    var _a, _b, _c;
    const playerIte = playerFleetInfos.ite;
    if (playerIte && userId && userId != connectedPlayerId2 && isDisplayEnabled(playerIte, userId, connectedPlayerId2)) {
      let zi;
      if (playerIte.type == "top") {
        zi = 49;
      } else if (playerIte.team) {
        zi = 48;
      } else if (playerIte.followed == true || playerIte.isFollowed == true) {
        zi = 47;
      } else if (playerIte.type == "sponsor") {
        zi = 46;
      } else {
        zi = 44;
      }
      const pos = buildPt2(playerIte.pos.lat, playerIte.pos.lon);
      let skipperName = playerFleetInfos.info.name;
      if ((_a = playerIte.extendedInfos) == null ? void 0 : _a.skipperName)
        skipperName += '<span class="txtUpper">' + playerIte.extendedInfos.boatName + "</span><br><b>" + playerIte.extendedInfos.skipperName + "</b>";
      let info = "";
      if (playerIte.type == "real") {
        info = skipperName + "<br>HDG: <b>" + roundTo(playerIte.hdg, 2) + "°</b> | Speed: " + roundTo(playerIte.speed, 3) + " kts";
        if (playerIte.twa > 0)
          info += "<br>TWA: <b>" + roundTo(playerIte.twa, 3) + "°</b>";
        if (playerIte.sail != "-")
          info += " | Sail: " + sailNames[playerIte];
        if (playerIte.tws > 0)
          info += "<br>TWS: " + roundTo(playerIte.tws, 3) + " kts";
        if (playerIte.twd > 0)
          info += " | TWD: " + roundTo(playerIte.twd, 3) + "°";
      } else {
        info = skipperName + "<br>TWA: <b>" + roundTo(playerIte.twa, 3) + "°</b> | HDG: <b>" + roundTo(playerIte.hdg, 2) + "°</b><br>Sail: " + sailNames[playerIte.sail] || "- | Speed: " + roundTo(playerIte.speed, 3) + " kts<br>TWS: " + roundTo(playerIte.tws, 3) + " kts | TWD: " + roundTo(playerIte.twd, 3) + "°";
      }
      if (raceInfo2.raceType == "record" && playerIte.startDate) {
        info += "<br>Elapsed: <b>" + formatDHMS(playerIte.iteDate - playerIte.startDate) + "</b>";
      }
      const categoryIdx = category.indexOf(playerIte.type);
      let boatColor = "";
      let borderBoatColor = "";
      if (userId == connectedPlayerId2) {
        boatColor = "#b86dff";
        borderBoatColor = "#b86dff";
      } else {
        boatColor = userPrefs.theme == "dark" ? categoryStyleDark[categoryIdx].bcolor : categoryStyle[categoryIdx].bcolor;
        borderBoatColor = userPrefs.theme == "dark" ? categoryStyleDark[categoryIdx].bbcolor : categoryStyle[categoryIdx].bbcolor;
        if (playerIte.type2 == "followed" && (playerIte.type == "normal" || playerIte.type == "sponsor")) {
          boatColor = "#32cd32";
          borderBoatColor = "#000000";
          if (playerIte.team)
            borderBoatColor = "#ae1030";
        } else if (playerIte.team && playerIte.type != "top") {
          boatColor = "#ae1030";
          borderBoatColor = "#000000";
          if (playerIte.type2 == "followed") {
            borderBoatColor = "#32cd32";
          }
        }
      }
      buildMarker(pos, mapState.fleetLayer, buildBoatIcon(boatColor, borderBoatColor, 0.8), info, zi, 0.8, playerIte.hdg);
      if (((_b = trackFleet[userId]) == null ? void 0 : _b.track) && ((_c = trackFleet[userId]) == null ? void 0 : _c.length) != 0) {
        const playerPos = { lat: playerIte.pos.lat, lon: playerIte.pos.lon };
        let playerTrackPts = [];
        let isFirst = false;
        let prevPt = null;
        trackFleet[userId].track.forEach(({ lat, lon, ts, tag }) => {
          playerTrackPts.push({ lat, lon });
          var pos2 = buildPt2(lat, lon);
          if (isFirst) {
            const title = skipperName + "<br><b>" + formatShortDate(ts, void 0, localTimes) + "</b> | Speed: " + roundTo(Math.abs(gcDistance(playerPos, { lat, lon }) / ((ts - prevPt.ts) / 1e3) * 3600), 2) + " kts<br>" + formatPosition(lat, lon) + (tag ? "<br>(Type: " + tag + ")" : "");
            buildCircle(pos2, mapState.fleetLayerMarkers, boatColor, 1.5, 1, title);
            mapState.refPoints.push({ lat, lon });
          }
          isFirst = true;
          prevPt = { lat, lon, ts };
        });
        if (playerPos.lat && playerPos.lon) {
          const myTrackpath = buildPath(playerTrackPts, void 0, void 0, playerPos.lat, playerPos.lon);
          buildTrace(myTrackpath, mapState.fleetLayerTracks, mapState.refPoints, boatColor, 1.5, 1);
        }
      }
    }
  });
  mapState.fleetLayer.addTo(map);
  if (displayMarkers)
    mapState.fleetLayerMarkers.addTo(map);
  if (displayTracks)
    mapState.fleetLayerTracks.addTo(map);
  if (!mapState.userZoom)
    updateBounds();
}
function getOrCreateMapContainer() {
  const tab = document.getElementById("tab-content3");
  if (!tab)
    return null;
  let divMap = document.getElementById(MAP_CONTAINER_ID);
  if (!divMap) {
    divMap = document.createElement("div");
    divMap.id = MAP_CONTAINER_ID;
    divMap.style.height = "100%";
    divMap.style.display = "flex";
    divMap.style.width = "90%";
    tab.appendChild(divMap);
  }
  divMap.style.visibility = "visible";
  divMap.style.height = "100%";
  divMap.style.width = "90%";
  return divMap;
}
async function initializeMap() {
  var _a;
  async function set_userCustomZoom(e) {
    if (!e || e.type === "zoomend") {
      if (mapState.resetUserZoom > 0)
        mapState.userZoom = true;
      else
        mapState.resetUserZoom += 1;
      if (e && e.target) {
        if (e.target._zoom > COAST_MIN_ZOOM)
          await showCoastTiles();
        else
          await coastLayersCleanAll();
        mapState.mapCurrentZoom = e.target._zoom;
      }
    } else if (e.type === "moveend") {
      if (mapState.mapCurrentZoom > COAST_MIN_ZOOM)
        await showCoastTiles();
      else
        await coastLayersCleanAll();
    }
  }
  const tab = document.getElementById("tab-content3");
  if (!tab)
    return;
  if (getComputedStyle(tab).display === "none") {
    return;
  }
  const raceInfo2 = getRaceInfo$1();
  const playerItes = getLegPlayerInfos();
  const raceItesFleet = getLegFleetInfos();
  const connectedPlayerId2 = getConnectedPlayerId();
  if (playerItes && playerItes.ites && playerItes.ites.length > 0) {
    playerItes.ite = playerItes.ites[0];
  }
  const rid = raceInfo2.raceId + "_" + raceInfo2.legNum;
  const divMap = getOrCreateMapContainer();
  if (!divMap)
    return;
  if (!raceInfo2 || (raceInfo2 == null ? void 0 : raceInfo2.length) == 0)
    return;
  if (mapState.map && mapState.raceId === rid) {
    mapState.map.invalidateSize();
    applyBoundsForCurrentMode(mapState.map);
    if (!mapState.userZoom)
      updateBounds();
    updateMapCheckpoints(raceInfo2, playerItes.ite);
    updateMapWaypoints(playerItes.ite);
    updateMapMe(connectedPlayerId2, playerItes.ite);
    updateMapLeader(playerItes.ite);
    updateMapFleet(raceInfo2, raceItesFleet, connectedPlayerId2);
    initButtonToCenterViewMap(playerItes.ite.pos.lat, playerItes.ite.pos.lon, mapState.map);
    enableCoordinateCopyingWithShortcut();
    return;
  }
  if (mapState.map) {
    mapState.map.off();
    mapState.map.remove();
    mapState.map = null;
  }
  mapState.refPoints = [];
  mapState.refLayer = L$1.layerGroup();
  mapState.resetUserZoom = 0;
  mapState.userZoom = false;
  mapState.raceId = rid;
  let mapTileColorFilterDarkMode = [
    "invert:100%",
    "bright:106%",
    "contrast:121%",
    "hue:195deg",
    "saturate:43%"
  ];
  const Esri_WorldImagery = L$1.tileLayer(
    "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      minZoom: 2,
      maxZoom: 40,
      maxNativeZoom: 40,
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
    }
  );
  const OSM_Layer = L$1.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    minZoom: 2,
    maxZoom: 40,
    maxNativeZoom: 40,
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  });
  const OSM_DarkLayer = L$1.tileLayer.colorFilter("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    minZoom: 2,
    maxZoom: 40,
    maxNativeZoom: 40,
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
    filter: mapTileColorFilterDarkMode
  });
  const Arctic_WMS = createArcticWMS();
  const baseLayers = {
    "Carte": OSM_Layer,
    "Dark": OSM_DarkLayer,
    "Satellite": Esri_WorldImagery
  };
  if (Arctic_WMS) {
    baseLayers["Arctic (EPSG:3413)"] = Arctic_WMS;
  }
  const userPrefs = getUserPrefs();
  const userBaseMap = userPrefs.map.selectBaseMap;
  let selectBaseMap = OSM_Layer;
  if (userBaseMap === "Dark")
    selectBaseMap = OSM_DarkLayer;
  else if (userBaseMap === "Satellite")
    selectBaseMap = Esri_WorldImagery;
  else if (userBaseMap === "Arctic (EPSG:3413)" && Arctic_WMS)
    selectBaseMap = Arctic_WMS;
  const usingPolar = selectBaseMap === Arctic_WMS && !!POLAR.crs;
  POLAR.enabled = usingPolar;
  let map = L$1.map(MAP_CONTAINER_ID, {
    layers: [selectBaseMap],
    crs: usingPolar ? POLAR.crs : L$1.CRS.EPSG3857
  });
  mapState.map = map;
  const layerControl = L$1.control.layers(baseLayers, null, { position: "topright" });
  layerControl.addTo(map);
  ensureLayerControlClickable(layerControl);
  async function onBaseLayerChange(e) {
    await saveLocal("selectBaseMap", e.name);
    const isArctic = e.layer === Arctic_WMS;
    const wasArctic = !!POLAR.enabled;
    if (hasProj4Leaflet() && isArctic !== wasArctic) {
      const center = map.getCenter();
      const zoom = map.getZoom();
      map.off("baselayerchange", onBaseLayerChange);
      map.off("zoomend", set_userCustomZoom);
      map.off("moveend", set_userCustomZoom);
      map.remove();
      POLAR.enabled = isArctic;
      const activeBase = isArctic ? Arctic_WMS : e.name === "Dark" ? OSM_DarkLayer : e.name === "Satellite" ? Esri_WorldImagery : OSM_Layer;
      const newMap = L$1.map(MAP_CONTAINER_ID, {
        crs: isArctic ? POLAR.crs || buildPolarCRS() : L$1.CRS.EPSG3857,
        layers: [activeBase],
        zoomAnimation: false,
        fadeAnimation: false
      });
      mapState.map = newMap;
      map = newMap;
      newMap.once("load", () => newMap.invalidateSize());
      const comfy = computeComfortView(isArctic, center, zoom);
      requestAnimationFrame(() => {
        newMap.setView(comfy.center, comfy.zoom, { animate: false });
        newMap.invalidateSize();
        setTimeout(() => newMap.invalidateSize(), 0);
      });
      const newBaseLayers = {
        "Carte": OSM_Layer,
        "Dark": OSM_DarkLayer,
        "Satellite": Esri_WorldImagery
      };
      if (Arctic_WMS)
        newBaseLayers["Arctic (EPSG:3413)"] = Arctic_WMS;
      const newLayerControl = L$1.control.layers(newBaseLayers);
      newLayerControl.addTo(newMap);
      ensureLayerControlClickable(newLayerControl);
      newMap.addControl(new L$1.Control.ScaleNautic({
        metric: true,
        imperial: false,
        nautic: true
      }));
      const optionsRuler2 = {
        position: "topleft",
        maxPoints: 2,
        lengthUnit: {
          factor: 0.539956803,
          display: "nm",
          decimal: 2,
          label: "Distance:"
        }
      };
      L$1.control.ruler(optionsRuler2).addTo(newMap);
      L$1.control.coordinates({
        useDMS: true,
        labelTemplateLat: "Lat: {y}",
        labelTemplateLng: " Lng: {x}",
        useLatLngOrder: true,
        labelFormatterLat: function(lat) {
          let latFormatted = L$1.NumberFormatter.toDMS(lat);
          latFormatted = latFormatted.replace(/''$/, '"') + (latFormatted.startsWith("-") ? " S" : " N");
          return latFormatted.replace(/^-/, "");
        },
        labelFormatterLng: function(lng) {
          let lngFormatted = L$1.NumberFormatter.toDMS(lng);
          lngFormatted = lngFormatted.replace(/''$/, '"') + (lngFormatted.startsWith("-") ? " W" : " E");
          return '<span class="labelGeo">' + lngFormatted.replace(/^-/, "") + "</span>";
        }
      }).addTo(newMap);
      if (mapState.refLayer)
        mapState.refLayer.addTo(newMap);
      applyBoundsForCurrentMode(newMap);
      newMap.on("zoomend", set_userCustomZoom);
      newMap.on("moveend", set_userCustomZoom);
      newMap.on("baselayerchange", onBaseLayerChange);
      const raceInfo3 = getRaceInfo$1();
      const playerItes2 = getLegPlayerInfos();
      const raceItesFleet2 = getLegFleetInfos();
      const connectedPlayerId3 = getConnectedPlayerId();
      if (playerItes2 && playerItes2.ites && playerItes2.ites.length > 0) {
        playerItes2.ite = playerItes2.ites[0];
      }
      updateBounds();
      updateMapCheckpoints(raceInfo3, playerItes2.ite);
      updateMapWaypoints(playerItes2.ite);
      updateMapMe(connectedPlayerId3, playerItes2.ite);
      updateMapFleet(raceInfo3, raceItesFleet2, connectedPlayerId3);
      updateMapLeader(playerItes2.ite);
      return;
    }
    POLAR.enabled = isArctic;
    applyBoundsForCurrentMode(map);
  }
  map.addControl(new L$1.Control.ScaleNautic({
    metric: true,
    imperial: false,
    nautic: true
  }));
  const optionsRuler = {
    position: "topleft",
    maxPoints: 2,
    lengthUnit: {
      factor: 0.539956803,
      display: "nm",
      decimal: 2,
      label: "Distance:"
    }
  };
  L$1.control.ruler(optionsRuler).addTo(map);
  L$1.control.coordinates({
    useDMS: true,
    labelTemplateLat: "Lat: {y}",
    labelTemplateLng: " Lng: {x}",
    useLatLngOrder: true,
    labelFormatterLat: function(lat) {
      let latFormatted = L$1.NumberFormatter.toDMS(lat);
      latFormatted = latFormatted.replace(/''$/, '"') + (latFormatted.startsWith("-") ? " S" : " N");
      return latFormatted.replace(/^-/, "");
    },
    labelFormatterLng: function(lng) {
      let lngFormatted = L$1.NumberFormatter.toDMS(lng);
      lngFormatted = lngFormatted.replace(/''$/, '"') + (lngFormatted.startsWith("-") ? " W" : " E");
      return '<span class="labelGeo">' + lngFormatted.replace(/^-/, "") + "</span>";
    }
  }).addTo(map);
  map.attributionControl.addAttribution("&copy;SkipperDuMad / Trait de cotes &copy;Kurun56");
  mapState.refLayer = L$1.layerGroup();
  let title1 = "Start: <b>" + raceInfo2.start.name + "</b><br>" + formatPosition(raceInfo2.start.lat, raceInfo2.start.lon);
  let latlng = buildPt2(raceInfo2.start.lat, raceInfo2.start.lon);
  buildMarker(latlng, mapState.refLayer, buildTextIcon("", "white", "blue", "S"), title1, 0);
  mapState.refPoints.push(latlng[1]);
  title1 = "Finish: <b>" + raceInfo2.end.name + "</b><br>" + formatPosition(raceInfo2.end.lat, raceInfo2.end.lon);
  latlng = buildPt2(raceInfo2.end.lat, raceInfo2.end.lon);
  buildMarker(latlng, mapState.refLayer, buildTextIcon("", "yellow", "red", "F"), title1, 0);
  mapState.refPoints.push(latlng[1]);
  buildCircleEndRace(latlng, mapState.refLayer, "red", raceInfo2.end.radius * 1852);
  const cpath = buildPath_bspline(raceInfo2.course, raceInfo2.start.lat, raceInfo2.start.lon, raceInfo2.end.lat, raceInfo2.end.lon);
  const raceLine = buildTrace(cpath, mapState.refLayer, mapState.refPoints, "white", 1, 0.5);
  for (var i = 0; i < raceLine.length; i++) {
    L$1.polylineDecorator(raceLine[i], {
      patterns: [
        { offset: "5%", repeat: "10%", symbol: L$1.Symbol.arrowHead({ pixelSize: 15, pathOptions: { fillOpacity: 0.5, weight: 1, color: "white" } }) }
      ]
    }).addTo(mapState.refLayer);
  }
  const south = (_a = raceInfo2 == null ? void 0 : raceInfo2.ice_limits) == null ? void 0 : _a.south;
  if (Array.isArray(south) && south.length !== 0) {
    const isDummy = south.length === 5 && south[0].lat === -90 && south[0].lon === -180 && south[2].lat === -90 && south[2].lon === 0 && south[4].lat === -90 && south[4].lon === 180;
    if (!isDummy) {
      const iceDataMiddleIndex = Math.ceil(iceData.length / 2);
      const iceDataFirstHalf = iceData.slice(0, iceDataMiddleIndex);
      const iceDataSecondHalf = iceData.slice(iceDataMiddleIndex);
      buildTrace(buildPath(iceDataFirstHalf), mapState.refLayer, mapState.refPoints, "#FF0000", 1.5, 0.5, false);
      buildTrace(buildPath(iceDataSecondHalf), mapState.refLayer, mapState.refPoints, "#FF0000", 1.5, 0.5, false);
      if (Util.isOdd(iceData.length))
        buildTrace(buildPath([iceDataFirstHalf[iceDataFirstHalf.length - 1], iceDataSecondHalf[0]]), mapState.refLayer, mapState.refPoints, "#FF0000", 1.5, 0.5, false);
    }
  }
  const rz = raceInfo2 == null ? void 0 : raceInfo2.restrictedZones;
  if (Array.isArray(rz) && rz.length !== 0) {
    for (const z of rz) {
      let polygonPts0 = [];
      let polygonPts1 = [];
      let polygonPts2 = [];
      let restrictedZoneColor = "red";
      if (z.color)
        restrictedZoneColor = z.color;
      for (const p of z.vertices || []) {
        polygonPts0.push([p.lat, p.lon]);
        polygonPts1.push([p.lat, p.lon - 360]);
        polygonPts2.push([p.lat, p.lon + 360]);
      }
      L$1.polygon(
        polygonPts0,
        {
          color: restrictedZoneColor,
          stroke: 0.35,
          weight: 1
        }
      ).addTo(mapState.refLayer);
      L$1.polygon(
        polygonPts1,
        {
          color: restrictedZoneColor,
          stroke: 0.35,
          weight: 1
        }
      ).addTo(mapState.refLayer);
      L$1.polygon(
        polygonPts2,
        {
          color: restrictedZoneColor,
          stroke: 0.35,
          weight: 1
        }
      ).addTo(mapState.refLayer);
    }
  }
  mapState.refLayer.addTo(map);
  updateBounds();
  updateMapCheckpoints(raceInfo2, playerItes.ite);
  updateMapFleet(raceInfo2, raceItesFleet, connectedPlayerId2);
  if (mapState.route[rid] && mapState.route[rid].length !== 0) {
    Object.keys(mapState.route[rid]).forEach(function(name) {
      var lMapRoute = mapState.route[rid][name];
      var map2 = mapState.map;
      if (lMapRoute.displayed) {
        if (lMapRoute.traceLayer)
          lMapRoute.traceLayer.addTo(map2);
        if (lMapRoute.markersLayer && document.getElementById("sel_showMarkersLmap").checked)
          lMapRoute.markersLayer.addTo(map2);
      }
    });
  }
  updateMapWaypoints(playerItes.ite);
  updateMapLeader(playerItes.ite);
  updateMapMe(connectedPlayerId2, playerItes.ite);
  set_userCustomZoom(false);
  applyBoundsForCurrentMode(map);
  map.on("baselayerchange", onBaseLayerChange);
  map.on("zoomend", set_userCustomZoom);
  map.on("moveend", set_userCustomZoom);
  mapState.map = map;
  initButtonToCenterViewMap(playerItes.ite.pos.lat, playerItes.ite.pos.lon, mapState.map);
  enableCoordinateCopyingWithShortcut();
}
let activeTab = 1;
const tabList = Object.freeze({
  1: "raceLog",
  2: "raceFleet",
  3: "raceMap",
  4: "raceBook",
  5: "raceGraph",
  9: "raceAnalyse",
  6: "notif",
  7: "config",
  8: "rawLog"
});
function tabSwitch(tabId = null) {
  if (tabId == null) {
    if (activeTab)
      tabId = activeTab;
    else
      return;
  }
  activeTab = tabId;
  display_selbox("hidden");
  for (const [key, value] of Object.entries(tabList)) {
    if (value == "raceMap")
      document.getElementById("tab-content" + key).style.display = tabId == key ? "flex" : "none";
    else
      document.getElementById("tab-content" + key).style.display = tabId == key ? "block" : "none";
  }
  const tabName = tabList[tabId];
  switch (tabName) {
    case "config":
    case "rawLog":
      break;
    case "raceLog":
      buildRaceLogHtml();
      break;
    case "raceFleet":
      display_selbox("visible");
      buildRaceFleetHtml();
      break;
    case "raceMap":
      initializeMap();
      display_selbox("visible");
      break;
    case "raceBook":
      buildRaceBookHtml();
      break;
  }
}
function clickManager(ev) {
  const ev_lbl = ev.target.id;
  let tabsel = false;
  let cbox = false;
  let rmatch = null;
  const re_rtsp = new RegExp("^rt:(.+)");
  const re_polr = new RegExp("^pl:(.+)");
  const re_wisp = new RegExp("^wi:(.+)");
  const re_ityc = new RegExp("^ityc:(.+)");
  const re_vrzen = new RegExp("^vrz:(.+)");
  const re_rsel = new RegExp("^rs:(.+)");
  const re_usel = new RegExp("^ui:(.+)");
  const re_tsel = new RegExp("^ts:(.+)");
  const re_cbox = new RegExp("^sel_(.+)");
  const re_cpsp = new RegExp("^cp:(.+)");
  const re_ntdel = new RegExp("^notif_delete_(.+)");
  for (let node = ev.target; node; node = node.parentNode) {
    const id = node.id;
    let match;
    if (re_rtsp.exec(id))
      ;
    else if (re_polr.exec(id))
      ;
    else if (re_wisp.exec(id))
      ;
    else if (re_ityc.exec(id))
      ;
    else if (re_cpsp.exec(id))
      ;
    else if (re_vrzen.exec(id))
      ;
    else if (match = re_rsel.exec(id)) {
      rmatch = match[1];
    } else if (match = re_usel.exec(id)) {
      rmatch = match[1];
    } else if (match = re_tsel.exec(id)) {
      rmatch = match[1];
      tabsel = true;
    } else if (match = re_cbox.exec(id)) {
      rmatch = match[1];
      cbox = true;
    } else if (match = re_ntdel.exec(id)) {
      rmatch = id;
    }
  }
  if (!rmatch)
    return;
  if (tabsel)
    tabSwitch(rmatch);
  else if (cbox) {
    changeState(ev_lbl);
    tabSwitch();
  }
}
function importRoute(route, name) {
  const raceInfo2 = getRaceInfo$1();
  if (!mapState || !mapState.map || !raceInfo2)
    return;
  const userPrefs = getUserPrefs();
  const displayMarkers = userPrefs.map.showMarkers;
  const map = mapState.map;
  const rid = raceInfo2.raceId + "-" + raceInfo2.legNum;
  mapState.route[rid] = mapState.route[rid] || {};
  mapState.route[rid][name] = mapState.route[rid][name] || [];
  const lmapRoute = mapState.route[rid][name];
  if (!lmapRoute.traceLayer)
    lmapRoute.traceLayer = L.layerGroup();
  if (!lmapRoute.markersLayer)
    lmapRoute.markersLayer = L.layerGroup();
  lmapRoute.color = route.color;
  lmapRoute.displayedName = route.displayedName;
  lmapRoute.projectionData = [];
  let currentSail = "";
  for (let i = 0; i < route.points.length; i++) {
    const pos = buildPt2(route.points[i].lat, route.points[i].lon);
    mapState.refPoints.push(pos[1]);
    lmapRoute.projectionData.push(createProjectionPoint(route.points[i].timestamp, route.points[i].lat, route.points[i].lon));
    let circleColor = lmapRoute.color;
    if (currentSail != route.points[i].sail) {
      if (currentSail != "") {
        circleColor = darkenColor(lmapRoute.color, 110);
      }
      currentSail = route.points[i].sail;
    }
    buildCircle(pos, lmapRoute.markersLayer, circleColor, 2, 1, buildMarkerTitle(route.points[i]));
  }
  buildTrace(buildPath(route.points), lmapRoute.traceLayer, mapState.refPoints, lmapRoute.color, 1, 1.5);
  lmapRoute.traceLayer.addTo(map);
  if (displayMarkers)
    lmapRoute.markersLayer.addTo(map);
  if (!mapState.userZoom)
    updateBounds();
  lmapRoute.displayed = true;
}
function hideRoute(name) {
  var _a, _b;
  const raceInfo2 = getRaceInfo$1();
  if (!mapState || !mapState.map || !raceInfo2)
    return;
  const map = mapState.map;
  const rid = raceInfo2.raceId + "-" + raceInfo2.legNum;
  if (!((_b = (_a = mapState.route) == null ? void 0 : _a[rid]) == null ? void 0 : _b[name]))
    return;
  const lmapRoute = mapState.route[rid][name];
  if (lmapRoute.traceLayer) {
    map.removeLayer(lmapRoute.traceLayer);
  }
  if (lmapRoute.markersLayer) {
    map.removeLayer(lmapRoute.markersLayer);
  }
  if (lmapRoute.projectionLayer) {
    map.removeLayer(lmapRoute.projectionLayer);
  }
  lmapRoute.displayed = false;
}
function showRoute(name) {
  var _a, _b;
  const raceInfo2 = getRaceInfo$1();
  if (!mapState || !mapState.map || !raceInfo2)
    return;
  const map = mapState.map;
  const rid = raceInfo2.raceId + "-" + raceInfo2.legNum;
  if (!((_b = (_a = mapState.route) == null ? void 0 : _a[rid]) == null ? void 0 : _b[name]))
    return;
  const lmapRoute = mapState.route[rid][name];
  const userPrefs = getUserPrefs();
  const displayMarkers = userPrefs.map.showMarkers;
  if (lmapRoute.traceLayer)
    lmapRoute.traceLayer.addTo(map);
  if (lmapRoute.markersLayer && displayMarkers)
    lmapRoute.markersLayer.addTo(map);
  lmapRoute.displayed = true;
}
function deleteRoute(name) {
  var _a, _b;
  const raceInfo2 = getRaceInfo$1();
  if (!mapState || !mapState.map || !raceInfo2)
    return;
  const map = mapState.map;
  const rid = raceInfo2.raceId + "-" + raceInfo2.legNum;
  if (!((_b = (_a = mapState.route) == null ? void 0 : _a[rid]) == null ? void 0 : _b[name]))
    return;
  const lmapRoute = mapState.route[rid][name];
  if (lmapRoute.traceLayer) {
    map.removeLayer(lmapRoute.traceLayer);
  }
  if (lmapRoute.markersLayer) {
    map.removeLayer(lmapRoute.markersLayer);
  }
  if (lmapRoute.projectionLayer) {
    map.removeLayer(lmapRoute.projectionLayer);
  }
  delete mapState.route[rid][name];
}
function deleteAllRoutes() {
  var _a;
  const raceInfo2 = getRaceInfo$1();
  if (!raceInfo2)
    return;
  const rid = raceInfo2.raceId + "-" + raceInfo2.legNum;
  Object.keys((_a = mapState == null ? void 0 : mapState.route) == null ? void 0 : _a[rid]).forEach(function(name) {
    deleteRoute(name);
  });
}
function onMarkersChange() {
  const raceInfo2 = getRaceInfo$1();
  if (!mapState || !mapState.map || !raceInfo2)
    return;
  const map = mapState.map;
  const rid = raceInfo2.raceId + "-" + raceInfo2.legNum;
  const userPrefs = getUserPrefs();
  const displayMarkers = userPrefs.map.showMarkers;
  document.getElementById("sel_showMarkersLmap").checked = displayMarkers;
  if (mapState.route[rid]) {
    Object.keys(mapState.route[rid]).forEach(function(name) {
      if (mapState.route[rid][name].markersLayer) {
        if (displayMarkers && mapState.route[rid][name].displayed == true)
          mapState.route[rid][name].markersLayer.addTo(map);
        else
          map.removeLayer(mapState.route[rid][name].markersLayer);
      }
    });
  }
  if (mapState.meLayerMarkers) {
    if (displayMarkers)
      mapState.meLayerMarkers.addTo(map);
    else
      map.removeLayer(mapState.meLayerMarkers);
  }
  if (mapState.fleetLayerMarkers) {
    if (displayMarkers)
      mapState.fleetLayerMarkers.addTo(map);
    else
      map.removeLayer(mapState.fleetLayerMarkers);
  }
}
function hideShowTracks() {
  if (!mapState || !mapState.map)
    return;
  const map = mapState.map;
  const userPrefs = getUserPrefs();
  const displayTracks = userPrefs.map.showTracks;
  document.getElementById("sel_showTracksLmap").checked = displayTracks;
  if (mapState.fleetLayerTracks) {
    if (displayTracks)
      mapState.fleetLayerTracks.addTo(map);
    else {
      map.removeLayer(mapState.fleetLayerTracks);
      if (mapState.fleetLayerMarkers)
        map.removeLayer(mapState.fleetLayerMarkers);
    }
  }
}
var GPXParser_min = { exports: {} };
var browser;
var hasRequiredBrowser;
function requireBrowser() {
  if (hasRequiredBrowser)
    return browser;
  hasRequiredBrowser = 1;
  browser = function() {
    return noop;
  };
  function noop() {
  }
  return browser;
}
(function(module) {
  let gpxParser = function() {
    this.xmlSource = "", this.metadata = {}, this.waypoints = [], this.tracks = [], this.routes = [];
  };
  gpxParser.prototype.parse = function(e) {
    let t = this, l = new window.DOMParser();
    this.xmlSource = l.parseFromString(e, "text/xml");
    let r2 = this.xmlSource.querySelector("metadata");
    if (null != r2) {
      this.metadata.name = this.getElementValue(r2, "name"), this.metadata.desc = this.getElementValue(r2, "desc"), this.metadata.time = this.getElementValue(r2, "time");
      let e2 = {}, t2 = r2.querySelector("author");
      if (null != t2) {
        e2.name = this.getElementValue(t2, "name"), e2.email = {};
        let l3 = t2.querySelector("email");
        null != l3 && (e2.email.id = l3.getAttribute("id"), e2.email.domain = l3.getAttribute("domain"));
        let r3 = {}, a3 = t2.querySelector("link");
        null != a3 && (r3.href = a3.getAttribute("href"), r3.text = this.getElementValue(a3, "text"), r3.type = this.getElementValue(a3, "type")), e2.link = r3;
      }
      this.metadata.author = e2;
      let l2 = {}, a2 = this.queryDirectSelector(r2, "link");
      null != a2 && (l2.href = a2.getAttribute("href"), l2.text = this.getElementValue(a2, "text"), l2.type = this.getElementValue(a2, "type"), this.metadata.link = l2);
    }
    var a = [].slice.call(this.xmlSource.querySelectorAll("wpt"));
    for (let e2 in a) {
      var n = a[e2];
      let l2 = {};
      l2.name = t.getElementValue(n, "name"), l2.sym = t.getElementValue(n, "sym"), l2.lat = parseFloat(n.getAttribute("lat")), l2.lon = parseFloat(n.getAttribute("lon"));
      let r3 = parseFloat(t.getElementValue(n, "ele"));
      l2.ele = isNaN(r3) ? null : r3, l2.cmt = t.getElementValue(n, "cmt"), l2.desc = t.getElementValue(n, "desc");
      let i2 = t.getElementValue(n, "time");
      l2.time = null == i2 ? null : new Date(i2), t.waypoints.push(l2);
    }
    var i = [].slice.call(this.xmlSource.querySelectorAll("rte"));
    for (let e2 in i) {
      let l2 = i[e2], r3 = {};
      r3.name = t.getElementValue(l2, "name"), r3.cmt = t.getElementValue(l2, "cmt"), r3.desc = t.getElementValue(l2, "desc"), r3.src = t.getElementValue(l2, "src"), r3.number = t.getElementValue(l2, "number");
      let a2 = t.queryDirectSelector(l2, "type");
      r3.type = null != a2 ? a2.innerHTML : null;
      let n2 = {}, o2 = l2.querySelector("link");
      null != o2 && (n2.href = o2.getAttribute("href"), n2.text = t.getElementValue(o2, "text"), n2.type = t.getElementValue(o2, "type")), r3.link = n2;
      let u2 = [];
      var s = [].slice.call(l2.querySelectorAll("rtept"));
      for (let e3 in s) {
        let l3 = s[e3], r4 = {};
        r4.lat = parseFloat(l3.getAttribute("lat")), r4.lon = parseFloat(l3.getAttribute("lon"));
        let a3 = parseFloat(t.getElementValue(l3, "ele"));
        r4.ele = isNaN(a3) ? null : a3;
        let n3 = t.getElementValue(l3, "time");
        r4.time = null == n3 ? null : new Date(n3), u2.push(r4);
      }
      r3.distance = t.calculDistance(u2), r3.elevation = t.calcElevation(u2), r3.slopes = t.calculSlope(u2, r3.distance.cumul), r3.points = u2, t.routes.push(r3);
    }
    var o = [].slice.call(this.xmlSource.querySelectorAll("trk"));
    for (let e2 in o) {
      let l2 = o[e2], r3 = {};
      r3.name = t.getElementValue(l2, "name"), r3.cmt = t.getElementValue(l2, "cmt"), r3.desc = t.getElementValue(l2, "desc"), r3.src = t.getElementValue(l2, "src"), r3.number = t.getElementValue(l2, "number");
      let a2 = t.queryDirectSelector(l2, "type");
      r3.type = null != a2 ? a2.innerHTML : null;
      let n2 = {}, i2 = l2.querySelector("link");
      null != i2 && (n2.href = i2.getAttribute("href"), n2.text = t.getElementValue(i2, "text"), n2.type = t.getElementValue(i2, "type")), r3.link = n2;
      let s2 = [], p = [].slice.call(l2.querySelectorAll("trkpt"));
      for (let e3 in p) {
        var u = p[e3];
        let l3 = {};
        l3.lat = parseFloat(u.getAttribute("lat")), l3.lon = parseFloat(u.getAttribute("lon"));
        let r4 = parseFloat(t.getElementValue(u, "ele"));
        l3.ele = isNaN(r4) ? null : r4;
        let a3 = t.getElementValue(u, "time");
        l3.time = null == a3 ? null : new Date(a3), s2.push(l3);
      }
      r3.distance = t.calculDistance(s2), r3.elevation = t.calcElevation(s2), r3.slopes = t.calculSlope(s2, r3.distance.cumul), r3.points = s2, t.tracks.push(r3);
    }
  }, gpxParser.prototype.getElementValue = function(e, t) {
    let l = e.querySelector(t);
    return null != l ? null != l.innerHTML ? l.innerHTML : l.childNodes[0].data : l;
  }, gpxParser.prototype.queryDirectSelector = function(e, t) {
    let l = e.querySelectorAll(t), r2 = l[0];
    if (l.length > 1) {
      let l2 = e.childNodes;
      for (idx in l2)
        elem = l2[idx], elem.tagName === t && (r2 = elem);
    }
    return r2;
  }, gpxParser.prototype.calculDistance = function(e) {
    let t = {}, l = 0, r2 = [];
    for (var a = 0; a < e.length - 1; a++)
      l += this.calcDistanceBetween(e[a], e[a + 1]), r2[a] = l;
    return r2[e.length - 1] = l, t.total = l, t.cumul = r2, t;
  }, gpxParser.prototype.calcDistanceBetween = function(e, t) {
    let l = {};
    l.lat = e.lat, l.lon = e.lon;
    let r2 = {};
    r2.lat = t.lat, r2.lon = t.lon;
    var a = Math.PI / 180, n = l.lat * a, i = r2.lat * a, s = Math.sin((r2.lat - l.lat) * a / 2), o = Math.sin((r2.lon - l.lon) * a / 2), u = s * s + Math.cos(n) * Math.cos(i) * o * o;
    return 6371e3 * (2 * Math.atan2(Math.sqrt(u), Math.sqrt(1 - u)));
  }, gpxParser.prototype.calcElevation = function(e) {
    for (var t = 0, l = 0, r2 = {}, a = 0; a < e.length - 1; a++) {
      let r3 = e[a + 1].ele, n2 = e[a].ele;
      if (null !== r3 && null !== n2) {
        let e2 = parseFloat(r3) - parseFloat(n2);
        e2 < 0 ? l += e2 : e2 > 0 && (t += e2);
      }
    }
    for (var n = [], i = 0, s = (a = 0, e.length); a < s; a++) {
      if (null !== e[a].ele) {
        var o = parseFloat(e[a].ele);
        n.push(o), i += o;
      }
    }
    return r2.max = Math.max.apply(null, n) || null, r2.min = Math.min.apply(null, n) || null, r2.pos = Math.abs(t) || null, r2.neg = Math.abs(l) || null, r2.avg = i / n.length || null, r2;
  }, gpxParser.prototype.calculSlope = function(e, t) {
    let l = [];
    for (var r2 = 0; r2 < e.length - 1; r2++) {
      let a = e[r2], n = 100 * (e[r2 + 1].ele - a.ele) / (t[r2 + 1] - t[r2]);
      l.push(n);
    }
    return l;
  }, gpxParser.prototype.toGeoJSON = function() {
    var e = { type: "FeatureCollection", features: [], properties: { name: this.metadata.name, desc: this.metadata.desc, time: this.metadata.time, author: this.metadata.author, link: this.metadata.link } };
    for (idx in this.tracks) {
      let r2 = this.tracks[idx];
      var t = { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} };
      for (idx in t.properties.name = r2.name, t.properties.cmt = r2.cmt, t.properties.desc = r2.desc, t.properties.src = r2.src, t.properties.number = r2.number, t.properties.link = r2.link, t.properties.type = r2.type, r2.points) {
        let e2 = r2.points[idx];
        (l = []).push(e2.lon), l.push(e2.lat), l.push(e2.ele), t.geometry.coordinates.push(l);
      }
      e.features.push(t);
    }
    for (idx in this.routes) {
      let r2 = this.routes[idx];
      t = { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} };
      for (idx in t.properties.name = r2.name, t.properties.cmt = r2.cmt, t.properties.desc = r2.desc, t.properties.src = r2.src, t.properties.number = r2.number, t.properties.link = r2.link, t.properties.type = r2.type, r2.points) {
        let e2 = r2.points[idx];
        var l;
        (l = []).push(e2.lon), l.push(e2.lat), l.push(e2.ele), t.geometry.coordinates.push(l);
      }
      e.features.push(t);
    }
    for (idx in this.waypoints) {
      let l2 = this.waypoints[idx];
      (t = { type: "Feature", geometry: { type: "Point", coordinates: [] }, properties: {} }).properties.name = l2.name, t.properties.sym = l2.sym, t.properties.cmt = l2.cmt, t.properties.desc = l2.desc, t.geometry.coordinates = [l2.lon, l2.lat, l2.ele], e.features.push(t);
    }
    return e;
  }, requireBrowser()(), module.exports = gpxParser;
})(GPXParser_min);
var GPXParser_minExports = GPXParser_min.exports;
const GPXParser = /* @__PURE__ */ getDefaultExportFromCjs(GPXParser_minExports);
const routeInfosmodel = {
  lat: "",
  lon: "",
  timestamp: "",
  heading: "",
  tws: "",
  twa: "",
  twd: "",
  sail: "",
  speed: "",
  stamina: "",
  boost: ""
};
function createEmptyRoute(rid, name, skipperName, color, displayedName) {
  if (!rid || !name)
    return;
  if (!mapState.route[rid])
    mapState.route[rid] = [];
  if (mapState.route[rid][name])
    delete mapState.route[rid][name];
  mapState.route[rid][name] = [];
  const currentRoute = mapState.route[rid][name];
  currentRoute.points = [];
  currentRoute.displayed = true;
  currentRoute.displayedName = displayedName;
  currentRoute.loaded = false;
  currentRoute.skipperName = skipperName;
  currentRoute.color = color;
}
function addNewPoints(rid, name, routeInfoData) {
  var _a, _b;
  const hasRoute = !!((_b = (_a = mapState == null ? void 0 : mapState.route) == null ? void 0 : _a[rid]) == null ? void 0 : _b[name]);
  if (!hasRoute || !routeInfoData)
    return;
  mapState.route[rid][name].points.push(routeInfoData);
}
function importGPXRoute(race2, gpxFile, routerName, skipperName, color) {
  var _a, _b;
  const raceInfo2 = getRaceInfo();
  if (!raceInfo2 || !gpxFile)
    return;
  const rid = raceInfo2.raceId + "-" + raceInfo2.legNum;
  let gpx = new GPXParser();
  gpx.parse(gpxFile);
  let gpxPoints;
  if (!gpx || !gpx.routes && !gpx.tracks && !gpx.waypoints)
    return "";
  if (Array.isArray(gpx.routes) && ((_a = gpx.routes[0]) == null ? void 0 : _a.points))
    gpxPoints = gpx.routes[0].points;
  else if (Array.isArray(gpx.tracks) && ((_b = gpx.tracks[0]) == null ? void 0 : _b.points))
    gpxPoints = gpx.tracks[0].points;
  else if (Array.isArray(gpx.waypoints))
    gpxPoints = gpx.waypoints;
  else
    return "";
  const routeName = cleanSpecial(routerName + " " + skipperName);
  createEmptyRoute(rid, routeName, skipperName, color, routerName + " " + skipperName);
  gpxPoints.forEach(function(pt) {
    const lat = Number(pt.lat);
    const lon = Number(pt.lon);
    const routeData = Object.create(routeInfosmodel);
    routeData.lat = lat;
    routeData.lon = lon;
    routeData.timestamp = Date.parse(pt.time);
    routeData.heading = "";
    routeData.tws = "";
    routeData.twa = "";
    routeData.twd = "";
    routeData.sail = "";
    routeData.speed = "";
    routeData.stamina = "";
    routeData.boost = "";
    routeData.desc = pt.desc;
    addNewPoints(rid, routeName, routeData);
  });
  return routeName;
}
function importExternalRouter(rid, fileTxt, routerName, skipperName, color, mode) {
  if (!rid || !fileTxt)
    return "";
  let poi = new Array();
  let i = 0;
  fileTxt = fileTxt.replace("\r", "");
  const lineAvl = fileTxt.split("\n");
  if (lineAvl.length <= 1) {
    return "";
  }
  const routeName = cleanSpecial(routerName + " " + skipperName);
  createEmptyRoute(rid, routeName, skipperName, color, routerName + " " + skipperName);
  let currentYear = /* @__PURE__ */ new Date();
  currentYear = currentYear.getFullYear();
  let previousMonth = 0;
  const totalLines = lineAvl.length - 2;
  if (mode == 1)
    totalLines = lineAvl.length - 1;
  while (i < totalLines) {
    i = i + 1;
    if (i > totalLines)
      i = totalLines;
    poi = lineAvl[i].replace(/\,/g, ".").split(";");
    let isoDate, hdg, tws, twa, twd, sail, stw, lat, lon, splitDate, heure, date, stamina, boost;
    if (mode == 1) {
      lat = Number(poi[3]);
      lon = Number(poi[4]);
      hdg = poi[5] + "°";
      tws = roundTo(poi[12], 2) + " kts";
      stw = roundTo(poi[10], 2) + " kts";
      splitDate = poi[0].split(" ");
      heure = splitDate[1];
      if (splitDate[0].includes("/")) {
        date = splitDate[0].split("/");
        if (date[0].length > 2)
          isoDate = splitDate[0] + " " + heure;
        else
          isoDate = date[2] + "-" + date[1] + "-" + date[0] + " " + heure;
        isoDate += " GMT";
      } else if (splitDate[0].includes("-")) {
        date = splitDate[0].split("-");
        if (date[0].length > 2)
          isoDate = splitDate[0] + " " + heure;
        else
          isoDate = date[2] + "-" + date[1] + "-" + date[0] + " " + heure;
        isoDate += " GMT";
      } else
        isoDate = poi[0] + " GMT";
      sail = renameSailFromRoutes(poi[15]);
      twa = roundTo(poi[6], 2) + "°";
      twd = roundTo(poi[11], 2) + "°";
      stamina = roundTo(poi[24], 2);
      boost = roundTo(poi[16], 2);
    } else if (mode == 4) {
      splitDate = poi[0].split(" ");
      let latB = splitDate[0].replace("�", "°").replace(".", "'") + " " + splitDate[1];
      let lonB = splitDate[3].replace("�", "°").replace(".", "'") + " " + splitDate[4];
      const posDec = convertDMS2Dec(latB, lonB);
      lat = posDec.lat;
      lon = posDec.lon;
      hdg = poi[4] + "°";
      tws = roundTo(poi[5], 2) + " kts";
      twd = roundTo(poi[6], 2) + "°";
      stw = roundTo(poi[3], 2) + " kts";
      twa = "-";
      sail = "-";
      splitDate = poi[1].split(" ");
      heure = splitDate[1];
      date = splitDate[0].split("/");
      isoDate = date[0] + "-" + date[1] + "-" + date[2] + " " + heure;
    } else {
      const isNumber = (n) => (typeof n === "number" || n instanceof Number || typeof n === "string" && !isNaN(n)) && isFinite(n);
      if (isNumber(poi[1])) {
        lat = Number(poi[1]);
        lon = Number(poi[2]);
      } else {
        let posDec = convertDMS2Dec(poi[1], poi[2]);
        lat = posDec.lat;
        lon = posDec.lon;
      }
      hdg = poi[3] + "°";
      tws = roundTo(poi[8], 2) + " kts";
      stw = roundTo(poi[4], 2) + " kts";
      splitDate = poi[0].split(" ");
      heure = splitDate[1] + ":00";
      date = splitDate[0].split("/");
      if (previousMonth == 0)
        previousMonth = date[1];
      if (previousMonth == 12 && date[1] == 1)
        ;
      isoDate = currentYear + "-" + date[1] + "-" + date[0] + " " + heure;
      if (poi[6] > 180)
        poi[6] -= 360;
      twa = roundTo(poi[6], 2) + "°";
      twd = roundTo(poi[7], 2) + "°";
      if (isNumber(poi[5]))
        sail = "(" + poi[5] + ")";
      else
        sail = renameSailFromRoutes(poi[5]);
      stamina = roundTo(poi[9], 2);
      boost = roundTo(poi[10], 2);
    }
    const routeData = Object.create(routeInfosmodel);
    routeData.lat = lat;
    routeData.lon = lon;
    routeData.timestamp = Date.parse(isoDate);
    routeData.heading = hdg;
    routeData.tws = tws;
    routeData.twa = twa;
    routeData.twd = twd;
    routeData.sail = sail;
    routeData.speed = stw;
    routeData.stamina = stamina;
    routeData.boost = boost;
    addNewPoints(rid, routeName, routeData);
  }
  return routeName;
}
function importExtraPattern(rid, fileTxt, routerName, skipperName, color) {
  if (!rid || !fileTxt)
    return "";
  let poi = new Array();
  let i = 0;
  fileTxt = fileTxt.replace("\r", "");
  let lineAvl = fileTxt.split("\n");
  if (lineAvl.length <= 1)
    return "";
  const routeName = cleanSpecial(routerName + " " + skipperName);
  createEmptyRoute(rid, routeName, skipperName, color, routerName + " " + skipperName);
  while (i < lineAvl.length - 2) {
    i = i + 1;
    if (i > lineAvl.length - 2)
      i = lineAvl.length - 2;
    poi = lineAvl[i].replace(/\,/g, ".").split(";");
    const routeData = Object.create(routeInfosmodel);
    routeData.lat = Number(poi[0]);
    routeData.lon = Number(poi[1]);
    routeData.timestamp = "-";
    routeData.heading = "-";
    routeData.tws = "-";
    routeData.twa = "-";
    routeData.twd = "-";
    routeData.sail = "-";
    routeData.speed = "-";
    addNewPoints(race.id, routeName, routeData);
  }
  return routeName;
}
function renameSailFromRoutes(sailName) {
  if (sailName && sailName !== void 0) {
    switch (sailName) {
      case '"HeavyGnk-foils"':
      case '"HeavyGnk"':
      case "Spi lourd":
      case '"HEAVY_GNK"':
      case '"HEAVY_GNK-foils"':
        sailName = "HG";
        break;
      case '"LightGnk-foils"':
      case '"LightGnk"':
      case "Spi leger":
      case '"LIGHT_GNK"':
      case '"LIGHT_GNK-foils"':
        sailName = "LG";
        break;
      case '"Code0-foils"':
      case '"Code0"':
      case "Code 0":
      case '"CODE_0"':
      case '"CODE_0-foils"':
        sailName = "C0";
        break;
      case '"Staysail-foils"':
      case '"Staysail"':
      case "Staysail":
      case '"Trinquette"':
      case '"STAYSAIL"':
      case '"STAYSAIL-foils"':
        sailName = "Stay";
        break;
      case '"LightJib-foils"':
      case '"LightJib"':
      case "Genois leger":
      case '"LIGHT_JIB"':
      case '"LIGHT_JIB-foils"':
        sailName = "LJ";
        break;
      case '"Jib-foils"':
      case '"Jib"':
      case "Jib":
      case '"JIB"':
      case '"JIB-foils"':
        sailName = "Jib";
        break;
      case '"Spi-foils"':
      case '"Spi"':
      case "Spi":
      case '"SPI"':
      case '"SPI-foils"':
        sailName = "Spi";
        break;
    }
  }
  return sailName;
}
const pattern = /1;\sleft\s:([-]{0,1}[0-9]{1,})px;\stop:([0-9]{1,})px;"\s*onmouseover="updi\(event,'([0-9]{4}-[0-9]{2}-[0-9]{2})\s([0-9]{2}:[0-9]{2})\s([A-Z]{3,4})\s\((T[+]{1}\s?[0-9]{1,3}:[0-9]{2})\)<br>Distances:&nbsp;([0-9]{1,4}.[0-9]{1}nm)\/([0-9]{1,4}.[0-9]{1}nm)<br><b>Wind:<\/b>\s([0-9]{1,3})&deg;\s([0-9]{1,2}.[0-9]{1}\skt)\s\(<b>TWA\s([-]{0,1}[0-9]{1,3})&deg;<\/b>\)<br><b>Heading:<\/b>\s([0-9]{1,3})&deg;<b>Sail:<\/b>\s([a-zA-Z0]{2,4})<br><b>Boat\sSpeed:<\/b>\s([0-9]{1,3}.[0-9]{1,2}\skts)/;
let rtx_idx = [];
function getLatitude(top, scale) {
  return 90 - (parseInt(top) + 2) / scale;
}
function getLongitude(left, scale) {
  left = parseInt(left);
  if (left + 2 / scale >= -180 || left + 2 / scale <= 180) {
    return (left + 2) / scale;
  } else {
    return (left + 2) / scale - 360;
  }
}
function zezoCall(rid, playerIte, color, raceUrl, timeoutMs = 1e4) {
  const baseURL = "http://zezo.org";
  const url = baseURL + "/" + raceUrl + "/chart.pl?lat=" + playerIte.pos.lat + "&lon=" + playerIte.pos.lon + (playerIte.iteDate ? "&ts=" + playerIte.iteDate / 1e3 : "") + "&o=" + playerIte.options + "&twa=" + playerIte.twa + "&userid=" + playerIte.userId + "&auto=no";
  const btn = document.getElementById("bt_rt_addLmap");
  const setBusy = (busy) => {
    if (!btn)
      return;
    btn.innerText = busy ? "Import..." : "Import";
    btn.disabled = !!busy;
  };
  setBusy(true);
  let controller, timeoutId;
  try {
    controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort("timeout"), timeoutMs);
    return fetch(url, { cache: "no-store", signal: controller.signal }).then((res) => res.ok ? res.text() : false).then((text) => {
      if (!text)
        return false;
      const result = text.split(pattern);
      let routeName = "zezo " + playerIte.info.name;
      let routeNameClean = cleanSpecial(routeName);
      rtx_idx[rid] ?? (rtx_idx[rid] = {});
      const idxForRace = rtx_idx[rid];
      idxForRace[routeNameClean] = (idxForRace[routeNameClean] ?? -1) + 1;
      const n = idxForRace[routeNameClean];
      if (n > 0) {
        routeName += " " + n;
        routeNameClean = cleanSpecial(routeName);
      }
      createEmptyRoute(rid, routeNameClean, playerIte.info.name, color, routeName);
      const mScale = /var scale = ([0-9]+)/.exec(result[0] ?? "");
      const scale = (mScale == null ? void 0 : mScale[1]) ? Number(mScale[1]) : null;
      if (!scale)
        return false;
      for (let i = 0; i < result.length - 1; i += 15) {
        const datas = result.slice(i + 1, i + 15);
        if (datas.length < 14)
          continue;
        const [left, top, date, time, timezone, ttw, dtw, dtg, twd, tws, twa, btw, sail, stw] = datas;
        let isoDate = String(date).replaceAll("/", "-");
        isoDate += "T" + time + ":00";
        if (timezone == "UTC")
          isoDate += ".000+00:00";
        const routeData = Object.create(routeInfosmodel);
        routeData.lat = getLatitude(top, scale);
        routeData.lon = getLongitude(left, scale);
        routeData.timestamp = Date.parse(isoDate);
        routeData.heading = btw + "°";
        routeData.tws = tws + "s";
        routeData.twa = twa + "°";
        routeData.twd = twd + "°";
        routeData.sail = sail;
        routeData.speed = stw;
        addNewPoints(rid, routeNameClean, routeData);
      }
      updateRouteListHTML();
      displayMapTrace(rid, routeNameClean);
      return true;
    }).catch((err) => {
      if ((err == null ? void 0 : err.name) === "AbortError") {
        console.warn(`zezoCall: timeout after ${timeoutMs}ms`, err);
        return false;
      }
      console.error("zezoCall error:", err);
      return false;
    }).finally(() => {
      clearTimeout(timeoutId);
      setBusy(false);
    });
  } catch (err) {
    console.error("zezoCall sync error:", err);
    clearTimeout(timeoutId);
    setBusy(false);
    return Promise.resolve(false);
  }
}
let popupStateLmap = false;
var actualZezoColor = "#AA0000";
var actualAvalon06Color = "#005500";
var actualVRZenColor = "#499300";
var actualgpxColor = "#009349";
function loadRacingSkipperList(elt) {
  const selectobject = document.getElementById(elt);
  const options = selectobject.getElementsByTagName("OPTION");
  const optionsSelect = selectobject.value;
  let optionsSelectStillExist = false;
  for (let i = 0; i < options.length; i++) {
    selectobject.removeChild(options[i]);
    i--;
  }
  const raceItesFleet = getLegFleetInfos();
  const connectedPlayerId2 = getConnectedPlayerId();
  const fln = Object.fromEntries(
    Object.entries(raceItesFleet).filter(([, p]) => p.state !== "Arrived").sort(
      ([, a], [, b]) => a.info.name.localeCompare(b.info.name, "fr", { sensitivity: "base" })
    ).map(([userId, p]) => [userId, {
      userId,
      name: p.info.name,
      options: p.options,
      type: p.ite.type,
      type2: p.ite.type2,
      choice: p.ite.choice,
      state: p.ite.state
    }])
  );
  Object.entries(fln).forEach(([key, value]) => {
    if (isDisplayEnabled(value, key, connectedPlayerId2)) {
      const option = document.createElement("option");
      let optionK = "";
      if (!value.options || value.options == "?")
        optionK = " (*)";
      option.text = value.name + optionK;
      option.value = value.userId;
      if (key == optionsSelect)
        optionsSelectStillExist = true;
      document.getElementById(elt).appendChild(option);
    }
  });
  if (optionsSelectStillExist)
    selectobject.value = optionsSelect;
  onSkipperSelectedChange("Lmap");
}
function onPopupOpenLmap() {
  const raceInfo2 = getRaceInfo$1();
  if (!raceInfo2 || popupStateLmap)
    return;
  popupStateLmap = true;
  document.getElementById("rt_popupLmap").style.display = "block";
  document.getElementById("sel_rt_skipperLmap").style.display = "block";
  document.getElementById("rt_nameSkipperLmap").style.display = "none";
  document.getElementById("rt_extraFormat2Lmap").style.display = "flex";
  document.getElementById("rt_extraFormat3Lmap").style.display = "flex";
  document.getElementById("sel_routeTypeLmap").value = "rt_Zezo";
  document.getElementById("route_colorLmap").value = actualZezoColor;
  loadRacingSkipperList("sel_rt_skipperLmap");
  onChangeRouteTypeLmap();
}
function onPopupCloseLmap() {
  popupStateLmap = false;
  document.getElementById("rt_popupLmap").style.display = "none";
}
function onCleanAllRoute() {
  deleteAllRoutes();
  document.getElementById("route_list_tableLmap").innerHTML = "";
}
function onChangeRouteTypeLmap() {
  const routeType = document.getElementById("sel_routeTypeLmap").value;
  switch (routeType) {
    default:
      return;
    case "rt_Zezo":
      document.getElementById("sel_rt_skipperLmap").style.display = "block";
      document.getElementById("rt_nameSkipperLmap").style.display = "none";
      document.getElementById("route_colorLmap").value = actualZezoColor;
      document.getElementById("rt_extraFormat2Lmap").style.display = "flex";
      document.getElementById("rt_extraFormat3Lmap").style.display = "flex";
      document.getElementById("rt_popupLmap").style.height = "9.5em";
      break;
    case "rt_Avalon":
      document.getElementById("sel_rt_skipperLmap").style.display = "none";
      document.getElementById("rt_nameSkipperLmap").style.display = "block";
      document.getElementById("rt_nameSkipperLmap").value = document.getElementById("lb_boatname").textContent;
      document.getElementById("rt_nameSkipperLmap").setAttribute("placeholder", "Add custom name...");
      document.getElementById("route_colorLmap").value = actualAvalon06Color;
      document.getElementById("rt_extraFormat2Lmap").style.display = "none";
      document.getElementById("rt_extraFormat3Lmap").style.display = "none";
      document.getElementById("rt_popupLmap").style.height = "6em";
      break;
    case "rt_VRZen":
      document.getElementById("sel_rt_skipperLmap").style.display = "none";
      document.getElementById("rt_nameSkipperLmap").style.display = "block";
      document.getElementById("rt_nameSkipperLmap").value = document.getElementById("lb_boatname").textContent;
      document.getElementById("rt_nameSkipperLmap").setAttribute("placeholder", "Add custom name...");
      document.getElementById("route_colorLmap").value = actualVRZenColor;
      document.getElementById("rt_extraFormat2Lmap").style.display = "none";
      document.getElementById("rt_extraFormat3Lmap").style.display = "none";
      document.getElementById("rt_popupLmap").style.height = "6em";
      break;
    case "rt_gpx":
      document.getElementById("sel_rt_skipperLmap").style.display = "none";
      document.getElementById("rt_nameSkipperLmap").style.display = "block";
      document.getElementById("rt_nameSkipperLmap").value = document.getElementById("lb_boatname").textContent;
      document.getElementById("rt_nameSkipperLmap").setAttribute("placeholder", "Add custom name...");
      document.getElementById("route_colorLmap").value = actualgpxColor;
      document.getElementById("rt_extraFormat2Lmap").style.display = "none";
      document.getElementById("rt_extraFormat3Lmap").style.display = "none";
      document.getElementById("rt_popupLmap").style.height = "6em";
      break;
  }
}
async function loadExternalFile(rid, type) {
  let tf = ".gpx";
  let routeType = "Gpx";
  let routeFormat = 3;
  if (type == "rt_Avalon") {
    tf = ".csv";
    routeType = "Avalon ";
    routeFormat = 0;
  } else if (type == "rt_VRZen") {
    tf = ".csv";
    routeType = "VR Zen ";
    routeFormat = 1;
  } else if (type == "rt_gpx") {
    tf = ".gpx";
    routeType = "Gpx ";
    routeFormat = 3;
  } else if (type == "rt_Pattern") {
    tf = ".csv";
  } else if (type == "rt_dorado") {
    tf = ".csv";
    routeType = "Dorado ";
    routeFormat = 4;
  }
  const pickerOpts = {
    types: [
      {
        description: "Routage",
        accept: {
          "track/*": [tf]
        }
      }
    ],
    excludeAcceptAllOption: true,
    multiple: false
  };
  let fileHandle;
  [fileHandle] = await window.showOpenFilePicker(pickerOpts);
  const fileH = await fileHandle.getFile();
  const fileData = await fileH.text();
  if (type == "rt_Avalon" || type == "rt_VRZen" || type == "rt_dorado") {
    return importExternalRouter(
      rid,
      fileData,
      routeType,
      document.getElementById("rt_nameSkipperLmap").value,
      document.getElementById("route_colorLmap").value,
      routeFormat
    );
  } else if (type == "rt_gpx") {
    return importGPXRoute(
      rid,
      fileData,
      "Gpx",
      document.getElementById("rt_nameSkipperLmap").value,
      document.getElementById("route_colorLmap").value
    );
  } else if (type == "rt_Pattern") {
    return importExtraPattern(
      rid,
      fileData,
      "contour",
      document.getElementById("rt_nameSkipperLmap").value,
      document.getElementById("route_colorLmap").value
    );
  }
}
function buildPlayerOption(type) {
  const pOptions = {
    reach: false,
    light: false,
    heavy: false,
    hull: false,
    foil: false,
    winch: false,
    comfortLoungePug: false,
    magicFurler: false,
    vrtexJacket: false
  };
  if (getCheckbox("opt_FP_" + type)) {
    pOptions.reach = true;
    pOptions.light = true;
    pOptions.heavy = true;
    pOptions.hull = true;
    pOptions.foil = true;
    pOptions.winch = true;
    pOptions.comfortLoungePug = true;
    pOptions.magicFurler = true;
    pOptions.vrtexJacket = true;
  } else {
    if (getCheckbox("opt_hgss_" + type))
      pOptions.heavy = true;
    if (getCheckbox("opt_ljg_" + type))
      pOptions.light = true;
    if (getCheckbox("opt_c0_" + type))
      pOptions.reach = true;
    if (getCheckbox("opt_foils_" + type))
      pOptions.foil = true;
    if (getCheckbox("opt_hull_" + type))
      pOptions.hull = true;
    if (getCheckbox("opt_winch_" + type))
      pOptions.winch = true;
  }
  return pOptions;
}
async function onAddRouteLmap() {
  const routeType = document.getElementById("sel_routeTypeLmap").value;
  const raceInfo2 = getRaceInfo$1();
  if (!raceInfo2)
    return;
  const rid = raceInfo2.raceId + "-" + raceInfo2.legNum;
  let routeName = "";
  switch (routeType) {
    default:
      return;
    case "rt_Zezo":
      if (!raceInfo2.url) {
        alert("Unknown race - no routing available");
        return;
      }
      const raceItesFleet = getLegFleetInfos();
      const playerId = document.getElementById("sel_rt_skipperLmap").value;
      if (!raceItesFleet || !raceItesFleet[playerId]) {
        alert("Unknown player - no routing available");
        return;
      }
      const playerIte = raceItesFleet[playerId];
      playerIte.options = buildPlayerOption("Lmap");
      const raceUrl = raceInfo2.url + (raceInfo2.betaflag ? "b" : "");
      document.getElementById("bt_rt_addLmap").innerText = "Loading";
      document.getElementById("bt_rt_addLmap").disabled = true;
      zezoCall(rid, playerIte, document.getElementById("route_colorLmap").value, raceUrl);
      actualZezoColor = "#" + Math.floor(Math.random() * 16777216).toString(16).padStart(6, "0");
      document.getElementById("route_colorLmap").value = actualZezoColor;
      break;
    case "rt_Avalon":
      routeName = await loadExternalFile(rid, "rt_Avalon");
      break;
    case "rt_VRZen":
      routeName = await loadExternalFile(rid, "rt_VRZen");
      break;
    case "rt_gpx":
      routeName = await loadExternalFile(rid, "rt_gpx");
      break;
  }
  if (routeName != "") {
    updateRouteListHTML();
    displayMapTrace(rid, routeName);
  }
}
function upDateCheckbox(elt, value) {
  var checkBox = document.getElementById(elt);
  if (checkBox) {
    checkBox.checked = value;
    var event = new Event("change");
    checkBox.dispatchEvent(event);
  }
}
function getCheckbox(elt) {
  var checkBox = document.getElementById(elt);
  if (checkBox)
    return checkBox.checked;
  else
    return null;
}
function onSkipperSelectedChange(type) {
  var _a;
  const raceInfo2 = getRaceInfo$1();
  if (!raceInfo2)
    return;
  const raceItesFleet = getLegFleetInfos();
  const playerId = document.getElementById("sel_rt_skipperLmap").value;
  if (!raceItesFleet || !raceItesFleet[playerId]) {
    alert("Unknown player - no routing available");
    return;
  }
  upDateCheckbox("opt_c0_" + type, false);
  upDateCheckbox("opt_ljg_" + type, false);
  upDateCheckbox("opt_hgss_" + type, false);
  upDateCheckbox("opt_hull_" + type, false);
  upDateCheckbox("opt_foils_" + type, false);
  upDateCheckbox("opt_winch_" + type, false);
  upDateCheckbox("opt_FP_" + type, false);
  const playerIteOpt = (_a = raceItesFleet[playerId]) == null ? void 0 : _a.options;
  if (playerIteOpt.options) {
    const pOptions = playerIteOpt.options;
    if (pOptions.options.reach)
      upDateCheckbox("opt_c0_" + type, true);
    if (pOptions.options.light)
      upDateCheckbox("opt_ljg_" + type, true);
    if (pOptions.options.heavy)
      upDateCheckbox("opt_hgss_" + type, true);
    if (pOptions.options.hull)
      upDateCheckbox("opt_hull_" + type, true);
    if (pOptions.options.foil)
      upDateCheckbox("opt_foils_" + type, true);
    if (pOptions.options.winch)
      upDateCheckbox("opt_winch_" + type, true);
    if (pOptions.options.reach && pOptions.options.light && pOptions.options.heavy && pOptions.options.hull && pOptions.options.foil && pOptions.options.winch && pOptions.options.comfortLoungePug && pOptions.options.magicFurler && pOptions.options.vrtexJacket)
      upDateCheckbox("opt_FP_" + type, true);
    else
      upDateCheckbox("opt_FP_" + type, false);
  } else if (playerIteOpt.guessOptions && playerIteOpt.guessOptions != 0) {
    const pOptions = playerIteOpt.guessOptions;
    if (isBitSet(pOptions, guessOptionBits["reach"]))
      upDateCheckbox("opt_c0_" + type, true);
    if (isBitSet(pOptions, guessOptionBits["light"]))
      upDateCheckbox("opt_ljg_" + type, true);
    if (isBitSet(pOptions, guessOptionBits["heavy"]))
      upDateCheckbox("opt_hgss_" + type, true);
    if (isBitSet(pOptions, guessOptionBits["winchDetected"]) && isBitSet(pOptions, guessOptionBits["winch"]))
      upDateCheckbox("opt_winch_" + type, true);
    if (isBitSet(pOptions, guessOptionBits["foilDetected"]) && isBitSet(pOptions, guessOptionBits["foil"]))
      upDateCheckbox("opt_foils_" + type, true);
    if (isBitSet(pOptions, guessOptionBits["hullDetected"]) && isBitSet(pOptions, guessOptionBits["hull"]))
      upDateCheckbox("opt_hull_" + type, true);
  }
}
function onRouteListClick(target) {
  var _a, _b;
  const raceInfo2 = getRaceInfo$1();
  if (!raceInfo2)
    return;
  const rid = raceInfo2.raceId + "-" + raceInfo2.legNum;
  const lbl = (_a = target.closest) == null ? void 0 : _a.call(target, 'label[id^="lbl_rt_name_Lmap:"]');
  if (lbl) {
    const name = lbl.id.slice("lbl_rt_name_Lmap:".length);
    if (rid && mapState.route[rid][name]) {
      if (mapState.route[rid][name].displayed) {
        mapState.route[rid][name].displayed = false;
        document.getElementById("sel_rt_name_Lmap:" + name).checked = false;
        hideRoute(name);
      } else {
        mapState.route[rid][name].displayed = true;
        document.getElementById("sel_rt_name_Lmap:" + name).checked = true;
        showRoute(name);
      }
    }
    return;
  }
  const color = (_b = target.closest) == null ? void 0 : _b.call(target, 'input[type="color"][id^="color_rt_name_Lmap:"]');
  if (color) {
    const name = color.id.slice("color_rt_name_Lmap:".length);
    const value = color.value;
    if (rid && mapState.route[rid][name]) {
      if (mapState.route[rid][name].color != value) {
        mapState.route[rid][name].color = value;
        document.getElementById("color_rt_name_Lmap:" + name).value = mapState.route[rid][name].color;
        importRoute(mapState.route[rid][name], name);
      }
    }
    return;
  }
}
function updateRouteListHTML() {
  const raceInfo2 = getRaceInfo$1();
  if (!raceInfo2)
    return;
  const rid = raceInfo2.raceId + "-" + raceInfo2.legNum;
  var tableBody = "<tbody>";
  var routeList = mapState.route[rid];
  if (routeList) {
    Object.keys(routeList).forEach(function(name) {
      tableBody += '<tr class="rt_lst_line">';
      tableBody += '<td class="rt_lst_name noBorderElt">';
      tableBody += '<input type="checkbox" id="';
      tableBody += "sel_rt_name_Lmap:" + name;
      tableBody += '" name="checkbox3" class="content hidden"';
      if (routeList[name].displayed)
        tableBody += "checked";
      tableBody += ">";
      tableBody += '<label for:"sel_rt_name_Lmap:' + name + '" id="lbl_rt_name_Lmap:' + name + '">';
      tableBody += routeList[name].displayedName + "</label>";
      tableBody += "</td>";
      tableBody += '<td class="rt_lst_color noBorderElt">';
      tableBody += '<input  type="color" id="color_rt_name_Lmap:' + name + '" value="';
      tableBody += routeList[name].color + '">';
      tableBody += "</td>";
      tableBody += "</tr>";
    });
  }
  tableBody += "</tbody>";
  document.getElementById("route_list_tableLmap").innerHTML = tableBody;
}
function displayMapTrace(rid, routeName) {
  var _a, _b;
  const route = (_b = (_a = mapState == null ? void 0 : mapState.route) == null ? void 0 : _a[rid]) == null ? void 0 : _b[routeName];
  if (!route)
    return;
  importRoute(route, routeName);
  route.displayed = true;
  document.getElementById("sel_rt_name_Lmap:" + routeName).checked = true;
}
function showsMapHelp() {
  var msg = `Affichage des traits de côtes :
- Zoomer sur la zone de la carte où vous souhaitez afficher les traits de côtes. Ils apparaissent automatiquement en bleu après quelques instants. Pour afficher une zone différente, dézoomez et zommez à l'endroit désiré.
- La couleur des traits de côtes peut être personnalisée (Sélection couleur 'Côtes')

Importer un routage :
- Zezo : importer automatiquement la route suggérée par Zezo en cliquant sur 'Import'.
- Avalon : depuis votre logiciel Avalon, exportez votre route au format CSV et importez le fichier.
- VRZen : depuis le site du routeur VRZen, exportez votre route au format CSV et importez le fichier.
- Autre : importez un fichier au format GPX après avoir sélectionné son emplacement.

Copier les coordonnées pointées par la souris :
- Appuyez en même temps sur les touches de votre clavier : CTRL + B (ou Cmd + B sur Mac). Les coordonnées seront copiées dans le Presse-papier. Pour les réutiliser, il faudra réaliser l'action "Coller" (CTRL + V).

Outil Règle :
- Pour l'utiliser, il faut activer l'outil en cliquant sur le bouton. Puis, un premier clic gauche sur un emplacement de la carte début le tracé de mesure, un second clic gauche termine le tracé de mesure et permet de débuter un nouveau tracé de mesure. Les tracés terminés restent affichés tant que l'outil est activé.
- La touche « Echap » annule le tracé de mesure en cours non terminé. Une deuxième pression sur cette touche désactive l'outil.`;
  alert(msg);
}
function initUIBindings(items) {
  items.forEach(({ selector, onChange, onInit }) => {
    const el = document.querySelector(selector);
    if (!el) {
      console.warn(`⚠️ Élément non trouvé pour ${selector}`);
      return;
    }
    let eventTypes = [];
    if (el.tagName === "TABLE") {
      eventTypes = ["click", "change"];
    } else if (["BUTTON", "IMG", "A", "LABEL", "DIV", "SPAN"].includes(el.tagName)) {
      eventTypes = ["click"];
    } else if (el.tagName === "INPUT") {
      const type = el.getAttribute("type") || "text";
      if (["button", "submit", "image"].includes(type))
        eventTypes = ["click"];
      else if (["number", "text", "range"].includes(type))
        eventTypes = ["input"];
      else
        eventTypes = ["change"];
    } else if (el.tagName === "SELECT" || el.tagName === "TEXTAREA") {
      eventTypes = ["change", "input"];
    } else {
      eventTypes = ["click"];
    }
    const getValue = (target = el) => {
      if (!target)
        return null;
      if (target.tagName === "IMG")
        return target.src;
      if (target.tagName === "SELECT")
        return target.value;
      if (target.tagName === "BUTTON")
        return target.value || target.textContent;
      if (target.tagName === "INPUT") {
        switch (target.type) {
          case "checkbox":
            return target.checked;
          case "number":
            return parseFloat(target.value);
          default:
            return target.value;
        }
      }
      return null;
    };
    eventTypes.forEach((eventType) => {
      el.addEventListener(eventType, (ev) => {
        const target = ev.target;
        const val = getValue(target);
        onChange == null ? void 0 : onChange(val, ev, target);
      });
    });
    if (typeof onInit === "function") {
      onInit(getValue(el), el);
    }
  });
}
function uiBindingInit() {
  document.addEventListener("click", clickManager);
  initUIBindings([
    {
      selector: "#sel_race",
      onChange: (value) => {
      },
      onInit: (value, el) => {
        el.value = 0;
      }
    },
    /*    {
          selector: '#sel_lang',
          onChange: (value) => {const userPrefs = getUserPrefs(); userPrefs.lang = value;saveUserPrefs(userPrefs);},
          onInit: (value, el) => {const userPrefs = getUserPrefs();  el.value = userPrefs.lang}
        },*/
    {
      selector: "#auto_router",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.router.auto = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.router.auto;
      }
    },
    {
      selector: "#sel_router",
      onChange: (value) => {
        const userPrefs = getUserPrefs();
        userPrefs.router.sel = value;
        saveUserPrefs(userPrefs);
      },
      onInit: (value, el) => {
        const userPrefs = getUserPrefs();
        el.value = userPrefs.router.sel;
      }
    },
    {
      selector: "#nmea_output",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.nmea.enable = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.nmea.enable;
      }
    },
    {
      selector: "#sel_nmeaport",
      onChange: (value) => {
        const userPrefs = getUserPrefs();
        userPrefs.nmea.port = value;
        saveUserPrefs(userPrefs);
      },
      onInit: (value, el) => {
        const userPrefs = getUserPrefs();
        el.value = userPrefs.nmea.port;
      }
    },
    {
      selector: "#color_theme",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.theme = checked ? "dark" : "light";
        saveUserPrefs(userPrefs);
        switchTheme(userPrefs.theme);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.theme == "dark";
      }
    },
    {
      selector: "#reuse_tab",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.global.reuseTab = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.global.reuseTab;
      }
    },
    {
      selector: "#local_time",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.global.localTime = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.global.localTime;
      }
    },
    {
      selector: "#uiFilterMode",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.global.alternateFilter = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.global.alternateFilter;
      }
    },
    {
      selector: "#vrzenPositionFormat",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.global.separatorPos = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.global.separatorPos;
      }
    },
    {
      selector: "#ITYC_record",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.global.ITYCSend = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.global.ITYCSend;
      }
    },
    {
      selector: "#sel_polarSite",
      onChange: (value) => {
        const userPrefs = getUserPrefs();
        userPrefs.global.polarSite = value;
        saveUserPrefs(userPrefs);
      },
      onInit: (value, el) => {
        const userPrefs = getUserPrefs();
        el.value = userPrefs.global.polarSite;
      }
    },
    {
      selector: "#fullScreen_Size",
      onChange: (value) => {
        const userPrefs = getUserPrefs();
        userPrefs.drawing.ratio = value;
        saveUserPrefs(userPrefs);
      },
      onInit: (value, el) => {
        const userPrefs = getUserPrefs();
        el.value = userPrefs.drawing.ratio;
      }
    },
    {
      selector: "#fullScreen_Game",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.drawing.fullScreen = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.drawing.fullScreen;
      }
    },
    {
      selector: "#showBVMGSpeed",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.raceData.VMGSpeed = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.raceData.VMGSpeed;
      }
    },
    {
      selector: "#with_LastCommand",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.raceData.lastCmd = checked;
        saveUserPrefs(userPrefs);
      },
      //todo add racestatus redraw
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.raceData.lastCmd;
      }
    },
    {
      selector: "#hideCommandsLines",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.raceLog.hideLastCmd = checked;
        saveUserPrefs(userPrefs);
      },
      //todo add racelog redraw
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.raceLog.hideLastCmd;
      }
    },
    {
      selector: "#racelog_rank",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.raceLog.column.rank = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.raceLog.column.rank;
      }
    },
    {
      selector: "#racelog_dtl",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.raceLog.column.DTL = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.raceLog.column.DTL;
      }
    },
    {
      selector: "#racelog_dtf",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.raceLog.column.DTF = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.raceLog.column.DTF;
      }
    },
    {
      selector: "#racelog_reportedSpeed",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.raceLog.column.vR = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.raceLog.column.vR;
      }
    },
    {
      selector: "#racelog_calcSpeed",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.raceLog.column.vC = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.raceLog.column.vC;
      }
    },
    {
      selector: "#racelog_foils",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.raceLog.column.foil = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.raceLog.column.foil;
      }
    },
    {
      selector: "#racelog_factor",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.raceLog.column.factor = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.raceLog.column.factor;
      }
    },
    {
      selector: "#racelog_stamina",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.raceLog.column.stamina = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.raceLog.column.stamina;
      }
    },
    {
      selector: "#racelog_deltaDistance",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.raceLog.column.deltaD = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.raceLog.column.deltaD;
      }
    },
    {
      selector: "#racelog_deltaTime",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.raceLog.column.deltaT = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.raceLog.column.deltaT;
      }
    },
    {
      selector: "#racelog_position",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.raceLog.column.position = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.raceLog.column.position;
      }
    },
    {
      selector: "#track_infos",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.map.trace = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.map.trace;
      }
    },
    {
      selector: "#projectionLine_Size",
      onChange: (value) => {
        const userPrefs = getUserPrefs();
        userPrefs.map.projectionLineLenght = value;
        saveUserPrefs(userPrefs);
      },
      onInit: (value, el) => {
        const userPrefs = getUserPrefs();
        el.value = userPrefs.map.projectionLineLenght;
      }
    },
    {
      selector: "#view_InvisibleDoors",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.map.invisibleBuoy = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.map.invisibleBuoy;
      }
    },
    {
      selector: "#abbreviatedOption",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.fleet.shortOption = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.fleet.shortOption;
      }
    },
    {
      selector: "#auto_clean",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.fleet.cleaning = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.fleet.cleaning;
      }
    },
    {
      selector: "#auto_cleanInterval",
      onChange: (value) => {
        const userPrefs = getUserPrefs();
        userPrefs.map.cleaningInterval = value;
        saveUserPrefs(userPrefs);
      },
      onInit: (value, el) => {
        const userPrefs = getUserPrefs();
        el.value = userPrefs.map.cleaningInterval;
      }
    },
    {
      selector: "#sailRankRaceId",
      onChange: (value) => {
        const userPrefs = getUserPrefs();
        userPrefs.map.sailRankId = value;
        saveUserPrefs(userPrefs);
      },
      onInit: (value, el) => {
        const userPrefs = getUserPrefs();
        el.value = userPrefs.map.sailRankId;
      }
    },
    {
      selector: "#fleet_team",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.fleet.column.team = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.fleet.column.team;
      }
    },
    {
      selector: "#fleet_rank",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.fleet.column.rank = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.fleet.column.rank;
      }
    },
    {
      selector: "#fleet_racetime",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.fleet.column.raceTime = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.fleet.column.raceTime;
      }
    },
    {
      selector: "#fleet_dtu",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.fleet.column.DTU = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.fleet.column.DTU;
      }
    },
    {
      selector: "#fleet_dtf",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.fleet.column.DTF = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.fleet.column.DTF;
      }
    },
    {
      selector: "#fleet_twd",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.fleet.column.TWD = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.fleet.column.TWD;
      }
    },
    {
      selector: "#fleet_tws",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.fleet.column.TWS = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.fleet.column.TWS;
      }
    },
    {
      selector: "#fleet_twa",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.fleet.column.TWA = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.fleet.column.TWA;
      }
    },
    {
      selector: "#fleet_hdg",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.fleet.column.HDG = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.fleet.column.HDG;
      }
    },
    {
      selector: "#fleet_speed",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.fleet.column.speed = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.fleet.column.speed;
      }
    },
    {
      selector: "#fleet_vmg",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.fleet.column.VMG = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.fleet.column.VMG;
      }
    },
    {
      selector: "#fleet_sail",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.fleet.column.sail = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.fleet.column.sail;
      }
    },
    {
      selector: "#fleet_factor",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.fleet.column.factor = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.fleet.column.factor;
      }
    },
    {
      selector: "#fleet_foils",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.fleet.column.foil = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.fleet.column.foil;
      }
    },
    {
      selector: "#fleet_position",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.fleet.column.position = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.fleet.column.position;
      }
    },
    {
      selector: "#fleet_options",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.fleet.column.option = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.fleet.column.option;
      }
    },
    {
      selector: "#fleet_state",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.fleet.column.state = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.fleet.column.state;
      }
    },
    {
      selector: "#fleet_remove",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.fleet.column.select = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.fleet.column.select;
      }
    },
    {
      selector: "#sel_Seperator",
      onChange: (value) => {
        const userPrefs = getUserPrefs();
        userPrefs.separator = value;
        saveUserPrefs(userPrefs);
      },
      onInit: (value, el) => {
        const userPrefs = getUserPrefs();
        el.value = userPrefs.separator;
      }
    },
    {
      selector: "#bt_router",
      onChange: () => {
      }
    },
    {
      selector: "#sel_showMarkersLmap",
      onChange: async (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.map.showMarkers = checked ? false : true;
        await saveUserPrefs(userPrefs);
        onMarkersChange();
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.map.showMarkers;
      }
    },
    {
      selector: "#sel_showTracksLmap",
      onChange: async (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.map.showTracks = checked ? false : true;
        await saveUserPrefs(userPrefs);
        hideShowTracks();
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.map.showTracks;
      }
    },
    {
      selector: "#sel_borderColorLmap",
      onChange: async (value) => {
        const userPrefs = getUserPrefs();
        userPrefs.map.borderColor = value;
        await saveUserPrefs(userPrefs);
        onCoastColorChange();
      },
      onInit: (value, el) => {
        const userPrefs = getUserPrefs();
        el.value = userPrefs.map.borderColor;
      }
    },
    {
      selector: "#sel_projectionColorLmap",
      onChange: async (value) => {
        const userPrefs = getUserPrefs();
        userPrefs.map.projectionColor = value;
        await saveUserPrefs(userPrefs);
      },
      onInit: (value, el) => {
        const userPrefs = getUserPrefs();
        el.value = userPrefs.map.projectionColor;
      }
    },
    {
      selector: "#projectionLine_Size",
      onChange: async (value) => {
        const userPrefs = getUserPrefs();
        userPrefs.map.projectionLineLenght = value;
        await saveUserPrefs(userPrefs);
      },
      onInit: (value, el) => {
        const userPrefs = getUserPrefs();
        el.value = userPrefs.map.projectionLineLenght;
      }
    },
    {
      selector: "#lbl_rt_openLmap",
      onChange: () => {
        onPopupOpenLmap();
      }
    },
    {
      selector: "#rt_close_popupLmap",
      onChange: () => {
        onPopupCloseLmap();
      }
    },
    {
      selector: "#sel_routeTypeLmap",
      onChange: (value) => {
        onChangeRouteTypeLmap();
      },
      onInit: (value, el) => {
      }
    },
    {
      selector: "#lbl_helpLmap",
      onChange: () => {
        showsMapHelp();
      }
    },
    {
      selector: "#route_list_tableLmap",
      onChange: (value, el, target) => {
        onRouteListClick(target);
      }
    },
    {
      selector: "#bt_rt_addLmap",
      onChange: async () => {
        await onAddRouteLmap();
      }
    },
    {
      selector: "#lbl_rt_cleanLmap",
      onChange: () => {
        onCleanAllRoute();
      }
    },
    {
      selector: "#sel_rt_skipperLmap",
      onChange: (value) => {
        onSkipperSelectedChange("Lmap");
      }
    }
  ]);
}
let initDone = null;
document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ DOM start !");
  await loadUserPrefs();
  await initMemo();
  await initCachedTilesList();
  onPlayerConnect();
  doDbListener();
  updateRaceListDisplay();
  uiBindingInit();
  buildRaceStatusHtml();
  tabSwitch();
  onRaceOpen();
  initializeDom();
  initDone = true;
  const repeater = startRepeating(() => {
  }, 5e3);
  setTimeout(() => repeater.stop(), 2e4);
});
function initializeDom() {
  document.getElementById("rt_popupLmap").style.display = "none";
  document.getElementById("sel_routeTypeLmap").value = "rt_Zezo";
}
function doDbListener() {
  const connectedUserListener = createKeyChangeListener("internal", "lastLoggedUser");
  connectedUserListener.start({
    referenceValue: { loggedUser: getConnectedPlayerId() },
    onChange: async ({ oldValue, newValue }) => {
      if (newValue.loggedUser && initDone) {
        setConnectedPlayerId(newValue.loggedUser);
        await updatePlayersList();
        await updateTeamsList();
        await updateConnectedPlayerInfos();
        await updateLegPlayerInfos();
        await updateLegPlayersOrder();
        onPlayerConnect();
      }
    }
  });
  const connectedLeglistListener = createKeyChangeListener("internal", "legListUpdate");
  connectedLeglistListener.start({
    referenceValue: { ts: getLegListUpdate() },
    onChange: async ({ oldValue, newValue }) => {
      if ((newValue == null ? void 0 : newValue.ts) != getLegListUpdate() && initDone) {
        setLegListUpdate(newValue.ts);
        await updateLegList();
        await updatePolar();
        updateRaceListDisplay();
        buildRaceStatusHtml();
        tabSwitch();
      }
    }
  });
  const connectedPlayersListener = createKeyChangeListener("internal", "playersUpdate");
  connectedPlayersListener.start({
    referenceValue: { ts: getPlayersUpdate() },
    onChange: async ({ oldValue, newValue }) => {
      if ((newValue == null ? void 0 : newValue.ts) != getPlayersUpdate() && initDone) {
        setPlayersUpdate(newValue.ts);
        await updatePlayersList();
        await updateTeamsList();
        await updateConnectedPlayerInfos();
        await updateLegFleetInfos();
        await updateLegPlayerInfos();
        await updateLegPlayersOrder();
        tabSwitch();
      }
    }
  });
  const teamsListener = createKeyChangeListener("internal", "teamsUpdate");
  teamsListener.start({
    referenceValue: { ts: getTeamsUpdate() },
    onChange: async ({ oldValue, newValue }) => {
      if ((newValue == null ? void 0 : newValue.ts) != getTeamsUpdate() && initDone) {
        setTeamsUpdate(newValue.ts);
        await updateTeamsList();
        await updateConnectedPlayerInfos();
        await updateLegFleetInfos();
        await updateLegPlayerInfos();
        await updateLegPlayersOrder();
        tabSwitch();
      }
    }
  });
  const polarListener = createKeyChangeListener("internal", "polarsUpdate");
  polarListener.start({
    referenceValue: { ts: getPolarsUpdate() },
    onChange: async ({ oldValue, newValue }) => {
      if ((newValue == null ? void 0 : newValue.ts) != getPolarsUpdate() && initDone) {
        setPolarsUpdate(newValue.ts);
        await updatePolar();
        tabSwitch();
      }
    }
  });
  const legPlayerInfosListener = createKeyChangeListener("internal", "legPlayersInfosDashUpdate");
  legPlayerInfosListener.start({
    referenceValue: { ts: getLegPlayersInfosUpdate() },
    onChange: async ({ oldValue, newValue }) => {
      if ((newValue == null ? void 0 : newValue.ts) != getLegPlayersInfosUpdate() && initDone) {
        setLegPlayersInfosUpdate(newValue.ts);
        await updateLegPlayerInfos();
        await updateLegPlayersOrder();
        buildRaceStatusHtml();
        tabSwitch();
      }
    }
  });
  const legFleetInfosListener = createKeyChangeListener("internal", "legFleetInfosDashUpdate");
  legFleetInfosListener.start({
    referenceValue: { ts: getLegFleetInfosUpdate() },
    onChange: async ({ oldValue, newValue }) => {
      if ((newValue == null ? void 0 : newValue.ts) != getLegFleetInfosUpdate() && initDone) {
        setLegFleetInfosUpdate(newValue.ts);
        await updateLegFleetInfos();
        buildRaceStatusHtml();
        tabSwitch();
      }
    }
  });
  const legPlayersOptionsListener = createKeyChangeListener("internal", "legPlayersOptionsUpdate");
  legPlayersOptionsListener.start({
    referenceValue: { ts: getLegPlayersOptionsUpdate() },
    onChange: async ({ oldValue, newValue }) => {
      if ((newValue == null ? void 0 : newValue.ts) != getLegPlayersOptionsUpdate() && initDone) {
        setLegPlayersOptionsUpdate(newValue.ts);
        await updateLegPlayersOptions();
        tabSwitch();
      }
    }
  });
  const legPlayersOrdersListener = createKeyChangeListener("internal", "legPlayersOrderUpdate");
  legPlayersOrdersListener.start({
    referenceValue: { ts: getLegPlayersOrderUpdate() },
    onChange: async ({ oldValue, newValue }) => {
      if ((newValue == null ? void 0 : newValue.ts) != getLegPlayersOrderUpdate() && initDone) {
        setLegPlayersOrderUpdate(newValue.ts);
        await updateLegPlayersOrder();
        buildRaceStatusHtml();
        tabSwitch();
      }
    }
  });
  const connectedRaceListener = createKeyChangeListener("internal", "lastOpennedRace");
  connectedRaceListener.start({
    referenceValue: (() => {
      const opened = getOpenedRaceId == null ? void 0 : getOpenedRaceId();
      return {
        raceId: (opened == null ? void 0 : opened.raceId) ?? null,
        legNum: (opened == null ? void 0 : opened.legNum) ?? null
      };
    })(),
    onChange: async ({ oldValue, newValue }) => {
      const openedRace = getOpenedRaceId == null ? void 0 : getOpenedRaceId();
      const sameRace = (newValue == null ? void 0 : newValue.raceId) === (openedRace == null ? void 0 : openedRace.raceId) && (newValue == null ? void 0 : newValue.legNum) === (openedRace == null ? void 0 : openedRace.legNum);
      if (!sameRace && initDone) {
        setOpenedRaceId(newValue == null ? void 0 : newValue.raceId, newValue == null ? void 0 : newValue.legNum);
        await updateOpenedRaceId();
        await updatePolar();
        await updateLegPlayersOptions();
        await updateLegFleetInfos();
        await updateLegPlayerInfos();
        await updateLegPlayersOrder();
        await updateLegPlayersTracks();
        onRaceOpen();
        buildRaceStatusHtml();
        tabSwitch();
      }
    }
  });
  const legPlayersTracksListener = createKeyChangeListener("internal", "playersTracksUpdate");
  legPlayersTracksListener.start({
    referenceValue: { ts: getLegPlayersTracksUpdate() },
    onChange: async ({ oldValue, newValue }) => {
      if ((newValue == null ? void 0 : newValue.ts) != getLegPlayersTracksUpdate() && initDone) {
        setLegPlayersTracksUpdate(newValue.ts);
        await updateLegPlayersTracks();
        tabSwitch();
      }
    }
  });
}
function startRepeating(callback, interval = 5e3) {
  callback();
  const id = setInterval(callback, interval);
  return {
    stop() {
      clearInterval(id);
      console.log("⏹️ Interval stopped");
    }
  };
}
//# sourceMappingURL=app.js.map
