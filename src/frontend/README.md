# Motel Management Frontend

React owner workspace for the Motel Management MVP. This project is the buildable
starting structure created by SCRUM-61 (T1 — Scaffold service and frontend project
templates); workflows are added by the follow-up stories under `src/features`.

Architecture rules live in `docs/frontend-architecture.md`; API contracts live in
`docs/contracts/api-conventions.md`.

## Stack

| Concern              | Choice                                 |
| -------------------- | -------------------------------------- |
| UI runtime           | React 19 + TypeScript                  |
| Build                | Vite                                   |
| Routing              | React Router (`createBrowserRouter`)   |
| Server state         | TanStack Query                         |
| Forms and validation | React Hook Form + Zod                  |
| Styling              | Tailwind CSS v4 + shadcn/ui components |
| Lint / format        | oxlint / Prettier                      |

## Commands

Run from `src/frontend`:

| Command                | Purpose                                                             |
| ---------------------- | ------------------------------------------------------------------- |
| `npm install`          | install dependencies (required before `aspire run`)                 |
| `npm run dev`          | Vite dev server on <http://localhost:5173> (or the injected `PORT`) |
| `npm run build`        | type-check, then production build into `dist/`                      |
| `npm run typecheck`    | `tsc -b` only                                                       |
| `npm run lint`         | oxlint                                                              |
| `npm run format`       | Prettier write                                                      |
| `npm run format:check` | Prettier check (CI-friendly)                                        |
| `npm run preview`      | serve the production build locally                                  |

## Local development

Aspire is the primary local runner. `aspire run` (or
`dotnet run --project src/ManageMotel.AppHost`) starts this app as the `frontend`
resource next to the gateway and services, and shows the URL in the Aspire
dashboard:

- Aspire installs dependencies automatically when `node_modules` is missing.
- Aspire passes `--port` for the endpoint it assigns, so the dashboard URL wins
  over the configured dev-server port.
- Docker Compose stays an optional infrastructure-only fallback and never starts
  a second frontend topology.

`npm run dev` alone is supported for frontend-only work. Requests to `/api` and
`/health` are then proxied to `VITE_DEV_PROXY_TARGET` (default
`http://localhost:8080`, the YARP gateway endpoint).

## Configuration

`.env.example` documents the supported variables. Vite loads `.env` and
`.env.local`; `*.local` files are git-ignored, so machine-specific targets never
reach the repository.

| Variable                | Default                 | Meaning                                               |
| ----------------------- | ----------------------- | ----------------------------------------------------- |
| `VITE_API_BASE_URL`     | `/api/v1`               | Gateway base path or absolute URL used by the browser |
| `VITE_DEV_PROXY_TARGET` | `http://localhost:8080` | Dev proxy target for `/api` and `/health`             |
| `VITE_DEV_SERVER_PORT`  | `5173`                  | Dev server port when Aspire does not inject `PORT`    |

Only `VITE_`-prefixed variables reach the browser bundle. Never place secrets
there.

## Structure

```text
src/
├── app/          application setup: env, query client, providers, shell layout
├── routes/       route definitions and guards
├── pages/        screen-level composition
├── features/     complete user workflows (forms, API hooks, workflow components)
├── entities/     shared UI-facing domain types and mapping helpers
├── services/     HTTP client, auth token handling, API error mapping
└── shared/       business-agnostic UI, validation and utilities
```

`entities/` is added with the first shared domain type. Feature tests are
colocated with the code they verify; cross-feature browser flows belong in
`tests/e2e/` (see `docs/architecture.md`).

## Conventions

- All runtime API traffic goes through the API Gateway; `src/services/httpClient.ts`
  is the only `fetch` wrapper. Backend calculations remain authoritative.
- API failures arrive as RFC 9457 Problem Details and are converted to `ApiError`
  with a message that is safe to display; 5xx responses never surface server text.
- Access tokens stay in memory (`src/services/accessToken.ts`); refresh relies on
  the HttpOnly cookie and is sent with `credentials: 'include'`.
- Loading, empty, error, validation and success states are required for every
  primary workflow.
- Add UI components with `npx shadcn@latest add <component>`; they land in
  `src/shared/components/ui`. Vendored files are excluded from Prettier and from
  the `only-export-components` lint rule so they stay close to the registry
  version.

## Testing

The frontend test harness is delivered by SCRUM-74 (React application foundation
and test harness). Until then this project ships `typecheck`, `lint` and `build`
as its verification gates.
