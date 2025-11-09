
import { roundTo } from './../common/utils.js';

export function  theoreticalSpeed(polar,options = [],tws,twa,sailId = null) {
    if (polar == undefined || tws == undefined)
        return undefined;
    let foil = foilingFactor(options, tws, twa, polar.foil);
    let foiling = (foil - 1.0) * 100 / (polar.foil.speedRatio - 1.0);
    let hull = options?.hull ? 1.003 : 1.0;
    let ratio = polar.globalSpeedRatio;
    let twsLookup = fractionStep(tws, polar.tws);
    let twaLookup = fractionStep(twa, polar.twa);
    const maxSpd = maxSpeed(options, twsLookup, twaLookup, polar.sail);
    const spd = (sailId!=null )?pSpeed(twaLookup,twsLookup,polar.sail[sailId].speed):0;
    return {
        "speed": (sailId!=null )?roundTo(spd * foil * hull * ratio, 3):roundTo(maxSpd.speed * foil * hull * ratio, 3),
        "sail": (sailId!=null )?sailId:maxSpd.sail,
        "foiling": foiling
    };
}



function maxSpeed (options, iS, iA, sailDefs) {
    let maxSpeed = 0;
    let maxSail = "";
    for (const sailDef of sailDefs) {
        if (sailDef.id === 1
            || sailDef.id === 2
            || (sailDef.id === 3 && options?.heavy)
            || (sailDef.id === 4 && options?.light)
            || (sailDef.id === 5 && options?.reach)
            || (sailDef.id === 6 && options?.heavy)
            || (sailDef.id === 7 && options?.light)) {
            let speed = pSpeed(iA, iS, sailDef.speed);
            if (speed > maxSpeed) {
                maxSpeed = speed;
                maxSail = sailDef.id;
            }
        }
    }
    return {
        speed: maxSpeed,
        sail: maxSail
    }
}


function pSpeed (iA, iS, speeds) {
    return bilinear(iA.fraction, iS.fraction,
        speeds[iA.index - 1][iS.index - 1],
        speeds[iA.index][iS.index - 1],
        speeds[iA.index - 1][iS.index],
        speeds[iA.index][iS.index]);
}


export function bilinear(x, y, f00, f10, f01, f11) {
    return f00 * (1 - x) * (1 - y)
        + f10 * x * (1 - y)
        + f01 * (1 - x) * y
        + f11 * x * y;
}


export function foilingFactor(options, tws, twa, foil) {
    let speedSteps = [0, foil.twsMin - foil.twsMerge, foil.twsMin, foil.twsMax, foil.twsMax + foil.twsMerge, Infinity];
    let twaSteps = [0, foil.twaMin - foil.twaMerge, foil.twaMin, foil.twaMax, foil.twaMax + foil.twaMerge, Infinity];
    let foilMat = [[1, 1, 1, 1, 1, 1],
                   [1, 1, 1, 1, 1, 1],
                   [1, 1, foil.speedRatio, foil.speedRatio, 1, 1],
                   [1, 1, foil.speedRatio, foil.speedRatio, 1, 1],
                   [1, 1, 1, 1, 1, 1],
                   [1, 1, 1, 1, 1, 1]];

    if (options?.foil) {
        let iS = fractionStep(tws, speedSteps);
        let iA = fractionStep(twa, twaSteps);
        return bilinear(iA.fraction, iS.fraction,
            foilMat[iA.index - 1][iS.index - 1],
            foilMat[iA.index][iS.index - 1],
            foilMat[iA.index - 1][iS.index],
            foilMat[iA.index][iS.index]);
    } else {
        return 1.0;
    }
}

export function fractionStep (value, steps){
    let absVal	= Math.abs(value);
    let index	= 0;
    while (index < steps.length && steps[index]<= absVal) {
        index++;
    }

    if (index >= steps.length) {
        return {
            index	: steps.length-1,
            fraction: 1
        };
    }

    return {
        index	: index,
        fraction: (absVal - steps[index-1]) / (steps[index] - steps[index-1])
    };
}


