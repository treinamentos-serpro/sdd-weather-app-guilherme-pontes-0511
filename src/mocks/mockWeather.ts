import type { WeatherLocation, WeatherSnapshot } from '../types/weather';

export const mockWeather = {
  isDemo: true,
  location: {
    id: 'sao-paulo',
    label: 'São Paulo',
    region: 'São Paulo',
    source: 'city',
    isApproximate: false,
  },
  snapshot: {
    current: {
      sourceTime: '2026-11-05T14:00:00-03:00',
      temperatureC: 22,
      minimumC: 18,
      maximumC: 27,
      feelsLikeC: 22,
      humidityPercent: 63,
      rainProbabilityPercent: 20,
      condition: {
        code: 2,
        description: 'Parcialmente nublado',
      },
    },
    nextFiveDays: [
      {
        date: '2026-11-06',
        minimumC: 19,
        maximumC: 27,
        rainProbabilityPercent: 10,
        condition: {
          code: 1,
          description: 'Poucas nuvens',
        },
      },
      {
        date: '2026-11-07',
        minimumC: 18,
        maximumC: 26,
        rainProbabilityPercent: 20,
        condition: {
          code: 2,
          description: 'Parcialmente nublado',
        },
      },
      {
        date: '2026-11-08',
        minimumC: 17,
        maximumC: 24,
        rainProbabilityPercent: 65,
        condition: {
          code: 61,
          description: 'Chuva fraca',
        },
      },
      {
        date: '2026-11-09',
        minimumC: 18,
        maximumC: 25,
        rainProbabilityPercent: 30,
        condition: {
          code: 3,
          description: 'Nublado',
        },
      },
      {
        date: '2026-11-10',
        minimumC: 18,
        maximumC: 27,
        rainProbabilityPercent: 10,
        condition: {
          code: 0,
          description: 'Céu limpo',
        },
      },
    ],
    expectedDates: ['2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10'],
    fetchedAt: '2026-11-05T14:00:00-03:00',
  },
} satisfies {
  isDemo: true;
  location: WeatherLocation;
  snapshot: WeatherSnapshot;
};
