import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { useWeather } from '../../../src/hooks/useWeather';
import {
  type BrowserLocation,
  getCurrentLocation,
  GeolocationServiceError,
} from '../../../src/services/geolocationService';
import { getWeather, searchCities } from '../../../src/services/openMeteoService';
import type { City, WeatherSnapshot } from '../../../src/types/weather';

vi.mock('../../../src/services/geolocationService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/services/geolocationService')>()),
  getCurrentLocation: vi.fn(),
}));
vi.mock('../../../src/services/openMeteoService', () => ({
  getWeather: vi.fn(),
  searchCities: vi.fn(),
  WeatherServiceError: class WeatherServiceError extends Error {},
}));

const location: BrowserLocation = { latitude: -23.55, longitude: -46.63, accuracyMeters: 1500 };
const city: City = { id: 1, name: 'Lisboa', latitude: 38.72, longitude: -9.14 };
const snapshot: WeatherSnapshot = {
  current: { temperatureC: 20 },
  nextFiveDays: [],
  expectedDates: [],
  fetchedAt: '2026-11-05T15:00:00.000Z',
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCurrentLocation).mockResolvedValue(location);
  vi.mocked(getWeather).mockResolvedValue(snapshot);
});

afterEach(() => vi.useRealTimers());

describe('useWeather current location', () => {
  it('requests location explicitly, blocks repeat activation and publishes no coordinates', async () => {
    const pending = deferred<BrowserLocation>();
    vi.mocked(getCurrentLocation).mockReturnValue(pending.promise);
    const { result } = renderHook(() => useWeather());
    expect(getCurrentLocation).not.toHaveBeenCalled();

    act(() => result.current.useCurrentLocation());
    expect(result.current.state.status).toBe('locating');
    act(() => result.current.useCurrentLocation());
    expect(getCurrentLocation).toHaveBeenCalledTimes(1);
    expect(getWeather).not.toHaveBeenCalled();

    await act(async () => pending.resolve(location));
    expect(result.current.state).toMatchObject({
      status: 'ready',
      location: {
        id: 'current',
        label: 'Local atual',
        source: 'current',
        isApproximate: true,
        accuracyMeters: 1500,
      },
      snapshot,
    });
    expect(getWeather).toHaveBeenCalledWith(location, expect.any(AbortSignal));
    expect(JSON.stringify(result.current.state)).not.toMatch(/latitude|longitude/);
  });

  it('does not retry permission automatically and reacquires location on manual retry', async () => {
    vi.mocked(getCurrentLocation).mockRejectedValueOnce(new GeolocationServiceError('denied'));
    const { result } = renderHook(() => useWeather());

    act(() => result.current.useCurrentLocation());
    await waitFor(() => expect(result.current.state.status).toBe('error'));
    expect(result.current.state).toMatchObject({ message: expect.stringContaining('negada') });
    expect(getCurrentLocation).toHaveBeenCalledTimes(1);
    expect(getWeather).not.toHaveBeenCalled();

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(getCurrentLocation).toHaveBeenCalledTimes(2);
  });

  it('retries the forecast once without reacquiring coordinates', async () => {
    vi.mocked(getWeather).mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useWeather());

    act(() => result.current.useCurrentLocation());
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(getWeather).toHaveBeenCalledTimes(2);
    expect(getCurrentLocation).toHaveBeenCalledTimes(1);
  });

  it('ignores a late location after selecting a city', async () => {
    const pending = deferred<BrowserLocation>();
    vi.mocked(getCurrentLocation).mockReturnValue(pending.promise);
    const { result } = renderHook(() => useWeather());

    act(() => result.current.useCurrentLocation());
    act(() => result.current.selectCity(city));
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    await act(async () => pending.resolve(location));

    expect(result.current.state).toMatchObject({ status: 'ready', location: { label: 'Lisboa' } });
    expect(getWeather).toHaveBeenCalledTimes(1);
    expect(getWeather).toHaveBeenCalledWith(city, expect.any(AbortSignal));
  });

  it('ignores a late location forecast after a city search', async () => {
    const pending = deferred<WeatherSnapshot>();
    vi.mocked(getWeather).mockReturnValue(pending.promise);
    vi.mocked(searchCities).mockResolvedValue([city]);
    const { result } = renderHook(() => useWeather());

    act(() => result.current.useCurrentLocation());
    await waitFor(() => expect(result.current.state.status).toBe('loadingWeather'));
    act(() => result.current.search('Lisboa'));
    await waitFor(() => expect(result.current.state.status).toBe('results'));
    await act(async () => pending.resolve(snapshot));

    expect(result.current.state).toMatchObject({ status: 'results', cities: [city] });
  });

  it('hides previous weather during location loading and after failure', async () => {
    const pending = deferred<BrowserLocation>();
    const { result } = renderHook(() => useWeather());
    act(() => result.current.selectCity(city));
    await waitFor(() => expect(result.current.state.status).toBe('ready'));

    vi.mocked(getCurrentLocation).mockReturnValue(pending.promise);
    act(() => result.current.useCurrentLocation());
    expect(result.current.state).not.toHaveProperty('snapshot');
    vi.mocked(getWeather).mockRejectedValue(new Error('offline'));
    await act(async () => pending.resolve(location));
    expect(result.current.state.status).toBe('error');
    expect(result.current.state).not.toHaveProperty('snapshot');
  });

  it('ends the full location operation at 30 seconds and ignores late responses', async () => {
    vi.useFakeTimers();
    const pending = deferred<WeatherSnapshot>();
    vi.mocked(getWeather).mockReturnValue(pending.promise);
    const { result } = renderHook(() => useWeather());
    await act(async () => result.current.useCurrentLocation());

    await act(async () => vi.advanceTimersByTimeAsync(30_000));
    expect(result.current.state).toMatchObject({
      status: 'error',
      message: expect.stringContaining('30 segundos'),
    });
    await act(async () => pending.resolve(snapshot));
    expect(result.current.state.status).toBe('error');
  });

  it('aborts pending location acquisition on unmount', () => {
    const pending = deferred<BrowserLocation>();
    vi.mocked(getCurrentLocation).mockReturnValue(pending.promise);
    const { result, unmount } = renderHook(() => useWeather());
    act(() => result.current.useCurrentLocation());
    const signal = vi.mocked(getCurrentLocation).mock.calls[0][0];
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
