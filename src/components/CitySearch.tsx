import { type FormEvent, useId, useState } from 'react';
import LocationButton from './LocationButton';

interface CitySearchProps {
  onSearch: (city: string) => void;
  onLocate: () => void;
  disabled?: boolean;
  busy?: boolean;
  locationPending: boolean;
}

export default function CitySearch({
  onSearch,
  onLocate,
  disabled = false,
  busy = false,
  locationPending,
}: CitySearchProps) {
  const inputId = useId();
  const validationMessageId = useId();
  const [city, setCity] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (disabled) {
      return;
    }

    const trimmedCity = city.trim();

    if (!trimmedCity) {
      setValidationMessage('Informe uma cidade para continuar.');
      return;
    }

    setValidationMessage('');
    onSearch(trimmedCity);
  };

  return (
    <form
      role="search"
      aria-label="Buscar cidade"
      aria-busy={busy}
      onSubmit={handleSubmit}
      className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md sm:p-5"
    >
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-slate-100">
        Cidade
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={inputId}
          name="city"
          type="search"
          value={city}
          onChange={(event) => {
            setCity(event.currentTarget.value);
            setValidationMessage('');
          }}
          disabled={disabled}
          aria-invalid={Boolean(validationMessage)}
          aria-describedby={validationMessage ? validationMessageId : undefined}
          placeholder="Ex.: São Paulo"
          className="h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-night-800/80 px-4 text-white placeholder:text-slate-400 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400/50 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={disabled}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-accent-500 px-5 font-semibold text-night-900 transition-colors hover:bg-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-accent-500 sm:flex-none sm:min-w-28"
          >
            Buscar
          </button>
          <LocationButton onLocate={onLocate} pending={locationPending} />
        </div>
      </div>
      {validationMessage && (
        <p id={validationMessageId} role="alert" className="mt-3 text-sm text-rose-300">
          {validationMessage}
        </p>
      )}
    </form>
  );
}
