
import * as Util from './util.js';

var currentId="",currentName="";
var previousRequiredId = 0;
var displayFlag;
var nocheck = false; 
var guideShown = false;
var dashVersion ="1.0.6";
var wpGuideLayer = undefined;
String.prototype.remAcc = function() {
    var rules = {
        'a': /[àâ]/g,
        'A': /[ÀÂ]/g,
        'e': /[èéêë]/g,
        'E': /[ÈÉÊË]/g,
        'i': /[îï]/g,
        'I': /[ÎÏ]/g,
        'o': /[ô]/,
        'O': /[Ô]/g,
        'u': /[ùû]/g,
        'U': /[ÙÛ]/g,
        'c': /[ç]/g,
        'C': /[Ç]/g,
        '' : /[\/|\s|-]/g,
    };
    var str = this;
    for(var latin in rules) {
        var nonLatin = rules[latin];
        str = str.replace(nonLatin , latin);
    }
    return str;
}


function initialize()
{
    previousRequiredId = 0;
    document.getElementById("mapfilterLmap").style.visibility = "hidden";
    document.getElementById("extraLmap").style.visibility = "hidden";
}


function extraMap(race)
{
    if(currentId=="" ||currentName == "" || race && race.id && race.lMap && race.lMap.map && race.curr && race.curr.pos) return -1;

    guideShown = false; //force refresh
    return onGuideChange(race);

    
}

function loadFile(url) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.responseType = "text";
        xhr.onload = () => {
            if (xhr.readyState === 4 && (xhr.status === 200 || xhr.status === 0)) {
                resolve(xhr.response || xhr.responseText);
            } else {
                resolve('');
            }
        };
        xhr.onerror = () => reject("Error " + xhr.status + " while fetching remote file: " + url);
        xhr.send();
    });
}


function styleLines(feature) {
    return {
                color: '#0000ff',
                weight: 1,
                opacity: .7
            };
}
var borderRequest = false;
function onGuideChange(race) {


    var map = race.lMap.map;
    if(guideShown)
    {
        guideShown = false;
        if(wpGuideLayer != undefined) map.removeLayer(wpGuideLayer);
        wpGuideLayer = undefined;
    } else
    {
        if(borderRequest) return;
        var lat = race.curr.pos.lat;
        var lon = race.curr.pos.lon;
        var mapcenter = map.getCenter();
        lat = mapcenter.lat;
        lon = mapcenter.lng; 

        if(lon > 180 ) lon = lon - 360;
        if( lon < -180) lon = lon + 360;

        var stampdate = new Date(); /// timestamp pb de cache
        guideShown = true;
    
        new Promise((resolve, reject) => {
            var getUrl =atob("aHR0cHM6Ly92ci5pdHljLmZyL2dldEJvcmRlclJlZi5waHA=");
            getUrl += "?lat="+lat+"&long="+lon+"&uid=ityc&race="+(race.id.split(".")[0])+stampdate.getTime();
            getUrl += "&vers="+chrome.runtime.getManifest().version;
            
            const xhr = new XMLHttpRequest();
            xhr.race = race;
            xhr.getUrl = getUrl;
    
            xhr.addEventListener('loadend', () => {
                if (xhr.status === 200 || xhr.status == 0) {
                    let rep = JSON.parse(xhr.responseText); 

                    if((rep['dDalle'].length !=0)) {
                        wpGuideLayer = L.layerGroup();
                        rep['dDalle'].forEach(dDalle => {
                            dDalle = atob("aHR0cHM6Ly92ci5pdHljLmZyLw==")+dDalle;
                            loadFile(dDalle).then((data) =>  L.geoJSON(JSON.parse(data),{style: styleLines}).addTo(wpGuideLayer));
                        });
                        wpGuideLayer.addTo(map); 
                    }
                }else {
                        
                    resolve(false);
                }
                borderRequest = false;
            });
            
            borderRequest = true;
            xhr.open("GET", getUrl);
            xhr.send();
    
        });
    }
            


    document.getElementById('sel_extraLmap').checked=guideShown;
    return guideShown;

}



//
// Ajout - Routage / Ranking
function extraRoute(state) {
   
    document.getElementById("mapfilterLmap").style.visibility = state;
    document.getElementById("extraLmap").style.visibility = state;

}





function setDisplayFlag(state) {

    displayFlag  = state;
}
function getDisplayFlag() {
    return displayFlag;

}

export {
    extraMap,extraRoute,initialize,setDisplayFlag,getDisplayFlag,
    onGuideChange

};
