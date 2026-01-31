---
name: change-creation
description: Create change specification and implementation plan with dynamic phase generation. Supports feature, bugfix, refactor, and epic types.
---

# Change Creation Skill

## Purpose

Create a complete change specification package consisting of:
- Change directory: `changes/YYYY/MM/DD/<change-name>/`
- Specification: `SPEC.md` with proper frontmatter, type-specific sections, and domain updates
- Implementation plan: `PLAN.md` with dynamically generated phases
- INDEX.md update with new change entry

## Key Principles

### Skills vs Agents Separation

| Context | Responsibility |
|---------|----------------|
| **Skills** (main context) | All planning, spec creation, domain docs - interactive, needs user input |
| **Agents** (subagent) | Execution only - non-interactive, implements approved plans |

This skill handles all spec and plan creation. Implementation agents only execute the approved plan.

### Domain Documentation During Planning

Domain documentation is specified **in SPEC.md during planning**, not discovered during implementation:
- Glossary terms are explicitly listed
- Definition specs are identified upfront
- Architecture changes are noted

Implementation simply executes these specifications.

### Dynamic Phase Generation

Plans are generated dynamically based on:
1. Project components from `sdd-settings.yaml`
2. Which components are affected by the change
3. Dependency order between components
4. Contextual agent assignment

## Input

| Parameter | Required | Description |
|-----------|----------|-------------|
| `name` | Yes | Directory name (lowercase, hyphens) |
| `type` | Yes | Change type: `feature`, `bugfix`, `refactor`, or `epic` |
| `title` | Yes | Display title for the change |
| `description` | Yes | Brief description (1-2 sentences) |
| `domain` | Yes | Primary domain (e.g., "Identity", "Billing") |
| `issue` | No | Issue reference (e.g., "PROJ-123"), defaults to "TBD" |
| `user_stories` | No | List of user stories (feature type only) |
| `acceptance_criteria` | No | List of acceptance criteria |
| `api_endpoints` | No | List of API endpoints affected |
| `glossary_terms` | No | Domain terms to add/update in glossary |
| `domain_definitions` | No | Definition specs to create/update |
| `architecture_updates` | No | Architecture doc updates needed |
| `external_source` | No | Path to archived external spec (audit trail only) |
| `source_content` | No | Full markdown content from external spec section |
| `decomposition_id` | No | UUID linking related changes |
| `prerequisites` | No | List of prerequisite changes (for dependencies) |
| `affected_files` | No | List of files affected (bugfix/refactor types) |
| `affected_components` | No | List of component names from sdd-settings.yaml |
| `root_cause` | No | Root cause description (bugfix type only) |
| `refactor_goals` | No | List of refactoring goals (refactor type only) |
| `child_changes` | No | List of child change names (epic type only) |
| `epic_goal` | No | Overall epic goal (epic type only) |

## Output

Returns a result with:
- `spec_path`: Path to created SPEC.md
- `plan_path`: Path to created PLAN.md
- `index_updated`: Boolean indicating INDEX.md was updated

## Workflow

### Step 1: Validate Inputs

1. Validate `name` is a valid directory name:
   - Lowercase letters, numbers, hyphens only
   - No spaces or special characters
   - Not empty

2. Validate `type` is one of: `feature`, `bugfix`, `refactor`, `epic`

3. Ensure required parameters are provided:
   - `name`, `type`, `title`, `description`, `domain`

### Step 2: Generate Date Path

1. Get current date
2. Format as `YYYY/MM/DD`
3. Full path: `changes/YYYY/MM/DD/<name>/`

### Step 3: Read Plugin Version and Settings

1. Read SDD plugin version from `.claude-plugin/plugin.json`
2. Read project components from `sdd-settings.yaml`
3. Identify affected components (from input or infer from description)

### Step 4: Create Change Directory

```bash
mkdir -p changes/YYYY/MM/DD/<name>/
```

### Step 5: Create SPEC.md

Create `changes/YYYY/MM/DD/<name>/SPEC.md` using type-specific template.

#### Common Frontmatter (all types)

```yaml
---
title: <title>
type: <type>
status: active
domain: <domain>
issue: <issue or "TBD">
created: YYYY-MM-DD
updated: YYYY-MM-DD
sdd_version: <plugin_version>
affected_components:
  - <component-1>
  - <component-2>
external_source: <path>  # Only if provided
decomposition_id: <uuid>  # Only if provided
---
```

