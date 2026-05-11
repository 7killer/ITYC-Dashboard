

import { roundTo } from '../../common/utils.js';
import { formatTimeNotif } from './common.js';

import {getUserPrefs} from '../../common/userPrefs.js'

import {getRaceInfo,
getLegList,
getOpenedRaceHistory,
getLegPlayerInfos
} from '../app/memoData.js'

var permission = false;
const notifications = [];     // Notifications

Notification.requestPermission(function (status) {
    if (Notification.permission !== status) {
        Notification.permission = status;

    }
    permission = status;
    console.log("Notifications status " + status);
});


export function updateRaceListNotif()
{
    const raceInfo = getRaceInfo();
    const openedRaceIdHistory = getOpenedRaceHistory();
    const raceList = getLegList();

    const sel = document.getElementById("sel_raceNotif");
    
    // Supprime les options dynamiques existantes
    [...sel.options].forEach(opt => {
        if (opt.dataset.dynamic === "true") sel.removeChild(opt);
    });
    
    const opt = document.createElement("option");
    opt.dataset.dynamic = "true";
    
    if(raceInfo?.raceId == null || raceInfo?.legNum == null) 
    {
        opt.textContent = "Aucune course disponible";
        opt.disabled = true;
        opt.selected = true;
        opt.value = 0;
        sel.appendChild(opt);
        sel.value = 0;
        return;
    }

    opt.disabled = false;
    
    const raceKey = raceInfo.raceId + '-' + raceInfo.legNum; 
    opt.textContent = `${raceInfo.legName} (${raceKey})`;
    opt.selected = true;
    opt.value = raceKey;
    sel.appendChild(opt);
    sel.value = raceKey
    
    opt.selected = false;

    for (const legInfo of Object.entries(openedRaceIdHistory)) {
        const legId = legInfo[1];
        if(raceInfo.raceId != legId.raceId || raceInfo.legNum != legId.legNum)
        {
            const key = `${legId.raceId}-${legId.legNum}`;
            const legInfo = raceList[key];
            
            const raceKey = raceInfo.raceId + '-' + raceInfo.legNum; 
            opt.textContent = `${legInfo.legName} (${raceKey})`;
            opt.value = raceKey;
            sel.appendChild(opt);
        }
    }
}

export function adaptUnitNotif()
 {
    let text ="";
    let padL = "3em";
    switch(document.getElementById("sel_type1Notif").value) {
        case "1" : // TWA
        case "2" : // HDG
        case "4" : // TWD
        case "8" : // TWA best vmg
            text = "°";
            padL = "4em"
            break;
        case "3" : // TWS
        case "7" : // boat vmg
            if(lang ==  "fr")
                text = "nds";
            else
                text = "knds";
            padL = "3em"
            break;
        case "5" : // STAMINA
        case "6" : // overSpeed
            text = "%";
            padL = "4em"
            break;
        default :
            break;
    }
    document.getElementById("notifUnit").innerHTML = text;
    document.getElementById("bt_notif2").style.paddingRight = padL;
}


export function createTimeNotif(){
    const userPrefs = getUserPrefs();
    const timeVal = document.getElementById("sel_minuteNotif").value;
    if(timeVal)
    {
        notifications.push({
            type: "recall",
            repActive : document.getElementById("notif_repeat2").checked,
            time: Date.now() + timeVal * 60000,
            repet: 0,
        });
        
        document.getElementById("sel_minuteNotif").value = "";
        showNotifList();
    } else
    {
        if(userPrefs.lang ==  "fr") {
            alert ("Enregistrement impossible, entrez un délai !");
        } else
        {
            alert ("Record impossible, enter a delay !"); 
        }
    }
}


export function createNotif(){

    const raceNotif = document.getElementById("sel_raceNotif").value;
    const type1Notif = document.getElementById("sel_type1Notif").value;
    const type2Notif = document.getElementById("sel_type2Notif").value;
    const valNotif = document.getElementById("sel_valNotif").value;

    const userPrefs = getUserPrefs();

    if(raceNotif == 0 || raceNotif == "---")
    {
        if(userPrefs.lang ==  "fr") {
            alert ("Enregistrement impossible, sélectionnez une course!");
        } else
        {
            alert ("Record impossible, select a race!"); 
        }
        return;
    }

    if(type1Notif == "---" || type2Notif == "---" || !valNotif)
    {
        if(userPrefs.lang ==  "fr") {
            alert ("Enregistrement impossible, vérifiez les données !");
        } else {
            alert ("Record impossible, verify datas !");    
        }
        return;
    }

    notifications.push({race: raceNotif,
        type : type1Notif,
        val : roundTo(valNotif,2),
        repActive : document.getElementById("sel_minuteNotif").checked,
        ope : type2Notif,
        repet: 0,
    });

    document.getElementById("sel_raceNotif").value = "---";
    document.getElementById("sel_type1Notif").value = "---";
    document.getElementById("sel_type2Notif").value = "---";
    document.getElementById("sel_valNotif").value = "";
    showNotifList();

}

