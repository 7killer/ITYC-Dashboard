import * as Yup from 'yup';

const vsrRankTeamSchema = Yup.object({
  id: Yup.string().required(),
  name: Yup.string().required(),
  badgeId: Yup.string().notRequired().nullable(),
});

const vsrRankPlayerSchema = Yup.object({
  points: Yup.number().required(),
  vsrRank: Yup.number().required(),
  userId: Yup.string().required(),
  userName: Yup.string().required(),
  team: vsrRankTeamSchema.notRequired().nullable().default(undefined),
});

const vsrRankTeamRankingSchema = Yup.object({
  _id: Yup.string().required(),
  points: Yup.number().required(),
  vsrRank: Yup.number().required(),
  teamName: Yup.string().notRequired().nullable(),
});

export const vsrRankResponseSchema = Yup.object({
  scriptData: Yup.object({
    dataVSR: Yup.array(vsrRankPlayerSchema).required(),
  }).required(),
});

export const vsrTeamRankResponseSchema = Yup.object({
  scriptData: Yup.object({
    data: Yup.array(vsrRankTeamRankingSchema).required(),
  }).required(),
});