#### Type-Specific Content

**For `type: feature`:**

This is a **technical specification**. It must be thorough and self-sufficient - anyone reading this spec should fully understand the change without needing to reference other documents.

```markdown
## Overview

<description>

### Background

> Why is this change needed? What problem does it solve?

[Explain the context and motivation]

### Current State

> What exists today? What are the limitations?

[Describe the current implementation or lack thereof]

## Original Requirements

> Only include if `source_content` is provided. This section embeds the full content from the external spec, making this spec self-sufficient.

<source_content>

<!-- Audit reference: <external_source> - DO NOT READ, use content above -->

---

## User Stories

> Who benefits and how?

- As a [role], I want [capability] so that [benefit]
- ...

## Functional Requirements

> What the system must do. Be specific and complete.

### FR1: [Requirement Name]

**Description:** [Detailed description]

**Behavior:**
- When [condition], the system shall [action]
- ...

**Constraints:**
- [Any limitations or rules]

### FR2: [Requirement Name]

...

## Non-Functional Requirements

> Performance, security, scalability, etc.

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| Response time | < 200ms p95 | API latency monitoring |
| Availability | 99.9% | Uptime monitoring |
| Throughput | 1000 req/s | Load testing |

## Technical Design

### Architecture

> How does this fit into the system? Include diagrams if helpful.

```
[Component A] ---> [Component B] ---> [Database]
       |
       v
[External Service]
```

### Data Model

> Database schema changes, new tables, modified columns

**New Tables:**

```sql
CREATE TABLE table_name (
  id UUID PRIMARY KEY,
  field_1 VARCHAR(255) NOT NULL,
  field_2 TIMESTAMP DEFAULT NOW(),
  -- ...
);
```

**Modified Tables:**

| Table | Column | Change | Reason |
|-------|--------|--------|--------|
| existing_table | new_column | ADD | [Why] |

**Indexes:**

| Table | Index | Columns | Type |
|-------|-------|---------|------|
| table_name | idx_field_1 | field_1 | btree |

### Algorithms / Business Logic

> Key algorithms or complex business rules

**[Algorithm/Rule Name]:**

1. Step 1: [Description]
2. Step 2: [Description]
3. ...

**Edge Cases:**
- [Edge case 1]: [How it's handled]
- [Edge case 2]: [How it's handled]

## API Contract

> Complete API specification

### Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /api/v1/resource | Create resource | Bearer |
| GET | /api/v1/resource/:id | Get resource | Bearer |

### Request/Response Schemas

**POST /api/v1/resource**

Request:
```json
{
  "field_1": "string (required)",
  "field_2": "number (optional, default: 0)"
}
```

Response (201):
```json
{
  "id": "uuid",
  "field_1": "string",
  "field_2": "number",
  "created_at": "ISO8601"
}
```

Error Responses:
| Status | Code | Description |
|--------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid input |
| 401 | UNAUTHORIZED | Missing/invalid token |
| 409 | CONFLICT | Resource already exists |

## Security Considerations

> Authentication, authorization, data protection

- **Authentication:** [How users are authenticated]
- **Authorization:** [Who can access what]
- **Data Protection:** [Sensitive data handling, encryption]
- **Input Validation:** [Validation rules]

## Error Handling

> How errors are handled and communicated

| Error Scenario | User Message | Log Level | Recovery |
|----------------|--------------|-----------|----------|
| Database unavailable | "Service temporarily unavailable" | ERROR | Retry with backoff |
| Invalid input | "Validation failed: {details}" | WARN | Return 400 |

## Observability

### Logging

| Event | Level | Fields |
|-------|-------|--------|
| Resource created | INFO | resource_id, user_id |
| Validation failed | WARN | errors, input |

### Metrics

| Metric | Type | Labels |
|--------|------|--------|
| resource_created_total | counter | status |
| resource_creation_duration | histogram | - |

### Traces

| Span | Attributes |
|------|------------|
| create_resource | resource_type, user_id |

## Acceptance Criteria

> Use Given/When/Then format. Each criterion must be independently testable.

- [ ] **AC1:** Given [precondition], when [action], then [result]
- [ ] **AC2:** Given [precondition], when [action], then [result]
- ...

## Domain Updates

> Specify all domain documentation changes upfront. Implementation executes these exactly.

### Glossary Terms

> List exact terms to add or modify in `specs/domain/glossary.md`

| Term | Definition | Action |
|------|------------|--------|
| Term Name | Complete definition including context and usage | add/update |

### Definition Specs

> List domain definition files to create or update in `specs/domain/definitions/`

| File | Description | Action |
|------|-------------|--------|
| `<definition-name>.md` | What this definition covers | create/update |

### Architecture Docs

> List architecture documentation updates needed in `specs/architecture/`

- [ ] Update `<doc-name>.md` with [description of change]

## Testing Strategy

> Comprehensive testing approach

### Unit Tests

| Component | Test Case | Expected Behavior |
|-----------|-----------|-------------------|
| [service] | [scenario] | [expected result] |
| [service] | [edge case] | [expected result] |

### Integration Tests

| Scenario | Components | Expected Outcome |
|----------|------------|------------------|
| [scenario] | [A → B] | [result] |

### E2E Tests

| User Flow | Steps | Expected Result |
|-----------|-------|-----------------|
| [flow name] | 1. [step] 2. [step] | [outcome] |

### Test Data

> Required test fixtures or data

| Entity | Required State | Purpose |
|--------|---------------|---------|
| User | Active, verified | Happy path testing |
| User | Suspended | Error path testing |

## Dependencies

### Internal Dependencies

| Component | Version | Reason |
|-----------|---------|--------|
| [service] | >= 1.2.0 | Requires [feature] |

### External Dependencies

| Service | API Version | Fallback |
|---------|-------------|----------|
| [external] | v2 | [how to handle unavailability] |

## Migration / Rollback

### Migration Steps

1. [Step 1]
2. [Step 2]

### Rollback Plan

1. [How to revert if issues occur]
2. [Data rollback if needed]

### Feature Flags

| Flag | Default | Purpose |
|------|---------|---------|
| enable_feature_x | false | Gradual rollout |

## Out of Scope

> Explicitly list what this feature does NOT include

- Item 1: [Why it's out of scope]
- Item 2: [Why it's out of scope]

## Open Questions

> Unresolved questions that need answers before/during implementation

- [ ] Question 1?
- [ ] Question 2?

## References

> Links to related specs, docs, or external resources

- [Related Spec](path/to/spec.md)
- [External Doc](https://example.com)
```

