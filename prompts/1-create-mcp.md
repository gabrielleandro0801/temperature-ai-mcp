# Objetivo
Crie um servidor MCP (Model Context Protocol) utilizando Node.js e TypeScript, responsável por consultar informações meteorológicas através da API Open-Meteo.

Documentação da API: [https://open-meteo.com/en/docs](https://open-meteo.com/en/docs)

SDK oficial: [https://github.com/open-meteo/typescript](https://github.com/open-meteo/typescript)

## Requisitos técnicos

- Utilizar Node.js com TypeScript.
- Utilizar o SDK oficial `openmeteo` para realizar as consultas.
- Utilizar o SDK oficial do Model Context Protocol para implementar o servidor MCP.
- Não utilizar bibliotecas alternativas para realizar as consultas meteorológicas.
- Não implementar autenticação, pois será utilizada a API gratuita da Open-Meteo, que não exige API Key.
- Seguir boas práticas de organização, tipagem e tratamento de erros em TypeScript.

## Tools
O servidor deverá disponibilizar uma ferramenta chamada `get_current_weather`.

Essa ferramenta deverá receber os seguintes parâmetros obrigatórios:

ParâmetroTipoValidaçãolatitudenumberEntre -90 e 90longitudenumberEntre -180 e 180A ferramenta deverá consultar as condições meteorológicas atuais da localização informada e retornar:

1. Temperatura atual em graus Celsius.
2. Sensação térmica atual em graus Celsius.
3. Indicador se está chovendo atualmente (boolean).
4. Quantidade de chuva em milímetros (mm).
5. Umidade relativa do ar em porcentagem (%).
Utilize as variáveis correspondentes da API Open-Meteo:

- `temperature_2m`
- `apparent_temperature`
- `rain`
- `relative_humidity_2m`
Utilize o parâmetro `current` da API para consultar as condições atuais, e não os dados horários ou diários.

## Formato da resposta
A ferramenta deverá retornar os dados de maneira estruturada, com nomes descritivos e unidades explícitas.

Exemplo ilustrativo:

```
{
  "temperature": {
    "value": 25.4,
    "unit": "°C"
  },
  "apparentTemperature": {
    "value": 27.1,
    "unit": "°C"
  },
  "isRaining": false,
  "rain": {
    "value": 0,
    "unit": "mm"
  },
  "relativeHumidity": {
    "value": 65,
    "unit": "%"
  }
}
```

## Tratamento de erros

- Validar os parâmetros antes de realizar a consulta.
- Tratar falhas de comunicação com a API.
- Tratar respostas inválidas ou incompletas.
- Retornar mensagens de erro claras e compreensíveis para o cliente MCP.
- Não retornar dados fictícios em caso de falha.

## Organização e entrega

- Organizar o projeto de maneira modular.
- Separar a implementação do servidor MCP da lógica de integração com a Open-Meteo.
- Disponibilizar um `README.md` com instruções de instalação, execução e configuração do servidor em um cliente MCP.
- Disponibilizar um `.env.example` caso existam variáveis de ambiente necessárias.
- Incluir scripts de execução e build no `package.json`.
Antes de implementar, analise a documentação oficial das bibliotecas e escolha a abordagem mais adequada. Não invente métodos ou funcionalidades que não existam nos SDKs.
