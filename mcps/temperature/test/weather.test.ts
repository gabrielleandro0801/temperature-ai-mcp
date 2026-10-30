import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Unit } from '@openmeteo/sdk/unit.js';
import { Variable } from '@openmeteo/sdk/variable.js';
import { createWeatherService, WeatherError } from '../src/weather/open-meteo.js';
import { coordinatesSchema } from '../src/weather/schemas.js';
import { coordinates, expectedWeather, weatherResponse } from './fixtures.js';

test('consulta somente current, com unidades explicitas e timeout', async () => {
  const service = createWeatherService(async (url, params, retries, _backoff, _max, options) => {
    assert.equal(url, 'https://api.open-meteo.com/v1/forecast');
    assert.deepEqual(params, {
      ...coordinates,
      current: 'temperature_2m,apparent_temperature,rain,relative_humidity_2m,is_day,weather_code',
      timezone: 'auto',
      temperature_unit: 'celsius',
      precipitation_unit: 'mm',
    });
    assert.equal(retries, 2);
    assert.ok(options?.signal instanceof AbortSignal);
    return [weatherResponse().response];
  });
  assert.deepEqual(await service(coordinates), expectedWeather);
});

test('chuva positiva resulta em isRaining true; zero resulta em false', async () => {
  for (const rain of [0, 0.01, 2.5]) {
    const service = createWeatherService(async () => [weatherResponse([25, 27, rain, 65]).response]);
    const result = await service(coordinates);
    assert.equal(result.isRaining, rain > 0);
    assert.equal(result.rain.value, rain);
  }
});

test('rejeita coordenadas invalidas antes de consultar a API', async () => {
  let calls = 0;
  const service = createWeatherService(async () => {
    calls += 1;
    return [];
  });
  for (const input of [
    { latitude: -91, longitude: 0 }, { latitude: 91, longitude: 0 },
    { latitude: 0, longitude: -181 }, { latitude: 0, longitude: 181 },
    { latitude: NaN, longitude: 0 }, { latitude: 0, longitude: Infinity },
  ]) {
    await assert.rejects(service(input), /Coordenadas invalidas/);
  }
  for (const input of [{}, { latitude: 0 }, { latitude: '0', longitude: 0 }, null]) {
    assert.equal(coordinatesSchema.safeParse(input).success, false);
  }
  assert.equal(calls, 0);
});

test('aceita os limites inclusivos das coordenadas', async () => {
  const service = createWeatherService(async () => [weatherResponse().response]);
  for (const input of [{ latitude: -90, longitude: -180 }, { latitude: 90, longitude: 180 }]) {
    assert.deepEqual(await service(input), expectedWeather);
  }
});

test('traduz falhas de comunicacao sem retornar dados ficticios', async () => {
  const cause = new TypeError('fetch failed');
  const service = createWeatherService(async () => { throw cause; });
  await assert.rejects(service(coordinates), (error: unknown) => {
    assert.ok(error instanceof WeatherError);
    assert.match(error.message, /Nao foi possivel consultar a Open-Meteo/);
    assert.equal(error.cause, cause);
    return true;
  });
});

test('traduz expiracao do timeout', async (context) => {
  context.mock.method(AbortSignal, 'timeout', () => AbortSignal.abort());
  const service = createWeatherService(async () => { throw new DOMException('Aborted', 'AbortError'); });
  await assert.rejects(service(coordinates), /Tempo limite de 10 segundos/);
});

test('rejeita resposta vazia ou bloco current ausente', async () => {
  await assert.rejects(createWeatherService(async () => [])(coordinates), /invalidos ou incompletos/);
  const { response } = weatherResponse();
  Object.assign(response, { current: () => null });
  await assert.rejects(createWeatherService(async () => [response])(coordinates), /invalidos ou incompletos/);
});

test('rejeita valores ausentes, nao finitos ou fora dos limites fisicos', async () => {
  for (const values of [
    [25, 27, 0], [NaN, 27, 0, 65], [25, Infinity, 0, 65],
    [25, 27, -1, 65], [25, 27, 0, -1], [25, 27, 0, 101],
    [25, 27, 0, 65, 2, 0], [25, 27, 0, 65, 1, 100],
  ]) {
    const service = createWeatherService(async () => [weatherResponse(values).response]);
    await assert.rejects(service(coordinates), /invalidos ou incompletos/);
  }
});

test('rejeita variavel nula, unidade inesperada e identidade incorreta', async () => {
  for (const mutation of ['null', 'unit', 'identity']) {
    const fixture = weatherResponse();
    if (mutation === 'null') Object.assign(fixture.current, { variables: () => null });
    if (mutation === 'unit') Object.assign(fixture.variables[0]!, { unit: () => Unit.fahrenheit });
    if (mutation === 'identity') Object.assign(fixture.variables[0]!, { variable: () => Variable.rain });
    await assert.rejects(createWeatherService(async () => [fixture.response])(coordinates), /invalidos ou incompletos/);
  }
});