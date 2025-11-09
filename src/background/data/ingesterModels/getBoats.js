import * as yup from 'yup';

export const getBoatsSchema = yup.object({
  scriptData: yup.object({
    rc: yup.string().oneOf(["ok"]).required(),
    res: yup.array(
      yup.object({
        id: yup.string().required(),
        polar_id: yup.number().required(),
        name: yup.string().required().notRequired(),
        label: yup.string().required().notRequired(),
      }),
    ),
  }),
});
