import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { CurrentWeather } from '../shared/types.js';
import { createWeatherAdvice } from './weather-advice.js';

const baseWeather: CurrentWeather = {
  temperature: { value: 23, unit: '°C' },
  apparentTemperature: { value: 23, unit: '°C' },
  isRaining: false,
  rain: { value: 0, unit: 'mm' },
  relativeHumidity: { value: 50, unit: '%' },
  isDay: true,
  weatherCode: 0,
};

test('combina frio e chuva na recomendacao', () => {
  const advice = createWeatherAdvice({
    ...baseWeather,
    temperature: { value: 18, unit: '°C' },
    apparentTemperature: { value: 12, unit: '°C' },
    weatherCode: 61,
  });
  assert.equal(advice.bringUmbrella, true);
  assert.match(advice.title, /frio e a chuva/);
  assert.match(advice.detail, /impermeavel/);
});

test('recomenda roupas leves para calor seco', () => {
  const advice = createWeatherAdvice({
    ...baseWeather,
    temperature: { value: 32, unit: '°C' },
    apparentTemperature: { value: 32, unit: '°C' },
  });
  assert.equal(advice.bringUmbrella, false);
  assert.match(advice.detail, /agua/);
});

test('considera garoa indicada pelo codigo WMO mesmo sem acumulado', () => {
  const advice = createWeatherAdvice({ ...baseWeather, weatherCode: 51 });
  assert.equal(advice.bringUmbrella, true);
});