import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App';

describe('App', () => {
  it('shows the mock current weather and five-day forecast', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Weather App' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'São Paulo' })).toHaveTextContent('22 °C');
    expect(screen.getAllByRole('article')).toHaveLength(5);
  });

  it('updates current conditions and the forecast when the unit changes', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Fahrenheit (°F)' }));

    expect(screen.getByRole('region', { name: 'São Paulo' })).toHaveTextContent('72 °F');
    const forecast = screen.getByRole('region', {
      name: 'Previsão para os próximos cinco dias',
    });
    expect(within(forecast).getByRole('article', { name: '06 de nov.' })).toHaveTextContent(
      '81 °F',
    );
  });

  it('shows an empty state for a city outside the mock dataset', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), 'Manaus');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(screen.getByRole('status')).toHaveTextContent('Cidade não encontrada');
    expect(screen.queryByRole('region', { name: 'São Paulo' })).not.toBeInTheDocument();
  });

  it('returns to the mock city when its name is searched without accent sensitivity', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), 'Sao Paulo');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(screen.getByRole('region', { name: 'São Paulo' })).toBeInTheDocument();
  });
});
