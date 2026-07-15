import { test, expect } from '../../fixtures/cursor';
import { TasksPage } from '../../pages/TasksPage';
import { TaskModal } from '../../pages/TaskModal';
import { seed } from '../../fixtures/test-data';
import { applySeverity } from '../../fixtures/severity';
import { check } from '../../fixtures/pacing';

/**
 * CRUD flows.
 *
 * The demo uses a single in-memory store shared by every test, so each mutating test
 * creates its own uniquely-named task and cleans it up. That keeps the suite stable
 * under parallel execution and leaves the seeded baseline untouched.
 */
test.describe('Task management', () => {
  let tasksPage: TasksPage;

  test.beforeEach(({}, testInfo) => applySeverity(testInfo.title));
  test.beforeEach(async ({ page }) => {
    tasksPage = new TasksPage(page);
    await tasksPage.goto();
  });

  test('[TC-005] creates a task and shows it in the list', async () => {
    const title = `Create flow ${Date.now()}`;

    await tasksPage.createTask({ title, description: 'created by ui test', priority: 'high' });

    await check(tasksPage.row(title)); // validated: the new task is in the list
    await expect(tasksPage.row(title)).toBeVisible();
    await expect(tasksPage.priorityCell(title)).toHaveText('High');
    await expect(tasksPage.statusCell(title)).toHaveText('To Do');

    await tasksPage.deleteTask(title); // cleanup
    await expect(tasksPage.row(title)).toHaveCount(0);
  });

  test('[TC-006] edits an existing task and persists the changes', async () => {
    const title = `Edit flow ${Date.now()}`;
    const editedTitle = `${title} — edited`;
    await tasksPage.createTask({ title, priority: 'low' });

    await tasksPage.editTask(title, { title: editedTitle, priority: 'medium' });

    await check(tasksPage.row(editedTitle)); // validated: the edit persisted
    await expect(tasksPage.row(editedTitle)).toBeVisible();
    await expect(tasksPage.priorityCell(editedTitle)).toHaveText('Medium');

    await tasksPage.deleteTask(editedTitle); // cleanup
  });

  test('[TC-007] deletes a task after confirmation', async () => {
    const title = `Delete flow ${Date.now()}`;
    await tasksPage.createTask({ title });
    await expect(tasksPage.row(title)).toBeVisible();

    await tasksPage.deleteTask(title);

    await expect(tasksPage.row(title)).toHaveCount(0);
  });

  test('[TC-008] changes a task status', async () => {
    const title = `Status flow ${Date.now()}`;
    await tasksPage.createTask({ title }); // new tasks start as "To Do"
    await expect(tasksPage.statusCell(title)).toHaveText('To Do');

    await tasksPage.changeStatus(title, 'in_progress');

    await check(tasksPage.statusCell(title)); // validated: status now "In Progress"
    await expect(tasksPage.statusCell(title)).toHaveText('In Progress');

    await tasksPage.deleteTask(title); // cleanup
  });

  test('[TC-010] lists tasks sorted by id ascending', async () => {
    const ids = await tasksPage.ids();

    expect(ids.length).toBeGreaterThanOrEqual(seed.count);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
  });

  /**
   * BUG-107 (tracked known bug) — "Create task" double-submits. Marked as an expected
   * failure: it asserts the CORRECT behaviour (one task per double-click), which fails
   * today because the demo has no in-flight guard and creates two. Stays green as an
   * expected failure and turns red the moment BUG-107 is fixed. A dev can run this test
   * to reproduce the bug deterministically. See showcase-assets/artifacts/bug-report-107.md.
   */
  test('[TC-011] create task submits once on double-click [BUG-107]', async ({ page }) => {
    test.fail();

    const title = `Double submit ${Date.now()}`;
    const modal = new TaskModal(page);

    await tasksPage.createButton.click();
    await modal.waitUntilOpen();
    await modal.titleInput.fill(title);
    await modal.submitButton.dblclick();

    try {
      // Expected: exactly one task. Actual (BUG-107): two identical tasks are created.
      await expect(
        tasksPage.row(title),
        'BUG-107: a double-click creates two identical tasks instead of one',
      ).toHaveCount(1, { timeout: 2000 });
    } finally {
      // Clean up every duplicate via the API so the shared store stays at its baseline.
      await page.evaluate(async (t) => {
        const token = localStorage.getItem('qaleap_token');
        const auth = { Authorization: `Bearer ${token}` };
        const all: Array<{ id: number; title: string }> = (
          await (await fetch('/api/tasks', { headers: auth })).json()
        ).data;
        for (const task of all.filter((x) => x.title === t)) {
          await fetch(`/api/tasks/${task.id}`, { method: 'DELETE', headers: auth });
        }
      }, title);
    }
  });
});
