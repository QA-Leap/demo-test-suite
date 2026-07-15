import { test, expect } from '@playwright/test';
import {
  apiLogin,
  authHeader,
  apiRoutes,
  newTask,
  seed,
  createTaskViaApi,
  deleteTaskViaApi,
  type Task,
} from '../../fixtures/test-data';
import { applySeverity } from '../../fixtures/severity';

test.describe('API · tasks', () => {
  let token: string;

  test.beforeEach(({}, testInfo) => applySeverity(testInfo.title));
  test.beforeAll(async ({ request }) => {
    token = await apiLogin(request);
  });

  test('GET /api/tasks returns 200 with the standard envelope', async ({ request }) => {
    const res = await request.get(apiRoutes.tasks, { headers: authHeader(token) });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(seed.count);
    expect(body.data[0]).toMatchObject({
      id: expect.any(Number),
      title: expect.any(String),
      status: expect.any(String),
      priority: expect.any(String),
      createdAt: expect.any(String),
    });
  });

  test('GET /api/tasks/:id returns a single task', async ({ request }) => {
    const res = await request.get(apiRoutes.task(1), { headers: authHeader(token) });

    expect(res.status()).toBe(200);
    expect((await res.json()).data.id).toBe(1);
  });

  test('[TC-API-003] GET /api/tasks/9999 returns 404', async ({ request }) => {
    const res = await request.get(apiRoutes.task(9999), { headers: authHeader(token) });

    expect(res.status()).toBe(404);
    expect((await res.json()).success).toBe(false);
  });

  test('[TC-API-001] POST /api/tasks creates a task (201)', async ({ request }) => {
    const res = await request.post(apiRoutes.tasks, { headers: authHeader(token), data: newTask });

    expect(res.status()).toBe(201);
    const created: Task = (await res.json()).data;
    expect(created).toMatchObject({
      title: newTask.title,
      status: 'todo',
      priority: newTask.priority,
    });

    await deleteTaskViaApi(request, token, created.id); // cleanup
  });

  test('POST /api/tasks without a title returns 400', async ({ request }) => {
    const res = await request.post(apiRoutes.tasks, {
      headers: authHeader(token),
      data: { description: 'missing title', priority: 'low' },
    });

    expect(res.status()).toBe(400);
    expect((await res.json()).success).toBe(false);
  });

  test('PUT /api/tasks/:id updates a task (200)', async ({ request }) => {
    const created = await createTaskViaApi(request, token);

    const res = await request.put(apiRoutes.task(created.id), {
      headers: authHeader(token),
      data: { title: 'Updated title', description: 'updated', priority: 'medium' },
    });

    expect(res.status()).toBe(200);
    expect((await res.json()).data).toMatchObject({ title: 'Updated title', priority: 'medium' });

    await deleteTaskViaApi(request, token, created.id); // cleanup
  });

  test('PATCH /api/tasks/:id/status updates the status (200)', async ({ request }) => {
    const created = await createTaskViaApi(request, token);

    const res = await request.patch(apiRoutes.status(created.id), {
      headers: authHeader(token),
      data: { status: 'done' },
    });

    expect(res.status()).toBe(200);
    expect((await res.json()).data.status).toBe('done');

    await deleteTaskViaApi(request, token, created.id); // cleanup
  });

  test('PATCH /api/tasks/:id/status with an invalid status returns 400', async ({ request }) => {
    const created = await createTaskViaApi(request, token);

    const res = await request.patch(apiRoutes.status(created.id), {
      headers: authHeader(token),
      data: { status: 'not-a-real-status' },
    });

    expect(res.status()).toBe(400);

    await deleteTaskViaApi(request, token, created.id); // cleanup
  });

  test('DELETE /api/tasks/:id removes a task (200)', async ({ request }) => {
    const created = await createTaskViaApi(request, token);

    const res = await request.delete(apiRoutes.task(created.id), { headers: authHeader(token) });

    expect(res.status()).toBe(200);

    const check = await request.get(apiRoutes.task(created.id), { headers: authHeader(token) });
    expect(check.status()).toBe(404);
  });

  test('DELETE /api/tasks/:id returns 404 for a missing task', async ({ request }) => {
    const res = await request.delete(apiRoutes.task(999999), { headers: authHeader(token) });

    expect(res.status()).toBe(404);
  });

  /**
   * BUG-108 — the status filter is case-sensitive (tracked, known defect).
   *
   * `GET /api/tasks?status=DONE` (uppercase) SHOULD be case-insensitive and return the
   * done tasks, but the server does a case-sensitive exact match and returns [].
   * See ../../qaleap-demo/KNOWN_BUGS.md → BUG-108.
   *
   * We keep this as `test.fail()` so it stays visible in reports as a *known / expected*
   * failure instead of being silently deleted. When BUG-108 is fixed, drop `test.fail()` and
   * it immediately becomes an active regression guard.
   */
  test('[TC-API-004] GET /api/tasks?status=DONE (uppercase) should be case-insensitive [BUG-108]', async ({
    request,
  }) => {
    // Tracked known bug, marked as an *expected failure*. It asserts the CORRECT
    // (post-fix) behaviour, which fails today because of BUG-108 — so the test stays
    // green as an expected failure and carries the real message into the report. The day
    // BUG-108 is fixed it passes unexpectedly and turns red, prompting us to drop
    // `test.fail()` and promote it to a normal regression guard.
    test.fail();

    const res = await request.get(`${apiRoutes.tasks}?status=DONE`, { headers: authHeader(token) });
    expect(res.status()).toBe(200);
    expect(
      (await res.json()).data.length,
      'BUG-108: status filter is case-sensitive, so ?status=DONE returns [] instead of the done tasks (tracked in qaleap-demo/KNOWN_BUGS.md)',
    ).toBe(seed.doneCount);
  });

  /**
   * The flip side of BUG-108, pinned as the CURRENT (buggy) contract so the suite still
   * documents real behaviour and catches an *unexpected* change. This one PASSES today.
   */
  test('the status filter is case-sensitive today — characterizes BUG-108', async ({ request }) => {
    const lower = await request.get(`${apiRoutes.tasks}?status=done`, { headers: authHeader(token) });
    const lowerTasks: Task[] = (await lower.json()).data;
    expect(lowerTasks.length).toBeGreaterThan(0);
    expect(lowerTasks.every((t) => t.status === 'done')).toBe(true);

    const upper = await request.get(`${apiRoutes.tasks}?status=DONE`, { headers: authHeader(token) });
    expect(upper.status()).toBe(200);
    expect((await upper.json()).data).toHaveLength(0); // ← the bug: uppercase matches nothing
  });
});
