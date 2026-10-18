var messageList = [];
var lastId = 0;
function handleResponse(message)
{
  if(message) {
    lastId += 1;
    message.rcvId = lastId;
    messageList.push(message);
    
  }
  window.wrappedJSObject.messageList = cloneInto(messageList, window);
}

function setLastId(lastId)
{ 
  if(Number.isFinite(lastId))
    messageList = messageList.filter(message => message.rcvId > lastId);
}

function notify(message) {
  browser.runtime.sendMessage({ message }).then(handleResponse).catch(() => handleResponse(null));
}

exportFunction(notify, window, { defineAs: "notify" });
exportFunction(setLastId, window, { defineAs: "setLastId" });

function injectScript(fileName, onLoad) {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(fileName);
  script.onload = function () {
    this.remove();
    if (onLoad) onLoad();
  };
  (document.head || document.documentElement).appendChild(script);
}

injectScript('vr_game_loading.js', function () {
  injectScript('vr_game_grib_loading.js', function () {
    injectScript('vr_keep_awake.js', function () {
      injectScript('listenerIframeItyc.js');
    });
  });
});
