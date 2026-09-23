import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for /books (public catalog with search).
 * The title cell is rendered with a dynamic id `see-book-<Title>`. Because
 * a title can contain spaces (invalid in a bare `#id` CSS selector), we use
 * an attribute selector instead, which handles spaces/special characters
 * correctly.
 */
export class BookStorePage extends BasePage {
  private readonly searchBox = this.page.locator('#searchBox');

  constructor(page: Page) {
    super(page);
  }

  async open(): Promise<void> {
    await this.goto('/books');
  }

  async searchBook(term: string): Promise<void> {
    await this.searchBox.fill(term);
  }

  async openBookByTitle(title: string): Promise<void> {
    await this.page.locator(`[id="see-book-${title}"]`).click();
  }
}
