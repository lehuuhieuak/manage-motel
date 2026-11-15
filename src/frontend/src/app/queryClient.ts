import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/services/apiProblem'

/**
 * Server state defaults: short-lived cache, no retry for client errors, and no
 * automatic retry for mutations so duplicate commands are never issued.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            return false
          }
          return failureCount < 2
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}
