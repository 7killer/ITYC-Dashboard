
import {buildPt2, buildCircle,buildTrace} from './map-utils.js'
import {getUserPrefs} from '../../../common/userPrefs.js'
import { mapState } from './map-race.js';

function computeNextPos(pos,hdg,speed,time) {
    var dist5 = speed*time/(3600*60);
    var alpha = 360 - ( hdg - 90);
    var lat5 = pos.lat;
    var lng5 = pos.lng;
    var latrad1 = Util.toRad(lat5);
    var latrad2;
    var phi;

    lat5 += dist5*Math.sin(Util.toRad(alpha));
    latrad2 = Util.toRad(lat5);
    phi = Math.cos((latrad1+latrad2)/2);
    lng5 += (dist5*Math.cos(Util.toRad(alpha))) / phi ;
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
        buildCircle(pos,layer,userPrefs.map.projectionColor, 1.5,1,title); 
    }  
    buildTrace(buildPath(tpath) ,mapState.me_PlLayer, mapState.refPoints,userPrefs.map.projectionColor,1,0.4,'10, 10','5');
    layer.addTo(map); 

}


