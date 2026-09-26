import { expect } from '@playwright/test';
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
  protected readonly path = '/profile';
  private readonly logoutButton = this.page.getByRole('button', { name: 'Logout' });
  private readonly confirmDeleteButton = this.page.locator('#closeSmallModal-ok');
  private readonly cancelDeleteButton = this.page.locator('#closeSmallModal-cancel');
  private readonly notLoggedInMessage = this.page.getByText(
    'Currently you are not logged into the Book Store application',
  );

  /** The delete icon in the collection row that shows this title. */
  private deleteIcon(title: string) {
    return this.page.locator('tr', { hasText: title }).locator('[id^="delete-record-"]');
  }

  async expectBookInCollection(title: string): Promise<void> {
    await expect(this.bookTitle(title)).toBeVisible();
  }

  async deleteBook(title: string): Promise<void> {
    await this.deleteIcon(title).click();
    await this.clickAndWaitForResponse(this.confirmDeleteButton, '/BookStore/v1/Book', 'DELETE');
  }

  /** Opens the delete dialog and dismisses it; the book must survive. */
  async cancelDelete(title: string): Promise<void> {
    await this.deleteIcon(title).click();
    await this.cancelDeleteButton.click();
    await expect(this.cancelDeleteButton).toBeHidden();
  }

  async expectBookRemoved(title: string): Promise<void> {
    await expect(this.bookTitle(title)).toBeHidden();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }

  /** Logout lands on /login, and /profile no longer shows the account. */
  async expectLoggedOut(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/);
    await this.open();
    await expect(this.notLoggedInMessage).toBeVisible();
    await expect(this.logoutButton).toBeHidden();
  }
}
