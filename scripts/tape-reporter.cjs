/**
 * Minimal Playwright reporter that emits a flat "test tape" for the showcase:
 * per-test { name, project, status, duration (s), video } plus totals.
 *
 * Written to the path in the TAPE_OUT env var. Used by scripts/record.mjs to build
 * showcase-assets/run-data.json with real timings from each workers=N run.
 */
const fs = require('node:fs');

class TapeReporter {
  constructor() {
    this.outFile = process.env.TAPE_OUT || 'tape.json';
    this.tests = [];
  }

  onTestEnd(test, result) {
    const parts = test.titlePath().filter(Boolean); // [project, file, ...describes, title]
    const project = parts[0];

    // The 'setup' project is infrastructure (login), not a showcase test.
    if (project === 'setup') return;

    const rest = parts.slice(1);
    const fileIdx = rest.findIndex((p) => p.endsWith('.spec.ts') || p.endsWith('.setup.ts'));
    const file = fileIdx >= 0 ? rest[fileIdx].split('/').pop() : '';
    const titles = rest.filter((_, i) => i !== fileIdx);
    const name = [file, ...titles].filter(Boolean).join(' › ');

    // Expected outcomes (incl. test.fail() expected failures) are green.
    const outcome = test.outcome();
    const status =
      outcome === 'skipped' ? 'skipped' : outcome === 'unexpected' ? 'failed' : 'passed';

    const videoAttachment = (result.attachments || []).find((a) => a.name === 'video');

    this.tests.push({
      name,
      project,
      status,
      duration: Number((result.duration / 1000).toFixed(2)),
      video: videoAttachment ? videoAttachment.path : null,
    });
  }

  onEnd() {
    const passed = this.tests.filter((t) => t.status === 'passed').length;
    const failed = this.tests.filter((t) => t.status === 'failed').length;
    const skipped = this.tests.filter((t) => t.status === 'skipped').length;
    fs.writeFileSync(
      this.outFile,
      JSON.stringify({ total: this.tests.length, passed, failed, skipped, tests: this.tests }, null, 2),
    );
  }
}

module.exports = TapeReporter;
