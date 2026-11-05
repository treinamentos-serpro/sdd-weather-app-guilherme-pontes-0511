import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CitySearch from '../../../src/components/CitySearch';

describe('CitySearch', () => {
  it('submits a trimmed city when the search button is clicked', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn<(city: string) => void>();

    render(<CitySearch onSearch={onSearch} />);

    expect(screen.getByRole('search', { name: 'Buscar cidade' })).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), '  Recife  ');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('Recife');
  });

  it('submits the city when Enter is pressed', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn<(city: string) => void>();

    render(<CitySearch onSearch={onSearch} />);

    const cityInput = screen.getByRole('searchbox', { name: 'Cidade' });
    await user.type(cityInput, 'São Paulo');
    await user.keyboard('{Enter}');

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('São Paulo');
  });

  it('announces that a city is required for empty and whitespace-only input', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn<(city: string) => void>();

    render(<CitySearch onSearch={onSearch} />);

    const cityInput = screen.getByRole('searchbox', { name: 'Cidade' });
    const searchButton = screen.getByRole('button', { name: 'Buscar' });

    await user.click(searchButton);

    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Informe uma cidade para continuar.');

    await user.type(cityInput, '   ');
    await user.click(searchButton);

    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Informe uma cidade para continuar.');
  });

  it('keeps the typed city when disabled', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn<(city: string) => void>();
    const { rerender } = render(<CitySearch onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), 'Manaus');
    rerender(<CitySearch onSearch={onSearch} disabled />);

    expect(screen.getByRole('searchbox', { name: 'Cidade' })).toHaveValue('Manaus');
    expect(screen.getByRole('searchbox', { name: 'Cidade' })).toBeDisabled();
    const searchButton = screen.getByRole('button', { name: 'Buscar' });
    expect(searchButton).toBeDisabled();

    await user.click(searchButton);
    expect(onSearch).not.toHaveBeenCalled();
  });
});
