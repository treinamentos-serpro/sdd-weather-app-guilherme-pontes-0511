import { formatTemperature as formatTemperatureDisplay } from '../lib/temperature';
import { getWeatherSymbol } from '../lib/weatherCode';
import type { ForecastDay, TemperatureUnit } from '../types/weather';

interface ForecastCardProps {
  date: string;
  forecast?: ForecastDay;
  unit: TemperatureUnit;
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  timeZone: 'UTC',
});

function formatForecastDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? isoDate : dateFormatter.format(date);
}

function formatTemperature(value: number | undefined, unit: TemperatureUnit): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return `Indisponível (°${unit})`;
  }

  return formatTemperatureDisplay(value, unit);
}

function formatProbability(value: number | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
    return 'Indisponível';
  }

  return `${Math.round(value)}%`;
}

export default function ForecastCard({ date, forecast, unit }: ForecastCardProps) {
  const condition = forecast?.condition?.description.trim() || 'Condição indisponível';

  return (
    <article
      aria-labelledby={`forecast-${date}`}
      className="flex min-w-0 flex-col items-center rounded-2xl border border-white/10 bg-night-800/60 p-4 text-center"
    >
      <h3 id={`forecast-${date}`} className="font-semibold capitalize text-slate-100">
        {formatForecastDate(date)}
      </h3>
      <span className="mt-4 text-4xl" aria-hidden="true">
        {getWeatherSymbol(forecast?.condition?.code)}
      </span>
      <p className="mt-2 min-h-10 text-sm text-slate-300">{condition}</p>
      <dl className="mt-4 grid w-full grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-slate-400">Máx.</dt>
          <dd className="mt-1 font-semibold text-white">
            {formatTemperature(forecast?.maximumC, unit)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Mín.</dt>
          <dd className="mt-1 font-semibold text-white">
            {formatTemperature(forecast?.minimumC, unit)}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-slate-300">
        Chuva:{' '}
        <span className="font-semibold text-white">
          {formatProbability(forecast?.rainProbabilityPercent)}
        </span>
      </p>
    </article>
  );
}
