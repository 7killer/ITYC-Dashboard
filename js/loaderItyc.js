function injectScript(fileName, onLoad) {
    var s = document.createElement('script');
    s.src = chrome.runtime.getURL(fileName);
    s.onload = function() {
        this.remove();
        if (onLoad) onLoad();
    };
    (document.head || document.documentElement).appendChild(s);
}

injectScript('vr_game_loading.js', function() {
    injectScript('listenerItyc.js');
});



