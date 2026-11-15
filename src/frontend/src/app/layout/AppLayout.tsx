import { Link, Outlet } from 'react-router'
import { env } from '@/app/env'
import { routePaths } from '@/routes/paths'

/** Application shell: global chrome plus the routed screen outlet. */
export function AppLayout() {
  return (
    <div className="bg-background text-foreground flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to={routePaths.home} className="font-heading text-lg font-medium">
            Motel Management
          </Link>
          <span className="text-muted-foreground text-xs">{env.mode}</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t">
        <div className="text-muted-foreground mx-auto w-full max-w-5xl px-4 py-3 text-xs">
          API gateway base path: <code className="font-mono">{env.apiBaseUrl}</code>
        </div>
      </footer>
    </div>
  )
}
