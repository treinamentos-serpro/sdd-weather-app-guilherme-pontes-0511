export type TemperatureUnit = 'C' | 'F';
export type LocationSource = 'city' | 'current';

export interface City {
  id: number;
  name: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface WeatherLocation {
  id: string;
  label: string;
  region?: string;
  source: LocationSource;
  isApproximate: boolean;
  accuracyMeters?: number;
}

export interface WeatherCondition {
  code: number;
  description: string;
}

export interface CurrentWeather {
  sourceTime?: string;
  temperatureC?: number;
  minimumC?: number;
  maximumC?: number;
  feelsLikeC?: number;
  humidityPercent?: number;
  rainProbabilityPercent?: number;
  condition?: WeatherCondition;
}

export interface ForecastDay {
  date: string;
  minimumC?: number;
  maximumC?: number;
  rainProbabilityPercent?: number;
  condition?: WeatherCondition;
}

export interface WeatherSnapshot {
  current?: CurrentWeather;
  nextFiveDays: ForecastDay[];
  expectedDates: string[];
  fetchedAt: string;
}
