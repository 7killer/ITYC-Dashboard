
let drawTheme = "dark";
if(localStorage["addOnTheme"])
    drawTheme = localStorage["addOnTheme"];

let mode="pirate";
if(localStorage["addOnMode"])
  mode = localStorage["addOnMode"];
if(mode=="incognito")
  drawTheme = "light";

window.addEventListener("load", function () {
    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.documentElement.style.width = '100%';
    document.body.style.width = '100%';
    document.documentElement.setAttribute("data-theme", drawTheme);
    drawDashBoardInstalled();
});


function callRouterZezo() { 
  if(zezoUrl!= "") window.open(zezoUrlRace, openNewTab ? zezoUrl :"_blank");
}

function callRouterToxxct() { 
  if(toxxctUrl!= "")  window.open(toxxctUrlRace , openNewTab ?toxxctUrl :"_blank" );
}

function callItyc() { 
  if(itycUrl!= "")  window.open(itycUrlRace , openNewTab ?itycUrl:"_blank" );
}
let openNewTab = false;
let zezoUrl = "";
let toxxctUrl = "";
let itycUrl = "";
let zezoUrlRace = "";
let toxxctUrlRace = "";
let itycUrlRace = "";


(function(xhr) {

    var XHR = XMLHttpRequest.prototype;

    var open = XHR.open;
    var send = XHR.send;
    var setRequestHeader = XHR.setRequestHeader;

    XHR.open = function(method, url) {
        this._method = method;
        this._url = url;
        this._requestHeaders = {};
        this._startTime = (new Date()).toISOString();
        return open.apply(this, arguments);
    };

    XHR.setRequestHeader = function(header, value) {
        this._requestHeaders[header] = value;
        return setRequestHeader.apply(this, arguments);
    };

    XHR.send = function(postData) {

        this.addEventListener('load', function() {
            var endTime = (new Date()).toISOString();

            if(checkUrl(this._url)) {
                var responseHeaders = this.getAllResponseHeaders();
                if ( this.responseType == 'arraybuffer' && this.response) {
                    try {
                        var arr = this.response;
                        if(arr) {   
                            var string = new TextDecoder().decode(arr);
                            var idC = document.getElementById('itycDashId');
                            if(idC)
                            {
                                chrome.runtime.sendMessage(idC.getAttribute('extId'), {url: this._url,req :this._requestHeaders,resp:string },function(response) {fillContainer(response)});
                            }   
                        }
                    } catch(err) {
                    }
                }

            }
        });

        if(postData && checkUrl(this._url))
            try {
                var string = new TextDecoder().decode(postData);
                if(string != "") {
                    this._requestHeaders = string;
                }   
            } catch(err) {
            }
        if(postData &&  this._url.substring(0, 45) == "https://static.virtualregatta.com/winds/live/" && this._url.endsWith('wnd'))  {
            try {
                var string = new TextDecoder().decode(postData);
                if(string != "") {
                    var idC = document.getElementById('itycDashId');
                    if(idC)
                    {
                        chrome.runtime.sendMessage(id, {url: this._url ,req :"wndCycle",resp:"wndVal" },function(response) {fillContainer(response)});
                    }   
                    
                }   
            } catch(err) {
            }
        }            
        return send.apply(this, arguments);
    };

})(XMLHttpRequest);

function checkUrl(url) {
    if(!url) return false;
    url = url ? url.toLowerCase() : url;
            
    if(url &&
    (url.startsWith("https://prod.vro.sparks.virtualregatta.com")
    || url.startsWith("https://vro-api-ranking.prod.virtualregatta.com")
    || url.startsWith("https://vro-api-client.prod.virtualregatta.com"))) 
        return true;
    else
        return false;

}

function createContainer() {
    //search for existing div
    let ourDiv = document.getElementById('dashIntegRow');
    if(ourDiv) ourDiv.remove();
  
    ourDiv = document.createElement( 'div' );
    ourDiv.id = 'dashIntegRow';
    ourDiv.classList.add("et_pb_row");
    
  
    let ourDiv2 = document.createElement( 'div' );
    ourDiv2.id = 'dashInteg';
    ourDiv2.classList.add("et_pb_column");
    ourDiv2.classList.add("et_pb_column_4_4");
    ourDiv2.classList.add("et_pb_column_0");
  
    ourDiv.appendChild(ourDiv2);
    //append all elements
   const gameDiv = document.getElementsByClassName('et_pb_section et_pb_section_0')[0];
    gameDiv.appendChild(ourDiv);
    return ourDiv2;
  
}

function fillContainer(msg) {
    if(!msg) return;
    openNewTab = msg.newTab;
    zezoUrl = msg.zurl;
    toxxctUrl = msg.purl;
    itycUrl  = msg.iurl;

    zezoUrlRace = msg.rzurl;
    toxxctUrlRace = msg.rpurl;
    itycUrlRace = msg.riurl;


    let ourDiv = document.getElementById('dashInteg');
    if(!ourDiv) { //page has been refresh but not dashboard tab
        document.documentElement.setAttribute("data-theme", drawTheme);
        ourDiv = createContainer();
    }
    ourDiv.innerHTML = msg.content;
    
    drawTheme = msg.theme;
    localStorage["addOnTheme"] = msg.theme;
    document.documentElement.setAttribute("data-theme", drawTheme);

    if(msg.rid !="") {
        document.getElementById('rt:' + msg.rid).addEventListener("click", callRouterZezo);
        document.getElementById('pl:' + msg.rid).addEventListener("click", callRouterToxxct);
        document.getElementById('ityc:' + msg.rid).addEventListener("click", callItyc);
    }
}
function drawDashBoardInstalled()
{
    let outputTable =  '<table id="raceStatusTable">'
    + '<thead>'
    + '<tr><th>ITYC Dashboard</th></tr>'
    + '</thead>'
    + '<tbody>'
    + '<tr><td>Pas de dashboard activée</td></tr>'
    + '</tbody>'
    + '</table>';
    let ourDiv = document.getElementById('dashInteg');
    if(!ourDiv) { //page has been refresh but not dashboard tab
        document.documentElement.setAttribute("data-theme", drawTheme);
        ourDiv = createContainer();
    }
    ourDiv.innerHTML = outputTable;
}
