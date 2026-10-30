import * as z from 'zod/v4';
import type { Place } from '../shared/types.js';

const geocodingResultSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  country: z.string().optional(),
  country_code: z.string().optional(),
  admin1: z.string().optional(),
  timezone: z.string().min(1),
});

const geocodingResponseSchema = z.object({
  results: z.array(geocodingResultSchema).nullable().optional(),
});

export class GeocodingError extends Error {
  override readonly name = 'GeocodingError';
}

export function createGeocodingService(fetcher: typeof fetch = fetch) {
  return async (query: string): Promise<Place[]> => {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', query);
    url.searchParams.set('count', '10');
    url.searchParams.set('language', 'pt');
    url.searchParams.set('format', 'json');

    const signal = AbortSignal.timeout(8_000);
    let response: Response;
    try {
      response = await fetcher(url, { signal });
    } catch (error) {
      throw new GeocodingError(signal.aborted
        ? 'A pesquisa demorou demais. Tente novamente.'
        : 'Nao foi possivel pesquisar cidades agora. Verifique sua conexao e tente novamente.', { cause: error });
    }
    if (!response.ok) throw new GeocodingError('O servico de cidades esta temporariamente indisponivel.');

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      throw new GeocodingError('O servico de cidades retornou uma resposta invalida.', { cause: error });
    }
    const parsed = geocodingResponseSchema.safeParse(payload);
    if (!parsed.success) throw new GeocodingError('O servico de cidades retornou dados incompletos.');

    return (parsed.data.results ?? []).map((place) => ({
      id: place.id,
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      country: place.country ?? 'Pais desconhecido',
      countryCode: place.country_code ?? '',
      region: place.admin1 ?? null,
      timezone: place.timezone,
    }));
  };
}