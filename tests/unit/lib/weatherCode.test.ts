import { getWeatherSymbol, mapWeatherCode } from '../../../src/lib/weatherCode';

describe('mapWeatherCode', () => {
  it.each([
    [0, 'Céu limpo'],
    [2, 'Parcialmente nublado'],
    [3, 'Nublado'],
    [61, 'Chuva fraca'],
    [95, 'Trovoada fraca ou moderada'],
  ])('maps WMO code %i to its Portuguese condition', (code, description) => {
    expect(mapWeatherCode(code)).toEqual({ code, description });
  });

  describe('getWeatherSymbol', () => {
    it.each([
      [0, '☀️'],
      [3, '☁️'],
      [61, '🌧️'],
      [81, '🌦️'],
      [75, '❄️'],
      [95, '⛈️'],
    ])('returns a symbol for weather code %i', (code, symbol) => {
      expect(getWeatherSymbol(code)).toBe(symbol);
    });

    it('uses a neutral symbol when the code is unavailable or unsupported', () => {
      expect(getWeatherSymbol()).toBe('🌡️');
      expect(getWeatherSymbol(999)).toBe('🌡️');
    });
  });

  it('returns undefined when the code is omitted', () => {
    expect(mapWeatherCode()).toBeUndefined();
  });

  it('returns undefined for an unsupported code', () => {
    expect(mapWeatherCode(999)).toBeUndefined();
  });
});
