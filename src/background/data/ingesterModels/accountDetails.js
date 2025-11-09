import * as Yup from 'yup';


export const accountDetailsDataModel = Yup.object({
  displayName: Yup.string().required(),
  userId: Yup.string().required(),
  currency1: Yup.number().required(),
  scriptData: Yup.object({
    isGuest: Yup.boolean().required(),
    isVIP: Yup.boolean().required(), 
    userSettings : Yup.object({
      noAds: Yup.boolean().required()
    }).required(),
    currentLegs: Yup
      .array().of(
        Yup.object({
          raceId: Yup.number().required(),
          legNum: Yup.number().required(),
        }),
      )
      .nullable()
      .notRequired(),
    team: Yup
      .object({
        coach: Yup.boolean().notRequired().nullable(),
        name: Yup.string().notRequired().nullable(),
        id: Yup.string().notRequired().nullable(),
      })
      .nullable()
      .notRequired(),
    vsr2: Yup.object({
      rank: Yup.number().required().notRequired().nullable(),
    }),
  }),
});
