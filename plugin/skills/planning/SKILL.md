---
name: planning
description: Templates and guidance for implementation plans with dynamic phase generation.
---

# Planning Skill

## Plan Location

Plans are stored alongside their specs:

`changes/YYYY/MM/DD/<change-name>/PLAN.md`

This keeps all change documentation (spec + plan) together in one location.

## SPEC.md vs PLAN.md Separation

| File | Purpose | Contains |
|------|---------|----------|
| **SPEC.md** | Nature of the change (tech spec) | Requirements, design, API contracts, data models, security, observability, tests, domain updates |
| **PLAN.md** | Execution | Phases, agent assignments, execution order, expected files, implementation state |

### SPEC.md: Thorough Technical Specification

SPEC.md is a **complete technical specification**. It must be:

- **Self-sufficient**: Anyone reading the spec understands the change fully without other docs
- **Thorough**: Covers all aspects (functional, non-functional, security, errors, observability)
- **Technical**: Includes schemas, algorithms, data models, API contracts
- **Testable**: Every requirement has clear acceptance criteria

Key sections:
- Background and current state (context)
- Functional and non-functional requirements
- Technical design (architecture, data model, algorithms)
- API contracts with request/response schemas
- Security considerations
- Error handling strategy
- Observability (logging, metrics, traces)
- Testing strategy with specific test cases
- Domain updates (glossary, definitions)
- Dependencies and migration plan

### Domain Documentation in Specs

Domain documentation is specified **in SPEC.md during planning**, not discovered during implementation.

The SPEC.md file includes a `## Domain Updates` section that explicitly lists:
- **Glossary Terms** - exact terms to add/modify in `specs/domain/glossary.md`
- **Definition Specs** - domain definition files to create/update in `specs/domain/definitions/`
- **Architecture Docs** - updates needed in `specs/architecture/`

### Testing Strategy in Specs

The SPEC.md file includes a `## Testing Strategy` section that defines:
- **Unit Tests** - what behaviors need unit tests (implemented via TDD during execution)
- **Integration Tests** - what integrations need testing
- **E2E Tests** - what user flows need end-to-end tests

This approach ensures:
1. All requirements (domain, tests, verification) are fully understood before implementation
2. Implementation simply executes the specified updates (no discovery)
3. Clear traceability from spec to implementation

## Dynamic Phase Generation

Plans are generated dynamically based on the project's `sdd-settings.yaml` configuration.

### Generation Algorithm

1. **Read project components** from `sdd-settings.yaml`
2. **Identify affected components** for this change (from SPEC.md)
3. **Order by dependency graph:**
   ```
   config ──────┐
                │
   contract ────┼──→ server (includes DB) ──→ helm
                │           │
                │           ↓
                └───────→ webapp
   ```
4. **Assign agents** based on component + change nature:

| Component | Primary Agent | Notes |
|-----------|---------------|-------|
| contract | api-designer | API design and OpenAPI updates |
| server | backend-dev | Backend implementation + DB (TDD) |
| webapp | frontend-dev | Frontend implementation (TDD) |
| helm | devops | Deployment and infrastructure |
| config | contextual | backend-dev, frontend-dev, or devops based on what config affects |

5. **Add final phases:**
   - `tester` for integration/E2E testing
   - `reviewer` (+ `db-advisor` if DB changes)

### Testing Strategy

| Test Type | When | Agent |
|-----------|------|-------|
| Unit tests | During implementation (TDD) | backend-dev, frontend-dev |
| Integration tests | After all implementation phases | tester |
| E2E tests | After all implementation phases | tester |

## Phase Structure

- Each phase is independently reviewable
- Domain updates execute first (from SPEC.md)
- Component phases follow dependency order
- Phases build on each other sequentially

## Implementation State Tracking

Plans include sections for tracking implementation progress:

### Expected Files
- **Files to Create** - new files this change will add
- **Files to Modify** - existing files this change will update

