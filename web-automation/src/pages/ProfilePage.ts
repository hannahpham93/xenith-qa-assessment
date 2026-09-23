import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for /profile - the logged-in user's book collection and Logout.
 *
 * Logout shares `id="submit"` with unrelated forms elsewhere in the app,
 * so it's targeted by accessible name. Deleting a book is two clicks:
 * the row's delete icon only opens a "Delete Book" confirmation dialog -
 * its OK button (`#closeSmallModal-ok`) is what actually fires the
 * DELETE request.
 */
export class ProfilePage extends BasePage {
  private readonly logoutButton = this.page.getByRole('button', { name: 'Logout' });
  private readonly confirmDeleteButton = this.page.locator('#closeSmallModal-ok');

  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.goto('/profile');
  }

  async expectBookInCollection(title: string): Promise<void> {
    await expect(this.page.getByText(title, { exact: true })).toBeVisible();
  }

  async deleteBookByIsbn(isbn: string): Promise<void> {
    await this.page.locator(`[id="delete-record-${isbn}"]`).click();
    await this.clickAndWaitForResponse(this.confirmDeleteButton, '/BookStore/v1/Book', 'DELETE');
  }

  async expectBookRemoved(title: string): Promise<void> {
    await expect(this.page.getByText(title, { exact: true })).toBeHidden();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }

  async expectLoggedOut(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/);
  }
}
