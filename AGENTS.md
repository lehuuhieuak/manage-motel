# Codex Instructions

## Project

This repository contains the product and technical specifications for the Motel Management MVP.

Before creating or updating Jira work items, always read:

* `docs/project-spec.md`
* `docs/jira-rules.md`

## Jira safety rules

* Use the Atlassian MCP server.
* Never guess the Jira project key.
* Inspect available Jira projects before writing.
* Inspect available issue types and required fields.
* Inspect available components, priorities and custom fields.
* Search for existing issues before creating new ones.
* Treat issues with label `manage-motel-mvp` as belonging to this project.
* Do not create duplicate issues.
* Do not bulk-create issues until the user approves the proposed backlog.
* Create Epics before their child work items.
* Create issues in batches.
* After each batch, report created issue keys and failures.
* Do not delete existing Jira issues.
* Do not transition existing issues unless explicitly requested.

## Backlog quality

Every Story must contain:

* Business objective.
* Scope.
* Acceptance Criteria.
* Dependencies.
* Technical notes when appropriate.
* Suggested story points if the Jira project supports estimation.

Acceptance Criteria should be testable and use clear Given/When/Then wording where practical.

Tasks should be implementation-sized and generally completable by one developer without spanning multiple services unless the task is specifically an integration task.

## Architecture constraints

* Database per service.
* No direct cross-service database queries.
* RabbitMQ for integration events.
* REST or gRPC for synchronous calls.
* Transactional Outbox and Inbox Pattern.
* Idempotent consumers.
* OpenTelemetry from the beginning.
* Mock payment provider must use the same flow as a future real provider.
* Do not introduce Kubernetes, Kafka or full Event Sourcing into the MVP.
