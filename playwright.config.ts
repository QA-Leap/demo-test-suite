import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';
import { type Category } from 'allure-js-commons';
import { STORAGE_STATE } from './fixtures/test-data';

/**
 * Allure defect categories. Tracked known bugs are marked as expected failures
 * (`test.fail()`) and carry a `BUG-xxx` message, so we group them into a dedicated
 * bucket in the report's "Categories" tab instead of letting them blend into the passes.
 * `(?s)` makes `.` span newlines so the multi-line assertion message still matches.
 */
const allureCategories: Category[] = [
  {
    name: 'Known bugs (tracked)',
    description:
      'Tests that document a known, tracked defect (e.g. BUG-108), kept green as expected ' +
      'failures. They turn red the moment the bug is fixed — the signal to promote them to ' +
      'a normal regression guard.',
    messageRegex: '(?s).*BUG-\\d+.*',
  },
];

/**
 * Configuration is read from the environment (loaded from `.env` via dotenv) so nothing
 * environment-specific is baked into the code — see `.env.example`.
 *
 * Base URL of the demo app under test. Defaults to a local instance on :3000.
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Location of the bundled demo app (the system under test). It lives in this repo under
 * `qaleap-demo/`, so `npm install` there once and the suite auto-starts it — no separate
 * checkout, and anyone who clones gets a runnable app out of the box.
 */
const DEMO_DIR = process.env.DEMO_DIR || './qaleap-demo';

/** Only manage the demo lifecycle when the target is a local instance. */
const targetsLocalDemo = ['localhost', '127.0.0.1'].includes(new URL(BASE_URL).hostname);

/**
 * Visual regression runs as its own opt-in lane (`VISUAL=1`, e.g. `npm run test:visual`),
 * never in the default run. This keeps it out of headed debugging runs and, crucially,
 * means a visual diff can never block the functional suites.
 */
const RUN_VISUAL = process.env.VISUAL === '1';

export default defineConfig({
  testDir: './tests',
  // Each test is independent, so the whole suite is safe to run fully in parallel.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Workers scale via `--workers` or the WORKERS env — used to showcase parallel execution.
  workers: process.env.WORKERS ? Number(process.env.WORKERS) : undefined,
  timeout: 30_000,
  expect: { timeout: 7_000 },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    [
      'allure-playwright',
      { resultsDir: 'allure-results', detail: true, suiteTitle: true, categories: allureCategories },
    ],
  ],

  use: {
    baseURL: BASE_URL,
    video: { mode: 'on', size: { width: 1280, height: 800 } },
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    // Authenticate once and persist the session for the browser-based suites.
    { name: 'setup', testMatch: /.*\.setup\.ts/ },

    // UI end-to-end suites (authenticated via the stored session).
    {
      name: 'ui',
      testDir: './tests/ui',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: STORAGE_STATE,
        viewport: { width: 1280, height: 800 },
      },
    },

    // API contract suites — no browser, authenticate per-request with a bearer token.
    {
      name: 'api',
      testDir: './tests/api',
    },

    // Visual regression — opt-in lane only (`VISUAL=1`). Runs in isolation from the
    // mutating suites, so screenshots see a pristine seed and a visual diff (or a headed
    // run) never blocks the functional tests. Baselines are headless — run it headless.
    ...(RUN_VISUAL
      ? [
          {
            name: 'visual',
            testDir: './tests/visual',
            dependencies: ['setup'],
            use: {
              ...devices['Desktop Chrome'],
              storageState: STORAGE_STATE,
              viewport: { width: 1280, height: 800 },
            },
          },
        ]
      : []),
  ],

  // Auto-start the demo app for local targets; skip it when BASE_URL points at a
  // deployed environment.
  webServer: targetsLocalDemo
    ? {
        command: `npm --prefix ${DEMO_DIR} start`,
        url: BASE_URL,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
        stdout: 'pipe',
        stderr: 'pipe',
      }
    : undefined,
});