**For `type: bugfix`:**

```markdown
## Overview

<description>

**Severity:** [Critical / High / Medium / Low]

## Bug Description

### Symptoms

- [What users observe]

### Expected Behavior

[What should happen instead]

### Steps to Reproduce

1. [Step 1]
2. [Step 2]
3. **Observe:** [What goes wrong]

## Root Cause

> Technical explanation of why the bug occurs

[Explanation]

**Location:** `path/to/file.ts:line`

## Proposed Fix

[Description of the fix approach]

### Files to Change

| File | Change |
|------|--------|
| `path/to/file.ts` | [What will change] |

## Acceptance Criteria

- [ ] Bug no longer reproducible
- [ ] No regression in related functionality
- [ ] Regression test added

## Testing

### Regression Test

| Test | Conditions | Expected |
|------|------------|----------|
| [name] | [trigger bug] | [correct behavior] |

## Out of Scope

- [Related issues not fixed here]
```

**For `type: refactor`:**

This is a **technical specification** for a refactoring. It must document the current state, proposed changes, and ensure behavior is preserved.

```markdown
## Overview

<description>

### Motivation

> Why is this refactor needed now?

[Business or technical driver for this refactor]

## Refactoring Goals

> Specific, measurable goals

| Goal | Success Metric | Priority |
|------|----------------|----------|
| Improve readability | Code review approval | High |
| Reduce duplication | DRY violations reduced by X% | Medium |
| Better separation | Each module has single responsibility | High |

## Current State Analysis

### Architecture Overview

> How the code is currently structured

```
[Current architecture diagram]
```

### Code Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Cyclomatic complexity | [value] | < [target] |
| Lines per function (avg) | [value] | < [target] |
| Test coverage | [value]% | >= [target]% |

### Problems with Current Approach

| Problem | Impact | Files Affected |
|---------|--------|----------------|
| [Problem 1] | [Impact on dev/perf/maintenance] | [files] |
| [Problem 2] | [Impact] | [files] |

### Code Examples (Before)

> Show problematic patterns

```typescript
// Example of current problematic code
[code snippet]
```

## Proposed Design

### New Architecture

> How the code will be structured after refactor

```
[New architecture diagram]
```

### Design Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| [Decision 1] | [Why] | [What else was considered] |

### Code Examples (After)

> Show improved patterns

```typescript
// Example of refactored code
[code snippet]
```

## Transformation Plan

### Step-by-Step Changes

| Step | Files | Change | Backward Compatible |
|------|-------|--------|---------------------|
| 1 | [files] | [change] | Yes/No |
| 2 | [files] | [change] | Yes/No |

### Affected Areas

| File/Module | Change Type | Risk Level |
|-------------|-------------|------------|
| `path/to/file.ts` | Restructure | Medium |
| `path/to/module/` | Extract | Low |

## Behavior Preservation

### Invariants

> What must NOT change

- [ ] All existing API contracts unchanged
- [ ] All existing tests pass without modification
- [ ] Performance within [X]% of current

### Verification Approach

| Behavior | How to Verify |
|----------|---------------|
| API responses | Existing integration tests |
| Performance | Benchmark before/after |
| Edge cases | [Specific tests] |

## Testing Strategy

### Existing Tests

| Test Suite | Expected Result |
|------------|-----------------|
| Unit tests | All pass, no changes needed |
| Integration tests | All pass |

### New Tests

| Test | Purpose |
|------|---------|
| [test name] | Verify refactored component |

### Manual Verification

| Scenario | Steps | Expected |
|----------|-------|----------|
| [scenario] | [steps] | [result] |

## API Impact

> Usually "None - internal refactor"

### Public API Changes

- [ ] No public API changes
- [ ] API changes: [describe with migration path]

## Risks and Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Subtle behavior change | Medium | High | Comprehensive testing |
| Performance regression | Low | Medium | Benchmark comparison |

## Rollback Plan

1. [How to identify if rollback needed]
2. [How to rollback]

## Out of Scope

> What this refactor explicitly does NOT change

- [Related code that won't be touched]
- [Future improvements not in this refactor]

## Success Criteria

- [ ] All refactoring goals met
- [ ] All tests pass
- [ ] No behavior changes
- [ ] Code review approved
- [ ] Performance validated

## References

- [Design doc or RFC if applicable]
- [Related refactors]
```

