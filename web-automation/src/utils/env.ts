import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Centralised, typed access to environment configuration.
 * No secret ever lives in source - everything is read from process.env,
 * with safe (non-secret) fallbacks for local/demo runs.
 */
export const env = {
  baseUrl: process.env.BASE_URL ?? 'https://demoqa.com',
  testUserPassword: process.env.TEST_USER_PASSWORD ?? 'Test@1234!',
};
