import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { useWeather } from '../../../src/hooks/useWeather';
import { getWeather, searchCities } from '../../../src/services/openMeteoService';
import type { City, WeatherSnapshot } from '../../../src/types/weather';

vi.mock('../../../src/services/openMeteoService', () => ({
  getWeather: vi.fn(),
  searchCities: vi.fn(),
  WeatherServiceError: class WeatherServiceError extends Error {},
}));

const firstCity: City = {
  id: 1,
  name: 'Lisboa',
  latitude: 38.72,
  longitude: -9.14,
};
const secondCity: City = {
  id: 2,
  name: 'Porto',
  latitude: 41.15,
  longitude: -8.61,
};
const snapshot: WeatherSnapshot = {
  current: { temperatureC: 20 },
  nextFiveDays: [],
  expectedDates: [],
  fetchedAt: '2026-11-05T15:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useWeather', () => {
  it('searches and only loads weather after a city is selected', async () => {
    vi.mocked(searchCities).mockResolvedValue([firstCity]);
    vi.mocked(getWeather).mockResolvedValue(snapshot);
    const { result } = renderHook(() => useWeather());

    act(() => result.current.search('  Lisboa  '));
    await waitFor(() => expect(result.current.state.status).toBe('results'));
    expect(getWeather).not.toHaveBeenCalled();

    act(() => result.current.selectCity(firstCity));
    await waitFor(() => expect(result.current.state.status).toBe('ready'));
    expect(getWeather).toHaveBeenCalledWith(firstCity, expect.any(AbortSignal));

    if (result.current.state.status === 'ready') {
      expect(result.current.state.location.label).toBe('Lisboa');
      expect(result.current.state.snapshot).toBe(snapshot);
    }
  });

  it('retries one failed request and keeps empty results distinct from errors', async () => {
    vi.mocked(searchCities)
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce([firstCity])
      .mockResolvedValueOnce([]);
    const { result } = renderHook(() => useWeather());

    act(() => result.current.search('Lisboa'));
    await waitFor(() => expect(result.current.state.status).toBe('results'));
    expect(searchCities).toHaveBeenCalledTimes(2);

    act(() => result.current.search('Atlantis'));
    await waitFor(() => expect(result.current.state.status).toBe('empty'));
    expect(searchCities).toHaveBeenCalledTimes(3);
  });

  it('ignores a weather response after a newer search begins', async () => {
    let resolveWeather: (value: WeatherSnapshot) => void = () => undefined;
    vi.mocked(searchCities).mockResolvedValueOnce([firstCity]).mockResolvedValueOnce([secondCity]);
    vi.mocked(getWeather).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveWeather = resolve;
        }),
    );
    const { result } = renderHook(() => useWeather());

    act(() => result.current.search('Lisboa'));
    await waitFor(() => expect(result.current.state.status).toBe('results'));
    act(() => result.current.selectCity(firstCity));
    await waitFor(() => expect(result.current.state.status).toBe('loadingWeather'));

    act(() => result.current.search('Porto'));
    await waitFor(() => expect(result.current.state.status).toBe('results'));
    await act(async () => resolveWeather(snapshot));

    expect(result.current.state.status).toBe('results');
    if (result.current.state.status === 'results') {
      expect(result.current.state.cities).toEqual([secondCity]);
    }
  });

  it('repeats the last failed action when retry is activated', async () => {
    vi.mocked(searchCities).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useWeather());

    act(() => result.current.search('Lisboa'));
    await waitFor(() => expect(result.current.state.status).toBe('error'));
    act(() => result.current.retry());
    await waitFor(() => expect(searchCities).toHaveBeenCalledTimes(4));
    expect(result.current.state.status).toBe('error');
  });

  it('ends an unresponsive request with a timeout error', async () => {
    vi.useFakeTimers();
    vi.mocked(searchCities).mockImplementation(
      (_query, signal) =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
          );
        }),
    );
    const { result, unmount } = renderHook(() => useWeather());

    act(() => result.current.search('Lisboa'));
    expect(result.current.state.status).toBe('searching');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(result.current.state).toMatchObject({
      status: 'error',
      message: 'A busca demorou mais de 30 segundos. Tente novamente.',
    });
    unmount();
  });
});
