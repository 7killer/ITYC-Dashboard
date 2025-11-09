import {tabSwitch} from "./tab.js"
import {changeState} from '../ui/common.js'

export function clickManager(ev)
{


    const ev_lbl = ev.target.id;
    //sort management

    var dosort = true;

    //type of click
    let call_rt = false;
    let call_wi = false;
    let call_pl = false;
    let call_ityc = false;
    let call_cp = false;
    let call_vrzen = false;
    let friend = false;
    let tabsel = false;
    let cbox = false;
    let delNotif = false;
    let rmatch = null;
    const re_rtsp = new RegExp("^rt:(.+)"); // Call-Router
    const re_polr = new RegExp("^pl:(.+)"); // Call-Polars
    const re_wisp = new RegExp("^wi:(.+)"); // Weather-Info
    const re_ityc = new RegExp("^ityc:(.+)"); // ITYC
    const re_vrzen = new RegExp("^vrz:(.+)"); // Call-Vrzen
    const re_rsel = new RegExp("^rs:(.+)"); // Race-Selection
    const re_usel = new RegExp("^ui:(.+)"); // User-Selection
    const re_tsel = new RegExp("^ts:(.+)"); // Tab-Selection
    const re_cbox = new RegExp("^sel_(.+)"); // Checkbox-Selection
    const re_cpsp = new RegExp("^cp:(.+)"); // Call-Compass
    const re_ntdel = new RegExp("^notif_delete_(.+)"); // Notif delete button

    for (let node = ev.target; node; node = node.parentNode) {
        const id = node.id;
        let match;
        if (re_rtsp.exec(id)) {
            call_rt = true;
        } else if (re_polr.exec(id)) {
            call_pl = true;
        } else if (re_wisp.exec(id)) {
            call_wi = true;
        } else if (re_ityc.exec(id)) {
            call_ityc = true;
        } else if (re_cpsp.exec(id)) {
            call_cp = true;
        } else if (re_vrzen.exec(id)) {
            call_vrzen = true;  
        } else if (match = re_rsel.exec(id)) {
            rmatch = match[1];
        } else if (match = re_usel.exec(id)) {
            rmatch = match[1];
            friend = true;
        } else if (match = re_tsel.exec(id)) {
            rmatch = match[1];
            tabsel = true;
        } else if (match = re_cbox.exec(id)) {
            rmatch = match[1];
            cbox = true;
        } else if (match = re_ntdel.exec(id)) {
            delNotif = true;
            rmatch = id;
        }
    }
    if(!rmatch) return;

    if(tabsel) tabSwitch(rmatch); 
//    else if(friend) //Click line fleet
    else if(cbox) {
        changeState(ev_lbl);
        tabSwitch();
    }
/*    else if(delNotif)
        nf.deleteNotif(rmatch);
    else if(call_rt) {
        if(friend) callRouter(selRace.value, rmatch, false,"zezo");
        else callRouter(rmatch, currentUserId, false,"zezo");
    } else if(call_vrzen) {
        if(friend) callRouter(selRace.value, rmatch, false,"vrzen");
        else callRouter(rmatch, currentUserId, false,"vrzen");
    } else if (call_wi) callWindy(rmatch, 0); // weather
    else if (call_pl) callPolars(rmatch);
    else if (call_ityc) callITYC(rmatch);
    else if (call_cp) callCompass(selRace.value,currentUserId);
*/    


}
/*
function tableClick(ev) {
    var call_rt = false;
    var call_wi = false;
    var call_pl = false;
    var call_ityc = false;
    var call_cp = false;
    var call_vrzen = false;
    var friend = false;
    var tabsel = false;
    var cbox = false;
    var dosort = true;
    var rmatch;
    var re_rtsp = new RegExp("^rt:(.+)"); // Call-Router
    var re_polr = new RegExp("^pl:(.+)"); // Call-Polars
    var re_wisp = new RegExp("^wi:(.+)"); // Weather-Info
    var re_ityc = new RegExp("^ityc:(.+)"); // ITYC
    var re_vrzen = new RegExp("^vrz:(.+)"); // Call-Vrzen
    var re_rsel = new RegExp("^rs:(.+)"); // Race-Selection
    var re_usel = new RegExp("^ui:(.+)"); // User-Selection
    var re_tsel = new RegExp("^ts:(.+)"); // Tab-Selection
    var re_cbox = new RegExp("^sel_(.+)"); // Checkbox-Selection
    var re_cpsp = new RegExp("^cp:(.+)"); // Call-Compass
    var re_ntdel = new RegExp("^notif_delete_(.+)"); // Notif delete button

    var ev_lbl = ev.target.id;
    switch (ev_lbl) {
        case "th_name":
            Util.set_sortField("displayName");
            break;
        case "th_teamname":
            Util.set_sortField("teamname");
            break;
        case "th_rank":
        case "th_gap":
        case "th_total":   
        Util.set_sortField("rank");
            break;
        case "th_gender":
            Util.set_sortField("genderType");
            break;    
        case "th_teamsize":
            Util.set_sortField("teamsize");
            break;
        case "th_skipper":
            Util.set_sortField("racing");
            break;
        case "th_raceRank":
            Util.set_sortField("raceRank");
            break;
        case "th_xOptions":
            Util.set_sortField("xOptions");
            break;               
        case "th_rankcategory" :
            Util.set_sortField("rankingCategory");
            break;               
        case "th_type":
            Util.set_sortField("type");
            break;                
        case "th_teamid":
            Util.set_sortField("teamId");
            break; 

        case "th_lu":
            Util.set_sortField("lastCalcDate");
            break;
        case "th_sd":
            Util.set_sortField("startDate");
            break;
        case "th_racetime":
            Util.set_sortField("raceTime");
            break;
        case "th_eRT":
            Util.set_sortField("eRT");
            break;
        case "th_avgspeed":
            Util.set_sortField("avgSpeed");
            break;
        case "th_dtf":
            Util.set_sortField("dtf");
            break;
        case "th_dtu":
            Util.set_sortField("distanceToUs");
            break;
        case "th_state":
            Util.set_sortField("state");
            break;
        case "th_hdg":
            Util.set_sortField("heading");
            break;
        case "th_twa":
            Util.set_sortField("twa");
            break;
        case "th_tws":
            Util.set_sortField("tws");
            break;
        case "th_twd":
            Util.set_sortField("twd");
            break;
        case "th_speed":
            Util.set_sortField("speed");
            break;
        case "th_vmg":
            Util.set_sortField("vmg");
            break;
        case "th_sail":
            Util.set_sortField("sail");
            break;
        case "th_factor":
            Util.set_sortField("xfactor");
            break;
        case "th_foils":
            Util.set_sortField("xoption_foils");
            break;
        case "th_flag":
            Util.set_sortField("country");
            break;                
        case "th_options":
            Util.set_sortField("xoption_options");
            break;
        case "th_stamina":
            Util.set_sortField("stamina");
            break;
        case "th_brg":
        //case "th_psn":
        //case "th_foils":
            Util.set_sortField("none");
            break;
        default:
            dosort = false;
    }

    // Sort friends table
    if (dosort) {
        if (Util.sortField == currentSortField) {
            Util.set_currentSortOrder(1 - Util.currentSortOrder);
        } else {
            currentSortField = Util.sortField;
            Util.set_currentSortOrder(0);
        }            
        if (originClick == 2) {
            updateFleetHTML(raceFleetMap.get(selRace.value));
        } 

    }

    for (var node = ev.target; node; node = node.parentNode) {
        var id = node.id;
        var match;
        if (re_rtsp.exec(id)) {
            call_rt = true;
        } else if (re_polr.exec(id)) {
            call_pl = true;
        } else if (re_wisp.exec(id)) {
            call_wi = true;
        } else if (re_ityc.exec(id)) {
            call_ityc = true;
        } else if (re_cpsp.exec(id)) {
            call_cp = true;
        } else if (re_vrzen.exec(id)) {
            call_vrzen = true;  
        } else if (match = re_rsel.exec(id)) {
            rmatch = match[1];
        } else if (match = re_usel.exec(id)) {
            rmatch = match[1];
            friend = true;
        } else if (match = re_tsel.exec(id)) {
            rmatch = match[1];
            tabsel = true;
        } else if (match = re_cbox.exec(id)) {
            rmatch = match[1];
            cbox = true;
        } else if (match = re_ntdel.exec(id)) {
            nf.deleteNotif(id);
        }

    }
    if (rmatch) {
        if (tabsel) {
            // Tab-Selection
            originClick= rmatch ;
         //   EX.extraRoute("hidden");
            display_selbox("hidden");
            for (var t = 1; t <= nbTabs; t++) {
                if(t==3)
                    document.getElementById("tab-content" + t).style.display = (rmatch == t ? "flex" : "none");
                else document.getElementById("tab-content" + t).style.display = (rmatch == t ? "block" : "none");
            }
            if (rmatch == 2) {
                
                updateFleetHTML(raceFleetMap.get(selRace.value));
                display_selbox("visible");
            } else if (rmatch == 3) {
                var race = races.get(selRace.value);
                rt.updateFleet(race,raceFleetMap);
                initializeMap(race);
                EX.extraRoute("visible");
                display_selbox("visible");
            } else if (rmatch == 4) {
                buildlogBookHTML(races.get(selRace.value));
            } else if (rmatch == 5) {
                var race = races.get(selRace.value);
                if(race && race.recordedData) {
                    gr.upDateGraph(race.recordedData);
                }
            } else if (rmatch == 6) {
                nf.showList();
            } else if (rmatch == 8) {
//                 updateUserConfigHTML();
            }  else if (rmatch == 9) {
                document.getElementById('ityc_frame').src = getITYCFullExtra(getITYCFull("https://ityc.fr/polarDash.html" + getITYCBoat(selRace.value),selRace.value),selRace.value)  ;
            } 
        } else if (friend) {
            // Friend-Routing
            if (call_rt) callRouter(selRace.value, rmatch, false,"zezo");
            else if (call_vrzen) callRouter(selRace.value, rmatch, false,"vrzen");
        } else if (cbox) {
            // Skippers-Choice
            if(ev_lbl == "sel_ExportFleet") {onFleetInCpyClipBoard();return;}
            changeState(ev_lbl);
        } else if (call_wi) callWindy(rmatch, 0); // weather
        else if (call_rt) callRouter(rmatch, currentUserId, false,"zezo");
        else if (call_pl) callPolars(rmatch);
        else if (call_ityc) callITYC(rmatch);
        else if (call_cp) callCompass(selRace.value,currentUserId);
        else if (call_vrzen) callRouter(rmatch, currentUserId, false,"vrzen");

        else
        {

            // Race-Switching
            enableRace(rmatch, true);
            changeRace(rmatch);
        }
    }
}

*/


