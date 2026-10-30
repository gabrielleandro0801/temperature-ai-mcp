import { createServer } from 'node:http';
import { createApp } from './app.js';
import { McpWeatherClient } from './mcp-weather-client.js';

const weatherClient = new McpWeatherClient();

try {
  await weatherClient.connect();
} catch (error) {
  console.error('Falha ao conectar ao servidor MCP de clima:', error);
  process.exitCode = 1;
  throw error;
}

const port = Number(process.env.PORT ?? 3001);
const server = createServer(createApp(weatherClient));
server.listen(port, '0.0.0.0', () => {
  console.log(`Aplicacao backend disponivel na porta ${port}.`);
});

async function shutdown() {
  server.close();
  await weatherClient.close();
}

process.on('SIGINT', () => { void shutdown(); });
process.on('SIGTERM', () => { void shutdown(); });