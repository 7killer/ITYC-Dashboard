// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var version = "1.0";
var debuggeeTab;
var dashboardTab;
var debuggerAttached = false;
var listenMode= false;

  
chrome.storage.local.get(["listenMode"]).then((result) => {
    listenMode = result.listenMode;
    console.log("ListenMode read " + listenMode);
});
listenMode= false;

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    let msg = message;
    if(msg && msg.type && msg.type == "listenMode") {

 /*       if(!listenMode && msg.mode && debuggeeTab) {
//enable debugger
            if(dashboardTab) chrome.tabs.remove(dashboardTab.id);
            chrome.debugger.attach({tabId:debuggeeTab.id},version,onAttach.bind(null,debuggeeTab.id));
            debuggerAttached = true;
        } else if(listenMode && !msg.mode && debuggeeTab) {
            if(dashboardTab) chrome.tabs.remove(dashboardTab.id);
            if(debuggerAttached) {
                if(debuggerAttached && debuggeeTab) chrome.debugger.detach({tabId: debuggeeTab.id}); 
            }
            await registerContentScripts();
            onAttach(debuggeeTab.id)
        }*/
      //  listenMode = msg.mode;  

        chrome.storage.local.set({ 'listenMode' : listenMode }).then(() => {
            console.log("Value is save");
        });
        console.log("received msg " + listenMode);
    } else
        console.log("received msg " + msg);
    /*const {type, data} = message.data
      if (message.type === 'FROM_TAB') {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            if (tab.id && tab.id !== sender.tab?.id) {
              chrome.tabs.sendMessage(tab.id, { type: 'TO_TAB', data  });
            }
          });
        });
      }*/
});


/*Sendmessqge to content script */
//        await chrome.tabs.sendMessage(tab.id, {type: "openDebugger", tabId:tab.id}, function(response) {});  




chrome.action.onClicked.addListener( onStartDash );

async function onStartDash (tab) {
    if(!listenMode){
        if (tab && tab.url.indexOf('virtualregatta.com') >= 0) {
            debuggeeTab = tab;
            onAttach(tab.id);
        }    
    } else {
        debuggeeTab = tab;
        if (tab.url.startsWith('http')) {
            chrome.debugger.attach({tabId:tab.id}, version, onAttach.bind(null, tab.id));
            debuggerAttached = true;
        }
 //       
 //        onAttach(tab.id);
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
            if(dashboardTab) chrome.tabs.remove(dashboardTab.id);
            debuggeeTab = undefined;     
            dashboardTab = undefined;
            debuggerAttached = false;
        } catch (e) {
            console.log(JSON.stringify(e));
        }
    } else if ( dashboardTab && (tabId == dashboardTab.id) ) {
        try {                 
            dashboardTab = undefined;
            debuggerAttached = false;
            if(debuggerAttached && debuggeeTab) chrome.debugger.detach({tabId: debuggeeTab.id}); 
            debuggeeTab = undefined;     
        } catch (e) {
            console.log(JSON.stringify(e));
        } 
    }
}

function onAttach (tabId) {
    if (chrome.runtime.lastError) {
        console.log("attach error " +chrome.runtime.lastError.message);
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
            128: await loadImageData('./icon.png')
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

  
async function registerContentScripts() {
    const scripts = [{
        id: 'listenerIframeItyc',
        js: ['listenerIframeItyc.js'],
        matches: ["https://beta.virtualregatta.com/*","https://play.offshore.virtualregatta.com/*"],
        runAt: 'document_start',
        world: 'MAIN',
        allFrames: true,
      },{
          id: 'listenerItyc',
          js: ['listenerItyc.js'],
          matches: ["https://www.virtualregatta.com/en/offshore-game/*","https://www.virtualregatta.com/offshore-game/*"],
          runAt: 'document_start',
          world: 'MAIN'
        }];
      let ids = scripts.map(s => s.id);
      /*to ensure proper uninstall of previous script version*/
      ids.push('listener','listenerIframe');
      ids.forEach(async function (id) {
          try {
              await chrome.scripting.unregisterContentScripts(id);
          } catch(error) {console.log(id);console.log(error);}
      });
      await chrome.scripting.registerContentScripts(scripts)
      .then(() => console.log("registration complete "))
      .catch((err) => console.warn("unexpected error", err));
}

chrome.runtime.onInstalled.addListener(async () => {
    if(!listenMode) {
  //    await registerContentScripts();
    }
    try { const panelWindowInfo = chrome.windows.create({
        url: chrome.runtime.getURL("popup.html"),
        type:"popup",
        height: 150,
        width: 300, });
    } catch (error) { console.log(error); }
  });



