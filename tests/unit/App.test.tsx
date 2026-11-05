import { beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getWeather, searchCities } from '../../src/services/openMeteoService';
import App from '../../src/App';
import { mockWeather } from '../../src/mocks/mockWeather';
import type { City } from '../../src/types/weather';

vi.mock('../../src/services/openMeteoService', () => ({
  getWeather: vi.fn(),
  searchCities: vi.fn(),
  WeatherServiceError: class WeatherServiceError extends Error {},
}));

const saoPaulo: City = {
  id: 1,
  name: 'São Paulo',
  region: 'São Paulo',
  country: 'Brasil',
  latitude: -23.55,
  longitude: -46.63,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(searchCities).mockResolvedValue([saoPaulo]);
  vi.mocked(getWeather).mockResolvedValue(mockWeather.snapshot);
});

describe('App', () => {
  it('does not show mock weather before a city is selected', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Weather App' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Encontre o clima da sua cidade');
    expect(screen.queryByRole('region', { name: 'São Paulo' })).not.toBeInTheDocument();
  });

  it('loads the selected city and converts its weather when the unit changes', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), 'São Paulo');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    await user.click(await screen.findByRole('button', { name: /São Paulo/ }));

    expect(await screen.findByRole('region', { name: 'São Paulo' })).toHaveTextContent('22 °C');
    expect(getWeather).toHaveBeenCalledWith(saoPaulo, expect.any(AbortSignal));
    expect(screen.getAllByRole('article')).toHaveLength(5);

    await user.click(screen.getByRole('button', { name: 'Fahrenheit (°F)' }));

    expect(screen.getByRole('region', { name: 'São Paulo' })).toHaveTextContent('72 °F');
    const forecast = screen.getByRole('region', {
      name: 'Previsão para os próximos cinco dias',
    });
    expect(within(forecast).getByRole('article', { name: '06 de nov.' })).toHaveTextContent(
      '81 °F',
    );
    expect(getWeather).toHaveBeenCalledTimes(1);
  });

  it('shows an empty state when the search returns no cities', async () => {
    vi.mocked(searchCities).mockResolvedValue([]);
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), 'Manaus');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Cidade não encontrada');
    expect(getWeather).not.toHaveBeenCalled();
  });
});
