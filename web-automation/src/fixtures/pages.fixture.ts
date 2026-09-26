import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { BookStorePage } from '../pages/BookStorePage';
import { BookDetailPage } from '../pages/BookDetailPage';
import { ProfilePage } from '../pages/ProfilePage';
import { deleteUser, registerUser, RegisteredUser } from '../utils/bookstoreApiClient';
import { generateTestUser } from '../utils/testDataFactory';

export interface TestUsers {
  /** Registers a fresh user via the API. It is deleted after the test, pass or fail. */
  create(): Promise<RegisteredUser>;
}

interface Fixtures {
  loginPage: LoginPage;
  bookStorePage: BookStorePage;
  bookDetailPage: BookDetailPage;
  profilePage: ProfilePage;
  testUsers: TestUsers;
}

/**
 * Extends Playwright's base test with one fixture per Page Object, plus a
 * `testUsers` fixture that provisions users and deletes them on teardown.
 */
export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  bookStorePage: async ({ page }, use) => use(new BookStorePage(page)),
  bookDetailPage: async ({ page }, use) => use(new BookDetailPage(page)),
  profilePage: async ({ page }, use) => use(new ProfilePage(page)),

  testUsers: async ({}, use) => {
    const created: RegisteredUser[] = [];
    await use({
      create: async () => {
        const user = await registerUser(generateTestUser());
        created.push(user);
        return user;
      },
    });

    for (const user of created) {
      try {
        await deleteUser(user);
      } catch (error) {
        // Best-effort: never fail the suite because cleanup of a throwaway
        // demo account didn't succeed.
        console.warn(`[testUsers] failed to delete test user ${user.userName}:`, error);
      }
    }
  },
});

export { expect } from '@playwright/test';
