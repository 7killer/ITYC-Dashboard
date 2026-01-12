
import { accountDetailsDataModel } from './ingesterModels/accountDetails.js';
import { legListDataModel ,raceSchema} from './ingesterModels/getLegList.js';
import { endLegPrepDataModel } from './ingesterModels/getEndLegPrep.js';
import {processDBOperations,getData} from '../../common/dbOpes.js';
import {getBoatInfosRequestDataSchema,
        getBoatInfosResponseSchema,
        getBoatInfosBoatStateSchema,
        getBoatInfosBoatEngineSchema,
        getBoatInfosBoatTrackSchema} from './ingesterModels/getBoatInfos.js';
import {gameSettingsSchema } from './ingesterModels/getGameSettings.js'
import {boatActionResponseData } from './ingesterModels/boatAction.js'

/* addBoatActionResponseData */ 
import { getFleetRequestDataSchema, getFleetResponseSchema } from './ingesterModels/getFleet.js';
import { polarSchema} from './ingesterModels/polar.js';
import { ghostTrackRequestDataSchema, ghostTrackResponseSchema } from './ingesterModels/getGhostTrack.js';

import cfg from '@/config.json';


export function ingestPolars(msgBody)
{
  const polarsData = msgBody?.scriptData?.extendsData?.boatPolar;

  if(!polarsData) return;
  polarSchema.validate(polarsData,{stripUnknow:true})
  .then(polar => {
      const dbOpe = [
          {
              type : "putOrUpdate",
              polars : [
                  {
                    id : polar._id,
                    label: polar.label,
                    globalSpeedRatio: polar.globalSpeedRatio,
                    iceSpeedRatio: polar.iceSpeedRatio,
                    autoSailChangeTolerance: polar.autoSailChangeTolerance,
                    badSailTolerance: polar.badSailTolerance,
                    maxSpeed: polar.maxSpeed,
                    foil: polar.foil,
                    hull: polar.hull,
                    winch: polar.winch,
                    tws: polar.tws,
                    twa: polar.twa,
                    sail: polar.sail,
                    _updatedAt: polar._updatedAt
                  }
              ],
              internal : [
                {
                  id : "polarsUpdate",
                  ts : Date.now()
                }
              ]
          }
      ];
      processDBOperations(dbOpe);
    })
    .catch(error => {
        if(cfg.debugIngesterErr) console.error('Account Validation Error :', error);
    });
}

