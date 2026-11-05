import { afterEach, beforeEach, vi } from 'vitest';
import {
  getWeather,
  searchCities,
  WeatherServiceError,
} from '../../../src/services/openMeteoService';
import type { City } from '../../../src/types/weather';

const city: City = {
  id: 1,
  name: 'São Paulo',
  latitude: -23.55,
  longitude: -46.63,
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-05T15:00:00.000Z'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('searchCities', () => {
  it('returns an empty list without making a request for blank input', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities('   ')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns an empty list when the geocoding response has no results', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({}));
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities('Atlantis')).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects a malformed results field instead of treating it as an empty search', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ results: {} })));

    await expect(searchCities('Lisboa')).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('reports an invalid JSON body as a service error', async () => {
    const invalidJsonResponse = {
      ok: true,
      json: vi.fn().mockRejectedValue(new SyntaxError('invalid JSON')),
    } as unknown as Response;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(invalidJsonResponse));

    await expect(searchCities('Lisboa')).rejects.toThrow(
      'A fonte de dados retornou uma resposta inválida.',
    );
  });

  it('normalizes and encodes the query, mapping only populated places', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response({
        results: [
          {
            id: 3448439,
            name: 'São Paulo',
            latitude: -23.55,
            longitude: -46.63,
            admin1: 'São Paulo',
            country: 'Brasil',
            feature_code: 'PPLA',
          },
          {
            id: 999,
            name: 'São Paulo State',
            latitude: -23.55,
            longitude: -46.63,
            feature_code: 'ADM1',
          },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities('  São Paulo  ')).resolves.toEqual([
      {
        id: 3448439,
        name: 'São Paulo',
        latitude: -23.55,
        longitude: -46.63,
        region: 'São Paulo',
        country: 'Brasil',
      },
    ]);

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestedUrl.searchParams.get('name')).toBe('sao paulo');
    expect(requestedUrl.searchParams.get('count')).toBe('10');
    expect(requestedUrl.searchParams.get('language')).toBe('pt');
    expect(requestedUrl.searchParams.get('format')).toBe('json');
  });

  it('encodes special characters in the city query without adding URL parameters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ results: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await searchCities('São Paulo & região');

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestedUrl.searchParams.get('name')).toBe('sao paulo & regiao');
    expect([...requestedUrl.searchParams.keys()]).toEqual(['name', 'count', 'language', 'format']);
  });

  it('reports HTTP and network errors with a typed error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({}, 503)));
    await expect(searchCities('Lisboa')).rejects.toBeInstanceOf(WeatherServiceError);

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(searchCities('Lisboa')).rejects.toThrow('Falha de rede');
  });

  it('turns an aborted request into a timeout error', async () => {
    const fetchMock = vi.fn(
      (_url: string, options: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          options.signal?.addEventListener('abort', () => {
            const error = new Error('aborted');
            error.name = 'AbortError';
            reject(error);
          });
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const request = searchCities('Lisboa');
    const rejection = expect(request).rejects.toThrow('A requisição demorou demais');
    await vi.advanceTimersByTimeAsync(10_000);

    await rejection;
  });

  it('keeps the timeout active while reading the response body', async () => {
    let requestSignal: AbortSignal | undefined;
    const fetchMock = vi.fn((_url: string, options: RequestInit) => {
      requestSignal = options.signal as AbortSignal;
      const pendingResponse = new Response();
      vi.spyOn(pendingResponse, 'json').mockImplementation(
        () =>
          new Promise((_resolve, reject) => {
            requestSignal?.addEventListener(
              'abort',
              () => reject(new DOMException('Aborted', 'AbortError')),
              { once: true },
            );
          }),
      );
      return Promise.resolve(pendingResponse);
    });
    vi.stubGlobal('fetch', fetchMock);

    const request = searchCities('Lisboa');
    const rejection = expect(request).rejects.toThrow('A requisição demorou demais');
    await vi.advanceTimersByTimeAsync(10_000);

    await rejection;
    expect(requestSignal?.aborted).toBe(true);
  });
});

