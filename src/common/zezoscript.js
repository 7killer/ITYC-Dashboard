import { cleanSpecial} from './utils.js';
import { createEmptyRoute,addNewPoints,routeInfosmodel} from '../dashboard/app/route_importer.js';
import { updateRouteListHTML,displayMapTrace} from '../dashboard/ui/raceMap.js';
import {computeZezoOptions, ZEZO_BASE_URL} from './callExternal.js';
import { sailNames } from '../dashboard/ui/constant.js';

"use strict";



const pattern = /1;\sleft\s:([-]{0,1}[0-9]{1,})px;\stop:([0-9]{1,})px;"\s*onmouseover="updi\(event,'([0-9]{4}-[0-9]{2}-[0-9]{2})\s([0-9]{2}:[0-9]{2})\s([A-Z]{3,4})\s\((T[+]{1}\s?[0-9]{1,3}:[0-9]{2})\)<br>Distances:&nbsp;([0-9]{1,4}.[0-9]{1}nm)\/([0-9]{1,4}.[0-9]{1}nm)<br><b>Wind:<\/b>\s([0-9]{1,3})&deg;\s([0-9]{1,2}.[0-9]{1}\skt)\s\(<b>TWA\s([-]{0,1}[0-9]{1,3})&deg;<\/b>\)<br><b>Heading:<\/b>\s([0-9]{1,3})&deg;<b>Sail:<\/b>\s([a-zA-Z0]{2,4})<br><b>Boat\sSpeed:<\/b>\s([0-9]{1,3}.[0-9]{1,2}\skts)/

let scale;
let rtx_idx = [];
/* Calculate latitude using the scale of the display and the css top property
 * @param top
 * @param scale
 * @returns {number}
 */
function getLatitude(top, scale) {
    return 90 - ((parseInt(top) + 2) / scale);
}

/*
 * Calculate longitude using the scale of the display and the css left property
 * @param left
 * @param scale
 * @returns {number}
 */
function getLongitude(left, scale){
    left= parseInt(left);
    if (((left + 2 / scale) >= -180) || ((left + 2 / scale) <= 180)) {
        return (left + 2) / scale;
    } else {
        return ((left  + 2) / scale) - 360;
    }
}

function setBusy(busy) {
  const btn = document.getElementById("bt_rt_addLmap");
  if (!btn) return;
  btn.innerText = busy ? "Loading..." : "Import";
  btn.disabled = !!busy;
};

export function zezoCall(rid, playerIte, color, raceUrl, timeoutMs = 10_000) {
  const url =
    ZEZO_BASE_URL +
    "/" +
    raceUrl +
    "/chart.pl" +
    "?lat=" +
    playerIte.ite.pos.lat +
    "&lon=" +
    playerIte.ite.pos.lon +
    (playerIte.ite.iteDate ? "&ts=" + playerIte.ite.iteDate / 1000 : "") +
    "&o=" +
    computeZezoOptions(playerIte.options) +
    "&twa=" +
    playerIte.ite.twa +
    "&userid=" +
    playerIte.info.id +
    "&auto=no";


  setBusy(true);

  let controller, timeoutId;

  try {
    controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort("timeout"), timeoutMs);

    return fetch(url, { cache: "no-store", signal: controller.signal })
      .then((res) => (res.ok ? res.text() : false))
      .then((text) => {
        if (!text) return false;

        const result = text.split(pattern);

        let routeName = "zezo " + playerIte.info.name;
        let routeNameClean = cleanSpecial(routeName);

        // ✅ rtx_idx en objet (pas [])
        rtx_idx[rid] ??= {};
        const idxForRace = rtx_idx[rid];

        // compteur: 0 au premier, 1 au second, ...
        idxForRace[routeNameClean] = (idxForRace[routeNameClean] ?? -1) + 1;
        const n = idxForRace[routeNameClean];

        if (n > 0) {
          routeName += " " + n;
          routeNameClean = cleanSpecial(routeName);
        }

        createEmptyRoute(rid, routeNameClean, playerIte.info.name, color, routeName);

        const mScale = /var scale = ([0-9]+)/.exec(result[0] ?? "");
        const scale = mScale?.[1] ? Number(mScale[1]) : null;
        if (!scale) return false;

        for (let i = 0; i < result.length - 1; i += 15) {
          const datas = result.slice(i + 1, i + 15);
          if (datas.length < 14) continue;

          const [left,top,date,time,timezone,ttw,dtw,dtg,twd,tws,twa,btw,sail,stw] = datas;

          let isoDate = String(date).replaceAll("/", "-");
          isoDate += "T" + time + ":00";
          if (timezone == "UTC") isoDate += ".000+00:00";

          const routeData = Object.create(routeInfosmodel);

          routeData.lat = getLatitude(top, scale);
          routeData.lon = getLongitude(left, scale);
          routeData.timestamp = Date.parse(isoDate);
          routeData.hdg = btw + "°";
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
      })
      .catch((err) => {
        if (err?.name === "AbortError") {
          console.warn(`zezoCall: timeout after ${timeoutMs}ms`, err);
          return false;
        }
        console.error("zezoCall error:", err);
        return false;
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setBusy(false); // ✅ réactive le bouton quoi qu'il arrive
      });
  } catch (err) {
    console.error("zezoCall sync error:", err);
    clearTimeout(timeoutId);
    setBusy(false); // ✅ réactive même si erreur avant fetch
    return Promise.resolve(false);
  }
}
export function vrZenCall(rid, playerIte, color, vrZenName, endLat,endLon,mode,day,timeoutMs = 10_000) {
  const pOptions = playerIte.options;
  let vrZenOpt = "1,2";
  if(pOptions)
  {
    if (pOptions?.heavy) vrZenOpt += ",3";
    if (pOptions?.light) vrZenOpt += ",4";
    if (pOptions?.reach) vrZenOpt += ",5";
    if (pOptions?.heavy) vrZenOpt += ",6";
    if (pOptions?.light) vrZenOpt += ",7";
    if (pOptions?.winch) vrZenOpt += ",WINCHPRO";
    if (pOptions?.foil)  vrZenOpt += ",FOILS";
    if (pOptions?.hull)  vrZenOpt += ",POLISH";
    if (pOptions?.magicFurler) vrZenOpt += ",MAGIC_FURLER";
    if (pOptions?.comfortLoungePug)  vrZenOpt += ",CONFORT_LOUNGE";
    if (pOptions?.vrtexJacket)  vrZenOpt += ",VRTEX_JACKET";
  }


  let stamina = playerIte.metaDash?.realStamina? playerIte.metaDash.realStamina : playerIte.stamina;
  if(stamina > 100) stamina = 100;
  const sail = (playerIte.sail?(playerIte.sail % 10):"0");

  const url =
    "https://routage.vrzen.org/Simulation?userID=skm_test" 
    + "&course=" + encodeURIComponent(vrZenName)
    + "&latitude_origine=" + playerIte.pos.lat
    + "&longitude_origine=" + playerIte.pos.lon
    + "&latitude_cible=" + endLat
    + "&longitude_cible=" + endLon
    + "&parametres=" +vrZenOpt + ":"+day+ ":4:True:"+ mode +":-1::1:"+ sail +":"+playerIte.hdg+":False:True:"+ stamina +":MIXGEFS025"
    + "&preferences=EMPTY:500:EMAIL:10:MN:FR";
    
  setBusy(true);

  let controller, timeoutId;

  try {
    controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort("timeout"), timeoutMs);

    return fetch(url, { cache: "no-store", signal: controller.signal })
      .then(async (res)  => {
        if (!res.ok) {
          console.warn("vrZenCall HTTP error:", res.status, res.statusText);
          return false;
        }

        try {
          return await res.json();
        } catch (err) {
          console.error("vrZenCall JSON parse error:", err);
          return false;
        }
      })
      .then((result) => {
        if (!result) return false;
        if(!result.listDetailSimulation || !result.listDetailSimulation.length)  return false;

        let routeName = "vrZen " + playerIte.info.name;
        let routeNameClean = cleanSpecial(routeName);

        // ✅ rtx_idx en objet (pas [])
        rtx_idx[rid] ??= {};
        const idxForRace = rtx_idx[rid];

        // compteur: 0 au premier, 1 au second, ...
        idxForRace[routeNameClean] = (idxForRace[routeNameClean] ?? -1) + 1;
        const n = idxForRace[routeNameClean];

        if (n > 0) {
          routeName += " " + n;
          routeNameClean = cleanSpecial(routeName);
        }

        createEmptyRoute(rid, routeNameClean, playerIte.info.name, color, routeName);

        for (var i = result.listDetailSimulation.length-1; i > 1 ; i--) {
          const ptvrZen = result.listDetailSimulation[i];
          const isoDate = ptvrZen.dateHeure;

          const routeData = Object.create(routeInfosmodel);

          routeData.lat = ptvrZen.latitude;
          routeData.lon =  ptvrZen.longitude;
          routeData.timestamp = Date.parse(isoDate);
          routeData.hdg = ptvrZen.cap  + "°";
          routeData.tws = ptvrZen.vitesseVent + "nds";
          routeData.twa = ptvrZen.twa + "°";
          routeData.twd = ptvrZen.directionVent + "°";
          routeData.sail = ptvrZen.typeVoile;
          routeData.speed = ptvrZen.vitesse;
          addNewPoints(rid, routeNameClean, routeData);
        }

        updateRouteListHTML();
        displayMapTrace(rid, routeNameClean);

        return true;
      })
      .catch((err) => {
        if (err?.name === "AbortError") {
          console.warn(`vrZenCall: timeout after ${timeoutMs}ms`, err);
          return false;
        }
        console.error("vrZenCall error:", err);
        return false;
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setBusy(false); // ✅ réactive le bouton quoi qu'il arrive
      });
  } catch (err) {
    console.error("vrZenCall sync error:", err);
    clearTimeout(timeoutId);
    setBusy(false); // ✅ réactive même si erreur avant fetch
    return Promise.resolve(false);
  }
}
