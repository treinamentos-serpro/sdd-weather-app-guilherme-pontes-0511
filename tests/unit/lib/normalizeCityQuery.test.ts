import { normalizeCityQuery } from '../../../src/lib/normalizeCityQuery';

describe('normalizeCityQuery', () => {
  it('normalizes case for case-insensitive comparisons', () => {
    expect(normalizeCityQuery('SÃO PAULO')).toBe('sao paulo');
  });

  it('removes diacritics using Unicode normalization', () => {
    expect(normalizeCityQuery('München')).toBe('munchen');
  });

  it('trims surrounding whitespace without changing internal spacing', () => {
    expect(normalizeCityQuery('  São  Paulo  ')).toBe('sao  paulo');
  });

  it.each(['', ' ', '   ', '\t\n'])('returns an empty string for blank input %j', (query) => {
    expect(normalizeCityQuery(query)).toBe('');
  });

  it('does not alter the original query text', () => {
    const query = '  São Paulo  ';

    normalizeCityQuery(query);

    expect(query).toBe('  São Paulo  ');
  });
});
