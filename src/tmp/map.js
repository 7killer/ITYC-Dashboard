import * as Util from './util.js';
import * as rt from './routingviewer.js';
import * as EX from './extra.js';

const options = {
    key: 'notValid', // REPLACE WITH YOUR KEY !!!
    lat: 14,
    lon: -29,
    zoom: 4,
    isKeyValid:false
};
const category = ["real", "certified", "top", "sponsor", "normal", "pilotBoat", "team"];
const categoryStyle = [
    // real
    {nameStyle: "color: Chocolate;", bcolor: '#D2691E', bbcolor: '#000000'},
    // certified
    {nameStyle: "color: Black;", bcolor: '#1E90FF', bbcolor: '#000000'},
    // top
    {nameStyle: "color: GoldenRod; font-weight: bold;", bcolor: '#ffd700', bbcolor: '#000000'},
    // "sponsor"
    {nameStyle: "color: Black;", bcolor: '#D3D3D3', bbcolor: '#ffffff'},
    // "normal"
    {nameStyle: "color: Black;", bcolor: '#D3D3D3', bbcolor: '#000000'},
    // "normal"
    {nameStyle: "color: Black;", bcolor: '#000000', bbcolor: '#ff0000'}
];
const categoryStyleDark = [
    // real
    {nameStyle: "color: Chocolate;", bcolor: '#D2691E', bbcolor: '#000000'},
    // certified
    {nameStyle: "color: #a5a5a5;", bcolor: '#1E90FF', bbcolor: '#000000'},
    // top
    {nameStyle: "color: GoldenRod; font-weight: bold;", bcolor: '#ffd700', bbcolor: '#000000'},
    // "sponsor"
    {nameStyle: "color: #a5a5a5;", bcolor: '#D3D3D3', bbcolor: '#ffffff'},
    // "normal"
    {nameStyle: "color: #a5a5a5;", bcolor: '#D3D3D3', bbcolor: '#000000'},
    // "normal"
    {nameStyle: "color: #a5a5a5;", bcolor: '#000000', bbcolor: '#ff0000'}
];
const sailNames = [0, "Jib", "Spi", "Stay", "LJ", "C0", "HG", "LG", 8, 9,
                     // VR sends sailNo + 10 to indicate autoSail. We use sailNo mod 10 to find the sail name sans Auto indication.
                     "Auto", "Jib &#x24B6;", "Spi &#x24B6;", "Stay &#x24B6;", "LJ &#x24B6;", "C0 &#x24B6;", "HG &#x24B6;", "LG &#x24B6;"];









const toPromise = (callback) => {
    const promise = new Promise((resolve, reject) => {
        try {
            callback(resolve, reject);
        }
        catch (err) {
            reject(err);
        }
    });
    return promise;
}

const saveLocal = (k,v) => {
    const key = k;
    const value = { val: v };

    return toPromise((resolve, reject) => {
        chrome.storage.local.set({ [key]: value }, () => {
            if (chrome.runtime.lastError)
                reject(chrome.runtime.lastError);

            resolve(value);
        });
    });
}

const getLocal = (k) => {
    const key = k;

    return toPromise((resolve, reject) => {
        chrome.storage.local.get([key], (result) => {
            if (chrome.runtime.lastError)
                reject(chrome.runtime.lastError);

            const researches = result[key]?((result[key].val!==undefined)?result[key].val:undefined):undefined ;
            resolve(researches);
        });
    });
}



export {
    initialize,updateMapCheckpoints,updateMapFleet,cleanMap,set_displayFilter,set_currentId,set_currentTeam,
    updateMapWaypoints,updateMapMe,updateMapLeader,
    importRoute,hideRoute,showRoute,deleteRoute,onMarkersChange,hideShowTracks,setProjectionLineColor,setProjectionLineSize, updateCoordinatesToCenterViewMap
};
