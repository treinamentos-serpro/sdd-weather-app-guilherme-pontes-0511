const SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo';
const FORECAST_DAYS = 5;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const saoPauloDateFormatter = new Intl.DateTimeFormat('en-US', {
  calendar: 'gregory',
  day: '2-digit',
  month: '2-digit',
  numberingSystem: 'latn',
  timeZone: SAO_PAULO_TIME_ZONE,
  year: 'numeric',
});

const ptBrDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
  year: 'numeric',
});

function getDatePart(parts: Intl.DateTimeFormatPart[], type: 'day' | 'month' | 'year'): string {
  const value = parts.find((part) => part.type === type)?.value;

  if (value === undefined) {
    throw new RangeError(`Não foi possível obter a parte "${type}" da data.`);
  }

  return value;
}

function parseIsoCalendarDate(isoDate: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);

  if (match === null) {
    throw new RangeError('A data deve usar o formato ISO AAAA-MM-DD.');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError('A data ISO informada não é válida.');
  }

  return date;
}

export function getCurrentDateInSaoPaulo(referenceDate: Date): string {
  const parts = saoPauloDateFormatter.formatToParts(referenceDate);
  const year = getDatePart(parts, 'year');
  const month = getDatePart(parts, 'month');
  const day = getDatePart(parts, 'day');

  return `${year}-${month}-${day}`;
}

export function getNextFiveDatesInSaoPaulo(referenceDate: Date): string[] {
  const currentDate = parseIsoCalendarDate(getCurrentDateInSaoPaulo(referenceDate));

  return Array.from({ length: FORECAST_DAYS }, (_, index) => {
    const forecastDate = new Date(currentDate.getTime() + (index + 1) * MILLISECONDS_PER_DAY);
    return forecastDate.toISOString().slice(0, 10);
  });
}

export function formatIsoDatePtBr(isoDate: string): string {
  return ptBrDateFormatter.format(parseIsoCalendarDate(isoDate));
}