export async function ingestBoatInfos(boatData)
{
  const ope= [];
  let rstTimer = false;
  let raceId = null;
  let legNum = null;
  let userId = null;

  try {
    const boatInfos = await getBoatInfosResponseSchema.validate(boatData, {
      stripUnknown: true,
      abortEarly: false
    });

    let currendId = await getData('internal', 'lastLoggedUser');
    currendId = currendId?.loggedUser;
    if(boatInfos.res?.leg) {
      const l = boatInfos.res.leg;
      
      raceId = l.race_id;
      legNum = l.leg_num;

      ope.push( {
        type : "putOrUpdate",
        legList: [
          {
  //          key:[l.race_id,l.leg_num], 
            id: `${l._id.race_id}-${l._id.num}`,
            raceId: l._id.race_id,
            legNum: l._id.num,
            status: l.status,
            legName: l.name,
            raceName: l.race.name,
            raceType: l.race.type,
            vsrLevel: l.vsrLevel,
            estimatedTime: l.estimatedTime,
            estimatedLength: l.estimatedLength,
            fineWinds: l.fineWinds,
            start: l.start,
            end: l.end,
            close: l.close,
            open: l.open,
            polar_id: l.boat?.polar_id,
            boatName: l.boat?.name,
            pilotBoatCredits: l.pilotBoatCredits,
            priceLevel: l.priceLevel,
            freeCredits: l.freeCredits,
            lastUpdate: l.lastUpdate,
            optionPrices: l.optionPrices,
            checkpoints: l.checkpoints,
            ice_limits: l.ice_limits,
            fineWinds: l.fineWinds,
            course: l.course,
            restrictedZones : l.restrictedZones ?? null
          },
        ],
        ...((l.boat?.stats?.weight && l.boat?.polar_id) && {
          polars: [
              {
//                key: l.boat.polar_id,
                id: l.boat.polar_id,
                weight : l.boat.stats.weight
              }
          ]
        }),
        internal: [
          {
            id: "legListUpdate",
            ts: Date.now(),
          },
          ...((l.boat?.stats?.weight && l.boat?.polar_id)
            ? [{
                id: "polarsUpdate",
                ts: Date.now(),
              }]
            : [])
        ]        
      });
    }

    if(boatInfos.res?.bs && !boatInfos.res.bs.lastCalcDate) boatInfos.res.bs.lastCalcDate = Date.now();

    if(boatInfos.res?.leg && boatInfos.res?.bs)
    {
      const bs = boatInfos.res.bs;
      const l = boatInfos.res.leg;
      
      raceId = l.race_id;
      legNum = l.leg_num;
      userId = bs._id.user_id;
      currendId = bs._id.user_id;
      ope.push( {
        type : "putOrUpdate",
        internal : [
          {
            id : 'lastLoggedUser',
            loggedUser : bs._id.user_id 
          },
          { 
            id : 'lastOpennedRace',
            lastOpennedRace : `${l._id.race_id}-${l._id.num}` ,
            raceId : l._id.race_id,
            legNum : l._id.num,
          },
          {
            id: "playersUpdate",
            ts: Date.now(),
          },
          {
            id : 'state',
            state : 'raceOpened'
          },
        ],
        players : [
          {                       
//            key: bs._id.user_id,   
            id : bs._id.user_id,
            name : bs.displayName,
            timestamp: Date.now(),
//                  isVip : validAccount.scriptData.isVIP && validAccount.scriptData.userSettings?.noAds,
//            credits : bs.currency1
          }      
        ],
      });
      
    }
    if(boatInfos.res?.bs) {
      const bs = boatInfos.res.bs;
      //todo manage player and track

      raceId = bs._id.race_id;
      legNum = bs._id.leg_num;
      userId = bs._id.user_id;
      if(bs._id.user_id == currendId)
      {
        rstTimer = true;
        if(bs.fullOptions)
        {
          bs.options = ["foil","heavy","hull","light","reach","radio",
                        "winch","comfortLoungePug","magicFurler","vrtexJacket"
          ];
        }
        ope.push( {
          type : "putOrUpdate",
          legPlayersInfos : [
            {
              id: bs._id.race_id+"_"+bs._id.leg_num+"_"+bs._id.user_id+"_"+bs.lastCalcDate,
              userId: bs._id.user_id,
              iteDate: bs.lastCalcDate,
              raceId: bs._id.race_id,
              legNum: bs._id.leg_num,
              distanceFromStart: bs.distanceFromStart,
              distanceToEnd: bs.distanceToEnd,
              gateGroupCounters: bs.gateGroupCounters,
              hasPermanentAutoSails: bs.hasPermanentAutoSails,
              hdg: bs.heading,
              legStartDate: bs.legStartDate,
              pos: bs.pos,
              rank: bs.rank,
              sail: bs.sail,
              isRegulated: bs.isRegulated ?? null,
              speed: bs.speed,
              stamina: bs.stamina,
              startDate: bs.startDate,
              state: bs.state,
              tsEndOfAutoSail: bs.tsEndOfAutoSail ?? null,
              tsEndOfSailChange: bs.tsEndOfSailChange ?? null,
              tsEndOfGybe: bs.tsEndOfGybe ?? null,
              tsEndOfTack: bs.tsEndOfTack ?? null,
              twa: bs.twa,
              twaAuto: bs.twaAuto ?? null,
              twd: bs.twd,
              tws: bs.tws,
              aground: bs.aground,
              badSail: bs.badSail ?? null,
              waypoints: bs.waypoints ?? null,
              nextWpIdx: bs.nextWpIdx ?? null,
              lastWpIdx: bs.lastWpIdx ?? null,
              stats: bs.stats,
              choice : true,
              branding : bs.branding
            }
          ],
          ...((bs.options && bs.options.length >0) && {
            legPlayersOptions: [
                {
                  raceId : bs._id.race_id,
                  legNum : bs._id.leg_num,
                  userId : bs._id.user_id,
                  id: bs._id.race_id+"_"+bs._id.leg_num+"_"+bs._id.user_id+"_"+bs.lastCalcDate,
                  options: {
                    foil:  bs.options?.includes("foil") ?? false,
                    heavy: bs.options?.includes("heavy") ?? false,
                    hull:  bs.options?.includes("hull") ?? false,
                    light: bs.options?.includes("light") ?? false,
                    reach: bs.options?.includes("reach") ?? false,
                    winch: bs.options?.includes("winch") ?? false,
                    comfortLoungePug: bs.options?.includes("comfortLoungePug") ?? false,
                    magicFurler: bs.options?.includes("magicFurler") ?? false,
                    vrtexJacket: bs.options?.includes("vrtexJacket") ?? false,
                    radio: bs.options?.includes("radio") ?? false,
                    
                  },
                  timestamp : bs.lastCalcDate
                }
            ]
          }),
          internal: [
            {
              id: "legPlayersInfosUpdate",
              ts: Date.now(),
            },
            ...((bs.options && bs.options.length >0) 
              ? [{
                  id: "legPlayersOptionsUpdate",
                  ts: Date.now(),
                }]
              : [])
          ]
        });
      } else
      {
        ope.push( {
          type : "putOrUpdate",
          legFleetInfos : [
            {
              id: bs._id.race_id+"_"+bs._id.leg_num+"_"+bs._id.user_id+"_"+bs.lastCalcDate,
              userId: bs._id.user_id,
              iteDate: bs.lastCalcDate,
              raceId: bs._id.race_id,
              legNum: bs._id.leg_num,
              distanceFromStart: bs.distanceFromStart,
              distanceToEnd: bs.distanceToEnd,
              hasPermanentAutoSails: bs.hasPermanentAutoSails,
              hdg: bs.heading,
              pos: bs.pos,
              rank: bs.rank ?? null,
              sail: bs.sail,
              isRegulated: bs.isRegulated ?? null,
              speed: bs.speed,
              state: bs.state,
              twa: bs.twa,
              twaAuto: bs.twaAuto ?? null,
              twd: bs.twd,
              tws: bs.tws,
              aground: bs.aground ?? null,
              badSail: bs.badSail ?? null,
              choice : true,
              ...(bs.isFollowed ? { isFollowed: bs.isFollowed } : {}),
              ...(bs.followed ? { followed: bs.followed } : {}),
              ...(bs.team ? { team: bs.team } : {})
            }
          ],
          players : [
            { 
              id : bs._id.user_id,
              name : bs.displayName,
              timestamp: Date.now(),
            }      
          ],
          internal: [
            {
              id: "legFleetInfosUpdate",
              ts: Date.now(),
            },
            {
              id: "playersUpdate",
              ts: Date.now(),
            },
          ]
        });        
      }
    }
    if(boatInfos.res.track)
    {
      raceId = boatInfos.res.track._id.race_id;
      legNum = boatInfos.res.track._id.leg_num;
      userId = boatInfos.res.track._id.user_id;

      ope.push( {
        type : "putOrUpdate",
        playersTracks : [
          {
            raceId : raceId,
            legNum : legNum,
            userId : userId,
            type : 'fleet',
            track : boatInfos.res.track.track
          }
        ],
        internal: [
          {
            id: "playersTracksUpdate",
            ts: Date.now(),
          },
        ]
        });        
    }
    processDBOperations(ope);
    return {rstTimer: rstTimer,
            raceId : raceId,
            legNum : legNum,
            userId : userId
    };
  } catch(error) {
    if(cfg.debugIngesterErr) console.error('boat infos Validation Error :', error)
    return {rstTimer: false,
            raceId : null,
            legNum : null,
            userId : null
};;
  }
}
export function ingestAccountDetails(account)
{
    accountDetailsDataModel.validate(account,{stripUnknow:true})
    .then(validAccount => {
        const dbOpe = [
            {
                type : "putOrUpdate",
                internal: [
                  {
                    id : 'state',
                    state : "playerConnected"
                  },
                  {
                    id: "playersUpdate",
                    ts: Date.now(),
                  },
                  {   
//                        key: 'lastLoggedUser',
                      id : 'lastLoggedUser',
                      loggedUser : validAccount.userId 
                  },
                  ...(validAccount.scriptData.team?.id
                    ? [{
                        id: "teamsUpdate",
                        ts: Date.now(),
                      }]
                    : [])
                ],
                players : [
                    { 
//                        key: validAccount.userId,  
                        id : validAccount.userId,
                        name : validAccount.displayName,
                        teamId : validAccount.scriptData.team?.id?? null,
                        timestamp: Date.now(),
                        isVip : validAccount.scriptData.isVIP && validAccount.scriptData.userSettings?.noAds,
                        credits : validAccount.currency1
                    }      
                ],
                ...(validAccount.scriptData.team?.id && {
                    teams: [
                        {
//                            key: validAccount.scriptData.team.id,  
                            id: validAccount.scriptData.team.id,
                            name: validAccount.scriptData.team.name // Ajoute d'autres propriétés si nécessaire
                        }
                    ]
                })
            }
        ];
        processDBOperations(dbOpe);
        return true;
    })
    .catch(error => {
        if(cfg.debugIngesterErr) console.error('Account Validation Error :', error);
        return false;
    });
}

