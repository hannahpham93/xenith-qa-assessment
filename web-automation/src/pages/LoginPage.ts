import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { TestUser } from '../utils/testDataFactory';

/** Page Object for /login. On success, redirects to /profile. */
export class LoginPage extends BasePage {
  private readonly userName = this.page.locator('#userName');
  private readonly password = this.page.locator('#password');
  private readonly loginButton = this.page.locator('#login');
  private readonly errorMessage = this.page.locator('#output #name');

  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.goto('/login');
  }

  async login(user: Pick<TestUser, 'userName' | 'password'>): Promise<void> {
    await this.userName.fill(user.userName);
    await this.password.fill(user.password);
    await this.clickAndWaitForResponse(this.loginButton, '/Account/v1/GenerateToken', 'POST');
  }

  async expectLoginSucceeded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/profile/);
  }

  async expectLoginError(expectedMessage = 'Invalid username or password!'): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    await expect(this.errorMessage).toContainText(expectedMessage);
  }
}
