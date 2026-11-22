import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/services/httpClient'

const GATEWAY_HEALTH_PATH = '/health/ready'

async function fetchGatewayHealth(signal: AbortSignal): Promise<string> {
  return apiRequest<string>(GATEWAY_HEALTH_PATH, {
    baseUrl: '',
    responseType: 'text',
    signal,
  })
}

/**
 * Probes the Gateway readiness endpoint, which lives outside `/api/v1`. Keeps
 * the browser-to-Gateway wiring visible while features are still being built.
 */
export function useGatewayHealth() {
  return useQuery({
    queryKey: ['gateway', 'health'],
    queryFn: ({ signal }) => fetchGatewayHealth(signal),
    retry: false,
    refetchInterval: 30_000,
  })
}
