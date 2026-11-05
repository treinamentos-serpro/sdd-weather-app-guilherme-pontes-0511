import type { WeatherCondition } from '../types/weather';

const WEATHER_CODE_DESCRIPTIONS: Readonly<Record<number, string | undefined>> = {
  0: 'Céu limpo',
  1: 'Poucas nuvens',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Nevoeiro',
  48: 'Nevoeiro com deposição de geada',
  51: 'Garoa fraca',
  53: 'Garoa moderada',
  55: 'Garoa intensa',
  56: 'Garoa congelante fraca',
  57: 'Garoa congelante intensa',
  61: 'Chuva fraca',
  63: 'Chuva moderada',
  65: 'Chuva forte',
  66: 'Chuva congelante fraca',
  67: 'Chuva congelante forte',
  71: 'Neve fraca',
  73: 'Neve moderada',
  75: 'Neve forte',
  77: 'Grãos de neve',
  80: 'Pancadas de chuva fracas',
  81: 'Pancadas de chuva moderadas',
  82: 'Pancadas de chuva violentas',
  85: 'Pancadas de neve fracas',
  86: 'Pancadas de neve fortes',
  95: 'Trovoada fraca ou moderada',
  96: 'Trovoada com granizo fraco',
  99: 'Trovoada com granizo forte',
};

export function mapWeatherCode(code?: number): WeatherCondition | undefined {
  if (code === undefined) {
    return undefined;
  }

  const description = WEATHER_CODE_DESCRIPTIONS[code];
  if (description === undefined) {
    return undefined;
  }

  return { code, description };
}

export function getWeatherSymbol(code?: number): string {
  if (code === 0) {
    return '☀️';
  }

  if (code === 1 || code === 2) {
    return '🌤️';
  }

  if (code === 3) {
    return '☁️';
  }

  if (code === 45 || code === 48) {
    return '🌫️';
  }

  if (code !== undefined && code >= 51 && code <= 67) {
    return '🌧️';
  }

  if (code !== undefined && code >= 80 && code <= 82) {
    return '🌦️';
  }

  if (code !== undefined && ((code >= 71 && code <= 77) || code === 85 || code === 86)) {
    return '❄️';
  }

  if (code !== undefined && code >= 95 && code <= 99) {
    return '⛈️';
  }

  return '🌡️';
}
