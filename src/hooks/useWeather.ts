import { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrentLocation, GeolocationServiceError } from '../services/geolocationService';
import { getWeather, searchCities, WeatherServiceError } from '../services/openMeteoService';
import type { City, WeatherLocation, WeatherSnapshot } from '../types/weather';

const OPERATION_TIMEOUT_MS = 30_000;

type WeatherState =
  | { status: 'idle'; query: ''; cities: [] }
  | { status: 'searching'; query: string; cities: [] }
  | { status: 'results'; query: string; cities: City[] }
  | { status: 'locating'; query: string; cities: [] }
  | { status: 'loadingWeather'; query: string; cities: City[]; source: 'city' | 'current' }
  | {
      status: 'ready';
      query: string;
      cities: City[];
      location: WeatherLocation;
      snapshot: WeatherSnapshot;
    }
  | { status: 'empty'; query: string; cities: [] }
  | { status: 'error'; query: string; cities: City[]; message: string };

type LastAction =
  | { type: 'search'; query: string }
  | { type: 'selectCity'; city: City }
  | { type: 'currentLocation' };

interface ActiveOperation {
  id: number;
  controller: AbortController;
  timeoutId: ReturnType<typeof setTimeout>;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof WeatherServiceError || error instanceof GeolocationServiceError) {
    return error.message;
  }

  return 'Ocorreu um erro inesperado. Tente novamente.';
}

async function withRetry<T>(request: () => Promise<T>, signal: AbortSignal): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }

    return request();
  }
}

function toWeatherLocation(city: City): WeatherLocation {
  return {
    id: String(city.id),
    label: city.name,
    region: city.region,
    source: 'city',
    isApproximate: false,
  };
}

export interface UseWeatherResult {
  state: WeatherState;
  search: (name: string) => void;
  selectCity: (city: City) => void;
  useCurrentLocation: () => void;
  retry: () => void;
}

