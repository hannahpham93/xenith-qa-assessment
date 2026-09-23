import { test, expect } from '../src/fixtures/pages.fixture';
import { generateTestUser } from '../src/utils/testDataFactory';
import { registerUser } from '../src/utils/bookstoreApiClient';
import { env } from '../src/utils/env';
import booksData from '../testdata/books.json';

interface BookScenario {
  scenario: string;
  searchTerm: string;
  expectedTitle: string;
}

/**
 * Data-driven: the Register -> Login -> Search & add -> View collection
 * -> Delete -> Logout flow runs once per entry in testdata/books.json.
 * Registration is provisioned via the Account API rather than the UI
 * (see README "Why registration is provisioned via API"); every other
 * step drives the real browser.
 */
for (const scenario of booksData as BookScenario[]) {
  test(`bookstore flow [${scenario.scenario}]: register, login, add "${scenario.expectedTitle}", view, delete, logout`, async ({
    loginPage,
    bookStorePage,
    bookDetailPage,
    profilePage,
    apiCleanup,
  }) => {
    const user = generateTestUser();

    await test.step('1. Register a new user (provisioned via Account API - see README)', async () => {
      const userId = await registerUser(user.userName, user.password);
      apiCleanup.track({ userId, userName: user.userName, password: user.password });
    });

    await test.step('1b. Login with the new user (real browser UI)', async () => {
      await loginPage.open();
      await loginPage.login(user);
      await loginPage.expectLoginSucceeded();
    });

    await test.step(`2. Search and add "${scenario.expectedTitle}" to collection`, async () => {
      await bookStorePage.open();
      await bookStorePage.searchBook(scenario.searchTerm);
      await bookStorePage.openBookByTitle(scenario.expectedTitle);
      await bookDetailPage.expectBookVisible(scenario.expectedTitle);
      await bookDetailPage.addToCollection();
    });

    await test.step('3. See the book in the collection list', async () => {
      await profilePage.open();
      await profilePage.expectBookInCollection(scenario.expectedTitle);
    });

    await test.step('4. Delete the book from the collection', async () => {
      const isbn = await getIsbnForTitle(scenario.expectedTitle);
      await profilePage.deleteBookByIsbn(isbn);
      await profilePage.expectBookRemoved(scenario.expectedTitle);
    });

    await test.step('5. Logout', async () => {
      await profilePage.logout();
      await profilePage.expectLoggedOut();
    });
  });
}

/**
 * The UI never shows the ISBN, but the delete action's DOM id is keyed
 * by it. Resolved live from the catalog instead of hard-coded in test
 * data, so it can't drift if demoqa's catalog contents change.
 */
async function getIsbnForTitle(title: string): Promise<string> {
  const response = await fetch(`${env.baseUrl}/BookStore/v1/Books`);
  const body = (await response.json()) as { books: Array<{ isbn: string; title: string }> };
  const match = body.books.find((b) => b.title === title);
  if (!match) {
    throw new Error(`Book titled "${title}" was not found in the live catalog`);
  }
  return match.isbn;
}
