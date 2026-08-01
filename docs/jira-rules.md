# Jira Backlog Rules

## 1. Purpose

This document defines how Codex should analyze, propose, create, and update Jira work items for the Motel Management MVP.

The primary goals are:

* Create a consistent and implementation-ready backlog.
* Prevent duplicate Jira issues.
* Preserve the intended microservice architecture.
* Keep MVP scope under control.
* Make each work item clear enough for development and testing.
* Allow the backlog to evolve without losing traceability.

Codex must read this file and `project-spec.md` before interacting with Jira.

---

# 2. Jira Project Discovery

Before creating any issue, Codex must inspect the Jira environment using the Atlassian MCP server.

Codex must determine:

* Available Jira sites.
* Available Jira projects.
* Selected project key.
* Project type: company-managed or team-managed.
* Available issue types.
* Required fields for each issue type.
* Epic hierarchy configuration.
* Available priorities.
* Available components.
* Available labels.
* Available issue link types.
* Available estimation fields.
* Available boards and sprints.

Codex must never guess:

* Project key.
* Issue type IDs.
* Custom field IDs.
* Component IDs.
* Sprint IDs.
* Epic Link field.
* Parent field behavior.
* Story Point field.

If multiple Jira projects are plausible, Codex must stop and ask the user to select the project.

---

# 3. Write Safety

Codex must follow a preview-first workflow.

## Phase 1: Read-only analysis

During the first phase, Codex may:

* Read Jira project metadata.
* Search existing issues.
* Inspect fields.
* Inspect issue types.
* Inspect components.
* Inspect sprints.
* Propose a backlog.
* Identify potential duplicates.

Codex must not:

* Create issues.
* Update issues.
* Delete issues.
* Transition issues.
* Assign issues.
* Add comments.
* Modify sprints.

## Phase 2: User approval

Codex may create Jira issues only after the user explicitly approves the proposed backlog.

Approval must clearly identify:

* The Jira project.
* The backlog version or proposal.
* Whether all proposed issues or only selected issues should be created.

## Phase 3: Controlled creation

When creation is approved, Codex must:

1. Search for duplicates again.
2. Create Epics first.
3. Create Stories under the corresponding Epics.
4. Create Tasks and Sub-tasks afterward.
5. Create dependency links after both related issues exist.
6. Add issues to sprints only after confirming sprint IDs.
7. Report the result after every batch.

Codex must create no more than 15 issues in one batch.

Codex must stop when:

* A required field cannot be determined.
* Jira rejects more than two issues for the same reason.
* The project hierarchy differs from the approved hierarchy.
* The selected Jira project changes.
* Authentication or authorization fails.
* The MCP server returns inconsistent project metadata.

Codex must never delete an existing Jira issue.

Codex must never transition existing issues unless the user explicitly requests it.

---

# 4. Project Labels

Every work item created for this product must include:

```text
manage-motel-mvp
```

Additional labels should be applied based on the work item.

## Service labels

```text
identity-service
api-gateway
rental-service
metering-service
billing-service
payment-service
frontend
platform
```

## Technology labels

```text
dotnet
golang
react
typescript
postgresql
rabbitmq
grpc
rest-api
yarp
docker
opentelemetry
testcontainers
```

## Engineering labels

```text
backend
frontend
devops
database
security
observability
testing
integration
architecture
technical-debt
```

Codex should use lowercase kebab-case labels.

Do not create multiple labels with the same meaning.

For example, do not mix:

```text
go
golang
go-lang
```

Use:

```text
golang
```

---

# 5. Components

Codex should use Jira Components when they are available.

Recommended components:

```text
Platform
Identity
API Gateway
Rental
Metering
Billing
Payment
Frontend
Observability
Infrastructure
Testing
```

If these components do not exist, Codex must not create them automatically unless the user explicitly approves component creation.

If no suitable component exists, use labels instead.

Each issue should normally belong to one primary component.

Cross-service integration issues may use:

* An Integration component, when available.
* The component of the service that owns the orchestration.
* Appropriate service labels for all involved services.

---

# 6. Issue Hierarchy

The preferred hierarchy is:

