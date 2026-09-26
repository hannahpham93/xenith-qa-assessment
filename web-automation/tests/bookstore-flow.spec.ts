import { test } from '../src/fixtures/pages.fixture';
import booksData from '../testdata/books.json';

interface BookScenario {
  scenario: string;
  searchTerm: string;
  expectedTitle: string;
}

/**
 * The required flow, data-driven over testdata/books.json. Covers test
 * plan cases U1, U3, U5, U6, U8. Registration is provisioned via the
 * Account API (reCAPTCHA blocks the form under automation - see README);
 * every other step drives the real browser.
 */
for (const scenario of booksData as BookScenario[]) {
  test(`bookstore flow [${scenario.scenario}]: register, login, add "${scenario.expectedTitle}", view, delete, logout`, async ({
    loginPage,
    bookStorePage,
    bookDetailPage,
    profilePage,
    testUsers,
  }) => {
    const user = await test.step('1. Register a new user (provisioned via Account API - see README)', () =>
      testUsers.create(),
    );

    await test.step('1b. U1 - Login with the new user', async () => {
      await loginPage.open();
      await loginPage.login(user);
      await loginPage.expectLoginSucceeded(user.userName);
    });

    await test.step(`2. U3/U5 - Search "${scenario.searchTerm}", open and add "${scenario.expectedTitle}"`, async () => {
      await bookStorePage.open();
      await bookStorePage.searchBook(scenario.searchTerm);
      await bookStorePage.expectOnlyResults([scenario.expectedTitle]);
      await bookStorePage.openBookByTitle(scenario.expectedTitle);
      await bookDetailPage.expectBookVisible(scenario.expectedTitle);
      await bookDetailPage.addToCollection();
    });

    await test.step('3. U5 - See the book in the collection list', async () => {
      await profilePage.open();
      await profilePage.expectBookInCollection(scenario.expectedTitle);
    });

    await test.step('4. U6 - Delete the book (confirm dialog -> OK)', async () => {
      await profilePage.deleteBook(scenario.expectedTitle);
      await profilePage.expectBookRemoved(scenario.expectedTitle);
    });

    await test.step('5. U8 - Logout, and /profile is no longer accessible', async () => {
      await profilePage.logout();
      await profilePage.expectLoggedOut();
    });
  });
}
