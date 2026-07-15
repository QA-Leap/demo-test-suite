# Test Cases — Task Manager

Representative manual/automated test cases for the Task Manager demo. Each maps to automated
coverage in the suite (`tests/ui`, `tests/api`). Priority: **P1** critical · **P2** high · **P3** medium.

**Global preconditions:** app reachable at `http://localhost:3000`; demo login
`demo@qaleap.com` / `Demo123`; store freshly seeded (7 tasks).

---

### TC-001 — Log in with valid credentials · P1
- **Preconditions:** User is logged out, on `/login`.
- **Steps:**
  1. Enter `demo@qaleap.com` in Email.
  2. Enter `Demo123` in Password.
  3. Click **Sign in**.
- **Expected:** User is redirected to `/tasks`; the task table is visible.

### TC-002 — Reject wrong password · P1
- **Preconditions:** On `/login`.
- **Steps:**
  1. Enter `demo@qaleap.com` / `WrongPass1`.
  2. Click **Sign in**.
- **Expected:** Stays on `/login`; API returns **401**; error “Invalid email or password” is shown.

### TC-003 — Validate empty fields · P2
- **Preconditions:** On `/login`.
- **Steps:**
  1. Leave Email and Password empty.
  2. Click **Sign in**.
- **Expected:** Inline validation “Please enter both email and password”; no API call is made.

### TC-004 — Validate email format · P3
- **Preconditions:** On `/login`.
- **Steps:**
  1. Enter `not-an-email` / `Demo123`.
  2. Click **Sign in**.
- **Expected:** Validation message about a valid email; no redirect.

### TC-005 — Create a task · P1
- **Preconditions:** Logged in and open the Tasks page.
- **Steps:**
  1. Click **+ Create task**.
  2. Enter a title, optional description, priority **High**.
  3. Click **Create task**.
- **Expected:** Modal closes; the new task appears in the list with status **To Do** and priority **High**.

### TC-006 — Edit a task · P2
- **Preconditions:** A task exists.
- **Steps:**
  1. Click **Edit** on the task.
  2. Change the title and set priority **Medium**.
  3. Click **Save changes**.
- **Expected:** The row shows the updated title and priority **Medium**; changes persist on reload.

### TC-007 — Delete a task with confirmation · P1
- **Preconditions:** A task exists.
- **Steps:**
  1. Click **Delete** on the task.
  2. Confirm in the dialog.
- **Expected:** The confirmation dialog appears; after confirming, the task is removed from the list.

### TC-008 — Change task status · P2
- **Preconditions:** A “To Do” task exists.
- **Steps:**
  1. In the row’s status dropdown, select **In Progress**.
- **Expected:** The status badge updates to **In Progress** immediately.

### TC-009 — Filter by status · P2
- **Preconditions:** Logged in and open the Tasks page; seeded tasks span all statuses.
- **Steps:**
  1. Click the **Done** filter tab.
- **Expected:** Only **Done** tasks are listed; the counter matches the number of visible rows.
  Repeat for To Do / In Progress; **All** shows every task.

### TC-010 — Task list ordering · P3
- **Preconditions:** Logged in and open the Tasks page.
- **Steps:**
  1. Observe the task rows.
- **Expected:** Tasks are ordered by **id ascending**; newly created tasks appear after the seeded ones.

### TC-011 — Create task submits once on a double-click · P1 · *(fails — see BUG-107)*
- **Preconditions:** Logged in and open the Tasks page.
- **Steps:**
  1. Click **+ Create task**.
  2. Enter a title.
  3. **Double-click** the **Create task** button.
- **Expected:** Exactly **one** task is created.
- **Actual:** Two identical tasks are created — tracked as **BUG-107**.

---

### TC-API-001 — Create task via API returns 201 · P1
- **Preconditions:** Valid bearer token from `POST /api/login`.
- **Steps:**
  1. `POST /api/tasks` with `{ "title": "T", "priority": "high" }` and the token.
- **Expected:** **201**; body `{ success: true, data: { id, title:"T", status:"todo", priority:"high", createdAt } }`.

### TC-API-002 — Reject request without a token · P1
- **Steps:**
  1. `GET /api/tasks` with no `Authorization` header.
- **Expected:** **401**; body `{ success: false, error: { message } }`.

### TC-API-003 — Unknown task id returns 404 · P2
- **Preconditions:** Valid token.
- **Steps:**
  1. `GET /api/tasks/9999`.
- **Expected:** **404**; `success: false`.

### TC-API-004 — Status filter is case-insensitive · P2 · *(fails — see BUG-108)*
- **Preconditions:** Valid token; seeded “Done” tasks exist.
- **Steps:**
  1. `GET /api/tasks?status=DONE` (uppercase).
- **Expected:** **200** with the Done tasks (same as `?status=done`).
- **Actual:** Returns an empty list — tracked as **BUG-108**.
