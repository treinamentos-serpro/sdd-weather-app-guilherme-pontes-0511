import {
  formatIsoDatePtBr,
  getCurrentDateInSaoPaulo,
  getNextFiveDatesInSaoPaulo,
} from '../../../src/lib/date';

describe('forecast date utilities', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns exactly the five dates after today using the controlled clock', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-05T15:00:00.000Z'));

    const referenceDate = new Date();
    const dates = getNextFiveDatesInSaoPaulo(referenceDate);

    expect(getCurrentDateInSaoPaulo(referenceDate)).toBe('2026-11-05');
    expect(dates).toEqual(['2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10']);
    expect(dates).toHaveLength(5);
    expect(new Set(dates).size).toBe(5);
    expect(dates).not.toContain('2026-11-05');
  });

  it('keeps the previous Sao Paulo date just after the UTC day changes', () => {
    const referenceDate = new Date('2026-11-06T00:30:00.000Z');

    expect(getCurrentDateInSaoPaulo(referenceDate)).toBe('2026-11-05');
    expect(getNextFiveDatesInSaoPaulo(referenceDate)).toEqual([
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
      '2026-11-09',
      '2026-11-10',
    ]);
  });

  it('continues chronologically across a year boundary', () => {
    const referenceDate = new Date('2026-12-31T15:00:00.000Z');

    expect(getNextFiveDatesInSaoPaulo(referenceDate)).toEqual([
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
      '2027-01-04',
      '2027-01-05',
    ]);
  });

  it('formats an ISO date as a pt-BR calendar date without timezone shifting', () => {
    expect(formatIsoDatePtBr('2026-11-05')).toBe('05/11/2026');
  });
});
