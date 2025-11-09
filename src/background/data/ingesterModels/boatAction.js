import * as Yup from 'yup';

// export const mapAddBoatActionsToProg = ()

export const addBoatActionRequestData = Yup.object({
  race_id: Yup.number().required(),
  leg_num: Yup.number().required(),
  ts: Yup.number().required(),
  playerId: Yup.string().required(),
});

export const boatActionStartSchema = Yup.object({
  _id: Yup.object({
    user_id: Yup.string().required(),
    action: Yup.string().oneOf(["start"]).required(),
    ts: Yup.number().required(),
    race_id: Yup.number().required(),
    leg_num: Yup.number().required(),
  }),
});

export const boatActionHeadingSchema = Yup.object({
  autoTwa: Yup.boolean().required(),
  deg: Yup.number().required(),
  isProg: Yup.boolean().required(),
  _id: Yup.object({
    user_id: Yup.string().required(),
    action: Yup.string().oneOf(["heading"]).required(),
    ts: Yup.number().required(),
    race_id: Yup.number().required(),
    leg_num: Yup.number().required(),
  }),
});

export const boatActionSailSchema = Yup.object({
  qty: Yup.number().required().notRequired(),
  sail_id: Yup.number().required(),
  _id: Yup.object({
    user_id: Yup.string().required(),
    action: Yup.string().oneOf(["sail"]).required(),
    ts: Yup.number().required(),
    race_id: Yup.number().required(),
    leg_num: Yup.number().required(),
  }),
});

export const boatActionWpSchema = Yup.object({
  pos: Yup.array(
    Yup.object({
      lat: Yup.number().required(),
      lon: Yup.number().required(),
      idx: Yup.number().required(),
    }),
  ),
  _id: Yup.object({
    user_id: Yup.string().required(),
    race_id: Yup.number().required(),
    leg_num: Yup.number().required(),
    ts: Yup.number().required(),
    action: Yup.string().oneOf(["wp"]).required(),
  }),
});

const boatActionSchema = Yup.mixed().test(
  'is-valid-action',
  'Invalid boat action format',
  function (value) {
    const schemas = [
      boatActionHeadingSchema,
      boatActionSailSchema,
      boatActionWpSchema,
      boatActionStartSchema,
    ];

    for (const schema of schemas) {
      try {
        schema.validateSync(value, { strict: true });
        return true; // dès qu'un schéma valide : succès
      } catch (_) {
        // ignore
      }
    }

    return this.createError({ message: 'Aucune des formes attendues pour boatAction n’est valide' });
  }
);

// 👇 Tableau d’actions
export const boatActionsSchema = Yup.array().of(boatActionSchema);

export const boatActionResponseData = Yup.object({
  scriptData: Yup.object({
    actionTs: Yup.number().required(),
    serverTs: Yup.number().required(),
    boatActions: Yup.array(boatActionSchema),
  }),
});
