import { RefreshCw } from 'lucide-react'
import { env } from '@/app/env'
import { useGatewayHealth } from '@/features/system-status/useGatewayHealth'
import { ApiError, toSafeMessage } from '@/services/apiProblem'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

function describeStatus(isPending: boolean, isSuccess: boolean, error: unknown): string {
  if (isPending) {
    return 'Checking…'
  }

  if (isSuccess) {
    return 'Ready'
  }

  return error instanceof ApiError && error.status === 0 ? 'Unreachable' : 'Error response'
}

export function GatewayStatusCard() {
  const { data, error, isError, isFetching, isPending, isSuccess, refetch } = useGatewayHealth()

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>API Gateway</CardTitle>
        <CardDescription className="font-mono">{env.apiBaseUrl}</CardDescription>
        <CardAction>
          <Button
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => {
              void refetch()
            }}
          >
            <RefreshCw />
            Check
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p>
          Status: <span className="font-medium">{describeStatus(isPending, isSuccess, error)}</span>
        </p>
        {isSuccess ? <p className="text-muted-foreground">Health: {data}</p> : null}
        {isError ? <p className="text-destructive">{toSafeMessage(error)}</p> : null}
      </CardContent>
    </Card>
  )
}
