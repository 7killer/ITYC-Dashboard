import * as Yup from 'Yup';

export const polarSchema = Yup.object({
  _id: Yup.number().required(),
  label: Yup.string().required(),
  globalSpeedRatio: Yup.number().required(),
  iceSpeedRatio: Yup.number().required(),
  autoSailChangeTolerance: Yup.number().required(),
  badSailTolerance: Yup.number().required(),
  maxSpeed: Yup.number().required(),
  weight:Yup.number().optional(),
  foil: Yup.object({
    speedRatio: Yup.number().required(),
    twaMin: Yup.number().required(),
    twaMax: Yup.number().required(),
    twaMerge: Yup.number().required(),
    twsMin: Yup.number().required(),
    twsMax: Yup.number().required(),
    twsMerge: Yup.number().required(),
  }),
  hull: Yup.object({
    speedRatio: Yup.number().required(),
  }),
  winch: Yup.object({
    tack: Yup.object({
      std: Yup.object({
        lw: Yup.object({
          ratio: Yup.number().required(),
          timer: Yup.number().required(),
        }),
        hw: Yup.object({
          ratio: Yup.number().required(),
          timer: Yup.number().required(),
        }),
      }),
      pro: Yup.object({
        lw: Yup.object({
          ratio: Yup.number().required(),
          timer: Yup.number().required(),
        }),
        hw: Yup.object({
          ratio: Yup.number().required(),
          timer: Yup.number().required(),
        }),
      }),
    }),
    gybe: Yup.object({
      std: Yup.object({
        lw: Yup.object({
          ratio: Yup.number().required(),
          timer: Yup.number().required(),
        }),
        hw: Yup.object({
          ratio: Yup.number().required(),
          timer: Yup.number().required(),
        }),
      }),
      pro: Yup.object({
        lw: Yup.object({
          ratio: Yup.number().required(),
          timer: Yup.number().required(),
        }),
        hw: Yup.object({
          ratio: Yup.number().required(),
          timer: Yup.number().required(),
        }),
      }),
    }),
    sailChange: Yup.object({
      std: Yup.object({
        lw: Yup.object({
          ratio: Yup.number().required(),
          timer: Yup.number().required(),
        }),
        hw: Yup.object({
          ratio: Yup.number().required(),
          timer: Yup.number().required(),
        }),
      }),
      pro: Yup.object({
        lw: Yup.object({
          ratio: Yup.number().required(),
          timer: Yup.number().required(),
        }),
        hw: Yup.object({
          ratio: Yup.number().required(),
          timer: Yup.number().required(),
        }),
      }),
    }),
    lws: Yup.number().required(),
    hws: Yup.number().required(),
  }),
  tws: Yup.array(Yup.number().required()),
  twa: Yup.array(Yup.number().required()),
  sail: Yup.array(
    Yup.object({
      id: Yup.number().required(),
      name: Yup.string().required(),
      speed: Yup.array(Yup.array(Yup.number().required())),
    }),
  ),
  _updatedAt: Yup.string().required(),
});

export const getPolarResponseSchema = Yup.object({
  scriptData: Yup.object({
    polar: polarSchema,
  }),
});
