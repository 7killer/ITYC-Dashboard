let drawTheme = "dark";
let gameSize = 0;
let gameSizeApply = 0;

let readVal = window.localStorage.getItem('addOnTheme');
if(readVal) drawTheme = readVal;

readVal = window.localStorage.getItem('addOnGameSize');
if(readVal) gameSize = readVal;

let fullScreenState = false;
let dashInstallDrawn = false;
let dashState = "notInstall";
var manifestVersion = "0.0.0";
let originIframeWidth = 0;
let originIframeHeight = 0;
let currentIframeWidth = 0;
let currentIframeHeight = 0;
const managedPageStyles = new WeakMap();
let fallbackToolbarObserver;


window.addEventListener("load", function () {
  var idC = document.getElementById('itycDashId');
  if(idC)  manifestVersion = idC.getAttribute('ver');             

  document.addEventListener("fullscreenchange", manageGoInFullScreen);
  document.addEventListener("webkitfullscreenchange", manageGoInFullScreen);
  document.addEventListener("mozfullscreenchange", manageGoInFullScreen);
  document.addEventListener("MSFullscreenChange", manageGoInFullScreen);
  window.addEventListener('resize', () => {
    const iframe = foundVRIframe();
    if (iframe) {
      sendMaxSize(iframe);
      syncFallbackToolbar(iframe);
    }
  });
  document.documentElement.setAttribute("data-theme", drawTheme);
//  chrome.tabs.onActivated.addListener(manageGoInFullScreen);
  dashState = "notInstall";
  manageFullScreen2();
  const targetIframe = foundVRIframe();
  if(targetIframe) {
    sendMaxSize(targetIframe);
  }
});

function detectIframeSize(targetIframe) {
  originIframeWidth = Number(document.defaultView.getComputedStyle(targetIframe).width.replace('px', ''));
  originIframeHeight =  Number(document.defaultView.getComputedStyle(targetIframe).height.replace('px', ''));

}
function manageGoInFullScreen()
{
  manageFullScreen2();
  const targetIframe = foundVRIframe();
  if(targetIframe) {
    sendVRFullScreen(targetIframe);
    sendMaxSize(targetIframe);
  }
}

function foundVRIframe() {
  return Array.from(document.querySelectorAll('iframe[src]')).find(iframe => {
    try { return new URL(iframe.src).origin === 'https://play.offshore.virtualregatta.com'; }
    catch { return false; }
  });
}

function findClosest(element, selectors) {
  if (!element?.closest) return null;
  for (const selector of selectors) {
    const match = element.closest(selector);
    if (match) return match;
  }
  return null;
}

function getGameLayout(iframe) {
  const host = findClosest(iframe, ['[data-colibri-id]', '.h-element']) || iframe?.parentElement || iframe;
  return {
    host,
    spacer: host?.previousElementSibling || null,
    column: findClosest(iframe, ['.h-column__inner', '.h-column']),
    boxed: findClosest(iframe, ['.h-section-boxed-container']),
    hero: findClosest(iframe, ['#hero']) || document.getElementById('hero')
  };
}

function syncFallbackToolbar(iframe) {
  const row = document.getElementById('dashIntegRow');
  if (!iframe || row?.previousElementSibling !== iframe) return;
  const width = iframe.getBoundingClientRect().width;
  if (Number.isFinite(width) && width > 0) {
    row.style.width = `${width}px`;
    row.style.maxWidth = '100%';
  }
}

function setPageStyle(element, property, value) {
  if (!element?.style) return;
  let styles = managedPageStyles.get(element);
  if (!styles) {
    styles = new Map();
    managedPageStyles.set(element, styles);
  }
  if (!styles.has(property)) {
    styles.set(property, {
      value: element.style.getPropertyValue(property),
      priority: element.style.getPropertyPriority(property)
    });
  }
  element.style.setProperty(property, value, 'important');
}

function restorePageStyle(element, property) {
  const styles = element && managedPageStyles.get(element);
  const original = styles?.get(property);
  if (!original) return;
  if (original.value) element.style.setProperty(property, original.value, original.priority);
  else element.style.removeProperty(property);
  styles.delete(property);
}

function applyGamePageLayout(iframe) {
  if (!iframe) return;
  const { host, spacer, column, boxed, hero } = getGameLayout(iframe);
  const headerContent = document.querySelector('#page-top > .page-header > [role="banner"], #page-top > .page-header > :first-child');
  if (Number(gameSize) !== 0) {
    setPageStyle(boxed, 'max-width', '100%');
    for (const element of [column, host]) {
      for (const property of ['padding-top', 'padding-right', 'padding-bottom', 'padding-left']) {
        setPageStyle(element, property, '0px');
      }
    }
    setPageStyle(spacer, 'display', 'none');
    setPageStyle(host, 'margin-top', '10px');
    setPageStyle(iframe, 'max-width', 'calc(100% - 40px)');
    setPageStyle(iframe, 'margin-left', 'auto');
    setPageStyle(iframe, 'margin-right', 'auto');
    setPageStyle(iframe, 'display', 'block');
    setPageStyle(hero, 'padding-top', '10px');
    setPageStyle(headerContent, 'display', 'none');
  } else {
    restorePageStyle(boxed, 'max-width');
    for (const element of [column, host]) {
      for (const property of ['padding-top', 'padding-right', 'padding-bottom', 'padding-left']) {
        restorePageStyle(element, property);
      }
    }
    restorePageStyle(spacer, 'display');
    restorePageStyle(host, 'margin-top');
    restorePageStyle(iframe, 'max-width');
    setPageStyle(iframe, 'margin-left', 'auto');
    setPageStyle(iframe, 'margin-right', 'auto');
    setPageStyle(iframe, 'display', 'block');
    restorePageStyle(hero, 'padding-top');
    restorePageStyle(headerContent, 'display');
  }
}

