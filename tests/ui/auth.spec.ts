import { test, expect } from '../../fixtures/cursor';
import { LoginPage } from '../../pages/LoginPage';
import { TasksPage } from '../../pages/TasksPage';
import { credentials } from '../../fixtures/test-data';
import { applySeverity } from '../../fixtures/severity';
import { check } from '../../fixtures/pacing';

// Authentication is exercised from a clean, unauthenticated state (ignore the stored session).
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(({}, testInfo) => applySeverity(testInfo.title));

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('[TC-001] logs in with valid credentials and redirects to /tasks', async ({ page }) => {
    await loginPage.login(credentials.valid.email, credentials.valid.password);

    await expect(page).toHaveURL(/\/tasks/);
    await expect(page.getByTestId('task-table')).toBeVisible();
    await check(page.getByTestId('task-table')); // validated: logged in, tasks loaded
  });

  test('[TC-002] rejects a wrong password with a 401 and stays on the login page', async ({ page }) => {
    const loginResponse = page.waitForResponse((r) => r.url().includes('/api/login'));
    await loginPage.login(credentials.wrongPassword.email, credentials.wrongPassword.password);

    expect((await loginResponse).status()).toBe(401);
    await expect(page).toHaveURL(/\/login/);
    await loginPage.expectError(/invalid email or password/i);
  });

  test('[TC-003] validates empty fields on the client without calling the API', async ({ page }) => {
    let apiCalled = false;
    page.on('request', (r) => {
      if (r.url().includes('/api/login')) apiCalled = true;
    });

    await loginPage.submitButton.click();

    await loginPage.expectError(/enter both email and password/i);
    await expect(page).toHaveURL(/\/login/);
    expect(apiCalled).toBe(false);
  });

  test('[TC-004] validates an invalid email format', async () => {
    await loginPage.login(credentials.invalidEmail.email, credentials.invalidEmail.password);
    await loginPage.expectError(/valid email/i);
  });

  test('logs out and returns to the login page', async ({ page }) => {
    await loginPage.login(credentials.valid.email, credentials.valid.password);
    await expect(page).toHaveURL(/\/tasks/);

    const tasksPage = new TasksPage(page);
    await tasksPage.logout();

    await expect(page).toHaveURL(/\/login/);
  });
});