export function useWeather(): UseWeatherResult {
  const [state, setState] = useState<WeatherState>({ status: 'idle', query: '', cities: [] });
  const operationId = useRef(0);
  const activeOperation = useRef<ActiveOperation | undefined>(undefined);
  const lastAction = useRef<LastAction | undefined>(undefined);

  const beginOperation = useCallback((onTimeout: () => void): ActiveOperation => {
    activeOperation.current?.controller.abort();
    clearTimeout(activeOperation.current?.timeoutId);

    const controller = new AbortController();
    const id = ++operationId.current;
    const timeoutId = setTimeout(() => {
      controller.abort();
      if (operationId.current === id) {
        onTimeout();
      }
    }, OPERATION_TIMEOUT_MS);
    const operation = { id, controller, timeoutId };
    activeOperation.current = operation;

    return operation;
  }, []);

  const isCurrentOperation = useCallback(
    (operation: ActiveOperation) =>
      operationId.current === operation.id && !operation.controller.signal.aborted,
    [],
  );

  const finishOperation = useCallback((operation: ActiveOperation) => {
    clearTimeout(operation.timeoutId);
    if (activeOperation.current?.id === operation.id) {
      activeOperation.current = undefined;
    }
  }, []);

  const performSearch = useCallback(
    async (query: string) => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        return;
      }

      const operation = beginOperation(() => {
        setState({
          status: 'error',
          query: trimmedQuery,
          cities: [],
          message: 'A busca demorou mais de 30 segundos. Tente novamente.',
        });
      });
      setState({ status: 'searching', query: trimmedQuery, cities: [] });

      try {
        const cities = await withRetry(
          () => searchCities(trimmedQuery, operation.controller.signal),
          operation.controller.signal,
        );
        if (!isCurrentOperation(operation)) {
          return;
        }

        setState(
          cities.length > 0
            ? { status: 'results', query: trimmedQuery, cities }
            : { status: 'empty', query: trimmedQuery, cities: [] },
        );
      } catch (error) {
        if (isCurrentOperation(operation)) {
          setState({
            status: 'error',
            query: trimmedQuery,
            cities: [],
            message: getErrorMessage(error),
          });
        }
      } finally {
        finishOperation(operation);
      }
    },
    [beginOperation, finishOperation, isCurrentOperation],
  );

  const performCitySelection = useCallback(
    async (city: City, query: string) => {
      const operation = beginOperation(() => {
        setState({
          status: 'error',
          query,
          cities: [],
          message: 'A consulta do clima demorou mais de 30 segundos. Tente novamente.',
        });
      });
      setState({ status: 'loadingWeather', query, cities: [], source: 'city' });

      try {
        const snapshot = await withRetry(
          () => getWeather(city, operation.controller.signal),
          operation.controller.signal,
        );
        if (!isCurrentOperation(operation)) {
          return;
        }

        setState({
          status: 'ready',
          query,
          cities: [],
          location: toWeatherLocation(city),
          snapshot,
        });
      } catch (error) {
        if (isCurrentOperation(operation)) {
          setState({
            status: 'error',
            query,
            cities: [],
            message: getErrorMessage(error),
          });
        }
      } finally {
        finishOperation(operation);
      }
    },
    [beginOperation, finishOperation, isCurrentOperation],
  );

  const performCurrentLocation = useCallback(async () => {
    const operation = beginOperation(() => {
      setState({
        status: 'error',
        query: '',
        cities: [],
        message:
          'A consulta da localização demorou mais de 30 segundos. Tente novamente ou busque uma cidade.',
      });
    });
    setState({ status: 'locating', query: '', cities: [] });

    try {
      const location = await getCurrentLocation(operation.controller.signal);
      if (!isCurrentOperation(operation)) return;

      setState({ status: 'loadingWeather', query: '', cities: [], source: 'current' });
      const snapshot = await withRetry(
        () => getWeather(location, operation.controller.signal),
        operation.controller.signal,
      );
      if (!isCurrentOperation(operation)) return;

      setState({
        status: 'ready',
        query: '',
        cities: [],
        location: {
          id: 'current',
          label: 'Local atual',
          source: 'current',
          isApproximate: location.accuracyMeters > 0,
          accuracyMeters: location.accuracyMeters,
        },
        snapshot,
      });
    } catch (error) {
      if (isCurrentOperation(operation)) {
        setState({
          status: 'error',
          query: '',
          cities: [],
          message: getErrorMessage(error),
        });
      }
    } finally {
      finishOperation(operation);
    }
  }, [beginOperation, finishOperation, isCurrentOperation]);

  const useCurrentLocation = useCallback(() => {
    if (
      state.status === 'locating' ||
      (state.status === 'loadingWeather' && state.source === 'current')
    ) {
      return;
    }
    lastAction.current = { type: 'currentLocation' };
    void performCurrentLocation();
  }, [performCurrentLocation, state]);

  const search = useCallback(
    (name: string) => {
      const query = name.trim();
      if (!query) {
        return;
      }

      lastAction.current = { type: 'search', query };
      void performSearch(query);
    },
    [performSearch],
  );

  const selectCity = useCallback(
    (city: City) => {
      const query = state.query || city.name;
      lastAction.current = { type: 'selectCity', city };
      void performCitySelection(city, query);
    },
    [performCitySelection, state.query],
  );

  const retry = useCallback(() => {
    const action = lastAction.current;
    if (action?.type === 'search') {
      void performSearch(action.query);
    } else if (action?.type === 'selectCity') {
      void performCitySelection(action.city, state.query || action.city.name);
    } else if (action?.type === 'currentLocation') {
      void performCurrentLocation();
    }
  }, [performCitySelection, performCurrentLocation, performSearch, state.query]);

  useEffect(
    () => () => {
      operationId.current += 1;
      activeOperation.current?.controller.abort();
      clearTimeout(activeOperation.current?.timeoutId);
    },
    [],
  );

  return { state, search, selectCity, useCurrentLocation, retry };
}
