import { apiFetch } from '../lib/api-client.ts'

export type Credentials = { email: string; password: string }

export type User = { id: string; email: string; createdAt: string }

type TokenResponse = { accessToken: string; tokenType: 'Bearer'; expiresIn: number }

export function login(credentials: Credentials) {
  return apiFetch<TokenResponse>('/api/auth/login', { method: 'POST', body: credentials })
}

/** Creates the account only; the caller logs in afterwards. */
export function register(credentials: Credentials) {
  return apiFetch<User>('/api/auth/register', { method: 'POST', body: credentials })
}

export function getCurrentUser(signal?: AbortSignal) {
  return apiFetch<User>('/api/users/me', { signal })
}
