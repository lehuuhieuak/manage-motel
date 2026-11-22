/**
 * RFC 9457 Problem Details returned by the API Gateway and every service.
 * See docs/contracts/api-conventions.md.
 */
export interface ApiProblem {
  type?: string
  title?: string
  status?: number
  code?: string
  detail?: string
  traceId?: string
  correlationId?: string
  errors?: Record<string, string[]>
}

const GENERIC_MESSAGE = 'Something went wrong. Please try again.'
const NETWORK_MESSAGE = 'Cannot reach the server. Check your connection and try again.'

const STATUS_MESSAGES: Record<number, string> = {
  400: 'The request was rejected. Review the submitted values.',
  401: 'Your session has expired. Sign in again.',
  403: 'You are not allowed to perform this action.',
  404: 'The requested item was not found.',
  409: 'This item was changed in the meantime. Reload and try again.',
  422: 'Some values are not valid. Review the highlighted fields.',
}

/** Error type every API call rejects with; `message` is always safe to display. */
export class ApiError extends Error {
  readonly status: number
  readonly problem: ApiProblem | undefined

  constructor(message: string, status: number, problem?: ApiProblem) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
  }
}

/** Keeps only the contract fields, so a malformed body cannot leak into the UI. */
export function parseApiProblem(body: unknown, status: number): ApiProblem | undefined {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return undefined
  }

  const record = body as Record<string, unknown>
  const problem: ApiProblem = { status }

  if (typeof record.type === 'string') problem.type = record.type
  if (typeof record.title === 'string') problem.title = record.title
  if (typeof record.status === 'number') problem.status = record.status
  if (typeof record.code === 'string') problem.code = record.code
  if (typeof record.detail === 'string') problem.detail = record.detail
  if (typeof record.traceId === 'string') problem.traceId = record.traceId
  if (typeof record.correlationId === 'string') problem.correlationId = record.correlationId
  if (record.errors !== null && typeof record.errors === 'object') {
    problem.errors = record.errors as Record<string, string[]>
  }

  return problem
}

/**
 * `status === 0` means the request never reached the server. Server-authored
 * `detail`/`title` are surfaced for client errors only; 5xx responses fall back
 * to a generic message so internals never reach the UI.
 */
export function toApiError(status: number, problem?: ApiProblem): ApiError {
  if (!problem) {
    return status === 0
      ? new ApiError(NETWORK_MESSAGE, status)
      : new ApiError(STATUS_MESSAGES[status] ?? GENERIC_MESSAGE, status)
  }

  if (status >= 500) {
    return new ApiError(GENERIC_MESSAGE, status, problem)
  }

  return new ApiError(
    problem.detail ?? problem.title ?? STATUS_MESSAGES[status] ?? GENERIC_MESSAGE,
    status,
    problem,
  )
}

/** Maps any thrown value to a message that is safe to render. */
export function toSafeMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message
  }

  return GENERIC_MESSAGE
}
