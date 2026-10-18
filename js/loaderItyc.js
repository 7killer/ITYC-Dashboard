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
  injectScript('listenerItyc.js');
});



