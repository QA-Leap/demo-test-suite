import { test, expect } from '../../fixtures/cursor';
import { TasksPage } from '../../pages/TasksPage';
import { seed, statusLabels } from '../../fixtures/test-data';
import { applySeverity } from '../../fixtures/severity';
import { check } from '../../fixtures/pacing';

/**
 * Status filters.
 *
 * These assert *invariants that always hold* rather than exact global counts, so they
 * stay green even while the CRUD suite mutates the shared store in parallel:
 *  - "All" always contains every seeded task.
 *  - A status filter shows *only* rows of that status.
 *  - The "N tasks" counter always matches the number of visible rows.
 */
test.describe('Status filters', () => {
  let tasksPage: TasksPage;

  test.beforeEach(({}, testInfo) => applySeverity(testInfo.title));
  test.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
    await tasksPage.goto();
  });

  test('[TC-009] the "All" filter shows every seeded task', async () => {
    await tasksPage.filterBy('all');

    const ids = await tasksPage.ids();
    for (const id of seed.ids) {
      expect(ids, `seed task #${id} should be listed under "All"`).toContain(id);
    }
  });

  test('the counter matches the number of visible rows', async () => {
    await tasksPage.filterBy('all');

    await expect
      .poll(async () => (await tasksPage.count()) === (await tasksPage.rows.count()))
      .toBe(true);
  });

  for (const status of ['todo', 'in_progress', 'done'] as const) {
    test(`[TC-009] the "${statusLabels[status]}" filter shows only ${statusLabels[status]} tasks`, async () => {
      await tasksPage.filterBy(status);
      const badges = tasksPage.page.locator('[data-testid^="task-status-"]');

      // every visible row carries the expected status label
      await expect
        .poll(async () => {
          const labels = await badges.allInnerTexts();
          return labels.length > 0 && labels.every((label) => label.trim() === statusLabels[status]);
        })
        .toBe(true);

      // the counter reflects the filtered set
      await expect
        .poll(async () => (await tasksPage.count()) === (await tasksPage.rows.count()))
        .toBe(true);
      await check(tasksPage.taskCount); // validated: only matching rows, count agrees
    });
  }
});
