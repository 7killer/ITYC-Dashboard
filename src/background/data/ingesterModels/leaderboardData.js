import * as Yup from 'yup';

export const leaderboardDataRequestSchema = Yup.object({
  "@class": Yup.string().oneOf(["LeaderboardDataRequest"]).required(),
  leaderboardShortCode: Yup.string().required(),
  entryCount: Yup.number().required(),
  includeFirst: Yup.number().required(),
  includeLast: Yup.number().required(),
  offset: Yup.number().required(),
  requestId: Yup.string().required(),
  authToken: Yup.string().notRequired(),
  playerId: Yup.string().required(),
});

const leaderboardEntrySchema = Yup.object({
  city: Yup.string().notRequired().nullable(),
  country: Yup.string().notRequired().nullable(),
  externalIds: Yup.object().notRequired().nullable(),
  rank: Yup.number().required(),
  when: Yup.string().notRequired().nullable(),
  "LAST-leg": Yup.string().notRequired().nullable(),
  "LAST-score": Yup.number().required(),
  "SUPPLEMENTAL-arrived": Yup.number().notRequired().nullable(),
  "SUPPLEMENTAL-racing": Yup.number().notRequired().nullable(),
  "SUPPLEMENTAL-scoring": Yup.number().notRequired().nullable(),
  "SUPPLEMENTAL-teamsize": Yup.number().notRequired().nullable(),
  teamId: Yup.string().required(),
  teamName: Yup.string().required(),
});

export const leaderboardDataResponseSchema = Yup.object({
  data: Yup.array(leaderboardEntrySchema).required(),
  first: Yup.array(leaderboardEntrySchema).notRequired().default([]),
  last: Yup.array(leaderboardEntrySchema).notRequired().default([]),
  leaderboardShortCode: Yup.string().required(),
  "@class": Yup.string().notRequired(),
  requestId: Yup.string().notRequired(),
  traceId: Yup.string().notRequired(),
});
