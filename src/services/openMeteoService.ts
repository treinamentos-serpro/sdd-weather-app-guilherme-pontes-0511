import { getCurrentDateInSaoPaulo, getNextFiveDatesInSaoPaulo } from '../lib/date';
import { normalizeCityQuery } from '../lib/normalizeCityQuery';
import { mapWeatherCode } from '../lib/weatherCode';
import type {
  City,
  Coordinates,
  CurrentWeather,
  ForecastDay,
  WeatherSnapshot,
} from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 10_000;

export class WeatherServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

interface JsonObject {
  [key: string]: unknown;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function boundedNumber(value: unknown, minimum: number, maximum: number): number | undefined {
  const number = finiteNumber(value);
  return number !== undefined && number >= minimum && number <= maximum ? number : undefined;
}

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function fetchJsonWithTimeout(
  url: string,
  endpoint: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort();

  if (signal?.aborted) {
    clearTimeout(timeoutId);
    throw new WeatherServiceError('A solicitação foi cancelada.');
  }

  signal?.addEventListener('abort', abortFromCaller, { once: true });

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new WeatherServiceError(
        `Não foi possível consultar ${endpoint}. Tente novamente mais tarde.`,
      );
    }

    try {
      return await response.json();
    } catch (error) {
      if (timedOut || signal?.aborted) {
        throw error;
      }

      throw new WeatherServiceError('A fonte de dados retornou uma resposta inválida.');
    }
  } catch (error) {
    if (signal?.aborted) {
      throw new WeatherServiceError('A solicitação foi cancelada.');
    }

    if (timedOut) {
      throw new WeatherServiceError('A requisição demorou demais.');
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new WeatherServiceError('A requisição demorou demais.');
    }

    if (error instanceof WeatherServiceError) {
      throw error;
    }

    throw new WeatherServiceError('Falha de rede. Verifique sua conexão e tente novamente.');
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}

function parseCity(value: unknown): City | undefined {
  if (!isJsonObject(value)) {
    return undefined;
  }

  const featureCode = value.feature_code;
  const id = finiteNumber(value.id);
  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const latitude = boundedNumber(value.latitude, -90, 90);
  const longitude = boundedNumber(value.longitude, -180, 180);

  if (
    typeof featureCode !== 'string' ||
    !featureCode.startsWith('PPL') ||
    id === undefined ||
    !name ||
    latitude === undefined ||
    longitude === undefined
  ) {
    return undefined;
  }

  return {
    id,
    name,
    latitude,
    longitude,
    ...(typeof value.admin1 === 'string' && value.admin1.trim()
      ? { region: value.admin1.trim() }
      : {}),
    ...(typeof value.country === 'string' && value.country.trim()
      ? { country: value.country.trim() }
      : {}),
  };
}

export async function searchCities(name: string, signal?: AbortSignal): Promise<City[]> {
  const query = normalizeCityQuery(name);

  if (!query) {
    return [];
  }

  const params = new URLSearchParams({
    name: query,
    count: '10',
    language: 'pt',
    format: 'json',
  });
  const payload = await fetchJsonWithTimeout(
    `${GEOCODING_URL}?${params}`,
    'a busca de cidades',
    signal,
  );

  if (!isJsonObject(payload)) {
    throw new WeatherServiceError('A fonte de dados retornou uma resposta inválida.');
  }

  if (payload.results === undefined) {
    return [];
  }

  if (!Array.isArray(payload.results)) {
    throw new WeatherServiceError('A fonte de dados retornou uma resposta inválida.');
  }

  return payload.results.flatMap((result) => {
    const city = parseCity(result);
    return city ? [city] : [];
  });
}

function weatherUrl(city: Coordinates): string {
  if (
    boundedNumber(city.latitude, -90, 90) === undefined ||
    boundedNumber(city.longitude, -180, 180) === undefined
  ) {
    throw new WeatherServiceError('As coordenadas da cidade são inválidas.');
  }

  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code',
    hourly: 'precipitation_probability',
    daily: 'temperature_2m_min,temperature_2m_max,precipitation_probability_max,weather_code',
    forecast_days: '6',
    timezone: 'America/Sao_Paulo',
    temperature_unit: 'celsius',
  });

  return `${FORECAST_URL}?${params}`;
}

function optionalArrayValue(
  record: JsonObject | undefined,
  key: string,
  index: number,
): unknown {
  const values = record?.[key];
  return Array.isArray(values) ? values[index] : undefined;
}

