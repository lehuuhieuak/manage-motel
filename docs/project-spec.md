# Motel Management MVP

## 1. Mục tiêu sản phẩm

Xây dựng website quản lý nhà trọ cho một chủ trọ quản lý một khu trọ.

Hệ thống thay thế việc quản lý bằng Excel hoặc sổ tay, bao gồm:

* Quản lý phòng.
* Quản lý người thuê và số người đang ở từng phòng.
* Quản lý hợp đồng và tiền cọc.
* Ghi nhận chỉ số điện, nước.
* Tạo hóa đơn hàng tháng.
* Quản lý thanh toán và công nợ.
* Hiển thị mã QR thanh toán.
* Báo cáo doanh thu và tình trạng phòng.

## 2. Phạm vi MVP

### Giới hạn

* Chỉ có một chủ trọ.
* Chỉ có một khu trọ.
* Không hỗ trợ multi-tenant.
* Người thuê không có tài khoản đăng nhập.
* Chỉ xây dựng website.
* Tiền phòng luôn tính đủ theo tháng.
* Chưa xử lý trường hợp vào hoặc trả phòng giữa tháng.
* Điện và nước tính theo số tiêu thụ.
* Thanh toán sử dụng mock provider.
* Chưa tích hợp nhà cung cấp thanh toán thật.

### Công thức điện nước

```text
Usage = CurrentReading - PreviousReading
Amount = Usage × UnitPrice
```

Chỉ số hiện tại thông thường không được nhỏ hơn chỉ số trước đó.

Mỗi đồng hồ chỉ có một bản ghi chính thức cho mỗi kỳ thanh toán.

## 3. Kiến trúc hệ thống

Hệ thống sử dụng microservice để phục vụ mục tiêu học tập backend và distributed system.

### Công nghệ chính

* Backend: .NET 10 và Go.
* Frontend: React và TypeScript.
* Database: SQL Server for .NET services and PostgreSQL for Go services.
* Message broker: RabbitMQ.
* Đồng bộ giữa service: REST hoặc gRPC.
* Bất đồng bộ giữa service: Integration Event qua RabbitMQ.
* API Gateway: YARP.
* Local development: .NET Aspire as the primary orchestrator, with Docker Compose as an optional fallback.
* Observability: OpenTelemetry, Prometheus, Grafana, Loki và Tempo.
* Testing: xUnit, Go testing và Testcontainers.

### Backend service stack

Các service .NET (Identity, Rental và Billing) dùng:

* ASP.NET Core 10 Web API.
* Clean Architecture với bốn project `Api`, `Application`, `Domain` và
  `Infrastructure`.
* EF Core với SQL Server provider và EF Core migrations.
* YARP cho API Gateway.
* OpenTelemetry, health checks và resilience defaults qua
  `ManageMotel.ServiceDefaults`.
* xUnit cho unit/integration test; SQL Server Testcontainers cho persistence
  integration test.

Các service Go (Metering và Payment) dùng:

* Gin làm HTTP framework. Gin chạy trên `net/http`; không dùng `chi` trong MVP.
* Clean Architecture với `cmd`, `internal/domain`, `internal/application`,
  `internal/adapters`, `internal/infrastructure` và `internal/transport`.
* `pgx`, `sqlc` và Goose cho PostgreSQL persistence/migration.
* `amqp091-go`, `slog`, OpenTelemetry và standard `testing` package.

### Nguyên tắc kiến trúc

* Mỗi service sở hữu database riêng.
* Identity, Rental và Billing sử dụng SQL Server; Metering và Payment sử dụng PostgreSQL.
* Không query trực tiếp database của service khác.
* Không sử dụng foreign key xuyên service.
* Giao tiếp đồng bộ chỉ dùng khi cần kết quả ngay.
* Thay đổi trạng thái giữa các service ưu tiên dùng integration event.
* Consumer phải xử lý message theo hướng idempotent.
* Áp dụng Transactional Outbox và Inbox Pattern.
* Không áp dụng Kubernetes trong MVP.
* Không áp dụng Event Sourcing toàn hệ thống.
* Không áp dụng Kafka trong MVP.

