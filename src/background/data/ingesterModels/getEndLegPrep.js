import * as Yup from 'yup';
import {latlonSchema} from './datasModel.js';
import {boatStatsSchema} from './getLegList.js';



const checkpointSchema = Yup.object({
  id: Yup.number().required(),
  group: Yup.number().required(),
  name: Yup.mixed().nullable(true), // string ou number ou vide
  start: latlonSchema.required(),
  end: latlonSchema.required(),
  engine: Yup.boolean().required(),
  display: Yup.string().required(),
  ranking: Yup.boolean().required(),
  side: Yup.string().oneOf(['port', 'stbd']).required()
});


const restrictedAeraPointSchema = Yup.object({
  name: Yup.string().optional(),
  color: Yup.string().optional(),
  bbox: Yup.array(Yup.number()).optional(),
  vertices: Yup.array().of(latlonSchema).optional()
});

export const legSchema = Yup.object({
  _id: Yup.object({
    race_id: Yup.number().required(),
    num: Yup.number().required()
  }).required(),
  _updatedAt: Yup.string().required(), // ISO Date
  boat: Yup.object({
    polar_id: Yup.number().required(),
    stats: boatStatsSchema.required()
  }).required(),
  checkpoints: Yup.array().of(checkpointSchema).required(),
  course: Yup.array().of(latlonSchema).required(),
  close: Yup.object({
    date: Yup.number().required()
  }).required(),
  end: Yup.object({
    date: Yup.number().required(),
    lat: Yup.number().required(),
    lon: Yup.number().required(),
    name: Yup.string().required(),
    radius: Yup.number().required(),
    countryCode: Yup.string().required()
  }).required(),
  freeCredits: Yup.number().required(),
  ice_limits: Yup.object({
    maxLat: Yup.number().required(),
    minLat: Yup.number().required(),
    north: Yup.array().of(latlonSchema).required(),
    south: Yup.array().of(latlonSchema).required()
  }).required(),
  lastUpdate: Yup.number().required(),
  name: Yup.string().required(),
  open: Yup.object({
    date: Yup.number().required()
  }).required(),
 optionPrices: Yup.object({
    foil: Yup.number().required(),
    winch: Yup.number().required(),
    radio: Yup.number().required(),
    skin: Yup.number().required(),
    hull: Yup.number().required(),
    reach: Yup.number().required(),
    heavy: Yup.number().required(),
    light: Yup.number().required(),
    comfortLoungePug: Yup.number().required(),
    magicFurler: Yup.number().required(),
    vrtexJacket: Yup.number().required()
  }).required(),
   pilotBoatCredits: Yup.number().optional(),
  priceLevel: Yup.number().required(),
  race: Yup.object({
    name: Yup.string().required(),
    type: Yup.string().required()
  }).required(),
  start: Yup.object({
    date: Yup.number().required(),
    heading: Yup.number().required(),
    lat: Yup.number().required(),
    lon: Yup.number().required(),
    name: Yup.string().required(),
    countryCode: Yup.string().required()
  }).required(),
  status: Yup.string().required(),
  vsrLevel: Yup.number().required(),
  estimatedLength: Yup.number().required(),
  estimatedTime: Yup.number().required(),
  fineWinds: Yup.boolean().required(),
  restrictedZones: Yup.array().of(restrictedAeraPointSchema).optional()
});

export const endLegPrepDataModel = Yup.object({
  scriptData: Yup.object({
    leg: legSchema.required()
  }).required(),
  '@class': Yup.string().required(),
  requestId: Yup.string().required()
});
