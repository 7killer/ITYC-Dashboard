let drawTheme = "dark";
let gameSize = 0;
let gameSizeApply = 0;

let readVal = window.localStorage.getItem('addOnTheme');
if(readVal) drawTheme = readVal;

readVal = window.localStorage.getItem('addOnGameSize');
if(readVal) gameSize = readVal;

let fullScreenState = false;
let dashStateDetected = false;

window.addEventListener("load", function () {

  

    manageFullScreen();
});

window.onmessage = function(e) {
  if (e.data ) {
    if(e.data.iframeHeight && e.data.iframeWidth)
    {
      let iframeO = document.getElementsByClassName('iframe-class');
  
      for(let i=0; i< iframeO.length;i++)
      {
        let srcI = iframeO[i].getAttribute('src');
        if(srcI == "https://play.offshore.virtualregatta.com/")
        {
          iframeO[i].setAttribute("height", e.data.iframeHeight);
          iframeO[i].setAttribute("width", e.data.iframeWidth);
  
          const winHeight = window.innerHeight;
          const winWidth = window.innerWidth;
          iframeO[i].contentWindow.postMessage({winWidth:winWidth,winHeight:winHeight}, '*');
        }
  
      }
    }
    if(e.data.drawTheme)
    {
      drawTheme = e.data.theme;
      window.localStorage.setItem('addOnTheme', e.data.drawTheme);
      document.documentElement.setAttribute("data-theme", drawTheme);
    }
    if(e.data.gameSize || e.data.gameSize == 0)
    {
      gameSize = e.data.gameSize;
      window.localStorage.setItem('addOnGameSize', e.data.gameSize);
      manageFullScreen();
    }
  }
};

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

let pContPadding ="";
let originalSize = "100%";
function manageFullScreen(e) {
  if(gameSize != 0) {
    try {
      if(!fullScreenState || gameSizeApply != gameSize) {
        let div = document.getElementById('hero');
        if(div) div.style.setProperty('display', 'none', 'important');
        div = document.querySelector('div[data-colibri-id="1342-h1"]');
        if(div) div.style.setProperty('display', 'none', 'important');
        
        let elements = document.querySelectorAll('.h-section-boxed-container');
        elements.forEach(el => {
          originalSize = document.defaultView.getComputedStyle(el).getPropertyValue('max-width');
          el.style.setProperty('max-width', '100%', 'important');
        });
        window.scrollTo(0, 0);
        gameSizeApply = gameSize;
        fullScreenState =  true;
      }
      reduceLangFlag();
    } catch {}

  } else
  {
    try {
      if(fullScreenState || gameSizeApply != gameSize) {
        let div =document.getElementById('hero');
        if(div) div.style.removeProperty('display');

        div = document.querySelectorAll('.h-section-boxed-container');
        div.forEach(el => {
          el.style.setProperty('max-width', originalSize);
        });

        div = document.querySelector('div[data-colibri-id="1342-h1"]');
        if(div)
        {
          div.style.removeProperty('display');
          const targetElement = document.querySelector('[data-colibri-id="1752-c12"]');
          if (targetElement) {
            let topPosition = targetElement.getBoundingClientRect().top + window.scrollY;
            topPosition += Math.ceil(Number(document.defaultView.getComputedStyle(div).height.replace('px', '')));
            window.scrollTo({
              top: topPosition,
              behavior: 'smooth'
            });
          }
        }
        fullScreenState =  false;
        gameSizeApply = gameSize;
      }
      reduceLangFlag();
    } catch {}
  }
}

