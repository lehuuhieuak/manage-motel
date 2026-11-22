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

Stack: React and TypeScript built with Vite, React Router, TanStack Query, React
Hook Form, Zod, and Tailwind CSS with shadcn/ui components. Vendored UI
components live in `shared/components/ui` and are added with
`npx shadcn@latest add <component>`.

`entities` is introduced with the first shared UI-facing domain type; the
scaffold does not create empty placeholder folders.

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

## Local development

The application lives in `src/frontend`. Aspire is the primary local runner:
`aspire run` (or `dotnet run --project src/ManageMotel.AppHost`) starts the
frontend dev server as the `frontend` resource and publishes its URL in the
Aspire dashboard. Aspire installs npm dependencies when `node_modules` is
missing and injects the port it assigns. Docker Compose remains an optional
infrastructure-only fallback.

For frontend-only work:

```text
npm install        install dependencies
npm run dev        Vite dev server, default http://localhost:5173
npm run typecheck  tsc -b
npm run lint       oxlint
npm run format     Prettier
npm run build      type-check plus production build into dist/
```

`/api` and `/health` are proxied to `VITE_DEV_PROXY_TARGET` (default
`http://localhost:8080`, the YARP Gateway endpoint). `VITE_API_BASE_URL`
(default `/api/v1`) is the base path the browser uses in every environment; only
`VITE_`-prefixed variables reach the bundle, so secrets never belong there.
Configuration details are documented in `src/frontend/.env.example` and
`src/frontend/README.md`.

## Authentication flow

1. Login calls the Gateway.
2. Identity returns an access token and sets the refresh cookie.
3. The frontend keeps the access token in memory.
4. On expiry, it calls `/api/v1/auth/refresh` with credentials included.
5. A successful refresh replaces the in-memory access token.
6. A refresh failure clears local auth state and routes to login.
