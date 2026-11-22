# Motel Management MVP

Product scope and architecture are documented in [docs/project-spec.md](docs/project-spec.md)
and [docs/architecture.md](docs/architecture.md).

## Run locally with Aspire

Aspire is the primary local runner. Run these commands from the repository root
with the .NET 10 SDK, Go 1.25 or later, and Node.js 22.22 or later with npm on
`PATH`. The current application scaffold runs without Docker.

```bash
dotnet dev-certs https --trust
npm --prefix src/frontend ci --include=dev
dotnet run --project src/ManageMotel.AppHost --launch-profile https
```

Trust the HTTPS development certificate on first setup. Open the Dashboard URL
printed by AppHost and select the `frontend` endpoint to open the React app.
The frontend proxies `/api` and `/health` requests to the YARP gateway. Press
`Ctrl+C` in the AppHost terminal to stop the local applications.

| Aspire resource | Local HTTP endpoint | Database owned by the service |
| --- | --- | --- |
| `frontend` | Use the URL in the Dashboard | None |
| `gateway` | `http://localhost:5241` | None |
| `identity-service` | `http://localhost:8001` | SQL Server `identity_db` |
| `billing-service` | `http://localhost:8002` | SQL Server `billing_db` |
| `rental-service` | `http://localhost:8003` | SQL Server `rental_db` |
| `metering-service` | `http://localhost:8004` | PostgreSQL `metering_db` |
| `payment-service` | `http://localhost:8005` | PostgreSQL `payment_db` |

The gateway and all five backend services expose `GET /health/live` and
`GET /health/ready`. With AppHost running, check both endpoints for each service
and expect HTTP 200:

```bash
for port in 5241 8001 8002 8003 8004 8005; do
  for probe in live ready; do
    url="http://localhost:${port}/health/${probe}"
    printf '%s\n' "$url"
    curl -fsS -w '\nHTTP %{http_code}\n' "$url"
  done
done
```

To check the frontend proxy, open `/health/ready` on the frontend URL shown in the
Dashboard. The response comes from the Gateway. If a listed port is in use,
free it before restarting AppHost.

### Local infrastructure

The database column records service ownership. Each backend owns its database
and migrations, and accesses other services through APIs or integration events.
AppHost supplies the five upstream URLs to YARP and the Gateway URL to Vite.
The current health endpoints report application status. Provisioning SQL Server,
PostgreSQL, and RabbitMQ and injecting their connection settings are pending.

### Docker Compose fallback

The optional Compose fallback is reserved for SQL Server, PostgreSQL, and
RabbitMQ. Aspire remains responsible for starting Gateway, the five backend
services, and React. To use the fallback, the Compose definition and the service
configuration for external dependency endpoints need to be in place first.

Once the fallback is configured, start the dependencies with `docker compose up -d`
from the directory containing the Compose file, then check their state with
`docker compose ps`. Start AppHost with the external database and broker
connection settings for those dependencies. Stop the applications with
`Ctrl+C`, then stop the Compose dependencies with `docker compose stop`.
See the [local orchestration architecture](docs/architecture.md#local-orchestration-with-net-aspire)
for ownership and provisioning boundaries.

## Build the repository

Install these tools and make them available on `PATH` in the shell running the build:

- Bash (Git Bash on Windows, or Bash on Linux/macOS).
- A .NET SDK supporting `net10.0` projects and `.slnx` solutions.
- Go compatible with the service modules and their dependencies.
- Node.js compatible with Vite and npm.

From the repository root:

```bash
bash scripts/build.sh
```

The default .NET configuration is `Release`. For a development build:

```bash
bash scripts/build.sh Debug
```

The script resolves paths relative to itself, so it can also be invoked from
another directory using its absolute path. On Windows, run it in Git Bash with
the Windows .NET, Go, Node.js, and npm tools on `PATH`. If using WSL instead,
install these tools inside WSL.

The build runs these steps in order and stops with a nonzero exit code when a
step fails:

1. Build `src/ManageMotel.AppHost/AppHost.slnx`, including AppHost, Gateway,
   ServiceDefaults, Identity, Rental, and Billing. `dotnet build` restores NuGet
   dependencies automatically.
2. Build the Metering and Payment Go executables. Go downloads missing modules;
   `-mod=readonly` prevents automatic edits to `go.mod`.
3. Run `npm ci --include=dev --no-audit --no-fund` in `src/frontend`, then
   `npm run build` to type-check and produce the production bundle. `npm ci`
   replaces `node_modules` using `package-lock.json`; development dependencies
   are included because the frontend build needs TypeScript and Vite.

Network access is needed when dependencies are not cached. Keep the frontend
lockfile and both services' `go.sum` files in source control.

| Application | Build output |
| --- | --- |
| .NET projects | Each project's `bin/Release/<target-framework>/` (or `bin/Debug/`) |
| Metering | `artifacts/go/metering` (`metering.exe` on Windows) |
| Payment | `artifacts/go/payment` (`payment.exe` on Windows) |
| React frontend | `src/frontend/dist/` |

Go binaries target the current platform unless `GOOS` and `GOARCH` are set.
Generated build outputs are git-ignored. This script compiles applications; it
does not start Aspire, containers, services, or database migrations, and it does
not run tests or publish deployment artifacts.

For frontend-specific commands, see [src/frontend/README.md](src/frontend/README.md).
