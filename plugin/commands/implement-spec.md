---
name: implement-spec
description: Implement a specification by executing its plan.
---

# /project:implement-spec

Implement a specification.

## Usage

```
/project:implement-spec [path-to-spec]
```

## Flow

### 1. Load Spec and Plan

- Read the SPEC.md
- Find associated PLAN.md in `specs/plans/`
- Verify all prerequisites are met
- Display summary of work to be done

### 2. Execute Phases

For each phase in the plan:

#### Phase: API Contract
- Invoke `api-designer` agent
- Update OpenAPI spec
- Generate types
- Verify types generated successfully

#### Phase: Backend Implementation
- Invoke `backend-dev` agent
- Implement model use-cases
- Add DAL methods
- Wire up controller
- Add server routes

#### Phase: Frontend Implementation
- Invoke `frontend-dev` agent
- Create React components
- Add hooks for API calls
- Integrate with UI

#### Phase: Infrastructure (if needed)
- Invoke `devops` agent
- Update Helm charts
- Add environment variables
- Create Testkube test definitions

#### Phase: Testing
- Invoke `tester` agent
- Create integration tests
- Create E2E tests
- Verify all acceptance criteria covered

#### Phase: Review
- Invoke `reviewer` agent
- Check spec compliance
- Invoke `db-advisor` if database changes present
- Report findings

### 3. Track Progress

- Mark each phase as complete when done
- Report any blockers or issues
- Update PLAN.md with actual progress

### 4. Final Verification

- Run all tests
- Verify all acceptance criteria pass
- Generate implementation summary

## Example

```
User: /project:implement-spec specs/features/user-auth/SPEC.md