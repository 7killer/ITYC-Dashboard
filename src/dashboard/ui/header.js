
import {getConnectedPlayerInfos, getLegList, getRaceInfo} from '../app/memoData.js';

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function updateVIPTag(isVIP) {
    const vipTag = document.getElementById("lb_boatvip");
    if (!vipTag) return;

    if (isVIP) {
        vipTag.textContent = " VIP ";
        vipTag.style.backgroundColor = '#f7da03';
        vipTag.style.color = 'black';
    } else {
        vipTag.textContent = "";
        vipTag.style.backgroundColor = getComputedStyle(document.body).backgroundColor;
        vipTag.style.color = '';
    }
}
export function onPlayerConnect() {

  const playerInfo = getConnectedPlayerInfos();
  if(playerInfo.length == 0) return;
  setText("lb_boatname", playerInfo.name);
  setText("lb_credits", playerInfo.credits);
  updateVIPTag(playerInfo.isVIP);
  if(playerInfo.team.length !=0)
  {
    setText("lb_teamname", playerInfo.team.name);
  }
}
export function onRaceOpen() {
  const raceInfo = getRaceInfo();
  if(raceInfo?.raceId == null || raceInfo?.legNum == null) return;

  const raceKey = raceInfo.raceId + '-' + raceInfo.legNum; 
  document.getElementById("sel_race").value = raceKey
}

export function updateRaceListDisplay() {
  const raceList = getLegList();
  
  const sel = document.getElementById("sel_race");
  // Supprime les options dynamiques existantes
  [...sel.options].forEach(opt => {
    if (opt.dataset.dynamic === "true") sel.removeChild(opt);
  });
  
  if (Object.keys(raceList).length === 0) {
    const opt = document.createElement("option");
    opt.textContent = "Aucune course disponible";
    opt.disabled = true;
    opt.selected = true;
    opt.dataset.dynamic = "true";
    sel.appendChild(opt);
  } else {
    Object.values(raceList).forEach(leg => {
      const opt = document.createElement("option");
      const raceKey = leg.raceId + '-' + leg.legNum; 
      opt.value = raceKey;
      opt.textContent = `${leg.name} (${raceKey})`;
      opt.dataset.dynamic = "true";
      sel.appendChild(opt);
    });
    onRaceOpen();
  }
}

  