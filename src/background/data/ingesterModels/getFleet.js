import * as Yup from 'yup';
import {latlonSchema} from './datasModel.js';


export const getFleetRequestDataSchema = Yup.object({
  filter: Yup.string().required(),
  leg_num: Yup.number().required(),
  race_id: Yup.number().required(),
  user_id: Yup.string().required(),
  vip: Yup.boolean().required(),
  followed: Yup.array(Yup.string().required()).nullable(),
  teamMembers: Yup.array(Yup.string().required()).nullable(),
});

export const getFleetResponseSchema = Yup.object({
  res: Yup.array(
    Yup.object({
      userId: Yup.string().required(),
      displayName: Yup.string().notRequired(),
      type: Yup.string().required(),
      lastCalcDate: Yup.number().notRequired(),
      pos: latlonSchema.required(),
      heading: Yup.number().required(),
      speed: Yup.number().required(),
      state: Yup.string().required(),
      tws: Yup.number().notRequired().nullable(),
      twa: Yup.number().notRequired().nullable(),
      twd: Yup.number().notRequired().nullable(),
      sail: Yup.number().notRequired().nullable(),
      rank: Yup.number().notRequired().nullable(),
      state: Yup.string().required(),
      isFollowed : Yup.boolean().notRequired().nullable(),
      followed : Yup.boolean().notRequired().nullable(),
      team : Yup.boolean().notRequired().nullable(),
      type : Yup.string().notRequired()

    }),
  ),
});
