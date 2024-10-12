let drawTheme = "dark";
let gameSize = 0;

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
    if(e.data.iframeNewSize)
    {
      console.log("computed Iframe H " + e.data.iframeNewSize);

      let iframeO = document.getElementsByClassName('iframe-class');
  
      for(let i=0; i< iframeO.length;i++)
      {
        let srcI = iframeO[i].getAttribute('src');
        if(srcI == "https://play.offshore.virtualregatta.com/")
        {
          iframeO[i].setAttribute("height", e.data.iframeNewSize);
  
        }
  
      }
  
    }
    
   //   alert('It works!');
  }
};

let pContPadding =""
function manageFullScreen(e) {
  if(gameSize != 0) {
    try {
      if(!fullScreenState) {
        fullScreenState =  true;
      }
    } catch {}

  } else
  {
    try {
      if(fullScreenState) {
        fullScreenState =  false;
      }
    } catch {}
  }
}


function manageUI(msg)
{
  if(msg.theme)
  {
	  drawTheme = msg.theme;
    window.localStorage.setItem('addOnTheme', msg.theme);
    document.documentElement.setAttribute("data-theme", drawTheme);
  }
  if(msg.gameSize != undefined)
  {
    gameSize = msg.gameSize;
    window.localStorage.setItem('addOnGameSize', msg.gameSize);
    manageFullScreen();
  }
}

