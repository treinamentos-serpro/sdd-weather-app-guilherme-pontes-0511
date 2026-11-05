import { afterEach, beforeEach, vi } from 'vitest';
import { getCurrentLocation } from '../../../src/services/geolocationService';

const position: GeolocationPosition = {
  coords: {
    latitude: -23.55,
    longitude: -46.63,
    accuracy: 1500,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    toJSON: () => ({}),
  },
  timestamp: 0,
  toJSON: () => ({}),
};
const getCurrentPosition = vi.fn<Geolocation['getCurrentPosition']>();

beforeEach(() => {
  vi.useFakeTimers();
  getCurrentPosition.mockReset();
  vi.stubGlobal('navigator', { geolocation: { getCurrentPosition } });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('getCurrentLocation', () => {
  it('only requests a fresh position when invoked and returns coordinates and accuracy', async () => {
    expect(getCurrentPosition).not.toHaveBeenCalled();
    getCurrentPosition.mockImplementation((success) => success(position));

    await expect(getCurrentLocation()).resolves.toEqual({
      latitude: -23.55,
      longitude: -46.63,
      accuracyMeters: 1500,
    });
    expect(getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), {
      enableHighAccuracy: false,
      maximumAge: 0,
      timeout: 30_000,
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reports an unsupported browser', async () => {
    vi.stubGlobal('navigator', {});
    await expect(getCurrentLocation()).rejects.toMatchObject({ code: 'unsupported' });
  });

  it.each([
    [1, 'denied'],
    [2, 'unavailable'],
    [3, 'timeout'],
  ])('maps browser error %s to %s without retrying permission', async (code, expectedCode) => {
    getCurrentPosition.mockImplementation((_success, failure) => {
      failure?.({ code, message: '', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
    });

    await expect(getCurrentLocation()).rejects.toMatchObject({ code: expectedCode });
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('enforces 30 seconds even if the browser never invokes a callback', async () => {
    const request = getCurrentLocation();
    const rejection = expect(request).rejects.toMatchObject({ code: 'timeout' });

    await vi.advanceTimersByTimeAsync(29_999);
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);

    await rejection;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancels the request and ignores a late browser callback', async () => {
    const controller = new AbortController();
    const request = getCurrentLocation(controller.signal);
    const rejection = expect(request).rejects.toMatchObject({ code: 'cancelled' });

    controller.abort();
    getCurrentPosition.mock.calls[0][0](position);

    await rejection;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not request permission for an already cancelled operation', async () => {
    await expect(getCurrentLocation(AbortSignal.abort())).rejects.toMatchObject({
      code: 'cancelled',
    });
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it.each([
    { latitude: Number.NaN },
    { latitude: 91 },
    { longitude: -181 },
    { accuracy: -1 },
  ])('rejects invalid position data: %s', async (invalid) => {
    getCurrentPosition.mockImplementation((success) =>
      success({ ...position, coords: { ...position.coords, ...invalid } }),
    );
    await expect(getCurrentLocation()).rejects.toMatchObject({ code: 'unavailable' });
  });

  it('reports synchronous browser security failures', async () => {
    getCurrentPosition.mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    await expect(getCurrentLocation()).rejects.toMatchObject({ code: 'denied' });
    expect(vi.getTimerCount()).toBe(0);
  });
});
