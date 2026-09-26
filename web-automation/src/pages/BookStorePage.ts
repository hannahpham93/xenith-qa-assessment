import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for /books (public catalog with search).
 * The title cell is rendered with a dynamic id `see-book-<Title>`. Because
 * a title can contain spaces (invalid in a bare `#id` CSS selector), we use
 * an attribute selector instead, which handles spaces/special characters
 * correctly.
 */
export class BookStorePage extends BasePage {
  protected readonly path = '/books';
  private readonly searchBox = this.page.locator('#searchBox');
  private readonly resultTitles = this.page.locator('[id^="see-book-"]');

  async searchBook(term: string): Promise<void> {
    await this.searchBox.fill(term);
  }

  async openBookByTitle(title: string): Promise<void> {
    await this.page.locator(`[id="see-book-${title}"]`).click();
  }

  async expectOnlyResults(titles: string[]): Promise<void> {
    await expect(this.resultTitles).toHaveText(titles);
  }

  /** No match renders an empty table ("Page 1 of 0"), not a message. */
  async expectNoResults(): Promise<void> {
    await expect(this.resultTitles).toHaveCount(0);
  }
}
