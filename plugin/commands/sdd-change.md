---
name: sdd-change
description: Unified command for the entire change lifecycle - create, review, approve, implement, and verify changes.
---

# /sdd-change

Unified command for the entire change lifecycle. Replaces the separate `sdd-new-change`, `sdd-implement-change`, and `sdd-verify-change` commands.

## Usage

```
/sdd-change <action> [args] [options]
```

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `new` | Create a new change (interactive or from external spec) | `/sdd-change new --type feature --name user-auth` |
| `new --spec` | Import from external specification | `/sdd-change new --spec /path/to/spec.md` |
| `status` | Show current workflow state and all change IDs | `/sdd-change status` |
| `continue` | Resume current workflow from persisted state | `/sdd-change continue` |
| `list` | List all changes in current workflow | `/sdd-change list` |
| `approve spec` | Approve SPEC.md, trigger PLAN.md creation | `/sdd-change approve spec a1b2-1` |
| `approve plan` | Approve PLAN.md, enable implementation | `/sdd-change approve plan a1b2-1` |
| `implement` | Start implementation (requires plan_approved) | `/sdd-change implement a1b2-1` |
| `verify` | Verify implementation, mark complete | `/sdd-change verify a1b2-1` |

## Quick Reference

```bash
# Start a new feature
/sdd-change new --type feature --name user-auth

# Import from external spec
/sdd-change new --spec /path/to/requirements.md

# Check status
/sdd-change status

# Resume where you left off
/sdd-change continue

# List all changes in workflow
/sdd-change list

# Approve the spec for change a1b2-1
/sdd-change approve spec a1b2-1

# Approve the plan
/sdd-change approve plan a1b2-1

# Start implementation
/sdd-change implement a1b2-1

# Verify after implementation
/sdd-change verify a1b2-1
```

---

## Action: new

Create a new change with spec and plan creation workflow.

### Usage

```
/sdd-change new --type <feature|bugfix|refactor|epic> --name <change-name>
/sdd-change new --spec <path-to-external-spec>
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--type` | Yes (without `--spec`) | Type of change: `feature`, `bugfix`, `refactor`, or `epic` |
| `--name` | Yes (without `--spec`) | Name for the change (lowercase, hyphens allowed) |
| `--spec` | Alternative mode | Path to an external specification file to import |

### Flow: Interactive Mode (`--type` + `--name`)

#### Step 1: Validate Arguments

1. Validate `--type` is one of: `feature`, `bugfix`, `refactor`, `epic`
2. Validate `--name` is valid directory name (lowercase, hyphens, no spaces)
3. If no arguments, display usage and exit

#### Step 2: Check Git Branch

1. Run `git branch --show-current`
2. If on `main`/`master`:
   - Suggest creating branch: `<type>/<change-name>`
   - Wait for user confirmation
   - Create branch if approved
3. Otherwise proceed on current branch

#### Step 3: Create Workflow

```yaml
INVOKE workflow-state.create_workflow with:
  source: interactive
```

Returns `workflow_id` for tracking.

#### Step 4: Discovery Skills (Mandatory)

```yaml
# Product discovery
INVOKE product-discovery skill with:
  change_name: <from arguments>
  change_type: <from arguments>
  mode: "change"

# Component recommendation
INVOKE component-recommendation skill with:
  discovery_results: <from above>
  existing_components: <from sdd-settings.yaml>

# Domain population
INVOKE domain-population skill with:
  target_dir: <current directory>
  discovery_results: <from above>
  change_name: <from arguments>
```

#### Step 5: On-Demand Component Scaffolding

For each recommended component:
1. Check if `components/{type}/` exists
2. If missing, trigger scaffolding

#### Step 6: Create Workflow Item

```yaml
INVOKE workflow-state.create_item with:
  workflow_id: <from step 3>
  id: <change-name>
  title: <formatted title>
  type: <change-type>
  depends_on: []
```

#### Step 7: Spec Solicitation

```yaml
INVOKE spec-solicitation skill with:
  change_id: <from step 6>
  workflow_id: <from step 3>
```

The skill guides user through requirements gathering and creates SPEC.md.

#### Step 8: Move to Review

When spec is complete:
```yaml
INVOKE workflow-state.ready_for_review with:
  change_id: <change_id>
```

This moves the item from drafts to changes/ and sets status to `spec_review`.

#### Step 9: Display Next Steps

```
===============================================================
 SPEC READY FOR REVIEW
===============================================================

Change: a1b2-1 (User Authentication)
Spec: changes/2026/02/05/a1b2c3/01-user-auth/SPEC.md

Please review the specification.

NEXT STEPS:
  1. Review the SPEC.md file
  2. When satisfied, run: /sdd-change approve spec a1b2-1
  3. If changes needed, edit SPEC.md and re-run /sdd-change continue
```

