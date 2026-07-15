# Known bugs (intentional)

This demo ships with **exactly two intentional bugs**, used to demonstrate QA Leap's
bug-reporting process. Both are **active by default**, so the app is a stable, reproducible
test target. They can be disabled for "bug → fix" demos — see [Toggling the bugs](#toggling-the-bugs).

| ID | Severity | Layer | Summary |
|----|----------|-------|---------|
| BUG-107 | High | Client (UI) | "Create task" has no in-flight guard → double-click creates two tasks |
| BUG-108 | Low | Server (API) | Status filter is case-sensitive → `?status=DONE` returns nothing |

---

## BUG-107 — Double submission on "Create task"

- **Severity:** High
- **Component:** `client/src/components/TaskModal.tsx` (submit handler)
- **Type:** Missing loading/disabled state (double submission), no server-side idempotency

### Steps to reproduce
1. Log in (`demo@qaleap.com` / `Demo123`).
2. Click **+ Create task**.
3. Enter a title, e.g. `Duplicate me`.
4. **Double-click** the **Create task** button (or two fast clicks).

### Expected
Exactly **one** task named `Duplicate me` is created.

### Actual
**Two** identical tasks named `Duplicate me` are created (with different ids). The submit
button stays enabled during the in-flight `POST /api/tasks`, so the second click fires a
second request; the server has no idempotency and appends both.

### Evidence / assertions
- UI: two rows match `getByTestId(/^task-row-/)` with title `Duplicate me`.
- API: two `POST /api/tasks` requests, two `201` responses with different `data.id`.

### Playwright sketch
```ts
await page.getByTestId('create-task-btn').click();
await page.getByTestId('task-title-input').fill('Duplicate me');
await page.getByTestId('task-submit').dblclick();
await expect(page.getByText('Duplicate me')).toHaveCount(1); // FAILS → actually 2
```

### The fix (what "fixed mode" does)
Guard the handler with an `isSubmitting` flag: early-return while a request is in flight and
set `disabled={isSubmitting}` on the button. Then a double-click produces exactly one task.

---

## BUG-108 — Status filter is case-sensitive

- **Severity:** Low
- **Component:** `server/src/store.ts` → `list()` filter
- **Type:** Case-sensitive comparison / broken API contract (edge case)

### Steps to reproduce (API)
1. `POST /api/login` → get a token.
2. `GET /api/tasks?status=done` with the token → returns the done tasks (works).
3. `GET /api/tasks?status=DONE` (uppercase) with the token.

### Expected
The filter is case-insensitive (or rejects an invalid value with `400`). `?status=DONE`
returns the same done tasks as `?status=done`.

### Actual
`?status=DONE` returns `{ "success": true, "data": [] }` (HTTP `200`, empty list). The filter
uses a case-sensitive exact match and the stored statuses are lowercase, so nothing matches.

> **Why the UI hides it:** the status filter in the UI only ever sends lowercase values
> (`todo` / `in_progress` / `done`), so the on-screen filter always works. The bug only
> surfaces at the API layer — a good demonstration that **API tests catch contract bugs the
> UI masks.**

### Evidence / assertions
```
GET /api/tasks?status=done  → 200, data.length === 2
GET /api/tasks?status=DONE  → 200, data.length === 0   ← bug
```

### The fix (what "fixed mode" does)
Normalize case on both sides in `list()`: `t.status.toLowerCase() === status.toLowerCase()`.
Then `?status=DONE` returns the done tasks.

---

## Toggling the bugs

Both bugs are **ON by default**. "Fixed mode" turns both off for live before/after demos:

- **Per session (no restart):** open the app with `?fixed=1` (e.g. `http://localhost:3000/tasks?fixed=1`),
  or flip the **Bug mode / Fixed mode** switch in the top bar. The client then sends an
  `X-Demo-Fixed: 1` header so the server also applies the BUG-108 fix.
- **Whole instance:** start the server with `DEMO_FIXED=1` (e.g. `DEMO_FIXED=1 npm start`).

Default behavior (no `?fixed`, no toggle, no `X-Demo-Fixed` header, no `DEMO_FIXED`) is the
**buggy** version — that is the canonical test target.