describe('getWeather', () => {
  it('does not request weather for invalid city coordinates', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getWeather({ latitude: 91, longitude: -46.63 })).rejects.toThrow(
      'As coordenadas da cidade são inválidas.',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports a non-OK forecast response as a service error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({}, 503)));

    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: expect.stringContaining('Não foi possível consultar a previsão do tempo'),
    });
  });

  it('maps current conditions and exactly the next five unique forecast dates', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      response({
        current: {
          time: '2026-11-05T12:00',
          temperature_2m: 22,
          relative_humidity_2m: 63,
          apparent_temperature: 21,
          weather_code: 2,
        },
        hourly: {
          time: ['2026-11-05T12:00'],
          precipitation_probability: [35],
        },
        daily: {
          time: [
            '2026-11-05',
            '2026-11-06',
            '2026-11-07',
            '2026-11-08',
            '2026-11-09',
            '2026-11-10',
          ],
          temperature_2m_min: [18, 19, 18, 17, 18, 18],
          temperature_2m_max: [27, 27, 26, 24, 25, 27],
          precipitation_probability_max: [20, 10, 20, 65, 30, 10],
          weather_code: [2, 1, 2, 61, 3, 0],
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const weather = await getWeather(city);

    expect(weather.current).toMatchObject({
      temperatureC: 22,
      minimumC: 18,
      maximumC: 27,
      feelsLikeC: 21,
      humidityPercent: 63,
      rainProbabilityPercent: 35,
      condition: { code: 2, description: 'Parcialmente nublado' },
    });
    expect(weather.expectedDates).toEqual([
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
      '2026-11-09',
      '2026-11-10',
    ]);
    expect(weather.nextFiveDays).toHaveLength(5);

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestedUrl.searchParams.get('latitude')).toBe('-23.55');
    expect(requestedUrl.searchParams.get('current')).toContain('apparent_temperature');
    expect(requestedUrl.searchParams.get('hourly')).toBe('precipitation_probability');
    expect(requestedUrl.searchParams.get('daily')).toContain('temperature_2m_min');
    expect(requestedUrl.searchParams.get('forecast_days')).toBe('6');
    expect(requestedUrl.searchParams.get('timezone')).toBe('America/Sao_Paulo');
    expect(requestedUrl.searchParams.get('temperature_unit')).toBe('celsius');
  });

  it('keeps unavailable fields absent and rejects a response without usable weather data', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          response({
            current: { temperature_2m: null, relative_humidity_2m: 110 },
            daily: {
              time: ['2026-11-05', '2026-11-06'],
              temperature_2m_min: [null, 16],
              temperature_2m_max: [null, 26],
              precipitation_probability_max: [null, 120],
              weather_code: [999, 999],
            },
          }),
        )
        .mockResolvedValueOnce(response({ current: {}, daily: {} })),
    );

    const partial = await getWeather(city);
    expect(partial.nextFiveDays).toEqual([
      { date: '2026-11-06', minimumC: 16, maximumC: 26, rainProbabilityPercent: undefined },
    ]);
    expect(partial.current?.humidityPercent).toBeUndefined();
    await expect(getWeather(city)).rejects.toThrow('não retornou informações meteorológicas');
  });

  it('rejects a response with only the current timestamp and no weather values', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        response({
          current: { time: '2026-11-05T12:00' },
          daily: {},
        }),
      ),
    );

    await expect(getWeather(city)).rejects.toThrow(
      'A fonte de dados não retornou informações meteorológicas.',
    );
  });

  it('keeps null and out-of-range precipitation probabilities unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        response({
          current: {
            time: '2026-11-05T12:00',
            temperature_2m: 0,
          },
          hourly: {
            time: ['2026-11-05T12:00'],
            precipitation_probability: [null],
          },
          daily: {
            time: ['2026-11-05', '2026-11-06'],
            temperature_2m_min: [null, 0],
            temperature_2m_max: [null, 10],
            precipitation_probability_max: [null, 120],
            weather_code: [null, null],
          },
        }),
      ),
    );

    const weather = await getWeather(city);

    expect(weather.current?.rainProbabilityPercent).toBeUndefined();
    expect(weather.nextFiveDays).toEqual([
      {
        date: '2026-11-06',
        minimumC: 0,
        maximumC: 10,
        rainProbabilityPercent: undefined,
      },
    ]);
  });
});
