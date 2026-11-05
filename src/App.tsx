import { useState } from 'react';
import CitySearch from './components/CitySearch';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import TemperatureUnitToggle from './components/TemperatureUnitToggle';
import { normalizeCityQuery } from './lib/normalizeCityQuery';
import { mockWeather } from './mocks/mockWeather';
import type { TemperatureUnit } from './types/weather';

type AppStatus = 'idle' | 'loading' | 'empty' | 'error' | 'success';

export default function App() {
  const [unit, setUnit] = useState<TemperatureUnit>('C');
  const [status, setStatus] = useState<AppStatus>('success');

  const handleSearch = (city: string) => {
    const requestedCity = normalizeCityQuery(city);
    const mockCity = normalizeCityQuery(mockWeather.location.label);

    setStatus(requestedCity === mockCity ? 'success' : 'empty');
  };

  return (
    <div className="min-h-screen bg-night-900 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">
              ☀️
            </span>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-400">
                Clima em foco
              </p>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Weather App</h1>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:flex-1 sm:flex-row sm:items-center sm:justify-end">
            <div className="min-w-0 sm:w-full sm:max-w-md">
              <CitySearch onSearch={handleSearch} disabled={status === 'loading'} />
            </div>
            <TemperatureUnitToggle unit={unit} onChange={setUnit} />
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-8">
          {status === 'loading' && <LoadingState />}
          {status === 'error' && (
            <ErrorState
              message="O serviço de previsão está indisponível no momento."
              onRetry={() => setStatus('success')}
            />
          )}
          {status === 'empty' && (
            <EmptyState
              title="Cidade não encontrada"
              description="No modo de demonstração, tente buscar por São Paulo."
            />
          )}
          {status === 'idle' && (
            <EmptyState
              title="Encontre o clima da sua cidade"
              description="Use a busca acima para começar."
            />
          )}
          {status === 'success' && (
            <>
              <CurrentWeather
                location={mockWeather.location}
                current={mockWeather.snapshot.current}
                unit={unit}
              />
              <ForecastList
                expectedDates={mockWeather.snapshot.expectedDates}
                forecast={mockWeather.snapshot.nextFiveDays}
                unit={unit}
              />
            </>
          )}
        </main>

        <footer className="mt-8 border-t border-white/10 pt-4 text-sm text-slate-400">
          Dados de demonstração para desenvolver a interface.
        </footer>
      </div>
    </div>
  );
}
