import { render, screen, within } from '@testing-library/react';
import CurrentWeather from '../../../src/components/CurrentWeather';
import type {
  CurrentWeather as CurrentWeatherData,
  WeatherLocation,
} from '../../../src/types/weather';

const recife: WeatherLocation = {
  id: 'recife',
  label: 'Recife',
  region: 'Pernambuco',
  source: 'city',
  isApproximate: false,
};

const currentWeather: CurrentWeatherData = {
  temperatureC: 22,
  minimumC: 18,
  maximumC: 27,
  feelsLikeC: 22,
  humidityPercent: 63,
  rainProbabilityPercent: 20,
  condition: {
    code: 2,
    description: 'Parcialmente nublado',
  },
};

function getMetric(region: HTMLElement, label: string): HTMLElement {
  const metricGroup = within(region).getByRole('group', { name: label });
  return within(metricGroup).getByRole('definition');
}

describe('CurrentWeather', () => {
  it('identifies the city and only marks approximate locations when applicable', () => {
    const { rerender } = render(
      <CurrentWeather location={recife} current={currentWeather} unit="C" />,
    );
    const cityRegion = screen.getByRole('region', { name: 'Recife' });

    expect(within(cityRegion).getByRole('heading', { name: 'Recife' })).toBeInTheDocument();
    expect(within(cityRegion).queryByText('Localização aproximada')).not.toBeInTheDocument();

    const approximateLocation: WeatherLocation = {
      id: 'current-location',
      label: 'Local atual',
      source: 'current',
      isApproximate: true,
    };

    rerender(<CurrentWeather location={approximateLocation} current={currentWeather} unit="C" />);

    const currentLocationRegion = screen.getByRole('region', { name: 'Local atual' });
    expect(within(currentLocationRegion).getByText('Localização aproximada')).toBeInTheDocument();
  });

  it.each([
    ['C', '22 °C', '18 °C', '27 °C', '22 °C'],
    ['F', '72 °F', '64 °F', '81 °F', '72 °F'],
  ] as const)('formats the current, minimum, maximum, and feels-like temperatures in °%s', (unit, currentValue, minimumValue, maximumValue, feelsLikeValue) => {
    render(<CurrentWeather location={recife} current={currentWeather} unit={unit} />);

    const currentRegion = screen.getByRole('region', { name: 'Recife' });
    expect(
      within(currentRegion).getByRole('group', { name: 'Temperatura atual' }),
    ).toHaveTextContent(currentValue);
    expect(getMetric(currentRegion, 'Temperatura mínima')).toHaveTextContent(minimumValue);
    expect(getMetric(currentRegion, 'Temperatura máxima')).toHaveTextContent(maximumValue);
    expect(getMetric(currentRegion, 'Sensação térmica')).toHaveTextContent(feelsLikeValue);
  });

  it('shows the condition, humidity, and rain probability with their meanings', () => {
    render(<CurrentWeather location={recife} current={currentWeather} unit="C" />);

    const currentRegion = screen.getByRole('region', { name: 'Recife' });
    expect(within(currentRegion).getByText('Condição: Parcialmente nublado')).toBeInTheDocument();
    expect(getMetric(currentRegion, 'Umidade')).toHaveTextContent('63%');
    expect(getMetric(currentRegion, 'Probabilidade de chuva')).toHaveTextContent('20%');
  });

  it('indicates unavailable data when the current weather is absent', () => {
    render(<CurrentWeather location={recife} unit="C" />);

    const currentRegion = screen.getByRole('region', { name: 'Recife' });
    expect(
      within(currentRegion).getByRole('group', { name: 'Temperatura atual' }),
    ).toHaveTextContent('Indisponível (°C)');
    expect(within(currentRegion).getByText('Condição: Indisponível')).toBeInTheDocument();
    expect(getMetric(currentRegion, 'Temperatura mínima')).toHaveTextContent('Indisponível (°C)');
    expect(getMetric(currentRegion, 'Temperatura máxima')).toHaveTextContent('Indisponível (°C)');
    expect(getMetric(currentRegion, 'Sensação térmica')).toHaveTextContent('Indisponível (°C)');
    expect(getMetric(currentRegion, 'Umidade')).toHaveTextContent('Indisponível');
    expect(getMetric(currentRegion, 'Probabilidade de chuva')).toHaveTextContent('Indisponível');
  });

  it('marks invalid values and blank conditions as unavailable instead of zero', () => {
    const invalidWeather: CurrentWeatherData = {
      temperatureC: Number.NaN,
      minimumC: Number.NEGATIVE_INFINITY,
      maximumC: Number.POSITIVE_INFINITY,
      feelsLikeC: Number.NaN,
      humidityPercent: -1,
      rainProbabilityPercent: 101,
      condition: {
        code: Number.NaN,
        description: 'Condição inválida',
      },
    };

    render(<CurrentWeather location={recife} current={invalidWeather} unit="F" />);

    const currentRegion = screen.getByRole('region', { name: 'Recife' });
    expect(
      within(currentRegion).getByRole('group', { name: 'Temperatura atual' }),
    ).toHaveTextContent('Indisponível (°F)');
    expect(within(currentRegion).getByText('Condição: Indisponível')).toBeInTheDocument();
    expect(getMetric(currentRegion, 'Temperatura mínima')).toHaveTextContent('Indisponível (°F)');
    expect(getMetric(currentRegion, 'Temperatura máxima')).toHaveTextContent('Indisponível (°F)');
    expect(getMetric(currentRegion, 'Sensação térmica')).toHaveTextContent('Indisponível (°F)');
    expect(getMetric(currentRegion, 'Umidade')).toHaveTextContent('Indisponível');
    expect(getMetric(currentRegion, 'Probabilidade de chuva')).toHaveTextContent('Indisponível');
  });
});
