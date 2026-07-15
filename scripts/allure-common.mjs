/** Shared helpers for building the showcase Allure report. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

/** Drop the `setup` login fixture from results — it's infrastructure, not a test case. */
export function excludeSetup(resultsDir) {
  let n = 0;
  for (const f of fs.readdirSync(resultsDir)) {
    if (!f.endsWith('-result.json')) continue;
    try {
      const r = JSON.parse(fs.readFileSync(path.join(resultsDir, f), 'utf8'));
      const isSetup =
        r.name === 'authenticate' ||
        (r.labels || []).some((l) => l.name === 'parentSuite' && l.value === 'setup');
      if (isSetup) {
        fs.rmSync(path.join(resultsDir, f));
        n++;
      }
    } catch {
      /* ignore */
    }
  }
  return n;
}

/** CI/executor context shown on the Overview. */
export function writeExecutor(resultsDir, buildOrder = 1) {
  fs.writeFileSync(
    path.join(resultsDir, 'executor.json'),
    JSON.stringify(
      {
        name: 'GitHub Actions',
        type: 'github',
        reportName: 'QA Leap — Task Manager',
        // In your setup this links straight to the CI job that produced the report
        // (GitHub Actions, GitLab CI, or a hosted Allure link).
        buildName: 'Open this run in CI ↗',
        buildOrder,
        buildUrl: 'https://github.com/QA-Leap/demo-test-suite/actions',
      },
      null,
      2,
    ),
  );
}

/** Environment widget on the Overview. */
export function writeEnvironment(resultsDir) {
  let pw = 'unknown';
  try {
    pw = JSON.parse(fs.readFileSync('node_modules/@playwright/test/package.json', 'utf8')).version;
  } catch {
    /* ignore */
  }
  const lines = [
    'App=Task Manager demo',
    'Base.URL=http://localhost:3000',
    'Browser=Chromium',
    'Workers=4',
    `Framework=Playwright ${pw}`,
    `Runtime=Node ${process.version}`,
    `OS=${os.type()} ${os.release()}`,
  ];
  fs.writeFileSync(path.join(resultsDir, 'environment.properties'), `${lines.join('\n')}\n`);
}

/** Default the report to the LIGHT theme (it otherwise follows the OS, which may be dark). */
export function forceLightTheme(reportDir) {
  const idx = path.join(reportDir, 'index.html');
  if (!fs.existsSync(idx)) return;
  let html = fs.readFileSync(idx, 'utf8');
  if (html.includes('qaleap-force-light')) return;
  // Allure stores the theme in localStorage key `allure-theme` ('light'|'dark') and falls
  // back to `prefers-color-scheme` when unset. Preset 'light' when the visitor hasn't chosen.
  const snippet =
    `<script data-qaleap="qaleap-force-light">try{if(!localStorage.getItem('allure-theme'))` +
    `localStorage.setItem('allure-theme','light');}catch(e){}</script>`;
  html = html.replace(/<head>/i, `<head>${snippet}`);
  fs.writeFileSync(idx, html);
}

/** Remove the external Google Analytics script so the report is fully self-contained. */
export function stripAnalytics(reportDir) {
  const idx = path.join(reportDir, 'index.html');
  if (!fs.existsSync(idx)) return;
  let html = fs.readFileSync(idx, 'utf8');
  // Match each <script>…</script> block individually (non-greedy to its OWN closing tag)
  // and drop only the Google-Analytics ones — never the app bundle.
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, (block) =>
    /googletagmanager|gtag\(/.test(block) ? '' : block,
  );
  fs.writeFileSync(idx, html);
}
