import * as yup from 'yup';

export const getRaceDataResponseSchema = yup.object({
  scriptData: yup.object({
    extendsData: yup.object({
      boatPolar: polarSchema.notRequired(),
    }),
  }),
});
