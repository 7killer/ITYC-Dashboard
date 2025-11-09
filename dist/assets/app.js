import "./modulepreload-polyfill-7faf532e.js";
import { g as getData, a as getAllData, b as getLatestEntriesPerUser, c as getEntriesForTriplet, d as getLegPlayersOptionsByRaceLeg, r as raceTableHeaders, e as roundTo, f as formatHM, h as formatTimeNotif, i as raceTableLines, j as infoSail, k as getUserPrefs, l as genthRacelog, m as dateUTCSmall, D as DateUTC, s as sailNames, n as formatPosition, o as formatSeconds, p as getxFactorStyle, q as gentdRacelog, t as getBG, u as genth, v as category, w as sailColors, x as gentd, y as formatTime, z as formatDHMS, A as formatShortDate, B as categoryStyleDark, C as categoryStyle, E as isBitSet, F as guessOptionBits, G as display_selbox, H as changeState, I as saveUserPrefs, J as switchTheme, K as loadUserPrefs, L as createKeyChangeListener } from "./common-9e96a115.js";
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
  var _a, _b, _c;
  if (!raceIte || !raceInfo2)
    return "";
  const userPrefs = getUserPrefs();
  let lastCommand = "-";
  let lastCommandBG = "";
  let agroundBG = raceIte.aground ? "LightRed" : "lightgreen";
  let mnvrBG = raceIte.metaDash.manoeuvering ? "LightRed" : "lightgreen";
  if (userPrefs.theme == "dark") {
    agroundBG = raceIte.aground ? "darkred" : "darkgreen";
    mnvrBG = raceIte.metaDash.manoeuvering ? "darkred" : "darkgreen";
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
  if ((_a = raceInfo2.record) == null ? void 0 : _a.lastRankingGateName) {
    info += "<br/><span>@ " + r.record.lastRankingGateName + "</span>";
  }
  let trstyle = "hov";
  const raceIdFull = getOpenedRaceId();
  if (raceInfo2.id === raceIdFull.raceId || raceInfo2.legNum === raceIdFull.legNum)
    trstyle += " sel";
  const best = raceIte.metaDash.bVmg;
  const bestVMGString = best ? best.twaUp + '<span class="textMini">°</span> | ' + best.twaDown + '<span class="textMini">°</span>' : "-";
  const bestVMGTilte = best ? roundTo(best.vmgUp, 3) + '<span class="textMini"> kts</span> | ' + roundTo(Math.abs(best.vmgDown), 3) + '<span class="textMini"> kts</span>' : "-";
  const bspeedTitle = best ? roundTo(best.bspeed, 3) + ' <span class="textMini">kts</span><br>' + best.btwa + '<span class="textMini">°</span>' : "-";
  let lastCalcStyle = "";
  if (raceIte.metaDash.deltaReceiveCompute > 9e5) {
    lastCalcStyle = 'style="background-color: red;';
    lastCalcStyle += userPrefs.theme == "dark" ? ' color:black;"' : '"';
  }
  const manoeuver = raceIte.metaDash.manoeuver;
  const tack = manoeuver ? "<p>-" + manoeuver.tack.pena.dist + "nm | " + manoeuver.tack.pena.time + "s</p><p>-" + manoeuver.tack.energyLoose + "% | " + manoeuver.tack.energyRecovery + "min</p>" : "-";
  const gybe = manoeuver ? "<p>-" + manoeuver.gybe.pena.dist + "nm | " + manoeuver.gybe.pena.time + "s</p><p>-" + manoeuver.gybe.energyLoose + "% | " + manoeuver.gybe.energyRecovery + "min</p>" : "-";
  const sail = manoeuver ? "<p>-" + manoeuver.sail.pena.dist + "nm | " + manoeuver.sail.pena.time + "s</p><p>-" + manoeuver.sail.energyLoose + "% | " + manoeuver.sail.energyRecovery + "min</p>" : "-";
  let staminaStyle = "";
  let staminaTxt = "-";
  const stamina = raceIte.metaDash.realStamina;
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
  if (((_b = raceIte.metaDash) == null ? void 0 : _b.coffeeBoost) != 0 || ((_c = raceIte.metaDash) == null ? void 0 : _c.chocoBoost) != 0) {
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
  const rid = raceInfo2.id + "-" + raceInfo2.legNum;
  const zezoUrl = raceInfo2.zezoUrl ? raceInfo2.zezoUrl : null;
  let returnVal = '<tr class="' + trstyle + '" id="rs:' + rid + '">' + (zezoUrl ? '<td class="tdc"><span id="rt:' + rid + '">&#x2388;</span></td>' : "<td>&nbsp;</td>") + '<td class="tdc"><span id="vrz:' + rid + '">&#x262F;</span></td><td class="tdc"><span id="pl:' + rid + '">&#x26F5;</span></td><td class="tdc"><span id="wi:' + rid + '"><img class="icon" src="./img/wind.svg"/></span></td><td class="tdc"><span id="ityc:' + rid + '">&#x2620;</span></td><td class="tdc"><span id="cp:' + rid + '"><img class="icon" src="./img/compass.svg"/></span></td><td class="name">' + raceInfo2.legName + '</td><td class="time" ' + lastCalcStyle + ">" + formatTimeNotif(raceIte.iteDate) + "</td>" + raceTableLines(raceIte, best) + infoSail(raceIte, false) + '<td class="speed1">' + roundTo(raceIte.speed, 3) + '</td><td class="speed2">' + roundTo(raceIte.metaDash.vmg, 3) + '</td><td class="bvmg"><p>' + bestVMGString + "</p>";
  if (userPrefs.raceData.VMGSpeed)
    returnVal += "<p>(" + bestVMGTilte + ")</p>";
  returnVal += '</td><td class="bspeed">' + bspeedTitle + "</td>" + fullStamina + '<td class="tack">' + tack + '</td><td class="gybe">' + gybe + '</td><td class="sailPenalties">' + sail + '</td><td class="agrd" style="background-color:' + agroundBG + ';">' + (raceIte.aground ? "AGROUND" : "No") + '</td><td class="man" style="background-color:' + mnvrBG + ';">' + (raceIte.metaDash.manoeuvering ? "Yes" : "No") + "</td>";
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
  return '<tr class="commandLine hovred"><td class="time">' + DateUTC(raceLogLine.iteDate, 1) + '</td><td colspan="19"><b>Command @ ' + (raceLogLine.serverTs ? DateUTC(raceLogLine.serverTs, 2) : DateUTC(raceLogLine.serverTs)) + "</b> • <b>Actions</b> → " + printLastCommand(raceLogLine.action) + "</td></tr>";
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
  return '<tr class="hovred">' + gentdRacelog("time", "time", null, "Time", DateUTC(raceIte.iteDate, 1)) + raceTableLines(raceIte, iteDash2.bVmg) + infoSail(raceIte, false, false) + gentdRacelog("speed1", "reportedSpeed", null, "vR (kn)", roundTo(raceIte.speed, 3)) + gentdRacelog("speed2", "calcSpeed", speedCStyle, "vC (kn)", roundTo(iteDash2.speedC, 3) + " (" + sailNames[raceIte.sail % 10] + ")") + gentdRacelog("foils", "foils", null, "Foils", foilTxt) + gentdRacelog("xfactor", "factor", xfactorStyle, "Factor", xfactorTxt) + gentdRacelog("stamina", "stamina", staminaStyle, "Stamina", stamina ? roundTo(stamina, 2) + "%" : "-") + gentdRacelog("deltaD", "deltaDistance", speedTStyle, "Δd (nm)", deltaDist) + gentdRacelog("deltaT", "deltaTime", null, "Δt (s)", roundTo(iteDash2.deltaT, 0)) + gentdRacelog("position", "position", null, "Position", formatPosition(raceIte.pos.lat, raceIte.pos.lon)) + '<td class="sailPenalties" ' + getBG(iteDash2.tsEndOfSailChange) + ">" + sailChange + '</td><td class="gybe" ' + getBG(iteDash2.tsEndOfGybe) + ">" + gybing + '</td><td class="tack" ' + getBG(iteDash2.tsEndOfTack) + ">" + tacking + "</td></tr>";
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
function buildRaceFleetHtml() {
  const raceInfo2 = getRaceInfo();
  const raceItes = getLegPlayerInfos();
  const raceItesFleet = getLegFleetInfos();
  const connectedPlayerId2 = getConnectedPlayerId();
  if (!raceInfo2 || (raceInfo2 == null ? void 0 : raceInfo2.length) == 0)
    return;
  let raceFleetTableHeader = "<tr>" + genth("th_rt", "RT", "Call Router", void 0) + genth("th_lu", "Date" + dateUTCSmall(), void 0, getSortField() == "lastCalcDate", getSortOrder()) + genth("th_name", "Skipper", void 0, getSortField() == "displayName", getSortOrder()) + genth("th_teamname", "Team", void 0, getSortField() == "teamname", getSortOrder()) + genth("th_rank", "Rank", void 0, getSortField() == "rank", getSortOrder()) + (raceInfo2.type !== "record" ? genth("th_racetime", "RaceTime", "Current Race Time", getSortField() == "raceTime", getSortOrder()) : "") + genth("th_dtu", "DTU", "Distance to Us", getSortField() == "distanceToUs", getSortOrder()) + genth("th_dtf", "DTF", "Distance to Finish", getSortField() == "dtf", getSortOrder()) + genth("th_twd", "TWD", "True Wind Direction", getSortField() == "twd", getSortOrder()) + genth("th_tws", "TWS", "True Wind Speed", getSortField() == "tws", getSortOrder()) + genth("th_twa", "TWA", "True Wind Angle", getSortField() == "twa", getSortOrder()) + genth("th_hdg", "HDG", "Heading", getSortField() == "heading", getSortOrder()) + genth("th_speed", "Speed", "Boat Speed", getSortField() == "speed", getSortOrder()) + genth("th_vmg", "VMG", "Velocity Made Good", getSortField() == "vmg", getSortOrder()) + genth("th_sail", "Sail", "Sail Used", getSortField() == "sail", getSortOrder()) + genth("th_factor", "Factor", "Speed factor over no-options boat", getSortField() == "xfactor", getSortOrder()) + genth("th_foils", "Foils", "Boat assumed to have Foils. Unknown if no foiling conditions", getSortField() == "xoption_foils", getSortOrder());
  if (raceInfo2.type === "record") {
    raceFleetTableHeader += genth("th_sd", "Race Time", "Current Race Time", getSortField() == "startDate", getSortOrder()) + genth("th_eRT", "ERT", "Estimated Total Race Time", getSortField() == "eRT", getSortOrder()) + genth("th_avgS", "avgS", "Average Speed", getSortField() == "avgSpeed", getSortOrder());
  }
  raceFleetTableHeader += genth("th_psn", "Position", void 0) + genth("th_options", "Options", "Options according to Usercard", getSortField() == "xoption_options", getSortOrder()) + genth("th_state", "State", "Waiting or Staying, Racing, Arrived, Aground or Bad TWA", getSortField() == "state", getSortOrder()) + genth("th_remove", "", "Remove selected boats from the fleet list", void 0) + "</tr>";
  if (!raceItesFleet || Object.keys(raceItesFleet).length === 0) {
    document.getElementById("friendList").innerHTML = `
            <table id="raceidTable">
            <thead><tr><th>No friend positions received yet. Please enter a race.</th></tr></thead>
            </table>`;
    return;
  }
  raceItes.ite = raceItes.ites[0];
  let raceFleetLines = "";
  for (const [userId, entry] of Object.entries(raceItesFleet)) {
    const pInfos = userId == connectedPlayerId2 ? raceItes : entry;
    raceFleetLines += buildRacFleetLine(pInfos, raceInfo2, connectedPlayerId2);
  }
  var fleetHTML = '<table><thead class="sticky">' + raceFleetTableHeader + "</thead><tbody>" + raceFleetLines + "</tbody></table>";
  document.getElementById("friendList").innerHTML = fleetHTML;
  addEventListenersToRemoveSelectedBoatButtons();
  addEventListenersToSelectedLine();
}
function buildRacFleetLine(playerFleetInfos, raceInfo2, connectedPlayerId2) {
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
  const categoryIdx = category.indexOf(playerIte.type);
  const nameStyle = userId == connectedPlayerId2 ? "color: #b86dff; font-weight: bold; " : darkTheme ? categoryStyleDark[categoryIdx] : categoryStyle[categoryIdx];
  const autoSail = playerIte.sail > 10 ? "<span title='Auto Sails' class='cursorHelp'>&#x24B6;</span>" : "";
  const name = playerIte.type == "sponsor" ? ((_b = playerIte.branding) == null ? void 0 : _b.name) ? playerFleetInfos.info.name + "(" + playerIte.branding.name + ")" : playerFleetInfos.info.name : playerFleetInfos.info.name;
  const sailStyle = sailColors[playerIte.sail];
  const sailName = sailNames[playerIte.sail % 10] || "-";
  const foils = (iteDash2 == null ? void 0 : iteDash2.realFoilFactor) == null ? foilsType ? "no" : "?" : roundTo(iteDash2.realFoilFactor, 1) + "%";
  return '<tr class="' + nameClass + ' hovred" id="ui:' + userId + '"><td class="tdc">' + routerIcon + "</td>" + gentd("Time", "", null, formatTime(playerIte.dateIte, 1)) + '<td class="Skipper" style="' + nameStyle + '"><div class="bull">' + bull + "</div> " + name + "</td>" + gentd("Team", "", null, teamName) + gentd("Rank", "", null, playerIte.rank ? playerIte.rank : "-") + (raceInfo2.type !== "record" ? gentd("RaceTime", "", null, iteDash2.raceTime ? formatDHMS(iteDash2.raceTime) : "-") : "") + gentd("DTU", "", null, iteDash2.DTU ? roundTo(iteDash2.DTU, 3) : "-") + gentd("DTF", "", null, iteDash2.dtf == iteDash2.dtfC ? "(" + roundTo(iteDash2.dtfC, 3) + ")" : roundTo(iteDash2.dtf, 3)) + gentd("TWD", "", null, roundTo(playerIte.twd ? playerIte.twd : iteDash2.twd, 3)) + gentd("TWS", "", null, roundTo(playerIte.tws, 3)) + gentd("TWA", twaFG, null, roundTo(Math.abs(playerIte.twa), 3)) + gentd("TWAIcon", 'style="color:grey; align:center; text-align:center;"', null, lock) + gentd("HDG", 'style="color:' + hdgFG + '";"' + hdgBold, null, roundTo(playerIte.hdg, 3)) + gentd("Speed", "", null, roundTo(playerIte.speed, 3)) + gentd("VMG", "", null, roundTo(iteDash2.vmg, 3)) + gentd("Sail", "", null, "<span " + sailStyle + ">&#x25e2&#x25e3  </span>" + sailName) + gentd("SailIcon", 'style="color:grey; align:center; text-align:center;"', null, autoSail) + gentd("Factor", xfactorStyle, null, xfactorTxt) + gentd("Foils", "", null, foils) + recordRaceFields(raceInfo2, playerIte) + gentd("Position", "", null, playerIte.pos ? formatPosition(playerIte.pos.lat, playerIte.pos.lon) : "-") + gentd("Options", optionsStyle, optionsTitle, optionsTxt) + gentd("State", "", txtTitle, iconState) + gentd("Remove", "", null, getLegSelectedPlayersState(userId) && userId != connectedPlayerId2 ? '<span class="removeSelectedBoat" data-id="' + userId + '" title="Remove this boat: ' + name + '">❌</span>' : "") + "</tr>";
}
function recordRaceFields(raceInfo2, playerIte) {
  const userPrefs = getUserPrefs();
  if (raceInfo2.type === "record") {
    const localTimes = userPrefs.global.localTime;
    if (playerIte.state === "racing" && playerIte.distanceToEnd) {
      let t;
      if (iteDash.eRT)
        t = '<td class="eRT" title= "End : ' + formatShortDate(iteDash.eRT, void 0, localTimes) + '">' + formatDHMS(iteDash.eRT) + "</td>";
      else
        t = '<td class="eRT" title= "End : unknow"></td>';
      return '<td class="eRT" title= "Start : ' + formatShortDate(playerIte.startDate, void 0, localTimes) + '">' + formatDHMS(raceTime) + "</td>" + t + '<td class="avg">' + roundTo(iteDash.avgSpeed, 2) + "</td>";
    } else {
      if (playerIte.startDate && playerIte.state === "racing" && playerIte.startDate != "-") {
        let retVal = '<td class="eRT" title= "Start : ' + formatShortDate(playerIte.startDate, void 0, localTimes) + '">' + formatDHMS(raceTime) + "</td>";
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
      display_selbox("visible");
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
