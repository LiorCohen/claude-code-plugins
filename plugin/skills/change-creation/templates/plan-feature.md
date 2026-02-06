## Overview

Implementation plan for: <title>

Specification: [SPEC.md](./SPEC.md)

## Affected Components

<!-- Generated from .sdd/sdd-settings.yaml -->
- <component-1> (contract)
- <component-2> (server)
- <component-3> (webapp)

## Prerequisites

> Only include if `prerequisites` provided

Complete implementation of the following changes before starting:
- <prerequisite_1>
- <prerequisite_2>

## Implementation Phases

<!-- Phases generated dynamically based on affected components -->
<!-- Domain updates are executed from SPEC.md ## Domain Updates section -->

### Phase 1: [Component Name] - API Contract
**Agent:** `api-designer`
**Component:** <component-name>

Tasks:
- [ ] Update OpenAPI spec with new endpoints/schemas
- [ ] Generate TypeScript types

Deliverables:
- Updated OpenAPI spec
- Generated TypeScript types

### Phase 2: [Component Name] - Backend Implementation
**Agent:** `backend-dev`
**Component:** <component-name>

Tasks:
- [ ] Implement domain logic
- [ ] Add data access layer
- [ ] Wire up controllers
- [ ] Write unit tests (TDD)

Deliverables:
- Working API endpoints
- Unit tests passing

### Phase 3: [Component Name] - Frontend Implementation
**Agent:** `frontend-dev`
**Component:** <component-name>

Tasks:
- [ ] Create components
- [ ] Add hooks
- [ ] Integrate with API
- [ ] Write unit tests (TDD)

Deliverables:
- Working UI
- Unit tests passing

### Phase N-1: Integration & E2E Testing
**Agent:** `tester`

Tasks:
- [ ] Integration tests for API layer
- [ ] E2E tests for user flows

Deliverables:
- Test suites passing

### Phase N: Review
**Agent:** `reviewer`, `db-advisor` (if DB changes)

Tasks:
- [ ] Spec compliance review
- [ ] Database review (if applicable)

## Expected Files

> List files expected to be created or modified by this change

### Files to Create

| File | Component | Description |
|------|-----------|-------------|
| `path/to/new-file.ts` | server | [Purpose] |

### Files to Modify

| File | Component | Description |
|------|-----------|-------------|
| `path/to/existing-file.ts` | server | [What changes] |

## Implementation State

> Updated during implementation to track progress. Enables session resumption.

### Current Phase

- **Phase:** [Not started | 1 | 2 | ... | Complete]
- **Status:** [pending | in_progress | blocked | complete]
- **Last Updated:** YYYY-MM-DD HH:MM

### Completed Phases

| Phase | Completed | Notes |
|-------|-----------|-------|
| 1 | [ ] | |
| 2 | [ ] | |

### Actual Files Changed

> Updated during implementation with actual files created/modified

| File | Action | Phase | Notes |
|------|--------|-------|-------|
| | | | |

### Blockers

> Any blockers encountered during implementation

- (none)

### Resource Usage

> Track tokens, turns, and time consumed during implementation

| Phase | Tokens (Input) | Tokens (Output) | Turns | Duration | Notes |
|-------|----------------|-----------------|-------|----------|-------|
| 1 | - | - | - | | |
| 2 | - | - | - | | |
| ... | - | - | - | | |
| **Total** | **-** | **-** | **-** | **-** | |

## Dependencies

- [External dependencies or blockers]

## Risks

| Risk | Mitigation |
|------|------------|
| [Risk] | [How to mitigate] |
