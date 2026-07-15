# Visual regression tests

Pixel-level comparison of key screens against approved baseline images.

## What's here

- **`tasks.visual.spec.ts`** — baselines for the **tasks page**, the **create-task modal**, and the
  **login page**, via `expect(...).toHaveScreenshot()`.

## When visual regression is indispensable

Functional tests confirm that behaviour is correct; visual tests confirm that the product still
*looks* correct. That gap matters most where the UI **is** the product:

- **Game & casino UIs** — slot reels, paylines, animations, bonus screens. A shifted symbol, a
  clipped payout, or a broken layout is a visual defect a DOM assertion will happily miss.
- **Data-dense dashboards & charts** — overlapping labels, cut-off legends, wrong colors.
- **Design-system components** — spacing, theming, and states that "still render" but look wrong.
- **Cross-viewport / responsive** — catching breakage at specific breakpoints.

For these, a screenshot diff is often the *only* practical guard.

## How it works

1. On the first run, Playwright records baseline PNGs next to the spec (in a `*-snapshots/` folder).
2. On later runs, it captures the same screens and compares them pixel-by-pixel.
3. A diff beyond the tolerance fails the test, with `expected` / `actual` / `diff` images attached.

Update baselines intentionally after a *reviewed* UI change:

```bash
npm run update:snapshots
```

## Keeping visual tests non-flaky

Flaky visual tests erode trust, so we design them out:

- **Isolated, deterministic data.** The visual suite is its own lane (`VISUAL=1` /
  `npm run test:visual`) — it never runs alongside the mutating suites, so it always captures a
  pristine, unmutated seed and the pixels never depend on test order. (Keeping it separate also
  means a visual diff can't cascade into skipping the functional tests.)
- **Headless only.** Baselines are captured headless; headed rendering differs, so run visual
  headless (the default for this lane). Use `npm run test:headed` for *UI* debugging — it doesn't
  touch visual.
- **Wait for fonts & network.** We await `document.fonts.ready` and `networkidle` before capturing,
  so web-font loading can't cause a one-off diff.
- **Disable animations.** `animations: 'disabled'` freezes transitions at capture time.
- **A small tolerance.** `maxDiffPixelRatio` absorbs sub-pixel anti-aliasing noise without hiding
  real regressions.

## Platform baselines & CI

Rendering differs across operating systems, so Playwright names snapshots per-platform
(`…-darwin.png`, `…-linux.png`). The baselines committed here are generated on the maintainer's
machine. In CI (Linux, inside the official Playwright container) the workflow **bootstraps** the
Linux baselines for the run and uploads them as the `visual-baselines-linux` artifact — commit those
to enable strict Linux visual diffing in CI and drop the bootstrap step.