export function ingestEndLegPrep(endLegPrep)
{
    endLegPrepDataModel.validate(endLegPrep, { stripUnknown: true,  abortEarly: false  })
    .then(validData => {
    const l = validData.scriptData.leg;

    const dbOpe = [
        {
        type: "putOrUpdate",
        legList: [
            {
//            key : [l._id.race_id,l._id.num],
            id: `${l._id.race_id}-${l._id.num}`,
            raceId: l._id.race_id,
            legNum: l._id.num,
            status: l.status,
            legName: l.name,
            raceName: l.race.name,
            raceType: l.race.type,
            vsrLevel: l.vsrLevel,
            estimatedTime: l.estimatedTime,
            estimatedLength: l.estimatedLength,
            fineWinds: l.fineWinds,
            start: l.start,
            end: l.end,
            close: l.close,
            open: l.open,
            polar_id: l.boat?.polar_id,
            boatName: l.boat?.name,
            pilotBoatCredits: l.pilotBoatCredits,
            priceLevel: l.priceLevel,
            freeCredits: l.freeCredits,
            lastUpdate: l.lastUpdate,
            optionPrices: l.optionPrices,
            checkpoints: l.checkpoints,
            ice_limits: l.ice_limits,
            fineWinds: l.fineWinds,
            course: l.course,
            restrictedZones : l.restrictedZones

            },
            {
//              key : 'update',
              id: 'update',
              update: new Date().toISOString()        
            }
        ],
        ...((l.boat?.stats?.weight && l.boat?.polar_id) && {
          polars: [
              {
//                key: l.boat.polar_id,
                id: l.boat.polar_id,
                weight : l.boat.stats.weight
              }
          ]
        }),
        internal: [
          {
            id: "legListUpdate",
            ts: Date.now(),
          },
          ...((l.boat?.stats?.weight && l.boat?.polar_id)
            ? [{
                id: "polarsUpdate",
                ts: Date.now(),
              }]
            : []),
          { 
            id : 'lastOpennedRace',
            lastOpennedRace : `${l._id.race_id}-${l._id.num}` ,
            raceId : l._id.race_id,
            legNum : l._id.num,
          },
          {
            id : 'state',
            state : 'raceOpened'
          },
            
        ],
      }
    ];

    processDBOperations(dbOpe);
    })
    .catch(err => {
    if(cfg.debugIngesterErr) console.error("Validation failed:", err.errors);
    });
}

