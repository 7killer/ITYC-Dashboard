// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as msgInjest from './data/msgIngestDef.js';
import { ensureOffscreen } from './ensureOffscreen.js';
import { computeOwnIte ,computeFleetIte} from './iteRun.js';
import {createKeyChangeListener, getData,saveData} from '../common/dbOpes.js';
import {buildEmbeddedToolbarHtml,getbuildEmbeddedToolbarContent} from '../dashboard/ui/embeddedToolbar.js'
import {manageDashState} from './dashState.js'

var version = "1.0";
var debuggeeTab;
var dashboardTab;

const pending = new Map();

saveData('internal',{id:'state',state:'dashInstalled'});

chrome.runtime.onMessage.addListener((msg, _sender, _sendResponse) => {
  if (msg?.target !== 'bg') return;

  if (msg.type === 'job:done' && pending.has(msg.id)) {
    pending.get(msg.id).resolve(msg.summary); // petit récap, pas le gros buffer
    pending.delete(msg.id);
  }
  if (msg.type === 'job:error' && pending.has(msg.id)) {
    pending.get(msg.id).reject(new Error(msg.error || 'Offscreen/Worker error'));
    pending.delete(msg.id);
  }
});

export async function runHeavyJob(descriptor) {
  await ensureOffscreen();

  const id = crypto.randomUUID();
  const resP = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));

  // On envoie un descripteur léger (ex: { source: 'fetch', url: ... } ou { source: 'idb', key: ... })
  await chrome.runtime.sendMessage({
    target: 'offscreen',
    type: 'job:start',
    id,
    descriptor
  });

  return resP;
}

chrome.action.onClicked.addListener( onStartDash );
function onStartDash (tab) {
    if (tab && tab.url.indexOf('virtualregatta.com') >= 0) {
        debuggeeTab = tab;
        onAttach(tab.id);
    }
}
function autoReloadTab(tabs) {
    tabs.forEach(tab => {
        if (tab.url.indexOf(chrome.runtime.id+"/dashboard.html") >= 0) {     
            dashboardTab = tab;
            chrome.tabs.reload(tab.id);
            console.log("autoreload: " + tab.id + " " + tab.url);
        }
    });

}

chrome.tabs.onUpdated.addListener( checkForValidUrl );
chrome.tabs.onActivated.addListener( function (activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function (tab) {
        checkForValidUrl(activeInfo.tabId,null,tab);
    });
});
function checkForValidUrl (tabId, changeInfo, tabInfo) {

    try {
        if (tabInfo && tabInfo.url.indexOf('virtualregatta.com') >= 0) {
            if(!debuggeeTab) {
                debuggeeTab = tabInfo;
            }       
            if(!dashboardTab) //may the browser has been closed with dash tab open 
            {
                chrome.tabs.query({}).then(autoReloadTab);
            }
        }
    } catch (e) {
        console.log("Tab is gone: " + tabId);
    }
};


chrome.tabs.onRemoved.addListener( onTabRemoved );
function onTabRemoved (tabId, removeInfo) {
    if ( debuggeeTab && (tabId == debuggeeTab.id) ) {
        try {
            debuggeeTab = undefined;
            
            if(dashboardTab) chrome.tabs.remove(dashboardTab.id);
            dashboardTab = undefined;
        } catch (e) {
            console.log(JSON.stringify(e));
        }
    } else if ( dashboardTab && (tabId == dashboardTab.id) ) {
        dashboardTab = undefined;
    }
}

function onAttach (tabId) {
    if (chrome.runtime.lastError) {
        alert(chrome.runtime.lastError.message);
    } else {
        if(!dashboardTab)
            chrome.tabs.create({url: "dashboard.html?" + tabId, active: false},
                            function (tab) {
                                dashboardTab = tab;
                            });
    }
}