function isSailisInOptions(sailId,options)
{
    switch(sailId)
    {
        default :
        case 1 : //JIB
        case 2 : //SPI
            return true;
        case 3 : //STAYSAIL
        case 6 : //HEAVY_GNK
            return options?.heavy;
        case 4 : //LIGHT_JIB
        case 7 : //LIGHT_GNK
            return options?.light;
        case 5 : //CODE_0
            return options?.reach;
    }
}

export const computeEnergyLoose = (polar, paramStamina, options = {}, tws) => {
    if (!polar) {
        return { gybe: null, tack: null, sail: null };
    }

    const { consumption = {} } = paramStamina ?? {};
    const { points = {}, winds: windsCfg = {}, boats: boatsCfg = null } = consumption;

    const computeStaminaLoose = (basePt, type = "M") => {
        const getBoatCoefficient = (boatWeightKg) => {
        if (!boatsCfg) return -1; // préserve le comportement d’origine
        const keys = Object.keys(boatsCfg).map(Number).sort((a, b) => a - b);
        if (!keys.length) return -1;

        if (boatWeightKg <= keys[0]) return boatsCfg[keys[0]];
        if (boatWeightKg >= keys[keys.length - 1]) return boatsCfg[keys[keys.length - 1]];

        let lower = keys[0], upper = keys[0];
        for (let i = 0; i < keys.length; i++) {
            if (boatWeightKg >= keys[i]) lower = keys[i];
            if (boatWeightKg < keys[i]) { upper = keys[i]; break; }
        }
        return boatsCfg[lower];
        };

        const getWindConsumptionFactor = (windSpeed) => {
            const vrJacketWinds = { 0: 1, 10: 1, 20: 1.2, 30: 1.8 };
            const windsTable = options?.vrtexJacket ? vrJacketWinds : windsCfg;

            const keys = Object.keys(windsTable).map(Number).sort((a, b) => a - b);
            if (!keys.length) return 1;

            if (windSpeed <= keys[0]) return windsTable[keys[0]];
            if (windSpeed >= keys[keys.length - 1]) return windsTable[keys[keys.length - 1]];

            let lower = keys[0], upper = keys[0];
            for (let i = 0; i < keys.length; i++) {
                if (windSpeed >= keys[i]) lower = keys[i];
                if (windSpeed < keys[i]) { upper = keys[i]; break; }
            }
            const ratio = (windSpeed - lower) / (upper - lower);
            return windsTable[lower] + ratio * (windsTable[upper] - windsTable[lower]);
        };

        const boatCoeff = polar?.weight ? getBoatCoefficient(polar.weight / 1000) : 1;
        let stamina = basePt * boatCoeff;

        if (type === "S" && options?.magicFurler) {
        stamina *= 0.8;
        }

        const factor = getWindConsumptionFactor(tws);
        return (factor * stamina).toFixed(2); // conserve le type string comme l’original
    };

    return {
        gybe: computeStaminaLoose(points.gybe),
        tack: computeStaminaLoose(points.tack),
        sail: computeStaminaLoose(points.sail, "S"),
    };
};

  
export const computeEnergyRecovery = (pts,tws,paramStamina,options = {}) => {
    if(!tws) return "-";
    let ltws = paramStamina.recovery.loWind;
    let htws = paramStamina.recovery.hiWind;
    let lRecovery = paramStamina.recovery.loTime*60;
    let hRecovery = paramStamina.recovery.hiTime*60;
    let minByPt = 1;
    if(tws<=ltws) {
        minByPt = lRecovery;
    } else  if(tws>=htws) {
        minByPt = hRecovery;
    } else {
        let aFactor = (hRecovery+lRecovery)/2;
        let bFactor = (hRecovery-lRecovery)/2;
        minByPt = aFactor-Math.cos((tws-ltws)/(htws-ltws)*Math.PI)*bFactor;
    }
    if (options?.comfortLoungePug) minByPt *= 0.8;
    return ((pts / Number(paramStamina.recovery.points)*minByPt)/60).toFixed(0); 
}        