```text
Epic
└── Story
    ├── Task
    └── Sub-task
```

If the Jira project does not support this exact hierarchy, Codex must adapt to the available configuration and explain the mapping before creating issues.

## Epic

An Epic represents a major business capability or a major engineering foundation.

Examples:

```text
Rental Management
Metering
Billing
Payment Simulation
Observability and Resilience
```

An Epic must not represent:

* A single API endpoint.
* A single database table.
* A small UI form.
* A technical implementation step that can be completed in a few days.

## Story

A Story represents user-visible value or a complete technical capability.

Examples:

```text
Manage tenant occupancy in a room
Record monthly electricity meter readings
Generate monthly invoices for occupied rooms
Create a mock QR payment request
```

A Story should normally be independently testable.

## Task

A Task represents implementation work needed to complete a Story or Epic.

Examples:

```text
Create MeterReading database migration
Implement meter reading validation
Add integration tests for duplicate readings
```

## Sub-task

A Sub-task should be used only when:

* The parent Story or Task already exists.
* The work is tightly coupled to that parent.
* The work is not valuable as an independent backlog item.
* The Jira project supports Sub-tasks.

Do not create excessive Sub-tasks for trivial implementation details.

---

# 7. Epic Rules

Each Epic must contain:

## Summary

The summary should describe the capability.

Good:

```text
Rental Management
Monthly Billing
Payment Simulation
```

Avoid:

```text
Implement Rental Management
Create Billing Code
Do Payment Features
```

## Description

The description must include:

```markdown
## Objective

## Scope

## Out of Scope

## Expected Outcome

## Architecture Constraints
```

## Epic acceptance

An Epic may include high-level completion conditions, but detailed Acceptance Criteria belong to child Stories.

## Epic labels

Every Epic must include:

```text
manage-motel-mvp
```

It should also contain its primary service or capability label.

---

# 8. Story Rules

Every Story must contain the following sections:

```markdown
## Business Objective

## User Story

## Scope

## Acceptance Criteria

## Business Rules

## Dependencies

## Technical Notes

## Out of Scope
```

## Business Objective

Explain why the capability is needed and what problem it solves.

## User Story

Use this structure when appropriate:

```text
As the motel management owner,
I want to ...
So that ...
```

Pure technical Stories may use:

```text
As a developer,
I want to ...
So that ...
```

Technical Stories must still describe measurable value.

## Scope

Describe what is included in the issue.

Avoid vague scope such as:

```text
Implement all tenant features.
```

Use concrete scope such as:

```text
Allow the owner to add an existing tenant to an available room, select the move-in date, mark a contract representative, and view the updated occupant count.
```

## Acceptance Criteria

Acceptance Criteria must be:

* Testable.
* Unambiguous.
* Focused on externally observable behavior.
* Independent of unnecessary implementation details.
* Written using Given/When/Then where practical.

Example:

```gherkin
Given an active room with a capacity of three people
And the room currently has two active occupants
When the owner adds another tenant to the room
Then the tenant occupancy record is created
And the room occupant count is shown as three
```

Error cases must also be included:

```gherkin
Given a room has reached its maximum capacity
When the owner attempts to add another tenant
Then the request is rejected
And a capacity validation error is returned
```

## Business Rules

Include important domain rules such as:

* A room must not exceed capacity.
* Current occupancy is derived from active occupancy records.
* Issued invoices cannot be edited directly.
* Current meter readings cannot normally be lower than previous readings.
* Payment webhooks must be idempotent.

## Dependencies

Dependencies should reference:

* Other proposed issue summaries during preview.
* Actual Jira issue keys after creation.

Do not invent Jira issue keys before the issues exist.

## Technical Notes

Technical Notes may include:

* Owning service.
* Database ownership.
* Integration events.
* REST or gRPC contracts.
* Outbox and Inbox requirements.
* Observability requirements.
* Security considerations.

Technical Notes must not unnecessarily constrain internal implementation when several valid solutions exist.

## Out of Scope

Explicitly mention related features that are intentionally excluded.

---

# 9. Task Rules

Tasks must describe concrete implementation work.

