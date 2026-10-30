import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { CurrentWeather } from '../shared/types.js';
import { getSkyCondition, isRainCode } from './weather-view.js';

const current = (weatherCode: number): CurrentWeather => ({
  temperature: { value: 20, unit: '°C' },
  apparentTemperature: { value: 20, unit: '°C' },
  isRaining: false,
  rain: { value: 0, unit: 'mm' },
  relativeHumidity: { value: 50, unit: '%' },
  isDay: true,
  weatherCode,
});

test('mapeia codigos WMO para ceu limpo, parcial, nublado e chuvoso', () => {
  assert.equal(getSkyCondition(current(0)), 'clear');
  assert.equal(getSkyCondition(current(2)), 'partly');
  assert.equal(getSkyCondition(current(48)), 'cloudy');
  assert.equal(getSkyCondition(current(61)), 'rainy');
});

test('distingue chuva de neve nos indicadores visuais', () => {
  assert.equal(isRainCode(51), true);
  assert.equal(isRainCode(95), true);
  assert.equal(isRainCode(71), false);
  assert.equal(getSkyCondition(current(71)), 'cloudy');
});