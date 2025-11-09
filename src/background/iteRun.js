

import {processDBOperations,getData,openDatabase,saveData,getLatestEntriesPerUser,getLatestAndPreviousByTriplet} from '../common/dbOpes.js';
import { gcDistance, 
    courseAngle, 
    angle, 
    toRad ,
    toDeg,
    roundTo,
    isBitSet,
    guessOptionBits,
    calculateCOGLoxo
} from './../common/utils.js';
import { theoreticalSpeed ,
    bestVMG,
    manoeuveringPenalities,
    computeEnergyRecovery,
    foilingFactor,
    computeEnergyLoose
} from './../polar/utils.js';
import cfg from '@/config.json';



async function computeFleetPlayerIte(legInfos, latest,playerOption,currentPlayerLatest , polar)
{

    if(!latest || !currentPlayerLatest || !polar) return;
    
    const metaDash = latest.metaDash?latest.metaDash:[];
//    let metaDash = latest.metaDash;
 
    const playerPos = latest.pos;
    const currentPlayerPos = currentPlayerLatest.pos;
    
    metaDash.DTU = roundTo(gcDistance(currentPlayerPos, playerPos), 1);
    metaDash.BFU = roundTo(courseAngle(currentPlayerPos.lat, currentPlayerPos.lon, playerPos.lat, playerPos.lon) * 180 / Math.PI, 1);
    let ad = metaDash.BFU - currentPlayerLatest.hdg + 90;
    if (ad < 0) ad += 360;
    if (ad > 360) ad -= 360;
    if (ad > 180) metaDash.DTU = -metaDash.DTU; // "behind" us

    metaDash.dtf = latest.distanceToEnd;
    metaDash.dtfC = legInfos.end?gcDistance(latest.pos, legInfos.end):null;
    if (!metaDash.dtf || metaDash.dtf == null) {
        metaDash.dtf = metaDash.dtfC;
    }


    metaDash.raceTime = null;
    if(legInfos.type == "record")
    {
        if(latest.state == "racing" && latest.distanceToEnd)
        {
            try {
                metaDash.raceTime = latest.dateIte - latest.startDate;
                const estimatedSpeed = latest.distanceFromStart / (raceTime / 3600000);
                const eTtF = (latest.distanceToEnd / estimatedSpeed) * 3600000;
                metaDash.avgSpeed = estimatedSpeed;
                metaDash.eRT = raceTime + eTtF;
            } catch (e) {
                metaDash.eRT = e.toString();
            }
        } else if(latest.startDate && latest.state === "racing" && latest.startDate!="-") {
                metaDash.raceTime = Date.now() - latest.startDate;
        }
    } else
    {
        let legS = 0;
        if (legInfos.legStartDate != undefined && legInfos.legStartDate > 0) legS = legInfos.legStartDate;
        if (legInfos.start?.date != undefined) legS = legInfos.start.date;
        if (legS > 0) metaDash.raceTime = currentPlayerLatest.iteDate-legS;
    }
                    

    let realFoilFactor = null;
    let sailCoverage = 0;
    let xplained = false;
    let xfactor = 1.0;
    playerOption.guessOptions = playerOption.guessOptions?playerOption.guessOptions:0;
    const playerGuessOptionPrev = playerOption.guessOptions;

    if (polar) {
        const currentSail = latest.sail % 10;
        let sailDef = polar.sail[currentSail - 1];
            
        
        // "Real" boats have no sail info
        // "Waiting" boats have no TWA
        if (latest.state == "racing" && sailDef && latest.twa && latest.tws) {
          //  let iA = fractionStep(latest.twa, polar.twa);
          //  let iS = fractionStep(latest.tws, polar.tws);

            // "Plain" speed
            const speedTFull = theoreticalSpeed(polar,null,latest.tws, latest.twa, currentSail - 1)
            let speedT = speedTFull.speed;
            // Speedup factors
            let foilFactor = foilingFactor({foil:true}, latest.tws, latest.twa, polar.foil);
            let hullFactor = polar.hull.speedRatio;

            const epsEqual = (a, b) => {
                return Math.abs(b - a) < 0.00002;
            }

            const aroundV = (a, b) => {
                return Math.abs(b - a) < 0.01;
            } 
            
            if(guessOptionBits[currentSail]) playerOption.guessOptions |= guessOptionBits[currentSail];

            if (playerOption?.options?.foil)  {realFoilFactor = 0;}
            
            xfactor = latest.speed / speedT;
            const foils = ((foilFactor - 1) * 100) / 4 * 100;
            if (epsEqual(xfactor, 1.0)) {
                // Speed agrees with "plain" speed.
                // Explanation: 1. no hull and 2. foiling condition => no foils.
                xplained = true;
                playerOption.guessOptions |= guessOptionBits["hullDetected"];
                playerOption.guessOptions &= ~guessOptionBits["hull"];                
                if (foilFactor > 1.0) {
                    realFoilFactor = null;
                    playerOption.guessOptions |= guessOptionBits["foilDetected"];
                    playerOption.guessOptions &= ~guessOptionBits["foil"];     
                }
            } else {
                // Speed does not agree with plain speed.
                // Check if hull, foil or hull+foil can explain the observed speed.
                if (epsEqual(latest.speed, speedT * hullFactor)) {
                    xplained = true;
                    if (epsEqual(hullFactor, foilFactor)) {
                        // Both hull and foil match.
                        realFoilFactor = foils;
                        playerOption.guessOptions |= guessOptionBits["foilActivated"];
                        playerOption.guessOptions |= guessOptionBits["hullDetected"];
                        playerOption.guessOptions &= ~guessOptionBits["hull"];  
                    } else {
                        playerOption.guessOptions |= guessOptionBits["hullActivated"];
                        
                        if (foilFactor > 1.0) {
                            realFoilFactor = null;
                            playerOption.guessOptions |= guessOptionBits["foilDetected"];
                            playerOption.guessOptions &= ~guessOptionBits["foil"];                
            
                        }
                    }
                } else if (epsEqual(latest.speed, speedT * foilFactor)) {
                    xplained = true;
                    realFoilFactor = foils;
                    playerOption.guessOptions |= guessOptionBits["foilActivated"];
                    playerOption.guessOptions |= guessOptionBits["hullDetected"];
                    playerOption.guessOptions &= ~guessOptionBits["hull"];                
                } else if (epsEqual(latest.speed, speedT * foilFactor * hullFactor)) {
                    xplained = true;
                    realFoilFactor = foils;
                    playerOption.guessOptions |= guessOptionBits["foilActivated"];
                    playerOption.guessOptions |= guessOptionBits["hullActivated"];
                } else {
                    if(playerOption?.options
                        || (isBitSet(playerOption?.guessOptions,guessOptionBits["foilDetected"])
                         && isBitSet(playerOption?.guessOptions,guessOptionBits["hullDetected"]))
                      ) 
                    {
                        let hullOpt = isBitSet(playerOption?.guessOptions,guessOptionBits["hull"]);
                        let foilOpt = isBitSet(playerOption?.guessOptions,guessOptionBits["foil"]);
                        if(playerOption?.options)
                        {
                            hullOpt = playerOption?.options.hull;
                            foilOpt =  playerOption?.options.foil;   
                        }
                        xplained = true;
                        
                        if(foilOpt)
                            realFoilFactor = foils;
                        //    info.xoption_foils = roundTo(foils, 0) + "%";
                        else
                            realFoilFactor = null;
                        //    info.xoption_foils = "no";
                        
                        //here check for overspeed due to sail
                        //spd = speedT *ff* hf *sf
                        //sf = spd /  speedT *ff* hf
                        let sf = 1.0;
                        if(foilOpt && hullOpt)
                            sf = latest.speed / (speedT * foilFactor * hullFactor);
                        else if(foilOpt)
                            sf = latest.speed / (speedT * foilFactor);
                        else if(hullOpt)
                            sf = latest.speed / (speedT * hullFactor);
                        else
                            sf = latest.speed / (speedT);
        
                        if(sf >1.0 && sf <= 1.14) {
                            sailCoverage = roundTo((sf-1.0)*100, 2);
                        } else if(sf < 1.0) {
                            let c = (1.0-sf)*100;
                            sailCoverage = -roundTo((1.0-sf)*100, 2);
                            if(aroundV(c,75) || aroundV(c,50))
                            {
                                playerOption.guessOptions |= guessOptionBits["winchDetected"];
                                playerOption.guessOptions &= ~guessOptionBits["winch"];
                            } else if(aroundV(c,30) || aroundV(c,51)) {
                                playerOption.guessOptions |= guessOptionBits["winchActivated"];
                            }                    
                        }
                    }
                }
            }
        }
    } else {
        xplained = true;
    }

    metaDash.xplained = xplained
    metaDash.sailCoverage = sailCoverage;
    metaDash.realFoilFactor = realFoilFactor;
    metaDash.xfactor = xfactor;

    if (latest.twa !== 0) {
        metaDash.twd = latest.twa + latest.hdg;
        if (metaDash.twd < 0) {
            metaDash.twd += 360;
        } else if(metaDash.twd > 360)
            metaDash.twd -=360; 
    } else {
        metaDash.twd = 0;
    }
    
    // Ajout - Calcul VMG
    metaDash.vmg = Math.abs(latest.speed * Math.cos(toRad(latest.twa)));
    if(!metaDash.bVmg) metaDash.bVmg = bestVMG(latest.tws, polar, playerOption.options, latest.sail % 10, latest.twa)
  

    // Ajout - type2 pour tri par catégories
 /* 
 */       

    if (latest.team) {
        latest.type2 = "team";
    } else if (latest.followed || latest.isFollowed) {
        latest.type2 = "followed";
    } else {
        latest.type2 = latest.type;  
    }

    latest.metaDash = metaDash;

    if(latest.userId == currentPlayerLatest.userId) {
        await saveData('legPlayersInfos', latest,null,{ updateIfExists: true });
        await saveData('legFleetInfos', latest,null,{ updateIfExists: true });
    }
    else
        await saveData('legFleetInfos', latest,null,{ updateIfExists: true });
    
    if(playerOption.guessOptions != playerGuessOptionPrev)
    {
        latest.metaDash = metaDash;
        const playerOptionRaceRecord = {
            raceId : legInfos.raceId,
            legNum : legInfos.legNum,
            userId : latest.userId,
            guessOptions :playerOption.guessOptions,                  
            timestamp : Date.now()
        };
        await saveData('legPlayersOptions', playerOptionRaceRecord,null,{ updateIfExists: true });
    } 
}

  
export async function computeFleetIte(raceId, legNum) {

    if(!raceId || !legNum) return;
    const legInfos = await getData('legList', [raceId, legNum]); 
    if(!legInfos) return;
    const polar = await getData('polars', legInfos.polar_id);
    if(!polar) return;
    const currentUserId = await getData('internal', 'lastLoggedUser');
    if(!currentUserId) return;
    const { latest, previous, meta1 } = await getLatestAndPreviousByTriplet(raceId, legNum, currentUserId.loggedUser , {storeName: 'legPlayersInfos'});
    
    const currentPlayerIte = latest;
    if(!currentPlayerIte) return;


    const now = Date.now();
    const fifteenMinutesAgo = now - 15 * 60 * 1000;
  
    const { items, meta } = await getLatestEntriesPerUser(raceId, legNum, {
      since: fifteenMinutesAgo,
      until: now,
      timeout: 4000,
      storeName: 'legFleetInfos'
    });
    for (const [userId, entry] of Object.entries(items)) {
        const playerOptionRace = (await getData('legPlayersOptions', [raceId, legNum, userId])) ?? {options:[],guessOptions:0};
 
        await computeFleetPlayerIte(legInfos, entry,playerOptionRace,currentPlayerIte , polar)
    }
    await saveData('internal', {id: "legFleetInfosDashUpdate",ts:Date.now()},null,{ updateIfExists: true });
}

