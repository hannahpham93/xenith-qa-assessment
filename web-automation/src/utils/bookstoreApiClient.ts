import { env } from './env';
import { TestUser } from './testDataFactory';

/**
 * API client used for test housekeeping (user provisioning, seeding and
 * cleanup) - not for the flow under test itself. See README "Why
 * registration is provisioned via API".
 *
 * demoqa keeps one active token per user: generating a new one invalidates
 * the previous one. Functions that need a token log in afresh, so call them
 * before the UI logs in, never in the middle of a UI session.
 */
export interface RegisteredUser extends TestUser {
  userId: string;
}

interface CallOptions {
  body?: unknown;
  token?: string;
  expectStatus: number;
}

async function call<T>(method: string, path: string, { body, token, expectStatus }: CallOptions): Promise<T> {
  const res = await fetch(`${env.baseUrl}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (res.status !== expectStatus) {
    throw new Error(`${method} ${path} returned ${res.status}, expected ${expectStatus}: ${text}`);
  }
  return (text ? JSON.parse(text) : undefined) as T;
}

const credentials = ({ userName, password }: TestUser) => ({ userName, password });

export async function registerUser(user: TestUser): Promise<RegisteredUser> {
  const body = await call<{ userID: string }>('POST', '/Account/v1/User', {
    body: credentials(user),
    expectStatus: 201,
  });
  return { ...user, userId: body.userID };
}

async function generateToken(user: TestUser): Promise<string> {
  const body = await call<{ token: string | null; status: string }>('POST', '/Account/v1/GenerateToken', {
    body: credentials(user),
    expectStatus: 200,
  });
  if (!body.token) {
    throw new Error(`Login for ${user.userName} failed (status: ${body.status})`);
  }
  return body.token;
}

export async function deleteUser(user: RegisteredUser): Promise<void> {
  const token = await generateToken(user);
  await call('DELETE', `/Account/v1/User/${user.userId}`, { token, expectStatus: 204 });
}

export async function getIsbnByTitle(title: string): Promise<string> {
  const body = await call<{ books: Array<{ isbn: string; title: string }> }>('GET', '/BookStore/v1/Books', {
    expectStatus: 200,
  });
  const match = body.books.find((b) => b.title === title);
  if (!match) {
    throw new Error(`Book titled "${title}" was not found in the live catalog`);
  }
  return match.isbn;
}

/** Seeds a user's collection directly, for tests whose subject is a later step. */
export async function addBookToCollection(user: RegisteredUser, isbn: string): Promise<void> {
  const token = await generateToken(user);
  await call('POST', '/BookStore/v1/Books', {
    body: { userId: user.userId, collectionOfIsbns: [{ isbn }] },
    token,
    expectStatus: 201,
  });
}
