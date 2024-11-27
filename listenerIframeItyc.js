let drawTheme = "dark";
let gameSize = -1;

let originGameWidth = 0;
let originGameHeight = 0;
let maxScreenWidth = 0;
let maxScreenHeight = 0;
var manifestVersion = "0.0.0";

let fullScreenVR = false;
let readVal = window.localStorage.getItem('addOnTheme');
if(readVal) drawTheme = readVal;

readVal = window.localStorage.getItem('addOnGameSize');
if(readVal) gameSize = readVal;

let dashState = "notInstall";

window.addEventListener("load", function () {
  let idC = document.getElementById('itycDashId');
  if(idC)  manifestVersion = idC.getAttribute('ver');   

  let spacer =  0;
  document.documentElement.setAttribute("data-theme", drawTheme);
  idC =  document.getElementsByClassName('fullscreen VR')[0];
  if(idC && window.parent != window) spacer = Number(idC.style.height.replace('px', ''));
  idC = document.getElementsByClassName('footer')[0];;
  if(idC) spacer += Number(document.defaultView.getComputedStyle(idC).marginTop.replace('px', ''));
  let offsetOrigin = spacer + 5;

  originGameWidth = window.innerWidth;
  originGameHeight = window.innerHeight-offsetOrigin;
  sendAlive();
  dashState = "notInstall";


});


function callRouterZezo() { 
  var idC = document.getElementById('itycDashId');
  if(idC)  chrome.runtime.sendMessage(idC.getAttribute('extId'), {type:"openZezo" });             
}

function callRouterToxxct() { 
  var idC = document.getElementById('itycDashId');
  if(idC)  chrome.runtime.sendMessage(idC.getAttribute('extId'), {type:"openToxxct" });  
}

function callItyc() { 
  var idC = document.getElementById('itycDashId');
  if(idC)  chrome.runtime.sendMessage(idC.getAttribute('extId'), {type:"openItyc" });  
}
function callRouterVrZen() { 
  var idC = document.getElementById('itycDashId');
  if(idC)  chrome.runtime.sendMessage(idC.getAttribute('extId'), {type:"openVrzen" }); 
}


(() => {
  // Should be useless
  if (!window.fetch) return;

  const oldFetch = window.fetch;
  const responseProxy = (response, text) => {

    const proxy = new Proxy(response, {
      get(obj, prop) {

        if(prop === 'text'){
          return () => Promise.resolve(text);
        }
        if(prop === "body"){
          return new ReadableStream({
            start(controller){
                controller.enqueue(new TextEncoder().encode(text));
                controller.close();
            }
        });
        }

        return obj[prop];
      }
    })

    return proxy;
  };

  const handleResponse = async (extId, url, response, body) => {
    const text = await response.text().catch(() => {});

    if (text) {
      chrome.runtime.sendMessage(
        extId,
        {
          url,
          req: JSON.stringify(body),
          resp: text,
          type: "data",
        },
        function (response) {manageAnswer(response);});
    }
    
    return text ? responseProxy(response, text) : response
  };

  window.fetch = async function (...fetchArgs) {
    const idC = document.getElementById("itycDashId");
    const extId = idC?.getAttribute?.('extId')
    let init
    let url

    try {
      if (fetchArgs.length === 2) {
        url = fetchArgs[0].toString()
        init = fetchArgs[1]
      } else {
        url = fetchArgs[0].url.toString()
        init = fetchArgs[0]
      }
    } catch {}

    if (!extId || !url) {
      return oldFetch(...fetchArgs)
    }

    if (
      url.startsWith("https://static.virtualregatta.com/winds/live/") &&
      url.endsWith("wnd")
    ) {
      chrome.runtime.sendMessage(
        extId,
        { url: url,type: "wndCycle" },
        function (response) {manageAnswer(response);}
      );
      
    }

    if (!checkUrl(url)) {
      return oldFetch(...fetchArgs)
    }
    
    let body
    
    try {
      if (init.body instanceof Blob) {
        // Blob to text to object
        body = sanitizeBody(JSON.parse(await init.body.text()));
      } else if (Object.getPrototypeOf(init.body) === Object.prototype) {
        // Object
        body = init.body
      } else if (typeof body === 'string') {
        // Attempt to convert string to object
        body = JSON.parse(init.body)
      }
    } catch {}

    if (!body) {
      return oldFetch(...fetchArgs)
    }

    return oldFetch(...fetchArgs).then(response => 
      response.ok
        ? handleResponse(extId, url, response, body)
        : response
    )
  };
})();

function checkUrl(url) {
  if(!url) return false;
  url = url ? url.toLowerCase() : url;
          
  if(url &&
  (url.startsWith("https://prod.vro.sparks.virtualregatta.com")
  || url.startsWith("https://vro-api-ranking.prod.virtualregatta.com")
  || url.startsWith("https://vro-api-client.prod.virtualregatta.com"))
  || url.startsWith("https://dev.vro.sparks.virtualregatta.com")
  || url.startsWith("https://vro-api-ranking.devel.virtualregatta.com")
  || url.startsWith("https://vro-api-client.devel.virtualregatta.com")) 
      return true;
  else
      return false;

}

