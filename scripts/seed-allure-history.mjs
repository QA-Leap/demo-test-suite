/**
 * Seeds a realistic Allure Trend/History by running the suite several times, carrying the
 * history folder forward between generations. Every run is a REAL run — the trend shows a
 * genuine, stable green line (with natural duration variance), not fabricated failures.
 *
 * Requires a JRE (Java 8+) on PATH.
 * Usage: npm run allure:seed          (defaults to 6 history points)
 *        HISTORY_RUNS=8 npm run allure:seed
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  excludeSetup,
  writeExecutor,
  writeEnvironment,
  stripAnalytics,
  forceLightTheme,
} from './allure-common.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'showcase-assets/allure-report');
const RESULTS = path.join(ROOT, 'allure-results');
const N = Number(process.env.HISTORY_RUNS || 6);

const run = (cmd, extraEnv = {}) =>
  execSync(cmd, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, ...extraEnv } });

// Start clean so the seeded trend has exactly N points.
fs.rmSync(OUT, { recursive: true, force: true });

for (let i = 1; i <= N; i++) {
  console.log(`\n▶ History run ${i}/${N} …`);
  fs.rmSync(RESULTS, { recursive: true, force: true });

  run('npx playwright test'); // functional (UI + API)
  run('npx playwright test --project=visual', { VISUAL: '1' }); // visual

  excludeSetup(RESULTS);
  writeExecutor(RESULTS, i);
  writeEnvironment(RESULTS);

  // Carry the previous report's history forward → the trend accumulates a point per run.
  const prevHistory = path.join(OUT, 'history');
  if (fs.existsSync(prevHistory)) fs.cpSync(prevHistory, path.join(RESULTS, 'history'), { recursive: true });

  run(`npx allure generate allure-results --clean -o ${path.relative(ROOT, OUT)}`);
}

stripAnalytics(OUT);
forceLightTheme(OUT);
console.log(`\n✓ Seeded ${N} history points into ${path.relative(ROOT, OUT)}`);
