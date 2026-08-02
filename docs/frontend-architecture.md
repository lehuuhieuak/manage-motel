# Frontend Architecture

The React application uses a feature-based modular structure. It follows the
same separation-of-concerns goals as Clean Architecture but does not copy the
backend's four-project layout or introduce unnecessary abstractions.

```text
frontend/src/
├── app/          application setup, providers, query client
├── routes/       route definitions and guards
├── pages/        screen-level composition
├── features/     complete user workflows
├── entities/     shared UI-facing domain types
├── services/     HTTP client and API adapters
└── shared/       reusable UI, validation, and utilities
```

## Rules

- `pages` compose features; they do not contain low-level HTTP calls.
- `features` own their forms, API hooks, validation, and workflow components.
- `services` contain the configured HTTP client, auth behavior, and API
  adapters.
- `entities` contain UI-facing types and mapping helpers, not server ORM
  models.
- `shared` must remain business-agnostic.
- TanStack Query owns server state and cache invalidation.
- React Hook Form and Zod own form state and client validation.
- Access tokens remain in memory; refresh uses the HttpOnly cookie.
- Loading, empty, error, validation, and success states are required for each
  primary workflow.
- API errors are mapped to safe user-facing messages without exposing server
  internals.

## Authentication flow

1. Login calls the Gateway.
2. Identity returns an access token and sets the refresh cookie.
3. The frontend keeps the access token in memory.
4. On expiry, it calls `/api/v1/auth/refresh` with credentials included.
5. A successful refresh replaces the in-memory access token.
6. A refresh failure clears local auth state and routes to login.
