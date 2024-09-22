// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var version = "1.0";
var debuggeeTab;
var dashboardTab;


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

chrome.runtime.onInstalled.addListener(async () => {
    const scripts = [{
      id: 'listener',
      js: ['listener.js'],
      matches: ['https://www.virtualregatta.com/*/offshore-*/*',"https://www.virtualregatta.com/*/offshore-*-iframe/*","https://beta.virtualregatta.com/*"],
      runAt: 'document_start',
      world: 'MAIN',
    }];
    const ids = scripts.map(s => s.id);
    await chrome.scripting.unregisterContentScripts({ids}).catch(() => {});
    await chrome.scripting.registerContentScripts(scripts).catch(() => {});
    
    try { const panelWindowInfo = chrome.windows.create({
        url: chrome.runtime.getURL("popup.html"),
        type:"popup",
        height: 150,
        width: 300, });
    } catch (error) { console.log(error); }
  });



