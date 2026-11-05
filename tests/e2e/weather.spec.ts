import { expect, type Page, test } from '@playwright/test';

const cityResults = {
  results: [
    {
      id: 1,
      name: 'Recife',
      latitude: -8.05,
      longitude: -34.9,
      admin1: 'Pernambuco',
      country: 'Brasil',
      feature_code: 'PPLA',
    },
  ],
};

const forecast = {
  current: {
    time: '2026-11-05T12:00',
    temperature_2m: 0,
    apparent_temperature: 0,
    relative_humidity_2m: 60,
    weather_code: 0,
  },
  hourly: {
    time: ['2026-11-05T12:00'],
    precipitation_probability: [0],
  },
  daily: {
    time: ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10'],
    temperature_2m_min: [0, 0, 1, 2, 3, 4],
    temperature_2m_max: [0, 10, 11, 12, 13, 14],
    precipitation_probability_max: [0, 10, 20, 30, 40, 50],
    weather_code: [0, 0, 1, 2, 3, 61],
  },
};

async function installWeatherRoutes(page: Page, geocodingResponse: unknown) {
  await page.clock.setFixedTime(new Date('2026-11-05T15:00:00Z'));
  await page.route('**/geocoding-api.open-meteo.com/v1/search?**', (route) =>
    route.fulfill({ json: geocodingResponse }),
  );
  await page.route('**/api.open-meteo.com/v1/forecast?**', (route) =>
    route.fulfill({ json: forecast }),
  );
}

test('searches, selects a city, displays five forecast days and converts units', async ({
  page,
}) => {
  await installWeatherRoutes(page, cityResults);
  await page.goto('/');

  await page.getByRole('searchbox', { name: 'Cidade' }).fill('Recife');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByRole('button', { name: /Recife/ }).click();

  const currentWeather = page.getByRole('region', { name: 'Recife' });
  await expect(currentWeather).toContainText('0 °C');
  await expect(
    page.getByRole('region', { name: 'Previsão para os próximos cinco dias' }),
  ).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(5);

  await page.getByRole('button', { name: 'Fahrenheit (°F)' }).click();
  await expect(currentWeather).toContainText('32 °F');
});

test('communicates an empty city search without showing weather', async ({ page }) => {
  await installWeatherRoutes(page, {});
  await page.goto('/');

  await page.getByRole('searchbox', { name: 'Cidade' }).fill('Atlantis');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();

  await expect(page.getByRole('status')).toContainText('Cidade não encontrada');
  await expect(page.getByRole('status')).toContainText('Nenhuma cidade foi encontrada');
  await expect(page.getByRole('region', { name: 'Recife' })).toHaveCount(0);
});

test('recovers from a failed geocoding request after one automatic retry', async ({ page }) => {
  let requests = 0;
  await page.route('**/geocoding-api.open-meteo.com/v1/search?**', (route) => {
    requests += 1;
    if (requests < 3) {
      return route.fulfill({ status: 503, json: {} });
    }
    return route.fulfill({ json: cityResults });
  });
  await page.route('**/api.open-meteo.com/v1/forecast?**', (route) =>
    route.fulfill({ json: forecast }),
  );
  await page.goto('/');

  await page.getByRole('searchbox', { name: 'Cidade' }).fill('Recife');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  expect(requests).toBe(2);

  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await page.getByRole('button', { name: /Recife/ }).click();
  await expect(page.getByRole('region', { name: 'Recife' })).toContainText('0 °C');
  expect(requests).toBe(3);
});

test('supports the main city-search flow in a 375 by 812 mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await installWeatherRoutes(page, cityResults);
  await page.goto('/');

  await page.getByRole('searchbox', { name: 'Cidade' }).fill('Recife');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByRole('button', { name: /Recife/ }).click();

  await expect(page.getByRole('region', { name: 'Recife' })).toContainText('0 °C');
  await expect(page.getByRole('article')).toHaveCount(5);
  await page.getByRole('button', { name: 'Fahrenheit (°F)' }).click();
  await expect(page.getByRole('region', { name: 'Recife' })).toContainText('32 °F');
});
