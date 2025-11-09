import * as Yup from 'yup';

export const latlonSchema = Yup.object({
  lat: Yup.number().required(),
  lon: Yup.number().required()
});