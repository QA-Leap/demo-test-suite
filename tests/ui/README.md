# UI tests

End-to-end tests that drive the app through a real browser, the way a user does.

## What's here

- **`auth.spec.ts`** — login (valid), wrong password → 401, empty-field validation, invalid email
  format, logout. Runs from a clean, unauthenticated state.
- **`tasks.spec.ts`** — create, edit, delete (with confirmation), change status, and the
  "sorted by id" ordering guarantee.
- **`filters.spec.ts`** — the status filter (All / To Do / In Progress / Done) and the task counter.

## Principles

**Page Object Model.** Tests express *intent* (`tasksPage.createTask({ title, priority })`), never
raw selectors. Every screen is a class in [`../../pages`](../../pages) that owns its locators and
actions. When markup changes, we fix one page object — not fifty tests.

**Stable selectors.** We locate elements by the app's `data-testid` attributes via
`page.getByTestId(...)`. No brittle CSS chains, no "nth-child", no matching on copy that a designer
might reword.

**Authenticate once.** A `setup` project logs in and saves the session (`storageState`), which the
UI suite reuses — fast, and login stays covered explicitly in `auth.spec.ts` (which opts out of the
stored session).

**Stable under parallelism.** The demo shares one in-memory store across all tests, so:
- mutating tests create uniquely-named data and **clean up after themselves**, keeping the seed intact;
- filter assertions check *invariants that always hold* (a filtered list contains only that status;
  the counter matches the visible rows) rather than fragile global totals.

## Making them even better

- Swap real UI login for API-seeded sessions when a test doesn't care about the login flow (speed).
- Add `@axe-core/playwright` for accessibility checks on key screens.
- Introduce component-level visual checks for complex widgets (see [`../visual`](../visual)).
- Tag long journeys with `@slow` and shard them across CI runners as the suite grows.
