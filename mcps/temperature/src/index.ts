import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { createServer } from './server.js';

const server = createServer();

try {
  await server.connect(new StdioServerTransport());
} catch (error) {
  console.error('Falha ao iniciar o servidor MCP:', error);
  process.exitCode = 1;
}