## 4. Danh sách service

### 4.1. Identity Service — .NET

Trách nhiệm:

* Đăng nhập chủ trọ.
* JWT access token.
* Refresh token.
* Đổi mật khẩu.
* Phân quyền cơ bản.
* Lịch sử đăng nhập.

### 4.2. Rental Service — .NET

Trách nhiệm:

* Thông tin khu trọ.
* Phòng.
* Người thuê.
* Cư trú.
* Hợp đồng.
* Người đại diện hợp đồng.
* Tiền cọc.
* Chuyển phòng.
* Trả phòng.
* Trạng thái phòng.

Entity chính:

* Property.
* Room.
* Tenant.
* RoomOccupancy.
* RentalContract.
* ContractTenant.
* DepositTransaction.
* OutboxMessage.
* InboxMessage.
* AuditLog.

Integration event:

* RoomCreated.
* RoomPriceChanged.
* TenantMovedIn.
* TenantMovedOut.
* TenantTransferred.
* RentalContractActivated.
* RentalContractEnded.

### 4.3. Metering Service — Go

Trách nhiệm:

* Đồng hồ điện.
* Đồng hồ nước.
* Chỉ số kỳ trước.
* Chỉ số hiện tại.
* Tính lượng tiêu thụ.
* Lịch sử điều chỉnh.
* Thay đồng hồ.
* Lưu ảnh đồng hồ.

Entity chính:

* Meter.
* MeterReading.
* MeterReplacement.
* ReadingAdjustment.
* OutboxEvent.
* InboxEvent.

Integration event:

* MeterReadingRecorded.
* MeterReadingAdjusted.
* MeterReplaced.
* MonthlyConsumptionCalculated.

Go stack:

* Gin (HTTP framework, chạy trên `net/http`).
* pgx.
* sqlc.
* amqp091-go.
* gRPC Go.
* slog.
* OpenTelemetry.
* Goose cho migration PostgreSQL.

### 4.4. Billing Service — .NET

Trách nhiệm:

* Cấu hình đơn giá.
* Dịch vụ cố định.
* Kỳ thanh toán.
* Hóa đơn.
* Chi tiết hóa đơn.
* Công nợ.
* Điều chỉnh hóa đơn.
* Xuất hóa đơn PDF.

Entity chính:

* BillingPeriod.
* ServiceDefinition.
* ServicePrice.
* Invoice.
* InvoiceLine.
* InvoiceAdjustment.
* RoomBillingSnapshot.
* PaymentSnapshot.
* OutboxMessage.
* InboxMessage.

Trạng thái hóa đơn:

* Draft.
* Issued.
* PartiallyPaid.
* Paid.
* Overdue.
* Cancelled.

Hóa đơn phải lưu snapshot của:

* Giá phòng.
* Đơn giá điện.
* Đơn giá nước.
* Số người.
* Số tiêu thụ.
* Tên dịch vụ.
* Công thức tính tại thời điểm tạo hóa đơn.

### 4.5. Payment Service — Go

Trách nhiệm:

* Tạo PaymentIntent.
* Tạo QR thanh toán.
* Theo dõi trạng thái thanh toán.
* Xử lý webhook.
* Giả lập thanh toán thành công, thất bại và hết hạn.
* Phát integration event sau khi thanh toán.

Entity chính:

* PaymentIntent.
* PaymentAttempt.
* PaymentProviderTransaction.
* ProviderWebhookEvent.
* Refund.
* OutboxEvent.
* InboxEvent.

Trạng thái PaymentIntent:

* Pending.
* Processing.
* Succeeded.
* Failed.
* Expired.
* Cancelled.
* Refunded.

Payment Service phải sử dụng abstraction:

```text
PaymentProvider
- CreatePaymentIntent
- GetPaymentStatus
- CancelPayment
- RefundPayment
- VerifyWebhook
- ParseWebhook
```

Implementation MVP:

```text
MockPaymentProvider
```

