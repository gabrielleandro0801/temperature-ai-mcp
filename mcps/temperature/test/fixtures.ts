import { WeatherApiResponse } from '@openmeteo/sdk/weather-api-response.js';
import { VariablesWithTime } from '@openmeteo/sdk/variables-with-time.js';
import { VariableWithValues } from '@openmeteo/sdk/variable-with-values.js';
import { Unit } from '@openmeteo/sdk/unit.js';
import { Variable } from '@openmeteo/sdk/variable.js';
import type { CurrentWeather } from '../src/weather/schemas.js';

export const coordinates = { latitude: -23.55, longitude: -46.63 };

export function weatherResponse(values = [25.4, 27.1, 0, 65, 1, 0]) {
  const completeValues = values.length === 4 ? [...values, 1, 0] : values;
  const metadata = [
    [Variable.temperature, Unit.celsius],
    [Variable.apparent_temperature, Unit.celsius],
    [Variable.rain, Unit.millimetre],
    [Variable.relative_humidity, Unit.percentage],
    [Variable.is_day, Unit.dimensionless_integer],
    [Variable.weather_code, Unit.wmo_code],
  ] as const;
  const variables = completeValues.map((value, index) => {
    const [variable = Variable.undefined, unit = Unit.undefined] = metadata[index] ?? [];
    return Object.assign(new VariableWithValues(), {
      value: () => value,
      variable: () => variable,
      unit: () => unit,
    });
  });
  const current = Object.assign(new VariablesWithTime(), {
    variables: (index: number) => variables[index] ?? null,
    variablesLength: () => variables.length,
  });
  const response = Object.assign(new WeatherApiResponse(), { current: () => current });
  return { response, current, variables };
}

export const expectedWeather: CurrentWeather = {
  temperature: { value: 25.4, unit: '\u00b0C' },
  apparentTemperature: { value: 27.1, unit: '\u00b0C' },
  isRaining: false,
  rain: { value: 0, unit: 'mm' },
  relativeHumidity: { value: 65, unit: '%' },
  isDay: true,
  weatherCode: 0,
};