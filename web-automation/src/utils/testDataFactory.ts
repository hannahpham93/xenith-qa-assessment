import { env } from './env';

export interface TestUser {
  firstName: string;
  lastName: string;
  userName: string;
  password: string;
}

/** Generates a unique, disposable test user so parallel/repeated runs never collide. */
export function generateTestUser(): TestUser {
  const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 10_000)}`;
  return {
    firstName: 'Anh',
    lastName: 'Pham',
    userName: `qa_user_${uniqueSuffix}`,
    password: env.testUserPassword,
  };
}
