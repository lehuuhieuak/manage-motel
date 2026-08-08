# Motel Management MVP - Architecture

**Status:** Accepted design baseline

This document defines the implementation conventions for the MVP. It complements
`docs/project-spec.md` and is intentionally opinionated so that all services are
implemented consistently.

## System topology

```text
React + TypeScript
        |
      YARP API Gateway
        |
  +-----+------+---------+---------+
  |            |         |         |
Identity     Rental   Billing   Metering   Payment
  |            |         |         |         |
identity_db rental_db billing_db metering_db payment_db
        \       |         |       /
              RabbitMQ
```

The services have independent databases. SQL Server hosts the databases owned
by .NET services, while PostgreSQL hosts the databases owned by Go services.
Each engine may run as one local resource with multiple databases, but a
service must never query or modify a database owned by another service.

## Local orchestration with .NET Aspire

`.NET Aspire` is the primary local-development orchestrator. It is not a
Clean Architecture layer, a shared business library, or a production runtime.
The AppHost declares the local application model and wires services/resources
such as SQL Server, PostgreSQL, RabbitMQ, the YARP Gateway, .NET services, Go services, and
the React development server.

The repository-level structure is:

```text
src/
├── ManageMotel.AppHost/
├── ManageMotel.ServiceDefaults/
├── gateway/
├── services/
│   ├── identity/
│   ├── rental/
│   ├── metering/
│   ├── billing/
│   └── payment/
└── frontend/
```

`ManageMotel.ServiceDefaults` contains .NET-only technical defaults such as
OpenTelemetry, health checks, service discovery, and resilience wiring. It
must not contain domain entities, repository implementations, or business
rules. Go and React keep their own language-specific observability and
configuration wiring.

The AppHost provisions two database resources with separate databases:

```text
SQL Server: identity-db, rental-db, billing-db
PostgreSQL: metering-db, payment-db
```

It may run Go and Node applications as executable resources or containers, but
the service contracts remain independent of Aspire. Aspire service discovery
is only a local wiring mechanism; the API Gateway remains the browser entry
point.

Aspire is the preferred local run experience. Docker Compose remains an
optional infrastructure-only fallback and must not introduce a second,
conflicting service topology. Testcontainers remains the integration-test
mechanism.

Each service owns its own database migration. .NET services use EF Core
migrations for SQL Server; Go services use Goose migrations for PostgreSQL.
AppHost provisions dependencies and injects configuration; it does not run another service's migrations or
contain migration/business logic. Development migration commands may be
provided separately, while production migration execution must be explicit and
controlled.

The AppHost is not required at runtime in production. Any future `aspire
publish` or deployment target is a separate deployment decision and does not
change service ownership or the MVP exclusion of Kubernetes.

## Backend Clean Architecture

Each .NET service uses four projects:

```text
Service/
├── Service.Api
├── Service.Application
├── Service.Domain
└── Service.Infrastructure
```

The dependency direction is:

```text
Api -> Application -> Domain
Infrastructure -> Application and Domain
Domain -> no infrastructure, framework, or transport dependency
```

### Domain

The Domain project contains aggregates, entities, value objects, domain
invariants, domain errors, and internal domain events. Domain objects do not
know about EF Core, HTTP, RabbitMQ, or a specific database provider.

Use one aggregate per consistency boundary. Repository interfaces should be
defined for meaningful aggregates; do not introduce a generic repository only
to hide EF Core.

### Application

The Application project contains use cases, commands represented by ordinary
request objects, application services, input validation, DTOs, authorization
policies, and ports such as repository or message publisher interfaces.

CQRS and MediatR are not used in the current MVP. A use case should have one
clear application service method and an explicit transaction boundary.

### Infrastructure

Infrastructure contains EF Core `DbContext`, entity configurations, migrations,
repository implementations, RabbitMQ adapters, Outbox/Inbox persistence,
OpenTelemetry exporters, and external provider clients.

EF Core entities and database configurations stay in Infrastructure. API DTOs
must not expose persistence entities.

### API

The API project contains controllers or endpoint definitions, authentication
middleware, authorization wiring, request/response mapping, health checks,
OpenAPI configuration, and composition-root dependency injection.

## .NET persistence

Identity, Rental, and Billing use EF Core with the SQL Server provider. Their
database configurations and EF Core migrations remain inside each service's
Infrastructure project. SQL Server-specific types must not leak into API
contracts or integration event payloads.

## Go service structure

Metering and Payment use the same architectural boundaries without forcing .NET
project conventions:

```text
service/
├── cmd/<service>/
├── internal/
│   ├── domain/
│   ├── application/
│   ├── adapters/
│   ├── infrastructure/
│   └── transport/
├── migrations/
└── sql/
```

### Folder responsibilities

| Folder | Responsibility | May depend on |
|---|---|---|
| `cmd/<service>` | Composition root: reads configuration, constructs concrete dependencies, starts HTTP server and background workers, and handles orderly shutdown. | Every internal package, only for wiring. |
| `internal/domain` | Aggregates, entities, value objects, domain errors, invariants, and domain events. | Go standard library only; no application, framework, database, or messaging package. |
| `internal/application` | Use cases, commands/queries as ordinary Go request structs, transaction boundaries, authorization decisions, and port interfaces. | `domain` only. |
| `internal/transport` | Gin routes, HTTP middleware, request binding/validation, response and Problem Details mapping, OpenAPI and health endpoints. | `application` and `domain` types needed for mapping. |
| `internal/adapters` | Boundary adapters for external contracts, such as RabbitMQ event consumers, event DTO mappers, and payment-provider contract mapping. | `application` and `domain`; it does not contain persistence or business rules. |
| `internal/infrastructure` | Concrete technical implementations: `pgx`/`sqlc` repositories, Goose migration runner support, RabbitMQ publisher/consumer client wiring, Outbox/Inbox storage, OpenTelemetry exporters, and configuration implementations. | `application` port interfaces and `domain` types. |
| `migrations` | Versioned Goose PostgreSQL migrations for this service database. It is not an importable Go package. | PostgreSQL SQL only. |
| `sql` | Handwritten PostgreSQL schema/query inputs for `sqlc` and `sqlc` configuration. | PostgreSQL SQL only. |

