
import { accountDetailsDataModel } from './ingesterModels/accountDetails.js';
import { legListDataModel ,raceSchema} from './ingesterModels/getLegList.js';
import { endLegPrepDataModel } from './ingesterModels/getEndLegPrep.js';
import {processDBOperations,getData, deleteByRaceLegPartition, deleteByType} from '../../common/dbOpes.js';
import {getBoatInfosRequestDataSchema,
        getBoatInfosResponseSchema,
        getBoatInfosBoatStateSchema,
        getBoatInfosBoatEngineSchema,
        getBoatInfosBoatTrackSchema} from './ingesterModels/getBoatInfos.js';
import {gameSettingsSchema } from './ingesterModels/getGameSettings.js'
import {boatActionResponseData } from './ingesterModels/boatAction.js'

/* addBoatActionResponseData */ 
import { getFleetRequestDataSchema, getFleetResponseSchema } from './ingesterModels/getFleet.js';
import { getLegRankResponseSchema, getLegRankRequestDataSchema } from './ingesterModels/getLegRank.js';
import { vsrRankResponseSchema, vsrTeamRankResponseSchema } from './ingesterModels/vsrRank.js';
import { leaderboardDataRequestSchema, leaderboardDataResponseSchema } from './ingesterModels/leaderboardData.js';


import { polarSchema} from './ingesterModels/polar.js';
import { ghostTrackRequestDataSchema, ghostTrackResponseSchema } from './ingesterModels/getGhostTrack.js';


import cfg from '@/config.json';

export async function ingestPolars(msgBody)
{
  try {
    const polarsData = msgBody?.scriptData?.extendsData?.boatPolar;

    if(!polarsData) return;
    const polar = await polarSchema.validate(polarsData,{stripUnknow:true});
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
    await processDBOperations(dbOpe);
  } catch(error) {
      if(cfg.debugIngesterErr) console.error('Account Validation Error :', error);
  }
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
            ...(l.boat?.polar_id?{polar_id: l.boat.polar_id}: {}),
            ...(l.boat?.name?{boatName: l.boat.name}: {}),
            pilotBoatCredits: l.pilotBoatCredits,
            priceLevel: l.priceLevel,
            freeCredits: l.freeCredits,
            lastUpdate: l.lastUpdate,
            optionPrices: l.optionPrices,
            checkpoints: l.checkpoints,
            ice_limits: l.ice_limits,
            fineWinds: l.fineWinds,
            course: l.course,
          ...(l.restrictedZones?.length ? { restrictedZones: l.restrictedZones } : {})
          },
        ],
        ...((l.boat?.stats?.weight && l.boat?.polar_id) && {
          polars: [
            {
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
            id : bs._id.user_id,
            name : bs.displayName,
            timestamp: Date.now()
          }      
        ],
      });
      
    }
    if(boatInfos.res?.bs) {
      const bs = boatInfos.res.bs;

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
              ...(bs.isRegulated ? { isRegulated: bs.isRegulated} : {}),
              speed: bs.speed,
              stamina: bs.stamina,
              startDate: bs.startDate,
              state: bs.state,
              ...(bs.tsEndOfAutoSail ? { tsEndOfAutoSail: bs.tsEndOfAutoSail} : {}),
              ...(bs.tsEndOfSailChange ? { tsEndOfSailChange: bs.tsEndOfSailChange} : {}),
              ...(bs.tsEndOfGybe ? { tsEndOfGybe: bs.tsEndOfGybe} : {}),
              ...(bs.tsEndOfTack ? { tsEndOfTack: bs.tsEndOfTack} : {}),
              twa: bs.twa,
              ...(bs.twaAuto ? { twaAuto: bs.twaAuto} : {}),
              twaAuto: bs.twaAuto ?? null,
              twd: bs.twd,
              tws: bs.tws,
              aground: bs.aground,
              ...(bs.badSail ? { badSail: bs.badSail} : {}),
              ...(bs.waypoints ? { waypoints: bs.waypoints} : {}),
              ...(bs.nextWpIdx ? { nextWpIdx: bs.nextWpIdx} : {}),
              ...(bs.lastWpIdx ? { lastWpIdx: bs.lastWpIdx} : {}),
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
              ...(bs.rank ? { rank: bs.rank} : {}),
              sail: bs.sail,
              ...(bs.isRegulated ? { isRegulated: bs.isRegulated} : {}),
              speed: bs.speed,
              state: bs.state,
              twa: bs.twa,
              ...(bs.twaAuto ? { twaAuto: bs.twaAuto} : {}),
              twd: bs.twd,
              tws: bs.tws,
              ...(bs.aground ? { aground: bs.aground } : {}),
              ...(bs.badSail ? { badSail: bs.badSail} : {}),
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
    await processDBOperations(ope);
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
export async function ingestAccountDetails(account)
{
    try {
      const validAccount = await accountDetailsDataModel.validate(account,{stripUnknow:true});
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
                          id: validAccount.scriptData.team.id, 
                          name: validAccount.scriptData.team.name
                      }
                  ]
              })
          }
      ];
      await processDBOperations(dbOpe);
      return true;
    } catch(error) {
        if(cfg.debugIngesterErr) console.error('Account Validation Error :', error);
        return false;
    }
}

