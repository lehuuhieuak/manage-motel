import { QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { AppErrorBoundary } from '@/app/AppErrorBoundary'
import { createQueryClient } from '@/app/queryClient'

/**
 * Application-wide providers. Router and theme providers are added here as the
 * shell grows; features never mount their own providers.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </AppErrorBoundary>
  )
}
