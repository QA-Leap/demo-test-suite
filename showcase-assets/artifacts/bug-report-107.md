# BUG-107 — "Create task" double-submits on rapid double-click

| | |
|---|---|
| **ID** | BUG-107 |
| **Title** | Creating a task fires twice on a fast double-click → duplicate tasks |
| **Severity** | High |
| **Priority** | P1 |
| **Status** | Reported — awaiting fix |
| **Component** | Web UI · Create task modal |
| **Test case** | TC-011 |
| **Failed automated test** | `ui/tasks.spec.ts › [TC-011] create task submits once on double-click [BUG-107]` |
| **Reported by** | QA Leap |

## Summary

The **Create task** submit button is not disabled while the create request is in flight. A user
who double-clicks (or clicks twice quickly) sends the `POST /api/tasks` request **twice**, creating
**two identical tasks**. The server has no idempotency, so both requests succeed.

## Environment

- **App:** Task Manager demo — `http://localhost:3000`
- **Build:** `main` (in-memory store)
- **Browser:** Chromium (latest) — reproducible cross-browser
- **Account:** `demo@qaleap.com`

## Preconditions

1. Logged in and open the **Tasks** page.

## Steps to reproduce

1. Click **+ Create task**.
2. Enter a title, e.g. `Duplicate me`.
3. **Double-click** the **Create task** button (or click it twice within ~300 ms).

> **For the developer:** this is a timing-sensitive bug, so it can be fiddly to hit by hand. The
> automated test **TC-011** reproduces it deterministically — running it locally is the fastest,
> most reliable way to see the bug and to confirm the fix.

## Actual result

**Two** identical tasks named `Duplicate me` are created (two rows, different ids). The network
panel shows **two** `POST /api/tasks` calls, each returning **201**.

## Expected result

Exactly **one** task named `Duplicate me` is created.

## Evidence

In a real report we attach whatever makes the defect unambiguous — and only what's relevant to
the specific bug:

- **Screenshot or short video** of the reproduction — here, the two identical rows appearing after a single double-click.
- **Browser DevTools logs** — the Console output and the Network tab (the two `POST /api/tasks` requests and their `201` responses).
- **Backend logs** when the bug reaches the server — for this one, the API logs showing two create calls landing.

Which of these we include depends on the bug: a pure front-end glitch may need only a screenshot,
while a data or API bug usually needs the network trace and backend logs too.

## Impact

- Duplicate records pollute the list and any downstream counts/reports.
- Users can't tell which duplicate is "real"; deleting one is an extra manual step.
- Higher-risk variants of the same pattern (double-charge, double-order) make this a P1 pattern.

## Root cause (hypothesis)

The submit handler `await`s the create request but never guards re-entry: the button has no
`disabled` state and there is no in-flight flag, so a second click starts a second request before
the first resolves. There is no server-side idempotency key either.

## Suggested fix

- Disable the submit button and short-circuit the handler while a submit is in flight (an
  `isSubmitting` flag / in-flight ref).
- Optionally, add an idempotency key on `POST /api/tasks` for defence in depth.

## Notes

The demo exposes a fixed-mode toggle to demonstrate the corrected behaviour: append `?fixed=1`
(or use the header toggle) and the same double-click produces a single task. Use it for before/after
verification.
