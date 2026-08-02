# ADR 0001: Clean Architecture Baseline

## Status

Accepted

## Context

The MVP contains .NET and Go microservices with separate databases and
asynchronous integration events. The team needs a common structure without
sharing domain code or coupling services to infrastructure.

## Decision

- .NET services use `Api`, `Application`, `Domain`, and `Infrastructure`
  projects.
- Go services use `cmd`, `internal/domain`, `internal/application`, adapters,
  infrastructure, and transport packages.
- The dependency direction points toward Domain.
- EF Core with SQL Server is used for .NET persistence and migrations.
- Go uses `pgx`, `sqlc`, and Goose SQL migrations.
- CQRS and MediatR are not introduced in the MVP.
- Outbox and Inbox are implemented per service.
- React uses feature-based modular architecture rather than strict backend-style
  Clean Architecture.
- .NET Aspire is the primary local-development orchestrator. Its AppHost owns
  only the local resource graph and configuration wiring.
- `ManageMotel.ServiceDefaults` is limited to .NET cross-cutting defaults such
  as OpenTelemetry and health checks; it does not become a shared domain layer.
- Go and React are hosted by Aspire as executable resources or containers when
  running locally, while their application code remains language-specific.
- Aspire is not a required production runtime and does not relax database or
  service ownership boundaries.

## Consequences

The structure makes service ownership and testing explicit. It adds some
mapping code between API, application, domain, and persistence models, but that
cost prevents framework and database concerns from leaking into the domain.

Future architecture changes should be recorded as a new ADR rather than
silently changing these conventions.
