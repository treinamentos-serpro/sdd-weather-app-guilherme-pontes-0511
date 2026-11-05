import { render, screen, within } from '@testing-library/react';
import ForecastList from '../../../src/components/ForecastList';

const expectedDates = ['2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10'];

describe('ForecastList', () => {
  it('renders five expected dates and marks missing forecasts as unavailable', () => {
    render(
      <ForecastList
        expectedDates={expectedDates}
        forecast={[
          {
            date: expectedDates[0]!,
            minimumC: 19,
            maximumC: 27,
            rainProbabilityPercent: 10,
            condition: { code: 1, description: 'Poucas nuvens' },
          },
        ]}
        unit="C"
      />,
    );

    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
    expect(within(list).getByRole('heading', { name: '06 de nov.' })).toBeInTheDocument();
    expect(within(list).getByText('Poucas nuvens')).toBeInTheDocument();
    expect(within(list).getAllByText('Indisponível (°C)')).toHaveLength(8);
    expect(within(list).getAllByText('Indisponível')).toHaveLength(4);
  });

  it('converts forecast temperatures to the selected unit', () => {
    render(
      <ForecastList
        expectedDates={[expectedDates[0]!]}
        forecast={[
          {
            date: expectedDates[0]!,
            minimumC: 0,
            maximumC: 20,
            rainProbabilityPercent: 15,
            condition: { code: 0, description: 'Céu limpo' },
          },
        ]}
        unit="F"
      />,
    );

    const card = screen.getByRole('article', { name: '06 de nov.' });
    expect(within(card).getByText('32 °F')).toBeInTheDocument();
    expect(within(card).getByText('68 °F')).toBeInTheDocument();
    expect(within(card).getByText('15%')).toBeInTheDocument();
  });
});
