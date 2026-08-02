# ADR 0002: Polyglot Database Engines by Service Runtime

## Status

Accepted

## Context

The MVP contains .NET services using EF Core and Go services using `pgx` and
`sqlc`. The project is also intended to teach service autonomy and polyglot
distributed-system design. A single database engine would simplify operations,
while separate engines better match the selected service stacks.

## Decision

- Identity, Rental, and Billing use SQL Server, with one database per service.
- Metering and Payment use PostgreSQL, with one database per service.
- SQL Server and PostgreSQL may each run as one local infrastructure resource,
  but their databases remain separate.
- .NET uses the EF Core SQL Server provider and EF Core migrations.
- Go uses `pgx`, `sqlc`, and Goose migrations for PostgreSQL.
- Aspire AppHost provisions both database resources and injects connection
  information; it does not own service migrations.
- Integration events and API contracts use provider-neutral UUID, decimal, and
  UTC timestamp representations.
- .NET integration tests use SQL Server Testcontainers; Go integration tests use
  PostgreSQL Testcontainers.

## Consequences

This preserves strict service ownership and lets each runtime use its natural
database tooling. It adds local resource, CI, migration, backup, and monitoring
complexity. Cross-service reporting must still use APIs or integration-event
projections; it must never join the two database engines directly.

Changing a service's database provider later requires a new ADR, migration
plan, test updates, and an explicit impact review.
