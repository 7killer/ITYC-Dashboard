import * as Yup from 'yup';


export const ghostTrackRequestDataSchema = Yup.object({
  race_id: Yup.number().required(),
  leg_num: Yup.number().required(),
  playerId: Yup.string().required(),
});


export const ghostTrackResponseSchema = Yup.object({
  scriptData: Yup.object({
    leaderName: Yup.string().notRequired(),
    leaderId : Yup.string().notRequired(),
    leaderTrack : Yup.array(
        Yup.object({
          lat: Yup.number().required(),
          lon: Yup.number().required(),
          ts: Yup.number().required(),
          tag : Yup.string().required()
        }),
    ).notRequired(),
    myTrack : Yup.array(
        Yup.object({
          lat: Yup.number().required(),
          lon: Yup.number().required(),
          ts: Yup.number().required(),
          tag : Yup.string().required()
        }),
    ).notRequired(),
  }).required()
});