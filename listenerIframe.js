let drawTheme = "dark";
let gameSize = 0;

let readVal = window.localStorage.getItem('addOnTheme');
if(readVal) drawTheme = readVal;

readVal = window.localStorage.getItem('addOnGameSize');
if(readVal) gameSize = readVal;

let fullScreenState = false;
let dashStateDetected = false;

window.addEventListener("load", function () {
    document.documentElement.setAttribute("data-theme", drawTheme);
    drawDashBoardInstalled();
    manageFullScreen();

    sendAlive();
});

let pContPadding =""
function manageFullScreen(e) {
   // window height
   const winHeight = window.innerHeight;
   const winWidth = window.innerWidth;
 
   console.log("screen " + winWidth + " x " + winHeight);
 
   let canvaSizeOriginW =  0;
   let canvaSizeOriginH =  0;
 
   
   let spacer =  0;
   let dashRowH =  0;
   let idC = document.getElementById("gameCanvas");
   if(idC)
   {
     canvaSizeOriginW = Math.ceil(Number(document.defaultView.getComputedStyle(idC).width.replace('px', '')));
     canvaSizeOriginH = Math.ceil(Number(document.defaultView.getComputedStyle(idC).height.replace('px', '')));
   }
   idC = document.getElementsByClassName('fullscreen VR')[0];
   if(idC)
   {
     spacer = Number(idC.style.height.replace('px', ''));
   }
   idC = document.getElementsByClassName('footer')[0];;
   if(idC)
   {
     
     spacer += Number(document.defaultView.getComputedStyle(idC).marginTop.replace('px', ''))*2;
   }
   idC = document.getElementById("dashIntegRow");
   if(idC)
   {
     dashRowH = Number(document.defaultView.getComputedStyle(idC).height.replace('px', ''));
   }
   let ourDiv = document.getElementById('dashInteg');
   
  if(ourDiv && canvaSizeOriginH && canvaSizeOriginW != "" && canvaSizeOriginW !=0)
  {
     // game is loaded
 
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
        idC = document.getElementById("gameCanvas");       
        idC.setAttribute("data-theme", drawTheme);
        idC.style.height = canvaSizeOriginH+"px";
        idC.style.width = canvaSizeOriginW+"px";
        let iframeSize = canvaSizeOriginH + spacer + dashRowH + 10;
        window.top.postMessage({iframeNewSize : iframeSize}, '*');  
      } catch {}
    }
  }
}


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
    return url.startsWith("https://prod.vro.sparks.virtualregatta.com")
      || url.startsWith("https://vro-api-ranking.prod.virtualregatta.com")
      || url.startsWith("https://vro-api-client.prod.virtualregatta.com")
      || url.startsWith("https://dev.vro.sparks.virtualregatta.com")
      || url.startsWith("https://vro-api-ranking.devel.virtualregatta.com")
      || url.startsWith("https://vro-api-client.devel.virtualregatta.com")
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
    
    if(!fullScreenState) 
      ourDiv.style.maxWidth="1080px";
    else
      ourDiv.style.maxWidth="none";
    let ourDiv2 = document.createElement( 'div' );
    ourDiv2.id = 'dashInteg';
  
    ourDiv.appendChild(ourDiv2);
    //append all elements
    let gameDiv = document.getElementsByClassName('et_pb_section et_pb_section_0')[0];
    if(!gameDiv) gameDiv = document.getElementById('gameContainer');
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

function sendAlive() {
    if(comTimer) clearTimeout(comTimer);
    var idC = document.getElementById('itycDashId');
    if(idC) {
      chrome.runtime.sendMessage(idC.getAttribute('extId'), {type:"alive"},
      function (response) {manageAnswer(response);})
    }
    comTimer = setTimeout(sendAlive, 5000);
} 
                    
function manageAnswer(msg) {
    if(!msg) return;      
    if(comTimer) {
        clearTimeout(comTimer);
    }
    comTimer = setTimeout(sendAlive, 5000);
    if(msg.type=="data") {
    	manageGameInfos(msg);
      if(msg.rstTimer)
        chrono.Start();
    }
    if(!dashStateDetected) drawDashBoardDetected();
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
    manageFullScreen();
  }
}

function fillDashContainer(content)
{
  let ourDiv = document.getElementById('dashInteg');
  if(!ourDiv) { //page has been refresh but not dashboard tab
      ourDiv = createContainer();
  }
  ourDiv.innerHTML = content;
}

function manageGameInfos(msg) {

    if(!msg) return;
    fillDashContainer(msg.content);
    if(msg.rid !="") {
        document.getElementById('rt:' + msg.rid).addEventListener("click", callRouterZezo);
        document.getElementById('vrz:' + msg.rid).addEventListener("click", callRouterVrZen);
        document.getElementById('pl:' + msg.rid).addEventListener("click", callRouterToxxct);
        document.getElementById('ityc:' + msg.rid).addEventListener("click", callItyc);
    }
    dashStateDetected = true;
}
function drawDashBoardInstalled()
{
    let outputTable =  '<table id="raceStatusTable">'
    + '<thead>'
    + '<tr><th>ITYC Dashboard</th></tr>'
    + '</thead>'
    + '<tbody>'
    + '<tr><td>❌ Pas de dashboard détectée / No dashboard detected</td></tr>'
    + '</tbody>'
    + '</table>';

    fillDashContainer(outputTable);
    dashStateDetected = false;
}
function drawDashBoardDetected()
{
    let outputTable =  '<table id="raceStatusTable">'
    + '<thead>'
    + '<tr><th>ITYC Dashboard</th></tr>'
    + '</thead>'
    + '<tbody>'
    + '<tr><td>Dashboard détectée /Dashboard detected</td></tr>'
    + '</tbody>'
    + '</table>';
   
    fillDashContainer(outputTable);
    dashStateDetected = true;
}