import type { CurrentWeather, WeatherAdvice } from '../shared/types.js';

const wetWeatherCodes = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77,
  80, 81, 82, 85, 86, 95, 96, 99,
]);

export function createWeatherAdvice(weather: CurrentWeather): WeatherAdvice {
  const temperature = Math.min(weather.temperature.value, weather.apparentTemperature.value);
  const isWet = weather.isRaining || weather.rain.value > 0 || wetWeatherCodes.has(weather.weatherCode);

  if (isWet && temperature < 16) {
    return {
      title: 'Vista-se para o frio e a chuva',
      detail: 'Prefira um casaco impermeavel, calcado fechado e leve um guarda-chuva.',
      bringUmbrella: true,
    };
  }
  if (isWet) {
    return {
      title: 'Leve protecao para a chuva',
      detail: 'Um guarda-chuva e calcados que possam molhar deixam o passeio mais confortavel.',
      bringUmbrella: true,
    };
  }
  if (temperature >= 28) {
    return {
      title: 'Vista roupas leves',
      detail: 'Escolha tecidos frescos e leve agua para se manter hidratado.',
      bringUmbrella: false,
    };
  }
  if (temperature >= 18) {
    return {
      title: 'Clima agradavel para sair',
      detail: 'Camiseta e calca confortavel devem funcionar bem ao longo do dia.',
      bringUmbrella: false,
    };
  }
  if (temperature >= 10) {
    return {
      title: 'Leve uma camada extra',
      detail: 'Uma blusa ou jaqueta leve ajuda quando a temperatura cair.',
      bringUmbrella: false,
    };
  }
  return {
    title: 'Agasalhe-se bem',
    detail: 'Use casaco quente e proteja as extremidades do frio.',
    bringUmbrella: false,
  };
}