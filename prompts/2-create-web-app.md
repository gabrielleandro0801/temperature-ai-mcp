# Objetivo

Crie uma aplicação web utilizando Node.js e TypeScript que consuma um servidor MCP de informações meteorológicas já existente.

O objetivo é permitir que o usuário pesquise uma cidade em qualquer lugar do mundo e visualize as condições meteorológicas atuais de maneira interativa, animada e intuitiva.

# 1. Arquitetura

A aplicação deverá possuir:

- Frontend web executado no browser.
- Backend em Node.js com TypeScript.
- Um MCP Client responsável por se comunicar com o servidor MCP existente.
- Integração com a API de Geocoding da Open-Meteo.

**Importante:** o frontend não deve se comunicar diretamente com o servidor MCP. A comunicação deverá acontecer através do backend, que atuará como MCP Client.

Antes de implementar, analise o projeto MCP existente e compreenda como ele funciona. Reutilize o servidor e sua tool, sem duplicar sua lógica de negócio.

# 2. Pesquisa de cidades (Geocoding)

O usuário deverá conseguir pesquisar qualquer cidade do mundo através de seu nome.

Utilize a API oficial de Geocoding da Open-Meteo:

https://open-meteo.com/en/docs/geocoding-api

O fluxo deverá ser:

1. Usuário informa o nome de uma cidade.
2. Backend consulta a API de Geocoding.
3. A aplicação apresenta os resultados encontrados.
4. Usuário seleciona a cidade desejada.
5. A aplicação obtém latitude, longitude e fuso horário da localização.
6. As coordenadas são utilizadas para consultar a tool `get_current_weather` do servidor MCP.

Caso existam cidades com nomes iguais, apresente informações adicionais, como país e estado/região, para permitir a escolha correta.

# 3. Integração com MCP

A aplicação deverá utilizar um MCP Client real, seguindo o SDK oficial do Model Context Protocol.

O cliente deverá:

- Estabelecer conexão com o servidor MCP existente.
- Descobrir as tools disponibilizadas pelo servidor.
- Invocar a tool `get_current_weather`.
- Enviar latitude e longitude como parâmetros.
- Interpretar e disponibilizar o retorno para o frontend.

Não implemente uma chamada direta à API Open-Meteo para obter os dados meteorológicos. Essa responsabilidade pertence ao servidor MCP.

# 4. Informações meteorológicas

Exiba as seguintes informações:

- Temperatura atual.
- Sensação térmica.
- Indicador de chuva.
- Quantidade de chuva em milímetros.
- Umidade relativa do ar.

Além disso, o MCP deverá disponibilizar informações suficientes para identificar:

- Se é dia ou noite.
- Se o céu está limpo, parcialmente nublado, nublado ou chuvoso.

Caso necessário, evolua a tool `get_current_weather` para disponibilizar as variáveis adicionais da Open-Meteo, como `is_day` e `weather_code`.

Considere o fuso horário da cidade pesquisada para determinar corretamente o período do dia.

# 5. Interface e animações

Quero uma interface moderna, visualmente agradável e responsiva.

A principal característica da aplicação deverá ser uma representação animada das condições meteorológicas atuais.

Crie cenários diferentes considerando o período do dia e as condições meteorológicas:

**Durante o dia:**
- Céu ensolarado: sol, céu azul e algumas animações sutis.
- Parcialmente nublado: sol parcialmente encoberto por nuvens.
- Nublado: céu predominantemente encoberto por nuvens.
- Chuvoso: nuvens escuras e animação de chuva.

**Durante a noite:**
- Céu limpo: lua e estrelas.
- Parcialmente nublado: lua parcialmente encoberta por nuvens.
- Nublado: céu escuro com nuvens.
- Chuvoso: nuvens escuras e animação de chuva.

As animações devem mudar dinamicamente conforme os dados retornados pelo MCP.

Evite utilizar apenas emojis ou ícones estáticos. Quero uma experiência visual realmente animada.

# 6. Recomendações de vestuário e acessórios

A aplicação deverá apresentar recomendações contextualizadas com as condições meteorológicas.

Considere principalmente:

- Temperatura.
- Sensação térmica.
- Chuva.
- Condições gerais do tempo.

Exemplos:

| Condição | Recomendação |
|---|---|
| Muito calor | Roupas leves e garrafa de água |
| Temperatura amena | Camiseta e calça confortável |
| Frio | Casaco ou blusa de frio |
| Chuva | Guarda-chuva e calçados adequados |
| Frio e chuva | Casaco impermeável e guarda-chuva |

As recomendações devem considerar a combinação das condições, e não apenas uma variável isolada.

As regras podem ser implementadas no backend ou em um módulo específico da aplicação, sem necessidade de criar outra tool MCP.

# 7. Experiência do usuário

A aplicação deverá contemplar:

- Campo de pesquisa de cidades.
- Lista de resultados de geocoding.
- Indicador de carregamento durante as consultas.
- Exibição dos dados meteorológicos.
- Animações de transição entre condições climáticas.
- Mensagens de erro amigáveis caso alguma integração falhe.
- Possibilidade de pesquisar outra cidade sem precisar recarregar a página.
- Permita que o usuário veja as últimas cinco cidades consultadas e volte rapidamente a elas.

# 8. Requisitos de qualidade

- Utilizar TypeScript em todo o projeto.
- Manter separação de responsabilidades entre frontend, backend, MCP Client e integrações externas.
- Implementar tratamento adequado de erros.
- Evitar duplicação de código.
- Criar componentes reutilizáveis.
- Implementar testes para as principais regras de negócio.
- Não inventar dados meteorológicos quando houver falhas nas integrações.

# 9. Entrega

Antes de iniciar a implementação:

1. Analise a estrutura do servidor MCP existente.
2. Identifique o transporte utilizado pelo servidor e como o cliente deverá estabelecer a conexão.
3. Defina a arquitetura da aplicação.
4. Apresente brevemente as tecnologias e bibliotecas que pretende utilizar.

Depois, implemente a aplicação e disponibilize um README com instruções para instalação, configuração e execução.

Priorize uma solução funcional, organizada e visualmente agradável.