const computeEnergyPenalitiesFactor = (stamina) => {
    let coeff = stamina * -0.015 + 2;
    return coeff?(coeff<0.5?0.5:coeff):1.0;
}
export function manoeuveringPenalities(polar,ite,stamina,options)  {
    if(!polar || !ite)
        return {
            "gybe" : null,
            "tack" : null,
            "sail" : null,
            "staminaFactor" :null
            };
    const penalty = (speed, options, fraction, spec,boatcoeff,type="M") => {
        if(!spec)
        {
            return {
                "time" : null,
                "dist" : null,
            };
        }
        if (options?.winch) {
            spec = spec.pro;
        } else {
            spec = spec.std;
        }
        let time = (spec.lw.timer + (spec.hw.timer - spec.lw.timer) * fraction)*boatcoeff;
        if(type=="S") {
            if (options?.magicFurler) {
                time *= 0.8;
            }
        }
        let dist = speed * time / 3600;
        return {
            "time" : time.toFixed(),
            "dist" : (dist * (1- spec.lw.ratio)).toFixed(3)
        };
    }
    let winch = polar.winch;
    let tws = ite.tws;
    let speed = ite.speed;
    //take account of penalities
    let fraction;
    if  ((winch.lws <= tws) && (tws <= winch.hws)) {
        fraction = 0.5-Math.cos((tws-winch.lws)/(winch.hws-winch.lws)*Math.PI)*0.5;
    } else if (tws < winch.lws) {
        fraction = 0;
    } else {
        fraction = 1;
    }

    //take in account stamina, coeff is coming from impact value
    let boatCoeff = 1.0;
    if(stamina)
    {
         boatCoeff = computeEnergyPenalitiesFactor(stamina);
    } 

    return {
        gybe : penalty(speed, options, fraction, winch.gybe,boatCoeff),
        tack : penalty(speed, options, fraction, winch.tack,boatCoeff),
        sail : penalty(speed, options, fraction, winch.sailChange,boatCoeff,"S"),
        staminaFactor : boatCoeff
    };
}

export function vmg(speed, twa){
    let r = Math.abs(Math.cos(twa / 180 * Math.PI));
    return speed * r;
}