export function ingestRaceList(legListData) {
  try {
    // ✅ Validation globale
    const validData = legListDataModel.validateSync(legListData, {
      stripUnknown: true,
      abortEarly: false
    });

    const races = validData.scriptData?.res || [];
    const legList = [];
    const polars = [];
    let validCount = 0;
    let errorCount = 0;

    for (const r of races) {
      try {
        // ✅ Validation individuelle de chaque race
        const validated = raceSchema.validateSync(r, { stripUnknown: true });
        const idInfo = validated._id || {};

        legList.push({
 //         key : [validated._id.race_id,validated._id.num],
          id: `${validated.raceId}-${validated.legNum}`,
          raceId: validated.raceId,
          legNum: validated.legNum,
          raceName: validated.raceName,
          legName: validated.legName,
          estimatedTime: validated.estimatedTime,
          estimatedLength: validated.estimatedLength,
          status: validated.status,
          vsrLevel: validated.vsrRank,
          priceLevel: validated.priceLevel,
          freeCredits: validated.freeCredits,
          adStartCredits: validated.adStartCredits,
          pilotBoatCredits: validated.pilotBoatCredits,
          lastUpdate: validated.lastUpdate,
          fineWinds: validated.fineWinds,
          nbTotalSkippers: validated.nbTotalSkippers,
          boatsAtSea: validated.boatsAtSea,
          arrived: validated.arrived,
          raceType: validated.raceType,
          limitedAccess: validated.limitedAccess,
          polar_id: validated.boat?.polar_id,
          boatName: validated.boat?.name,
          start: validated.start,
          end: validated.end
        });
        if(validated.boat?.stats?.weight && validated.boat?.polar_id)
        {
          polars.push(
            {
//              key: validated.boat.polar_id,
              id: validated.boat.polar_id,
              weight : validated.boat.stats.weight
            }
          );
        }

        validCount++;
      } catch (validationErr) {
        if(cfg.debugIngester) console.warn(`❌ Validation failed for raceId=${r.raceId}, legNum=${r.legNum ?? '?'}`);
        if(cfg.debugIngester) console.warn(validationErr.errors);
        errorCount++;
      }
    }

    if (legList.length > 1) {
      const dbOpe = [
        {
          type: "putOrUpdate",
          legList,
          polars,
          internal: [
            {
              id: "legListUpdate",
              ts: Date.now(),
            },
            ...(polars.length > 1
              ? [{
                  id: "polarsUpdate",
                  ts: Date.now(),
                }]
              : [])
          ]
        },
      ];
      processDBOperations(dbOpe);
    }

    if(cfg.debugIngester) console.log(`✅ ${validCount} race(s) ingérées, ❌ ${errorCount} erreur(s).`);
  } catch (err) {
    if(cfg.debugIngesterErr) console.error("❌ Erreur globale dans legListDataModel :", err.errors);
  }
}