Each Task should include:

```markdown
## Objective

## Implementation Scope

## Completion Criteria

## Dependencies

## Technical Notes
```

A Task should generally be completable by one developer.

A Task should not normally require coordinated changes across several services. Cross-service work should be represented as:

* Separate service-specific Tasks.
* One integration Story or integration Task linking them.

Good task size:

* Add database migration.
* Implement one API use case.
* Implement one RabbitMQ consumer.
* Add integration tests for one flow.
* Add one React screen and its API integration.

Too large:

* Implement Billing Service.
* Complete all frontend.
* Set up all infrastructure.

Too small:

* Create one class.
* Add one property.
* Rename one variable.
* Add one using statement.

---

# 10. Issue Summary Naming

Issue summaries must:

* Be concise.
* Start with an action for Stories and Tasks.
* Clearly identify the business capability.
* Avoid internal ticket numbering in the summary.
* Avoid service names when the component or label already provides enough context, unless clarification is needed.

Good Story summaries:

```text
Manage rooms and room status
Register a tenant's move-in
Transfer a tenant to another room
Record monthly electricity readings
Generate invoices for a billing period
Create a mock QR payment request
```

Good Task summaries:

```text
Create the Rental Service database schema
Implement tenant move-in validation
Publish TenantMovedIn integration events
Consume payment success events
Add invoice generation integration tests
```

Avoid:

```text
Rental API
Work on tenant
Payment task
Backend code
Implement feature
```

---

# 11. Priority Rules

Use the Jira project's existing priority values.

Recommended interpretation:

## Highest

Use only for:

* Security vulnerabilities.
* Data-loss risks.
* Blocking defects preventing development or deployment.
* Payment duplication.
* Incorrect financial totals.
* Authentication bypass.

## High

Use for:

* Core MVP business flow.
* Architecture foundation blocking multiple teams or services.
* Room management.
* Tenant occupancy.
* Meter reading.
* Invoice generation.
* Payment status processing.

## Medium

Use for:

* Supporting MVP capabilities.
* Reports.
* Audit screens.
* Non-blocking operational improvements.
* Developer experience improvements.

## Low

Use for:

* Optional improvements.
* Cosmetic UI work.
* Deferred optimization.
* Nice-to-have reports.
* Nonessential automation.

Do not assign every issue the highest priority.

---

# 12. Story Point Rules

Only populate Story Points when the Jira project supports estimation.

Recommended scale:

```text
1, 2, 3, 5, 8, 13
```

Suggested interpretation:

| Points | Meaning                                                |
| -----: | ------------------------------------------------------ |
|      1 | Small, well understood, minimal risk                   |
|      2 | Small change with limited testing                      |
|      3 | Standard Story or Task                                 |
|      5 | Multiple implementation steps or integration           |
|      8 | Complex business rules or distributed integration      |
|     13 | Too large or highly uncertain; should usually be split |

Story Points represent:

* Complexity.
* Effort.
* Uncertainty.
* Integration risk.

Story Points do not represent exact hours.

Codex should not estimate Epics unless the Jira project explicitly estimates Epics.

Sub-tasks should not receive Story Points unless that is the existing team convention.

Issues estimated at 13 points should be reviewed and split where practical.

---

# 13. Sprint Allocation

Suggested sprint duration:

```text
2 weeks
```

Recommended MVP sequence:

## Sprint 0 — Foundation

* Repository structure.
* Docker Compose or Aspire.
* PostgreSQL.
* RabbitMQ.
* API Gateway.
* Shared event conventions.
* OpenTelemetry foundation.
* CI foundation.

## Sprint 1 — Identity and Rental Foundation

* Authentication.
* JWT.
* Room management.
* Tenant management.
* Occupancy management.

## Sprint 2 — Contracts and Metering

* Rental contracts.
* Deposits.
* Electricity and water meters.
* Monthly readings.
* Metering integration events.

## Sprint 3 — Billing

* Service pricing.
* Billing periods.
* Invoice calculation.
* Invoice issuance.
* Invoice PDF.

## Sprint 4 — Payment Simulation

