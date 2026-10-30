# Temperature MCP

Servidor MCP em Node.js e TypeScript para consultar as condicoes meteorologicas
atuais de uma coordenada pela API gratuita da Open-Meteo. Sem autenticacao ou API key.

## Requisitos e instalacao

- Node.js 22 ou superior e npm.
- Acesso HTTPS a `api.open-meteo.com` para consultas reais.

Este MCP fica em `mcps/temperature/`. Execute a instalacao e os comandos abaixo
na raiz do repositorio, que gerencia as dependencias com npm workspaces:

```sh
npm ci
npm run build
```

Nao sao necessarias variaveis de ambiente; portanto, nao ha `.env.example`.

## Execucao

```sh
npm start
```

O servidor utiliza **stdio**, nao HTTP: um cliente MCP inicia o processo e troca
mensagens JSON-RPC por stdin/stdout. Ao iniciar pelo terminal, ele aguarda mensagens
MCP; isso nao indica travamento. Nenhum log da aplicacao e escrito em stdout.

```sh
npm run dev        # Execucao TypeScript com reinicio automatico
npm run build      # Compila para mcps/temperature/dist/
npm run typecheck  # Verifica tipos do codigo, testes e script de consulta
npm test          # Testes locais, sem acesso a API externa
npm run test:live  # Consulta real pelo MCP compilado; execute o build antes
```

`test:live` inicia e encerra o servidor automaticamente, consulta Sao Paulo
(`-23.55`, `-46.63`) e imprime o resultado validado. Depende de rede e da
disponibilidade da API; encerra com codigo diferente de zero em caso de falha.

## Configuracao no VS Code

O projeto inclui [.vscode/mcp.json](../../.vscode/mcp.json) na raiz. Depois de instalar e compilar:

1. Abra a raiz do repositorio no VS Code com suporte a MCP.
2. Na paleta de comandos, selecione `MCP: List Servers` e inicie `temperature-open-meteo`.
3. Autorize o servidor quando solicitado e habilite `get_current_weather` no chat.

O cliente usa `node` no PATH e `${workspaceFolder}/mcps/temperature/dist/index.js`. Se o VS Code nao
encontrar o Node instalado pelo gerenciador de versoes, substitua `node` pelo
caminho absoluto do executavel. Recompile e reinicie o servidor apos alterar o codigo.

Para depurar o processo, use a configuracao `Depurar servidor MCP` em Run and Debug
depois do build. Ela aguarda um cliente no stdin; para inspecionar chamadas completas,
execute o cliente com o processo do servidor sob o depurador. Os logs de conexao
tambem ficam disponiveis na acao de mostrar saida do servidor MCP no VS Code.

## Outros clientes MCP

Em clientes com configuracao `mcpServers`, como Claude Desktop, use caminhos
absolutos para os executaveis e o arquivo compilado:

```json
{
  "mcpServers": {
    "temperature-open-meteo": {
      "command": "/caminho/absoluto/para/node",
      "args": ["/caminho/absoluto/para/temperature/mcps/temperature/dist/index.js"]
    }
  }
}
```

`${workspaceFolder}` e uma substituicao do VS Code, nao um recurso universal de
clientes MCP. Nenhum `env`, porta ou token precisa ser configurado.

## Ferramenta get_current_weather

Os dois argumentos sao obrigatorios, numericos, finitos e sem conversao de strings:

| Parametro | Tipo | Intervalo inclusivo |
| --- | --- | --- |
| `latitude` | number | -90 a 90 |
| `longitude` | number | -180 a 180 |

Exemplo de argumentos:

```json
{ "latitude": -23.55, "longitude": -46.63 }
```

O resultado e publicado em `structuredContent`, com `outputSchema`, e tambem como
JSON em um bloco `content` de texto para compatibilidade. Exemplo **ilustrativo**,
nao uma consulta real:

```json
{
  "temperature": { "value": 25.4, "unit": "\u00b0C" },
  "apparentTemperature": { "value": 27.1, "unit": "\u00b0C" },
  "isRaining": false,
  "rain": { "value": 0, "unit": "mm" },
  "relativeHumidity": { "value": 65, "unit": "%" },
  "isDay": true,
  "weatherCode": 0
}
```

As unidades de temperatura sao o caractere grau seguido de C; `\u00b0` e apenas
sua representacao JSON escapada. Os valores do SDK sao preservados, sem arredondamento.

