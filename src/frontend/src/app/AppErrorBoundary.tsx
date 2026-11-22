import { Component, type ErrorInfo, type ReactNode } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

/**
 * Last line of defence for unexpected render failures. Page-level error states
 * belong to the owning feature; this boundary only keeps the shell usable.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Unhandled UI error', error, errorInfo.componentStack)
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>
              The screen could not be displayed. Reload the page to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <button
              type="button"
              className="text-sm underline underline-offset-4"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }
}
