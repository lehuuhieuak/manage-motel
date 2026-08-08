# ADR 0003: Gin for Go HTTP Transport

## Status

Accepted

## Context

Metering and Payment are Go services that expose REST APIs and health
endpoints. The MVP needs a single, approachable HTTP framework with mature
routing, middleware, validation/binding, and JSON support. The previous
specification left the choice open between direct `net/http` and `chi`.

## Decision

- Metering and Payment use Gin as their HTTP framework.
- Gin handlers and middleware remain in `internal/transport`.
- Handlers map HTTP requests to Application use cases and map their results to
  HTTP responses; they do not contain business rules or SQL.
- Gin runs on `net/http`, so standard library HTTP interfaces and compatible
  OpenTelemetry middleware can still be used.
- `chi` is not used in the MVP. Direct `net/http` may be used only for a small
  adapter when Gin does not provide an integration point, not as a second API
  routing framework.

## Consequences

The two Go services share one familiar HTTP development experience and retain
the standard Go HTTP ecosystem. This introduces a framework dependency, but
keeps framework code at the transport edge and does not affect the Domain or
Application layers.
