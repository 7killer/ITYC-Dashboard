let drawTheme = "dark";
let gameSize = -1;

let originGameWidth = 0;
let originGameHeight = 0;
let maxScreenWidth = 0;
let maxScreenHeight = 0;
let loadingStatusHeight = 0;
let loadingStatusHeightChanged = false;
var manifestVersion = "0.0.0";

let fullScreenVR = false;
let readVal = window.localStorage.getItem('addOnTheme');
if(readVal) drawTheme = readVal;

readVal = window.localStorage.getItem('addOnGameSize');
if(readVal) gameSize = readVal;

let dashState = "notInstall";
var responseTimer;


window.addEventListener("load", function () {
  let idC = document.getElementById('itycDashId');
  if(idC)  manifestVersion = idC.getAttribute('ver');   

  let spacer =  0;
  document.documentElement.setAttribute("data-theme", drawTheme);
  idC = findFullscreenButton();
  if(idC && window.parent != window) spacer = elementHeight(idC);
  idC = findGameFooter();
  if(idC) spacer += elementMarginTop(idC);
  let offsetOrigin = spacer + 5;

  originGameWidth = window.innerWidth;
  originGameHeight = window.innerHeight-offsetOrigin;
  sendAlive();
  dashState = "notInstall";
  if (responseTimer) clearTimeout(responseTimer);
  responseTimer = setTimeout(popMsg, 100);


});


function callRouterZezo() { 
  var idC = document.getElementById('itycDashId');
  if(idC) window.notify({type:"openZezo"});
}

function callRouterToxxct() { 
  var idC = document.getElementById('itycDashId');
  if(idC) window.notify({type:"openToxxct"});
}

function callItyc() { 
  var idC = document.getElementById('itycDashId');
  if(idC) window.notify({type:"openItyc"});
}
function callRouterVrZen() { 
  var idC = document.getElementById('itycDashId');
  if(idC) window.notify({type:"openVrzen"});
}
function callRouterSermar() {
  var idC = document.getElementById('itycDashId');
  if(idC) window.notify({type:"openSermar"});
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
      window.notify({
          url,
          req: JSON.stringify(body),
          resp: text,
          type: "data",
        });
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
      window.notify({ url: url, type: "wndCycle" });
      
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



let toolbarOrderObserver;
let toolbarSizeObserver;
const toolbarGameGap = 10;

function findFirst(selectors, root = document) {
  for (const selector of selectors) {
    const match = root?.querySelector?.(selector);
    if (match) return match;
  }
  return null;
}

function findGameContainer() {
  return document.getElementById('gameContainer')
    || findFirst(['[data-game-container]', '[data-unity-container]', '.game-container', '.unity-container'])
    || document.getElementsByClassName('gameDiv')[0]
    || null;
}

function findGameCanvas(container = findGameContainer()) {
  return document.getElementById('gameCanvas')
    || findFirst(['canvas[data-unity]', 'canvas[data-game-canvas]', 'canvas'], container)
    || null;
}

function findClosest(element, selectors) {
  if (!element?.closest) return null;
  for (const selector of selectors) {
    const match = element.closest(selector);
    if (match) return match;
  }
  return null;
}

function findGameWrapper(container = findGameContainer()) {
  return findClosest(container, ['.webgl-content', '[data-game-root]', '.gameDiv']) || container;
}

function findGameFooter() {
  return findFirst(['.gameDiv .footer', '.webgl-content .footer', '[data-game-footer]', 'footer', '.footer']);
}

function findFullscreenButton() {
  return findFirst(['.fullscreen.VR', '[data-game-fullscreen]', '.fullscreen']);
}

function findLoadingLogo(container = findGameContainer()) {
  return findFirst(['.logo.VR', '[data-game-loading-logo]', '.unity-logo', '.loading-logo'], container);
}

function numericCssValue(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function elementHeight(element) {
  if (!element) return 0;
  const rectHeight = element.getBoundingClientRect?.().height;
  if (Number.isFinite(rectHeight) && rectHeight > 0) return rectHeight;
  return numericCssValue(document.defaultView?.getComputedStyle?.(element).height || element.style?.height);
}

function elementWidth(element) {
  if (!element) return 0;
  const rectWidth = element.getBoundingClientRect?.().width;
  if (Number.isFinite(rectWidth) && rectWidth > 0) return rectWidth;
  return numericCssValue(document.defaultView?.getComputedStyle?.(element).width || element.style?.width);
}

function elementMarginTop(element) {
  return numericCssValue(document.defaultView?.getComputedStyle?.(element).marginTop);
}

function fitLoadingToolbar() {
  const row = document.getElementById('dashIntegRow');
  const container = findGameContainer();
  const canvas = findGameCanvas(container);
  if (!row || !container) return false;
  row.hidden = !canvas;
  if (!canvas) return false;
  const wrapper = findGameWrapper(container);
  const bottom = Math.min(window.innerHeight, container.getBoundingClientRect().bottom,
    wrapper?.getBoundingClientRect().bottom ?? window.innerHeight);
  if (!window.gameInstance) {
    canvas.style.display = 'block';
    const available = Math.floor(bottom - container.getBoundingClientRect().top
      - row.getBoundingClientRect().height - toolbarGameGap);
    if (available > 0 && canvas.style.height !== available + 'px') canvas.style.height = available + 'px';
  }
  return true;
}
window.addEventListener('resize', fitLoadingToolbar);

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
    ourDiv.style.marginTop = toolbarGameGap + 'px';
    let ourDiv2 = document.createElement( 'div' );
    ourDiv2.id = 'dashInteg';
  
    ourDiv.appendChild(ourDiv2);
    //append all elements
    let gameDiv = findGameContainer();
    
    if(gameDiv) {
      gameDiv.appendChild(ourDiv);
      toolbarOrderObserver?.disconnect();
      toolbarOrderObserver = new MutationObserver(() => {
        if (ourDiv.parentNode === gameDiv && gameDiv.lastElementChild !== ourDiv) {
          gameDiv.appendChild(ourDiv);
        }
        fitLoadingToolbar();
      });
      toolbarOrderObserver.observe(gameDiv, { childList: true, subtree: true });
      toolbarSizeObserver?.disconnect();
      toolbarSizeObserver = new ResizeObserver(fitLoadingToolbar);
      toolbarSizeObserver.observe(gameDiv);
      toolbarSizeObserver.observe(ourDiv);
      fitLoadingToolbar();
    }
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
      window.notify({type:"alive"});
      //console.log('VR alive send');
    }
    comTimer = setTimeout(sendAlive, aliveTimeout);
} 

