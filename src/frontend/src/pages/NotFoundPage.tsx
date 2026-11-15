import { Link } from 'react-router'
import { routePaths } from '@/routes/paths'
import { Button } from '@/shared/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground text-sm">The page you requested does not exist.</p>
      <Button asChild variant="outline">
        <Link to={routePaths.home}>Back to home</Link>
      </Button>
    </div>
  )
}
