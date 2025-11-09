import * as yup from 'yup';

export const getPlayersResponseSchema = yup.object({
  scriptData: yup.object({
    res: yup.array(
      yup.object({
        id: yup.string().required(),
        displayName: yup.string().required(),
        team: z
          .object({
            id: yup.string().required(),
            name: yup.string().required(),
            coach: yup.boolean().required(),
          })
          .notRequired()
          .nullable(),
        vsrRank: yup.number().required().notRequired().nullable(),
      }),
    ),
  }),
});
