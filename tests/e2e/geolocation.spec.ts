import { expect, test } from '@playwright/test';

const forecast = {
  current: {
    time: '2026-11-05T12:00',
    temperature_2m: 22,
    apparent_temperature: 21,
    relative_humidity_2m: 63,
    weather_code: 2,
  },
  daily: {
    time: ['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10'],
    temperature_2m_min: [17, 18, 19, 20, 21, 22],
    temperature_2m_max: [26, 27, 28, 29, 30, 31],
    precipitation_probability_max: [10, 20, 30, 40, 50, 60],
    weather_code: [2, 2, 2, 2, 2, 2],
  },
};

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-05T15:00:00Z'));
  await page.route('https://api.open-meteo.com/v1/forecast?**', (route) =>
    route.fulfill({ json: forecast }),
  );
  await page.route('https://geocoding-api.open-meteo.com/v1/search?**', (route) =>
    route.fulfill({
      json: {
        results: [
          {
            id: 1,
            name: 'Lisboa',
            latitude: 38.72,
            longitude: -9.14,
            feature_code: 'PPLC',
          },
        ],
      },
    }),
  );
});

test('uses browser coordinates only after activation and displays the forecast', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: -23.55, longitude: -46.63, accuracy: 1500 });
  let forecastRequests = 0;
  page.on('request', (request) => {
    if (request.url().startsWith('https://api.open-meteo.com/')) forecastRequests += 1;
  });
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('Encontre o clima');
  expect(forecastRequests).toBe(0);

  const request = page.waitForRequest('https://api.open-meteo.com/v1/forecast?**');
  const button = page.getByRole('button', { name: 'Usar localização atual' });
  await button.focus();
  await page.keyboard.press('Enter');
  const url = new URL((await request).url());
  expect(url.searchParams.get('latitude')).toBe('-23.55');
  expect(url.searchParams.get('longitude')).toBe('-46.63');

  await expect(page.getByRole('region', { name: 'Local atual' })).toContainText('22 °C');
  await expect(page.getByText('Localização aproximada')).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(5);
  await expect(button).toBeEnabled();
  expect(forecastRequests).toBe(1);
  const storage = await page.evaluate(() =>
    JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }),
  );
  expect(storage).not.toMatch(/latitude|longitude|-23\.55|-46\.63/);

  await page.getByRole('button', { name: 'Fahrenheit (°F)' }).click();
  await expect(page.getByRole('region', { name: 'Local atual' })).toContainText('72 °F');
  expect(forecastRequests).toBe(1);
});

test('communicates denied permission and allows city search', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (_success: PositionCallback, failure: PositionErrorCallback) =>
          failure({
            code: 1,
            message: '',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          }),
      },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Usar localização atual' }).click();
  await expect(page.getByRole('alert')).toContainText('Permissão de localização negada');

  await page.getByRole('searchbox', { name: 'Cidade' }).fill('Lisboa');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByRole('button', { name: /Lisboa/ }).click();
  await expect(page.getByRole('region', { name: 'Lisboa' })).toContainText('22 °C');
});

test('keeps the selected city when the browser returns a late location', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: (success: PositionCallback) => {
          window.addEventListener(
            'resolve-location',
            () => {
              const position: GeolocationPosition = {
                coords: {
                  latitude: -23.55,
                  longitude: -46.63,
                  accuracy: 1500,
                  altitude: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null,
                  toJSON: () => ({}),
                },
                timestamp: Date.now(),
                toJSON: () => ({}),
              };
              success(position);
            },
            { once: true },
          );
        },
      },
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Usar localização atual' }).click();
  await expect(page.getByRole('status')).toContainText('Obtendo sua localização');
  await expect(page.getByRole('button', { name: 'Usar localização atual' })).toBeDisabled();
  await page.getByRole('searchbox', { name: 'Cidade' }).fill('Lisboa');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByRole('button', { name: /Lisboa/ }).click();
  await expect(page.getByRole('region', { name: 'Lisboa' })).toBeVisible();

  await page.evaluate(() => window.dispatchEvent(new Event('resolve-location')));
  await expect(page.getByRole('region', { name: 'Lisboa' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Local atual' })).toHaveCount(0);
});