export function deleteNotif(id){
    let idx_notif = id.split('_')[2];
    if(notifications[idx_notif])delete notifications[idx_notif];
    showNotifList();
}

export function showNotifList() {
    const userPrefs = getUserPrefs();
    const isFr = userPrefs.lang ==  "fr"; 
    const closeImg = userPrefs.theme=="dark"?"./img/closedark.png":"./img/close.png";
    let notifTxt = "";
    for (let i = 0; i < notifications.length; i++) {
        
        if(!notifications[i]) continue;
        
        notifTxt +='<p class="notifBorderBottom">';
        if(notifications[i].type=="recall") {
            if(isFr) {
                notifTxt += "Rappel vers " + formatTimeNotif(notifications[i].time) + " (heure locale).";
            } else
            {
                notifTxt += "Recall at " + formatTimeNotif(notifications[i].time) + " (local time).";
            }
        } else
        {
            
            const raceList = getLegList();
            const legInfo = raceList[notifications[i].race];
            

            notifTxt += "<b>" + legInfo.legName + " :</b> ";
            notifTxt += isFr?"notification si ":"notification if "

            switch(notifications[i].type) {
                case "1" : notifTxt += "TWA"; break;
                case "2" : notifTxt += "HDG"; break;
                case "3" : notifTxt += "TWS"; break;
                case "4" : notifTxt += "TWD"; break;
                case "5" : notifTxt += "stamina"; break;
                case "6" : notifTxt += "overSpeed"; break;
                case "7" : notifTxt += "boat vmg"; break;
                case "8" : notifTxt += "TWA bvmg"; break;
                default : break;
            }
            notifTxt += isFr?" est ":" is ";


            switch(notifications[i].ope) {
                case "inf" : notifTxt += isFr?"inférieur(e) à ":"inferior to ";break;
                case "infegal" : notifTxt += isFr?"inférieur(e) ou égale à ":"inferior or equal to ";break;
                case "egal" : notifTxt += isFr?"égal à ":"equal to ";break;
                case "supegal" : notifTxt += isFr?"supérieur(e) ou égale à ":" superior or equal to ";break;
                case "sup" : notifTxt += isFr?" supérieur(e) à ":"superior to ";break;
                default : break;
            }
            notifTxt += notifications[i].val;

            switch(notifications[i].type) {
                case "1" : notifTxt +=  "°"; break;
                case "2" : notifTxt +=  "°"; break;
                case "3" : notifTxt +=  isFr?"nds":"knds"; break;
                case "4" : notifTxt +=  "°"; break;
                case "5" : notifTxt +=  "%"; break;
                case "6" : notifTxt +=  "%"; break;
                case "7" : notifTxt +=  isFr?"nds":"knds"; break;
                case "8" : notifTxt +=  "°"; break;
                default : break;
            }
            notifTxt += ".";
        }
        notifTxt += '<img id="notif_delete_'+i+'" class="popupCloseBt" src='+closeImg+' ></p>';
    }

    document.getElementById("notif").innerHTML = notifTxt;
}

