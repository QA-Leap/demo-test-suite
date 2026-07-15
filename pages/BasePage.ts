import type { Page } from '@playwright/test';

/**
 * Base for every Page Object. It holds the Playwright `page`, assigned in this constructor
 * during `super()` — which runs *before* a subclass's field initializers. That lets each
 * page declare its locators inline (`readonly x = this.page.getByTestId('…')`) with no
 * constructor of its own, and without the `used before its initialization` (TS2729) trap
 * that hits the same pattern in a single, base-less class.
 */
export abstract class BasePage {
  constructor(readonly page: Page) {}
}