export async function ingestEndLegPrep(endLegPrep)
{
  try {
    const validData = await endLegPrepDataModel.validate(endLegPrep, { stripUnknown: true,  abortEarly: false  });
    const l = validData.scriptData.leg;

    const dbOpe = [
        {
        type: "putOrUpdate",
        legList: [
            {
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
              ...(l.boat?.polar_id?{polar_id: l.boat?.polar_id}: {}),
              ...(l.boat?.name?{boatName: l.boat?.name}: {}),
              pilotBoatCredits: l.pilotBoatCredits,
              priceLevel: l.priceLevel,
              freeCredits: l.freeCredits,
              lastUpdate: l.lastUpdate,
              optionPrices: l.optionPrices,
              checkpoints: l.checkpoints,
              ice_limits: l.ice_limits,
              fineWinds: l.fineWinds,
              course: l.course,
              ...(l.restrictedZones?.length ? { restrictedZones: l.restrictedZones } : {})
            },
            {
              id: 'update',
              update: new Date().toISOString()        
            }
        ],
        ...((l.boat?.stats?.weight && l.boat?.polar_id) && {
          polars: [
              {
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

    await processDBOperations(dbOpe);
  } catch(err) {
    if(cfg.debugIngesterErr) console.error("Validation failed:", err.errors);
  }
}

export async function ingestRaceList(legListData) {
  try {
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
        const validated = raceSchema.validateSync(r, { stripUnknown: true });
        const idInfo = validated._id || {};

        legList.push({
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
          ...(validated.boat?.polar_id?{polar_id: validated.boat?.polar_id}: {}),
          ...(validated.boat?.name?{boatName: validated.boat?.name}: {}),
          start: validated.start,
          end: validated.end
        });
        if(validated.boat?.stats?.weight && validated.boat?.polar_id)
        {
          polars.push(
            {
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
      await processDBOperations(dbOpe);
    }

    if(cfg.debugIngester) console.log(`✅ ${validCount} race(s) ingérées, ❌ ${errorCount} erreur(s).`);
  } catch (err) {
    if(cfg.debugIngesterErr) console.error("❌ Erreur globale dans legListDataModel :", err.errors);
  }
}

export async function ingestLegRanks(request, response) {
  try 
  {
    const req = getLegRankRequestDataSchema.validateSync(request, {
      stripUnknown: true
    });

    const res = getLegRankResponseSchema.validateSync(response, {
      stripUnknown: true
    });

    const now = Date.now();
    const rankMap = (p) => ({
      userId: p._id,
      distance: p.distance,
      time: p.time,
      rank: p.rank
    });

    const rank = res.res.rank.map(rankMap);
    const me = res.res.me;
    if (me && !rank.some((p) => p.userId === me._id)) {
      rank.push(rankMap(me));
    }

    const legRank = [
      ...(req.page_number === 1 ? [{
        raceId: req.race_id,
        legNum: req.leg_num,
        partition: req.partition,
        type: 'info',
        pageNumber: 1,
        documentsCount: res.res.pagination.documentsCount,
        pagesCount: res.res.pagination.pagesCount
      }] : []),
      {
        raceId: req.race_id,
        legNum: req.leg_num,
        partition: req.partition,
        type: 'data',
        pageNumber: req.page_number,
        rank
      }
    ];

    const playersById = new Map(
      [...res.res.rank, ...(me ? [me] : [])].map((p) => [
        p._id,
        {
          id: p._id,
          name: p.displayName,
          timestamp: now,
        }
      ])
    );

    if (req.page_number === 1) {
      await deleteByRaceLegPartition('legRank', req.race_id, req.leg_num, req.partition);
    }

    const dbOpe = [
      {
        type: "putOrUpdate",
        legRank,
        players: Array.from(playersById.values()),
        internal: [
          { id: "legRankUpdate", ts: now },
          { id: "playersUpdate", ts: now }
        ]
      }
    ];

    await processDBOperations(dbOpe);
    if(cfg.debugIngester) console.log(`✅ Ingested leg ranks page ${req.page_number} for race ${req.race_id}, leg ${req.leg_num}, partition ${req.partition}`);

  } catch (err) {
    if(cfg.debugIngesterErr) console.error("❌ Leg ranks ingest failed:", err.errors ?? err);
    return {rstTimer: false}
  }
  return {rstTimer: false} ;
}

export async function ingestLegRankTeam(request, response) {
  try
  {
    const req = leaderboardDataRequestSchema.validateSync(request, {
      stripUnknown: true
    });

    if (!req.leaderboardShortCode.startsWith('LDB_Team_Leg')) {
      return {rstTimer: false};
    }

    const rankKey = req.leaderboardShortCode.split('.')[2];
    const [raceIdRaw, legNumRaw] = (rankKey ?? '').split('-');
    const raceId = Number(raceIdRaw);
    const legNum = Number(legNumRaw);
    if (!Number.isFinite(raceId) || !Number.isFinite(legNum)) {
      throw new Error(`Invalid leaderboardShortCode: ${req.leaderboardShortCode}`);
    }

    const res = leaderboardDataResponseSchema.validateSync(response, {
      stripUnknown: true
    });

    const now = Date.now();
    const partition = 16;
    const pageNumber = Number(req.offset) + 1;
    const rank = res.data.map((entry) => ({
      rank: entry.rank,
      teamId: entry.teamId,
      arrived: entry["SUPPLEMENTAL-arrived"],
      racing: entry["SUPPLEMENTAL-racing"],
    }));

    const legRank = [
      ...(pageNumber === 1 ? [{
        raceId,
        legNum,
        partition,
        type: 'info',
        pageNumber: 1,
        documentsCount: req.offset + res.data.length,
        pagesCount: pageNumber
      }] : []),
      {
        raceId,
        legNum,
        partition,
        type: 'data',
        pageNumber,
        rank
      }
    ];

    const teamsById = new Map(
      res.data.map((entry) => [
        entry.teamId,
        {
          id: entry.teamId,
          name: entry.teamName
        }
      ])
    );

    if (pageNumber === 1) {
      await deleteByRaceLegPartition('legRank', raceId, legNum, partition);
    }

    const dbOpe = [
      {
        type: "putOrUpdate",
        legRank,
        teams: Array.from(teamsById.values()),
        internal: [
          { id: "legRankUpdate", ts: now },
          { id: "teamsUpdate", ts: now }
        ]
      }
    ];

    await processDBOperations(dbOpe);
    if(cfg.debugIngester) console.log(`✅ Ingested team leg rank page ${pageNumber} for race ${raceId}, leg ${legNum}, partition ${partition}`);

  } catch (err) {
    if(cfg.debugIngesterErr) console.error("❌ Team leg ranks ingest failed:", err.errors ?? err);
    return {rstTimer: false}
  }
  return {rstTimer: false};
}

export async function ingestVsrRank(pageNumber, response) {
  try
  {
    const page = Number(pageNumber);
    if (!Number.isFinite(page)) {
      throw new Error(`Invalid VSR pageNumber: ${pageNumber}`);
    }
    const res = vsrRankResponseSchema.validateSync(response, {
      stripUnknown: true
    });

    const now = Date.now();
    const dataVSR = res.scriptData.dataVSR;

    const vsrRank = [
      {
        type: 'player',
        pageNumber: page,
        rank: dataVSR.map(p => ({
          userId: p.userId,
          rank: p.vsrRank,
          points: p.points,
        }))
      }
    ];

    const playersById = new Map(
      dataVSR.map(p => [
        p.userId,
        {
          id: p.userId,
          name: p.userName,
          timestamp: now,
          ...(p.team?.id ? { teamId: p.team.id } : {})
        }
      ])
    );

    const teamsById = new Map(
      dataVSR
        .filter(p => p.team?.id)
        .map(p => [
          p.team.id,
          {
            id: p.team.id,
            name: p.team.name
          }
        ])
    );

    if (page === 1) {
      await deleteByType('vsrRank', 'player');
    }

    const dbOpe = [
      {
        type: "putOrUpdate",
        vsrRank,
        players: Array.from(playersById.values()),
        ...(teamsById.size ? { teams: Array.from(teamsById.values()) } : {}),
        internal: [
          { id: "vsrRankUpdate", ts: now },
          { id: "playersUpdate", ts: now },
          ...(teamsById.size ? [{ id: "teamsUpdate", ts: now }] : [])
        ]
      }
    ];

    await processDBOperations(dbOpe);
    if(cfg.debugIngester) console.log(`✅ Ingested VSR rank page ${page}`);

  } catch (err) {
    if(cfg.debugIngesterErr) console.error("❌ VSR rank ingest failed:", err.errors ?? err);
    return {rstTimer: false}
  }
  return {rstTimer: false} ;
}

export async function ingestVsrTeamRank(pageNumber, response) {
  try
  {
    const page = Number(pageNumber);
    if (!Number.isFinite(page)) {
      throw new Error(`Invalid VSR team pageNumber: ${pageNumber}`);
    }
    const res = vsrTeamRankResponseSchema.validateSync(response, {
      stripUnknown: true
    });

    const now = Date.now();
    const data = res.scriptData.data;

    const vsrRank = [
      {
        type: 'team',
        pageNumber: page,
        rank: data.map(t => ({
          teamId: t._id,
          rank: t.vsrRank,
          points: t.points,
        }))
      }
    ];

    const teamsById = new Map(
      data.map(t => [
        t._id,
        {
          id: t._id,
          name: t.teamName,
        }
      ])
    );

    if (page === 1) {
      await deleteByType('vsrRank', 'team');
    }

    const dbOpe = [
      {
        type: "putOrUpdate",
        vsrRank,
        teams: Array.from(teamsById.values()),
        internal: [
          { id: "vsrRankUpdate", ts: now },
          { id: "teamsUpdate", ts: now }
        ]
      }
    ];

    await processDBOperations(dbOpe);
    if(cfg.debugIngester) console.log(`✅ Ingested VSR team rank page ${page}`);

  } catch (err) {
    if(cfg.debugIngesterErr) console.error("❌ VSR team rank ingest failed:", err.errors ?? err);
    return {rstTimer: false}
  }
  return {rstTimer: false} ;
}

export async function ingestFleetData(request, response) {
  let rstTimer = false;
  try 
  {
    const req = getFleetRequestDataSchema.validateSync(request, {
      stripUnknown: true
    });

    const filteredResponse = {
      ...response,
      res: (response.res || [])
        .filter(p => p.userId !== "pilotBoat")
        .map(p => ({
          ...p,
          state: p.type === "real" && p.state === null ? "racing" : p.state
        }))
    };
    const res = getFleetResponseSchema.validateSync(filteredResponse, {
      stripUnknown: true
    });

    const connectedUserInfos = await getData("players",req.user_id);
    let currentTeamId = connectedUserInfos?.teamId?connectedUserInfos.teamId:null;

    const legFleetInfos = res.res.map(p => ({    
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
      ...( p.sail ? { sail:  p.sail} : {}),
      ...( p.rank ? { rank:  p.rank} : {}),
      state : p.state,
      ...(p.isFollowed ? { isFollowed: p.isFollowed } : {}),
      ...(p.followed ? { followed: p.followed } : {}),
      ...(p.team ? { team: p.team } : {})
    }));


    const legPlayersInfos = res.res.filter(p => p.userId == req.user_id)
        .map(p => ({
            id: req.race_id+"_"+req.leg_num+"_"+p.userId+"_"+p.lastCalcDate,
          userId: p.userId,
          iteDate: p.lastCalcDate,
          raceId: req.race_id,
          legNum: req.leg_num,
          hdg: p.heading,
          speed: p.speed,
          pos: p.pos,
          twa: p.twa,
          twd: p.twd,
          tws: p.tws,
          ...(p.rank?{rank : p.rank}: {}),
          ...(p.sail?{sail : p.sail}: {}),
          state: p.state,
          ...(p.stamina?{stamina : p.stamina}: {})
    }));

    if(legPlayersInfos!= []) rstTimer = true;
/*          isRegulated: bs.isRegulated ?? null,
          startDate: bs.startDate,
          tsEndOfAutoSail: bs.tsEndOfAutoSail ?? null,
          tsEndOfSailChange: bs.tsEndOfSailChange ?? null,
          tsEndOfGybe: bs.tsEndOfGybe ?? null,
          tsEndOfTack: bs.tsEndOfTack ?? null,
          twaAuto: bs.twaAuto ?? null,
          aground: bs.aground,
          badSail: bs.badSail ?? null,
          waypoints: bs.waypoints ?? null,
          nextWpIdx: bs.nextWpIdx ?? null,
          lastWpIdx: bs.lastWpIdx ?? null,
          stats: bs.stats,
          choice : true,
          branding : bs.branding*/
    
    const players = res.res.map(p => ({
      id : p.userId,
      name : p.displayName,
      timestamp: Date.now(),
      ...(p.team &&currentTeamId?{teamId:currentTeamId}:{})
    }));
    const playersTracks = res.res.filter(p => Array.isArray(p.track) && p.track.length !== 0) 
    .map(p => ({
      raceId: req.race_id,
      legNum: req.leg_num,
      userId: p.userId,
      type: 'fleet',
      track :  p.track
    }));

    const dbOpe = [
      {
        type: "putOrUpdate",
        legFleetInfos,
        ...(playersTracks.length ? { playersTracks } : {}),
        players,
        ...(legPlayersInfos.length ? { legPlayersInfos } : {}),
        internal: [
          ...((legPlayersInfos?.length) ? [{ id: "legPlayersInfosUpdate", ts:  Date.now() }] : []),
          { id: "legFleetInfosUpdate", ts: Date.now()},
          { id: "playersUpdate", ts: Date.now()},
          ...((playersTracks?.length) ? [{ id: "playersTracksUpdate", ts:  Date.now() }] : [])
        ]
      }
    ];

    await processDBOperations(dbOpe);
    if(cfg.debugIngester) console.log(`✅ Ingested ${legFleetInfos.length} fleet players for race ${req.race_id}, leg ${req.leg_num}`);

  } catch (err) {
    if(cfg.debugIngesterErr) console.error("❌ Fleet ingest failed:", err.errors);
    return {rstTimer: false}
  }
  return {rstTimer: rstTimer} ;
}


export async function ingestGameSetting(gameSetting) {
  try {
    const validGameSetting = await gameSettingsSchema.validate(gameSetting, { stripUnknown: true });
    const stamina = validGameSetting.scriptData?.settings?.stamina;
    const dbOpe = [
      {
        type: "putOrUpdate",
        ...(stamina && {
          internal: [
            {
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

    await processDBOperations(dbOpe);
    return true;
  } catch(error) {
      if(cfg.debugIngesterErr) console.error('Account Validation Error :', error);
      return false;
  }
}

export async function ingestBoatAction(boatActionTxt)
{
  try {
  const ValidboatActionTxt = await boatActionResponseData.validate(boatActionTxt, { stripUnknown: true });
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
              type : 'sail',
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
              type : 'order',
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
              type : 'prog',
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
              type : 'wp',
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
    await processDBOperations(dbOpe);   
     return true;
  } catch(error) {
      if(cfg.debugIngesterErr) console.error('boatAction Validation Error :', error);
      return false;
  }

}


export async function ingestGhostTrack(request, response) {
  const req = ghostTrackRequestDataSchema.validateSync(request, {
    stripUnknown: true
  });

  try {
  const validGhostTracks = await ghostTrackResponseSchema.validate(response, { stripUnknown: true });
    
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


    await processDBOperations(dbOpe);
    return true;
  } catch(error) {
      if(cfg.debugIngesterErr) console.error('ghostTrack validation Error :', error);
      return false;
  }

}
