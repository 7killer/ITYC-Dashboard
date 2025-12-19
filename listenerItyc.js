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
let originalSize;


window.addEventListener("load", function () {
  var idC = document.getElementById('itycDashId');
  if(idC)  manifestVersion = idC.getAttribute('ver');             

  document.addEventListener("fullscreenchange", manageGoInFullScreen);
  document.addEventListener("webkitfullscreenchange", manageGoInFullScreen);
  document.addEventListener("mozfullscreenchange", manageGoInFullScreen);
  document.addEventListener("MSFullscreenChange", manageGoInFullScreen);
  document.documentElement.setAttribute("data-theme", drawTheme);
//  chrome.tabs.onActivated.addListener(manageGoInFullScreen);
  dashState = "notInstall";
  const targetIframe = foundVRIframe();
  if(targetIframe) {
    sendMaxSize(targetIframe);
  }
  
  manageFullScreen2();
});

function detectIframeSize(targetIframe) {
  originIframeWidth = Number(document.defaultView.getComputedStyle(targetIframe).width.replace('px', ''));
  originIframeHeight =  Number(document.defaultView.getComputedStyle(targetIframe).height.replace('px', ''));

}
function manageGoInFullScreen()
{
  const targetIframe = foundVRIframe();
  if(targetIframe) {
    sendVRFullScreen(targetIframe);
    sendMaxSize(targetIframe);
  }
  manageFullScreen2();
}

function foundVRIframe() {
  const iframeO = Array.from(document.getElementsByClassName('iframe-class'));
  return targetIframe = iframeO.find(iframe => 
    iframe.getAttribute('src') === "https://play.offshore.virtualregatta.com/"
  );
   
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
        }
      } else if (msg.order === "param") {
        drawTheme = msg.theme;
        window.localStorage.setItem('addOnTheme', drawTheme);
        document.documentElement.setAttribute("data-theme", drawTheme);

        gameSize = msg.gameSize;
        window.localStorage.setItem('addOnGameSize', gameSize);
        
        dashState = msg.state;
        
        
        if(!msg.paramReceived )
        {  const targetIframe = foundVRIframe();
          if(targetIframe) 
            sendMaxSize(targetIframe);
        }
      }
      manageFullScreen2();
    }
    
  }
  return true;
};


function sendMaxSize(iframe)
{
  let winHeight = window.innerHeight;
  let winWidth = window.innerWidth;
        
  /* remove padding-left and right */
  winWidth  -= 80;
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
          
          if(gameSize == 0) 
            ourDiv.style.setProperty('max_width', 'none');
          else
            ourDiv.style.setProperty('max_width', '1080px');
          ourDiv.style.setProperty('margin_left', 'auto');
          ourDiv.style.setProperty('margin_right', 'auto');
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
          dashState = "install";
        }
      } else if(dashState == "detected")
      {
        let ourDiv = document.getElementById('dashIntegRow');
        if(ourDiv) ourDiv.remove();        
      }
	    const targetElement = document.querySelector('[data-colibri-id="1752-c203"]');     
      if (targetElement) {
        targetElement.style.setProperty('text-align', 'center'); 
      }

      if(gameSize != 0) {
        let div = document.querySelector(  '#page-top > div.page-header.style-1098.style-local-1342-h1.position-relative.h-footer-parallax-header-class > div');
        if(div) div.style.setProperty('display', 'none', 'important');

        div = document.querySelector('#hero');
        if(div) {
          div.style.setProperty('padding-top', '10px', 'important');
          div.style.backgroundImage = 'none';
        }

        div = document.querySelector('div[data-colibri-id="1342-h1"]');
        if(div) div.style.setProperty('display', 'none', 'important');
        
        div = document.querySelector('div[data-colibri-id="1342-h2"]');
        if(div) div.style.removeProperty('position');

        let elements = document.querySelectorAll('.h-section-boxed-container');
        elements.forEach(el => {
          originalSize = document.defaultView.getComputedStyle(el).getPropertyValue('max-width');
          el.style.setProperty('max-width', '100%', 'important');
        });
      } else
      {
        let div = document.querySelector('#page-top > div.page-header.style-1098.style-local-1342-h1.position-relative.h-footer-parallax-header-class > div');
        if(div) div.style.removeProperty('display');

        div = document.querySelector('#hero');
        if(div) {
          div.style.setProperty('padding-top', '120px', 'important');
          div.style.backgroundImage = 'none';
        }

        div = document.querySelector('div[data-colibri-id="1342-h2"]');
        if(div) div.style.removeProperty('position');

        div = document.querySelectorAll('.h-section-boxed-container');
        div.forEach(el => {
          el.style.setProperty('max-width', originalSize);
        });

        div = document.querySelector('div[data-colibri-id="1342-h1"]');
        if(div)
        {
          div.style.removeProperty('display');
        }
        fullScreenState =  false;
      }
      reduceLangFlag();
    }  catch(error) {console.log(error);}
  }
}
