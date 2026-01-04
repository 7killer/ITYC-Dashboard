
import {buildPt2, buildCircle,buildTrace,buildPath} from './map-utils.js'
import {getUserPrefs} from '../../../common/userPrefs.js'
import { mapState } from './map-race.js';
import { toRad } from '../../../common/utils.js';
function computeNextPos(pos,hdg,speed,time) {
    const dist5 = speed*time/(3600*60);
    const alpha = 360 - ( hdg - 90);
    const lat5 =  pos.lat + dist5*Math.sin(toRad(alpha));
    let lng5 = pos.lng;

    lng5 += (dist5*Math.cos(toRad(alpha))) / Math.cos((toRad(lat5)+toRad(lat5))/2) ;
    if(lng5 > 180) {
        lng5 = lng5 - 360;
    }
    if(lng5 < -180) {
        lng5 = lng5 + 360;
    }

    return buildPt2(lat5, lng5);

}

export function drawProjectionLine(pos,hdg,speed) {

    if(!hdg || !speed) return;
    if(!mapState|| !mapState.map ) return;
    
    const userPrefs = getUserPrefs();
    const map = mapState.map;

    if(mapState.me_PlLayer) map.removeLayer(mapState.me_PlLayer);
    mapState.me_PlLayer = L.layerGroup(); 

    let tpath = [];

    tpath.push(pos[1]);

    for(var i=0;i<userPrefs.map.projectionLineLenght/2;i++)
    {
        pos = computeNextPos(pos[1],hdg,speed,2*60);
        tpath.push(pos[1]);
        const title = 2*(i+1)+"min";
        buildCircle(pos,mapState.me_PlLayer,userPrefs.map.projectionColor, 1.5,1,title); 
    }  
    buildTrace(buildPath(tpath) ,mapState.me_PlLayer, mapState.refPoints,userPrefs.map.projectionColor,1,0.4,'10, 10','5');
    mapState.me_PlLayer.addTo(map); 

}


