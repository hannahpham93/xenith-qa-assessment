import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { TestUser } from '../utils/testDataFactory';

/** Page Object for /login. On success, redirects to /profile. */
export class LoginPage extends BasePage {
  protected readonly path = '/login';
  private readonly userName = this.page.locator('#userName');
  private readonly password = this.page.locator('#password');
  private readonly loginButton = this.page.locator('#login');
  private readonly errorMessage = this.page.locator('#output #name');

  async login(user: TestUser): Promise<void> {
    await this.userName.fill(user.userName);
    await this.password.fill(user.password);
    await this.clickAndWaitForResponse(this.loginButton, '/Account/v1/GenerateToken', 'POST');
  }

  /** The URL alone is a weak check, so also confirm the profile shows this user. */
  async expectLoginSucceeded(userName: string): Promise<void> {
    await expect(this.page).toHaveURL(/\/profile/);
    await expect(this.page.locator('#userName-value')).toHaveText(userName);
  }

  async expectLoginError(expectedMessage = 'Invalid username or password!'): Promise<void> {
    await expect(this.errorMessage).toContainText(expectedMessage);
    await expect(this.page).toHaveURL(/\/login/);
  }
}
