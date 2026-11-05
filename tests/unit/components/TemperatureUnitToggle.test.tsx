import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TemperatureUnitToggle from '../../../src/components/TemperatureUnitToggle';
import type { TemperatureUnit } from '../../../src/types/weather';

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
});
