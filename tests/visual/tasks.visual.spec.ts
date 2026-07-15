import { test, expect, Page } from '@playwright/test';
import { TasksPage } from '../../pages/TasksPage';
import { LoginPage } from '../../pages/LoginPage';
import { seed } from '../../fixtures/test-data';

/**
 * Visual regression.
 *
 * These run *before* the mutating suites (via project dependencies), so they capture the
 * pristine, deterministic seed. Screenshots are stabilised by waiting for web fonts and
 * network to settle and by disabling animations.
 */

/** Wait for fonts + network to settle so screenshots are pixel-deterministic. */
async function stabilize(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
}

test.describe('Visual regression', () => {
  test('tasks page matches the baseline', async ({ page }) => {
    const tasksPage = new TasksPage(page);
    await tasksPage.goto();

    // Guard: the visual baseline only makes sense against the untouched seed.
    await expect(tasksPage.rows).toHaveCount(seed.count);
    await stabilize(page);

    await expect(page).toHaveScreenshot('tasks-page.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    });
  });

  test('create-task modal matches the baseline', async ({ page }) => {
    const tasksPage = new TasksPage(page);
    await tasksPage.goto();

    const modal = await tasksPage.openCreateModal();
    await stabilize(page);

    await expect(modal.root).toHaveScreenshot('create-task-modal.png', {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    });
  });

  test('login page matches the baseline', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await stabilize(page);

    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    });
  });
});
