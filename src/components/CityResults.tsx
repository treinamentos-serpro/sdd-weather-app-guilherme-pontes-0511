import { useId } from 'react';
import type { City } from '../types/weather';

interface CityResultsProps {
  cities: City[];
  onSelect: (city: City) => void;
}

export default function CityResults({ cities, onSelect }: CityResultsProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md sm:p-5"
    >
      <h2 id={headingId} className="mb-3 text-base font-semibold text-slate-100">
        Resultados da busca
      </h2>
      {cities.length === 0 ? (
        <p role="status" className="text-sm text-slate-300">
          Nenhuma cidade encontrada.
        </p>
      ) : (
        <ul aria-labelledby={headingId} className="grid gap-3 sm:grid-cols-2">
          {cities.map((city) => {
            const metadata = [city.region, city.country].filter(Boolean).join(', ');

            return (
              <li key={city.id}>
                <button
                  type="button"
                  onClick={() => onSelect(city)}
                  className="flex min-h-12 w-full items-center rounded-xl border border-white/10 bg-night-800/60 px-4 py-3 text-left transition-colors hover:border-accent-400/50 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900"
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="break-words font-semibold text-white">{city.name}</span>
                    {metadata && <span className="text-sm text-slate-300">{metadata}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
