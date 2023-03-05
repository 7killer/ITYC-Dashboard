
import * as Util from './util.js';


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

async function initialize()
{
    document.getElementById("mapfilterLmap").style.visibility = "hidden";
    document.getElementById("extraLmap").style.visibility = "hidden";
    await initCachedTilesList();
}

async function loadBorder(race,lat,lon)
{
    if(!race || !race.lMap || !race.lMap.map) return;
    var refLat = Math.floor(Math.round(Number(lat/3))*3);
    var refLon = Math.floor(Math.round(Number(lon/3))*3);
    var aroundTable = [
        { lo:-6 , la: 6 },    { lo:-3 , la:6 },    { lo:0 , la:6 },    { lo:3 , la: 6 },   { lo:6 , la: 3 },
        { lo:-6 , la: 3 },    { lo:-3 , la:3 },    { lo:0 , la:3 },    { lo:3 , la: 3 },   { lo:6 , la: 3 },
        { lo:-6 , la: 0 },    { lo:-3 , la:0 },    { lo:0 , la:0 },    { lo:3 , la: 0 },   { lo:6 , la: 0 },
        { lo:-6 , la:-3 },    { lo:-3 , la:-3},    { lo:0 , la:-3},    { lo:3 , la:-3 },   { lo:6 , la:-3 },
        { lo:-6 , la:-6 },    { lo:-3 , la:-6},    { lo:0 , la:-6},    { lo:3 , la:-6 },   { lo:6 , la:-6 },
    ];  
    if(wpGuideLayer != undefined) race.lMap.map.removeLayer(wpGuideLayer);
    wpGuideLayer = undefined;
    new Promise((resolve, reject) => {
        aroundTable.forEach(async function(t)  {
            let key = atob("IHBvdXIgbGUgRGFzaGJvYXJkIFRhdmVybmUgcGFyIEt1cnVuNTY=");
            let dDalleIdx = 'dDalle_' + (refLon+t.lo)+'_'+(refLat+t.la);
            let hash = md5(dDalleIdx + key).toUpperCase();
            let fileName =  dDalleIdx+'_'+hash+'.KurunFile';
            if(cachedTileList.includes(fileName)) {
                if(wpGuideLayer == undefined)  wpGuideLayer = L.layerGroup();
                loadLocalFile(race,'./cachedTiles/'+fileName,{style: styleLines});
            }
        });
        resolve(true);
    }).then( t=> {
        wpGuideLayer.addTo(race.lMap.map); 
    });


}


async function loadLocalFile(race,fileName,styles) {
    await fetch(fileName) 
    .then(function (response) {
        if (response.status === 200 || response.status === 0) {
            return Promise.resolve(response.blob());
        } else {
            return Promise.reject(new Error(response.statusText));
        }
    }).then(JSZip.loadAsync).then(function (zip) {
        Object.keys(zip.files).forEach(function (filename) {
            zip.files[filename].async('string').then(function (fileData) {  
                L.geoJSON(JSON.parse(fileData),styles).addTo(wpGuideLayer);
            })
        })
    })
}


  






var cachedTileList = [];

async function initCachedTilesList()
{
    cachedTileList = [];
    await chrome.runtime.getPackageDirectoryEntry(dir => {
        dir.getDirectory('cachedTiles', {}, function(cachedTilesDir) {
            new Promise(resolve => {
                let dirReader = cachedTilesDir.createReader();
            
                let getEntries = () => {
                    dirReader.readEntries((entries) => {
                            if (entries.length) {
                                for (var i = 0; i < entries.length; ++i) {
                                    cachedTileList.push(entries[i].name);
                                }
                                getEntries();
                            }
                        }
                    );
                };
                getEntries();
            })
        })
    });
}




function styleLines(feature) {
    return {
                color: '#0000ff',
                weight: 1,
                opacity: .7
            };
}


//
// Ajout - Routage / Ranking
function extraRoute(state) {
   
    document.getElementById("mapfilterLmap").style.visibility = state;
    document.getElementById("extraLmap").style.visibility = state;

}






export {
    extraRoute,initialize,
    loadBorder

};
