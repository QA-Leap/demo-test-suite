# QA Leap — Automated Testing Showcase

> A public, end-to-end example of how [QA Leap](https://qaleap.com) approaches automated testing —
> **UI, API and visual** tests written against our open [Task Manager demo](qaleap-demo).

This repository is meant to be *read*, not just run. It's how we think about quality: clear
structure, stable selectors, deterministic data, honest handling of known bugs, and CI that turns
green or red for the right reasons.

[![tests](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?logo=githubactions&logoColor=white)](.github/workflows/tests.yml)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Allure](https://img.shields.io/badge/Report-Allure-FF6C37)](https://allurereport.org)

---

## What is this

The [Task Manager demo](qaleap-demo) is a small but realistic app (login, task CRUD, filtering,
a REST API). This repo is the **test layer** we build on top of it — the same way we'd wrap a
client's product. It's deliberately scoped to be exemplary rather than exhaustive: **a handful of
clean, meaningful tests beats hundreds of tangled ones.**

The demo also ships with two *intentional* bugs. How we handle one of them (**BUG-108**) in the
suite is, honestly, the most interesting part — see [Known bugs, handled with intent](#known-bugs-handled-with-intent).

## What's covered

| Layer | Folder | What it proves |
|-------|--------|----------------|
| **UI** | [`tests/ui`](tests/ui) | Real user journeys through a browser — auth, task CRUD, status changes, filtering. Built on a Page Object Model. |
| **API** | [`tests/api`](tests/api) | The REST contract directly — status codes, response envelope, validation and negative cases, independent of the UI. |
| **Visual** | [`tests/visual`](tests/visual) | Pixel-level regression of key screens, so unintended visual changes can't slip through unnoticed. |

Each folder has its own short README explaining the *why*.

## How to run

**Prerequisites:** Node.js 18+. The app under test — the [Task Manager demo](qaleap-demo) — is
**bundled in this repo** (`qaleap-demo/`), so there's nothing else to clone.

```bash
npm install                       # test dependencies
npm --prefix qaleap-demo install  # the bundled demo app's dependencies
cp .env.example .env              # configuration & credentials (git-ignored)
npx playwright install --with-deps chromium
npx playwright test
```

That runs the **functional suite (UI + API)**. Playwright's `webServer` builds and starts the
bundled demo automatically (and reuses it if it's already running on `:3000`).

**Visual regression is a separate lane** — `npm run test:visual` — run on its own so that a visual
diff (or a headed debugging run) can never block the functional tests, and so screenshots always see
a pristine, unmutated seed. See [Our approach](#our-approach).

To point the suite at a deployed environment instead, set `BASE_URL` in `.env` (or inline):

```bash
BASE_URL=https://your-demo.example.com npx playwright test
```

### Configuration & credentials

All environment-specific values live in **`.env`** (loaded via `dotenv`), never in code:

| Variable | Purpose |
|----------|---------|
| `BASE_URL` | URL of the app under test (localhost auto-starts the demo). |
| `DEMO_DIR` | Path to the bundled demo app (`./qaleap-demo`), used to auto-start it. |
| `DEMO_EMAIL` / `DEMO_PASSWORD` | Login used by the suite. |

[`.env.example`](.env.example) is the committed template; your real `.env` is git-ignored. These
particular credentials are the demo's *public* sandbox login, so the code keeps safe fallbacks and
the suite runs with zero config — but the pattern is the one we use on real engagements: **secrets
come from a manager / CI secrets, never from the repo.** In CI they're injected from GitHub Secrets
(`DEMO_EMAIL`, `DEMO_PASSWORD`) — see [`.github/workflows/tests.yml`](.github/workflows/tests.yml).

### Run a single layer

```bash
npm run test:ui       # UI only
npm run test:api      # API only
npm run test:visual   # Visual only — isolated lane, runs headless
npm run test:headed   # UI with a visible browser (no visual — safe for debugging)
```

### Showcase parallelism

The suite is fully parallel-safe. Dial the worker count to demonstrate throughput:

```bash
npm run test:1        # 1 worker  — deterministic, easy to watch
npm run test:2        # 2 workers
npm run test:4        # 4 workers — fastest
# or:  WORKERS=8 npx playwright test
```

### The Allure report

Allure's report generator is a Java tool, so a **JRE (Java 8+) is required** to view reports locally
(the raw `allure-results/` are produced by the test run either way, and CI installs Java for you).

```bash
npm run report        # generate + open the Allure report
# or
npm run report:serve  # serve it on a temporary local server
```

## Our approach

**Page Object Model.** UI tests never touch raw selectors. Each screen is a class
([`pages/`](pages)) that exposes intention-revealing methods (`tasksPage.createTask(...)`,
`loginPage.expectError(...)`). Locators live in one place, keyed off stable `data-testid`
attributes, so a markup change is a one-line fix — not a find-and-replace across the suite.

**Stable selectors, deterministic data.** We select by `data-testid`, never by brittle CSS or
text position. The demo seeds fixed ids and dates, so assertions don't chase moving targets.

**Tests survive parallel execution.** The demo has a single in-memory store shared by every test.
Rather than pretend that isn't true, we design for it: mutating tests create their own uniquely
named data and clean up after themselves, and count-based assertions check *invariants that always
hold* instead of fragile global totals.

**Visual regression runs in its own lane.** Screenshots need a deterministic page, so the visual
suite runs isolated (`VISUAL=1` / `npm run test:visual`) against a pristine seed — never interleaved
with the mutating suites. Keeping it separate also means a visual diff, or a headed run with
stale baselines, can never skip or block the functional tests. (An earlier design wired visual as a
project *dependency*; that let one visual failure cascade into "everything else was skipped", so we
decoupled it.)

**Layered on purpose.** API and UI test *different risks*. The UI proves the journey a user takes;
the API proves the contract underneath — including negative cases that are awkward or impossible to
reach through the UI. BUG-108 below is exactly why that separation earns its keep.

**Coverage over count.** We test the behaviours that matter — happy paths *and* the negative and
edge cases where products actually break — and we keep each test small and readable.

## Known bugs, handled with intent

The demo intentionally contains **BUG-108**: the API's status filter is case-sensitive, so
`GET /api/tasks?status=DONE` returns an empty list instead of the "done" tasks. The **UI never
triggers it** (it only ever sends lowercase) — so a UI-only test suite would sail right past a
broken contract. Our API layer catches it.

We don't just let a test fail. We handle it the way a mature process does
([`tests/api/tasks.api.spec.ts`](tests/api/tasks.api.spec.ts)):

- An **expected-failure test** (`test.fail()`) named `…should be case-insensitive [BUG-108]` asserts
  the *desired* behaviour. It fails today because of the bug — so Playwright records it as a green
  **expected failure** carrying the real assertion — and the day BUG-108 is fixed it passes
  unexpectedly and turns **red**: our signal to drop `test.fail()` and promote it to a live
  regression guard.
- A **characterization test** pins the *current* buggy contract (`?status=DONE` → `[]`) so it still
  passes today **and** would alert us if that behaviour changed unexpectedly.

In the Allure report the expected-failure lands in a dedicated **"Known bugs (tracked)"** category
(the *Categories* tab), grouped under its `BUG-108` message — a deliberately tracked item, not lost
among the passes.

"Known bug, tracked" — visible, intentional, and one edit away from a live regression test.

## Showcase assets

Real artifacts generated from this suite, collected under [`showcase-assets/`](showcase-assets/)
(source material for our public showcase page). See [`showcase-assets/README.md`](showcase-assets/README.md).

| Asset | What it is | Regenerate |
|-------|------------|-----------|
| `run-data.json` | Real per-run test tape at 1 / 2 / 4 workers (names, statuses, durations, videos) | `npm run record` |
| `videos/workers-{1,2,4}/` | Per-test run videos for each worker count | `npm run record` |
| `slack-states.json` | Four Slack states (green / red / knownBug / fixed) — the BUG-107 story | authored |
| `artifacts/*.md` | Test plan, test cases, and the BUG-107 / BUG-108 bug reports | authored |
| `allure-report/` | Static Allure report from a fresh UI + API + visual run | `npm run allure:generate` |

```bash
npm run record            # videos + run-data.json (best-of-3 timings)
npm run allure:generate   # static report → showcase-assets/allure-report/ (needs a JRE)
npm run allure:open       # view that report locally
```

`videos/` and `allure-report/` are git-ignored (heavy, generated); the JSON and Markdown are tracked.
Hosting is intentionally not wired up yet — everything runs and opens locally.

## Tech stack

- **[Playwright](https://playwright.dev)** + **TypeScript** — UI, API and visual testing in one framework.
- **Page Object Model** — maintainable, self-documenting UI tests.
- **[Allure](https://allurereport.org)** — rich, shareable reports (steps, attachments, history).
- **GitHub Actions** — runs on every push and PR inside the official Playwright container.
- **Slack notifications** *(via a custom reporter — part of our internal toolkit, not included here)* —
  how we surface pass/fail and "known bug" status to a team channel in real time.

## Links

- 🔗 **App under test:** the [Task Manager demo](qaleap-demo) — bundled in this repo, runs locally (not a hosted site).
- 🔗 **QA process showcase:** **[qaleap.com/showcase](https://qaleap.com/showcase/)** — the full, interactive end-to-end walkthrough of our process: test plan, tests running live in the browser, actionable bug reports, Slack alerts and the complete Allure report.
- 🌐 **QA Leap:** [qaleap.com](https://qaleap.com)

---

<sub>Built by QA Leap. This is a demonstration repository — the app under test is a purpose-built
sandbox, not a production system.</sub>
