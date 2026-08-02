# Billing Service

## Responsibility

Billing owns service pricing, billing periods, invoice calculation, invoice
state, invoice lines, adjustments, debt, and payment snapshots.

## Domain boundaries

- `BillingPeriod`: period lifecycle and issuance rules.
- `ServiceDefinition` and `ServicePrice`: versioned prices.
- `Invoice`: invoice state machine and totals.
- `InvoiceLine`: immutable calculation snapshot after issuance.
- `InvoiceAdjustment`: controlled correction before or according to invoice
  state rules.

Issued invoices are immutable. Corrections use adjustments; they do not mutate
the original calculation history.

## API examples

```text
GET  /api/v1/billing-periods
POST /api/v1/billing-periods/{periodId}/generate-invoices
POST /api/v1/invoices/{invoiceId}/issue
GET  /api/v1/invoices
GET  /api/v1/invoices/{invoiceId}
POST /api/v1/invoices/{invoiceId}/adjustments
```

## Events

Billing consumes Rental and Metering events and publishes:

```text
billing.invoice-issued.v1
billing.invoice-cancelled.v1
```

Billing consumes:

```text
rental.tenant-moved-in.v1
rental.tenant-moved-out.v1
rental.rental-contract-ended.v1
metering.monthly-consumption-calculated.v1
payment.payment-succeeded.v1
payment.payment-failed.v1
```

`PaymentSucceeded` updates the Billing payment snapshot idempotently; Billing
never reads Payment's tables.

## Persistence and tests

Billing owns SQL Server database `billing_db` and uses EF Core with SQL Server
migrations. Invoice tests must cover rounding, price snapshots, electricity/
water lines, debt, state transitions, duplicate payment events, and
issued-invoice immutability.
