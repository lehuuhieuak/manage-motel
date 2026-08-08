# Metering Service

## Responsibility

Metering owns electricity and water meters, monthly readings, reading
adjustments, meter replacement history, and consumption calculation.

## Domain boundaries

- `Meter`: meter identity, type, room reference, and active/replaced status.
- `MeterReading`: one reading for a meter and billing period.
- `MeterReplacement`: replacement history and effective date.
- `ReadingAdjustment`: authorized correction with an audit reason.

For a period, consumption is calculated as:

```text
Usage = CurrentReading - PreviousReading
Amount = Usage * UnitPrice
```

Current readings cannot be lower than the previous reading unless an explicit
adjustment is created.

## Go implementation

The service uses Gin, `pgx`, `sqlc`, Goose migrations, `amqp091-go`, `slog`,
and OpenTelemetry. Gin handlers live in the transport boundary and call
Application use cases; they do not contain domain rules or SQL. `sqlc`
generated code stays in the infrastructure/adapter boundary and is mapped to
domain types before application logic uses it.

## API examples

```text
GET  /api/v1/meters
POST /api/v1/meters
POST /api/v1/meters/{meterId}/readings
POST /api/v1/meters/{meterId}/adjustments
POST /api/v1/meters/{meterId}/replace
GET  /api/v1/meters/{meterId}/history
```

## Events

```text
metering.meter-reading-recorded.v1
metering.meter-reading-adjusted.v1
metering.meter-replaced.v1
metering.monthly-consumption-calculated.v1
```

The monthly calculation event contains a snapshot sufficient for Billing to
calculate an invoice; Billing does not query Metering's database.

## Persistence and tests

Metering owns PostgreSQL database `metering_db`. Goose SQL migrations, SQLC
queries, and generated code are versioned per service. Tests cover duplicate readings, non-monotonic
readings, adjustments, replacement, consumption calculation, and Inbox
idempotency.
