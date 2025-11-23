


export function roundTo(number, digits) {
    if (number !== undefined && !isNaN(number)) {
        var scale = Math.pow(10, digits);
        return (Math.round(number * scale) / scale).toFixed(digits);
    } else {
        return "-";
    }
}

export function gcAngle(rlat0, rlon0, rlat1, rlon1) {
    return Math.acos(Math.sin(rlat0) * Math.sin(rlat1) + Math.cos(rlat0) * Math.cos(rlat1) * Math.cos(rlon1 - rlon0));
}

export function toRad(angle) {
    return angle / 180 * Math.PI;
}
export function toDeg(angle) {
    return angle / Math.PI * 180;
}

export function angle(h0, h1) {
    return Math.abs(Math.PI - Math.abs(h1 - h0));
}
// Greate circle distance
export function gcDistance(pos0, pos1) {
    // Earth radius in nm, 360*60/(2*Pi);
    var radius = 3437.74683;
    // e = r · arccos(sin(φA) · sin(φB) + cos(φA) · cos(φB) · cos(λB – λA))
    var rlat0 = toRad(pos0.lat);
    var rlat1 = toRad(pos1.lat);
    var rlon0 = toRad(pos0.lon);
    var rlon1 = toRad(pos1.lon);
    return radius * gcAngle(rlat0, rlon0, rlat1, rlon1);
}

export function courseAngle(lat0, lon0, lat1, lon1) {

    if(lon0 < lon1+0.00002 && lon0 > lon1-0.00002)
    { // When heading in PI or 0 trigo fails ;)
        if(lat0 <lat1) return 0; else return Math.PI;
    }
    var rlat0 = toRad(lat0);
    var rlat1 = toRad(lat1);
    var rlon0 = toRad(lon0);
    var rlon1 = toRad(lon1);
    var xi = gcAngle(rlat0, rlon0, rlat1, rlon1);
    var a = Math.acos((Math.sin(rlat1) - Math.sin(rlat0) * Math.cos(xi)) / (Math.cos(rlat0) * Math.sin(xi)));
    return (Math.sin(rlon1 - rlon0) > 0) ? a : (2 * Math.PI - a);
}

export const guessOptionBits = {
    "hull":  1,
    "winch": 2,
    "foil":  4,
    "light": 8,
    "reach": 16,
    "heavy": 32,
    "hullDetected":64,
    "foilDetected":128,
    "winchDetected":256,
    "hullActivated":64+1,
    "foilActivated":128+4,
    "winchActivated":256+2,
    
    3:32, //stay
    4:8,  //LJ
    5:16,  //C0
    6:32,  //HG
    7:8,  //LG
};

export function isBitSet(num, mask){
    let a = num&mask;
    if(a===0)
        return false;
    else
        return true;
}

export function calculateCOGLoxo(LatDebDd,LonDebDd,LatFinDd,LonFinDd,useMercator=true) {
	// Comme convention Marine & SHOM L=Lat et G=Lon
	// XM=Abscisse Mercator & YM=Ordonnée Mercator
	// HDG=Cap
	var LdRad, GdRad, LfRad, GfRad, AbsDeltaG , AbsDeltaL ;
	var XMd, XMf, YMd, YMf, deltaXM, deltaYM ;
	var HDGLoxo, distLoxo ;
	
	const RT = 6378.1370 / 1.852 ;
	
	// transformation en radians
	LdRad = toRad(LatDebDd);
	GdRad = toRad(LonDebDd);
	LfRad = toRad(LatFinDd);
	GfRad = toRad(LonFinDd);
	
	// Traitement de l'antiméridien et abscisses Mercator (Abscisse=longitude)
	AbsDeltaG = Math.abs (GdRad - GfRad)
	if (AbsDeltaG < Math.PI) {
		XMd = GdRad ;
		XMf = GfRad ;
	} else if (GdRad > GfRad) {
		XMd = GdRad - Math.PI ;
		XMf = GfRad + Math.PI ;
	} else {
		XMd = GdRad + Math.PI ;
		XMf = GfRad - Math.PI ;
	}
	
    if(useMercator)
    {
	// Calcul des ordonnées Mercator
		YMd = Math.log ( Math.tan (( Math.PI / 4 ) + (LdRad / 2))) ;
		YMf = Math.log ( Math.tan (( Math.PI / 4 ) + (LfRad / 2))) ;
	} else
    {
        YMd = LdRad;
        YMf = LfRad;
    }	
	// Calcul des Deltas
		deltaXM = XMf - XMd ;
		deltaYM = YMf - YMd ;
			
	// Determiner Cap			
		// Gestion des exceptions
			// Exception de Longitude
			if (deltaXM === 0 ) {
				if (YMf < YMd) {
					HDGLoxo = 180 ;
				} else if (YMf > YMd) {
					HDGLoxo = 0 ;
				} else if (deltaYM === 0) {
					HDGLoxo = "#N/A" ;
				}
				
			} else if (XMd < XMf) {
				HDGLoxo = 90 - Math.atan(deltaYM / deltaXM) * 180 / Math.PI ;
			} else if (XMd > XMf) {
				HDGLoxo = 270 - Math.atan(deltaYM / deltaXM) * 180 / Math.PI ;
			}
	
	// Determiner Distance
		AbsDeltaL = Math.abs (LfRad - LdRad) ;
		
		distLoxo = RT * AbsDeltaL / Math.cos( Math.tan(deltaXM / deltaYM)) ;
		
	// Sortie des Valeurs
    return HDGLoxo;
	//	return [HDGLoxo, distLoxo];
}

export function sign(x) {
    return (x < 0) ? -1 : 1;
}

 /**
 * Vérifie qu'un objet ou un tableau contient toutes les clés / index demandés.
 * @param {object|Array} target - L'objet ou le tableau à tester.
 * @param {Array<string|number>} keys - Les clés ou index à vérifier.
 * @returns {boolean} true si toutes les clés/index existent, sinon false.
 */
export function hasKeys(target, keys = []) {
  if (target == null) return false;

  // Cas tableau
  if (Array.isArray(target)) {
    return keys.every(idx => 
      Number.isInteger(+idx) && target[+idx] !== undefined
    );
  }

  // Cas objet
  if (typeof target === "object") {
    return keys.every(key => key in target);
  }

  return false;
}
export function isCurrent(timestamp, previousTimeStamp = 0) {
    return (timestamp && (timestamp > previousTimeStamp));
}


