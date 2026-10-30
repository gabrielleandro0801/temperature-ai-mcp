import express from 'express';
import * as z from 'zod/v4';
import { resolve } from 'node:path';
import type { Place, WeatherResult } from '../shared/types.js';
import { createGeocodingService, GeocodingError } from './geocoding.js';
import { createWeatherAdvice } from './weather-advice.js';

export interface WeatherProvider {
  getCurrentWeather(latitude: number, longitude: number): Promise<WeatherResult['weather']>;
}

const coordinatesQuerySchema = z.object({
  latitude: z.coerce.number().finite().min(-90).max(90),
  longitude: z.coerce.number().finite().min(-180).max(180),
});

const geocode = createGeocodingService();

export function createApp(weatherProvider: WeatherProvider) {
  const app = express();
  app.get('/api/places', async (request, response) => {
    const query = typeof request.query.q === 'string' ? request.query.q.trim() : '';
    if (query.length < 2 || query.length > 80) {
      response.status(400).json({ error: 'Digite entre 2 e 80 caracteres para pesquisar.' });
      return;
    }
    try {
      const places: Place[] = await geocode(query);
      response.json({ places });
    } catch (error) {
      const message = error instanceof GeocodingError
        ? error.message
        : 'Nao foi possivel pesquisar cidades agora. Tente novamente.';
      response.status(502).json({ error: message });
    }
  });

  app.get('/api/weather', async (request, response) => {
    const parsed = coordinatesQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      response.status(400).json({ error: 'As coordenadas desta cidade sao invalidas.' });
      return;
    }
    try {
      const weather = await weatherProvider.getCurrentWeather(parsed.data.latitude, parsed.data.longitude);
      const result: WeatherResult = { weather, advice: createWeatherAdvice(weather) };
      response.json(result);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Nao foi possivel consultar o clima agora. Tente novamente.';
      response.status(502).json({ error: message });
    }
  });

  app.use('/api', (_request, response) => {
    response.status(404).json({ error: 'Rota nao encontrada.' });
  });

  app.use(express.static(resolve(process.cwd(), 'dist/web')));
  app.use((_request, response) => {
    response.sendFile(resolve(process.cwd(), 'dist/web/index.html'));
  });

  return app;
}