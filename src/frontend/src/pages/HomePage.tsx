import { GatewayStatusCard } from '@/features/system-status/GatewayStatusCard'

/** Screen-level composition only: pages wire features together, they never call the API. */
export function HomePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Motel Management</h1>
        <p className="text-muted-foreground text-sm">
          Owner workspace shell. Workflows live in <code>src/features</code> and are composed here.
        </p>
      </div>
      <GatewayStatusCard />
    </div>
  )
}
