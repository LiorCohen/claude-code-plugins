---
name: sdd-implement-change
description: Implement a change by executing its implementation plan.
---

# /sdd-implement-change

Implement a change by executing its implementation plan.

## Usage

```
/sdd-implement-change [path-to-change-dir]
```

Example:
```
/sdd-implement-change changes/2026/01/11/user-auth
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

**DO NOT proceed to Step 2 until you fully understand the complete scope.**

### 2. Execute Domain Updates from SPEC.md (REQUIRED BEFORE CODE)

**CRITICAL**: Execute the domain documentation changes specified in the SPEC.md `## Domain Updates` section. These are explicitly defined during planning - no discovery needed.

1. **Glossary Terms** (from `### Glossary Terms` table):
   - For each row with `Action: add`: Add the term and definition to `specs/domain/glossary.md`
   - For each row with `Action: update`: Update the existing term in `specs/domain/glossary.md`
   - If table shows "(none)": Note "No glossary updates needed" and proceed

2. **Definition Specs** (from `### Definition Specs` table):
   - For each row with `Action: create`: Create the definition spec file in `specs/domain/definitions/`
   - For each row with `Action: update`: Update the existing definition spec
   - If table shows "(none)": Note "No definition updates needed" and proceed

3. **Architecture Docs** (from `### Architecture Docs` checklist):
   - Execute each checked item in the list
   - If no items listed: Note "No architecture updates needed" and proceed

**Verification checklist:**
- [ ] All glossary terms from SPEC.md added/updated
- [ ] All definition specs from SPEC.md created/updated
- [ ] All architecture updates from SPEC.md applied
- [ ] Confirmed all domain changes executed exactly as specified

**DO NOT proceed to implementation phases until domain updates are complete.**

### 3. Execute Implementation Phases

Execute each phase from PLAN.md in order. The plan specifies which agent to invoke for each phase.

#### For Each Phase:

1. **Read the phase details** from PLAN.md
2. **Invoke the specified agent** with:
   - Full SPEC.md for context
   - The specific phase from PLAN.md
   - Component directory from `sdd-settings.yaml`
3. **Verify deliverables** match what the phase specifies
4. **Mark phase complete** before moving to next

#### Common Phase Types:

**API Contract Phase:**
- Agent: `api-designer`
- Tasks: Update OpenAPI spec, generate types
- Deliverables: Updated OpenAPI spec, TypeScript types

**Backend Implementation Phase:**
- Agent: `backend-dev`
- Tasks: Implement domain logic, add DAL methods, wire up controllers
- Deliverables: Working API endpoints, unit tests passing (TDD)

**Frontend Implementation Phase:**
- Agent: `frontend-dev`
- Tasks: Create components, add hooks, integrate with API
- Deliverables: Working UI, unit tests passing (TDD)

**Infrastructure Phase (if needed):**
- Agent: `devops`
- Tasks: Update Helm charts, add environment variables
- Deliverables: Updated deployment configuration

**Integration & E2E Testing Phase:**
- Agent: `tester`
- Tasks: Create integration tests, create E2E tests
- Deliverables: Test suites passing
- **RUN all tests and ensure 100% pass**
- Do NOT proceed to Review phase until all tests pass

**Review Phase:**
- Agent: `reviewer` (+ `db-advisor` if database changes)
- Tasks: Spec compliance check, code review
- Deliverables: Review findings addressed

### 3b. Epic Implementation (type: epic)

If the change directory contains a `changes/` subdirectory, this is an epic:

1. **Read epic PLAN.md** to determine change order and dependencies
2. **For each child change** (in dependency order from the epic plan):
   a. Create branch: `epic/<epic-name>/<change-name>`
   b. Execute domain updates from child SPEC.md
   c. Implement the child change following its own PLAN.md
   d. Ensure all tests pass
   e. Create PR for the child change
   f. After merge, update the epic PLAN.md progress tracking