export function sheduleNotif() {
    
    const userPrefs = getUserPrefs(); 
    const isFr = userPrefs.lang ==  "fr"; 
    const raceInfo = getRaceInfo();
    const raceItes = getLegPlayerInfos();

    const currIte = raceItes?.ites?.[0]?? null;
    const playerName = raceItes?.name;
    
    const titreNotif = raceInfo.legName;

    let textNotif = "";

    // Notification Echouement
    if (currIte?.aground == true) {
        textNotif = playerName + isFr?" : vous êtes échoué !":" : you are aground !";
        doNotif(titreNotif, textNotif, 2);
    }
    // Notification Mauvaise voile
    if (currIte?.badSail == true && currIte?.metaDash.dtf > 1) {
        textNotif = playerName + isFr?" : vous naviguez sous mauvaise voile !":" : you use bad sail !";
        doNotif(titreNotif, textNotif, 2);
    }

    for (let i = 0; i < notifications.length; i++) {
        if(!notifications[i]) continue;

        if(notifications[i].type=="recall") {
            if ((Date.now() > notifications[i].time - 300000 && Date.now() < notifications[i].time + 600000) 
            && (notifications[i].repet == 0 || (notifications[i].repActive && notifications[i].repet < 3 ))) {
                notifications[i].repet++;
                textNotif = playerName + " : ";
                textNotif += isFr?"rappel programmé à ":"recall programmed at ";
                textNotif += formatTimeNotif(notifications[i].time) + " !";
                doNotif(titreNotif, textNotif, 3, i);    
            }
        } else if(notifications[i].race == raceInfo.legName)
        {
           let textType = " : ";
           let textOpe = "";
           let textUnit = "";
           let val = 0;
            switch(notifications[i].type) {
                case "1" : // TWA
                    textType +=  isFr?"votre TWA":"your TWA";
                    val = roundTo(Math.abs(currIte?.twa), 1);
                    break;
                case "2" : // HDG
                    textType +=  isFr?"votre cap":"your heading";
                    val = roundTo(Math.abs(currIte?.heading), 1);
                    break;
                case "3" : // TWS
                    textType +=  isFr?"votre TWS":"your TWS";
                    val = roundTo(Math.abs(currIte?.tws), 1);
                    break;
                case "4" : // TWD
                    textType +=  isFr?"votre TWD":"your TWD";
                    val = roundTo(Math.abs(currIte?.metaDash.twd), 1);
                    break;
                case "5" : // STAMINA
                    textType +=  isFr?"votre stamina":"your stamina";
                    val = roundTo(Math.abs((currIte?.metaDash?.realStamina ? currIte?.metaDash?.realStamina : currIte?.stamina)), 1);
                    break;
                case "6" : // overspeed
                    textType +=  isFr?"votre coefficient de survitesse":"your overspeed coefficient";
                    val = 0;
                    if(currIte?.metaDash?.xplained) {
                        val += roundTo(iteDash.sailCoverage)
                    }
                    break;
                case "7" : // VMG
                    textType +=  isFr?"votre VMG":"your VMG";
                    val = 0;
                    if(currIte?.metaDash?.vmg)
                        val = roundTo(currIte.metaDash.vmg, 1)
                    break;
                
                case "8" : // BEST VMG
                    textType +=  isFr?"TWA Best VMG":"TWA Best VMG";
                    val = 0;
                    if(currIte?.metaDash?.bVmg)
                    {
                        if(notifications[i].val > 90) {
                            val = roundTo(Math.abs(currIte.metaDash.bVmg.twaDown), 1);
                        } else
                        {
                            val = roundTo(Math.abs(currIte.metaDash.bVmg.twaUp), 1);
                        }
                    }
                    break;
                default :
                    break;
            }
            let drawNotif = false;
            switch(notifications[i].ope) {
                case "inf" : // inferior
                    if(val < notifications[i].val) drawNotif = true;
                    textOpe =isFr? " est inférieur(e) à ":" is inferior to ";
                    break;
                case "infegal" : // HDG
                    if(val <= notifications[i].val) drawNotif = true;
                    textOpe =isFr? "  est inférieur(e) ou égale à ":" is inferior or equal to ";
                    if(lang ==  "fr")  textOpe =  "";
                    else textOpe =  "";
                    break;
                case "egal" : // equal
                    if(val == notifications[i].val) drawNotif = true;
                    textOpe =isFr? " est égal à ":" is equal to ";
                    break;
                case "supegal" : // super est inférieur(e) ou égale à ior or equal
                    if(val >= notifications[i].val) drawNotif = true;
                    textOpe =isFr? " est supérieur(e) ou égale à ":" is superior or equal to ";
                    break;
                case "sup" : // superior
                    if(val > notifications[i].val) drawNotif = true;
                    textOpe =isFr? " est supérieur(e) à ":" is superior to ";
                    if(lang ==  "fr")  textOpe =  "";
                    else textOpe =  "";
                    break;
                default :
                    break;
            }
            
            switch(notifications[i].type) {
                case "1" : textUnit =  "°"; break;
                case "2" : textUnit =  "°"; break;
                case "3" : textUnit =  isFr?"nds":"knds"; break;
                case "4" : textUnit =  "°"; break;
                case "5" : textUnit =  "%"; break;
                case "6" : textUnit =  "%"; break;
                case "7" : textUnit =  isFr?"nds":"knds"; break;
                case "8" : textUnit =  "°"; break;
                default : break;
            }

            if(drawNotif && (notifications[i].repet == 0 || (notifications[i].repActive && notifications[i].repet < 3 ))) {
                notifications[i].repet++;
                textNotif  =  playerName + textType + textOpe + notifications[i].val + textUnit + "!";
                doNotif(titreNotif, textNotif , 1, i);    
            }
        }
    }
}

function doNotif(TitreNotif, TextNotif, icon, i) {
    const options = {
        "lang": "FR",
        "icon": "./img/"+icon + ".png",
        "body": TextNotif
    };

    var notif = new Notification(TitreNotif, options);
    notif.onclick = function(x) {
        if (i && notifications[i]) delete notifications[i];
        showNotifList();
        window.focus();
        this.close();
    };
} 

