import { useCallback, useState } from 'react';
import type { TemperatureUnit } from '../types/weather';

const STORAGE_KEY = 'weather-app:temperature-unit';

interface TemperatureUnitPreference {
  unit: TemperatureUnit;
  error?: string;
}

function readPreference(): TemperatureUnitPreference {
  try {
    return {
      unit: window.localStorage.getItem(STORAGE_KEY) === 'F' ? 'F' : 'C',
    };
  } catch {
    return {
      unit: 'C',
      error: 'Não foi possível restaurar a unidade de temperatura salva.',
    };
  }
}

export function useTemperatureUnit(): {
  unit: TemperatureUnit;
  setUnit: (unit: TemperatureUnit) => void;
  persistenceError?: string;
} {
  const [preference, setPreference] = useState(readPreference);

  const setUnit = useCallback((unit: TemperatureUnit) => {
    let error: string | undefined;

    try {
      window.localStorage.setItem(STORAGE_KEY, unit);
    } catch {
      error = 'Não foi possível salvar a unidade de temperatura escolhida.';
    }

    setPreference({ unit, error });
  }, []);

  return {
    unit: preference.unit,
    setUnit,
    persistenceError: preference.error,
  };
}
