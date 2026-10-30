import type { Place, WeatherResult } from '../shared/types.js';

interface PlaceResponse {
  places: Place[];
}

interface ApiError {
  error?: string;
}

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json() as T & ApiError;
  if (!response.ok) throw new Error(payload.error ?? 'Não foi possível concluir a consulta.');
  return payload;
}

export async function searchPlaces(query: string): Promise<Place[]> {
  const params = new URLSearchParams({ q: query });
  const result = await requestJson<PlaceResponse>(`/api/places?${params}`);
  return result.places;
}

export async function getWeather(place: Place): Promise<WeatherResult> {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
  });
  return requestJson<WeatherResult>(`/api/weather?${params}`);
}