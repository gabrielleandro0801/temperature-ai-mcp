# Project conventions

- Use Node.js ESM, strict TypeScript and the official MCP v2 SDK.
- Keep MCP code in mcps/temperature/, with registration in its src/server.ts and weather integration in its src/weather/.
- Reserve root src/backend/ and src/frontend/ for future applications.
- Make weather requests only through fetchWeatherApi from openmeteo, using current.
- Validate inputs and upstream data; never substitute sample weather after failures.
- Reserve stdout for MCP messages; diagnostics belong on stderr.
- Run npm run typecheck, npm test and npm run build after changes.
- Official MCP SDK: https://github.com/modelcontextprotocol/typescript-sdk
- MCP v2 documentation: https://ts.sdk.modelcontextprotocol.io/v2/
- Official Open-Meteo SDK: https://github.com/open-meteo/typescript
- Weather API: https://open-meteo.com/en/docs