export async function ingestFleetData(request, response) {
  try {
    // ✅ Validation synchrone de la requête
    const req = getFleetRequestDataSchema.validateSync(request, {
      stripUnknown: true
    });

    const filteredResponse = {
      ...response,
      res: (response.res || [])
        // 1️⃣ Exclure pilotBoat
        .filter(p => p.userId !== "pilotBoat")
        // 2️⃣ Corriger le state pour les bateaux "real"
        .map(p => ({
          ...p,
          state: p.type === "real" && p.state === null ? "racing" : p.state
        }))
    };

    // ✅ Validation synchrone de la réponse
    const res = getFleetResponseSchema.validateSync(filteredResponse, {
      stripUnknown: true
    });

    const connectedUserInfos = await getData("players",req.user_id);
    let currentTeamId = connectedUserInfos?.teamId?connectedUserInfos.teamId:null;

    const legFleetInfos = res.res.map(p => ({  
//      key:[req.race_id,req.leg_num,p.userId,p.lastCalcDate],   
      id: `${req.race_id}-${req.leg_num}-${p.userId}-${p.lastCalcDate}`,
      raceId: req.race_id,
      legNum: req.leg_num,
      userId: p.userId,
      iteDate: p.lastCalcDate?p.lastCalcDate:Date.now(),
      type: p.type,
      hdg: p.heading,
      speed: p.speed,
      pos: p.pos,
      tws: p.tws,
      twa: p.twa,
      twd: p.twd,
      sail: p.sail ?? null,
      rank: p.rank ?? null,
      state : p.state,
      type:p.type,
      ...(p.isFollowed ? { isFollowed: p.isFollowed } : {}),
      ...(p.followed ? { followed: p.followed } : {}),
      ...(p.team ? { team: p.team } : {})
    }));

    const players = res.res.map(p => ({
      id : p.userId,
      name : p.displayName,
      timestamp: Date.now(),
      ...(p.team &&currentTeamId?{teamId:currentTeamId}:{})
    }));
    const playersTracks = res.res.filter(p => Array.isArray(p.track) && p.track.length !== 0) 
    .map(p => ({
      id: p.userId,
      raceId: req.race_id,
      legNum: req.leg_num,
      userId: p.userId,
      type: 'fleet'
    }));

    const dbOpe = [
      {
        type: "putOrUpdate",
        legFleetInfos,
        players,
        ...(playersTracks.length ? { playersTracks } : {}),
        internal: [
          {
            id: "legFleetInfosUpdate",
            ts: Date.now(),
          },
          {
            id: "playersUpdate",
            ts: Date.now(),
          },
          ...((playersTracks?.length) ? [{ id: "playersTracksUpdate", ts:  Date.now() }] : []),
        ]
      }
    ];

    processDBOperations(dbOpe);
    if(cfg.debugIngester) console.log(`✅ Ingested ${legFleetInfos.length} fleet players for race ${req.race_id}, leg ${req.leg_num}`);

  } catch (err) {
    if(cfg.debugIngesterErr) console.error("❌ Fleet ingest failed:", err.errors);
  }
}