3. **After all child changes are complete**, verify epic-level acceptance criteria

### 4. Track Progress and State

**After each phase completion, update PLAN.md:**

1. **Update Implementation State section:**
   - Set `Current Phase` to the next phase
   - Mark previous phase as complete in `Completed Phases` table
   - Update `Last Updated` timestamp

2. **Update Actual Files Changed section:**
   - Add each file that was created or modified
   - Note which phase made the change

3. **Record any blockers:**
   - Add to `Blockers` section if implementation is blocked
   - Include details and potential solutions

This enables session resumption:
- A new session can read PLAN.md to see current state
- Pick up implementation from the last completed phase
- Know exactly what files have been changed

### 5. Final Verification (MANDATORY - DO NOT SKIP)

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

## Important Notes

- **Domain updates from SPEC.md**: Execute exactly what is specified in SPEC.md `## Domain Updates` section. No discovery needed.
- **Testing strategy**: Unit tests are written during implementation phases (TDD). Integration/E2E tests are a separate phase.
- **Agent invocation**: The PLAN.md specifies which agent to invoke for each phase - follow it exactly.
- **Component directories**: Check `sdd-settings.yaml` for actual component paths.
- **NEVER read archive/**: The `archive/` directory contains archived external specs for audit purposes only. Implementation must use only the generated SPEC.md files in the change directory.

## Example

```
User: /sdd-implement-change changes/2026/01/11/user-auth

Agent: Step 1: Loading spec and plan...
Agent: ✓ Read PLAN.md
Agent: ✓ Read SPEC.md
Agent: [Displays comprehensive summary of work]

Agent: Step 2: Executing Domain Updates from SPEC.md...
Agent: Reading SPEC.md "## Domain Updates" section...
Agent:
Agent: Glossary Terms (from spec):
Agent: - Adding "User" (add)
Agent: - Adding "Session" (add)
Agent: - Adding "AuthToken" (add)
Agent: ✓ Glossary updated per SPEC.md
Agent:
Agent: Definition Specs (from spec):
Agent: - Creating specs/domain/definitions/user.md (create)
Agent: - Creating specs/domain/definitions/session.md (create)
Agent: ✓ Definition specs created per SPEC.md
Agent:
Agent: Architecture Docs (from spec):
Agent: - Updating specs/architecture/overview.md with auth service
Agent: ✓ Architecture docs updated per SPEC.md
Agent:
Agent: Domain updates verification:
Agent: ✓ All glossary terms from SPEC.md added
Agent: ✓ All definition specs from SPEC.md created
Agent: ✓ All architecture updates from SPEC.md applied
Agent: ✓ Domain updates complete
Agent:
Agent: Step 3: Beginning implementation phases...
Agent:
Agent: Phase 1: API Contract
Agent: Agent: api-designer
Agent: Component: contract
Agent: [Invokes api-designer agent...]
Agent: ✓ Phase 1 complete
Agent:
Agent: Phase 2: Backend Implementation
Agent: Agent: backend-dev
Agent: Component: server
Agent: [Invokes backend-dev agent with TDD...]
Agent: ✓ Phase 2 complete - unit tests passing
Agent:
Agent: Phase 3: Frontend Implementation
Agent: Agent: frontend-dev
Agent: Component: webapp
Agent: [Invokes frontend-dev agent with TDD...]
Agent: ✓ Phase 3 complete - unit tests passing
Agent:
Agent: Phase 4: Integration & E2E Testing
Agent: Agent: tester
Agent: [Invokes tester agent...]
Agent: Running all tests...
Agent: ✓ All tests pass (unit: 45, integration: 12, e2e: 8)
Agent: ✓ Phase 4 complete
Agent:
Agent: Phase 5: Review
Agent: Agent: reviewer
Agent: [Invokes reviewer agent...]
Agent: ✓ Phase 5 complete

Agent: Step 5: Final Verification...
[Verification continues...]

Agent: ✓ Implementation complete
```