function reduceLangFlag() {
  let flag = document.getElementById('trp-floater-ls');
  if(flag) {
    flag.style.setProperty('right', '0', 'important');
    flag.style.setProperty('min-width', 'auto', 'important');
  } 
  flag = document.querySelectorAll('img[src$="flags/fr_FR.png"]');
  for(let i=0; i< flag.length;i++)
  {
    flag[i].parentElement.lastChild.nodeValue = "FR";
  }

  flag = document.querySelectorAll('img[src$="flags/en_GB.png"]');
  for(let i=0; i< flag.length;i++)
  {
    flag[i].parentElement.lastChild.nodeValue = "EN";
  }

}


window.onmessage = function(e) {
  let msg = e.data;
  if(msg && msg.port ) {
    if(msg.port==("ItycIframe2VR" + manifestVersion)) {
      if (msg.order === "resize") {
        const targetIframe = foundVRIframe();
        if (targetIframe) {
          if(originIframeWidth == 0 || originIframeHeight == 0 )
          {
            detectIframeSize(targetIframe);
          }
          currentIframeWidth = msg.w;
          currentIframeHeight = msg.h;
          targetIframe.setAttribute("height", msg.h);
          targetIframe.setAttribute("width", msg.w );
          syncFallbackToolbar(targetIframe);
        }
      } else if (msg.order === "param") {
        drawTheme = msg.theme;
        window.localStorage.setItem('addOnTheme', drawTheme);
        document.documentElement.setAttribute("data-theme", drawTheme);

        gameSize = msg.gameSize;
        window.localStorage.setItem('addOnGameSize', gameSize);
        
        dashState = msg.state;
        
        
      }
      manageFullScreen2();
      if (msg.order === 'param' && !msg.paramReceived) {
        const targetIframe = foundVRIframe();
        if (targetIframe) sendMaxSize(targetIframe);
      }
    }
    
  }
  return true;
};


function sendMaxSize(iframe)
{
  let winHeight = window.innerHeight;
  let winWidth = window.innerWidth;
  const layoutWidth = getGameLayout(iframe).boxed?.getBoundingClientRect?.().width;
  if (Number.isFinite(layoutWidth) && layoutWidth > 0) {
    winWidth = Math.min(winWidth, Math.floor(layoutWidth));
  }
  // Match the 20 px margins on both sides of the embedded game.
  if (Number(gameSize) !== 0) winWidth = Math.max(1, winWidth - 40);
  winHeight  -= 20;
  iframe.contentWindow.postMessage(
    { port:"VR2Iframe" + manifestVersion,
      order: "maxSize",
      screenW : winWidth,
      screenH : winHeight
    }, '*');
}

function sendVRFullScreen(iframe)  {
  let fullscreen = false;
  if (document.fullscreenElement || document.webkitFullscreenElement 
    || document.mozFullScreenElement || document.msFullscreenElement)
    fullscreen = true;

        
  iframe.contentWindow.postMessage(
    { port:"VR2Iframe" + manifestVersion,
      order: "fullScreenVR",
      fullScreenVR : fullscreen
    }, '*');
}

function manageFullScreen2() {

  if (document.fullscreenElement || document.webkitFullscreenElement 
    || document.mozFullScreenElement || document.msFullscreenElement)
  {

  } else
  {
    try {

      if(dashState == "notInstall")
      {
        const targetIframe = foundVRIframe();
        if (targetIframe) {
          let ourDiv = document.getElementById('dashIntegRow');
          if(ourDiv) ourDiv.remove();
        
          ourDiv = document.createElement( 'div' );
          ourDiv.id = 'dashIntegRow';
          
          ourDiv.style.maxWidth = '100%';
          ourDiv.style.marginLeft = 'auto';
          ourDiv.style.marginRight = 'auto';
          ourDiv.style.marginTop = '10px';
          ourDiv.style.userSelect='none';
          ourDiv.style.zIndex="1";
          let ourDiv2 = document.createElement( 'div' );
          ourDiv2.id = 'dashInteg';
          ourDiv.appendChild(ourDiv2);
          ourDiv.innerHTML = '<table id="raceStatusTable">'
          + '<thead>'
          + '<tr><th>ITYC Dashboard</th></tr>'
          + '</thead>'
          + '<tbody>'
          + '<tr><td>❌ Pas de dashboard détectée / No dashboard detected</td></tr>'
          + '</tbody>'
          + '</table>';
          targetIframe.parentNode.insertBefore(ourDiv, targetIframe.nextSibling);
          fallbackToolbarObserver?.disconnect();
          fallbackToolbarObserver = new ResizeObserver(() => syncFallbackToolbar(targetIframe));
          fallbackToolbarObserver.observe(targetIframe);
          dashState = "install";
        }
      } else if(dashState == "detected")
      {
        let ourDiv = document.getElementById('dashIntegRow');
        if(ourDiv) ourDiv.remove();        
        fallbackToolbarObserver?.disconnect();
        fallbackToolbarObserver = null;
      }
      applyGamePageLayout(foundVRIframe());
      syncFallbackToolbar(foundVRIframe());
      if (Number(gameSize) === 0) fullScreenState = false;
      reduceLangFlag();
    }  catch(error) {console.log(error);}
  }
}