### Consulta e interpretacao

- Endpoint fixo: `https://api.open-meteo.com/v1/forecast`.
- Uso exclusivo de `fetchWeatherApi` do SDK oficial `openmeteo`.
- `current=temperature_2m,apparent_temperature,rain,relative_humidity_2m,is_day,weather_code`.
- `timezone=auto` para interpretar `is_day` no horario local das coordenadas.
- `temperature_unit=celsius` e `precipitation_unit=mm` explicitos.
- Nenhuma consulta `hourly` ou `daily`.
- `isRaining` e calculado como `rain > 0`, conforme o campo solicitado.
- `isDay` e derivado de `is_day`; `weatherCode` preserva o codigo WMO atual para classificar o ceu.

As condicoes atuais sao estimativas de modelo em intervalos de 15 minutos, nao
observacoes instantaneas de uma estacao. `rain` representa o acumulado no intervalo
`current.interval` da API. Nao representa probabilidade de chuva nem toda a
precipitacao: a Open-Meteo possui campos separados para pancadas (`showers`) e neve.
Assim, `isRaining` expressa somente o indicador derivado de `rain` solicitado.

### Erros

As coordenadas sao validadas pelo SDK MCP antes do handler e novamente na camada
de integracao antes da rede. Falhas retornam `isError: true` e uma mensagem de
texto, sem `structuredContent` meteorologico e sem dados substitutos.

- Coordenadas ausentes, de tipo incorreto ou fora do intervalo sao rejeitadas.
- Timeout de 10 segundos e enviado ao SDK por `fetchOptions.signal`.
- O retry nativo do SDK fica limitado a duas tentativas para os status de servidor
  que ele suporta (500, 502 e 504), com o mesmo prazo compartilhado.
- Falhas de comunicacao e limites de requisicoes resultam em mensagem de consulta indisponivel.
- Respostas sem `current`, variaveis ausentes, valores nao finitos, unidades ou
  identidades inesperadas sao rejeitadas; chuva negativa e umidade fora de 0 a 100 tambem.
- Detalhes internos de excecoes nao sao expostos ao cliente.

## Organizacao

```text
src/
  index.ts                 Entrada e transporte stdio
  server.ts                Registro da ferramenta MCP e respostas de erro
  weather/
    schemas.ts             Contratos Zod e tipos inferidos
    open-meteo.ts          Consulta e validacao do retorno do SDK
test/
  fixtures.ts              Dados controlados, apenas para testes
  weather.test.ts          Validacao, mapeamento e falhas da integracao
  server.test.ts           Contratos MCP e transporte stdio
scripts/
  check-live.ts            Consulta real pelo cliente MCP oficial
```

Os testes locais injetam respostas controladas; o caminho de producao sempre usa
o SDK oficial e nunca retorna fixtures em caso de falha.

## Decisoes e documentacao oficial

A implementacao segue a linha estavel v2 do SDK oficial MCP
(`@modelcontextprotocol/server` e, para testes, `@modelcontextprotocol/client`),
com `McpServer.registerTool`, Zod v4, esquemas de entrada/saida e transporte stdio.
Nao mistura os imports da antiga linha v1 (`@modelcontextprotocol/sdk`).

O SDK `openmeteo` decodifica FlatBuffers: os indices de `current.variables(index)`
seguem a ordem das variaveis solicitadas e o escalar vem de `.value()`.
`@openmeteo/sdk`, do mesmo projeto oficial, fornece apenas os enums de metadados
para validacao; nao e um cliente meteorologico alternativo.

- [API Open-Meteo e semantica de current](https://open-meteo.com/en/docs)
- [SDK TypeScript oficial Open-Meteo](https://github.com/open-meteo/typescript)
- [SDK TypeScript oficial MCP](https://github.com/modelcontextprotocol/typescript-sdk)
- [Documentacao MCP TypeScript v2](https://ts.sdk.modelcontextprotocol.io/v2/)
- [Especificacao MCP](https://modelcontextprotocol.io/specification/latest)

A API gratuita esta sujeita a limites de uso e e destinada a uso nao comercial.
Consulte os [termos](https://open-meteo.com/en/terms) e a
[licenca e atribuicao dos dados](https://open-meteo.com/en/licence) antes de usar
os resultados em produtos. Fonte dos dados: [Open-Meteo](https://open-meteo.com/).