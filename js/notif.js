
import * as Util from './util.js';

var selRaceNotif, divNotif,  lbRaceNotif, lbType1Notif, lbType2Notif, lbValNotif, lbMinNotif,  TextNotif,chRepNotif,chRepNotif2;
var lang = "fr";
var permission = false;
var notifications = [];     // Notifications

Notification.requestPermission(function (status) {
    if (Notification.permission !== status) {
        Notification.permission = status;

    }
    permission = status;
    console.log("Notifications status " + status);
});




function initialize(language) {
    selRaceNotif = document.getElementById("sel_raceNotif");
        
    lbRaceNotif = document.getElementById("sel_raceNotif");
    lbType1Notif = document.getElementById("sel_type1Notif");
    lbType2Notif = document.getElementById("sel_type2Notif");
    lbValNotif = document.getElementById("sel_valNotif");
    lbMinNotif = document.getElementById("sel_minuteNotif");
    divNotif = document.getElementById("notif");
    chRepNotif = document.getElementById("notif_repeat");
    chRepNotif2 = document.getElementById("notif_repeat2");
    
    lang = language;

    document.getElementById("bt_notif").addEventListener("click", create);
    document.getElementById("bt_notif2").addEventListener("click", createTime);
}

function addRace(rid,rName)
{
    var optionNotif = document.createElement("option");
    optionNotif.text = rName;
    optionNotif.id = rid;
    selRaceNotif.appendChild(optionNotif);
}

function createTime(){

    //rappel temps
    if (lbMinNotif.value) {    
        if(lang ==  "fr") {
            var nText = "Rappel vers " + Util.formatTimeNotif(Date.now() + lbMinNotif.value * 60000) + " (heure locale).";
        } else
        {
            var nText = "Recall at " + Util.formatTimeNotif(Date.now() + lbMinNotif.value * 60000) + " (local time).";
        }
        notifications.push({
                        type: "recall",
                        repActive : chRepNotif2.checked,
                        time: Date.now() + lbMinNotif.value * 60000,
                        repet: 0,
                        text: nText
                       }); 
    } else {
        if(lang ==  "fr") {
            alert ("Enregistrement impossible, entrez un délai !");
        } else
        {
            alert ("Record impossible, enter a delay !"); 
        }
        return;
    }
    lbMinNotif.value = "";
    showList();

}

function create(){

    if (lbRaceNotif.value != "---") {
        if (lbType1Notif.value != "---" && lbType2Notif.value != "---" && lbValNotif.value) {
            if(lang ==  "fr") {
                var nText = "<b>" + lbRaceNotif.value + " :</b> notification si ";
                switch(lbType1Notif.value) {
                    case "1" : // TWA
                        nText += "TWA";
                        break;
                    case "2" : // HDG
                        nText += "cap";    
                        break;
                    case "3" : // TWS
                        nText += "TWS";
    
                        break;
                    case "4" : // TWD
                        nText += "TWD";
                        break;
                    case "5" : // STAMINA
                        nText += "stamina";
                        break;
                    default :
                        break;
                }
                nText += " est ";
                switch(lbType2Notif.value ) {
                    case "inf" : // inferior
                        nText += "inférieur(e) à ";
                        break;
                    case "infegal" : // HDG
                        nText += "inférieur(e) ou égale à ";
                        break;
                    case "egal" : // equal
                        nText += "égal à ";
                        break;
                    case "supegal" : // superior or equal
                        nText += "supérieur(e) ou égale à ";
                        break;
                    case "sup" : // superior
                        nText += " supérieur(e) à ";
                        break;
                    default :
                        break;
                }
                nText += lbValNotif.value + ".";
            } else {
                var nText = "<b>" + lbRaceNotif.value + " :</b> notification if ";
                switch(lbType1Notif.value) {
                    case "1" : // TWA
                        nText += "TWA";
                        break;
                    case "2" : // HDG
                        nText += "heading";   
                        break;
                    case "3" : // TWS
                        nText += "TWS";
                        break;
                    case "4" : // TWD
                        nText += "TWD";
                        break;
                    case "5" : // STAMINA
                        nText += "stamina";
                        break;
                    default :
                        break;
                }
                nText += " is ";
                switch(lbType2Notif.value ) {
                    case "inf" : // inferior
                        nText += "inferior to ";
                        break;
                    case "infegal" : // HDG
                        nText += "inferior or equal to ";
                        break;
                    case "egal" : // equal
                        nText += "equal to ";
                        break;
                    case "supegal" : // superior or equal
                        nText += " superior or equal to ";
                        break;
                    case "sup" : // superior
                        nText += "superior to ";
                        break;
                    default :
                        break;
                }
                nText += lbValNotif.value + ".";
            }
                
            notifications.push({race: lbRaceNotif.value,
                                type : lbType1Notif.value,
                                val : Util.roundTo(lbValNotif.value,1),
                                repActive : chRepNotif.checked,
                                ope : lbType2Notif.value,
                                repet: 0,
                                text: nText
                                });

        } else
        {
            if(lang ==  "fr") {
                alert ("Enregistrement impossible, vérifiez les données !");
            } else {
                alert ("Record impossible, verify datas !");    
            }
            return;
        }
    } else {
        if(lang ==  "fr") {
            alert ("Enregistrement impossible, sélectionnez une course!");
        } else
        {
            alert ("Record impossible, select a race!"); 
        }
        return;
    }


    lbRaceNotif.value = "---";
    lbType1Notif.value = "---";
    lbType2Notif.value = "---";
    lbValNotif.value = "";
    lbMinNotif.value = "";
    showList();
        
}

function deleteNotif(id){
    let idx_notif = id.split('_')[2];
    if(notifications[idx_notif])delete notifications[idx_notif];
    showList();
}