function sanitizeBody(body) {
  // We don't want sensitive data (email, password)
  // to transit through the extension
  delete body.password
  delete body.username
return body
}



function createContainer() {
    //search for existing div
    let ourDiv = document.getElementById('dashIntegRow');
    if(ourDiv) ourDiv.remove();
  
    ourDiv = document.createElement( 'div' );
    ourDiv.id = 'dashIntegRow';
    
    if(gameSize!=0) 
      ourDiv.style.maxWidth="1080px";
    else
      ourDiv.style.maxWidth="none";
    ourDiv.style.userSelect='none';
    ourDiv.style.zIndex="1";
    let ourDiv2 = document.createElement( 'div' );
    ourDiv2.id = 'dashInteg';
  
    ourDiv.appendChild(ourDiv2);
    //append all elements
    let gameDiv = document.getElementById('gameContainer');
    if(!gameDiv) gameDiv = document.getElementsByClassName('gameDiv')[0];;
    
    if(gameDiv) gameDiv.appendChild(ourDiv);
    return ourDiv2;
  
}
  var chrono = {
    secondsPass: 0,
    timer: undefined,
 
    Start: function() {
        //Initialisation du nombre de secondes selon la valeur passée en paramètre
        this.secondsPass = 0;
        if(document.getElementById("dashIntegTime")) document.getElementById("dashIntegTime").innerHTML = '+ '+ 0 + 's';
        //Démarrage du chrono
        if(this.timer ) clearInterval(this.timer);
        this.timer = setInterval(this.Tick.bind(this), 1000);
    },
    Reset: function(){

        this.secondsPass = 0;
        clearInterval(this.timer);
        this.timer = setInterval(this.Tick.bind(this), 1000);

    },
    Tick: function() {
        //On actualise la valeur affichée du nombre de secondes
        if(document.getElementById("dashIntegTime")) {
          if (this.secondsPass > 65) document.getElementById("dashIntegTime").innerHTML = '<span style="color:red">+ '+ ++this.secondsPass + 's</span>';
          else document.getElementById("dashIntegTime").innerHTML = '+ '+ ++this.secondsPass + 's';
        }
    },
 
    Stop: function() {
        //quand le temps est écoulé, on arrête le timer
        clearInterval(this.timer);

    }
 
};

var comTimer ;
var aliveTimeout = 1000;
function sendAlive() {
    if(comTimer) clearTimeout(comTimer);
    var idC = document.getElementById('itycDashId');
    if(idC) {
      chrome.runtime.sendMessage(idC.getAttribute('extId'), {type:"alive"},
      function (response) {manageAnswer(response);})
      //console.log('VR alive send');
    }
    comTimer = setTimeout(sendAlive, aliveTimeout);
} 
                    
function manageAnswer(msg) {
    if(!msg) return;      

    if(dashState == "detectedNotDrawn") drawDashBoardDetected();
    if(msg.type=="data") {
    	manageGameInfos(msg);
      if(msg.rstTimer)
        chrono.Start();
      aliveTimeout = 5000;
    }
    
    if(comTimer) {
      clearTimeout(comTimer);
    }
    comTimer = setTimeout(sendAlive, aliveTimeout);

    manageUI(msg);

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
    manageFullScreen2();
    sendParameter2Top(drawTheme,gameSize);
  }
}

function fillDashContainer(content)
{
  let idC = document.getElementById("gameCanvas"); 
  let ret = false;
  if(idC) {
    let ourDiv = document.getElementById('dashInteg');
    if(!ourDiv) { //page has been refresh but not dashboard tab
        ourDiv = createContainer();
    }
    ourDiv.innerHTML = content;
    ret = true;
  }
  return ret;
}

function manageGameInfos(msg) {

    if(!msg) return;
    fillDashContainer(msg.content);
    if(msg.rid !="") {
        let div = document.getElementById('rt:' + msg.rid);
        if(div) div.addEventListener("click", callRouterZezo);
        div = document.getElementById('vrz:' + msg.rid);
        if(div) div.addEventListener("click", callRouterVrZen);
        div = document.getElementById('pl:' + msg.rid);
        if(div) div.addEventListener("click", callRouterToxxct);
        div = document.getElementById('ityc:' + msg.rid);
        if(div) div.addEventListener("click", callItyc);
    }
    dashState = "detected";
}

function drawDashBoardDetected()
{
    let outputTable =  '<table id="raceStatusTable">'
    + '<thead>'
    + '<tr><th>ITYC Dashboard</th></tr>'
    + '</thead>'
    + '<tbody>'
    + '<tr><td>Dashboard détectée / Dashboard detected</td></tr>'
    + '</tbody>'
    + '</table>';
    fillDashContainer(outputTable);
    dashState = "detectedNotDrawn";
}



window.onmessage = function(e) {
  let msg = e.data;
  if(msg && msg.port && msg.port==("VR2Iframe" + manifestVersion)) {
    
    if (msg.order === "maxSize") {
        maxScreenWidth = msg.screenW;
        maxScreenHeight = msg.screenH;
        manageFullScreen2();
    } else if (msg.order === "fullScreenVR") {
      fullScreenVR = msg.fullScreenVR;
    }
  }
  return true;
};

