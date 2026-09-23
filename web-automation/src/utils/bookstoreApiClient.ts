import { env } from './env';

/**
 * Account API client used for test housekeeping (user provisioning and
 * cleanup) - not for the flow under test itself. See README "Why
 * registration is provisioned via API".
 */
export async function registerUser(userName: string, password: string): Promise<string> {
  const res = await fetch(`${env.baseUrl}/Account/v1/User`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, password }),
  });
  if (res.status !== 201) {
    const body = await res.text();
    throw new Error(`User provisioning failed with status ${res.status}: ${body}`);
  }
  const body = (await res.json()) as { userID: string };
  return body.userID;
}

export async function generateToken(userName: string, password: string): Promise<string> {
  const res = await fetch(`${env.baseUrl}/Account/v1/GenerateToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName, password }),
  });
  const body = (await res.json()) as { token?: string; status?: string };
  if (!body.token) {
    throw new Error(`Could not obtain a token for cleanup (status: ${body.status ?? 'unknown'})`);
  }
  return body.token;
}

export async function deleteUser(userId: string, token: string): Promise<void> {
  const res = await fetch(`${env.baseUrl}/Account/v1/User/${userId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status !== 204) {
    throw new Error(`Cleanup delete for user ${userId} returned unexpected status ${res.status}`);
  }
}
