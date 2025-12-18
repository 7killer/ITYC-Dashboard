import * as Yup from 'yup';
import {latlonSchema} from './datasModel.js';
import {legSchema} from './getEndLegPrep.js';


export const getBoatInfosRequestDataSchema = Yup.object({
  infos: Yup.string().required(),
  leg_num: Yup.number().required(),
  race_id: Yup.number().required(),
  user_id: Yup.string().required(),
});

export const getBoatInfosResponseSchema = Yup.object({
  res: Yup.object({
    ba: Yup.mixed().notRequired().nullable(),
    bs: Yup.mixed()
      .notRequired()
      .transform((value, originalValue) => {
        if (originalValue == null) return undefined;
        try {
          return getBoatInfosBoatStateSchema.validateSync(originalValue, { stripUnknown: true });
        } catch (e) {
          throw new Yup.ValidationError(e.errors, originalValue, 'res.bs');
        }
      }),
    engine: Yup.mixed()
    .required()
    .transform((value, originalValue) => {
      if (originalValue == null) return undefined;
      try {
        return getBoatInfosBoatEngineSchema.validateSync(originalValue, { stripUnknown: true });
      } catch (e) {
        throw new Yup.ValidationError(e.errors, originalValue, 'res.engine');
      }
    }),
    leg: Yup.mixed().notRequired()
    .transform((value, originalValue) => {
      if (originalValue == null) return undefined;
      try {
        return legSchema.validateSync(originalValue, { stripUnknown: true });
      } catch (e) {
        throw new Yup.ValidationError(e.errors, originalValue, 'res.leg');
      }
    }),
    track: Yup.mixed().notRequired()
    .transform((value, originalValue) => {
      if (originalValue == null) return undefined;
      try {
        return getBoatInfosBoatTrackSchema.validateSync(originalValue, { stripUnknown: true });
      } catch (e) {
        throw new Yup.ValidationError(e.errors, originalValue, 'res.leg');
      }
    }),
  }),
});

export const getBoatInfosBoatStateSchema = Yup.object({
  _id: Yup.object({
    user_id: Yup.string().required(),
    race_id: Yup.number().required(),
    leg_num: Yup.number().required()
  }).required(),
  displayName: Yup.string().required(),
  distanceFromStart: Yup.number().notRequired().nullable(),
  distanceToEnd: Yup.number().notRequired().nullable(),
  gateGroupCounters: Yup.array(Yup.number().required()).notRequired().nullable(),
  hasPermanentAutoSails: Yup.boolean().notRequired().nullable(),
  heading: Yup.number().required(),
  lastCalcDate: Yup.number().notRequired().nullable(),
  legStartDate: Yup.number().notRequired().nullable(),
  pos: latlonSchema.required(),
  rank: Yup.number().notRequired().nullable(),
  sail: Yup.number().required(),
  isRegulated: Yup.boolean().notRequired().nullable(),
  speed: Yup.number().required(),
  stamina: Yup.number().notRequired().nullable(),
  startDate: Yup.number().notRequired().nullable(),
  state: Yup.string().required(),
  tsLastAction: Yup.number().notRequired().nullable(),
  tsEndOfAutoSail: Yup.number().notRequired().nullable(),
  tsEndOfSailChange: Yup.number().notRequired().nullable(),
  tsEndOfGybe: Yup.number().notRequired().nullable(),
  tsEndOfTack: Yup.number().notRequired().nullable(),
  twa: Yup.number().notRequired().nullable(),
  twaAuto: Yup.number().notRequired().nullable(),
  twd: Yup.number().notRequired().nullable(),
  tws: Yup.number().notRequired().nullable(),
 // type: Yup.string().required(),
  aground: Yup.boolean().notRequired().nullable(),
  badSail: Yup.boolean().notRequired().nullable(),
  isFollowed : Yup.boolean().notRequired().nullable(),
  followed : Yup.boolean().notRequired().nullable(),
  team :  Yup.boolean().notRequired().nullable(),
  fullOptions  : Yup.boolean().notRequired().nullable(),
  options: Yup.array(Yup.string().required()).notRequired().nullable(),
  branding : Yup.object({
    name: Yup.string().notRequired().nullable()
  }).notRequired().nullable(),
  waypoints:Yup.array().of(latlonSchema).notRequired(),
  nextWpIdx: Yup.number().notRequired().nullable(),
  lastWpIdx: Yup.number().notRequired().nullable(),

  stats: Yup
    .object({
      staminaMax: Yup.number().notRequired().nullable(),
      staminaTemp: Yup
        .array(
          Yup.object({
            exp: Yup.number().required(),
            value: Yup.number().required(),
          }),
        )
        .notRequired()
        .nullable(),
      staminaMaxEffects: Yup
        .array(
          Yup.object({
            exp: Yup.number().required(),
            value: Yup.number().required(),
          }),
        )
        .notRequired()
        .nullable(),
    })
    .notRequired()
    .nullable(),
});

export const getBoatInfosBoatEngineSchema = Yup.object({
  lastCalc: Yup.number().required(),
  lastFineWindUpdate: Yup.number().required(),
  lastWindUpdate: Yup.number().required(),
  nextCalc: Yup.number().required(),
});

export const getBoatInfosBoatTrackSchema = Yup.object({
  track: Yup.array(
    Yup.object({
      lat: Yup.number().required(),
      lon: Yup.number().required(),
      ts: Yup.number().required(),
      tag: Yup.string().required(),
    }),
  ),
});