export function ingestGameSetting(gameSetting) {
  gameSettingsSchema.validate(gameSetting, { stripUnknown: true })
  .then(validGameSetting => {
    const stamina = validGameSetting.scriptData?.settings?.stamina;
    const dbOpe = [
      {
        type: "putOrUpdate",
        ...(stamina && {
          internal: [
            {
//              key: "paramStamina",
              id: "paramStamina",
              paramStamina: stamina,
            },
            {
              id: "paramStaminaUpdate",
              ts: Date.now(),
            }  
          ],
        }),
      },
    ];

    processDBOperations(dbOpe);
    return true;
  })
  .catch(error => {
      if(cfg.debugIngesterErr) console.error('Account Validation Error :', error);
      return false;
  });
}

export function ingestBoatAction(boatActionTxt)
{
  boatActionResponseData.validate(boatActionTxt, { stripUnknown: true })
  .then(ValidboatActionTxt => {
  const { boatActions } = ValidboatActionTxt.scriptData;
  const raceId = boatActions[0]._id.race_id;
  const legNum = boatActions[0]._id.leg_num;
  const userId = boatActions[0]._id.user_id;

  const userAction = {};
  const prog = {
    order : [],
    wp :[]    
  };
  for (const action of boatActions) {
    if ('sail_id' in action) {
      userAction.sail = {
        autoSails: action.sail_id >= 10 ? true : false,
        sailId: action.sail_id,
      };
    } else if ('isProg' in action) {

      const order = {
        autoTwa: action.autoTwa,
        deg: action.deg,
        timestamp: action._id.ts,
      } 
      if(!action.isProg)
        userAction.heading = order;
      else
        prog.order.push(order)
    } else if ('pos' in action) {
      action.pos.forEach(({ lat, lon, idx }) => {
        const order = {
          lat: lat,
          lon: lon,
          idx: idx,
        };
        prog.wp.push(order);
      });
      prog.wp.sort((a, b) => a.idx - b.idx);
    }
  }

  if (prog.order) {
    prog.order.sort((a, b) => a.timestamp - b.timestamp);
  }
  const dbOpe = [
    {
      type: "putOrUpdate",
      legPlayersOrder : [
        ...(('sail' in userAction)
          ? [{
              raceId : raceId,
              legNum : legNum,
              userId : userId,
              serverTs : ValidboatActionTxt.scriptData.serverTs,
              iteDate : ValidboatActionTxt.scriptData.actionTs,
              action : {type : 'sail', action : userAction.sail}
            }]
          : []),
        ...(('heading' in userAction )
          ? [{
              raceId : raceId,
              legNum : legNum,
              userId : userId,
              serverTs : ValidboatActionTxt.scriptData.serverTs,
              iteDate : ValidboatActionTxt.scriptData.actionTs,
              action : {type : 'order', action : userAction.heading}
            }]
          : []),
        ...((prog.order.length )
          ? [{
              raceId : raceId,
              legNum : legNum,
              userId : userId,
              serverTs : ValidboatActionTxt.scriptData.serverTs,
              iteDate : ValidboatActionTxt.scriptData.actionTs,
              action : {type : 'prog', action : prog.order}
            }]
          : []),
        ...((prog.wp.length )
          ? [{
              raceId : raceId,
              legNum : legNum,
              userId : userId,
              serverTs : ValidboatActionTxt.scriptData.serverTs,
              iteDate : ValidboatActionTxt.scriptData.actionTs,
              action : {type : 'wp', action : prog.wp}
            }]
          : []),
      ],
      ...(('sail' in userAction || 'heading' in userAction
        || prog.order.length || prog.wp.length ) && {
          internal: [
            {
              id: "legPlayersOrderUpdate",
              ts: Date.now(),
            }  
          ],
        }),

    }];
//todo upate playerinfos and fleetInfos avec info userAction
    processDBOperations(dbOpe);   
     return true;
  })
  .catch(error => {
      if(cfg.debugIngesterErr) console.error('boatAction Validation Error :', error);
      return false;
  });

}