* PaymentIntent.
* Mock provider.
* QR generation.
* Payment webhook simulation.
* Billing payment updates.

## Sprint 5 — Frontend Completion

* Main React workflows.
* Dashboard.
* Debt view.
* Payment simulation UI.
* Error handling.

## Sprint 6 — Hardening and Deployment

* Integration tests.
* Resilience.
* Dead-letter handling.
* Monitoring dashboards.
* Security review.
* Deployment.
* Backup and restore test.

Codex must inspect existing Jira sprints before assigning issues.

If the sprints do not exist, Codex should propose sprint names but must not create them unless explicitly approved.

---

# 14. Dependency Rules

Use Jira issue links when available.

Preferred link types:

```text
blocks
is blocked by
depends on
is depended on by
```

Dependency direction must be clear.

Example:

```text
Create Billing Service database schema
blocks
Implement invoice generation
```

Do not create unnecessary dependency links for work items that merely belong to the same Epic.

Dependencies should be added for:

* Required platform work.
* Required API or event contracts.
* Producer-consumer relationships.
* Database schema before persistence implementation.
* Authentication before protected routes.
* Backend endpoint before frontend integration.
* Invoice issuance before payment creation.
* Payment events before invoice payment updates.

Avoid circular dependencies.

If a circular dependency is detected, Codex must report it rather than create the links.

---

# 15. Duplicate Detection

Before creating any issue, Codex must search Jira using:

* Exact or similar summary.
* Epic name.
* Labels.
* Component.
* Relevant keywords.
* Parent Epic.
* Existing `manage-motel-mvp` issues.

An issue is potentially duplicated when it has:

* The same business objective.
* Substantially overlapping Acceptance Criteria.
* The same owning service and scope.
* A similar summary under the same Epic.

A different summary does not necessarily mean it is a different issue.

If a possible duplicate exists, Codex must:

1. Report the existing issue key.
2. Explain the overlap.
3. Skip creation unless the user explicitly chooses to create a separate issue.

Codex must not automatically overwrite or expand an existing issue.

---

# 16. Architecture Rules for Jira Issues

Every technical issue must respect the following constraints.

## Service ownership

* Identity Service owns users and authentication data.
* Rental Service owns rooms, tenants, occupancy, contracts, and deposits.
* Metering Service owns meters and meter readings.
* Billing Service owns billing periods, invoices, invoice lines, and debt.
* Payment Service owns PaymentIntent, payment attempts, provider transactions, and webhooks.

## Database boundaries

* Each service owns its database.
* A service must not query another service's database.
* No cross-service foreign keys.
* No shared ORM context between services.
* Reporting data must be fetched through APIs or replicated through events.

## Communication

Use synchronous communication only when an immediate response is required.

Preferred synchronous methods:

* REST from frontend through API Gateway.
* gRPC between backend services where appropriate.

Use RabbitMQ integration events for state propagation.

## Messaging

All integration consumers must be idempotent.

Every integration message must contain:

```text
eventId
eventType
eventVersion
occurredAt
producer
correlationId
causationId
data
```

Use Transactional Outbox for reliable event publication.

Use Inbox or equivalent deduplication for consumers.

## Payment

Payment Service must use a provider abstraction.

The MVP must implement:

```text
MockPaymentProvider
```

The mock provider must follow the same flow as a future real provider:

```text
Create PaymentIntent
Generate QR or checkout data
Receive callback or webhook
Verify event
Store provider event
Process idempotently
Publish PaymentSucceeded or PaymentFailed
```

The browser redirect must not be treated as proof of payment.

## Observability

Every service must support:

* Structured logging.
* Correlation ID.
* Distributed tracing.
* Metrics.
* Health checks.

## Excluded architecture

The MVP must not introduce:

* Kubernetes.
* Kafka.
* Full Event Sourcing.
* Service Mesh.
* Elasticsearch without a demonstrated requirement.

---

# 17. Definition of Ready

A Story is Ready when:

* Business objective is clear.
* Scope is defined.
* Acceptance Criteria are testable.
* Owning service or component is known.
* Dependencies are identified.
* Required design decisions are resolved.
* Required API or event contracts are known or included in scope.
* No unresolved blocker prevents implementation.
* Estimate is provided when supported.