`sqlc` generates typed query code from PostgreSQL SQL. Generated code belongs
under the persistence portion of `internal/infrastructure` (for example,
`internal/infrastructure/persistence/sqlc`) and is mapped to domain types
before Application code sees it. Goose manages the versioned PostgreSQL SQL
migrations in `migrations`. SQL files are versioned per service and are never
shared across service databases.

### Go dependency direction

Dependencies point inward, toward `domain`:

```text
cmd (composition only)
 ├── transport (Gin HTTP) ────────> application ────────> domain
 ├── adapters (RabbitMQ/provider) ─> application ────────> domain
 └── infrastructure (pgx/sqlc/AMQP) ─> application ports + domain types
```

The Application layer defines the ports it needs, for example a `MeterRepository`,
`Outbox`, or `PaymentProvider`. Infrastructure implements those ports. The
`cmd` package injects the concrete implementations into Application use cases.
This keeps a use case testable with in-memory fakes and prevents it from
importing Gin, `pgx`, `sqlc`, RabbitMQ, or PostgreSQL types.

The following imports are not allowed:

- `domain` must not import any other internal layer.
- `application` must not import `transport`, `adapters`, or `infrastructure`.
- `transport` and `adapters` must not query PostgreSQL or publish RabbitMQ
  messages directly; they call an Application use case.
- `infrastructure` must not contain business decisions; it implements ports
  and maps technical data to/from domain types.

Gin is the HTTP transport framework for Go services. Route definitions,
middleware, request binding, response mapping, and health endpoints live in
`internal/transport`; handlers call Application use cases and must not contain
domain rules or SQL. Gin is built on `net/http`, so standard Go HTTP middleware
and OpenTelemetry instrumentation remain compatible. `chi` is not used in the
MVP.

## Service boundaries

| Service | Database | Owns | Does not own |
|---|---|---|---|
| Identity | SQL Server `identity_db` | users, credentials, roles, refresh sessions, auth audit | rooms, invoices, payments |
| Rental | SQL Server `rental_db` | property, rooms, tenants, occupancy, contracts, deposits | credentials, meter readings, invoices |
| Metering | PostgreSQL `metering_db` | meters, readings, replacements, adjustments | room/tenant master data, invoices |
| Billing | SQL Server `billing_db` | billing periods, prices, invoices, debt, payment snapshots | payment provider state, credentials |
| Payment | PostgreSQL `payment_db` | payment intents, attempts, provider transactions, webhooks, refunds | invoice tables or billing database |

Cross-service references are UUIDs and event data, never foreign keys or shared
ORM entities.

## Communication

- Browser to Gateway: versioned REST.
- Gateway to services: REST for the MVP.
- Service-to-service synchronous calls: REST first; use gRPC only when a
  strongly typed, latency-sensitive internal call justifies it.
- State propagation and integration workflows: RabbitMQ events.
- Integration events use the envelope and topology in
  `docs/contracts/events/README.md`.

## Transactional Outbox and Inbox

Each service has its own Outbox table. A business transaction writes state and
its outgoing event to the Outbox in one database transaction. A background
publisher sends pending messages to RabbitMQ and records publish attempts.

Each consumer has its own Inbox table. It checks `eventId` before processing,
performs its state change and Inbox insert idempotently, and acknowledges the
message only after the transaction succeeds.

Transient failures are retried up to three times, then moved to a dead-letter
queue. Consumers must tolerate redelivery and out-of-order delivery.

## Authentication and authorization

- Access JWT lifetime: 15 minutes.
- Roles for the MVP: `Admin` and `User`.
- The Gateway validates token signature, expiry, issuer and audience, and can
  apply coarse route policies.
- The owning service validates the token and performs the authoritative
  business authorization check. Gateway checks are never the only security
  boundary.
- Refresh tokens are opaque random values delivered in an HttpOnly, Secure,
  SameSite cookie. Identity stores only a hash and rotation metadata in
  `identity_db`.
- Rotation invalidates the old token. Reuse of an already-rotated token revokes
  its complete token family.

## Observability

Every service provides structured logs, OpenTelemetry traces, metrics, and live
and ready health checks. Correlation IDs and W3C trace context are propagated
through HTTP and RabbitMQ. Important metrics include request errors/latency,
queue depth, retries, dead letters, Outbox backlog, database connections, and
pending payments.

## Testing

- Domain and application rules: unit tests.
- Database and repository behavior: SQL Server Testcontainers for .NET and
  PostgreSQL Testcontainers for Go.
- Messaging: RabbitMQ Testcontainers, Outbox and Inbox tests.
- Public API: integration tests through the API boundary.
- Payment: duplicate webhook and idempotency tests are mandatory.
- .NET tests use xUnit; Go tests use the standard `testing` package.

## Explicit exclusions

The MVP does not introduce Kubernetes, Kafka, service mesh, full Event Sourcing,
or a shared business/domain library.
