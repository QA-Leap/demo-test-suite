import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { credentials, STORAGE_STATE } from '../fixtures/test-data';

/**
 * Logs in once and saves the authenticated session (localStorage token) to disk.
 * The `ui` and `visual` projects reuse it via `storageState`, so we don't pay the
 * cost of logging in before every test. Auth itself is covered explicitly in
 * tests/ui/auth.spec.ts, which starts from a clean, unauthenticated state.
 */
setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(credentials.valid.email, credentials.valid.password);

  await expect(page).toHaveURL(/\/tasks/);
  await expect(page.getByTestId('task-table')).toBeVisible();

  await page.context().storageState({ path: STORAGE_STATE });
});
