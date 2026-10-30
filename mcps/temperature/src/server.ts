import { McpServer } from '@modelcontextprotocol/server';
import { getCurrentWeather, WeatherError } from './weather/open-meteo.js';
import { coordinatesSchema, currentWeatherSchema } from './weather/schemas.js';

export function createServer(weatherService = getCurrentWeather): McpServer {
  const server = new McpServer({ name: 'temperature-mcp', version: '1.0.0' });

  server.registerTool(
    'get_current_weather',
    {
      title: 'Condicoes meteorologicas atuais',
      description: 'Consulta temperatura, sensacao termica, chuva, umidade, periodo do dia e codigo WMO atuais pela Open-Meteo. isRaining indica rain > 0 no intervalo atual do modelo, nao uma observacao instantanea.',
      inputSchema: coordinatesSchema,
      outputSchema: currentWeatherSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (coordinates) => {
      try {
        const weather = await weatherService(coordinates);
        return {
          content: [{ type: 'text', text: JSON.stringify(weather) }],
          structuredContent: weather,
        };
      } catch (error) {
        return {
          isError: true,
          content: [{
            type: 'text',
            text: error instanceof WeatherError ? error.message : 'Erro interno ao consultar as condicoes meteorologicas.',
          }],
        };
      }
    },
  );

  return server;
}