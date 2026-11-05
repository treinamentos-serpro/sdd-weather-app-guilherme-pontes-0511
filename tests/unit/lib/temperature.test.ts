import {
  convertTemperature,
  fahrenheitToCelsius,
  formatTemperature,
} from '../../../src/lib/temperature';

describe('temperature utilities', () => {
  it('converts Celsius to the selected unit without changing the Celsius value', () => {
    const celsius = 20.4;

    expect(convertTemperature(celsius, 'C')).toBe(celsius);
    expect(convertTemperature(celsius, 'F')).toBeCloseTo(68.72);
    expect(celsius).toBe(20.4);
  });

  it('converts Fahrenheit back to Celsius', () => {
    expect(fahrenheitToCelsius(68)).toBeCloseTo(20);

    const celsius = 20.4;
    expect(fahrenheitToCelsius(convertTemperature(celsius, 'F'))).toBeCloseTo(celsius);
  });

  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
  ])('converts %i °C to %i °F', (celsius, fahrenheit) => {
    expect(convertTemperature(celsius, 'F')).toBe(fahrenheit);
  });

  it('rounds positive and negative half values with Math.round semantics', () => {
    expect(formatTemperature(1.5, 'C')).toBe('2 °C');
    expect(formatTemperature(-1.5, 'C')).toBe('-1 °C');
  });

  it('formats each unit from the original Celsius value', () => {
    const celsius = 20.4;

    expect(formatTemperature(celsius, 'F')).toBe('69 °F');
    expect(formatTemperature(celsius, 'C')).toBe('20 °C');
  });
});
