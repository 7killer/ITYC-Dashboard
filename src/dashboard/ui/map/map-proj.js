
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

var pColor;
var pSize;

function setProjectionLineColor(e)
{
    pColor =  e;
}

function setProjectionLineSize(e)
{
    pSize =  e;
}


function drawProjectionLine(race,pos,hdg,speed) {

    if(!hdg || !speed) return;
    var map = race.lMap.map;
    if(race.lMap.me_PlLayer) map.removeLayer(race.lMap.me_PlLayer);
    
    race.lMap.me_PlLayer  = L.layerGroup();

    var tpath = [];

    tpath.push(pos[1]);

    for(var i=0;i<pSize/2;i++)
    {
        pos = computeNextPos(pos[1],hdg,speed,2*60);
        tpath.push(pos[1]);
        var title = 2*(i+1)+"min";
        buildCircle(pos,race.lMap.me_PlLayer,pColor, 1.5,1,title); 
    }  
    buildTrace(buildPath(tpath) ,race.lMap.me_PlLayer, race,pColor,1,0.4,'10, 10','5');

    race.lMap.me_PlLayer.addTo(map); 

}