**For `type: epic`:**

```markdown
## Overview

<description>

## Changes

| Change | Description | Dependencies |
|--------|-------------|--------------|
| [change-name] | [Brief description] | None |

> Include if `child_changes` provided, otherwise use template rows

## Acceptance Criteria

> Top-level epic criteria (child changes have their own)

- [ ] **AC1:** Given [precondition], when [action], then [result]

## Cross-Cutting Concerns

> Items that span multiple child changes

- **[Concern]**: [How it's handled across changes]

## Domain Updates

> Epic-level domain updates (child changes may have additional)

### Glossary Terms

| Term | Definition | Action |
|------|------------|--------|
| Term Name | Brief definition | add/update |

### Definition Specs

| File | Description | Action |
|------|-------------|--------|
| `<definition-name>.md` | What this definition covers | create/update |

## Out of Scope

> Explicitly list what this epic does NOT include

- Item 1
- Item 2
```

**Epic Directory Structure:**

After creating the epic's own SPEC.md and PLAN.md, create child change directories:

```
changes/YYYY/MM/DD/<epic-name>/
├── SPEC.md
├── PLAN.md
└── changes/
    ├── <child-change-1>/
    │   ├── SPEC.md
    │   └── PLAN.md
    └── <child-change-2>/
        ├── SPEC.md
        └── PLAN.md
```

Each child change uses the standard feature spec template with `parent_epic: ../SPEC.md` in frontmatter.

### Step 6: Create PLAN.md with Dynamic Phases

Create `changes/YYYY/MM/DD/<name>/PLAN.md` using dynamic phase generation.

#### Phase Generation Algorithm

1. **Read project components** from `sdd-settings.yaml`
2. **Filter to affected components** (from SPEC.md `affected_components`)
3. **Order by dependency graph:**
   ```
   config ──────┐
                │
   contract ────┼──→ server (includes DB) ──→ helm
                │           │
                │           ↓
                └───────→ webapp
   ```
4. **Assign agents** based on component type:

| Component Type | Agent | Notes |
|----------------|-------|-------|
| contract | api-designer | API design and OpenAPI updates |
| server | backend-dev | Backend implementation + DB (TDD) |
| webapp | frontend-dev | Frontend implementation (TDD) |
| helm | devops | Deployment and infrastructure |
| config | contextual | Depends on what config affects |

