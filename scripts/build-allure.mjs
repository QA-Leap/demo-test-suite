/**
 * Builds a static Allure report from a fresh, combined run (UI + API + visual) into
 * showcase-assets/allure-report/. Single run — for a full trend, use seed-allure-history.mjs.
 *
 * Requires a JRE (Java 8+) on PATH.
 * Usage: npm run allure:generate
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
const OUT = 'showcase-assets/allure-report';
const RESULTS = path.join(ROOT, 'allure-results');

const run = (cmd, extraEnv = {}) =>
  execSync(cmd, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, ...extraEnv } });

fs.rmSync(RESULTS, { recursive: true, force: true });

console.log('\n▶ Functional suite (UI + API) …');
run('npx playwright test');

console.log('\n▶ Visual suite …');
run('npx playwright test --project=visual', { VISUAL: '1' });

// Carry history forward if a previous report exists, so trends survive regeneration.
const prevHistory = path.join(ROOT, OUT, 'history');
if (fs.existsSync(prevHistory)) fs.cpSync(prevHistory, path.join(RESULTS, 'history'), { recursive: true });

console.log(`  excluded ${excludeSetup(RESULTS)} setup-fixture result(s)`);
writeExecutor(RESULTS, 1);
writeEnvironment(RESULTS);

console.log('\n▶ Generating static Allure report …');
run(`npx allure generate allure-results --clean -o ${OUT}`);
stripAnalytics(path.join(ROOT, OUT));
forceLightTheme(path.join(ROOT, OUT));

console.log(`\n✓ Static Allure report at ${OUT}`);
console.log('  View it locally with:  npx allure open showcase-assets/allure-report');
