import { useId } from 'react';
import { formatTemperature } from '../lib/temperature';
import { getWeatherSymbol } from '../lib/weatherCode';
import type {
  CurrentWeather as CurrentWeatherData,
  TemperatureUnit,
  WeatherCondition,
  WeatherLocation,
} from '../types/weather';

interface CurrentWeatherProps {
  location: WeatherLocation;
  current?: CurrentWeatherData;
  unit: TemperatureUnit;
}

const unavailableLabel = 'Indisponível';
const percentageFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function formatTemperatureValue(temperatureC: number | undefined, unit: TemperatureUnit): string {
  if (typeof temperatureC !== 'number' || !Number.isFinite(temperatureC)) {
    return `${unavailableLabel} (°${unit})`;
  }

  return formatTemperature(temperatureC, unit);
}

function formatPercentage(value: number | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
    return unavailableLabel;
  }

  return `${percentageFormatter.format(value)}%`;
}

function formatCondition(condition: WeatherCondition | undefined): string {
  if (
    !condition ||
    !Number.isFinite(condition.code) ||
    typeof condition.description !== 'string' ||
    !condition.description.trim()
  ) {
    return unavailableLabel;
  }

  return condition.description.trim();
}

export default function CurrentWeather({ location, current, unit }: CurrentWeatherProps) {
  const locationHeadingId = useId();
  const temperatureHeadingId = useId();
  const metricHeadingId = useId();
  const condition = formatCondition(current?.condition);
  const metrics = [
    {
      id: 'minimum',
      label: 'Temperatura mínima',
      value: formatTemperatureValue(current?.minimumC, unit),
    },
    {
      id: 'maximum',
      label: 'Temperatura máxima',
      value: formatTemperatureValue(current?.maximumC, unit),
    },
    {
      id: 'feels-like',
      label: 'Sensação térmica',
      value: formatTemperatureValue(current?.feelsLikeC, unit),
    },
    {
      id: 'humidity',
      label: 'Umidade',
      value: formatPercentage(current?.humidityPercent),
    },
    {
      id: 'rain-probability',
      label: 'Probabilidade de chuva',
      value: formatPercentage(current?.rainProbabilityPercent),
    },
  ];

  return (
    <section
      aria-labelledby={locationHeadingId}
      className="w-full rounded-3xl border border-white/10 bg-white/5 p-5 shadow-glass backdrop-blur-md sm:p-8"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2
            id={locationHeadingId}
            className="break-words text-xl font-semibold text-slate-100 sm:text-2xl"
          >
            {location.label}
          </h2>
          {location.isApproximate && (
            <p className="mt-2 text-sm text-accent-300">Localização aproximada</p>
          )}
        </div>

        <div role="group" aria-labelledby={temperatureHeadingId} className="min-w-0">
          <p id={temperatureHeadingId} className="text-sm font-medium text-slate-300">
            Temperatura atual
          </p>
          <div className="mt-1 flex min-w-0 items-center gap-3 sm:gap-5">
            <span className="shrink-0 text-5xl sm:text-6xl" aria-hidden="true">
              {getWeatherSymbol(current?.condition?.code)}
            </span>
            <p className="min-w-0 break-words text-5xl font-bold leading-none tracking-tight text-white sm:text-6xl md:text-7xl">
              {formatTemperatureValue(current?.temperatureC, unit)}
            </p>
          </div>
          <p className="mt-3 text-base font-medium text-slate-200 sm:text-lg">
            Condição: {condition}
          </p>
        </div>
      </div>

      <dl
        aria-label="Métricas do clima atual"
        className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      >
        {metrics.map((metric) => {
          const labelId = `${metricHeadingId}-${metric.id}`;

          return (
            <div
              role="group"
              aria-labelledby={labelId}
              key={metric.id}
              className="min-w-0 rounded-2xl border border-white/10 bg-night-800/60 p-4"
            >
              <dt id={labelId} className="text-sm text-slate-300">
                {metric.label}
              </dt>
              <dd className="mt-2 break-words text-lg font-semibold text-white">{metric.value}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