Implementation tương lai:

```text
MomoPaymentProvider
VnPayPaymentProvider
ZaloPayPaymentProvider
PayOSPaymentProvider
```

Không cập nhật trực tiếp database của Billing Service.

Khi thanh toán thành công, Payment Service phát:

```text
PaymentSucceeded
```

Billing Service consume event và cập nhật hóa đơn.

## 5. Frontend React

Các màn hình chính:

* Đăng nhập.
* Dashboard.
* Danh sách phòng.
* Chi tiết phòng.
* Danh sách người thuê.
* Form thêm và cập nhật người thuê.
* Thêm người vào phòng.
* Chuyển phòng.
* Trả phòng.
* Quản lý hợp đồng.
* Quản lý tiền cọc.
* Nhập điện nước hàng loạt.
* Lịch sử điện nước.
* Kỳ thanh toán.
* Danh sách hóa đơn.
* Chi tiết hóa đơn.
* Hiển thị mã QR.
* Giả lập thanh toán.
* Danh sách công nợ.
* Báo cáo doanh thu.

Frontend stack:

* React.
* TypeScript.
* Vite.
* React Router.
* TanStack Query.
* React Hook Form.
* Zod.
* MUI hoặc Ant Design.

## 6. Integration Event Envelope

Các event giữa .NET và Go sử dụng JSON trung lập:

```json
{
  "eventId": "uuid",
  "eventType": "billing.invoice-issued",
  "eventVersion": 1,
  "occurredAt": "UTC datetime",
  "producer": "billing-service",
  "correlationId": "uuid",
  "causationId": "uuid",
  "data": {}
}
```

Quy tắc:

* Không chứa namespace hoặc type name riêng của C#.
* Có event ID.
* Có event version.
* Có correlation ID.
* Timestamp sử dụng UTC.
* Consumer phải chống xử lý trùng.
* Thay đổi schema phải backward compatible.

## 7. Observability

Mỗi request hoặc message phải có:

* TraceId.
* SpanId.
* CorrelationId.
* ServiceName.
* UserId nếu có.
* RequestPath hoặc EventType.
* Duration.
* Status.

Cần theo dõi:

* Request count.
* Error rate.
* P95 và P99 response time.
* RabbitMQ queue depth.
* Message retry.
* Dead-letter message.
* Outbox message chưa publish.
* Payment pending quá lâu.
* Database connection.
* Thời gian tạo hóa đơn.

## 8. Testing

### Unit test

* Tính tiền điện.
* Tính tiền nước.
* Tính tổng hóa đơn.
* Trạng thái hóa đơn.
* Trạng thái thanh toán.
* Chuyển phòng.
* Kết thúc hợp đồng.
* Payment state machine.

### Integration test

* SQL Server thật qua Testcontainers cho service .NET.
* PostgreSQL thật qua Testcontainers cho service Go.
* RabbitMQ thật qua Testcontainers.
* Outbox publish event.
* Inbox chống xử lý trùng.
* PaymentSucceeded cập nhật hóa đơn.
* Duplicate webhook không thanh toán hai lần.

## 9. Epic dự kiến

1. Project Foundation and Developer Experience.
2. Identity and API Gateway.
3. Rental Management.
4. Metering.
5. Billing.
6. Payment Simulation.
7. Observability and Resilience.
8. React Frontend.
9. Testing and Deployment.

## 10. Yêu cầu tạo Jira backlog

Backlog cần có:

* Epic.
* Story.
* Task hoặc Sub-task khi phù hợp.
* Summary.
* Description.
* Acceptance Criteria.
* Priority.
* Story Point nếu Jira project hỗ trợ.
* Component.
* Labels.
* Dependency.
* Sprint đề xuất.

Labels chung:

* manage-motel-mvp.
* backend.
* frontend.
* dotnet.
* golang.
* react.
* rabbitmq.
* postgresql.
* sql-server.
* grpc.
* aspire.
* observability.
* payment.

Không tạo issue trùng với issue đã có label `manage-motel-mvp`.
