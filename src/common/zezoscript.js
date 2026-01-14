import { cleanSpecial} from './utils.js';
import { createEmptyRoute,addNewPoints,routeInfosmodel} from '../dashboard/app/route_importer.js';
import { updateRouteListHTML,displayMapTrace} from '../dashboard/ui/raceMap.js';

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


export function zezoCall(rid, playerIte, color, raceUrl, timeoutMs = 10_000) {
  const baseURL = "http://zezo.org";

  const url =
    baseURL +
    "/" +
    raceUrl +
    "/chart.pl" +
    "?lat=" +
    playerIte.pos.lat +
    "&lon=" +
    playerIte.pos.lon +
    (playerIte.iteDate ? "&ts=" + playerIte.iteDate / 1000 : "") +
    "&o=" +
    playerIte.options +
    "&twa=" +
    playerIte.twa +
    "&userid=" +
    playerIte.userId +
    "&auto=no";

  const btn = document.getElementById("bt_rt_addLmap");
  const setBusy = (busy) => {
    if (!btn) return;
    btn.innerText = busy ? "Import..." : "Import";
    btn.disabled = !!busy;
  };

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
