import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { check, settle, type } from '../fixtures/pacing';

/**
 * Page Object for the login screen. Locators are declared inline off `this.page`
 * (assigned by BasePage's constructor), keyed to stable `data-testid` attributes.
 */
export class LoginPage extends BasePage {
  readonly emailInput = this.page.getByTestId('login-email');
  readonly passwordInput = this.page.getByTestId('login-password');
  readonly submitButton = this.page.getByTestId('login-submit');
  readonly errorMessage = this.page.getByTestId('login-error');

  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.submitButton.waitFor();
  }

  async login(email: string, password: string): Promise<void> {
    await type(this.emailInput, email);
    await type(this.passwordInput, password);
    await this.submitButton.click();
    await settle(this.page); // show the result of submitting (redirect or error)
  }

  async expectError(message: string | RegExp): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(message);
    await check(this.errorMessage); // green-flag the validated error message
  }
}
