import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { fileURLToPath } from 'node:url';
import { currentWeatherSchema } from '../src/weather/schemas.js';

const client = new Client({ name: 'weather-live-check', version: '1.0.0' });
try {
  await client.connect(new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL('../dist/index.js', import.meta.url))],
  }));
  const result = await client.callTool({
    name: 'get_current_weather',
    arguments: { latitude: -23.55, longitude: -46.63 },
  });
  if (result.isError) throw new Error(JSON.stringify(result.content));
  console.log(JSON.stringify(currentWeatherSchema.parse(result.structuredContent), null, 2));
} catch (error) {
  console.error('Consulta real falhou:', error);
  process.exitCode = 1;
} finally {
  await client.close();
}