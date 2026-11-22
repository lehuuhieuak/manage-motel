/**
 * Access tokens live in memory only; the refresh token stays in an HttpOnly
 * cookie owned by Identity. See docs/frontend-architecture.md.
 */
let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}