function mapForecast(
  daily: JsonObject | undefined,
  expectedDates: string[],
  today: string,
): ForecastDay[] {
  const dates = daily?.time;

  if (!Array.isArray(dates)) {
    return [];
  }

  const expectedDateSet = new Set(expectedDates);
  const seen = new Set<string>();

  return dates.flatMap((date, index) => {
    if (
      !isValidIsoDate(date) ||
      date <= today ||
      !expectedDateSet.has(date) ||
      seen.has(date)
    ) {
      return [];
    }

    seen.add(date);
    const weatherCode = finiteNumber(optionalArrayValue(daily, 'weather_code', index));
    const day: ForecastDay = {
      date,
      minimumC: finiteNumber(optionalArrayValue(daily, 'temperature_2m_min', index)),
      maximumC: finiteNumber(optionalArrayValue(daily, 'temperature_2m_max', index)),
      rainProbabilityPercent: boundedNumber(
        optionalArrayValue(daily, 'precipitation_probability_max', index),
        0,
        100,
      ),
      condition: weatherCode === undefined ? undefined : mapWeatherCode(weatherCode),
    };

    return [day];
  }).sort((first, second) => first.date.localeCompare(second.date));
}

function mapCurrent(
  current: JsonObject | undefined,
  daily: JsonObject | undefined,
  hourly: JsonObject | undefined,
  today: string,
): CurrentWeather | undefined {
  if (!current) {
    return undefined;
  }

  const sourceTime =
    typeof current.time === 'string' && Number.isFinite(Date.parse(current.time))
      ? current.time
      : undefined;
  const weatherCode = finiteNumber(current.weather_code);
  const dailyTimes = daily?.time;
  const todayIndex = Array.isArray(dailyTimes) ? dailyTimes.indexOf(today) : -1;
  const times = hourly?.time;
  const currentTimeIndex =
    sourceTime && Array.isArray(times) ? times.indexOf(sourceTime) : -1;
  const currentWeather: CurrentWeather = {
    sourceTime,
    temperatureC: finiteNumber(current.temperature_2m),
    minimumC:
      todayIndex < 0
        ? undefined
        : finiteNumber(optionalArrayValue(daily, 'temperature_2m_min', todayIndex)),
    maximumC:
      todayIndex < 0
        ? undefined
        : finiteNumber(optionalArrayValue(daily, 'temperature_2m_max', todayIndex)),
    feelsLikeC: finiteNumber(current.apparent_temperature),
    humidityPercent: boundedNumber(current.relative_humidity_2m, 0, 100),
    rainProbabilityPercent:
      currentTimeIndex < 0
        ? undefined
        : boundedNumber(
            optionalArrayValue(hourly, 'precipitation_probability', currentTimeIndex),
            0,
            100,
          ),
    condition: weatherCode === undefined ? undefined : mapWeatherCode(weatherCode),
  };

  if (
    [
      currentWeather.temperatureC,
      currentWeather.minimumC,
      currentWeather.maximumC,
      currentWeather.feelsLikeC,
      currentWeather.humidityPercent,
      currentWeather.rainProbabilityPercent,
      currentWeather.condition,
    ].every((value) => value === undefined)
  ) {
    return undefined;
  }

  return currentWeather;
}

function hasUsableForecast(forecast: ForecastDay[]): boolean {
  return forecast.some(
    (day) =>
      day.minimumC !== undefined ||
      day.maximumC !== undefined ||
      day.rainProbabilityPercent !== undefined ||
      day.condition !== undefined,
  );
}

export async function getWeather(
  city: Coordinates,
  signal?: AbortSignal,
): Promise<WeatherSnapshot> {
  const payload = await fetchJsonWithTimeout(weatherUrl(city), 'a previsão do tempo', signal);

  if (!isJsonObject(payload)) {
    throw new WeatherServiceError('A fonte de dados retornou uma resposta inválida.');
  }

  const current = isJsonObject(payload.current) ? payload.current : undefined;
  const daily = isJsonObject(payload.daily) ? payload.daily : undefined;
  const hourly = isJsonObject(payload.hourly) ? payload.hourly : undefined;
  const now = new Date();
  const today = getCurrentDateInSaoPaulo(now);
  const expectedDates = getNextFiveDatesInSaoPaulo(now);
  const mappedCurrent = mapCurrent(current, daily, hourly, today);
  const nextFiveDays = mapForecast(daily, expectedDates, today);

  if (!mappedCurrent && !hasUsableForecast(nextFiveDays)) {
    throw new WeatherServiceError('A fonte de dados não retornou informações meteorológicas.');
  }

  return {
    current: mappedCurrent,
    nextFiveDays,
    expectedDates,
    fetchedAt: now.toISOString(),
  };
}
