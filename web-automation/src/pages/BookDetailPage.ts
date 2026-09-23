import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the book detail view (opened from BookStorePage).
 *
 * "Add To Your Collection" and "Back To Book Store" share the same
 * `id="addNewRecordButton"` (a duplicate-id defect in the app), so this
 * targets the button by accessible name instead of id.
 */
export class BookDetailPage extends BasePage {
  private readonly addToCollectionButton = this.page.getByRole('button', {
    name: 'Add To Your Collection',
  });

  constructor(page: Page) {
    super(page);
  }

  async addToCollection(): Promise<void> {
    await this.clickAndWaitForResponse(this.addToCollectionButton, '/BookStore/v1/Books', 'POST');
  }

  async expectBookVisible(title: string): Promise<void> {
    await expect(this.page.getByText(title, { exact: true })).toBeVisible();
  }
}
