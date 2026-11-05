import type { TemperatureUnit } from '../types/weather';

export function convertTemperature(celsius: number, unit: TemperatureUnit): number {
  return unit === 'F' ? (celsius * 9) / 5 + 32 : celsius;
}

export function fahrenheitToCelsius(fahrenheit: number): number {
  return ((fahrenheit - 32) * 5) / 9;
}

export function formatTemperature(celsius: number, unit: TemperatureUnit): string {
  const roundedTemperature = Math.round(convertTemperature(celsius, unit));
  return `${roundedTemperature} °${unit}`;
}