export function bestVMG(tws, polars, options, sailId, currTwa) {
    const best = {
        vmgUp: 0, twaUp: 0, sailUp: 0,
        vmgDown: 0, twaDown: 0, sailDown: 0,
        bspeed: 0, btwa: 0, sailBSpeed: 0,
        sailTWAMin: 0, sailTWAMax: 0,
        sailTWSMin: 0, sailTWSMax: 0,
    };

    // Garde simple
    if (!polars?.tws?.length || !polars?.twa?.length || !polars?.sail?.length) return best;

    // Helpers
    const DEG2RAD = Math.PI / 180;
    const tol = 0.014; // 1.4% de marge comme dans le code d’origine
    const inOpts = (id) => isSailisInOptions(id, options);

    // Sécurise les indices pour bilinear (qui attend i-1 et i)
    const safeStep = (step, arrLen) => ({
        index: Math.min(Math.max(step.index, 1), arrLen - 1),
        fraction: Math.min(Math.max(step.fraction, 0), 1),
    });

    const hRatio = options?.hull ? (polars?.hull?.speedRatio ?? 1) : 1;

    // ---- Balayage TWA pour un TWS fixé ----
    const sStep = safeStep(fractionStep(tws, polars.tws), polars.tws.length);

    let twaDetect = [];
    for (let twaIndex = 250; twaIndex < 1800; twaIndex++) {
        const aTWA = twaIndex / 10;
        const aStepRaw = fractionStep(aTWA, polars.twa);
        const aStep = safeStep(aStepRaw, polars.twa.length);

        let actualSailSpd = 0;
        let bestSpdAtThisTWA = 0;
        let bestSpdSailAtThisTWA = null;

        for (const sail of polars.sail) {
        if (!inOpts(sail.id)) continue;

        const f = foilingFactor(options, tws, polars.twa[aStep.index], polars.foil);
        const rspeed = bilinear(
            aStep.fraction, sStep.fraction,
            sail.speed[aStep.index - 1][sStep.index - 1],
            sail.speed[aStep.index][sStep.index - 1],
            sail.speed[aStep.index - 1][sStep.index],
            sail.speed[aStep.index][sStep.index]
        );
        const speed = rspeed * f * hRatio;
        const vmg = speed * Math.cos(aTWA * DEG2RAD);

        // Meilleurs VMG up/down
        if (vmg > best.vmgUp) {
            best.vmgUp = vmg;
            best.twaUp = aTWA;
            best.sailUp = sail.id;
        } else if (vmg < best.vmgDown) {
            best.vmgDown = vmg;
            best.twaDown = aTWA;
            best.sailDown = sail.id;
        }

        // Meilleure BS absolue (tous TWA)
        if (speed > best.bspeed) {
            best.bspeed = speed;
            best.btwa = aTWA;
            best.sailBSpeed = sail.id;
        }

        // Meilleure vitesse à ce TWA
        if (speed > bestSpdAtThisTWA) {
            bestSpdAtThisTWA = speed;
            bestSpdSailAtThisTWA = sail.id;
        }

        if (sail.id === sailId) actualSailSpd = speed;
        }

        // Vérifie si la voile actuelle reste la meilleure à ce TWA
        if (
        (actualSailSpd >= bestSpdAtThisTWA && bestSpdSailAtThisTWA === sailId) ||
        (actualSailSpd * (1 + tol) > bestSpdAtThisTWA && bestSpdSailAtThisTWA !== sailId)
        ) {
        twaDetect.push(aTWA);
        }
    }

    if (twaDetect.length) {
        best.sailTWAMin = twaDetect.reduce((m, v) => Math.min(m, v), +Infinity);
        best.sailTWAMax = twaDetect.reduce((m, v) => Math.max(m, v), -Infinity);
    }

    // ---- Balayage TWS pour un TWA fixé ----
    const aStep2 = safeStep(fractionStep(currTwa, polars.twa), polars.twa.length);
    let twsDetect = [];

    for (let twsIndex = 100; twsIndex < 4300; twsIndex++) {
        const aTWS = twsIndex / 100;
        const sStep2 = safeStep(fractionStep(aTWS, polars.tws), polars.tws.length);

        let actualSailSpd = 0;
        let bestSpdAtThisTWS = 0;
        let bestSpdSailAtThisTWS = null;

        for (const sail of polars.sail) {
        if (!inOpts(sail.id)) continue;

        const f = foilingFactor(options, aTWS, polars.twa[aStep2.index], polars.foil);
        const rspeed = bilinear(
            aStep2.fraction, sStep2.fraction,
            sail.speed[aStep2.index - 1][sStep2.index - 1],
            sail.speed[aStep2.index][sStep2.index - 1],
            sail.speed[aStep2.index - 1][sStep2.index],
            sail.speed[aStep2.index][sStep2.index]
        );
        const speed = rspeed * f * hRatio;

        if (speed > bestSpdAtThisTWS) {
            bestSpdAtThisTWS = speed;
            bestSpdSailAtThisTWS = sail.id;
        }
        if (sail.id === sailId) actualSailSpd = speed;
        }

        // Vérifie si la voile actuelle reste la meilleure à ce TWS
        if (
        (actualSailSpd >= bestSpdAtThisTWS && bestSpdSailAtThisTWS === sailId) ||
        (actualSailSpd * (1 + tol) > bestSpdAtThisTWS && bestSpdSailAtThisTWS !== sailId)
        ) {
        twsDetect.push(aTWS);
        }
    }

    if (twsDetect.length) {
        best.sailTWSMin = twsDetect.reduce((m, v) => Math.min(m, v), +Infinity);
        best.sailTWSMax = twsDetect.reduce((m, v) => Math.max(m, v), -Infinity);
    }

    return best;
}