5. **Add final phases:**
   - `tester` for integration/E2E testing
   - `reviewer` (+ `db-advisor` if DB changes)

#### Plan Frontmatter

```yaml
---
title: <title> - Implementation Plan
change: <name>
type: <type>
spec: ./SPEC.md
status: draft
created: YYYY-MM-DD
sdd_version: <plugin_version>
---
```

#### Plan Content (Feature - Dynamic)

```markdown
## Overview

Implementation plan for: <title>

Specification: [SPEC.md](./SPEC.md)

## Affected Components

<!-- Generated from sdd-settings.yaml -->
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
```

#### Plan Content (Bugfix)

```markdown
## Overview

Implementation plan for bugfix: <title>

Specification: [SPEC.md](./SPEC.md)

## Affected Components

- <component>

## Implementation Phases

### Phase 1: Investigation
**Agent:** `backend-dev` or `frontend-dev` (based on component)

Tasks:
- [ ] Reproduce the bug locally
- [ ] Identify root cause
- [ ] Document findings in SPEC.md

Deliverables:
- Documented root cause
- Clear reproduction steps

### Phase 2: Implementation
**Agent:** `backend-dev` or `frontend-dev` (based on component)

Tasks:
- [ ] Implement the fix
- [ ] Write regression test (TDD - test should fail before fix)
- [ ] Update any affected API contracts (if needed)

Deliverables:
- Working fix
- Regression test passing

### Phase 3: Integration Testing
**Agent:** `tester`

Tasks:
- [ ] Verify fix resolves the issue
- [ ] Run existing test suite
- [ ] Verify no regressions

Deliverables:
- All tests passing

### Phase 4: Review
**Agent:** `reviewer`

Tasks:
- [ ] Code review
- [ ] Verify acceptance criteria met
- [ ] Final QA sign-off

## Implementation State

### Current Phase

- **Phase:** [Not started | 1 | 2 | 3 | 4 | Complete]
- **Status:** [pending | in_progress | blocked | complete]
- **Last Updated:** YYYY-MM-DD HH:MM

### Resource Usage

| Phase | Tokens (Input) | Tokens (Output) | Turns | Duration |
|-------|----------------|-----------------|-------|----------|
| 1 | - | - | - | |
| 2 | - | - | - | |
| 3 | - | - | - | |
| 4 | - | - | - | |
| **Total** | **-** | **-** | **-** | **-** |

## Notes

- Prioritize minimal, focused changes
- Update this plan as investigation reveals more details
```

#### Plan Content (Refactor)

```markdown
## Overview

Implementation plan for refactor: <title>

Specification: [SPEC.md](./SPEC.md)

## Affected Components

- <component>

## Implementation Phases

### Phase 1: Preparation
**Agent:** `backend-dev` or `frontend-dev` (based on component)

Tasks:
- [ ] Ensure comprehensive test coverage exists
- [ ] Document current behavior
- [ ] Identify all affected areas

Deliverables:
- Test coverage report
- Affected area documentation

### Phase 2: Implementation
**Agent:** `backend-dev` or `frontend-dev` (based on component)

Tasks:
- [ ] Implement refactoring changes
- [ ] Update any affected API contracts (if needed)
- [ ] Maintain backward compatibility (if required)

Deliverables:
- Refactored code
- All existing tests passing

### Phase 3: Integration Testing
**Agent:** `tester`

Tasks:
- [ ] Run existing test suite
- [ ] Verify no behavior changes
- [ ] Performance testing (if applicable)

Deliverables:
- All tests passing
- No behavior changes verified

### Phase 4: Review
**Agent:** `reviewer`

Tasks:
- [ ] Code review focusing on refactoring goals
- [ ] Verify no regressions
- [ ] Final QA sign-off

## Implementation State

### Current Phase

- **Phase:** [Not started | 1 | 2 | 3 | 4 | Complete]
- **Status:** [pending | in_progress | blocked | complete]
- **Last Updated:** YYYY-MM-DD HH:MM

### Resource Usage

| Phase | Tokens (Input) | Tokens (Output) | Turns | Duration |
|-------|----------------|-----------------|-------|----------|
| 1 | - | - | - | |
| 2 | - | - | - | |
| 3 | - | - | - | |
| 4 | - | - | - | |
| **Total** | **-** | **-** | **-** | **-** |

## Notes

- All tests must pass before and after refactoring
- No functional changes should be introduced
```