### Flow: External Spec Mode (`--spec`)

#### Step 1: Validate Spec Path

1. Check path exists
2. If file: use directly
3. If directory: find entry point (README.md, SPEC.md, index.md)

#### Step 2: Extract Outline

```yaml
INVOKE spec-decomposition skill with:
  mode: "outline"
  spec_content: <file content>
```

#### Step 3: Check Git Branch

Same as interactive flow - suggest branch if on main/master.

#### Step 4: Archive External Spec

Copy to `.sdd/archive/external-specs/` with format: `yyyymmdd-lowercased-filename.md`

```
Archived external spec to: .sdd/archive/external-specs/20260205-feature-spec.md
(This is read-only - for audit trail only)
```

#### Step 5: Product Discovery

```yaml
INVOKE product-discovery skill with:
  spec_outline: <from step 2>
  spec_path: <absolute path>
  mode: "external-spec"
```

#### Step 6: Create Workflow

```yaml
INVOKE workflow-state.create_workflow with:
  source: external
  external_source: .sdd/archive/external-specs/20260205-feature-spec.md
```

#### Step 7: Decomposition (with Thinking Step)

```yaml
INVOKE spec-decomposition skill with:
  mode: "hierarchical"
  spec_outline: <from step 2>
  spec_content: <full content>
  default_domain: <from sdd-settings.yaml or discovery>
```

The skill performs:
1. Domain Analysis (entities, relationships, glossary, bounded contexts)
2. Specs Directory Impact (before/after, new vs modified)
3. Dependency Graph
4. Gap Analysis
5. Component Mapping
6. API-First Ordering

#### Step 8: Present Decomposition

Display the hierarchical structure with epics and features:

```
I found the following structure in this spec:

EPICS (from H1 sections):
  01 User Management (lines 10-150)
     ├── 01 Registration (a1b2-1)
     ├── 02 Authentication (a1b2-2)
     └── 03 Password Reset (a1b2-3)

  02 Dashboard (lines 151-300) [depends on: User Management]
     ├── 01 Analytics (a1b2-4)
     └── 02 Settings (a1b2-5)

Total: 2 epics, 5 features
Implementation order: 01 → 02 (API-first within each epic)

Domain Model extracted:
  - Entities: User, Session, Token, Dashboard
  - Relationships: User has-many Sessions
  - Bounded contexts: Identity, Analytics

Options:
  [A] Accept this breakdown
  [S] Single change (don't split)
  [C] Cancel
```

#### Step 9: Create Workflow Items

For each accepted item:
```yaml
INVOKE workflow-state.create_item with:
  workflow_id: <workflow_id>
  id: <item-id>
  title: <item-title>
  type: <feature|epic>
  context_sections: <extracted sections>
  depends_on: <dependencies>
```

#### Step 10: Begin Solicitation for First Item

```yaml
INVOKE spec-solicitation skill with:
  change_id: <first item's change_id>
  workflow_id: <workflow_id>
  context_path: <path to context.md>
```

**IMPORTANT**: Unlike the old flow, we do NOT create all SPEC.md files at once. Each spec is created interactively as the user works through items one at a time.

#### Step 11: Display Next Steps

```
===============================================================
 EXTERNAL SPEC IMPORTED
===============================================================

Archived to: .sdd/archive/external-specs/20260205-feature-spec.md

Created workflow: a1b2c3
Items: 5 features across 2 epics

Current: a1b2-1 (Registration)
Status: Spec solicitation in progress

IMPORTANT: Specs are created interactively, one at a time.
           Please answer the questions to complete each spec.

Use /sdd-change status to see all items and their progress.
```

---

## Action: status

Show current workflow state and all change IDs.

### Usage

```
/sdd-change status
```

### Flow

1. Read all workflows from `.sdd/workflows/`
2. For each workflow, display:
   - Workflow ID and source
   - Current item being worked on
   - All items with their statuses and change IDs

### Output

```
===============================================================
 WORKFLOW STATUS
===============================================================

Workflow: a1b2c3
Source: external (.sdd/archive/external-specs/20260205-feature-spec.md)
Created: 2026-02-05

Current: a1b2-1 (Registration) - spec_review

ITEMS:
  a1b2-1  Registration         spec_review    changes/2026/02/05/a1b2c3/01-registration/
  a1b2-2  Authentication       pending        .sdd/workflows/a1b2c3/drafts/...
  a1b2-3  Password Reset       pending        .sdd/workflows/a1b2c3/drafts/...
  a1b2-4  Analytics            pending        .sdd/workflows/a1b2c3/drafts/...
  a1b2-5  Settings             pending        .sdd/workflows/a1b2c3/drafts/...

NEXT ACTION:
  Review spec at: changes/2026/02/05/a1b2c3/01-registration/SPEC.md
  Then run: /sdd-change approve spec a1b2-1
```

