import * as yup from 'yup';

export const getTeamResponseSchema = yup.object({
  scriptData: yup.object({
    res: yup.object({
      def: yup.object({
        _id: yup.string().required(),
        name: yup.string().required(),
        desc: yup.string().required().notRequired().nullable(),
        type: yup.string().required().notRequired().nullable(),
        country: yup.string().required().nullable().notRequired(),
        // created: yup.number().required(),
        members: yup.array(
          yup.object({
            id: yup.string().required(),
            isFollowed: yup.boolean().required().notRequired().nullable(),
            isTopVSR: yup.boolean().required().notRequired().nullable(),
            isCertified: yup.boolean().required().notRequired().nullable(),
            displayName: yup.string().required(),
            country: yup.string().required().nullable().notRequired(),
            role: yup.string().required().nullable().notRequired(),
            vsrRank: yup.number().required().nullable().notRequired(),
          }),
        ),
        // banned: yup.array(yup.string().required()),
        // palmaresFirstYear: yup.number().required(),
        // palmaresLastYear: yup.number().required(),
        // ownerId: yup.string().required(),
      }),
    }),
  }),
});
