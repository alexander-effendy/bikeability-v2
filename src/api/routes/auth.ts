// src/api/routes/auth.ts
import { apiClient } from "../lib/client";

export type User = {
  id: string;
  email: string | null;
  name: string | null;
};

/**
 * Login with Keycloak credentials via your FastAPI backend.
 *
 * - Calls POST /auth/login
 * - Backend:
 *   - Talks to Keycloak
 *   - Creates server-side session
 *   - Sets HttpOnly `session_id` cookie
 * - Returns basic user info
 */
export async function login(
  username: string,
  password: string
): Promise<User> {
  const res = await apiClient.post<User>("/auth/login", {
    username,
    password,
  });
  return res.data; // { id, email, name }
}

/**
 * Get current user from existing session.
 *
 * - Calls GET /auth/me
 * - Requires valid `session_id` cookie
 * - If not logged in, backend returns 401 → axios throws error
 */
export async function fetchMe(): Promise<User> {
  const res = await apiClient.get<User>("/auth/me");
  return res.data; // { id, email, name }
}

/**
 * Logout current user.
 *
 * - Calls POST /auth/logout
 * - Backend clears session + cookie
 */
export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}
