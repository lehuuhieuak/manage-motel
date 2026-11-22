const DEFAULT_API_BASE_URL = '/api/v1'

/**
 * Accepts a root-relative path (`/api/v1`) or an absolute http(s) origin so the
 * same build can run behind Aspire, Docker Compose, or a deployed gateway.
 */
function normalizeBaseUrl(value: string | undefined): string {
  const candidate = value?.trim()
  if (!candidate) {
    return DEFAULT_API_BASE_URL
  }

  const normalized = candidate.replace(/\/+$/, '')
  const isRootRelative = normalized.startsWith('/')
  const isAbsoluteUrl = /^https?:\/\//i.test(normalized)

  if (!isRootRelative && !isAbsoluteUrl) {
    throw new Error(
      `VITE_API_BASE_URL must be a root-relative path or an absolute http(s) URL, received "${candidate}".`,
    )
  }

  return normalized
}

export const env = {
  apiBaseUrl: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL),
  mode: import.meta.env.MODE,
  isDevelopment: import.meta.env.DEV,
} as const
