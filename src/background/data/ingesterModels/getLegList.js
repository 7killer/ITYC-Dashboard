import * as Yup from 'yup';

const locationSchema = Yup.object({
  date: Yup.number().required(),
  heading: Yup.number().optional(),
  lat: Yup.number().required(),
  lon: Yup.number().required(),
  name: Yup.string().required(),
  countryFlag: Yup.string().required(),
  radius: Yup.number().optional()
});

export const boatStatsSchema = Yup.object ({
  weight:Yup.number().required()
});
const raceIdSchema = Yup.object({
  raceId: Yup.number().required(),
  legNum: Yup.number().required(),

});
export const raceSchema = Yup.object({
  raceId: Yup.number().required(),
  legNum: Yup.number().required(),
  limitedAccess: Yup.boolean().optional(),
  legName: Yup.string().required(),
  estimatedTime: Yup.number().required(),
  estimatedLength: Yup.number().required(),
  status: Yup.string().oneOf(['opened', 'started', 'finished', 'ended']).required(),
  startDate: Yup.number().required(),
  start: locationSchema.required(),
  end: locationSchema.required(),
  raceName: Yup.string().required(),
  raceType: Yup.string().required(),
  boat: Yup.object({
    polar_id: Yup.number().required(),
    stats: boatStatsSchema.required()
  }).required(),
  vsrRank: Yup.number().optional(),
  priceLevel: Yup.number().optional(),
  freeCredits: Yup.number().optional(),
  adStartCredits: Yup.number().optional(),
  pilotBoatCredits: Yup.number().optional(),
  lastUpdate: Yup.number().required(),
  skinDiscount: Yup.number().optional(),
  fineWinds: Yup.boolean().optional(),
  nbTotalSkippers: Yup.number().required(),
  boatsAtSea: Yup.number().required(),
  arrived: Yup.number().required()
});

const scriptDataSchema = Yup.object({
  boatsAtSea: Yup.number().required(),
  res: Yup.array().of(raceSchema).required()
});

export const legListDataModel = Yup.object({
  scriptData: scriptDataSchema.required(),
  '@class': Yup.string().required(),
  requestId: Yup.string().required()
});


