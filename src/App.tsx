import { useEffect, useRef } from 'react';
import CityResults from './components/CityResults';
import CitySearch from './components/CitySearch';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import LocationButton from './components/LocationButton';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import TemperatureUnitToggle from './components/TemperatureUnitToggle';
import { useTemperatureUnit } from './hooks/useTemperatureUnit';
import { useWeather } from './hooks/useWeather';

export default function App() {
  const { unit, setUnit, persistenceError } = useTemperatureUnit();
  const weather = useWeather();
  const { state } = weather;
  const resultsRef = useRef<HTMLDivElement>(null);
  const isLoading =
    state.status === 'searching' ||
    state.status === 'locating' ||
    state.status === 'loadingWeather';

  useEffect(() => {
    if (
      state.status === 'results' ||
      state.status === 'empty' ||
      state.status === 'ready' ||
      state.status === 'error'
    ) {
      resultsRef.current?.focus();
    }
  }, [state.status]);

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
              <CitySearch onSearch={weather.search} busy={isLoading} />
              <div className="mt-3">
                <LocationButton
                  onLocate={weather.useCurrentLocation}
                  pending={
                    state.status === 'locating' ||
                    (state.status === 'loadingWeather' && state.source === 'current')
                  }
                />
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <TemperatureUnitToggle unit={unit} onChange={setUnit} />
              {persistenceError && (
                <p role="alert" className="text-sm text-rose-300">
                  {persistenceError}
                </p>
              )}
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-8">
          <div
            ref={resultsRef}
            role="region"
            aria-label="Resultado da consulta"
            tabIndex={-1}
            className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900"
          >
            {state.status === 'searching' && <LoadingState message="Buscando cidades..." />}
            {state.status === 'loadingWeather' && (
              <LoadingState
                message={
                  state.source === 'current'
                    ? 'Carregando o clima da localização atual...'
                    : 'Carregando o clima da cidade...'
                }
              />
            )}
            {state.status === 'locating' && <LoadingState message="Obtendo sua localização..." />}
            {(state.status === 'results' ||
              (state.status === 'error' && state.cities.length > 0)) && (
              <CityResults cities={state.cities} onSelect={weather.selectCity} />
            )}
            {state.status === 'error' && (
              <ErrorState message={state.message} onRetry={weather.retry} />
            )}
            {state.status === 'empty' && (
              <EmptyState
                title="Cidade não encontrada"
                description="Nenhuma cidade foi encontrada. Confira o nome ou tente outra busca."
              />
            )}
            {state.status === 'idle' && (
              <EmptyState
                title="Encontre o clima da sua cidade"
                description="Use a busca acima para começar."
              />
            )}
            {state.status === 'ready' && (
              <>
                <CurrentWeather
                  location={state.location}
                  current={state.snapshot.current}
                  unit={unit}
                />
                <ForecastList
                  expectedDates={state.snapshot.expectedDates}
                  forecast={state.snapshot.nextFiveDays}
                  unit={unit}
                />
              </>
            )}
          </div>
        </main>

        <footer className="mt-8 border-t border-white/10 pt-4 text-sm text-slate-400">
          Dados meteorológicos fornecidos pela Open-Meteo.
        </footer>
      </div>
    </div>
  );
}
