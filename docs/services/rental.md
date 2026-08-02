# Rental Service

## Responsibility

Rental owns property information, rooms, tenants, occupancy, contracts,
deposits, room transfers, and room status.

## Domain boundaries

- `Room`: capacity, price, status, and room-level invariants.
- `Tenant`: tenant profile and active associations.
- `RentalContract`: contract lifecycle and representative tenant.
- `RoomOccupancy`: active occupancy and move-in/move-out rules.
- `DepositTransaction`: deposit balance and deposit history.

Room capacity and occupancy are enforced inside Rental. A room cannot exceed
capacity, and a tenant cannot have conflicting active occupancy records.

## API examples

```text
GET    /api/v1/properties
GET    /api/v1/rooms
POST   /api/v1/rooms
PATCH  /api/v1/rooms/{roomId}
POST   /api/v1/rooms/{roomId}/occupants
POST   /api/v1/occupants/{occupantId}/transfer
POST   /api/v1/occupants/{occupantId}/move-out
POST   /api/v1/contracts
POST   /api/v1/deposits
```

The API returns domain conflicts as `409 Conflict` and business validation
failures as `422 Unprocessable Entity`.

## Events

Rental publishes events such as:

```text
rental.room-created.v1
rental.room-price-changed.v1
rental.tenant-moved-in.v1
rental.tenant-moved-out.v1
rental.tenant-transferred.v1
rental.rental-contract-activated.v1
rental.rental-contract-ended.v1
```

Events are written through the Rental Outbox in the same transaction as the
state change.

## Persistence and tests

Rental owns SQL Server database `rental_db` and uses EF Core with SQL Server
migrations. Tests cover capacity, occupancy, transfer, contract state
transitions, deposit rules, and Outbox publication.
