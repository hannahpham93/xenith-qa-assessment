import { Locator, Page, Response } from '@playwright/test';

/** Common behaviour shared by every Page Object. */
export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
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
