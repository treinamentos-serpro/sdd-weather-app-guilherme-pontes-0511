import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import CurrentWeather from '../../../src/components/CurrentWeather';
import TemperatureUnitToggle from '../../../src/components/TemperatureUnitToggle';
import type {
  CurrentWeather as CurrentWeatherData,
  TemperatureUnit,
  WeatherLocation,
} from '../../../src/types/weather';

const recife: WeatherLocation = {
  id: 'recife',
  label: 'Recife',
  region: 'Pernambuco',
  source: 'city',
  isApproximate: false,
};

const freezingPoint: CurrentWeatherData = {
  temperatureC: 0,
  minimumC: 0,
  maximumC: 0,
  feelsLikeC: 0,
  humidityPercent: 50,
  rainProbabilityPercent: 0,
  condition: { code: 0, description: 'Céu limpo' },
};

describe('TemperatureUnitToggle', () => {
  it('exposes a named group and marks the active unit as pressed', () => {
    const onChange = vi.fn<(unit: TemperatureUnit) => void>();
    const { rerender } = render(<TemperatureUnitToggle unit="C" onChange={onChange} />);

    const group = screen.getByRole('group', { name: 'Unidade de temperatura' });
    const celsiusButton = within(group).getByRole('button', { name: 'Celsius (°C)' });
    const fahrenheitButton = within(group).getByRole('button', { name: 'Fahrenheit (°F)' });

    expect(celsiusButton).toHaveAttribute('aria-pressed', 'true');
    expect(fahrenheitButton).toHaveAttribute('aria-pressed', 'false');

    rerender(<TemperatureUnitToggle unit="F" onChange={onChange} />);

    expect(celsiusButton).toHaveAttribute('aria-pressed', 'false');
    expect(fahrenheitButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onChange with the corresponding unit when either button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(unit: TemperatureUnit) => void>();

    render(<TemperatureUnitToggle unit="C" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Fahrenheit (°F)' }));
    await user.click(screen.getByRole('button', { name: 'Celsius (°C)' }));

    expect(onChange.mock.calls).toEqual([['F'], ['C']]);
  });

  it('supports keyboard activation of both unit buttons', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(unit: TemperatureUnit) => void>();

    render(<TemperatureUnitToggle unit="C" onChange={onChange} />);

    const celsiusButton = screen.getByRole('button', { name: 'Celsius (°C)' });
    const fahrenheitButton = screen.getByRole('button', { name: 'Fahrenheit (°F)' });

    await user.tab();
    expect(celsiusButton).toHaveFocus();
    await user.keyboard('{Enter}');

    await user.tab();
    expect(fahrenheitButton).toHaveFocus();
    await user.keyboard(' ');

    expect(onChange.mock.calls).toEqual([['C'], ['F']]);
  });

  it('converts a zero-degree current temperature to 32 degrees when switched to Fahrenheit', async () => {
    function WeatherWithUnitToggle() {
      const [unit, setUnit] = useState<TemperatureUnit>('C');

      return (
        <>
          <TemperatureUnitToggle unit={unit} onChange={setUnit} />
          <CurrentWeather location={recife} current={freezingPoint} unit={unit} />
        </>
      );
    }

    const user = userEvent.setup();
    render(<WeatherWithUnitToggle />);

    expect(screen.getByRole('region', { name: 'Recife' })).toHaveTextContent('0 °C');
    await user.click(screen.getByRole('button', { name: 'Fahrenheit (°F)' }));

    expect(screen.getByRole('region', { name: 'Recife' })).toHaveTextContent('32 °F');
  });
});