function popMsg() {
  if (responseTimer) clearTimeout(responseTimer);
  let msg = window.messageList && window.messageList.pop();
  let lastId = msg ? msg.rcvId : undefined;
  while (msg) {
    if (msg.rcvId > lastId) lastId = msg.rcvId;
    manageAnswer(msg);
    msg = window.messageList.pop();
  }
  window.setLastId(lastId);
  responseTimer = setTimeout(popMsg, 100);
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
  let idC = findGameCanvas() || findGameContainer();
  let ret = false;
  if(idC) {
    let ourDiv = document.getElementById('dashInteg');
    if(!ourDiv) { //page has been refresh but not dashboard tab
        ourDiv = createContainer();
    }
    ourDiv.innerHTML = content;
    fitLoadingToolbar();
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
        div = document.getElementById('srm:' + msg.rid);
        if(div) div.addEventListener("click", callRouterSermar);
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
    } else if (msg.order === "loadingStatusHeight") {
      loadingStatusHeight = Math.max(0, Number(msg.height) || 0);
      loadingStatusHeightChanged = true;
      manageFullScreen2();
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
  const ourDiv = document.getElementById('dashInteg');
  if(!ourDiv) return;
  
  let spacer =  0;
  let fullScreenVRLogo =  0;
  let dashRowH =  0;
  const fullScreenButton = findFullscreenButton();
  if(fullScreenButton && window.parent != window) fullScreenVRLogo = elementHeight(fullScreenButton);
  const footer = findGameFooter();
  if(footer) spacer = elementMarginTop(footer);
  const toolbarRow = document.getElementById('dashIntegRow');
  if(toolbarRow) dashRowH = elementHeight(toolbarRow);
  let offsetDash = spacer*2 + fullScreenVRLogo + dashRowH + loadingStatusHeight + toolbarGameGap;

  if(window.parent == window)
  {
    maxScreenWidth = window.innerWidth;
    maxScreenHeight = window.innerHeight;
    offsetDash = spacer/2+dashRowH+toolbarGameGap;
    if(footer) footer.style.display = 'none';
  }
  if(originGameWidth == 0 || originGameHeight == 0
    || maxScreenWidth == 0 || maxScreenHeight == 0)
   return;

  try {
    const container = findGameContainer();
    const canvas = findGameCanvas(container);
    if (!container || !canvas || !toolbarRow) return;
    let sendSize = false;
    let adjustedSizeW = originGameWidth;
    let adjustedSizeH = originGameHeight;
    const vrLogo = findLoadingLogo(container);
    const logoVisible = vrLogo && document.defaultView.getComputedStyle(vrLogo).display !== 'none';
    if(window.gameInstance || !logoVisible)
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
        let tempGameW = Math.ceil(elementWidth(canvas));
        let tempGameH = Math.ceil(elementHeight(canvas));
        adjustedSizeW = tempGameW;
        adjustedSizeH = tempGameH+offsetDash;
        sendSize = true;
        dashState = "detected";
      }
      else if(loadingStatusHeightChanged) {
        sendSize = true;
      }
    }  
        
    if(window.parent == window && (adjustedSizeH+offsetDash+10) > window.innerHeight)
    {// acces by iframe page most of the times
      adjustedSizeH = Math.ceil(window.innerHeight -  offsetDash-spacer-10);
      adjustedSizeW = window.innerWidth;
      sendSize = true;
    }
    if(sendSize) {
      canvas.style.height = adjustedSizeH + "px";
      canvas.style.width = adjustedSizeW + "px";
      toolbarRow.setAttribute("data-theme", drawTheme);
      toolbarRow.style.maxWidth = adjustedSizeW+"px";
      if(window.parent != window) 
      { 
        let h = adjustedSizeH + offsetDash + spacer + fullScreenVRLogo;
        sendSize2Top(adjustedSizeW,h);
        loadingStatusHeightChanged = false;
        //console.log("normalized iframe"+ adjustedSizeW +"X " + h);                                      
      }  else
      {
        toolbarRow.style.setProperty('max-width', window.innerWidth+"px", 'important');
        container.style.setProperty('height','auto', 'important');
        const wrapper = findGameWrapper(container);
        if(wrapper) wrapper.style.setProperty('height','auto', 'important');
        
      }
    }
  } catch (error){ console.log(error);}
}
