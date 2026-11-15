import { env } from '@/app/env'
import { getAccessToken } from './accessToken'
import { parseApiProblem, toApiError } from './apiProblem'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestOptions {
  method?: HttpMethod
  /** JSON-serialized request body; use `undefined` for bodyless commands. */
  body?: unknown
  /** Appended as a query string; `null`/`undefined` values are dropped. */
  query?: Record<string, string | number | boolean | null | undefined>
  headers?: Record<string, string>
  signal?: AbortSignal
  /** Overrides `env.apiBaseUrl`, e.g. for gateway endpoints outside `/api/v1`. */
  baseUrl?: string
  /** `json` (default) decodes JSON payloads, `text` reads plain-text responses. */
  responseType?: 'json' | 'text'
}

const JSON_CONTENT_TYPE = 'application/json'

function buildUrl(path: string, baseUrl: string, query: RequestOptions['query']): string {
  const base = baseUrl.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (/^https?:\/\//i.test(path)) {
    throw new Error(`apiRequest expects a path relative to the gateway, received "${path}".`)
  }

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined) {
      search.append(key, String(value))
    }
  }

  const queryString = search.toString()
  return `${base}${normalizedPath}${queryString ? `?${queryString}` : ''}`
}

interface ResponseBody {
  raw: string
  isJson: boolean
}

async function readBody(response: Response): Promise<ResponseBody> {
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return { raw: '', isJson: false }
  }

  const raw = await response.text()
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''

  return { raw, isJson: raw.length > 0 && contentType.includes('json') }
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return undefined
  }
}

/**
 * Single entry point for Gateway traffic: `/api/v1` base path, JSON bodies,
 * correlation id propagation, refresh cookie credentials, and Problem Details
 * errors. Every caller receives either a decoded payload or a safe `ApiError`.
 */
export async function apiRequest<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const {
    method = 'GET',
    body,
    query,
    headers,
    signal,
    baseUrl = env.apiBaseUrl,
    responseType = 'json',
  } = options

  const accessToken = getAccessToken()
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json, application/problem+json',
    'X-Correlation-Id': crypto.randomUUID(),
    ...headers,
  }

  if (body !== undefined) {
    requestHeaders['Content-Type'] = JSON_CONTENT_TYPE
  }

  if (accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, baseUrl, query), {
      method,
      headers: requestHeaders,
      credentials: 'include',
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    // Aborts stay untouched so TanStack Query can treat them as cancellations.
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw toApiError(0)
  }

  const { raw, isJson } = await readBody(response)

  if (!response.ok) {
    // Error bodies are Problem Details whenever the API labels them as JSON,
    // independent of the payload type the caller expects on success.
    throw toApiError(
      response.status,
      isJson ? parseApiProblem(parseJson(raw), response.status) : undefined,
    )
  }

  if (responseType === 'text' || !isJson) {
    return raw as TResponse
  }

  const payload = parseJson(raw)
  if (payload === undefined) {
    throw toApiError(response.status, undefined)
  }

  return payload as TResponse
}
