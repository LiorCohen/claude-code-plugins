---
name: implement-plan
description: Implement a feature by executing its implementation plan.
---

# /project:implement-plan

Implement a feature by executing its implementation plan.

## Usage

```
/project:implement-plan [path-to-plan]
```

Example:
```
/project:implement-plan specs/features/2026/01/11/user-auth/PLAN.md
```

## Flow

### 1. Load Spec and Plan (REQUIRED FIRST STEP)

**CRITICAL**: Before starting ANY implementation work, you MUST:

- Read the ENTIRE PLAN.md from start to finish
- Read the ENTIRE SPEC.md referenced in the plan (same directory: `./SPEC.md`)
- Understand ALL requirements and acceptance criteria
- Verify all prerequisites are met (dependencies, environment, etc.)
- Create a mental model of the complete implementation
- Display comprehensive summary of ALL work to be done
- Identify any missing information or ambiguities

**DO NOT proceed to Phase 2 until you fully understand the complete scope.**

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
- Create unit tests for all new code
- Create integration tests
- Create E2E tests
- Verify all acceptance criteria covered by tests
- **RUN all tests and ensure 100% pass**
- If tests fail, fix the implementation or tests until they pass
- Do NOT proceed to Review phase until all tests pass

#### Phase: Review
- Invoke `reviewer` agent
- Check spec compliance
- Invoke `db-advisor` if database changes present
- Report findings

### 3. Track Progress

- Mark each phase as complete when done
- Report any blockers or issues
- Update PLAN.md with actual progress

### 4. Final Verification (MANDATORY - DO NOT SKIP)

Before declaring implementation complete, you MUST:

1. **Full Spec Review**
   - Re-read the entire SPEC.md
   - Re-read the entire PLAN.md
   - Verify every requirement is addressed
   - Check all acceptance criteria are implemented

2. **Comprehensive Testing**
   - Run ALL unit tests (`npm test` or equivalent)
   - Run ALL integration tests (via Testkube or locally)
   - Run ALL E2E tests
   - Ensure 100% of tests pass
   - If ANY test fails, fix it before proceeding

3. **Functionality Verification**
   - Verify each acceptance criterion manually if needed
   - Confirm all API endpoints work as specified
   - Validate frontend components match requirements
   - Check database schema matches design
   - Test error handling paths

4. **Code Review**
   - Re-invoke `reviewer` agent for final check
   - If database changes: invoke `db-advisor` agent
   - Address ALL findings before completion
   - Ensure no spec violations

5. **Documentation Check**
   - Verify all code is properly documented
   - Ensure telemetry is properly configured
   - Check that all required log fields are present
   - Validate OpenTelemetry spans are correct

6. **Final Report**
   - Generate implementation summary
   - List all files created/modified
   - Confirm all acceptance criteria met
   - Note any deviations from plan (with justification)

**CRITICAL**: Do NOT declare implementation complete until ALL of the above steps are finished and ALL tests pass. If you encounter ANY issues, resolve them before finishing.

## Example

```
User: /project:implement-plan specs/features/2026/01/11/user-auth/PLAN.md