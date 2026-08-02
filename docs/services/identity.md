# Identity Service

## Responsibility

Identity owns motel user accounts, password credentials, roles, refresh
sessions, and authentication audit history. It is the only service allowed to
read or change this data.

## Domain model

The initial consistency boundaries are:

- `User`: account status, password credential metadata, and roles.
- `RefreshSession`: one rotating refresh-token family/session.
- `AuditLog`: security-relevant authentication activity.

Passwords are stored using a password-hashing algorithm supported by the
platform; plaintext passwords are never persisted or logged.

## Layers

`Identity.Domain` contains user and refresh-session rules. `Identity.Application`
contains login, refresh, logout, password change, and role-management use cases.
`Identity.Infrastructure` contains EF Core and token/session persistence.
`Identity.Api` exposes the authentication endpoints and cookie handling.

## API

```text
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/change-password
GET  /api/v1/users/me
```

`/auth/refresh` reads the refresh token from an HttpOnly cookie and rotates it.
The browser never receives the refresh token in a JSON response.

## Persistence

Identity owns SQL Server database `identity_db`, including the refresh-session
fields:

```text
TokenHash, TokenFamilyId, UserId, ExpiresAt, UsedAt, RevokedAt,
ReplacedByTokenId, CreatedAt, UserAgent, IpAddress
```

EF Core SQL Server migrations are committed with the service source. Refresh
token hashes are indexed and unique.

## Security rules

- Access tokens expire after 15 minutes.
- Roles are `Admin` and `User`.
- Refresh-token rotation and reuse detection are mandatory.
- Logout revokes the current token family.
- The service remains the final authorization boundary even when the Gateway
  has already applied a route policy.

## Events and dependencies

Identity has no dependency on Rental, Billing, Metering, or Payment databases.
Security events may be added later, but authentication must not depend on an
event being consumed by another service.
