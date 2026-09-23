import { test as base } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';
import { LoginPage } from '../pages/LoginPage';
import { BookStorePage } from '../pages/BookStorePage';
import { BookDetailPage } from '../pages/BookDetailPage';
import { ProfilePage } from '../pages/ProfilePage';
import { deleteUser, generateToken } from '../utils/bookstoreApiClient';

export interface CreatedTestUser {
  userId: string;
  userName: string;
  password: string;
}

export interface ApiCleanup {
  /** Register a user created during the test so it gets deleted afterwards, pass or fail. */
  track(user: CreatedTestUser): void;
}

interface PageFixtures {
  registerPage: RegisterPage;
  loginPage: LoginPage;
  bookStorePage: BookStorePage;
  bookDetailPage: BookDetailPage;
  profilePage: ProfilePage;
  apiCleanup: ApiCleanup;
}

/**
 * Extends Playwright's base test with one fixture per Page Object, plus an
 * `apiCleanup` fixture that deletes every test user created during the run,
 * even if the test fails partway through.
 */
export const test = base.extend<PageFixtures>({
  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  bookStorePage: async ({ page }, use) => {
    await use(new BookStorePage(page));
  },
  bookDetailPage: async ({ page }, use) => {
    await use(new BookDetailPage(page));
  },
  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },
  apiCleanup: [
    async ({}, use) => {
      const createdUsers: CreatedTestUser[] = [];
      await use({ track: (user) => createdUsers.push(user) });

      for (const user of createdUsers) {
        try {
          const token = await generateToken(user.userName, user.password);
          await deleteUser(user.userId, token);
        } catch (error) {
          // Best-effort: never fail the test suite because cleanup of a
          // throwaway demo account didn't succeed.
          console.warn(`[apiCleanup] failed to delete test user ${user.userName}:`, error);
        }
      }
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
