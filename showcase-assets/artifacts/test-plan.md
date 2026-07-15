# Test Plan — Task Manager

| | |
|---|---|
| **Product** | Task Manager (QA Leap demo) |
| **Version / build** | `main` @ current build (in-memory data, resets on restart) |
| **Author** | QA Leap |
| **Status** | Active |
| **Related** | [`test-cases.md`](./test-cases.md) · [`bug-report-107.md`](./bug-report-107.md) · [`bug-report-108.md`](./bug-report-108.md) |

## 1. Overview

The Task Manager is a small web app: users log in and manage a list of tasks (create, edit,
delete, change status, filter). It is backed by a REST API and an in-memory store. This plan
covers the automated and exploratory testing QA Leap performs against it, and the criteria that
gate a release.

## 2. Scope

**In scope**
- **Authentication** — login with valid/invalid credentials, field & format validation, logout.
- **Task management (UI)** — create, edit, delete (with confirmation), change status.
- **Filtering** — All / To Do / In Progress / Done, and the task counter.
- **REST API** — `POST /api/login`, `GET/POST/PUT/PATCH/DELETE /api/tasks`, incl. status codes,
  the response envelope, and negative cases (missing token, bad id, invalid payloads).
- **Visual regression** — key screens (tasks list, create modal, login).
- **Cross-cutting** — stable selectors, deterministic data, parallel-execution safety.

**Out of scope**
- Registration, password reset, user profiles (not implemented).
- Persistence / real database (store is in-memory by design).
- Payments, notifications, integrations.
- Load / performance / stress testing.
- Penetration / full security assessment.
- Mobile-native apps and browsers other than Chromium (demo target).

## 3. Test types

| Type | Purpose |
|------|---------|
| Functional UI (E2E) | Verify user journeys through a real browser (Playwright + Page Object Model). |
| API / contract | Verify status codes, response shape, and validation independently of the UI. |
| Negative / edge | Wrong credentials, missing token, unknown id, invalid enum values, empty fields. |
| Visual regression | Detect unintended visual changes on key screens (screenshot diffing). |
| Exploratory | Time-boxed sessions around new or risky areas. |

## 4. Tools

- **Playwright + TypeScript** — UI, API and visual testing.
- **Page Object Model** — maintainable, self-documenting UI tests.
- **Allure** — reporting (suites, timeline, history, attachments, categories).
- **GitHub Actions** — CI on every push and pull request.
- **Slack** — pass/fail and "known bug" notifications (custom reporter).

## 5. Test environment

- App under test served at `http://localhost:3000` (or a deployed URL via `BASE_URL`).
- Demo credentials: `demo@qaleap.com` / `Demo123`.
- Data is seeded with 7 fixed tasks on every start and **resets on restart** — tests must be
  self-contained and not rely on residue from earlier runs.

## 6. Entry criteria

- Build deploys and the app is reachable.
- `POST /api/login` returns a token for valid credentials.
- Test data seeds correctly (7 tasks, ids 1–7).

## 7. Exit criteria

- 100% of planned test cases executed.
- All **critical** and **high** severity defects fixed or explicitly accepted.
- No open **blocker**; known issues documented and tracked (e.g. BUG-107, BUG-108).
- Full suite green in CI (known issues handled as tracked expected-failures, not silent skips).
- Allure report published for the release build.

## 8. Risks & mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Shared in-memory store mutated by parallel tests | Flaky assertions | Tests create unique data and self-clean; assert invariants, not global totals. |
| Double-submission / missing loading states | Duplicate records | Explicit E2E coverage for rapid double-clicks (see BUG-107). |
| API contract bugs the UI hides | Silent breakage | Dedicated API-layer tests, incl. case-sensitivity (see BUG-108). |
| Visual flakiness (fonts, animations) | False failures | Isolated visual lane, wait for fonts/network, disable animations, tolerance. |
| Store resets on restart | Lost state mid-run | Keep tests independent; never depend on prior-run data. |

## 9. Deliverables

- Automated suite (UI / API / visual) with CI.
- Allure report per run.
- Bug reports for defects found (see BUG-107, BUG-108).
- This plan and the accompanying test cases.
