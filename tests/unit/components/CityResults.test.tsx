import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CityResults from '../../../src/components/CityResults';
import type { City } from '../../../src/types/weather';

const recife: City = {
  id: 1,
  name: 'Recife',
  region: 'Pernambuco',
  country: 'Brasil',
  latitude: -8.05,
  longitude: -34.9,
};

const curitiba: City = {
  id: 2,
  name: 'Curitiba',
  region: 'Paraná',
  country: 'Brasil',
  latitude: -25.43,
  longitude: -49.27,
};

const cityWithoutMetadata: City = {
  id: 3,
  name: 'Palmas',
  latitude: -10.18,
  longitude: -48.33,
};

describe('CityResults', () => {
  it('renders cities in an accessible list without selecting one automatically', () => {
    const onSelect = vi.fn<(city: City) => void>();

    render(<CityResults cities={[recife, curitiba]} onSelect={onSelect} />);

    const list = screen.getByRole('list', { name: 'Resultados da busca' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(within(list).getByRole('button', { name: /Recife/ })).toBeInTheDocument();
    expect(within(list).getByRole('button', { name: /Curitiba/ })).toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows available region and country metadata and omits absent metadata', () => {
    render(<CityResults cities={[recife, cityWithoutMetadata]} onSelect={() => {}} />);

    expect(screen.getByText('Pernambuco, Brasil')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Palmas' })).toBeInTheDocument();
  });

  it('passes the city activated by click to the selection callback', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn<(city: City) => void>();

    render(<CityResults cities={[recife, curitiba]} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: /Curitiba/ }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(curitiba);
    expect(onSelect.mock.calls[0]?.[0]).toBe(curitiba);
  });

  it('passes the city activated by keyboard to the selection callback', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn<(city: City) => void>();

    render(<CityResults cities={[recife]} onSelect={onSelect} />);

    const resultButton = screen.getByRole('button', { name: /Recife/ });
    await user.tab();
    expect(resultButton).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0]).toBe(recife);
  });

  it('announces when there are no results', () => {
    const onSelect = vi.fn<(city: City) => void>();

    render(<CityResults cities={[]} onSelect={onSelect} />);

    expect(screen.getByRole('status')).toHaveTextContent('Nenhuma cidade encontrada.');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
