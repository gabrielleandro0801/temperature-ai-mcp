import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { createServer } from '../src/server.js';
import { createWeatherService, WeatherError } from '../src/weather/open-meteo.js';
import { coordinates, expectedWeather, weatherResponse } from './fixtures.js';

async function connect(weatherService: ReturnType<typeof createWeatherService>) {
  const server = createServer(weatherService);
  const client = new Client({ name: 'temperature-test', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return { client, server };
}

test('MCP publica a ferramenta e retorna structuredContent e JSON equivalentes', async () => {
  const { client, server } = await connect(createWeatherService(async () => [weatherResponse().response]));
  try {
    const { tools } = await client.listTools();
    assert.equal(tools.length, 1);
    assert.equal(tools[0]?.name, 'get_current_weather');
    assert.deepEqual(tools[0]?.inputSchema.required, ['latitude', 'longitude']);
    assert.ok(tools[0]?.outputSchema);
    const result = await client.callTool({ name: 'get_current_weather', arguments: coordinates });
    assert.notEqual(result.isError, true);
    assert.deepEqual(result.structuredContent, expectedWeather);
    const content = result.content[0];
    assert.equal(content?.type, 'text');
    if (content?.type === 'text') assert.deepEqual(JSON.parse(content.text), expectedWeather);
  } finally {
    await client.close();
    await server.close();
  }
});

test('MCP valida entradas antes de chamar a integracao', async () => {
  let calls = 0;
  const { client, server } = await connect(async () => {
    calls += 1;
    return expectedWeather;
  });
  try {
    for (const input of [{}, { latitude: 0 }, { latitude: '0', longitude: 0 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: 181 }]) {
      const result = await client.callTool({ name: 'get_current_weather', arguments: input });
      assert.equal(result.isError, true);
      assert.equal(result.structuredContent, undefined);
    }
    assert.equal(calls, 0);
  } finally {
    await client.close();
    await server.close();
  }
});

test('MCP retorna erros claros sem dados meteorologicos nem detalhes internos', async () => {
  for (const error of [new WeatherError('Open-Meteo indisponivel.'), new Error('detalhe interno')]) {
    const { client, server } = await connect(async () => { throw error; });
    try {
      const result = await client.callTool({ name: 'get_current_weather', arguments: coordinates });
      assert.equal(result.isError, true);
      assert.equal(result.structuredContent, undefined);
      assert.doesNotMatch(JSON.stringify(result.content), /detalhe interno/);
      assert.match(JSON.stringify(result.content), error instanceof WeatherError ? /Open-Meteo indisponivel/ : /Erro interno/);
    } finally {
      await client.close();
      await server.close();
    }
  }
});

test('servidor inicia e responde pelo transporte stdio real', async () => {
  const client = new Client({ name: 'stdio-test', version: '1.0.0' });
  try {
    await client.connect(new StdioClientTransport({
      command: process.execPath,
      args: ['--import', 'tsx', 'src/index.ts'],
      cwd: fileURLToPath(new URL('../', import.meta.url)),
    }));
    const { tools } = await client.listTools();
    assert.equal(tools[0]?.name, 'get_current_weather');
    const result = await client.callTool({ name: 'get_current_weather', arguments: { latitude: 100, longitude: 0 } });
    assert.equal(result.isError, true);
  } finally {
    await client.close();
  }
});