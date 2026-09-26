import { Locator, Page, Response } from '@playwright/test';

/** Common behaviour shared by every Page Object. */
export abstract class BasePage {
  /** Route of the page, for pages that can be opened directly. */
  protected readonly path?: string;

  constructor(protected readonly page: Page) {}

  async open(): Promise<void> {
    if (!this.path) {
      throw new Error(`${this.constructor.name} has no direct route`);
    }
    await this.page.goto(this.path);
  }

  /** A book title rendered as its own text node (catalog, detail and profile pages). */
  protected bookTitle(title: string): Locator {
    return this.page.getByText(title, { exact: true });
  }

  /** Clicks a locator and resolves once the API call it triggers completes. */
  protected async clickAndWaitForResponse(
    locator: Locator,
    urlSubstring: string,
    method: string,
  ): Promise<Response> {
    const response = this.page.waitForResponse(
      (res) => res.url().includes(urlSubstring) && res.request().method() === method,
    );
    await locator.click();
    return response;
  }
}
