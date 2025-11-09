import * as yup from 'yup';

export const userConsumablesSchema = yup.object({
  scriptData: yup.object({
    rc: yup.string().oneOf(["ok"]).required(),
    userConsumables: yup.array(
      yup.object({
        consumableId: yup.string().required(),
        quantity: yup.number().required(),
        lastUsedDate: yup.string().required().notRequired(),
      }),
    ),
  }),
});
