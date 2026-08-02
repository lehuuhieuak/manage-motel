# Integration Event Contract

## Envelope

All RabbitMQ integration events use JSON with this envelope:

```json
{
  "eventId": "uuid",
  "eventType": "rental.tenant-moved-in",
  "eventVersion": 1,
  "occurredAt": "2026-08-01T10:00:00Z",
  "producer": "rental-service",
  "correlationId": "uuid",
  "causationId": "uuid",
  "data": {}
}
```

`eventType` is a stable lower-kebab name prefixed by its owning service. The
RabbitMQ routing key appends the version, for example:

```text
rental.tenant-moved-in.v1
```

## Topology

```text
motel.events      durable topic exchange
motel.events.dlx  dead-letter exchange
```

Each consuming service has a durable queue and binds only the routing keys it
needs. Retry queues use bounded delays; messages that exceed three attempts go
to a dead-letter queue for inspection or controlled replay.

## Compatibility

- Additive fields are preferred.
- Existing fields must not change meaning within a version.
- Breaking changes require a new `eventVersion` and a migration period.
- Consumers must ignore unknown fields.
- Do not serialize C# class names, Go package names, or database entities.

## Delivery guarantees

RabbitMQ delivery is at-least-once. Producers use Transactional Outbox.
Consumers use Inbox deduplication keyed by `eventId`, and all handlers are
idempotent. Ordering must not be assumed across queues.

## Event ownership

The producer owns the event schema and publishes only facts about its own
state. Consumers build local projections/snapshots and never query the
producer's database to complete event handling.
