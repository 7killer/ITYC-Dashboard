import {tabSwitch} from "./tab.js"
import {changeState} from '../ui/common.js'
import {deleteNotif} from '../ui/raceNotif.js'
import {openRouterSiteFront,openPolarSiteFront,openWindySiteFront} from '../../common/callExternal.js'
export function clickManager(ev)
{

    const tabButton = ev.target.closest?.("[data-tab-id]");
    if (tabButton) {
        tabSwitch(tabButton.dataset.tabId);
        return;
    }

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
        } else if (match = re_cbox.exec(id)) {
            rmatch = match[1];
            cbox = true;
        } else if (match = re_ntdel.exec(id)) {
            delNotif = true;
            rmatch = id;
        }
    }
    if(!rmatch) return;

//    if(friend) //Click line fleet
    if(cbox) {
        changeState(ev_lbl);
        tabSwitch();
    }
    else if(call_rt)    openRouterSiteFront(rmatch, false,"zezo");
    else if(call_vrzen) openRouterSiteFront(rmatch, false,"vrzen");
    else if (call_pl)   openPolarSiteFront("POLAR");
    else if (call_ityc) openPolarSiteFront("ITYC");
    else if (call_wi)   openWindySiteFront();
    else if(delNotif)   deleteNotif(rmatch);
/*  
    else if (call_cp) callCompass(selRace.value,currentUserId);
*/    


}
