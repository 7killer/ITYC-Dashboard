import * as Yup from 'yup';

const getLegRankPlayerSchema = Yup.object({
  _id: Yup.string().required(),
  distance: Yup.number().required(),
  time: Yup.number().required(),
  displayName: Yup.string().required(),
  country: Yup.string().notRequired().nullable(),
  rank: Yup.number().required(),
});

const getLegRankMeSchema = getLegRankPlayerSchema.shape({
  distance: Yup.number().notRequired().nullable(),
  time: Yup.number().notRequired().nullable(),
  rank: Yup.number().notRequired().nullable(),
}).default(undefined);

const getLegRankPaginationSchema = Yup.object({
  nextPage: Yup.number().notRequired().nullable(),
  hasNextPage: Yup.boolean().required(),
  hasPreviousPage: Yup.boolean().required(),
  documentsCount: Yup.number().required(),
  pagesCount: Yup.number().required(),
  pageNumber: Yup.number().required(),
  pageSize: Yup.number().required(),
});

export const getLegRankRequestDataSchema = Yup.object({
  race_id: Yup.number().required(),
  leg_num: Yup.number().required(),
  user_id: Yup.string().required(),
  partition: Yup.number().required(),
  value: Yup.string().notRequired().nullable(),
  members: Yup.array(Yup.string().required()).required(),
  friends: Yup.array(Yup.string().required()).required(),
  page_number: Yup.number().required(),
  page_size: Yup.number().required(),
  request_type: Yup.number().required(),
});

export const getLegRankResponseSchema = Yup.object({
  rc: Yup.string().required(),
  res: Yup.object({
    rank: Yup.array(getLegRankPlayerSchema).required(),
    me: getLegRankMeSchema.notRequired().nullable(),
    pagination: getLegRankPaginationSchema.required(),
    request_type: Yup.number().required(),
  }).required(),
});