---

## Action: continue

Resume current workflow from persisted state.

### Usage

```
/sdd-change continue
```

### Flow

1. Read workflow state from `.sdd/workflows/`
2. Find current item
3. Based on status, take appropriate action:

| Status | Action |
|--------|--------|
| `pending` | Start spec solicitation |
| `soliciting` | Resume spec solicitation from saved state |
| `spec_review` | Prompt to review spec, suggest approve command |
| `plan_review` | Prompt to review plan, suggest approve command |
| `plan_approved` | Prompt to start implementation |
| `implementing` | Resume implementation from saved state |
| `verifying` | Continue verification |

### Output (example: soliciting)

```
Resuming workflow a1b2c3...

Current: a1b2-1 (Registration)
Status: soliciting (spec creation in progress)

Previously collected:
  - Problem: User registration flow
  - Primary user: New users
  - Requirements: 3 collected

Continuing from: Step 5 - Acceptance Criteria

For the requirement "Users can register with email":
What acceptance criteria should we have?
```

---

## Action: list

List all changes in current workflow.

### Usage

```
/sdd-change list
```

### Flow

1. Read workflow state
2. Display all items with details

### Output

```
===============================================================
 CHANGES IN WORKFLOW a1b2c3
===============================================================

ID        TITLE                 TYPE      STATUS         LOCATION
───────── ───────────────────── ───────── ────────────── ─────────────────────────
a1b2-1    Registration          feature   spec_review    changes/2026/02/05/...
a1b2-2    Authentication        feature   pending        .sdd/workflows/...
a1b2-3    Password Reset        feature   pending        .sdd/workflows/...

Dependencies:
  a1b2-2 depends on: a1b2-1
  a1b2-3 depends on: a1b2-2
```

---

## Action: approve spec

Approve SPEC.md and trigger PLAN.md creation.

### Usage

```
/sdd-change approve spec <change-id>
```

### Flow

1. Validate change-id exists
2. Check status is `spec_review`
3. Read SPEC.md
4. Invoke planning skill to create PLAN.md:
   ```yaml
   INVOKE planning skill with:
     spec_path: <path to SPEC.md>
     change_id: <change_id>
   ```
5. Save PLAN.md via workflow-state
6. Update status to `plan_review`

### Output

```
Approving spec for: a1b2-1 (Registration)

Reading SPEC.md...
Generating PLAN.md...

PLAN.md created at: changes/2026/02/05/a1b2c3/01-registration/PLAN.md

Status: plan_review

NEXT STEPS:
  1. Review the PLAN.md file
  2. When satisfied, run: /sdd-change approve plan a1b2-1
```

---

## Action: approve plan

Approve PLAN.md and enable implementation.

### Usage

```
/sdd-change approve plan <change-id>
```

### Flow

1. Validate change-id exists
2. Check status is `plan_review`
3. Update status to `plan_approved`
4. Advance workflow to next item (if any)

### Output

```
Approving plan for: a1b2-1 (Registration)

Status: plan_approved

NEXT STEPS:
  Option 1: Start implementation
    /sdd-change implement a1b2-1

  Option 2: Continue with next change
    Next: a1b2-2 (Authentication)
    Run: /sdd-change continue
```

---

## Action: implement

Start implementation of an approved change.

### Usage

```
/sdd-change implement <change-id>
```

### Flow

#### Step 1: Validate Status

1. Check status is `plan_approved`
2. If not, display error with current status

#### Step 2: Load Spec and Plan (REQUIRED)

**CRITICAL**: Before ANY implementation:
- Read the ENTIRE PLAN.md
- Read the ENTIRE SPEC.md
- Understand ALL requirements
- Display comprehensive summary

#### Step 3: Execute Domain Updates

From SPEC.md `## Domain Updates` section:
1. Add/update glossary terms
2. Create/update definition specs
3. Apply architecture updates

#### Step 4: Execute Implementation Phases

For each phase in PLAN.md:
1. Read phase details
2. Invoke specified agent
3. Verify deliverables
4. Update PLAN.md state
5. Create checkpoint commit

#### Step 5: Track Progress

Update PLAN.md after each phase:
- Current Phase
- Completed Phases
- Actual Files Changed
- Blockers (if any)

This enables session resumption.

#### Step 6: Update Status

When all phases complete:
```yaml
INVOKE workflow-state.update_status with:
  change_id: <change_id>
  status: verifying
```

### Output

