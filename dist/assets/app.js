import "./modulepreload-polyfill-7faf532e.js";
import { g as getData, a as getAllData, b as getLatestEntriesPerUser, c as getEntriesForTriplet, d as getLegPlayersOptionsByRaceLeg, r as raceTableHeaders, e as roundTo, f as formatHM, h as formatTimeNotif, i as raceTableLines, j as infoSail, k as getUserPrefs, l as genthRacelog, m as dateUTCSmall, D as DateUTC, s as sailNames, n as formatPosition, o as formatSeconds, p as getxFactorStyle, q as gentdRacelog, t as getBG, u as genth, v as category$1, w as sailColors$1, x as gentd, y as formatTime, z as formatDHMS, A as formatShortDate, B as categoryStyleDark$1, C as categoryStyle$1, E as isBitSet, F as guessOptionBits, G as getRankingCategory, H as creditsMaxAwardedByPriceLevel, I as formatTimestampToReadableDate, J as gcDistance, K as display_selbox, L as changeState, M as saveUserPrefs, N as switchTheme, O as loadUserPrefs, P as createKeyChangeListener } from "./common-eb028e3b.js";
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
  } else {
    raceList = [];
    raceInfo = [];
    legFleetInfos = [];
    legPlayerInfos = [];
    legPlayerInfosHistory = [];
    legPlayersOptions = [];
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
function getRaceInfo() {
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
    const map2 = /* @__PURE__ */ Object.create(null);
    let foundRaceInfo = null;
    for (const leg of filtered) {
      const fullRaceId = `${leg.raceId}-${leg.legNum}`;
      map2[fullRaceId] = {
        raceId: leg.raceId,
        legNum: leg.legNum,
        name: leg.legName
      };
      if ((openedRaceId == null ? void 0 : openedRaceId.raceId) != null && (openedRaceId == null ? void 0 : openedRaceId.legNum) != null && openedRaceId.raceId === leg.raceId && openedRaceId.legNum === leg.legNum) {
        foundRaceInfo = leg;
      }
    }
    raceList = map2;
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
function getLegPlayersOrder$1() {
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
function getLegPlayersTracksFleet() {
  return legPlayersTracks.fleet ? legPlayersTracks.fleet : [];
}
function getLegPlayersTrackLeader() {
  return legPlayersTracks.leader ? legPlayersTracks.leader : [];
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
  const raceInfo2 = getRaceInfo();
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
  const userPrefs = getUserPrefs();
  const connectedRace = getOpenedRaceId();
  const raceInfo2 = getRaceInfo();
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
  let tableContent = buildRaceStatusHtmlLine(raceInfo2, raceItes.ites[0]);
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
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
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
    info += "<br/><span>@ " + r.record.lastRankingGateName + "</span>";
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
  const tack = manoeuver ? "<p>-" + manoeuver.tack.pena.dist + "nm | " + manoeuver.tack.pena.time + "s</p><p>-" + manoeuver.tack.energyLoose + "% | " + manoeuver.tack.energyRecovery + "min</p>" : "-";
  const gybe = manoeuver ? "<p>-" + manoeuver.gybe.pena.dist + "nm | " + manoeuver.gybe.pena.time + "s</p><p>-" + manoeuver.gybe.energyLoose + "% | " + manoeuver.gybe.energyRecovery + "min</p>" : "-";
  const sail = manoeuver ? "<p>-" + manoeuver.sail.pena.dist + "nm | " + manoeuver.sail.pena.time + "s</p><p>-" + manoeuver.sail.energyLoose + "% | " + manoeuver.sail.energyRecovery + "min</p>" : "-";
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
    if (raceIte.metaDash.chocoBoost != 0) {
      fullStamina += "🍫+" + roundTo(raceIte.metaDash.chocoBoost, 2) + "%";
      fullStamina += " ⌚" + formatHM(raceIte.metaDash.chocoExp - Date.now());
    }
    fullStamina += "</div>";
    fullStamina += "<div " + staminaStyle + ">";
    fullStamina += staminaTxt;
    fullStamina += "</div>";
    fullStamina += '<div class="textMini">';
    if (raceIte.metaDash.coffeeBoost != 0) {
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
  returnVal += '<td class="speed2">' + (((_j = raceIte.metaDash) == null ? void 0 : _j.vmg) ? roundTo(raceIte.metaDash.vmg, 3) : "-") + "</td>";
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
  returnVal += '<td class="man" style="background-color:' + mnvrBG + ';">' + (((_k = raceIte.metaDash) == null ? void 0 : _k.manoeuvering) ? "Yes" : "No") + "</td>";
  if (userPrefs.raceData.lastCmd)
    returnVal += "<td " + lastCommandBG + '">' + lastCommand + "</td>";
  returnVal += '<td><span style="color:' + itycLedColor + ';font-size:16px;"><b>&#9679</b></span></td>';
  returnVal += "</tr>";
  return returnVal;
}
function buildRaceLogHtml() {
  const userPrefs = getUserPrefs();
  const raceInfo2 = getRaceInfo();
  const racePlayerInfos = getLegPlayerInfos();
  const raceOrder = getLegPlayersOrder$1();
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
  for (let idx = 0; idx < raceItes.length; idx++) {
    const raceLogLine = raceItes[idx];
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
  const iteDash2 = raceIte.metaDash;
  const userPrefs = getUserPrefs();
  const darkTheme = userPrefs.theme == "dark";
  if (!raceIte.tws || !iteDash2)
    return "";
  let speedCStyle = "";
  let speedTStyle = "";
  let deltaDist = "";
  if ("deltaD" in iteDash2 && "speedC" in iteDash2 && "deltaD_T" in iteDash2) {
    deltaDist = roundTo(iteDash2.deltaD, 3);
    if (isDifferingSpeed(raceIte.speed, iteDash2.speedC)) {
      speedCStyle = 'style="background-color: yellow;';
      speedCStyle += darkTheme ? ' color:black;"' : '"';
    } else if (iteDash2.speedT && isDifferingSpeed(raceIte.speed)) {
      speedTStyle = 'style="background-color: ' + (darkTheme ? "darkred" : "LightRed") + ';"';
      deltaDist = deltaDist + " (" + roundTo(iteDash2.deltaD_T, 3) + ")";
    }
  }
  if (iteDash2.manoeuvering) {
    speedCStyle = 'style="background-color: ' + (darkTheme ? "darkred" : "LightRed") + ';"';
  }
  const sailChange = formatSeconds(raceIte.tsEndOfSailChange - raceIte.iteDate);
  const gybing = formatSeconds(raceIte.tsEndOfGybe - raceIte.iteDate);
  const tacking = formatSeconds(raceIte.tsEndOfTack - raceIte.iteDate);
  let staminaStyle = "";
  let staminaTxt = "-";
  const stamina = iteDash2.realStamina;
  const paramStamina2 = getParamStamina();
  if (stamina) {
    if (stamina < (paramStamina2 == null ? void 0 : paramStamina2.tiredness[0]))
      staminaStyle = 'style="color:red"';
    else if (stamina < (paramStamina2 == null ? void 0 : paramStamina2.tiredness[1]))
      staminaStyle = 'style="color:orange"';
    else
      staminaStyle = 'style="color:green"';
    staminaTxt = roundTo(stamina, 2) + "%";
    staminaTxt += iteDash2.manoeuver.staminaFactor ? " (x" + roundTo(iteDash2.manoeuver.staminaFactor, 2) + ")" : "";
  }
  const xfactorStyle = getxFactorStyle(raceIte);
  let xfactorTxt = roundTo(iteDash2.xfactor, 4);
  if (iteDash2.sailCoverage != 0 && iteDash2.xplained) {
    xfactorTxt += " " + iteDash2.sailCoverage + "%";
  }
  const foilTxt = iteDash2.realFoilFactor == null ? "-" : roundTo(iteDash2.realFoilFactor, 0) + "%";
  return '<tr class="hovred">' + gentdRacelog("time", "time", null, "Time", DateUTC(raceIte.iteDate, 1)) + raceTableLines(raceIte, iteDash2.bVmg) + infoSail(raceIte, false, false) + gentdRacelog("speed1", "reportedSpeed", null, "vR (kn)", roundTo(raceIte.speed, 3)) + gentdRacelog("speed2", "calcSpeed", speedCStyle, "vC (kn)", roundTo(iteDash2.speedC, 3) + " (" + sailNames[raceIte.sail % 10] + ")") + gentdRacelog("foils", "foils", null, "Foils", foilTxt) + gentdRacelog("xfactor", "factor", xfactorStyle, "Factor", xfactorTxt) + gentdRacelog("stamina", "stamina", staminaStyle, "Stamina", stamina ? roundTo(stamina, 2) + "%" : "-") + gentdRacelog("deltaD", "deltaDistance", speedTStyle, "Δd (nm)", deltaDist) + gentdRacelog("deltaT", "deltaTime", null, "Δt (s)", roundTo(iteDash2.deltaT, 0)) + gentdRacelog("position", "position", null, "Position", formatPosition(raceIte.pos.lat, raceIte.pos.lon)) + '<td class="sailPenalties" ' + getBG(iteDash2.tsEndOfSailChange, raceIte.metaDash.previousIteDate) + ">" + sailChange + '</td><td class="gybe" ' + getBG(iteDash2.tsEndOfGybe, iteDash2.previousIteDate) + ">" + gybing + '</td><td class="tack" ' + getBG(iteDash2.tsEndOfTack, iteDash2.previousIteDate) + ">" + tacking + "</td></tr>";
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
function isDisplayEnabled$1(playerIte, userId, connectPlayerId) {
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
  const iteDash2 = ite == null ? void 0 : ite.metaDash;
  switch (sortField2) {
    case "lastCalcDate":
      return (ite == null ? void 0 : ite.dateIte) ?? 0;
    case "displayName":
      return ((_a = pInfos.info) == null ? void 0 : _a.name) ?? "";
    case "teamname":
      return ((_b = pInfos.team) == null ? void 0 : _b.name) ?? "";
    case "rank":
      return (ite == null ? void 0 : ite.rank) ?? Number.POSITIVE_INFINITY;
    case "raceTime":
      return (iteDash2 == null ? void 0 : iteDash2.raceTime) ?? Number.POSITIVE_INFINITY;
    case "distanceToUs":
      return (iteDash2 == null ? void 0 : iteDash2.DTU) ?? Number.POSITIVE_INFINITY;
    case "dtf":
      return (iteDash2 == null ? void 0 : iteDash2.dtf) ?? Number.POSITIVE_INFINITY;
    case "twd":
      return (ite == null ? void 0 : ite.twd) ?? (iteDash2 == null ? void 0 : iteDash2.twd) ?? 0;
    case "tws":
      return (ite == null ? void 0 : ite.tws) ?? 0;
    case "twa":
      return Math.abs((ite == null ? void 0 : ite.twa) ?? 0);
    case "heading":
      return (ite == null ? void 0 : ite.hdg) ?? 0;
    case "speed":
      return (ite == null ? void 0 : ite.speed) ?? 0;
    case "vmg":
      return (iteDash2 == null ? void 0 : iteDash2.vmg) ?? 0;
    case "sail":
      return (ite == null ? void 0 : ite.sail) ?? 0;
    case "xfactor":
      return (iteDash2 == null ? void 0 : iteDash2.xfactor) ?? 0;
    case "xoption_foils":
      return (iteDash2 == null ? void 0 : iteDash2.realFoilFactor) ?? 0;
    case "startDate":
      return (ite == null ? void 0 : ite.startDate) ?? 0;
    case "eRT":
      return (iteDash2 == null ? void 0 : iteDash2.eRT) ?? Number.POSITIVE_INFINITY;
    case "avgSpeed":
      return (iteDash2 == null ? void 0 : iteDash2.avgSpeed) ?? 0;
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
  const raceInfo2 = getRaceInfo();
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
  let raceFleetTableHeader = "<tr>" + genth("th_rt", "RT", "Call Router", void 0) + genth("th_lu", "Date" + dateUTCSmall(), void 0, sortField2 == "lastCalcDate", sortAsc) + genth("th_name", "Skipper", void 0, sortField2 == "displayName", sortAsc) + genth("th_teamname", "Team", void 0, sortField2 == "teamname", sortAsc) + genth("th_rank", "Rank", void 0, sortField2 == "rank", sortAsc) + (raceInfo2.type !== "record" ? genth("th_racetime", "RaceTime", "Current Race Time", sortField2 == "raceTime", sortAsc) : "") + genth("th_dtu", "DTU", "Distance to Us", sortField2 == "distanceToUs", sortAsc) + genth("th_dtf", "DTF", "Distance to Finish", sortField2 == "dtf", sortAsc) + genth("th_twd", "TWD", "True Wind Direction", sortField2 == "twd", sortAsc) + genth("th_tws", "TWS", "True Wind Speed", sortField2 == "tws", sortAsc) + genth("th_twa", "TWA", "True Wind Angle", sortField2 == "twa", sortAsc) + genth("th_hdg", "HDG", "Heading", sortField2 == "heading", sortAsc) + genth("th_speed", "Speed", "Boat Speed", sortField2 == "speed", sortAsc) + genth("th_vmg", "VMG", "Velocity Made Good", sortField2 == "vmg", sortAsc) + genth("th_sail", "Sail", "Sail Used", sortField2 == "sail", sortAsc) + genth("th_factor", "Factor", "Speed factor over no-options boat", sortField2 == "xfactor", sortAsc) + genth("th_foils", "Foils", "Boat assumed to have Foils. Unknown if no foiling conditions", sortField2 == "xoption_foils", sortAsc);
  if (raceInfo2.type === "record") {
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
  const iteDash2 = playerIte.metaDash;
  if (!iteDash2)
    return "";
  const userPrefs = getUserPrefs();
  const darkTheme = userPrefs.theme == "dark";
  const userId = playerIte.userId;
  const isDisplay = isDisplayEnabled$1(playerIte, userId, connectedPlayerId2) && (!userPrefs.filters.inRace || r.state == "racing");
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
  const xfactorStyle = iteDash2 ? getxFactorStyle(playerIte) : "";
  let xfactorTxt = "-";
  if (iteDash2) {
    xfactorTxt = roundTo(iteDash2.xfactor, 4);
    if (iteDash2.sailCoverage != 0 && iteDash2.xplained) {
      xfactorTxt += " " + iteDash2.sailCoverage + "%";
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
  const categoryIdx = category$1.indexOf(playerIte.type);
  const nameStyle = userId == connectedPlayerId2 ? "color: #b86dff; font-weight: bold; " : darkTheme ? categoryStyleDark$1[categoryIdx] : categoryStyle$1[categoryIdx];
  const autoSail = playerIte.sail > 10 ? "<span title='Auto Sails' class='cursorHelp'>&#x24B6;</span>" : "";
  const name = playerIte.type == "sponsor" ? ((_b = playerIte.branding) == null ? void 0 : _b.name) ? playerFleetInfos.info.name + "(" + playerIte.branding.name + ")" : playerFleetInfos.info.name : playerFleetInfos.info.name;
  const sailStyle = sailColors$1[playerIte.sail];
  const sailName = sailNames[playerIte.sail % 10] || "-";
  const foils = (iteDash2 == null ? void 0 : iteDash2.realFoilFactor) == null ? foilsType ? "no" : "?" : roundTo(iteDash2.realFoilFactor, 1) + "%";
  return '<tr class="' + nameClass + ' hovred" id="ui:' + userId + '"><td class="tdc">' + routerIcon + "</td>" + gentd("Time", "", null, formatTime(playerIte.dateIte, 1)) + '<td class="Skipper" style="' + nameStyle + '"><div class="bull">' + bull + "</div> " + name + "</td>" + gentd("Team", "", null, teamName) + gentd("Rank", "", null, playerIte.rank ? playerIte.rank : "-") + (raceInfo2.type !== "record" ? gentd("RaceTime", "", null, iteDash2.raceTime ? formatDHMS(iteDash2.raceTime) : "-") : "") + gentd("DTU", "", null, iteDash2.DTU ? roundTo(iteDash2.DTU, 3) : "-") + gentd("DTF", "", null, iteDash2.dtf == iteDash2.dtfC ? "(" + roundTo(iteDash2.dtfC, 3) + ")" : roundTo(iteDash2.dtf, 3)) + gentd("TWD", "", null, roundTo(playerIte.twd ? playerIte.twd : iteDash2.twd, 3)) + gentd("TWS", "", null, roundTo(playerIte.tws, 3)) + gentd("TWA", twaFG, null, roundTo(Math.abs(playerIte.twa), 3)) + gentd("TWAIcon", 'style="color:grey; align:center; text-align:center;"', null, lock) + gentd("HDG", 'style="color:' + hdgFG + '";"' + hdgBold, null, roundTo(playerIte.hdg, 3)) + gentd("Speed", "", null, roundTo(playerIte.speed, 3)) + gentd("VMG", "", null, roundTo(iteDash2.vmg, 3)) + gentd("Sail", "", null, "<span " + sailStyle + ">&#x25e2&#x25e3  </span>" + sailName) + gentd("SailIcon", 'style="color:grey; align:center; text-align:center;"', null, autoSail) + gentd("Factor", xfactorStyle, null, xfactorTxt) + gentd("Foils", "", null, foils) + recordRaceFields(raceInfo2, playerIte) + gentd("Position", "", null, playerIte.pos ? formatPosition(playerIte.pos.lat, playerIte.pos.lon) : "-") + gentd("Options", optionsStyle, optionsTitle, optionsTxt) + gentd("State", "", txtTitle, iconState) + gentd("Remove", "", null, getLegSelectedPlayersState(userId) && userId != connectedPlayerId2 ? '<span class="removeSelectedBoat" data-id="' + userId + '" title="Remove this boat: ' + name + '">❌</span>' : "") + "</tr>";
}
function recordRaceFields(raceInfo2, playerIte) {
  const userPrefs = getUserPrefs();
  if (raceInfo2.type === "record") {
    const localTimes2 = userPrefs.global.localTime;
    if (playerIte.state === "racing" && playerIte.distanceToEnd) {
      let t;
      if (iteDash.eRT)
        t = '<td class="eRT" title= "End : ' + formatShortDate(iteDash.eRT, void 0, localTimes2) + '">' + formatDHMS(iteDash.eRT) + "</td>";
      else
        t = '<td class="eRT" title= "End : unknow"></td>';
      return '<td class="eRT" title= "Start : ' + formatShortDate(playerIte.startDate, void 0, localTimes2) + '">' + formatDHMS(raceTime) + "</td>" + t + '<td class="avg">' + roundTo(iteDash.avgSpeed, 2) + "</td>";
    } else {
      if (playerIte.startDate && playerIte.state === "racing" && playerIte.startDate != "-") {
        let retVal = '<td class="eRT" title= "Start : ' + formatShortDate(playerIte.startDate, void 0, localTimes2) + '">' + formatDHMS(raceTime) + "</td>";
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
  const raceInfo2 = getRaceInfo();
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
window.POLAR = window.POLAR || {
  enabled: false,
  crs: null,
  wmsLayer: null
};
function hasProj4Leaflet$1() {
  return typeof window !== "undefined" && window.L && L.Proj && typeof window.proj4 === "function";
}
function buildPolarCRS() {
  if (!hasProj4Leaflet$1())
    return null;
  return new L.Proj.CRS(
    "EPSG:3413",
    "+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
    {
      resolutions: [8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1],
      origin: [-4194304, 4194304],
      bounds: L.bounds([-4194304, -4194304], [4194304, 4194304])
    }
  );
}
function createArcticWMS() {
  if (!hasProj4Leaflet$1())
    return null;
  if (!POLAR.crs)
    POLAR.crs = buildPolarCRS();
  return L.tileLayer.wms("https://gibs.earthdata.nasa.gov/wms/epsg3413/best/wms.cgi", {
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
function applyBoundsForCurrentMode(map2) {
  if (mercatorDragHandler && mercatorDragHandlerMapId && map2 && map2._leaflet_id === mercatorDragHandlerMapId) {
    map2.off("drag", mercatorDragHandler);
    mercatorDragHandler = null;
    mercatorDragHandlerMapId = null;
  }
  if (!POLAR.enabled) {
    const bounds = [
      [-89.98155760646617, -270],
      [89.99346179538875, 270]
    ];
    map2.setMaxBounds(bounds);
    mercatorDragHandler = function() {
      map2.panInsideBounds(bounds, { animate: false });
    };
    map2.on("drag", mercatorDragHandler);
    mercatorDragHandlerMapId = map2._leaflet_id;
  } else {
    map2.setMaxBounds(null);
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
    return { center: L.latLng(targetLat, targetLng), zoom: targetZoom };
  }
  const clampedLat = Math.max(-85, Math.min(85, prevLat));
  return { center: L.latLng(clampedLat, normLng), zoom: prevZoom ?? 3 };
}
function initButtonToCenterViewMap(lat, lon, map2) {
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
      if (map2.getZoom() >= defaultZoom)
        defaultZoom = map2.getZoom();
      let lat2 = parseFloat(recenterButton.getAttribute("data-lat"));
      let lon2 = parseFloat(recenterButton.getAttribute("data-lon"));
      map2.setView([lat2, lon2], defaultZoom);
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
const greenRRIcon = L.icon({
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
const redRLIcon = L.icon({
  iconUrl: "../img/redIcon.png",
  shadowUrl: "../img/RLIconShadowNok.png",
  iconSize: [20, 35],
  shadowSize: [53, 51],
  iconAnchor: [10, 35],
  shadowAnchor: [27, 45],
  popupAnchor: [0, -42]
});
const greenRRIconP = L.icon({
  iconUrl: "../img/greenIcon.png",
  shadowUrl: "../img/RRIconShadowOK.png",
  iconSize: [20, 35],
  shadowSize: [53, 51],
  iconAnchor: [10, 35],
  shadowAnchor: [27, 45],
  popupAnchor: [0, -42]
});
const redRLIconP = L.icon({
  iconUrl: "../img/redIcon.png",
  shadowUrl: "../img/RLIconShadowOK.png",
  iconSize: [20, 35],
  shadowSize: [53, 51],
  iconAnchor: [10, 35],
  shadowAnchor: [27, 45],
  popupAnchor: [0, -42]
});
const yellowRRIcon = L.icon({
  iconUrl: "../img/yellowIcon.png",
  shadowUrl: "../img/RRIconShadowNok.png",
  iconSize: [20, 35],
  shadowSize: [53, 51],
  iconAnchor: [10, 35],
  shadowAnchor: [27, 45],
  popupAnchor: [0, -42]
});
const yellowRLIcon = L.icon({
  iconUrl: "../img/yellowIcon.png",
  shadowUrl: "../img/RLIconShadowNok.png",
  iconSize: [20, 35],
  shadowSize: [53, 51],
  iconAnchor: [10, 35],
  shadowAnchor: [27, 45],
  popupAnchor: [0, -42]
});
const yellowRRIconP = L.icon({
  iconUrl: "../img/yellowIcon.png",
  shadowUrl: "../img/RRIconShadowOK.png",
  iconSize: [20, 35],
  shadowSize: [53, 51],
  iconAnchor: [10, 35],
  shadowAnchor: [27, 45],
  popupAnchor: [0, -42]
});
const yellowRLIconP = L.icon({
  iconUrl: "../img/yellowIcon.png",
  shadowUrl: "../img/RLIconShadowOK.png",
  iconSize: [20, 35],
  shadowSize: [53, 51],
  iconAnchor: [10, 35],
  shadowAnchor: [27, 45],
  popupAnchor: [0, -42]
});
function buildMarker(pos3, layer2, icond, title, zi, op, heading) {
  let ret = [];
  for (let i = 0; i < pos3.length; i++) {
    if (!heading)
      heading = 0;
    if (heading == 180)
      heading = 179.9;
    const marker1 = L.marker(pos3[i], { icon: icond, rotationAngle: heading / 2 });
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
    marker1.addTo(layer2);
    ret.push(marker1);
  }
  return ret;
}
function buildTextIcon(icon, iconColor, markerColor, text) {
  return L.AwesomeMarkers.icon({
    icon,
    markerColor,
    iconColor,
    prefix: "fa",
    html: text
  });
}
function buildCircle$1(pos3, layer2, trackcolor, size, opacity, title) {
  let ret = [];
  for (let i = 0; i < pos3.length; i++) {
    const circleMark = L.circleMarker(
      pos3[i],
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
    circleMark.addTo(layer2);
    ret.push(circleMark);
  }
  return ret;
}
function buildCircleEndRace(pos3, layer2, trackcolor, size) {
  let ret = [];
  for (let i = 0; i < pos3.length; i++) {
    const circleMark = L.circle(pos3[i], {
      color: trackcolor,
      weight: 2,
      fill: false,
      radius: size
    });
    circleMark.addTo(layer2);
    ret.push(circleMark);
  }
  return ret;
}
function buildTrace(tpath, layer2, pointsContainer, color, weight, opacity, dashArray, dashOffset, mode = true) {
  let nbTrackLine = 0;
  let trackLine = [];
  for (let i = 0; i < tpath.length; i++) {
    let path = [];
    path[0] = [];
    path[1] = [];
    path[2] = [];
    for (var j = 0; j < tpath[i].length; j++) {
      const pos3 = buildPt2(tpath[i][j].lat, tpath[i][j].lng);
      path[0].push(pos3[0]);
      path[1].push(pos3[1]);
      path[2].push(pos3[2]);
      pointsContainer.push(pos3[1]);
    }
    for (j = 0; j < path.length; j++) {
      var trackLineP;
      if (mode) {
        trackLineP = L.geodesic(
          path[j],
          {
            color,
            opacity,
            weight,
            wrap: false
          }
        );
      } else {
        trackLineP = L.polyline(
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
      trackLine[nbTrackLine].addTo(layer2);
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
  return L.latLng(lat, lon);
}
function buildPt2(lat, lon) {
  if (!lat)
    lat = 0;
  if (!lon)
    lon = 0;
  let ret = [];
  ret[0] = L.latLng(lat, lon - 360, true);
  ret[1] = L.latLng(lat, lon);
  ret[2] = L.latLng(lat, lon + 360, true);
  return ret;
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
        pos = buildPt(lat, lon);
        cpath[cpathNum].push(pos);
      }
    }
  }
  return cpath;
}
function computeNextPos(pos3, hdg, speed, time) {
  var dist5 = speed * time / (3600 * 60);
  var alpha = 360 - (hdg - 90);
  var lat5 = pos3.lat;
  var lng5 = pos3.lng;
  var latrad1 = Util.toRad(lat5);
  var latrad2;
  var phi;
  lat5 += dist5 * Math.sin(Util.toRad(alpha));
  latrad2 = Util.toRad(lat5);
  phi = Math.cos((latrad1 + latrad2) / 2);
  lng5 += dist5 * Math.cos(Util.toRad(alpha)) / phi;
  if (lng5 > 180) {
    lng5 = lng5 - 360;
  }
  if (lng5 < -180) {
    lng5 = lng5 + 360;
  }
  return buildPt2(lat5, lng5);
}
function drawProjectionLine(pos3, hdg, speed) {
  if (!hdg || !speed)
    return;
  if (!mapState || !mapState.map || !mapState.gdiv)
    return;
  const userPrefs = getUserPrefs();
  const map2 = mapState.map;
  if (mapState.me_PlLayer)
    map2.removeLayer(mapState.me_PlLayer);
  mapState.me_PlLayer = L.layerGroup();
  let tpath = [];
  tpath.push(pos3[1]);
  for (var i = 0; i < userPrefs.map.projectionLineLenght / 2; i++) {
    pos3 = computeNextPos(pos3[1], hdg, speed, 2 * 60);
    tpath.push(pos3[1]);
    const title = 2 * (i + 1) + "min";
    buildCircle$1(pos3, layer, userPrefs.map.projectionColor, 1.5, 1, title);
  }
  buildTrace(buildPath(tpath), mapState.me_PlLayer, mapState.refPoints, userPrefs.map.projectionColor, 1, 0.4, "10, 10", "5");
  layer.addTo(map2);
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
  leaderMeLayer: null
};
const MAP_CONTAINER_ID = "lMap";
function updateBounds() {
  if (!mapState.map)
    return;
  mapState.bounds = L.latLngBounds(mapState.refPoints);
  mapState.map.fitBounds(mapState.bounds);
}
function updateMapCheckpoints(raceInfo2, playerIte) {
  var _a;
  if (!mapState.map)
    return;
  const map2 = mapState.map;
  if (!raceInfo2 || !map2)
    return;
  if (mapState.checkPointLayer) {
    map2.removeLayer(mapState.checkPointLayer);
  }
  mapState.checkPointLayer = L.layerGroup();
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
  mapState.checkPointLayer.addTo(map2);
  if (!mapState.userZoom)
    updateBounds();
}
function updateMapWaypoints(playerIte) {
  const raceOrder = getLegPlayersOrder();
  if (!mapState || !mapState.map || !mapState.gdiv)
    return;
  const map2 = mapState.map;
  if (!playerIte)
    return;
  if (!raceOrder && raceOrder[0].action.type !== "wp")
    return;
  if (mapState.wayPointLayer) {
    map2.removeLayer(mapState.wayPointLayer);
  }
  mapState.wayPointLayer = L.layerGroup();
  const wpOrder = raceOrder[0].action.action;
  const lastWpIdx = playerIte.lastWpIdx;
  const currPos = playerIte.pos;
  let wpPts = [];
  wpOrder.forEach(({ lat, lon, idx }) => {
    if (idx <= lastWpIdx)
      wpPts.push({ lat, lon });
  });
  let cpath = buildPath(wpPts, null, null, currPos.lat, currPos.lon);
  buildTrace(cpath, mapState.wayPointLayer, mapState.refPoints, "#FF00FF", 1.5, 0.7, [0, 1, 0, 1]);
  wpPts = [];
  wpOrder.forEach(({ lat, lon, idx }) => {
    if (idx > lastWpIdx)
      wpPts.push({ lat, lon });
  });
  cpath = buildPath(wpOrder, currPos.lat, currPos.lon);
  buildTrace(cpath, mapState.wayPointLayer, mapState.refPoints, "#FF00FF", 1.5, 0.7);
  wpOrder.forEach(({ lat, lon, idx }) => {
    const pos3 = buildPt2(lat, lon);
    const title = formatPosition(lat, lon);
    buildCircle(pos3, mapState.wayPointLayer, "#FF00FF", 2, 1, title);
    mapState.refPoints.push(pos3[1]);
  });
  mapState.wayPointLayer.addTo(map2);
  if (!mapState.userZoom)
    updateBounds();
}
function updateMapMe(connectedPlayerId2, playerIte) {
  const trackFleet = getLegPlayersTracksFleet();
  const userPrefs = getUserPrefs();
  const localTimes2 = userPrefs.global.localTime;
  const displayMarkers = userPrefs.map.showMarkers;
  if (!mapState || !mapState.map || !mapState.gdiv || !trackFleet || !trackFleet[connectedPlayerId2])
    return;
  const map2 = mapState.map;
  const myTrack = trackFleet[connectedPlayerId2].track;
  if (!mapState.meLayer)
    mapState.meLayer = L.layerGroup();
  if (!mapState.meBoatLayer)
    mapState.meBoatLayer = L.layerGroup();
  if (!mapState.meLayerMarkers)
    mapState.meLayerMarkers = L.layerGroup();
  if (mapState.meLayer)
    map2.removeLayer(mapState.meLayer);
  if (mapState.meLayerMarkers)
    map2.removeLayer(mapState.meLayerMarkers);
  if (mapState.meBoatLayer)
    map2.removeLayer(mapState.meBoatLayer);
  mapState.meLayer = L.layerGroup();
  mapState.meLayerMarkers = L.layerGroup();
  mapState.meBoatLayer = L.layerGroup();
  const myPos = { lat: playerIte.pos.lat, lon: playerIte.pos.lon };
  let myTrackPts = [];
  let isFirst = false;
  let prevPt = null;
  myTrack.forEach(({ lat, lon, ts, tag }) => {
    myTrackPts.push({ lat, lon });
    if (isFirst) {
      const title = "Me <br><b>" + formatShortDate(ts, void 0, localTimes2) + "</b> | Speed: " + roundTo(Math.abs(gcDistance(myPos, { lat, lon }) / ((ts - prevPt.ts) / 1e3) * 3600), 2) + " kts<br>" + formatPosition(lat, lon) + (tag ? "<br>(Type: " + tag + ")" : "");
      buildCircle({ lat, lon }, mapState.meLayerMarkers, "#b86dff", 1.5, 1, title);
      mapState.refPoints.push({ lat, lon });
    }
    isFirst = true;
    prevPt = { lat, lon, ts };
  });
  if (displayMarkers)
    mapState.meLayerMarkers.addTo(map2);
  if (myPos.lat && myPos.lon) {
    const myTrackpath = buildPath(myTrackPts, void 0, void 0, myPos.lat, myPos.lon);
    buildTrace(myTrackpath, mapState.meLayer, mapState.refPoints, "#b86dff", 1.5, 1);
    mapState.meLayer.addTo(map2);
    const myPosPt = buildPt2(myPos.lat, myPos.lon);
    const title = "Me (Last position: " + formatTimestampToReadableDate(playerIte.iteDate, 1) + ")<br>TWA: <b>" + roundTo(playerIte.twa, 3) + "°</b> | HDG: <b>" + roundTo(playerIte.hdg, 2) + "°</b><br>Sail: " + sailNames[playerIte.sail] + " | Speed: " + roundTo(playerIte.speed, 3) + " kts<br>TWS: " + roundTo(playerIte.tws, 3) + " kts | TWD: " + roundTo(playerIte.twd, 3) + "°";
    buildMarker(myPosPt, mapState.meBoatLayer, buildBoatIcon("#b86dff", "#000000", 0.4), title, 200, 0.5, playerIte.hdg);
    drawProjectionLine(myPosPt, playerIte.hdg, playerIte.speed);
  }
  mapState.meBoatLayer.addTo(map2);
  if (!mapState.userZoom)
    updateBounds();
}
function updateMapLeader(playerIte) {
  if (!mapState || !mapState.map || !mapState.gdiv)
    return;
  if (mapState.leaderLayer)
    map.removeLayer(mapState.leaderLayer);
  if (mapState.leaderMeLayer)
    map.removeLayer(mapState.leaderMeLayer);
  mapState.leaderLayer = L.layerGroup();
  mapState.leaderMeLayer = L.layerGroup();
  const offset = (playerIte == null ? void 0 : playerIte.startDate) ? /* @__PURE__ */ new Date() - playerIte.startDate : /* @__PURE__ */ new Date();
  const trackLeader = getLegPlayersTrackLeader();
  if (trackLeader && trackLeader.track.length > 0) {
    const playersList2 = getPlayersList();
    const title = "Leader: <b>" + playersList2[trackLeader.userId] + "</b><br>Elapsed: " + formatDHMS(offset);
    addGhostTrack(trackLeader.track, title, offset, "#FF8C00", mapState.leaderLayer);
  }
  const trackGhost = getLegPlayersTrackLeader();
  if (trackGhost && trackGhost.track.length > 0) {
    const title = "<b>Best Attempt</b><br>Elapsed: " + formatDHMS(offset);
    addGhostTrack(trackGhost.track, title, offset, "#b86dff", mapState.leaderMeLayer);
  }
}
function addGhostTrack(ghostTrack, title, offset, color, layer2) {
  const userPrefs = getUserPrefs();
  const displayMarkers = userPrefs.map.showMarkers;
  if (!ghostTrack || !mapState || !mapState.map || !mapState.gdiv)
    return;
  const ghostStartTS = ghostTrack[0].ts;
  const ghostPosTS = ghostStartTS + offset;
  let ghostPos;
  for (var i = 0; i < ghostTrack.length; i++) {
    const pos3 = buildPt2(ghostTrack[i].lat, ghostTrack[i].lon);
    mapState.refPoints.push(pos3[1]);
    if (!ghostPos) {
      if (ghostTrack[i].ts >= ghostPosTS) {
        ghostPos = i;
      }
    }
  }
  buildTrace(buildPath(ghostTrack), layer2, mapState.refPoints, color, 1, 0.6, "10, 10", "5");
  if (ghostPos && displayMarkers) {
    const lat1 = ghostTrack[ghostPos].lat;
    const lon1 = ghostTrack[ghostPos].lon;
    const lat0 = ghostTrack[Math.max(ghostPos - 1, 0)].lat;
    const lon0 = ghostTrack[Math.max(ghostPos - 1, 0)].lon;
    const heading = Util.courseAngle(lat0, lon0, lat1, lon1) * 180 / Math.PI;
    const d = (ghostPosTS - ghostTrack[ghostPos - 1].ts) / (ghostTrack[ghostPos].ts - ghostTrack[ghostPos - 1].ts);
    const lat = lat0 + (lat1 - lat0) * d;
    const lon = lon0 + (lon1 - lon0) * d;
    const pos3 = buildPt2(lat, lon);
    buildMarker(pos3, layer2, buildBoatIcon(color, color, 0.6), title, 20, 0.4, heading);
  }
  layer2.addTo(mapState.map);
  if (!mapState.userZoom)
    updateBounds();
}
function updateMapFleet(raceInfo2, raceItesFleet, connectedPlayerId2) {
  if (!race || !mapState || !mapState.map || !mapState.gdiv)
    return;
  const map2 = mapState.map;
  const userPrefs = getUserPrefs();
  const trackFleet = getLegPlayersTracksFleet();
  const displayMarkers = userPrefs.map.showMarkers;
  const displayTracks = userPrefs.map.showTracks;
  if (mapState.fleetLayer)
    map2.removeLayer(mapState.fleetLayer);
  if (mapState.fleetLayerMarkers)
    map2.removeLayer(mapState.fleetLayerMarkers);
  if (mapState.fleetLayerTracks)
    map2.removeLayer(mapState.fleetLayerTracks);
  mapState.fleetLayer = L.layerGroup();
  mapState.fleetLayerMarkers = L.layerGroup();
  mapState.fleetLayerTracks = L.layerGroup();
  Object.entries(raceItesFleet).map(([userId, playerFleetInfos]) => {
    var _a;
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
      const pos3 = buildPt2(playerIte.pos.lat, playerIte.pos.lon);
      let skipperName = playerIte.displayName;
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
        info = skipperName + "<br>TWA: <b>" + roundTo(playerIte.twa, 3) + "°</b> | HDG: <b>" + roundTo(playerIte.heading, 2) + "°</b><br>Sail: " + sailNames[playerIte] || "- | Speed: " + roundTo(playerIte.speed, 3) + " kts<br>TWS: " + roundTo(playerIte.tws, 3) + " kts | TWD: " + roundTo(playerIte.twd, 3) + "°";
      }
      if (raceInfo2.type == "record") {
        info += "<br>Elapsed: <b>" + formatDHMS(playerIte.iteDate - playerIte.startDate) + "</b>";
      }
      const categoryIdx = category.indexOf(playerIte.type);
      const nameStyle = userId == connectedPlayerId2 ? "color: #b86dff; font-weight: bold; " : userPrefs.theme == "dark" ? categoryStyleDark[categoryIdx] : categoryStyle[categoryIdx];
      const sailStyle = sailColors[playerIte.sail];
      buildMarker(pos3, mapState.fleetLayer, buildBoatIcon(nameStyle, sailStyle, 0.8), info, zi, 0.8, playerIte.hdg);
      if (trackFleet[userId].track && trackFleet[userId].length != 0) {
        ({ lat: playerIte.pos.lat, lon: playerIte.pos.lon });
        let playerTrackPts = [];
        let isFirst = false;
        let prevPt = null;
        trackFleet[userId].track.forEach(({ lat, lon, ts, tag }) => {
          playerTrackPts.push({ lat, lon });
          if (isFirst) {
            const title = skipperName + "<br><b>" + formatShortDate(ts, void 0, localTimes) + "</b> | Speed: " + roundTo(Math.abs(gcDistance(playerPos, { lat, lon }) / ((ts - prevPt.ts) / 1e3) * 3600), 2) + " kts<br>" + formatPosition(lat, lon) + (tag ? "<br>(Type: " + tag + ")" : "");
            buildCircle(pos2, mapState.fleetLayerMarkers, nameStyle, 1.5, 1, title);
            mapState.refPoints.push({ lat, lon });
          }
          isFirst = true;
          prevPt = { lat, lon, ts };
        });
        if (playerPos.lat && playerPos.lon) {
          const myTrackpath = buildPath(playerTrackPts, void 0, void 0, playerPos.lat, playerPos.lon);
          buildTrace(myTrackpath, mapState.fleetLayerTracks, mapState.refPoints, nameStyle, 1.5, 1);
          mapState.fleetLayerTracks.addTo(map2);
        }
      }
    }
  });
  mapState.fleetLayer.addTo(map2);
  if (displayMarkers)
    mapState.fleetLayerMarkers.addTo(map2);
  if (displayTracks)
    mapState.fleetLayerTracks.addTo(map2);
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
  function set_userCustomZoom(e) {
    if (mapState.resetUserZoom > 0)
      mapState.userZoom = true;
    else
      mapState.resetUserZoom += 1;
    if (e && e.target) {
      if (e.target._zoom > 5) {
        const mapcenter = mapState.map.getCenter();
        mapcenter.lng;
      }
    }
  }
  const tab = document.getElementById("tab-content3");
  if (!tab)
    return;
  if (getComputedStyle(tab).display === "none") {
    return;
  }
  const raceInfo2 = getRaceInfo();
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
  mapState.refLayer = L.layerGroup();
  mapState.resetUserZoom = 0;
  mapState.userZoom = false;
  mapState.raceId = race.id;
  let mapTileColorFilterDarkMode = [
    "invert:100%",
    "bright:106%",
    "contrast:121%",
    "hue:195deg",
    "saturate:43%"
  ];
  const Esri_WorldImagery = L.tileLayer(
    "http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      minZoom: 2,
      maxZoom: 40,
      maxNativeZoom: 40,
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
    }
  );
  const OSM_Layer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    minZoom: 2,
    maxZoom: 40,
    maxNativeZoom: 40,
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  });
  const OSM_DarkLayer = L.tileLayer.colorFilter("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
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
  let map2 = L.map(MAP_CONTAINER_ID, {
    layers: [selectBaseMap],
    crs: usingPolar ? POLAR.crs : L.CRS.EPSG3857
  });
  mapState.map = map2;
  const layerControl = L.control.layers(baseLayers, null, { position: "topright" });
  layerControl.addTo(map2);
  ensureLayerControlClickable(layerControl);
  async function onBaseLayerChange(e) {
    await saveLocal("selectBaseMap", e.name);
    const isArctic = e.layer === Arctic_WMS;
    const wasArctic = !!POLAR.enabled;
    if (hasProj4Leaflet() && isArctic !== wasArctic) {
      const center = map2.getCenter();
      const zoom = map2.getZoom();
      map2.off("baselayerchange", onBaseLayerChange);
      map2.off("zoomend", set_userCustomZoom);
      map2.remove();
      POLAR.enabled = isArctic;
      const activeBase = isArctic ? Arctic_WMS : e.name === "Dark" ? OSM_DarkLayer : e.name === "Satellite" ? Esri_WorldImagery : OSM_Layer;
      const newMap = L.map(MAP_CONTAINER_ID, {
        crs: isArctic ? POLAR.crs || buildPolarCRS() : L.CRS.EPSG3857,
        layers: [activeBase],
        zoomAnimation: false,
        fadeAnimation: false
      });
      mapState.map = newMap;
      map2 = newMap;
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
      const newLayerControl = L.control.layers(newBaseLayers);
      newLayerControl.addTo(newMap);
      ensureLayerControlClickable(newLayerControl);
      newMap.addControl(new L.Control.ScaleNautic({
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
      L.control.ruler(optionsRuler2).addTo(newMap);
      L.control.coordinates({
        useDMS: true,
        labelTemplateLat: "Lat: {y}",
        labelTemplateLng: " Lng: {x}",
        useLatLngOrder: true,
        labelFormatterLat: function(lat) {
          let latFormatted = L.NumberFormatter.toDMS(lat);
          latFormatted = latFormatted.replace(/''$/, '"') + (latFormatted.startsWith("-") ? " S" : " N");
          return latFormatted.replace(/^-/, "");
        },
        labelFormatterLng: function(lng) {
          let lngFormatted = L.NumberFormatter.toDMS(lng);
          lngFormatted = lngFormatted.replace(/''$/, '"') + (lngFormatted.startsWith("-") ? " W" : " E");
          return '<span class="labelGeo">' + lngFormatted.replace(/^-/, "") + "</span>";
        }
      }).addTo(newMap);
      if (mapState.refLayer)
        mapState.refLayer.addTo(newMap);
      applyBoundsForCurrentMode(newMap);
      newMap.on("zoomend", set_userCustomZoom);
      newMap.on("baselayerchange", onBaseLayerChange);
      const raceInfo3 = getRaceInfo();
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
    applyBoundsForCurrentMode(map2);
  }
  map2.addControl(new L.Control.ScaleNautic({
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
  L.control.ruler(optionsRuler).addTo(map2);
  L.control.coordinates({
    useDMS: true,
    labelTemplateLat: "Lat: {y}",
    labelTemplateLng: " Lng: {x}",
    useLatLngOrder: true,
    labelFormatterLat: function(lat) {
      let latFormatted = L.NumberFormatter.toDMS(lat);
      latFormatted = latFormatted.replace(/''$/, '"') + (latFormatted.startsWith("-") ? " S" : " N");
      return latFormatted.replace(/^-/, "");
    },
    labelFormatterLng: function(lng) {
      let lngFormatted = L.NumberFormatter.toDMS(lng);
      lngFormatted = lngFormatted.replace(/''$/, '"') + (lngFormatted.startsWith("-") ? " W" : " E");
      return '<span class="labelGeo">' + lngFormatted.replace(/^-/, "") + "</span>";
    }
  }).addTo(map2);
  map2.attributionControl.addAttribution("&copy;SkipperDuMad / Trait de cotes &copy;Kurun56");
  mapState.refLayer = L.layerGroup();
  const title1 = "Start: <b>" + raceInfo2.start.name + "</b><br>" + formatPosition(raceInfo2.start.lat, raceInfo2.start.lon);
  const latlng = buildPt2(raceInfo2.start.lat, raceInfo2.start.lon);
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
    L.polylineDecorator(raceLine[i], {
      patterns: [
        { offset: "5%", repeat: "10%", symbol: L.Symbol.arrowHead({ pixelSize: 15, pathOptions: { fillOpacity: 0.5, weight: 1, color: "white" } }) }
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
      L.polygon(
        polygonPts0,
        {
          color: restrictedZoneColor,
          stroke: 0.35,
          weight: 1
        }
      ).addTo(mapState.refLayer);
      L.polygon(
        polygonPts1,
        {
          color: restrictedZoneColor,
          stroke: 0.35,
          weight: 1
        }
      ).addTo(mapState.refLayer);
      L.polygon(
        polygonPts2,
        {
          color: restrictedZoneColor,
          stroke: 0.35,
          weight: 1
        }
      ).addTo(mapState.refLayer);
    }
  }
  mapState.refLayer.addTo(map2);
  updateBounds();
  updateMapCheckpoints(raceInfo2, playerItes.ite);
  updateMapFleet(raceInfo2, raceItesFleet, connectedPlayerId2);
  if (mapState.route[rid] && mapState.route[rid].length !== 0) {
    Object.keys(mapState.route[rid]).forEach(function(name) {
      var lMapRoute = mapState.route[rid][name];
      var map3 = mapState.map;
      if (lMapRoute.displayed) {
        if (lMapRoute.traceLayer)
          lMapRoute.traceLayer.addTo(map3);
        if (lMapRoute.markersLayer && document.getElementById("sel_showMarkersLmap").checked)
          lMapRoute.markersLayer.addTo(map3);
      }
    });
  }
  updateMapWaypoints(playerItes.ite);
  updateMapLeader(playerItes.ite);
  updateMapMe(connectedPlayerId2, playerItes.ite);
  set_userCustomZoom(false);
  applyBoundsForCurrentMode(map2);
  map2.on("baselayerchange", onBaseLayerChange);
  map2.on("zoomend", set_userCustomZoom);
  mapState.map = map2;
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
function initUIBindings(items) {
  items.forEach(({ selector, onChange, onInit }) => {
    const el = document.querySelector(selector);
    if (!el) {
      console.warn(`⚠️ Élément non trouvé pour ${selector}`);
      return;
    }
    let eventType = "change";
    if (el.tagName === "BUTTON" || el.tagName === "IMG") {
      eventType = "click";
    } else if (el.tagName === "INPUT") {
      const type = el.getAttribute("type") || "text";
      if (["button", "submit", "image"].includes(type))
        eventType = "click";
      else if (["number", "text", "range"].includes(type))
        eventType = "input";
      else
        eventType = "change";
    }
    const getValue = () => {
      if (el.tagName === "IMG")
        return el.src;
      if (el.tagName === "SELECT")
        return el.value;
      if (el.tagName === "BUTTON")
        return el.value || el.textContent;
      if (el.tagName === "INPUT") {
        switch (el.type) {
          case "checkbox":
            return el.checked;
          case "number":
            return parseFloat(el.value);
          default:
            return el.value;
        }
      }
      return null;
    };
    el.addEventListener(eventType, () => {
      const val = getValue();
      onChange == null ? void 0 : onChange(val, el);
    });
    if (typeof onInit === "function") {
      onInit(getValue(), el);
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
      selector: "#sel_showMarkersLmap",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.map.showMarkers = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.map.showMarkers;
      }
    },
    {
      selector: "#sel_showTracksLmap",
      onChange: (checked) => {
        const userPrefs = getUserPrefs();
        userPrefs.map.showTracks = checked;
        saveUserPrefs(userPrefs);
      },
      onInit: (checked, el) => {
        const userPrefs = getUserPrefs();
        el.checked = userPrefs.map.showTracks;
      }
    },
    {
      selector: "#sel_borderColorLmap",
      onChange: (value) => {
        const userPrefs = getUserPrefs();
        userPrefs.map.borderColor = value;
        saveUserPrefs(userPrefs);
      },
      onInit: (value, el) => {
        const userPrefs = getUserPrefs();
        el.value = userPrefs.map.borderColor;
      }
    },
    {
      selector: "#sel_projectionColorLmap",
      onChange: (value) => {
        const userPrefs = getUserPrefs();
        userPrefs.map.projectionColor = value;
        saveUserPrefs(userPrefs);
      },
      onInit: (value, el) => {
        const userPrefs = getUserPrefs();
        el.value = userPrefs.map.projectionColor;
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
    }
  ]);
}
let initDone = null;
document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ DOM start !");
  await loadUserPrefs();
  await initMemo();
  onPlayerConnect();
  doDbListener();
  updateRaceListDisplay();
  uiBindingInit();
  buildRaceStatusHtml();
  tabSwitch();
  onRaceOpen();
  initDone = true;
  const repeater = startRepeating(() => {
  }, 5e3);
  setTimeout(() => repeater.stop(), 2e4);
});
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
      if ((newValue == null ? void 0 : newValue.ts) != getLegPlayersOptionsUpdate() && initDone) {
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
        onRaceOpen();
        buildRaceStatusHtml();
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
