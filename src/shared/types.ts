export interface Place {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  countryCode: string;
  region: string | null;
  timezone: string;
}

export interface CurrentWeather {
  temperature: { value: number; unit: '°C' };
  apparentTemperature: { value: number; unit: '°C' };
  isRaining: boolean;
  rain: { value: number; unit: 'mm' };
  relativeHumidity: { value: number; unit: '%' };
  isDay: boolean;
  weatherCode: number;
}

export interface WeatherAdvice {
  title: string;
  detail: string;
  bringUmbrella: boolean;
}

export interface WeatherResult {
  weather: CurrentWeather;
  advice: WeatherAdvice;
}