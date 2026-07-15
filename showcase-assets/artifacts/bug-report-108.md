# BUG-108 — Task status filter is case-sensitive (API)

| | |
|---|---|
| **ID** | BUG-108 |
| **Title** | `GET /api/tasks?status=DONE` returns an empty list — the filter is case-sensitive |
| **Severity** | Low |
| **Priority** | P3 |
| **Status** | Reported — tracked |
| **Component** | REST API · `GET /api/tasks` |
| **Test case** | TC-API-004 |
| **Failed automated test** | `api/tasks.api.spec.ts › [TC-API-004] … should be case-insensitive [BUG-108]` |
| **Reported by** | QA Leap |

## Summary

The `status` query filter on `GET /api/tasks` uses a **case-sensitive** exact match. Stored statuses
are lowercase (`todo`, `in_progress`, `done`), so a request with an uppercase or mixed-case value
(`?status=DONE`) matches nothing and returns an **empty array** instead of the matching tasks.

The web UI only ever sends lowercase values, so the on-screen filter looks fine — **the defect is
only observable at the API layer.** This is a good example of why API tests earn their keep: a
UI-only suite would never catch this broken contract.

## Environment

- **App:** Task Manager demo — API base `http://localhost:3000/api`
- **Build:** `main` (in-memory store)
- **Auth:** bearer token from `POST /api/login`

## Preconditions

1. A valid token.
2. Seed data includes tasks with status `done`.

## Steps to reproduce

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@qaleap.com","password":"Demo123"}' | jq -r .data.token)

# works — lowercase
curl -s "http://localhost:3000/api/tasks?status=done" -H "Authorization: Bearer $TOKEN" | jq '.data | length'
# → 2

# bug — uppercase
curl -s "http://localhost:3000/api/tasks?status=DONE" -H "Authorization: Bearer $TOKEN" | jq '.data | length'
# → 0
```

## Actual result

`?status=DONE` returns **200** with `data: []` (empty), while `?status=done` returns the Done tasks.

## Expected result

The filter is case-insensitive: `?status=DONE` returns the same tasks as `?status=done`
(alternatively, an invalid value returns **400** — but a case difference is not invalid).

## Evidence

For an API-layer bug, the useful evidence is the request/response and the logs — a screenshot
alone wouldn't prove anything:

- **API request/response** — the two calls above (`length` 2 vs 0 for the same logical query), captured from the client or from DevTools → Network.
- **Backend logs** — the demo's request log showing the filter comparison rejecting the uppercase value.
- **Allure report** → **Categories → "Known bugs (tracked)"** contains the tracking test, grouped under its `BUG-108` message (`Expected: 2, Received: 0`).

(A pure UI bug would instead lead with a screenshot or video; here the defect is invisible in the UI, so network + logs carry the proof.)

## Impact

- Any API consumer (integration, mobile, third party) that sends a non-lowercase status silently
  gets zero results — a broken contract that is easy to miss.
- Low user-facing impact today because the web UI normalises to lowercase.

## Root cause (hypothesis)

The list filter compares `task.status === query.status` with no case normalisation.

## Suggested fix

- Normalise both sides (`task.status.toLowerCase() === status.toLowerCase()`), **or** validate the
  value against the allowed set case-insensitively and return **400** for anything truly unknown.

## Notes / tracking

The demo’s fixed-mode toggle (`?fixed=1` / `X-Demo-Fixed: 1` header / `DEMO_FIXED=1`) makes the
filter case-insensitive, for before/after verification. In the suite the case is kept as a green
**expected failure** (`test.fail()`) so it’s visible and tracked, and flips red — prompting promotion
to a normal regression test — the moment the bug is fixed.