Codex should flag Stories that do not meet the Definition of Ready.

---

# 18. Definition of Done

A Story or Task is Done when applicable conditions are satisfied:

* Implementation is complete.
* Code has been reviewed.
* Unit tests pass.
* Integration tests pass.
* Acceptance Criteria pass.
* Database migrations are included.
* API documentation is updated.
* Event contracts are documented.
* Logging is implemented.
* Metrics and traces are implemented for important flows.
* Error handling is implemented.
* Security considerations are addressed.
* No secret is committed to source control.
* Deployment configuration is updated.
* Related documentation is updated.
* No unresolved critical or high-severity defect remains.

Frontend work is Done when:

* Loading state is handled.
* Empty state is handled.
* Error state is handled.
* Validation messages are displayed.
* Main flow is responsive on supported desktop sizes.
* API errors do not expose sensitive server details.

---

# 19. Bug Rules

Bug issues should include:

```markdown
## Problem

## Steps to Reproduce

## Expected Result

## Actual Result

## Impact

## Environment

## Evidence

## Acceptance Criteria
```

Bug priorities should be based on impact, not convenience.

A financial calculation bug or duplicate payment bug should normally be High or Highest.

---

# 20. Technical Debt Rules

Technical debt must not be hidden inside unrelated Stories.

Create a separate issue with label:

```text
technical-debt
```

The issue must explain:

* Current limitation.
* Why the shortcut was accepted.
* Risk of leaving it unresolved.
* Recommended future solution.
* Suggested timing.

Technical debt that presents immediate data-loss, security, or financial risk must not be deferred as ordinary low-priority debt.

---

# 21. Backlog Creation Order

Use the following order:

1. Validate Jira project and metadata.
2. Search existing backlog.
3. Create Epics.
4. Record created Epic keys.
5. Create Stories under each Epic.
6. Record created Story keys.
7. Create Tasks and Sub-tasks.
8. Create dependency links.
9. Assign Components.
10. Assign labels.
11. Populate estimates.
12. Assign sprints when approved.
13. Produce the final creation report.

Do not try to create children before their parent issue exists.

---

# 22. Batch Reporting

After each creation batch, report:

```markdown
## Batch Result

### Created
- PROJECT-101 — Issue summary
- PROJECT-102 — Issue summary

### Skipped as Duplicate
- Proposed issue — Existing PROJECT-55

### Failed
- Proposed issue
  - Reason: ...

### Remaining
- Number of Epics
- Number of Stories
- Number of Tasks
```

At the end, provide:

* Total created.
* Total skipped.
* Total failed.
* Backlog grouped by Epic.
* Jira keys.
* Unresolved dependencies.
* Fields that could not be populated.
* Recommended manual follow-up.

---

# 23. Change Management

When requirements change, Codex must not silently modify Jira issues.

Codex should:

1. Read the latest project specification.
2. Compare it with existing Jira issues.
3. Produce a change-impact report.
4. Classify affected issues as:

   * No change.
   * Description update.
   * Acceptance Criteria update.
   * Split required.
   * New issue required.
   * No longer in MVP.
5. Wait for approval.
6. Apply approved updates.

Issues removed from MVP should not be deleted.

They should be:

* Moved to a future backlog when appropriate.
* Labeled `out-of-mvp`.
* Updated only after user approval.

---

# 24. Final Restrictions

Codex must not:

* Create duplicate issues.
* Guess Jira configuration.
* Delete issues.
* Change unrelated issues.
* Transition issues without approval.
* Assign users without approval.
* Create components without approval.
* Create sprints without approval.
* Add Kubernetes, Kafka, or Event Sourcing to the MVP backlog.
* Put secrets or API tokens in Jira descriptions.
* Include sensitive tenant identity data in Jira.
* Create a single issue representing an entire microservice.
* Treat a payment redirect as payment confirmation.
* Allow one service to directly modify another service's database.

When uncertain, Codex must stop the write operation, report the uncertainty, and preserve the work already completed.
