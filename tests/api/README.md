# API tests

Tests that hit the REST API directly, with no browser involved.

## What's here

- **`auth.api.spec.ts`** — `POST /api/login` (200 + token, 401 wrong creds, 400 empty), and
  `GET /api/tasks` without a token → 401.
- **`tasks.api.spec.ts`** — the full CRUD contract: list, get one, get missing (404), create (201),
  create without title (400), update (200), change status (200), invalid status (400),
  delete (200), delete missing (404) — plus the **BUG-108** case below.

## Why API tests, separately from the UI

UI and API tests catch **different** classes of failure, so we run both:

- **The API is a contract.** Status codes (`200/201/400/401/404`), the response envelope
  (`{ success, data }` / `{ success, error }`), and validation rules are asserted directly — fast,
  precise, and independent of any rendering.
- **Negative cases are first-class.** Missing tokens, unknown ids, invalid payloads and bad enum
  values are trivial to exercise here and awkward (or impossible) to reach through the UI.
- **Some bugs are invisible to the UI.** That's the whole point of the BUG-108 example.

## The BUG-108 example — why this separation earns its keep

The demo's status filter is **case-sensitive**: `GET /api/tasks?status=DONE` returns `[]` instead of
the done tasks. The UI only ever sends lowercase values, so **a UI-only suite would never notice** —
the screen looks perfectly fine while the contract is broken.

Our API layer catches it, and we handle it deliberately rather than leaving a red test:

- **An expected-failure test (`test.fail()`)** asserts the *intended* behaviour. Because the bug is
  present it fails — which `test.fail()` records as a green **expected failure** that still carries
  the real assertion message. When the bug is fixed it passes unexpectedly and turns **red**: the
  signal to remove `test.fail()` and promote it to a normal regression guard.
- **A characterization test** pins the *current* buggy behaviour (`?status=DONE` → `[]`) so the suite
  still passes today and would flag any *unexpected* change to that behaviour.

This is what "known bug, tracked" looks like in code: visible, intentional, and one edit away from a
live regression test. In the Allure report the expected-failure lands in a **"Known bugs (tracked)"**
category (configured in [`playwright.config.ts`](../../playwright.config.ts)), grouped under its
`BUG-108` message — highlighted rather than lost among the passing tests.

## Principles

- **Data via helpers, not hard-coding.** Credentials, routes and payloads live in
  [`../../fixtures/test-data.ts`](../../fixtures/test-data.ts).
- **Self-cleaning.** Tests that create data delete it, keeping the shared store at its seeded baseline.
- **Assert the shape, not just the status.** We check the envelope and key fields, not only the HTTP code.
