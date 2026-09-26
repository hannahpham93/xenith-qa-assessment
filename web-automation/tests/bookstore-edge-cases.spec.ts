import { test, expect } from '../src/fixtures/pages.fixture';
import { addBookToCollection, getIsbnByTitle } from '../src/utils/bookstoreApiClient';

/**
 * UI behaviours outside the happy path - test plan cases U2, U4, U7.
 * Preconditions are set up via the API so each test exercises only the
 * UI behaviour it is named after.
 */

const SEEDED_TITLE = 'Git Pocket Guide';

test('U2 - login with a wrong password shows an error and stays on /login', async ({ loginPage, testUsers }) => {
  const user = await testUsers.create();

  await loginPage.open();
  // The API answers HTTP 200 with status "Failed" (plan A6), so this
  // checks the frontend branches on the body, not the HTTP status.
  await loginPage.login({ ...user, password: 'Wrong@1234!' });
  await loginPage.expectLoginError();
});

test('U4 - search with no matches renders an empty list without errors', async ({ page, bookStorePage }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));

  await bookStorePage.open();
  await bookStorePage.searchBook('zz-no-such-book-zz');
  await bookStorePage.expectNoResults();
  expect(pageErrors).toEqual([]);
});

test('U7 - cancelling the delete dialog keeps the book and sends no DELETE', async ({
  page,
  loginPage,
  profilePage,
  testUsers,
}) => {
  const user = await testUsers.create();
  // Seed before the UI login: seeding logs in via the API, which would
  // invalidate an earlier UI session's token.
  await addBookToCollection(user, await getIsbnByTitle(SEEDED_TITLE));

  const deleteCalls: string[] = [];
  page.on('request', (req) => {
    if (req.method() === 'DELETE' && req.url().includes('/BookStore/v1/Book')) deleteCalls.push(req.url());
  });

  await loginPage.open();
  await loginPage.login(user);
  await loginPage.expectLoginSucceeded(user.userName);

  await profilePage.open();
  await profilePage.cancelDelete(SEEDED_TITLE);
  await profilePage.expectBookInCollection(SEEDED_TITLE);
  expect(deleteCalls).toEqual([]);
});
