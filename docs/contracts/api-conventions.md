# API Conventions

## URL and representation

- Base path: `/api/v1`.
- Resources use plural nouns and UUID identifiers.
- JSON property names use `camelCase`.
- Date/time values are UTC ISO-8601 strings ending in `Z`.
- Every public endpoint is documented with OpenAPI.

## HTTP status codes

```text
200 OK                 successful read or command
201 Created            resource created
202 Accepted           asynchronous command accepted
204 No Content         successful operation without a response body
400 Bad Request        malformed request
401 Unauthorized       missing or invalid authentication
403 Forbidden          authenticated but not authorized
404 Not Found          resource does not exist
409 Conflict           state, uniqueness, or idempotency conflict
422 Unprocessable Entity valid shape but business validation failed
500 Internal Server Error unexpected server failure
```

## Error response

Use RFC 9457-style Problem Details:

```json
{
  "type": "https://errors.manage-motel.local/room-capacity-exceeded",
  "title": "Room capacity exceeded",
  "status": 422,
  "code": "room.capacity_exceeded",
  "detail": "The room has no available capacity.",
  "traceId": "...",
  "correlationId": "..."
}
```

Do not return stack traces, SQL details, secrets, or provider credentials.

## Pagination

Collection endpoints use:

```text
?page=1&pageSize=20
```

`pageSize` defaults to 20 and is capped at 100. A collection response uses:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "totalCount": 0
}
```

## Headers and idempotency

- Accept and return `X-Correlation-Id`; generate one when absent.
- Propagate W3C `traceparent` for OpenTelemetry.
- Commands that create payments, invoices, refunds, or other financial
  transactions accept `Idempotency-Key`.
- Repeating an idempotent request returns the original result rather than
  executing the operation twice.

## Validation and concurrency

- Validate syntax at the API boundary.
- Validate business rules in the Application/Domain layer.
- Use `409` for optimistic-concurrency or state conflicts.
- Use `422` for a well-formed request that violates a domain rule.
- Keep API DTOs separate from domain and persistence models.

## Health

Every service exposes:

```text
/health/live
/health/ready
```

Readiness checks only dependencies required for the service to accept traffic.
