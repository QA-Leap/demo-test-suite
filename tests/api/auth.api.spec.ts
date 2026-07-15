import { test, expect } from '@playwright/test';
import { credentials, apiRoutes } from '../../fixtures/test-data';
import { applySeverity } from '../../fixtures/severity';

test.describe('API · authentication', () => {
  test.beforeEach(({}, testInfo) => applySeverity(testInfo.title));

  test('POST /api/login with valid credentials returns 200 and a token', async ({ request }) => {
    const res = await request.post(apiRoutes.login, { data: credentials.valid });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.data.token).toBe('string');
    expect(body.data.token.length).toBeGreaterThan(0);
  });

  test('POST /api/login with a wrong password returns 401', async ({ request }) => {
    const res = await request.post(apiRoutes.login, { data: credentials.wrongPassword });

    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toBeTruthy();
  });

  test('POST /api/login with empty fields returns 400', async ({ request }) => {
    const res = await request.post(apiRoutes.login, { data: credentials.empty });

    expect(res.status()).toBe(400);
    expect((await res.json()).success).toBe(false);
  });

  test('[TC-API-002] GET /api/tasks without a token returns 401', async ({ request }) => {
    const res = await request.get(apiRoutes.tasks);

    expect(res.status()).toBe(401);
    expect((await res.json()).success).toBe(false);
  });
});
