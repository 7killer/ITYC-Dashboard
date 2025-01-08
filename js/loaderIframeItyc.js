 var s = document.createElement('script');
 s.src = chrome.runtime.getURL('listenerIframeItyc.js');
 s.onload = function() {
     this.remove();
 };
 (document.head || document.documentElement).appendChild(s);


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
  if(lastId)
    messageList = messageList.filter(message => message.rcvId >= lastId);
}

function notify(message) {
  browser.runtime.sendMessage({ message }).then(handleResponse);
}

  exportFunction(notify, window, { defineAs: "notify" });
  exportFunction(setLastId, window, { defineAs: "setLastId" });
