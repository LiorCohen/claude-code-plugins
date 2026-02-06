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