chrome.declarativeContent.onPageChanged.removeRules(async () => {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [
        new chrome.declarativeContent.PageStateMatcher({
          pageUrl: { hostPrefix: 'www.virtualregatta.',pathContains: '/offshore-' },
        }),
      ],
      actions: [
        new chrome.declarativeContent.SetIcon({
          imageData: {
            128: await loadImageData('icon.png')
          },
        }),
        chrome.declarativeContent.ShowAction
          ? new chrome.declarativeContent.ShowAction()
          : new chrome.declarativeContent.ShowPageAction(),
      ],
    }]);
  });
  
  async function loadImageData(url) {
    const img = await createImageBitmap(await (await fetch(chrome.runtime.getURL(url))).blob());
    const {width: w, height: h} = img;
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    return ctx.getImageData(0, 0, w, h);
  }
  
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
        try { const panelWindowInfo = chrome.windows.create({
            url: chrome.runtime.getURL("popup.html"),
            type:"popup",
            height: 150,
            width: 300, });
        } catch (error) { console.log(error); }
    }
  });

  /*to listen from VR page in bg future usage*/
  /*
  chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
        var msg = request;
        let rstTimer = false;
        let sendResp = true;
        console.log("bg R " + msg.type);
        void chrome.runtime.getPlatformInfo();
        sendResponse({type:"alive",rstTimer:false});
    }
);

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        var msg = request;
        let rstTimer = false;
        let sendResp = true;
        console.log("bg2 R " + msg.type);
        void chrome.runtime.getPlatformInfo();
        sendResponse({type:"alive",rstTimer:false});
    }
);*/
  
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    let sendResp = false;
    console.log("bg R2 " + msg.type);

    sendResponse({type:"alive",rstTimer:false,gameSize:80});
 

  });
  chrome.runtime.onMessageExternal.addListener(
    async function(request, sender, sendResponse) {
        var msg = request;
        let rstTimer = false;
        let sendResp = true;
        console.log("bg R " + msg.type);
        if(msg.type=="data") {
            if(msg.req.Accept) {sendResponse({type:"dummy"}); return;}  //json ranking request not supported
            var postData = JSON.parse(msg.req);
            var eventClass = postData['@class'];
            var body = JSON.parse(msg.resp.replace(/\bNaN\b|\bInfinity\b/g, "null"));
            if (eventClass == 'AccountDetailsRequest') {
                await msgInjest.ingestAccountDetails(body);
            }  else if (eventClass == 'LogEventRequest') {
                var eventKey = postData.eventKey;
                if (eventKey == 'Leg_GetList') {
                    await msgInjest.ingestRaceList(body);
                } else if (eventKey == 'Game_EndLegPrep') {
                    await msgInjest.ingestEndLegPrep(body);
//                } else if (eventKey == 'Meta_GetPolar') {
//                    msgInjest.ingestPolars(body);
                } else if (eventKey == "Game_GetSettings") {
                    await msgInjest.ingestGameSetting(body);
                } else if (eventKey == "Race_SelectorData") {
                    await msgInjest.ingestPolars(body);
                } else if (eventKey == "Game_AddBoatAction") {
                    await msgInjest.ingestBoatAction(body);
                }  
                 

                
                /*
  const sum = await runHeavyJob({
    source: 'fetch',
    url: 'https://example.com/huge-binary.bin', // Exemple: l’offscreen/worker fera le fetch lui-même
    op: 'sumModulo10'
  });
  console.log('[SW] job summary:', sum);

                */
            }
            else {
                let event = msg.url.substring(msg.url.lastIndexOf('/') + 1);
                if (event == 'getboatinfos') {
                    const ret = await msgInjest.ingestBoatInfos(body);
                    rstTimer = ret.rstTimer;
                } else  if (event == 'getfleet') {
                    await msgInjest.ingestFleetData(postData,body);
                }
            }

            sendResp = false;
        }

        void chrome.runtime.getPlatformInfo();
        const embeddedToolbar = getbuildEmbeddedToolbarContent();
        embeddedToolbar.rstTimer =rstTimer;
        sendResponse({...embeddedToolbar, type: "update" });
    }
);
const dashStateInfosListener = createKeyChangeListener('internal', 'state');
dashStateInfosListener.start({
    referenceValue: {state : ""},
    onChange: async ( { oldValue, newValue }) => {
        const currentId = await getData('internal', 'lastLoggedUser');
        const currentRace = await getData('internal', 'lastOpennedRace');
        
        console.log(`cid  ${currentId} race ${currentRace}`)
        await buildEmbeddedToolbarHtml(currentRace.raceId, currentRace.legNum, currentId.loggedUser);
    }
});
const legPlayersInfosListener = createKeyChangeListener('internal', 'legPlayersInfosUpdate');
legPlayersInfosListener.start({
    referenceValue: {loggedUser : Date.now()},
    onChange: async ( { oldValue, newValue }) => {
        const currentId = await getData('internal', 'lastLoggedUser');
        const currentRace = await getData('internal', 'lastOpennedRace');
        if(!currentId || !currentRace) return;
        await manageDashState('raceOpened');
        await computeOwnIte(currentRace.raceId, currentRace.legNum, currentId.loggedUser);
        await buildEmbeddedToolbarHtml(currentRace.raceId, currentRace.legNum, currentId.loggedUser);
    }
});


const legFleetInfosListener = createKeyChangeListener('internal', 'legFleetInfosUpdate');
legFleetInfosListener.start({
    referenceValue: {loggedUser : Date.now()},
    onChange: async ( { oldValue, newValue }) => {
        const currentRace = await getData('internal', 'lastOpennedRace');
        if(!currentRace) return;
        await manageDashState('raceOpened');
        await computeFleetIte(currentRace.raceId, currentRace.legNum);
    }
});

const connectedUserListener = createKeyChangeListener('internal', 'lastLoggedUser');
connectedUserListener.start({
    referenceValue: {loggedUser : null},
    onChange: async ({ oldValue, newValue }) => {
        if(newValue.loggedUser) {
            const currentRace = await getData('internal', 'lastOpennedRace');
            await manageDashState('playerConnected');
        await buildEmbeddedToolbarHtml(currentRace.raceId, currentRace.legNum, newValue.loggedUser); 
        }
    }
});
const connectedRaceListener = createKeyChangeListener('internal', 'lastOpennedRace');
connectedRaceListener.start({
    referenceValue: {raceId: null,legNum: null},
    onChange: async ({ oldValue, newValue }) => {
        const currentId = await getData('internal', 'lastLoggedUser');
        await manageDashState('raceOpened');
        await buildEmbeddedToolbarHtml(newValue.raceId, newValue.legNum,  currentId.loggedUser); 
    },
});