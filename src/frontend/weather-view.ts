import type { CurrentWeather } from '../shared/types.js';

export type SkyCondition = 'clear' | 'partly' | 'cloudy' | 'rainy';

export function isRainCode(code: number): boolean {
  return (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99);
}

export function getSkyCondition(weather: CurrentWeather): SkyCondition {
  const code = weather.weatherCode;
  if (code === 0 || code === 1) return 'clear';
  if (code === 2) return 'partly';
  if (code === 3 || code === 45 || code === 48 || (code >= 71 && code <= 77) || code === 85 || code === 86) return 'cloudy';
  return 'rainy';
}

export function getConditionLabel(condition: SkyCondition): string {
  const labels: Record<SkyCondition, string> = {
    clear: 'Céu limpo',
    partly: 'Parcialmente nublado',
    cloudy: 'Nublado',
    rainy: 'Chuvoso',
  };
  return labels[condition];
}