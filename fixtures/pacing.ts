import type { Page, Locator } from '@playwright/test';

/**
 * Demo pacing for the showcase recordings. When `SHOW_CURSOR=1` (set by scripts/record.mjs)
 * we type character-by-character and pause on the result of each action, so a viewer can
 * actually follow what the test is doing. Off-record (CI/normal runs) both are no-ops — tests
 * stay fast, and `record.mjs` normalizes the reported timings back to real suite speed.
 */
const RECORDING = process.env.SHOW_CURSOR === '1';

/** Linger after an action so the recording shows its result (modal open, row added, …). */
export async function settle(page: Page, ms = 620): Promise<void> {
  if (RECORDING) await page.waitForTimeout(ms);
}

/**
 * Flash a green "validated ✓" outline on an element a test is asserting on, so the recording
 * shows *what is being verified* (not just what's clicked). No-op off-record. Call it right
 * before the matching `expect(...)` on the same locator.
 */
export async function check(locator: Locator, hold = 850): Promise<void> {
  if (!RECORDING) return;
  const el = locator.first();
  await el.evaluate((node) => {
    node.scrollIntoView({ block: 'center' }); // bring the validated element on-screen, then flag it
    const w = window as unknown as { __qaCheck?: (n: Element) => void };
    if (w.__qaCheck) w.__qaCheck(node);
  });
  await el.page().waitForTimeout(hold);
}

/** Type into a field visibly (key by key) when recording; a plain instant fill otherwise. */
export async function type(locator: Locator, text: string): Promise<void> {
  if (!RECORDING) {
    await locator.fill(text);
    return;
  }
  await locator.click();
  await locator.fill(''); // clear any existing value (edit flow) before typing
  await locator.pressSequentially(text, { delay: 62 });
}
