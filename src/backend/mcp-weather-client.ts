import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import * as z from 'zod/v4';
import { resolve } from 'node:path';
import type { CurrentWeather } from '../shared/types.js';

const currentWeatherSchema = z.object({
  temperature: z.object({ value: z.number(), unit: z.literal('°C') }),
  apparentTemperature: z.object({ value: z.number(), unit: z.literal('°C') }),
  isRaining: z.boolean(),
  rain: z.object({ value: z.number().min(0), unit: z.literal('mm') }),
  relativeHumidity: z.object({ value: z.number().min(0).max(100), unit: z.literal('%') }),
  isDay: z.boolean(),
  weatherCode: z.number().int().min(0).max(99),
});

export class McpWeatherClient {
  private readonly client = new Client({ name: 'temperature-web-app', version: '1.0.0' });
  private connected = false;

  async connect(serverPath = resolve(process.cwd(), 'mcps/temperature/dist/index.js')): Promise<void> {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [serverPath],
      cwd: process.cwd(),
    });
    await this.client.connect(transport);
    const { tools } = await this.client.listTools();
    if (!tools.some((tool) => tool.name === 'get_current_weather')) {
      await this.client.close();
      throw new Error('O servidor MCP nao disponibiliza get_current_weather.');
    }
    this.connected = true;
  }

  async getCurrentWeather(latitude: number, longitude: number): Promise<CurrentWeather> {
    if (!this.connected) throw new Error('A conexao com o servidor meteorologico nao esta disponivel.');
    let result: Awaited<ReturnType<Client['callTool']>>;
    try {
      result = await this.client.callTool({
        name: 'get_current_weather',
        arguments: { latitude, longitude },
      });
    } catch {
      throw new Error('Nao foi possivel consultar as condicoes meteorologicas. Tente novamente.');
    }
    if (result.isError) {
      throw new Error('Nao foi possivel consultar as condicoes meteorologicas. Tente novamente.');
    }
    const parsed = currentWeatherSchema.safeParse(result.structuredContent);
    if (!parsed.success) {
      throw new Error('O servidor meteorologico retornou dados incompletos. Tente novamente mais tarde.');
    }
    return parsed.data;
  }

  async close(): Promise<void> {
    if (this.connected) await this.client.close();
    this.connected = false;
  }
}