import * as Yup from 'yup';

const numberRecord = Yup.object()
  .test('is-number-record', 'must be a record<number>', (val) =>
    val != null &&
    typeof val === 'object' &&
    !Array.isArray(val) &&
    Object.values(val).every((v) => typeof v === 'number')
  );

export const gameSettingsSchema = Yup.object({
  scriptData: Yup.object({
    rc: Yup.string().oneOf(['ok']).required(),
    settings: Yup.object({
      lastUpdateTS: Yup.number().required(),

      stamina: Yup.object({
        recovery: Yup.object({
          points: Yup.number().required(),
          loWind: Yup.number().required(),
          hiWind: Yup.number().required(),
          loTime: Yup.number().required(),
          hiTime: Yup.number().required(),
        }).required(),

        tiredness: Yup.array()
          .of(Yup.number().required())
          .length(2)
          .required(),

        consumption: Yup.object({
          points: Yup.object({
            tack: Yup.number().required(),
            gybe: Yup.number().required(),
            sail: Yup.number().required(),
          }).required(),

          // Dicts "clé numérique (stringifiée) -> number"
          winds: numberRecord.required(),
          boats: numberRecord.required(),
        }).required(),

        impact: numberRecord.required(),
      }).required(),

      inRaceConsumablesShop: Yup.array()
        .of(
          Yup.object({
            id: Yup.string().required(),
            name: Yup.string().required(),
          }).required()
        )
        .required(),
    }).required(),
  }).required(),
});


