# Payment Service

## Responsibility

Payment owns payment intents, attempts, provider transactions, webhook events,
and refunds. It never reads or writes Billing's database.

## Domain boundaries

- `PaymentIntent`: payment lifecycle and idempotency key.
- `PaymentAttempt`: one attempt against a provider.
- `PaymentProviderTransaction`: provider reference and raw status mapping.
- `ProviderWebhookEvent`: received provider event and deduplication state.
- `Refund`: refund lifecycle.

Payment intent states are:

```text
Pending -> Processing -> Succeeded
                    \-> Failed
Pending -> Expired
Succeeded -> Refunded
```

Invalid transitions are rejected by the domain model.

## Provider abstraction

The application depends on:

```text
PaymentProvider
├── CreatePaymentIntent
├── GetPaymentStatus
├── CancelPayment
├── RefundPayment
├── VerifyWebhook
└── ParseWebhook
```

The MVP implements `MockPaymentProvider`. The same flow must work for future
Momo, VNPay, ZaloPay, or PayOS adapters.

## API examples

```text
POST /api/v1/payment-intents
GET  /api/v1/payment-intents/{paymentIntentId}
POST /api/v1/payment-intents/{paymentIntentId}/cancel
POST /api/v1/payment-intents/{paymentIntentId}/refund
POST /api/v1/payment-providers/mock/webhook
```

The browser redirect is never proof of payment. Only a verified, persisted,
idempotently processed provider callback can change payment state.

## Events

Payment publishes:

```text
payment.payment-succeeded.v1
payment.payment-failed.v1
payment.payment-refunded.v1
```

Billing consumes these events and updates its own payment snapshot.

## Persistence and tests

Payment owns PostgreSQL database `payment_db` and uses Go, Gin, `pgx`, `sqlc`,
Goose, and `amqp091-go`. Gin handlers stay in the transport boundary and invoke
Application use cases rather than embedding payment state rules.
Tests must cover duplicate webhooks, provider failures, idempotency keys,
invalid state transitions, and Outbox publication.