export async function computeOwnIte(raceId, legNum, userId)
{
    if(!raceId || !legNum || !userId) return;
    const { latest, previous, meta } = await getLatestAndPreviousByTriplet(raceId, legNum, userId , {storeName: 'legPlayersInfos'});
    if(meta.timedOut || !latest) return;
    const legInfos = await getData('legList', [raceId, legNum]); 

    if(!legInfos ) return;
    const polar = await getData('polars', legInfos.polar_id);
    if(!polar) return;

    const playerOption = (await getData('legPlayersOptions', [raceId, legNum, userId])) ?? {options:[],guessOptions:0};
    
    const paramStamina = (await getData('internal', 'paramStamina'))?.paramStamina ?? null;

    const metaDash = latest.metaDash?latest.metaDash:[];
    metaDash.speedT = theoreticalSpeed(polar,playerOption.options,latest?.tws,latest?.twa); 

    if(previous)
    {
        const d = gcDistance(previous.pos, latest.pos);
        const delta = courseAngle(previous.pos.lat, previous.pos.lon, latest.pos.lat, latest.pos.lon);
        const alpha = Math.PI - angle(toRad(previous.hdg), delta);
        const beta = Math.PI - angle(toRad(latest.hdg), delta);
        const gamma = angle(toRad(latest.hdg), toRad(previous.hdg));
        // Epoch timestamps are milliseconds since 00:00:00 UTC on 1 January 1970.
        metaDash.deltaT = (latest.iteDate - previous.iteDate) / 1000;
        if (metaDash.deltaT > 0
            && Math.abs(toDeg(gamma) - 180) > 1
            && toDeg(alpha) > 1
            && toDeg(beta) > 1) {
            metaDash.deltaD = d / Math.sin(gamma) * (Math.sin(beta) + Math.sin(alpha));
        } else {
            metaDash.deltaD = d;
        }
        metaDash.speedC = Math.abs(roundTo(metaDash.deltaD / metaDash.deltaT * 3600, 3));
        // deltaD_T = Delta distance computed from speedT is only displayed when it deviates
        if (metaDash.speedT) {
            metaDash.deltaD_T = metaDash.deltaD / metaDash.speedC * metaDash.speedT.speed;
        }
        metaDash.previousItedate = previous.iteDate;
    }

    metaDash.bVmg = bestVMG(latest.tws, polar, playerOption.options, latest.sail % 10, latest.twa)
  // Ajout - Calcul COG/VMC
    metaDash.cog = null;
    metaDash.vmc = null;
    if(legInfos.checkpoints) {
        var cp_status = false;
        // Identify the next buoy to pass
        // cp_status = false if all checkpoints are passed or no checkpoints are defined
        for (var i = 0; i < legInfos.checkpoints.length; i++) {
            var cp = legInfos.checkpoints[i];

            if ((cp.display == "none") ||  (latest.gateGroupCounters && latest.gateGroupCounters[cp.group - 1])) {
                continue;
            }
            if ((cp.display != "none") ||  (!latest.gateGroupCounters[cp.group - 1])) {
                metaDash.cog = calculateCOGLoxo(latest.pos.lat, latest.pos.lon, cp.start.lat, cp.start.lon);
                metaDash.vmc = latest.speed * Math.cos((latest.hdg - metaDash.cog) * (Math.PI / 180));
                cp_status = true;
                break;
            }
        }

        if (cp_status == false) {
            // if(cfg.debugIteRun) console.log("Finish Gate is at " + Util.formatPosition(r.legdata.end.lat, r.legdata.end.lon));
            metaDash.cog = calculateCOGLoxo(latest.pos.lat, latest.pos.lon, legInfos.end.lat, legInfos.end.lon);
            metaDash.vmc = latest.speed * Math.cos((latest.hdg - metaDash.cog) * (Math.PI / 180));
        }
    }


    metaDash.coffeeBoost = 0;
    metaDash.coffeeExp = Date.now()+24*60*60*1000;
    metaDash.chocoBoost = 0;
    metaDash.chocoExp = Date.now()+24*60*60*1000;
        
    if(latest.stats)
    {
        if(latest.stats.staminaMaxEffects)
            for (const coffee of latest.stats.staminaMaxEffects) {    
                if(coffee.value > 0 && coffee.exp > Date.now())
                {
                    metaDash.coffeeBoost += coffee.value;
                    if(coffee.exp < metaDash.coffeeExp) metaDash.coffeeExp = coffee.exp;
                }
            }
        if(latest.stats.staminaTemp)
            for (const choco of latest.stats.staminaTemp) {    
                if(choco.value > 0 && choco.exp > Date.now())
                {
                    metaDash.chocoBoost += choco.value;
                    if(choco.exp < metaDash.chocoExp) metaDash.chocoExp = choco.exp;
                }
            }
    }
    const maxStamina = 100 + metaDash.coffeeBoost;
    let realStamina = latest.stamina + metaDash.coffeeBoost + metaDash.chocoBoost;

    metaDash.realStamina = realStamina>maxStamina?maxStamina:realStamina;

    const pena = manoeuveringPenalities(polar,latest,metaDash.realStamina,playerOption.options);
    const energyLoose = computeEnergyLoose(polar, paramStamina, playerOption.options, latest.tws);
    
    const manoeuver = [];
    manoeuver.gybe = {
            pena : pena.gybe,
            energyLoose : energyLoose.gybe,
            energyRecovery : computeEnergyRecovery(energyLoose.gybe,latest.tws,paramStamina,playerOption.options)
    };
    manoeuver.tack = {
            pena : pena.tack,
            energyLoose : energyLoose.tack,
            energyRecovery : computeEnergyRecovery(energyLoose.tack,latest.tws,paramStamina,playerOption.options)
    };
    manoeuver.sail = {
            pena : pena.sail,
            energyLoose : energyLoose.sail,
            energyRecovery : computeEnergyRecovery(energyLoose.sail,latest.tws,paramStamina,playerOption.options)
    };
    metaDash.manoeuver = manoeuver;
    metaDash.manoeuver.staminaFactor = pena.staminaFactor;
    metaDash.manoeuvering = (latest.tsEndOfSailChange > latest.iteDate)
        || (latest.tsEndOfGybe > latest.iteDate)
        || (latest.tsEndOfTack > latest.iteDate);
    metaDash.receivedTS = Date.now();


    metaDash.deltaReceiveCompute = metaDash.receivedTS - latest.iteDate;


    metaDash.isAutoSail = latest.hasPermanentAutoSails ||
            (latest.tsEndOfAutoSail &&(latest.tsEndOfAutoSail - latest.lastCalcDate) > 0);
    metaDash.autoSailTime = latest.hasPermanentAutoSails ?"inf" : (latest.tsEndOfAutoSail - latest.iteDate)
    latest.metaDash = metaDash;
    
    await computeFleetPlayerIte(legInfos, latest,playerOption,latest , polar);
    
    //await saveData('legPlayersInfos', latest,null,{ updateIfExists: true });
    await saveData('internal', {id: "legPlayersInfosDashUpdate",ts:Date.now()},null,{ updateIfExists: true });
 
    //await saveData('internal', {id: "legFleetInfosDashUpdate",ts:Date.now()},null,{ updateIfExists: true });
    
}

