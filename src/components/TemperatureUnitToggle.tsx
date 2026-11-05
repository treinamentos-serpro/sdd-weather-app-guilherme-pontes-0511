import type { TemperatureUnit } from '../types/weather';

interface TemperatureUnitToggleProps {
  unit: TemperatureUnit;
  onChange(unit: TemperatureUnit): void;
}

export default function TemperatureUnitToggle({
  unit,
  onChange,
}: TemperatureUnitToggleProps) {
  return (
    <div
      role="group"
      aria-label="Unidade de temperatura"
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 shadow-glass backdrop-blur-md"
    >
      <button
        type="button"
        aria-label="Celsius (°C)"
        aria-pressed={unit === 'C'}
        onClick={() => onChange('C')}
        className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900 ${
          unit === 'C'
            ? 'bg-accent-500 text-night-900'
            : 'text-slate-200 hover:bg-white/10 hover:text-white'
        }`}
      >
        °C
      </button>
      <button
        type="button"
        aria-label="Fahrenheit (°F)"
        aria-pressed={unit === 'F'}
        onClick={() => onChange('F')}
        className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900 ${
          unit === 'F'
            ? 'bg-accent-500 text-night-900'
            : 'text-slate-200 hover:bg-white/10 hover:text-white'
        }`}
      >
        °F
      </button>
    </div>
  );
}
