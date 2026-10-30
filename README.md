# Temperature

Este projeto e um laboratorio pratico para estudar prompts, inteligencia
artificial e integracoes com MCP (Model Context Protocol). A aplicacao de clima
serve como exemplo concreto: um servidor MCP consulta as condicoes atuais na
Open-Meteo, enquanto uma aplicacao web consome essa ferramenta por meio de um
backend.

Repositorio organizado como workspace npm. O servidor MCP de clima fica em
`mcps/temperature/`; a aplicacao web consome sua ferramenta sem duplicar a
integracao meteorologica. Os prompts relacionados ao desenvolvimento ficam em
`prompts/`.

## Estrutura

```text
mcps/
  temperature/
    src/                 Servidor MCP e integracao Open-Meteo
    test/                Testes do MCP
    scripts/             Verificacao da API real
    package.json         Dependencias e comandos do MCP
    README.md            Documentacao do servidor
src/
  backend/               API HTTP, Geocoding, cliente MCP e recomendacoes
  frontend/              React, TypeScript, Vite e cenarios climaticos
  shared/                Tipos compartilhados pela aplicacao
.vscode/                 Configuracao MCP e depuracao
prompts/                 Prompts existentes
package.json             Workspace e comandos da raiz
package-lock.json        Lockfile compartilhado
```

## Instalacao e comandos

Requer Node.js 22 ou superior. Execute na raiz do repositorio:

```sh
npm ci
npm run build
npm run typecheck
npm test
```

Os comandos da raiz compilam e testam o MCP e a aplicacao web:

```sh
npm run dev        # Backend :3001 e frontend :5173
npm run build      # MCP, backend e frontend de producao
npm start          # Aplicacao compilada em :3001
npm test           # Testes locais, sem consulta meteorologica live
npm run test:live  # Consulta real pelo MCP; requer build e acesso a rede
```

Abra <http://localhost:5173> durante o desenvolvimento e
<http://localhost:3001> depois do build. `PORT` altera a porta do backend.

O backend pesquisa cidades pela API oficial de Geocoding da Open-Meteo e inicia
o MCP existente como subprocesso Node.js usando o transporte stdio e o cliente
oficial MCP v2. O navegador conversa somente com a API HTTP. O MCP entrega
temperatura, sensacao, chuva, umidade, periodo do dia e codigo WMO; a interface
usa o fuso horario retornado pelo Geocoding para mostrar a hora local. Em caso de
falha, nenhum dado meteorologico substituto e exibido. As cinco cidades mais
recentes ficam guardadas localmente no navegador.

Tambem e possivel selecionar o pacote explicitamente:

```sh
npm run build --workspace temperature-mcp
```

O VS Code continua usando [.vscode/mcp.json](.vscode/mcp.json) na raiz. Depois do
build, inicie `temperature-open-meteo` em `MCP: List Servers`. Se ja estava em
execucao antes da reorganizacao, reinicie-o para aplicar o novo caminho.

Consulte [a documentacao do MCP](mcps/temperature/README.md) para detalhes da
ferramenta `get_current_weather`, tratamento de erros e configuracao de clientes.