function sendSize2Top(w,h)
{
  window.top.postMessage(
    { port:"ItycIframe2VR" + manifestVersion,
      order: "resize",
        w : w,
        h : h
    },'*');
}

function sendParameter2Top(theme,gameSize)
{
  let paramReceived = false;
  if(originGameWidth == 0 || originGameHeight== 0)
    console.log("warn original size not loaded");
  
  if(originGameWidth == 0 || originGameHeight== 0
    || maxScreenWidth == 0 || maxScreenHeight== 0)
    paramReceived = 1;
  window.top.postMessage(
    { port:"ItycIframe2VR" + manifestVersion,
      order: "param",
      theme : theme,
      gameSize : gameSize,
      state : dashState,
      paramReceived : paramReceived
    },'*');
}


function manageFullScreen2() {
  // iframe height
  let ourDiv = document.getElementById('dashInteg');
  if(!ourDiv) return;
  
  let spacer =  0;
  let fullScreenVRLogo =  0;
  let dashRowH =  0;
  let idC =  document.getElementsByClassName('fullscreen VR')[0];
  if(idC && window.parent != window) fullScreenVRLogo = Number(idC.style.height.replace('px', ''));
  idc = document.getElementsByClassName('footer')[0];;
  if(idC) spacer = Number(document.defaultView.getComputedStyle(idC).marginTop.replace('px', ''));
  idC = document.getElementById("dashIntegRow");
  if(idC) dashRowH = Number(document.defaultView.getComputedStyle(idC).height.replace('px', ''));
  let offsetDash = spacer*2 + fullScreenVRLogo + dashRowH + 10;

  if(window.parent == window)
  {
    maxScreenWidth = window.innerWidth;
    maxScreenHeight = window.innerHeight;
    offsetDash = spacer/2+dashRowH+5;
    let fullScreenBt = document.getElementsByClassName('footer')[0];
    if(fullScreenBt) fullScreenBt.style.display = 'none';
  }
  if(originGameWidth == 0 || originGameHeight == 0
    || maxScreenWidth == 0 || maxScreenHeight == 0)
   return;

  try {
    let sendSize = false;
    let adjustedSizeW = originGameWidth;
    let adjustedSizeH = originGameHeight;
    const gameRatio = originGameWidth/originGameHeight;
    let vrLogo = document.getElementsByClassName('logo VR')[0];
    if(document.defaultView.getComputedStyle(vrLogo).display == 'none')
    {// game is loaded
      if(fullScreenVR == true)
      {

      } else
      {
        if(gameSize!=0 && window.parent != window)
        {
          adjustedSizeW = Math.ceil(maxScreenWidth*(gameSize==0?1:gameSize/100));
          adjustedSizeH = Math.ceil(maxScreenHeight*(gameSize==0?1:gameSize/100));
        }
        if((adjustedSizeH + offsetDash) > maxScreenHeight)
        {
          adjustedSizeH = Math.ceil(maxScreenHeight-offsetDash);
        }
        if(adjustedSizeW > maxScreenWidth) adjustedSizeW = maxScreenWidth; 
        sendSize = true;
      }
    } else
    {
      if(dashState == "detectedNotDrawn") {
        idC = document.getElementById("gameCanvas"); 
        let tempGameW = Math.ceil(Number(document.defaultView.getComputedStyle(idC).width.replace('px', '')));
        let tempGameH = Math.ceil(Number(document.defaultView.getComputedStyle(idC).height.replace('px', '')));
        adjustedSizeW = tempGameW;
        adjustedSizeH = tempGameH+offsetDash;
        sendSize = true;
        dashState == "detected";
      }
    }  
        
    if(window.parent == window && (adjustedSizeH+offsetDash+10) > window.innerHeight)
    {// acces by iframe page most of the times
      adjustedSizeH = Math.ceil(window.innerHeight -  offsetDash-spacer-10);
      adjustedSizeW = window.innerWidth;
      sendSize = true;
      idC = document.getElementsByClassName('webgl-content')[0];
    }
    if(sendSize) {
      idC = document.getElementById("gameCanvas"); 
      idC.style.height = adjustedSizeH + "px";
      idC.style.width = adjustedSizeW + "px";
      idC = document.getElementById("dashIntegRow");
      idC.setAttribute("data-theme", drawTheme); 
      idC.style.maxWidth = adjustedSizeW+"px";
      if(window.parent != window) 
      { 
        let h = adjustedSizeH + offsetDash + spacer + fullScreenVRLogo;
        sendSize2Top(adjustedSizeW,h);
        //console.log("normalized iframe"+ adjustedSizeW +"X " + h);                                      
      }  else
      {
        idC = document.getElementById("dashIntegRow");
        idC.style.setProperty('max-width', window.innerWidth+"px", 'important');
        idC = document.getElementById("gameContainer"); 
        idC.style.setProperty('height','auto', 'important');
        idC = document.getElementsByClassName('webgl-content')[0];
        idC.style.setProperty('height','auto', 'important');
        
      }
    }
  } catch (error){ console.log(error);}
}
