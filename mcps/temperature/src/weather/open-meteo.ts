import { fetchWeatherApi } from 'openmeteo';
import { Unit } from '@openmeteo/sdk/unit.js';
import { Variable } from '@openmeteo/sdk/variable.js';
import { coordinatesSchema, currentWeatherSchema } from './schemas.js';
import type { Coordinates, CurrentWeather } from './schemas.js';

export class WeatherError extends Error {
  override readonly name = 'WeatherError';
}

const currentVariables = [
  'temperature_2m',
  'apparent_temperature',
  'rain',
  'relative_humidity_2m',
  'is_day',
  'weather_code',
] as const;

const expectedVariables = [
  { variable: Variable.temperature, unit: Unit.celsius },
  { variable: Variable.apparent_temperature, unit: Unit.celsius },
  { variable: Variable.rain, unit: Unit.millimetre },
  { variable: Variable.relative_humidity, unit: Unit.percentage },
  { variable: Variable.is_day, unit: Unit.dimensionless_integer },
  { variable: Variable.weather_code, unit: Unit.wmo_code },
] as const;

export function createWeatherService(fetchWeather: typeof fetchWeatherApi = fetchWeatherApi) {
  return async (input: Coordinates): Promise<CurrentWeather> => {
    const coordinates = coordinatesSchema.safeParse(input);
    if (!coordinates.success) {
      throw new WeatherError('Coordenadas invalidas: latitude deve estar entre -90 e 90 e longitude entre -180 e 180; ambas devem ser numeros finitos.');
    }

    let responses: Awaited<ReturnType<typeof fetchWeatherApi>>;
    const signal = AbortSignal.timeout(10_000);
    try {
      responses = await fetchWeather(
        'https://api.open-meteo.com/v1/forecast',
        {
          ...coordinates.data,
          current: currentVariables.join(','),
          timezone: 'auto',
          temperature_unit: 'celsius',
          precipitation_unit: 'mm',
        },
        2,
        0.2,
        1,
        { signal },
      );
    } catch (error) {
      const message = signal.aborted
        ? 'Tempo limite de 10 segundos excedido ao consultar a Open-Meteo.'
        : 'Nao foi possivel consultar a Open-Meteo. Verifique a conexao e tente novamente; a API pode estar indisponivel ou com limite de requisicoes atingido.';
      throw new WeatherError(message, { cause: error });
    }

    try {
      const response = responses[0];
      const current = response?.current();
      if (responses.length !== 1 || !current || current.variablesLength() !== currentVariables.length) {
        throw new Error('Bloco current ausente ou incompleto.');
      }

      const values = currentVariables.map((variableName, index) => {
        const variable = current.variables(index);
        const expected = expectedVariables[index];
        if (!variable || !expected || variable.variable() !== expected.variable || variable.unit() !== expected.unit) {
          throw new Error(`Variavel ou unidade inesperada: ${variableName}.`);
        }
        const value = variable?.value();
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          throw new Error(`Variavel ausente ou invalida: ${variableName}.`);
        }
        return value;
      });

      const [temperature, apparentTemperature, rain, relativeHumidity, isDay, weatherCode] = values;
      if ((isDay !== 0 && isDay !== 1) || typeof weatherCode !== 'number' || !Number.isInteger(weatherCode) || weatherCode < 0 || weatherCode > 99) {
        throw new Error('Variaveis is_day ou weather_code invalidas.');
      }
      return currentWeatherSchema.parse({
        temperature: { value: temperature, unit: '\u00b0C' },
        apparentTemperature: { value: apparentTemperature, unit: '\u00b0C' },
        isRaining: rain !== undefined && rain > 0,
        rain: { value: rain, unit: 'mm' },
        relativeHumidity: { value: relativeHumidity, unit: '%' },
        isDay: isDay === 1,
        weatherCode,
      });
    } catch (error) {
      throw new WeatherError('A Open-Meteo retornou dados meteorologicos invalidos ou incompletos. Tente novamente mais tarde.', { cause: error });
    }
  };
}

export const getCurrentWeather = createWeatherService();