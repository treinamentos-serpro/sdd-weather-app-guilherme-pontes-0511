export function normalizeCityQuery(query: string): string {
  return query
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}