export async function ingestGhostTrack(request, response) {

  // ✅ Validation synchrone de la requête
  const req = ghostTrackRequestDataSchema.validateSync(request, {
    stripUnknown: true
  });

  ghostTrackResponseSchema.validate(response, { stripUnknown: true })
  .then(validGhostTracks => {
    
    const raceId = req?.race_id;
    const legNum = req?.leg_num;
    if(!raceId || !legNum) return;

    const leaderName = validGhostTracks?.scriptData?.leaderName;
    const leaderId = validGhostTracks?.scriptData?.leaderId;
    const leaderTrack = validGhostTracks?.scriptData?.leaderTrack;
    
    const ghostPlayerId = req?.playerId;
    const ghostPlayerTrack =
      validGhostTracks?.scriptData?.myTrack?.length > 0
        ? validGhostTracks.scriptData.myTrack
        : null;

    const now = Date.now();

    const playersTracks = [
      ...(leaderId && leaderTrack ? [{
        raceId,
        legNum,
        userId: leaderId,
        type: "leader",
        track: leaderTrack,
      }] : []),

      ...(ghostPlayerTrack ? [{
        raceId,
        legNum,
        userId: ghostPlayerId,
        type: "ghost",
        track: ghostPlayerTrack,
      }] : []),
    ];

    const players = leaderId && leaderTrack ? [{
      id: leaderId,
      name: leaderName,
      timestamp: now,
    }] : [];

    const internal = (playersTracks.length > 0) ? [
      { id: "playersTracksUpdate", ts: now },
      ...(ghostPlayerTrack ? [{ id: "playersUpdate", ts: now }] : []),
    ] : [];

    const dbOpe = [
      {
        type: "putOrUpdate",
        ...(players.length ? { players } : {}),
        ...(playersTracks.length ? { playersTracks } : {}),
        ...(internal.length ? { internal } : {}),
      },
    ];


    processDBOperations(dbOpe);
    return true;
  })
  .catch(error => {
      if(cfg.debugIngesterErr) console.error('ghostTrack validation Error :', error);
      return false;
  });

}