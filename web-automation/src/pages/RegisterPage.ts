import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { TestUser } from '../utils/testDataFactory';

/**
 * Page Object for /register.
 *
 * Not wired into the automated critical path: this form is gated by an
 * invisible reCAPTCHA v3 that never resolves under automated Chromium
 * (see README "Why registration is provisioned via API"). Kept here for
 * completeness and manual verification; the data-driven spec provisions
 * users via `bookstoreApiClient.registerUser` instead.
 */
export class RegisterPage extends BasePage {
  private readonly firstName = this.page.locator('#firstname');
  private readonly lastName = this.page.locator('#lastname');
  private readonly userName = this.page.locator('#userName');
  private readonly password = this.page.locator('#password');
  private readonly submitButton = this.page.locator('#register');
  private readonly errorMessage = this.page.locator('#output #name');

  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.goto('/register');
  }

  /** Submits the form and returns the new user's `userID`. */
  async registerNewUser(user: TestUser): Promise<string> {
    await this.firstName.fill(user.firstName);
    await this.lastName.fill(user.lastName);
    await this.userName.fill(user.userName);
    await this.password.fill(user.password);

    const response = await this.clickAndWaitForResponse(this.submitButton, '/Account/v1/User', 'POST');
    const body = (await response.json()) as { userID: string };
    return body.userID;
  }

  async expectRegistrationSucceeded(): Promise<void> {
    await expect(this.errorMessage).toBeHidden();
  }

  async expectRegistrationError(expectedMessageSubstring: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(expectedMessageSubstring);
  }
}