### Implementation State
- **Current Phase** - which phase is in progress
- **Status** - pending, in_progress, blocked, complete
- **Completed Phases** - checklist of completed phases
- **Actual Files Changed** - updated during implementation with real files
- **Blockers** - any issues blocking progress
- **Resource Usage** - tokens (input/output), turns, and duration per phase

This enables:
1. Session resumption from any point
2. Audit trail of what actually changed
3. Progress visibility for stakeholders
4. Resource usage analysis (cost and time estimation for similar changes)

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

## Epic Plans

For `type: epic` changes, use the `epic-planning` skill. Epics contain multiple feature-type changes in a `changes/` subdirectory, each with its own SPEC.md and PLAN.md.

---

## Template: Implementation Plan (Feature)

```markdown
---
title: Implementation Plan: [Change Name]
change: [change-name]
type: feature
spec: ./SPEC.md
issue: [PROJ-XXX]
created: YYYY-MM-DD
sdd_version: [X.Y.Z]
---

# Implementation Plan: [Change Name]

## Overview

**Spec:** [link to spec]
**Issue:** [link to issue]

## Affected Components

<!-- Generated from sdd-settings.yaml based on change scope -->
- contract
- server
- webapp

## Phases

<!-- Phases are generated dynamically based on affected components -->
<!-- Domain updates are executed from SPEC.md before code phases -->

### Phase 1: API Contract
**Agent:** `api-designer`
**Component:** contract

Tasks:
- [ ] Update OpenAPI spec with new endpoints/schemas
- [ ] Generate TypeScript types

Deliverables:
- Updated OpenAPI spec
- Generated TypeScript types

### Phase 2: Backend Implementation
**Agent:** `backend-dev`
**Component:** server

Tasks:
- [ ] Implement domain logic
- [ ] Add data access layer
- [ ] Wire up controllers
- [ ] Write unit tests (TDD)

Deliverables:
- Working API endpoints
- Unit tests passing

### Phase 3: Frontend Implementation
**Agent:** `frontend-dev`
**Component:** webapp

Tasks:
- [ ] Create components
- [ ] Add hooks
- [ ] Integrate with API
- [ ] Write unit tests (TDD)

Deliverables:
- Working UI
- Unit tests passing

### Phase 4: Integration & E2E Testing
**Agent:** `tester`

Tasks:
- [ ] Integration tests for API layer
- [ ] E2E tests for user flows

Deliverables:
- Test suites passing

### Phase 5: Review
**Agent:** `reviewer`, `db-advisor` (if DB changes)

Tasks:
- [ ] Spec compliance review
- [ ] Database review (if applicable)

## Dependencies

- [External dependencies or blockers]

## Risks

| Risk | Mitigation |
|------|------------|
| [Risk] | [How to mitigate] |
```

---

## Template: Implementation Plan (Bugfix)

```markdown
---
title: Implementation Plan: [Change Name]
change: [change-name]
type: bugfix
spec: ./SPEC.md
issue: [BUG-XXX]
created: YYYY-MM-DD
sdd_version: [X.Y.Z]
---

# Implementation Plan: [Change Name]

## Overview

**Spec:** [link to spec]
**Issue:** [link to issue]

## Affected Components

<!-- List components where the bug manifests -->
- [component]

## Phases

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

## Notes

- Prioritize minimal, focused changes
- Update this plan as investigation reveals more details
```

---

## Template: Implementation Plan (Refactor)

```markdown
---
title: Implementation Plan: [Change Name]
change: [change-name]
type: refactor
spec: ./SPEC.md
issue: [TECH-XXX]
created: YYYY-MM-DD
sdd_version: [X.Y.Z]
---

# Implementation Plan: [Change Name]

## Overview

**Spec:** [link to spec]
**Issue:** [link to issue]

## Affected Components

<!-- List components being refactored -->
- [component]

## Phases

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

## Notes

- All tests must pass before and after refactoring
- No functional changes should be introduced
- Update this plan as implementation progresses
```
