import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createGeocodingService, GeocodingError } from './geocoding.js';

test('consulta Geocoding oficial e preserva regiao, pais e fuso horario', async () => {
  let url: URL | undefined;
  const search = createGeocodingService(async (input, init) => {
    url = new URL(input.toString());
    assert.ok(init?.signal instanceof AbortSignal);
    return new Response(JSON.stringify({
      results: [{
        id: 1,
        name: 'Sao Paulo',
        latitude: -23.55,
        longitude: -46.63,
        country: 'Brasil',
        country_code: 'BR',
        admin1: 'Sao Paulo',
        timezone: 'America/Sao_Paulo',
      }],
    }));
  });

  const places = await search('Sao Paulo');
  assert.equal(url?.origin, 'https://geocoding-api.open-meteo.com');
  assert.equal(url?.pathname, '/v1/search');
  assert.equal(url?.searchParams.get('language'), 'pt');
  assert.equal(places[0]?.timezone, 'America/Sao_Paulo');
  assert.equal(places[0]?.region, 'Sao Paulo');
  assert.equal(places[0]?.countryCode, 'BR');
});

test('aceita results null como pesquisa valida sem correspondencias', async () => {
  const search = createGeocodingService(async () => new Response('{"results":null}'));
  assert.deepEqual(await search('Cidade inexistente'), []);
});

test('rejeita dados incompletos e falhas do servico sem criar localidades', async () => {
  const malformed = createGeocodingService(async () => new Response('{"results":[{"name":"X"}]}'));
  await assert.rejects(malformed('X'), (error: unknown) => error instanceof GeocodingError);

  const unavailable = createGeocodingService(async () => new Response('', { status: 503 }));
  await assert.rejects(unavailable('X'), /temporariamente indisponivel/);
});