#### Plan Content (Epic)

```markdown
## Overview

Implementation plan for epic: <title>

Specification: [SPEC.md](./SPEC.md)

## Change Order

Implement child changes in this order:

| # | Change | Description | Dependencies | Status |
|---|--------|-------------|--------------|--------|
| 1 | [change-name] | [Brief description] | None | pending |
| 2 | [change-name] | [Brief description] | [change-name] | pending |

## Dependency Graph

```
change-1
    ↓
change-2 (requires: change-1)
```

## PR Strategy

One PR per child change. Branch naming: `epic/<epic-name>/<change-name>`

## Progress Tracking

- [ ] Change 1: [change-name]
- [ ] Change 2: [change-name]

## Resource Usage

> Track tokens, turns, and time per child change

| Change | Tokens (Input) | Tokens (Output) | Turns | Duration | Notes |
|--------|----------------|-----------------|-------|----------|-------|
| [change-1] | - | - | - | | |
| [change-2] | - | - | - | | |
| **Total** | **-** | **-** | **-** | **-** | |
```

### Step 7: Update INDEX.md

Add entry to `specs/INDEX.md`:

1. Find the `## Active Changes` section (create if missing)
2. Add entry with type indicator:
   ```markdown
   - [<title>](changes/YYYY/MM/DD/<name>/SPEC.md) - <type> - <description>
   ```

### Step 8: Return Result

Return:
```yaml
spec_path: changes/YYYY/MM/DD/<name>/SPEC.md
plan_path: changes/YYYY/MM/DD/<name>/PLAN.md
index_updated: true
```

## PR Size Guidelines

Each phase should result in a reviewable PR:

| Metric | Target | Maximum |
|--------|--------|---------|
| Lines changed | < 400 | 800 |
| Files changed | < 15 | 30 |
| Acceptance criteria | < 5 | 8 |

**If a phase exceeds limits:**
1. Split into sub-phases (e.g., Phase 2a, Phase 2b)
2. Each sub-phase gets its own PR
3. Document splits in plan

## Spec Validation Rules

### Required Frontmatter Fields

- `title` - Change name
- `type` - feature, bugfix, refactor, or epic
- `status` - active (after merge)
- `domain` - Primary domain
- `issue` - Tracking issue reference (required)
- `created` - Creation date
- `updated` - Last update date
- `sdd_version` - SDD plugin version (required)

### Git Lifecycle

- **In PR** = draft (implicit, no status field)
- **Merged to main** = active
- Only explicit statuses: `active`, `deprecated`, `superseded`, `archived`

### Acceptance Criteria Format

Always use Given/When/Then:
- [ ] **AC1:** Given [precondition], when [action], then [result]

Each criterion must be independently testable.

## Examples

### Feature Example

```
Input:
  name: user-authentication
  type: feature
  title: User Authentication
  description: Allow users to sign up, sign in, and manage sessions
  domain: Identity
  issue: PROJ-123
  affected_components: [contract, server, webapp]
  glossary_terms:
    - term: Session Token
      definition: JWT token representing an authenticated user session
      action: add
  domain_definitions:
    - file: session.md
      description: Session management and token lifecycle
      action: create

Output:
  spec_path: changes/2026/01/21/user-authentication/SPEC.md
  plan_path: changes/2026/01/21/user-authentication/PLAN.md
  index_updated: true
```

### Bugfix Example

```
Input:
  name: fix-session-timeout
  type: bugfix
  title: Fix Session Timeout
  description: Sessions expire prematurely after 5 minutes instead of 30
  domain: Identity
  issue: BUG-456
  root_cause: Token expiry calculation uses seconds instead of minutes
  affected_files:
    - src/services/auth/session.ts
    - src/middleware/auth.ts
  affected_components: [server]

Output:
  spec_path: changes/2026/01/21/fix-session-timeout/SPEC.md
  plan_path: changes/2026/01/21/fix-session-timeout/PLAN.md
  index_updated: true
```

## Error Handling

- If change directory already exists: Warn and ask for confirmation to overwrite
- If INDEX.md doesn't exist: Create it with basic structure
- If plugin.json can't be read: Use "unknown" for sdd_version and warn
- If sdd-settings.yaml can't be read: Use default component assumptions and warn
- If invalid type provided: Return error with valid options