```
Implementing: a1b2-1 (Registration)

Step 1: Loading spec and plan...
  Read PLAN.md
  Read SPEC.md
  [Displays comprehensive summary]

Step 2: Executing Domain Updates...
  Adding glossary term: User
  Creating definition: specs/domain/definitions/user.md
  Domain updates complete

Step 3: Beginning implementation phases...

Phase 1: API Contract
  Agent: api-designer
  [Implementation progress...]
  Phase 1 complete

[... continues through all phases ...]

Implementation complete. Ready for verification.
Run: /sdd-change verify a1b2-1
```

---

## Action: verify

Verify implementation matches specification.

### Usage

```
/sdd-change verify <change-id>
```

### Flow

#### Step 1: Load Spec

1. Read SPEC.md
2. Extract all acceptance criteria
3. List API endpoints
4. Note edge cases and security requirements

#### Step 2: Validate Specs Traceability

**CRITICAL**: Check that specs/ changes match SPEC.md declaration.

1. Read "Specs Directory Changes" section from SPEC.md
2. Get list of declared changes (Path, Action)
3. Compare against actual git diff for specs/
4. Fail if:
   - Any declared change wasn't made
   - Any undeclared specs/ file was changed

```
Validating specs traceability...
  Declared: specs/domain/user.md (modify) - FOUND
  Declared: specs/domain/session.md (create) - FOUND
  Undeclared changes: NONE
  Specs traceability verified
```

#### Step 3: Map to Tests

1. Find test files referencing this change
2. Check coverage of each acceptance criterion
3. Identify gaps

#### Step 4: Run Tests

```bash
# Unit tests
npm test --workspaces

# Integration tests
testkube run testsuite integration-tests --watch

# E2E tests
testkube run testsuite e2e-tests --watch
```

#### Step 5: Verify Implementation

- Check OpenAPI spec matches requirements
- Verify backend endpoints exist
- Verify frontend components exist
- Check database schema matches

#### Step 6: Generate Report

```markdown
## Verification Report: Registration

**Change ID:** a1b2-1
**Spec:** changes/2026/02/05/a1b2c3/01-registration/SPEC.md
**Date:** 2026-02-05

### Specs Traceability
- All declared specs/ changes verified
- No undeclared changes detected

### Acceptance Criteria Coverage
| AC | Description | Tests | Status |
|----|-------------|-------|--------|
| AC1 | Given valid email... | 2 tests | PASS |
| AC2 | Given duplicate email... | 1 test | PASS |

### Test Results
**Unit Tests:** 45/45 passing
**Integration Tests:** 12/12 passing
**E2E Tests:** 4/4 passing

### Verdict: PASS
```

#### Step 7: Mark Complete

If verification passes:
```yaml
INVOKE workflow-state.complete_item with:
  change_id: <change_id>
```

#### Step 8: Advance Workflow

Move to next item:
```yaml
INVOKE workflow-state.advance
```

### Output

```
Verifying: a1b2-1 (Registration)

Step 1: Loading spec...
Step 2: Validating specs traceability...
  All specs/ changes match declaration
Step 3: Mapping to tests...
Step 4: Running tests...
  Unit: 45/45 passed
  Integration: 12/12 passed
  E2E: 4/4 passed
Step 5: Verifying implementation...
  All checks passed

VERIFICATION PASSED

Change a1b2-1 marked complete.

NEXT:
  Next change: a1b2-2 (Authentication)
  Run: /sdd-change continue
```

---

## Important Notes

### Zero Session Context

All workflow state is persisted in `.sdd/workflows/`. A new session can resume at any point by reading the files - no conversation history needed.

### Two-Stage Approval

Implementation cannot begin until both SPEC.md and PLAN.md are explicitly approved:
1. Spec created → spec_review → user approves → plan created
2. Plan created → plan_review → user approves → implementation enabled

### Checkpoint Commits

All state changes create checkpoint commits on feature branches:
- Checkpoints use `--no-verify` to skip hooks
- Checkpoints can be squashed into final commit
- Enables recovery from any interruption

### Specs Traceability

Every change to `specs/` must be declared in the SPEC.md "Specs Directory Changes" section. Verification validates this.

### Change IDs

- Format: `<workflow-short>-<seq>` (e.g., `a1b2-1`)
- Unique across concurrent workflows
- Displayed in all status output
- Used for all commands that operate on a specific change

### Migration from Old Commands

| Old Command | New Command |
|-------------|-------------|
| `/sdd-new-change --type feature --name X` | `/sdd-change new --type feature --name X` |
| `/sdd-new-change --spec path` | `/sdd-change new --spec path` |
| `/sdd-implement-change path` | `/sdd-change implement <change-id>` |
| `/sdd-verify-change path` | `/sdd-change verify <change-id>` |