function showList() {
    divNotif.innerHTML = "";
    for (var i = 0; i < notifications.length; i++) {
        if(!notifications[i]) continue;
        let endClose = '<img id="notif_delete_'+i+'"';
        if(document.getElementById("color_theme").checked)
            endClose += ' class="popupCloseBt" src="./img/closedark.png" >';
        else
            endClose += ' class="popupCloseBt" src="./img/close.png" >';
        if(notifications[i].repet < 3) {divNotif.innerHTML += '<p class="notifBorderBottom">'+notifications[i].text + endClose+'</p>' ;}   
              
    }        
}

function manage(r) {
    
    var TitreNotif = r.name;
    var icon = 2;
    // Notification Echouement
    if (r.curr.aground == true) {
        
        if(lang ==  "fr") {
            TextNotif =  r.curr.displayName + " : vous êtes échoué !";
        } else
        {
            TextNotif =  r.curr.displayName + " : you are aground !";    
        }
        doNotif(TitreNotif, TextNotif, icon);
    }

    // Notification Mauvaise voile
    if (r.curr.badSail == true && r.curr.distanceToEnd > 1) {
        if(lang ==  "fr") {
            TextNotif = r.curr.displayName + " : vous naviguez sous mauvaise voile !";
        } else {
            TextNotif = r.curr.displayName + " : you use bad sail !";    
        }
        doNotif(TitreNotif, TextNotif, icon);
    }

    for (var i = 0; i < notifications.length; i++) {
        var icon = 1;
        if(!notifications[i]) continue;

        if(notifications[i].type=="recall") {
            if ((Date.now() > notifications[i].time - 300000 && Date.now() < notifications[i].time + 600000) 
            && (notifications[i].repet == 0 || (notifications[i].repActive && notifications[i].repet < 3 ))) {
                notifications[i].repet++;
                var icon = 3;
                if(lang ==  "fr") { 
                    TextNotif =  r.curr.displayName + " : rappel programmé à " + formatTimeNotif(notifications[i].time) + " !";
                } else
                {
                    TextNotif =  r.curr.displayName + " : recall programmed at " + formatTimeNotif(notifications[i].time) + " !";
                }
                doNotif(TitreNotif, TextNotif, icon, i);    
            }
        } else if(notifications[i].race == r.name)
        {
           var textType = "";
           var textOpe = "";
           var val = 0;
            switch(notifications[i].type) {
                case "1" : // TWA
                    if(lang ==  "fr")  textType =  " : votre TWA";
                    else textType =  " : your TWA";
                    val = Util.roundTo(Math.abs(r.curr.twa), 1);
                    break;
                case "2" : // HDG
                    if(lang ==  "fr")  textType =  " : votre cap";
                    else textType =  " : your heading";
                    val = Util.roundTo(Math.abs(r.curr.heading), 1);

                    break;
                case "3" : // TWS
                    if(lang ==  "fr")  textType =  " : votre TWS";
                    else textType =  " : your TWS";
                    val = Util.roundTo(Math.abs(r.curr.tws), 1);

                    break;
                case "4" : // TWD
                    if(lang ==  "fr")  textType =  " : votre TWD";
                    else textType =  " : your TWD";
                    val = Util.roundTo(Math.abs(r.curr.twd), 1);

                    break;
                case "5" : // STAMINA
                    if(lang ==  "fr")  textType =  " : votre stamina";
                    else textType =  " : your stamina";
                    val = Util.roundTo(Math.abs(r.curr.stamina), 1);
                    break;
                default :
                    break;
            }
            let drawNotif = false;
            switch(notifications[i].ope) {
                case "inf" : // inferior
                    if(val < notifications[i].val) drawNotif = true;
                    if(lang ==  "fr")  textOpe =  " est inférieur(e) à ";
                    else textOpe =  " is inferior to ";
                    break;
                case "infegal" : // HDG
                    if(val <= notifications[i].val) drawNotif = true;
                    if(lang ==  "fr")  textOpe =  " est inférieur(e) ou égale à ";
                    else textOpe =  " is inferior or equal to ";
                    break;
                case "egal" : // equal
                    if(val == notifications[i].val) drawNotif = true;
                    if(lang ==  "fr")  textOpe =  " est égal à ";
                    else textOpe =  " is equal to ";
                    break;
                case "supegal" : // superior or equal
                if(val >= notifications[i].val) drawNotif = true;
                    if(lang ==  "fr")  textOpe =  " est supérieur(e) ou égale à ";
                    else textOpe =  " is superior or equal to ";
                    break;
                case "sup" : // superior
                    if(val > notifications[i].val) drawNotif = true;
                    if(lang ==  "fr")  textOpe =  " est supérieur(e) à ";
                    else textOpe =  " is superior to ";
                    break;
                default :
                    break;
            }

            if(drawNotif && (notifications[i].repet == 0 || (notifications[i].repActive && notifications[i].repet < 3 ))) {
                notifications[i].repet++;
                TextNotif =  r.curr.displayName + textType + textOpe + notifications[i].val + "!";
                doNotif(TitreNotif, TextNotif, icon, i);    
            }
        }
    }
}

function doNotif(TitreNotif, TextNotif, icon, i) {
    var options = {
        "lang": "FR",
        "icon": "./img/"+icon + ".png",
//        "image": "./img/bandeau.jpg",
        "body": TextNotif
    };
    var notif = new Notification(TitreNotif, options);
    notif.onclick = function(x) {
        if (i && notifications[i]) delete notifications[i];

        //notifications[i].repet = 4;
        //console.log(formatTimeNotif(Date.now()) + " Repet : " + i + " / " + notifications[i].repet);
        window.focus();
        this.close();
    };
} 


export {
    create,initialize,addRace,
    showList,manage,deleteNotif
};
