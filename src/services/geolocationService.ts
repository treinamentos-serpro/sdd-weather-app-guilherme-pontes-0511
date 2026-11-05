import type { Coordinates } from '../types/weather';

const LOCATION_TIMEOUT_MS = 30_000;

export interface BrowserLocation extends Coordinates {
  accuracyMeters: number;
}

type GeolocationErrorCode = 'unsupported' | 'denied' | 'unavailable' | 'timeout' | 'cancelled';

const errorMessages: Record<GeolocationErrorCode, string> = {
  unsupported: 'Este navegador não oferece geolocalização. Busque uma cidade.',
  denied: 'Permissão de localização negada. Autorize o acesso no navegador ou busque uma cidade.',
  unavailable: 'Não foi possível obter sua localização. Tente novamente ou busque uma cidade.',
  timeout: 'A localização demorou mais de 30 segundos. Tente novamente ou busque uma cidade.',
  cancelled: 'A solicitação de localização foi cancelada.',
};

export class GeolocationServiceError extends Error {
  constructor(public readonly code: GeolocationErrorCode) {
    super(errorMessages[code]);
    this.name = 'GeolocationServiceError';
  }
}

export function getCurrentLocation(signal?: AbortSignal): Promise<BrowserLocation> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new GeolocationServiceError('cancelled'));
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new GeolocationServiceError('unsupported'));
      return;
    }

    let settled = false;
    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onAbort);
      action();
    };
    const fail = (code: GeolocationErrorCode) =>
      finish(() => reject(new GeolocationServiceError(code)));
    const onAbort = () => fail('cancelled');
    const timeoutId = setTimeout(() => fail('timeout'), LOCATION_TIMEOUT_MS);
    signal?.addEventListener('abort', onAbort, { once: true });

    try {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const { latitude, longitude, accuracy } = coords;
          if (
            !Number.isFinite(latitude) ||
            latitude < -90 ||
            latitude > 90 ||
            !Number.isFinite(longitude) ||
            longitude < -180 ||
            longitude > 180 ||
            !Number.isFinite(accuracy) ||
            accuracy < 0
          ) {
            fail('unavailable');
            return;
          }

          finish(() => resolve({ latitude, longitude, accuracyMeters: accuracy }));
        },
        (error) => fail(error.code === 1 ? 'denied' : error.code === 3 ? 'timeout' : 'unavailable'),
        { enableHighAccuracy: false, maximumAge: 0, timeout: LOCATION_TIMEOUT_MS },
      );
    } catch (error) {
      fail(
        error instanceof DOMException && error.name === 'SecurityError' ? 'denied' : 'unavailable',
      );
    }
  });
}
