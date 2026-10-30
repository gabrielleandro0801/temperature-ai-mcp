import * as z from 'zod/v4';

export const coordinatesSchema = z.strictObject({
  latitude: z.number().min(-90, 'Latitude deve ser >= -90.').max(90, 'Latitude deve ser <= 90.'),
  longitude: z.number().min(-180, 'Longitude deve ser >= -180.').max(180, 'Longitude deve ser <= 180.'),
});

const celsiusMeasurement = z.strictObject({
  value: z.number(),
  unit: z.literal('\u00b0C'),
});

export const currentWeatherSchema = z.strictObject({
  temperature: celsiusMeasurement,
  apparentTemperature: celsiusMeasurement,
  isRaining: z.boolean(),
  rain: z.strictObject({ value: z.number().min(0), unit: z.literal('mm') }),
  relativeHumidity: z.strictObject({ value: z.number().min(0).max(100), unit: z.literal('%') }),
  isDay: z.boolean(),
  weatherCode: z.number().int().min(0).max(99),
});

export type Coordinates = z.infer<typeof coordinatesSchema>;
export type CurrentWeather = z.infer<typeof currentWeatherSchema>;