import { useId } from 'react';
import type { ForecastDay, TemperatureUnit } from '../types/weather';
import ForecastCard from './ForecastCard';

interface ForecastListProps {
  expectedDates: string[];
  forecast: ForecastDay[];
  unit: TemperatureUnit;
}

export default function ForecastList({ expectedDates, forecast, unit }: ForecastListProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-4 text-xl font-semibold text-white sm:text-2xl">
        Previsão para os próximos cinco dias
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {expectedDates.map((date) => (
          <li key={date} className="min-w-0">
            <ForecastCard
              date={date}
              forecast={forecast.find((day) => day.date === date)}
              unit={unit}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
