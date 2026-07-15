# Showcase assets

Source material for the QA Leap **showcase page** (built separately). Everything here is generated
or authored locally — no hosting is wired up yet.

```
showcase-assets/
├── run-data.json          # real per-run tape data (1 / 2 / 4 workers) for the parallelism animation
├── slack-states.json      # 4 Slack-notification states (green / red / knownBug / fixed) — BUG-107 story
├── videos/                # per-test run videos, grouped by worker count   ⟵ generated (git-ignored)
│   ├── workers-1/
│   ├── workers-2/
│   └── workers-4/
├── artifacts/             # QA documents shown as "our work"
│   ├── test-plan.md
│   ├── test-cases.md
│   ├── bug-report-107.md  # flagship: double-submission (end-to-end story)
│   └── bug-report-108.md  # API case-sensitivity
└── allure-report/         # static Allure report (last combined run)          ⟵ generated (git-ignored)
```

`videos/` and `allure-report/` are heavy generated artifacts and are **git-ignored** — regenerate
them with the commands below. The small source files (`run-data.json`, `slack-states.json`,
`artifacts/*.md`) are committed.

## Regenerate

Run from the repo root (`qaleap-demo-tests/`), with the demo app reachable on `:3000`
(Playwright's `webServer` will start/reuse it):

```bash
# Videos (1/2/4 workers) + run-data.json  — best-of-3 timings
npm run record

# Static Allure report from a fresh UI+API+visual run → allure-report/
npm run allure:generate        # requires a JRE (Java 8+) on PATH
```

## View locally

```bash
# Allure report (served over HTTP — it's a static SPA)
npm run allure:open            # → opens showcase-assets/allure-report

# Any static server works too, e.g.:
python3 -m http.server 8080 --directory showcase-assets/allure-report
```

Markdown artifacts open in any viewer; `run-data.json` / `slack-states.json` are plain JSON.

## Data notes

- **`run-data.json`** — real timings for the functional suite (32 tests — 16 UI + 16 API). Because
  the suite is small and fast, parallelism saturates within a couple of workers; the per-test
  durations drive a 1-lane-vs-4-lanes animation. Regenerate to refresh.
- **`slack-states.json`** — the counts mirror the full suite (35 tests, including the 3 visual);
  the branch/commit values are illustrative. The `knownBug → fixed` pair tells the BUG-107 story.
