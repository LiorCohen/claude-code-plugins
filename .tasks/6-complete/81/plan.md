---
title: Redesign sdd-change with external spec workflow
created: 2026-02-05
---

# Plan: Redesign sdd-change with External Spec Workflow

## Problem Summary

The current `sdd-change --spec` workflow has fundamental issues:
1. Creates PLAN.md files immediately during import (should only create specs)
2. No staged review process - user can't iterate on specs before planning
3. Specs lack critical TDD content (tests, components, domain extraction)
4. Implementation order is session-only, not persisted

## Design Principles

1. **Unified Workflow**: Both external and interactive paths converge to the same spec-by-spec flow
2. **Zero Session Context**: ALL workflow state persisted in `.sdd/` files. A new session must be able to resume with ZERO knowledge of what happened before. No conversation history, no in-memory state, no assumptions. Read the files, know the state. This enables aggressive context compaction and allows users to clear sessions freely.
3. **One at a Time**: Process specs sequentially - complete one before starting next
4. **Two-Stage Approval**: User must approve both SPEC.md and PLAN.md before implementation
5. **TDD-Native**: Tests are first-class citizens in every spec
6. **API-First Order**: Backend → Frontend (not UI-first)
7. **Thinking Step**: System analysis goes beyond simple decomposition
8. **Specs Traceability**: Every change to `specs/` must be documented in a change SPEC.md. No modifications to `specs/` are allowed without explicit declaration in the "Specs Directory Changes" section of the originating change spec. This ensures full traceability from any spec file back to the change that created or modified it.

## New Workflow Overview

Both paths (external and interactive) converge to the same spec solicitation flow:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ EXTERNAL PATH                                                            │
│ External Spec → Archive → Decompose → Queue items with context           │
│                                       (identifies WHAT, not full specs)  │
└─────────────────────────────────────────────────────────────────────────┘
                                                          ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ INTERACTIVE PATH                                                         │
│ /sdd-change → Create task (no external context)               │
└─────────────────────────────────────────────────────────────────────────┘
                                                          ↓
                          ┌───────────────────────────────┘
                          ↓
               ┌──────────────────────────────────────────┐
               │  UNIFIED FLOW (one item at a time)       │
               │  Spec creation is ALWAYS interactive     │
               └──────────────────────────────────────────┘
                          ↓
         Spec Solicitation → SPEC.md Created → Move to changes/ → Spec Review → Spec Approved
              ↓                    ↓               ↓                ↓              ↓
      (guided questions)    (from answers)  (for review)      (iterate)    (user approves)
      (uses context.md                                                            ↓
       if from external)                                        ┌─────────────────┘
                                                                ↓
                                                         Plan Created → Plan Review → Plan Approved
                                                                ↓            ↓              ↓
                                                          (PLAN.md)    (iterate)    (user approves)
                                                                                           ↓
                                                                                      Implement
                                                                          ↓
                                                                      Verify
                                                                          ↓
                                                                    Mark Complete
                                                                          ↓
                                                                    Next item
                                                                  (back to task list)
```

**Key insight**: The decomposition still identifies the FULL structure upfront (epics, features, dependencies, order) - same as before. The difference is we don't CREATE all SPEC.md files at once. Instead, tasks are created with context, and each SPEC.md is created interactively as the user works through the task list one at a time.

## Files to Modify

**Notes**:
- All skills are internal implementation details. Users interact through commands, not skills directly.
- **CRITICAL**: All skills must maintain full, session-independent resumable state in `.sdd/`. If a session is interrupted at ANY point, a new session must be able to resume exactly where the previous left off.

### Commands

The `sdd-change` command becomes a unified interface for the entire change lifecycle, similar to `sdd-run`:

| File | Changes | State Persisted |
|------|---------|-----------------|
| `plugin/commands/sdd-change.md` | **MAJOR REWRITE** - Unified command with subcommands for entire change lifecycle | Via workflow-state |
| `plugin/commands/sdd-implement-change.md` | **DELETE** - Functionality moves to `sdd-change implement` | N/A |
| `plugin/commands/sdd-verify-change.md` | **DELETE** - Functionality moves to `sdd-change verify` | N/A |
| `plugin/commands/sdd-init.md` | Update references to sdd-new-change → sdd-change, remove Phase 2 (quick component selection) | N/A |
| `plugin/commands/sdd-run.md` | Update reference to sdd-implement-change → sdd-change implement (line 18) | N/A |
| `plugin/commands/sdd-settings.md` | Update reference to sdd-new-change → sdd-change (line 226) | N/A |

### Hooks

| File | Changes |
|------|---------|
| `plugin/hooks/PERMISSIONS.md` | Add `.sdd/` directory to auto-approved paths, update command references |

#### sdd-change Subcommands

```
/sdd-change <action> [args] [options]
```

| Action | Description | Example |
|--------|-------------|---------|
| `new` | Create a new change (interactive or from external spec) | `/sdd-change new --type feature --name user-auth` |
| `new --spec` | Import from external specification | `/sdd-change new --spec /path/to/spec.md` |
| `status` | Show current workflow state and all change IDs | `/sdd-change status` |
| `continue` | Resume current workflow from persisted state | `/sdd-change continue` |
| `approve spec` | Approve SPEC.md, trigger PLAN.md creation | `/sdd-change approve spec a1b2-1` |
| `approve plan` | Approve PLAN.md, enable implementation | `/sdd-change approve plan a1b2-1` |
| `implement` | Start implementation (requires plan_approved) | `/sdd-change implement a1b2-1` |
| `verify` | Verify implementation, mark complete | `/sdd-change verify a1b2-1` |
| `list` | List all changes in current workflow | `/sdd-change list` |

**Usage examples:**
```bash
# Start a new feature
/sdd-change new --type feature --name user-auth

# Import from external spec
/sdd-change new --spec /path/to/requirements.md

# Check status
/sdd-change status

# Resume where you left off
/sdd-change continue

# Approve the spec for change a1b2-1
/sdd-change approve spec a1b2-1

# Approve the plan
/sdd-change approve plan a1b2-1

# Start implementation
/sdd-change implement a1b2-1

# Verify after implementation
/sdd-change verify a1b2-1
```

### Skills

| File | Changes | State Persisted |
|------|---------|-----------------|
| `plugin/skills/external-spec-integration/SKILL.md` | Persist order in workflow.yaml, no plans, archive to `.sdd/archive/` | `workflow.yaml`, `context.md` files |
| `plugin/skills/change-creation/SKILL.md` | Add spec-only mode, Domain Model section, Specs Directory Changes section | `SPEC.md`, `PLAN.md` |
| `plugin/skills/spec-decomposition/SKILL.md` | Add thinking step, domain extraction, specs impact, API-first ordering | `workflow.yaml` (decomposition results) |
| `plugin/skills/spec-writing/SKILL.md` | Add Domain Model, Specs Directory Changes, Requirements Discovery sections | N/A (stateless) |
| `plugin/skills/spec-solicitation/SKILL.md` | **NEW** - Guided requirements gathering | `solicitation-workflow.yaml` (partial answers) |
| `plugin/skills/workflow-state/SKILL.md` | **NEW** - Workflow lifecycle state management | `workflow.yaml` |
| `plugin/skills/planning/SKILL.md` | Update plan generation to work with new workflow | N/A (uses workflow-state) |
| `plugin/skills/product-discovery/SKILL.md` | Enhance domain extraction for domain model | N/A (called during solicitation) |
| `plugin/skills/check-tools/SKILL.md` | Update tool requirements table (sdd-new-change → sdd-change, sdd-implement-change → sdd-change implement) | N/A (stateless) |
| `plugin/skills/epic-planning/SKILL.md` | Update to reference new workflow.yaml structure for epic handling | N/A (stateless) |
| `plugin/skills/spec-index/SKILL.md` | Clarify relationship: spec-index generates INDEX.md on demand, workflow-state updates it during workflow | N/A (stateless) |
| `plugin/skills/project-scaffolding/SKILL.md` | Update references to sdd-new-change → sdd-change (lines 14, 122, 151) | N/A (stateless) |
| `plugin/skills/commit-standards/SKILL.md` | Update reference to sdd-new-change → sdd-change (line 20) | N/A (stateless) |

### Documentation

| File | Changes |
|------|---------|
| `README.md` | Update command descriptions, rename sdd-new-change → sdd-change |
| `docs/workflows.md` | Document two-stage approval workflow, drafts vs changes lifecycle |
| `docs/commands.md` | Add new subcommands, remove sdd-implement-change/sdd-verify-change entries |
| `docs/getting-started.md` | Update tutorial for new workflow, rename commands |
| `docs/tutorial.md` | Update all command references (sdd-new-change → sdd-change, sdd-implement-change → sdd-change implement) |
| `docs/agents.md` | Update agent invocation docs (line 18 references sdd-implement-change) |

### Tests

| File | Changes |
|------|---------|
| `tests/src/tests/workflows/sdd-change-new.test.ts` | **RENAME** from sdd-new-change.test.ts - Test `sdd-change new` |
| `tests/src/tests/workflows/sdd-change-new-external.test.ts` | **RENAME** from sdd-new-change-external-spec.test.ts - Test `sdd-change new --spec` |
| `tests/src/tests/workflows/sdd-change-approve.test.ts` | **NEW** - Test `sdd-change approve spec/plan` subcommands |
| `tests/src/tests/workflows/sdd-change-implement.test.ts` | **NEW** - Test `sdd-change implement` subcommand |
| `tests/src/tests/workflows/sdd-change-verify.test.ts` | **NEW** - Test `sdd-change verify` subcommand |
| `tests/src/tests/workflows/sdd-change-status.test.ts` | **NEW** - Test `sdd-change status` subcommand |
| `tests/src/tests/unit/skills/workflow-state.test.ts` | **NEW** - Unit tests for workflow-state skill |
| `tests/src/tests/unit/skills/spec-solicitation.test.ts` | **NEW** - Unit tests for spec-solicitation skill |
| `tests/src/tests/workflows/sdd-change-continue.test.ts` | **NEW** - Test `sdd-change continue` subcommand |
| `tests/src/tests/workflows/sdd-change-list.test.ts` | **NEW** - Test `sdd-change list` subcommand |
| `tests/src/tests/workflows/sdd-init.test.ts` | Update references to sdd-new-change → sdd-change, remove component selection tests |

### Test Data

| File | Changes |
|------|---------|
| `tests/data/sdd-new-change.yaml` | **RENAME** to `sdd-change-new.yaml` |
| `tests/data/sdd-new-change-external.yaml` | **RENAME** to `sdd-change-new-external.yaml` |
| `tests/data/sdd-verify-change.yaml` | **DELETE** or integrate into sdd-change-verify tests |
| `tests/data/sdd-implement-plan.yaml` | Review and update for new workflow |

### Template Files (copied to new projects)

| File | Changes |
|------|---------|
| `plugin/skills/project-scaffolding/templates/project/CLAUDE.md` | Update command references (sdd-new-change → sdd-change) |
| `plugin/skills/project-scaffolding/templates/project/README.md` | Update command references and Quick Start section |

## Changes

### 1. Staging Directory Structure

Tasks are managed in `.sdd/workflows/<workflow-id>/`. The full hierarchical structure (epics, features, dependencies) is created during decomposition, but SPEC.md files are created interactively one-at-a-time:

```
.sdd/
├── sdd-settings.yaml
├── archive/
│   └── external-specs/         # External specs archived here (read-only)
│       └── 20260205-feature-spec.md  # yyyymmdd-lowercased-filename.md
└── workflows/                  # Multiple concurrent workflows supported
    ├── a1b2c3/              # One workflow (user A, branch feature-x)
    │   ├── workflow.yaml       # This workflow's state
    │   └── drafts/
    │       ├── 01-user-management/
    │       │   ├── context.md
    │       │   ├── 01-api-contracts/
    │       │   │   └── context.md
    │       │   └── 02-backend-service/
    │       │       └── context.md
    │       └── 02-notifications/
    │           └── context.md
    └── x7y8z9/              # Another workflow (user B, branch feature-y)
        ├── workflow.yaml
        └── drafts/...
```

When SPEC.md is complete (ready for review), the item moves to `changes/` for review:

```
changes/YYYY/MM/DD/<workflow-id>/01-api-contracts/
├── SPEC.md
└── PLAN.md
```

**Workflow ID:**
- Each workflow gets a unique short ID (e.g., `a1b2c3`) generated at creation time
- Stored in `workflow.yaml` as the `id` field
- Groups all completed items from the same workflow together
- Provides traceability: can trace any change back to its source workflow

**Change ID:**
- Format: `<workflow-short>-<seq>` (e.g., `a1b2-1`, `a1b2-2`)
- Derived from workflow ID + sequence within workflow
- Unique across concurrent workflows/branches (different workflows = different prefix)
- User-friendly reference for commands: `/sdd-change approve spec a1b2-1`
- Displayed in all status output so users always know which ID to use

**Sequence numbering within a workflow:**
- Folders are prefixed with `NN-` (01-, 02-, etc.) based on completion order within that workflow
- Maintains order when viewing the directory
- Reduces branch conflicts (different workflows get different IDs, different users likely complete at different times)

**Draft item contents** (in `.sdd/workflows/<wf-id>/drafts/`):
- `context.md` - Extracted content from external spec. Read-only reference during solicitation.
- `solicitation-workflow.yaml` - Partial answers during interactive solicitation

**Lifecycle:**
1. Item starts in `drafts/` with just `context.md`
2. Solicitation builds SPEC.md (saved to `drafts/` during work-in-progress)
3. When SPEC.md is complete → item moves to `changes/` for review
4. All further review/approval happens in `changes/`
5. PLAN.md is created in `changes/` after spec approval

**Important**: `drafts/` is for work-in-progress only. Users review and approve items in `changes/`, not in `drafts/`.

**workflow.yaml** schema (self-sufficient for resume - zero session context needed):
```yaml
id: a1b2c3  # Short unique workflow ID (used in changes/ path)
source: external | interactive
external_source: .sdd/archive/external-specs/20260205-feature-spec.md  # yyyymmdd-lowercased-filename.md
created: YYYY-MM-DD
current: 01-user-management/01-api-contracts  # Path to current item
items:
  # Hierarchical structure preserved (epics with children)
  - id: 01-user-management
    title: User Management
    type: epic
    status: pending
    context_sections: ["# User Management"]
    children:
      - id: 01-api-contracts
        change_id: a1b2-1  # Unique ID for user reference (e.g., /sdd-change approve spec a1b2-1)
        title: API Contracts
        type: feature
        status: spec_review
        location: changes/2026/02/05/a1b2c3/01-api-contracts  # Where item currently lives
        context_sections: ["## API Design", "## Endpoints"]
        depends_on: []
      - id: 02-backend-service
        change_id: a1b2-2  # Each item gets its own unique ID
        title: Backend Service
        type: feature
        status: pending
        location: .sdd/workflows/a1b2c3/drafts/01-user-management/02-backend-service  # Still in drafts
        context_sections: ["## Backend Logic", "## Data Model"]
        depends_on: [01-api-contracts]
  - id: 02-notifications
    title: Notifications
    type: epic
    status: pending
    depends_on: [01-user-management]
    children: [...]
```

**Note**: The full hierarchical structure (epics, features, dependencies, order) is determined during decomposition - same breakdown as before. The difference is SPEC.md files are created one-at-a-time through solicitation, not all upfront.

**Status progression:**
1. `pending` - Not yet started
2. `soliciting` - User is going through spec solicitation
3. `spec_review` - SPEC.md created, moved to changes/, user reviewing
4. `plan_review` - User approved SPEC.md, PLAN.md created, user reviewing
5. `plan_approved` - User approved PLAN.md, ready for implementation
6. `implementing` - Implementation in progress
7. `verifying` - Implementation complete, running verification (tests, review)
8. `complete` - Verification passed, ready for next item

**Note**: There is no `spec_approved` resting state. When user runs `/sdd-change approve spec`, the PLAN.md is immediately created and status transitions directly to `plan_review`.

**Single spec case**: Even a single interactive change creates a task in `.sdd/workflows/<workflow-id>/`.

**Epic handling**:
- Each epic is an item with `type: epic` and `children` array
- Children are features within the epic
- Epic status tracks overall progress (pending until first child starts, complete when all children complete)
- Epic itself doesn't get a change_id - only leaf features get change_ids
- Epic folder in `changes/` contains child change folders (existing structure preserved)

**Cleanup behavior**:
- When item moves from `drafts/` to `changes/`: keep `context.md` in drafts for reference, delete `solicitation-workflow.yaml`
- When item is marked `complete`: remove from `workflow.yaml` items array
- When all items complete: delete entire `.sdd/workflows/<workflow-id>/` directory including `workflow.yaml`
- Completed items remain in `changes/` permanently (that's the source of truth)

**INDEX.md handling**:
- `changes/INDEX.md` is updated when items move to `changes/` directory (existing behavior)
- No separate INDEX.md in `.sdd/workflows/` - workflow.yaml is the source of truth for workflow state
- `workflow_state.ready_for_review()` updates `changes/INDEX.md` with new entry

### 2. External Spec Integration Changes

Remove redundant copying - archive happens exactly once. Spec creation is always interactive.

**Current flow:**
1. Archive external spec (skill does this)
2. Decompose and create specs + PLAN.md in `changes/`

**New flow:**
1. Archive external spec to `.sdd/archive/` (single copy)
2. Decompose with "thinking" analysis - identifies changes, not creates full specs
3. Create tasks in `.sdd/workflows/<workflow-id>/` (metadata only, no SPEC.md yet)
4. Create workflow.yaml with persisted order
5. For each task (one at a time):
   a. Run spec solicitation using external spec section as context
   b. User interactively refines requirements
   c. Generate SPEC.md → user reviews → approves
   d. Generate PLAN.md → user reviews → approves
   e. Move to `changes/`
6. Proceed to next task

**Key insight**: The decomposition still produces the full breakdown (epics, features, dependencies, order) - same as before. The difference is:
- **Before**: All SPEC.md + PLAN.md files created upfront
- **Now**: Queue items with context created upfront, SPEC.md created interactively one-at-a-time

External spec content serves as context/input to solicitation, not as the spec itself.

### 3. Spec Decomposition Thinking Step

Add analysis phase that goes beyond just breaking down the external spec:

1. **Domain Analysis** (major focus):
   - Extract all domain entities (nouns that represent concepts)
   - Identify relationships between entities (has-a, is-a, depends-on)
   - Build glossary of terms with precise definitions
   - Map entities to existing specs or flag as new
   - Identify bounded contexts and aggregates

2. **Specs Directory Impact**:
   - Map each entity to a spec file path
   - Identify which existing specs will be modified
   - List new specs that will be created
   - Show the before/after structure of `/specs`

3. **Dependency Graph**: Build true dependencies (not just section order)
4. **Gap Analysis**: What's missing from the spec? What assumptions needed?
5. **Component Mapping**: Which existing components are affected?
6. **API-First Ordering**: Topological sort starting from contracts/API

Output includes:
- `domain_model`: Full entity-relationship diagram in text form
- `specs_impact`: Explicit list of spec files created/modified
- `thinking_summary`: What the system inferred beyond the spec
- `gaps_identified`: Questions/assumptions that need validation
- `recommended_order`: API-first dependency-sorted list

### 4. Spec Template Changes

Add required sections to spec template:

```markdown
## Tests

### Unit Tests
- [ ] `test_description` - What behavior it verifies

### Integration Tests
- [ ] `test_description` - What integration it verifies

### E2E Tests (if applicable)
- [ ] `test_description` - What user flow it verifies

## Domain Model

### Entities
| Entity | Definition | Spec Path | Status |
|--------|------------|-----------|--------|
| User | A person who authenticates with the system | specs/domain/user.md | Existing (modify) |
| Session | An authenticated period of user activity | specs/domain/session.md | New |
| AuthToken | JWT token issued on successful login | specs/domain/auth-token.md | New |

### Relationships
```
User ─────────────┐
  │               │
  │ has-many      │ owns
  ▼               ▼
Session ◄──── AuthToken
        issued-for
```

### Glossary
| Term | Definition | First Defined In |
|------|------------|------------------|
| Authentication | Process of verifying user identity | This spec |
| Session | Active authenticated state for a user | This spec |
| Token refresh | Process of extending token validity | specs/domain/auth-token.md |

### Bounded Contexts
- **Identity Context**: User, Session, AuthToken (this change)
- **Notification Context**: Depends on Identity for user lookup

## Specs Directory Changes

**REQUIRED**: This section is mandatory for traceability. Every change to `specs/` must be declared here. Implementation will validate that actual specs/ changes match this declaration.

### Before
```
specs/
├── domain/
│   └── user.md
└── api/
    └── users.md
```

### After
```
specs/
├── domain/
│   ├── user.md          # MODIFIED - add session relationship
│   ├── session.md       # NEW
│   └── auth-token.md    # NEW
└── api/
    ├── users.md
    └── auth.md          # NEW - authentication endpoints
```

### Changes Summary
| Path | Action | Description |
|------|--------|-------------|
| specs/domain/user.md | Modify | Add `sessions` relationship, `lastLogin` field |
| specs/domain/session.md | Create | New entity for user sessions |
| specs/domain/auth-token.md | Create | New entity for JWT tokens |
| specs/api/auth.md | Create | Login, logout, refresh endpoints |

**Validation**: During `/sdd-change verify`, the system checks that:
1. All files listed here were actually created/modified
2. No specs/ files were changed that aren't listed here

## Components

### New Components
| Component | Type | Purpose |
|-----------|------|---------|

### Modified Components
| Component | Changes |
|-----------|---------|

## System Analysis

### Inferred Requirements
- What the system determined beyond explicit spec

### Gaps & Assumptions
- What's missing or assumed

### Dependencies
- Other specs/changes this depends on
- Cross-references to related specs in the domain model

## Requirements Discovery

### Questions & Answers
| Step | Question | Answer |
|------|----------|--------|
| Context | What problem does this solve? | User response... |
| Context | Who is the primary user? | User response... |
| Functional | What should the system do? | User response... |
| ... | ... | ... |

### User Feedback
- Any clarifications, corrections, or additional context provided during review
- Captured iteratively as user refines the spec
```

### 5. Two-Stage Review Workflow

After import, guide user through spec review, then plan review:

**Stage 1: Spec Review**
```
/sdd-change new --spec path/to/spec.md
  → Creates specs in changes/, shows first spec for review
  → "Change a1b2-1 (API Contracts) is ready for review"
  → "Please review changes/.../01-api-contracts/SPEC.md"
  → "When satisfied, run /sdd-change approve spec a1b2-1"

/sdd-change approve spec <change-id>
  → e.g., /sdd-change approve spec a1b2-1
  → Creates PLAN.md for this change
  → Updates status to plan_review
  → Shows PLAN.md for review
```

**Stage 2: Plan Review**
```
/sdd-change approve plan <change-id>
  → e.g., /sdd-change approve plan a1b2-1
  → Marks PLAN.md as approved (status: plan_approved)
  → Moves to next change in order (back to Stage 1)
  → When all approved: "All changes ready for implementation"

/sdd-change implement <change-id>
  → e.g., /sdd-change implement a1b2-1
  → Only works if status is plan_approved
  → Begins implementation following the approved plan

/sdd-change verify <change-id>
  → e.g., /sdd-change verify a1b2-1
  → Runs after implementation is complete
  → Validates specs traceability:
    1. All specs/ files declared in "Changes Summary" were created/modified
    2. No undeclared specs/ files were changed
  → Runs tests
  → Marks item complete if all validations pass
```

**Resume workflow:**
```
/sdd-change status
  → Shows current workflow state, all change IDs and their statuses
  → "Current: a1b2-1 (API Contracts) - awaiting spec review"

/sdd-change continue
  → Reads workflow.yaml, resumes at current change/stage
```

**Key principle**: Implementation cannot begin until both SPEC.md and PLAN.md are explicitly approved by the user.

### 6. API-First Default Order

Change ordering logic in spec-decomposition:

**Current order** (component-based):
```
config → contract → server → webapp → helm
```

**New order** (API-first):
```
1. API Contracts / Interfaces
2. Data Models / Database
3. Backend Services / Business Logic
4. Frontend Components / UI
5. Infrastructure / DevOps
```

Reasoning: Start from the interface definition, work inward to implementation.

### 7. Change Creation Spec-Only Mode

Add mode parameter to `change-creation` skill:

**Mode: spec-only** (default for external spec imports)
- Creates SPEC.md only
- No PLAN.md created
- Creates workflow.yaml for multi-change imports

**Mode: full** (for interactive changes or when planning)
- Creates SPEC.md + PLAN.md
- Current behavior preserved

### 8. Spec Solicitation Skill (NEW)

New skill that guides user through structured requirements gathering. Used for ALL spec creation - both interactive and external spec paths.

**Invocation:**
```
# Interactive path (no external context)
/sdd-change new --type feature --name user-auth
  → Creates task, invokes spec-solicitation

# External path (has context from decomposition)
/sdd-change continue
  → Picks next task, invokes spec-solicitation with context.md
```

**Context-Aware Solicitation:**

When processing a task from external spec decomposition:
1. Load `context.md` (extracted section from external spec)
2. Pre-populate answers where possible from context
3. Ask clarifying questions for gaps
4. User confirms/refines pre-populated content

When processing a purely interactive change:
1. No context available
2. Full solicitation flow from scratch

**Solicitation Flow:**

1. **Context & Goal**
   - "What problem does this solve?"
   - "Who is the primary user?"
   - "What's the expected outcome?"
   - *(If context exists: "Based on the external spec, this appears to be about X. Is that correct?")*

2. **Functional Requirements**
   - "What should the system do?" (iterative, can add multiple)
   - "What are the main user actions?"
   - "What data is involved?"
   - *(If context exists: "I extracted these requirements from the spec: [list]. Anything to add/modify?")*

3. **Non-Functional Requirements**
   - Performance: "Any latency/throughput requirements?"
   - Security: "Authentication? Authorization? Data sensitivity?"
   - Scalability: "Expected load? Growth expectations?"
   - Reliability: "Uptime requirements? Failure handling?"

4. **User Stories**
   - Guide through "As a [role], I want [action], so that [benefit]"
   - Prompt for multiple stories if complex feature

5. **Acceptance Criteria**
   - For each user story, prompt Given/When/Then
   - "How will we know this is working correctly?"

6. **Edge Cases & Error Handling**
   - "What could go wrong?"
   - "What happens with invalid input?"
   - "What are the boundary conditions?"

7. **Dependencies & Constraints**
   - "What existing systems does this interact with?"
   - "Any technical constraints or requirements?"
   - "What must be true before this can work?"

8. **Tests (TDD)**
   - "What tests would prove this works?"
   - Prompt for unit, integration, E2E test ideas

9. **Technical Architecture** (asked by default, user can opt out)
   - API: "What endpoints are needed? What's the contract?" (or "N/A - no API needed")
   - Data: "What data models? Database changes?" (or "N/A - no database")
   - Backend: "What services/logic are needed?" (or "N/A - frontend only")
   - Frontend: "What UI components? State management?"
   - Infrastructure: "Deployment considerations? Scaling?"

   *Note: These questions are always asked even if external spec is product-only, but user can explicitly decline each area (e.g., "This is frontend-only, no backend needed").*

**Output:**
- Generates comprehensive SPEC.md from solicited information
- Includes all standard sections (Tests, Components, Domain Extractions)
- Includes "Requirements Discovery" section with full Q&A trail (questions asked + user answers)
- Captures any user feedback/corrections during review in the same section
- Saves to task folder
- Updates workflow.yaml status to `spec_review`

**Session-Independent State (Zero Context Assumption):**

A new session must be able to resume solicitation with ZERO knowledge of prior conversation. All required information is stored in `solicitation-workflow.yaml`:

```yaml
started: YYYY-MM-DD HH:MM:SS
last_updated: YYYY-MM-DD HH:MM:SS
current_step: 3  # Which solicitation step we're on
current_question: "What should the system do?"  # Exact question being asked

# Full Q&A history - questions AND answers
history:
  - step: 1
    category: context_goal
    question: "What problem does this solve?"
    answer: "User authentication is manual and error-prone"
    timestamp: YYYY-MM-DD HH:MM:SS
  - step: 2
    category: context_goal
    question: "Who is the primary user?"
    answer: "End users logging into the application"
    timestamp: YYYY-MM-DD HH:MM:SS
  - step: 3
    category: functional_requirements
    question: "What should the system do?"
    answer: null  # Awaiting response
    timestamp: YYYY-MM-DD HH:MM:SS

# Structured answers for spec generation
answers:
  context_goal:
    problem: "User authentication is manual"
    primary_user: "End users"
    expected_outcome: "Automated login"
  functional_requirements:
    - "Users can register"
    - "Users can login"

# Review feedback (captured after spec/plan created)
review_feedback: []
```

On resume:
1. Read `solicitation-workflow.yaml`
2. Display summary of collected answers so far
3. Continue from `current_step` / `current_question`
4. No conversation history needed - everything is in the file

**Key principles**:
- Spec creation is always collaborative. External spec content is INPUT to the process, not the output
- The user always has opportunity to refine, clarify, and approve
- **External specs are product-oriented, not tech specs**: Even if the external spec says nothing about backend, API, databases, etc., the solicitation MUST cover all technical aspects. The solicitation adds the technical dimension that product specs lack.

### 9. Workflow State Skill (NEW)

Manages `.sdd/workflows/<workflow-id>/` state - tracking where each item is in the solicitation → review → approval → implementation lifecycle.

**IMPORTANT**: This is completely separate from:
- The marketplace-level `tasks` skill (manages `.tasks/` directory for project backlog)
- The top-level `.tasks/` directory (issue tracking, planning)

This is **process state management**, not project task management.

**Responsibilities:**
- Own all `.sdd/workflows/<workflow-id>/` operations
- Maintain `workflow.yaml` state
- Track task lifecycle (pending → complete)
- Manage task dependencies and ordering
- Move completed tasks to `changes/`
- **Create checkpoint commits** on every state change (feature branch only)

**Internal API (called by other skills):**

```
workflow_state.list()
  → Returns all tasks with their statuses

workflow_state.get_current()
  → Returns current task being worked on

workflow_state.advance()
  → Move to next task in order
  → Returns the new current task

workflow_state.update_status(task_id, status)
  → Update task status in workflow.yaml
  → Validates state transitions

workflow_state.create_task(metadata)
  → Create new task item in .sdd/workflows/<workflow-id>/drafts/
  → Used by sdd-change and external-spec-integration

workflow_state.complete_task(task_id)
  → Mark task as complete (item already in changes/)
  → Remove entry from workflow.yaml (keeps manifest lean)
  → Update INDEX.md
  → Delete workflow.yaml entirely when all items complete

workflow_state.get_context(task_id)
  → Return context.md content for solicitation

workflow_state.save_spec(task_id, content)
  → Write SPEC.md to task folder (in drafts/)

workflow_state.ready_for_review(task_id)
  → Determine next sequence number within workflow
  → Move task folder from .sdd/workflows/<workflow-id>/drafts/ to changes/YYYY/MM/DD/<workflow-id>/NN-slug/
  → Update workflow.yaml with new location
  → Status becomes `spec_review`

workflow_state.save_plan(task_id, content)
  → Write PLAN.md to task folder (now in changes/)

workflow_state.checkpoint(message, files)
  → Create checkpoint commit on feature branch
  → Uses --no-verify to skip hooks
  → Called automatically by other methods
  → No-op if on main/master branch
```

**State Management:**
- Read/write `workflow.yaml`
- Update `INDEX.md` (human-readable view)
- Track `current` position
- Validate dependency order
- Handle state transitions

**Consumers:**
- `sdd-change` - creates tasks after decomposition
- `spec-solicitation` - reads context, saves specs
- `change-creation` - saves plans
- `sdd-implement` - checks task is ready, marks implementing

### 10. Checkpoint Commits

All workflow state changes are preserved with checkpoint commits on the feature branch. This ensures no work is ever lost or overwritten, even if a session is interrupted or context is compacted.

**Checkpoint triggers** (automatic commits on feature branch):

| Event | Commit Message | Files Committed |
|-------|----------------|-----------------|
| Workflow created | `checkpoint: workflow <id> created` | `.sdd/workflows/<id>/workflow.yaml` |
| Spec solicitation progress | `checkpoint: <change-id> solicitation progress` | `solicitation-workflow.yaml` |
| SPEC.md created | `checkpoint: <change-id> spec created` | `SPEC.md`, `workflow.yaml` |
| SPEC.md approved | `checkpoint: <change-id> spec approved` | `workflow.yaml` |
| PLAN.md created | `checkpoint: <change-id> plan created` | `PLAN.md`, `workflow.yaml` |
| PLAN.md approved | `checkpoint: <change-id> plan approved` | `workflow.yaml` |
| Item moved to changes/ | `checkpoint: <change-id> ready for review` | All files in new location, `workflow.yaml` |
| Implementation progress | `checkpoint: <change-id> implementation progress` | Changed implementation files |
| Verification complete | `checkpoint: <change-id> verified` | `workflow.yaml` |
| Item complete | `checkpoint: <change-id> complete` | `workflow.yaml` |

**Commit behavior:**

1. **Feature branch required**: Checkpoints only created when on a feature branch (not main/master)
2. **Automatic staging**: Only workflow-related files are staged (`.sdd/`, `changes/`, implementation files)
3. **No hooks**: Checkpoints use `--no-verify` to skip pre-commit hooks (they're intermediate states)
4. **Squashable**: All checkpoints can be squashed into the final commit with changelog

**Final commit workflow:**

When the user is ready to create a permanent commit:
1. All checkpoint commits on the feature branch are available for review
2. User runs `/commit` which:
   - Squashes all checkpoints into one commit (or keeps them, user choice)
   - Adds proper changelog entry
   - Runs pre-commit hooks
   - Creates the final commit message

**Recovery scenarios:**

| Scenario | Recovery |
|----------|----------|
| Session interrupted mid-solicitation | Resume from `solicitation-workflow.yaml`, last checkpoint has partial progress |
| Context compacted during implementation | Resume from `workflow.yaml`, implementation files in last checkpoint |
| Crash during spec creation | `SPEC.md` or `solicitation-workflow.yaml` in last checkpoint |
| Power loss | Git reflog + checkpoints ensure < 1 question of lost work |

**Implementation notes:**

- `workflow-state` skill is responsible for creating checkpoints
- Checkpoints are silent (no user confirmation needed)
- Checkpoint frequency: after each significant state change, not every keystroke
- Use `git commit --no-verify -m "checkpoint: ..."` to avoid hook delays

## Dependencies

1. Manifest schema must be defined first
2. Spec template changes can happen independently
3. Thinking step depends on updated spec-decomposition
4. Review workflow depends on workflow.yaml being in place

## Tests

### Unit Tests
- `test_workflow_gets_unique_id` - Each workflow gets unique short ID (e.g., a1b2c3)
- `test_changes_get_unique_ids` - Each change gets workflow-scoped ID (a1b2-1, a1b2-2)
- `test_manifest_created_for_multi_change` - Manifest exists in epic folder
- `test_archive_happens_once` - External spec copied exactly once
- `test_order_persisted_to_manifest` - Order survives session restart
- `test_api_first_ordering` - Contracts/API specs come before UI specs
- `test_thinking_step_extracts_domain_entities` - All domain entities identified with definitions
- `test_thinking_step_extracts_entity_relationships` - Relationships between entities captured
- `test_thinking_step_builds_glossary` - Glossary terms extracted with definitions
- `test_thinking_step_identifies_bounded_contexts` - Bounded contexts identified
- `test_thinking_step_maps_entities_to_spec_paths` - Each entity mapped to a spec file path
- `test_thinking_step_identifies_new_vs_modified_specs` - Specs marked as new or modified
- `test_thinking_step_generates_specs_before_after` - Before/after directory tree generated
- `test_thinking_step_identifies_gaps` - Missing info flagged
- `test_spec_includes_tests_section` - All specs have Tests section
- `test_spec_includes_domain_model_section` - All specs have Domain Model with entities, relationships, glossary
- `test_spec_includes_specs_directory_changes` - All specs show before/after specs/ tree
- `test_spec_includes_changes_summary_table` - All specs list spec files to create/modify
- `test_spec_includes_components_section` - All specs list components
- `test_no_plan_on_import` - PLAN.md not created during import
- `test_spec_only_mode` - change-creation respects mode parameter
- `test_plan_created_on_spec_approval` - PLAN.md created when spec approved
- `test_implement_blocked_without_plan_approval` - Cannot implement before plan approved
- `test_solicitation_covers_functional_requirements` - Prompts for functional reqs
- `test_solicitation_covers_nonfunctional_requirements` - Prompts for NFRs
- `test_solicitation_generates_user_stories` - User stories in output
- `test_solicitation_generates_acceptance_criteria` - Given/When/Then format
- `test_solicitation_includes_tests` - TDD tests solicited and included
- `test_solicitation_covers_technical_architecture` - API, data, backend, frontend questions asked
- `test_product_spec_gets_technical_solicitation` - Product-only specs still get technical questions
- `test_user_can_opt_out_of_technical_areas` - User can decline backend/API/database if not needed
- `test_spec_includes_qa_trail` - SPEC.md contains Requirements Discovery section with all Q&A
- `test_spec_captures_user_feedback` - User feedback during review appended to Requirements Discovery
- `test_workflow_state_list_returns_all` - list() returns all tasks
- `test_workflow_state_advance_moves_current` - advance() moves to next task
- `test_workflow_state_update_status_validates` - update_status() validates transitions
- `test_workflow_state_ready_for_review_moves_to_changes` - ready_for_review() moves to changes/YYYY/MM/DD/<wf-id>/
- `test_workflow_state_ready_for_review_uses_sequence_prefix` - Folder gets NN- prefix within workflow
- `test_workflow_state_ready_for_review_groups_by_workflow` - Items from same workflow appear under same workflow ID folder
- `test_workflow_state_complete_marks_done` - complete_task() marks item complete (already in changes/)
- `test_workflow_state_complete_removes_from_manifest` - Completed items removed from workflow.yaml
- `test_workflow_state_deletes_manifest_when_empty` - workflow.yaml deleted when all items complete
- `test_workflow_state_respects_dependencies` - Can't advance past unmet dependencies
- `test_workflow_state_persists_state` - State survives session restart
- `test_verification_required_before_complete` - Can't mark complete without verification
- `test_solicitation_state_persisted` - Partial solicitation answers saved to yaml
- `test_solicitation_resumes_from_state` - Can resume mid-solicitation in new session
- `test_all_skills_session_independent` - No skill relies on in-memory state
- `test_manifest_contains_item_locations` - workflow.yaml tracks where each item lives (drafts/ or changes/)
- `test_solicitation_state_contains_full_qa_history` - solicitation-workflow.yaml has questions AND answers
- `test_resume_without_conversation_history` - New session can resume with only file contents (no context)
- `test_approve_spec_command_creates_plan` - /sdd-change approve spec triggers PLAN.md creation
- `test_approve_spec_command_validates_change_id` - Invalid change ID rejected
- `test_approve_plan_command_enables_implementation` - /sdd-change approve plan sets plan_approved status
- `test_status_command_shows_all_workflows` - /sdd-change status shows current state across workflows
- `test_status_command_shows_change_ids` - Change IDs displayed for user reference
- `test_implement_blocked_without_plan_approved` - `sdd-change implement` rejects non-approved changes
- `test_verify_updates_status_to_verifying` - `sdd-change verify` sets verifying status
- `test_verify_success_marks_complete` - Successful verification marks item complete
- `test_verify_validates_specs_changes` - Verify checks specs/ changes match SPEC.md declaration
- `test_verify_fails_on_undeclared_specs_change` - Verify fails if specs/ file changed but not in Changes Summary
- `test_verify_fails_on_missing_declared_change` - Verify fails if declared change wasn't made
- `test_complete_removes_from_workflow_yaml` - Completed item removed from workflow.yaml
- `test_all_complete_deletes_workflow_directory` - Workflow directory deleted when empty
- `test_epic_children_tracked_in_workflow` - Epic children properly nested in workflow.yaml
- `test_epic_status_derived_from_children` - Epic status reflects child progress
- `test_cleanup_removes_solicitation_yaml` - solicitation-workflow.yaml deleted after move to changes
- `test_context_md_preserved_in_drafts` - context.md kept for reference after move
- `test_checkpoint_on_workflow_created` - Checkpoint commit when workflow created
- `test_checkpoint_on_solicitation_progress` - Checkpoint commit on solicitation progress
- `test_checkpoint_on_spec_created` - Checkpoint commit when SPEC.md created
- `test_checkpoint_on_spec_approved` - Checkpoint commit when spec approved
- `test_checkpoint_on_plan_created` - Checkpoint commit when PLAN.md created
- `test_checkpoint_on_plan_approved` - Checkpoint commit when plan approved
- `test_checkpoint_on_item_moved` - Checkpoint commit when item moves to changes/
- `test_checkpoint_on_implementation_progress` - Checkpoint commit during implementation
- `test_checkpoint_on_verification_complete` - Checkpoint commit after verification
- `test_checkpoint_on_item_complete` - Checkpoint commit when item marked complete
- `test_checkpoint_only_on_feature_branch` - No checkpoint commits on main/master
- `test_checkpoint_uses_no_verify` - Checkpoint commits skip pre-commit hooks
- `test_checkpoint_stages_only_workflow_files` - Only workflow-related files staged
- `test_checkpoints_squashable` - Checkpoints can be squashed into final commit
- `test_continue_resumes_from_pending` - Continue picks up pending item
- `test_continue_resumes_from_soliciting` - Continue resumes mid-solicitation
- `test_continue_resumes_from_spec_review` - Continue shows spec for review
- `test_continue_resumes_from_plan_review` - Continue shows plan for review
- `test_list_shows_all_items` - List displays all workflow items with statuses
- `test_list_shows_change_ids` - List includes change IDs for reference
- `test_spec_has_specs_directory_changes_section` - Every SPEC.md must have Specs Directory Changes section
- `test_specs_changes_lists_all_affected_files` - Section lists every specs/ file to be created/modified
- `test_implementation_validates_specs_traceability` - Implementation checks changes match declared specs/ impact
- `test_sdd_init_no_component_selection` - sdd-init does not prompt for component selection

### Integration Tests
- `test_external_spec_creates_specs_only` - Full flow creates SPEC.md without PLAN.md
- `test_spec_approval_creates_plan` - Approving spec triggers plan creation
- `test_plan_approval_enables_implementation` - Status progresses correctly
- `test_manifest_tracks_two_stage_progress` - Status updates through both stages
- `test_resume_review_from_manifest` - Can continue review after session break
- `test_solicitation_to_spec_flow` - Interactive mode produces valid SPEC.md
- `test_sdd_change_continue_resumes_workflow` - --continue flag reads workflow.yaml and resumes
- `test_multi_user_workflows_isolated` - Different workflows don't interfere
- `test_concurrent_workflows_different_ids` - Concurrent workflows get unique IDs
- `test_epic_workflow_tracks_children` - Epic with children properly tracked through workflow
- `test_implementation_updates_workflow_state` - `sdd-change implement` updates workflow.yaml
- `test_verification_completes_workflow_item` - `sdd-change verify` completes and cleans up
- `test_checkpoint_recovery_mid_solicitation` - Can recover from checkpoint after session interrupt
- `test_checkpoint_recovery_mid_implementation` - Can recover implementation progress from checkpoint
- `test_final_commit_squashes_checkpoints` - Final commit can squash all checkpoints

### E2E Tests
- `test_full_external_spec_workflow` - End-to-end from spec import to implementation ready
- `test_full_interactive_workflow` - End-to-end from solicitation to implementation ready

## Verification

- [ ] External spec copied exactly once to `.sdd/archive/external-specs/` with yyyymmdd-lowercased-filename.md format
- [ ] Specs created in `changes/` directory (current location)
- [ ] No PLAN.md files created during import
- [ ] workflow.yaml contains correct order and status
- [ ] Order persists across sessions (read workflow.yaml on resume)
- [ ] All specs include Tests section with TDD approach
- [ ] All specs include Components section
- [ ] All specs include Domain Model section with entities, relationships, glossary, bounded contexts
- [ ] All specs include Specs Directory Changes section showing before/after tree
- [ ] All specs include Changes Summary table listing spec files to create/modify
- [ ] Thinking step extracts comprehensive domain model (entities, relationships, glossary)
- [ ] Thinking step maps each entity to a spec file path with new/modify status
- [ ] Thinking step output visible to user for review
- [ ] API/contract specs ordered before UI specs
- [ ] PLAN.md created only after user approves SPEC.md
- [ ] Implementation blocked until user approves PLAN.md
- [ ] Two-stage approval workflow enforced (spec → plan → implement)
- [ ] Interactive mode invokes spec-solicitation skill
- [ ] Solicitation covers functional, non-functional, user stories, acceptance criteria
- [ ] Solicitation covers technical architecture (API, data, backend, frontend) unless user explicitly opts out
- [ ] All specs include Requirements Discovery section with full Q&A trail
- [ ] User feedback during review captured in Requirements Discovery section
- [ ] Solicited specs follow same two-stage approval as imported specs
- [ ] Workflow state skill provides internal API for workflow lifecycle
- [ ] Workflow state persists across sessions via workflow.yaml
- [ ] Each workflow gets a unique short ID (e.g., `a1b2c3`) at creation
- [ ] Each change gets a workflow-scoped ID (<workflow-short>-<seq>) for multi-user safety
- [ ] Items move from `.sdd/workflows/<workflow-id>/drafts/` to `changes/` when SPEC.md is ready for review (not after completion)
- [ ] Review and approval happens in `changes/`, not in `drafts/`
- [ ] Items from same workflow grouped together under workflow ID folder
- [ ] Completed items removed from workflow.yaml (manifest stays lean)
- [ ] workflow.yaml deleted when all items complete
- [ ] Verification step required after implementation before marking complete
- [ ] All skills maintain session-independent state in `.sdd/`
- [ ] Solicitation can be resumed mid-flow with partial answers preserved
- [ ] Any interruption at any point can be resumed in a new session
- [ ] Zero session context assumed - all state in files, no conversation history needed
- [ ] workflow.yaml includes `location` field tracking where each item lives
- [ ] solicitation-workflow.yaml captures full Q&A history (questions AND answers)
- [ ] New session can display "here's what we've collected so far" from files alone
- [ ] `/sdd-change approve spec` command creates PLAN.md and updates status
- [ ] `/sdd-change approve plan` command enables implementation
- [ ] `/sdd-change status` command shows all workflows and change IDs
- [ ] `/sdd-change continue` resumes current workflow from state
- [ ] `/sdd-change implement` rejects changes without plan_approved status
- [ ] `/sdd-change verify` sets verifying status during verification
- [ ] Successful verification marks item complete and removes from workflow.yaml
- [ ] Workflow directory cleaned up when all items complete
- [ ] Epic status properly derived from child item statuses
- [ ] context.md preserved in drafts after item moves to changes
- [ ] solicitation-workflow.yaml deleted after item moves to changes
- [ ] `sdd-implement-change` and `sdd-verify-change` deprecated in favor of `sdd-change` subcommands
- [ ] Unified `sdd-change` command with subcommands for entire change lifecycle
- [ ] Documentation updated with new command structure and workflow
- [ ] Checkpoint commits created automatically on workflow state changes
- [ ] Checkpoints only created on feature branches (not main/master)
- [ ] Checkpoints use `--no-verify` to skip hooks
- [ ] Checkpoints stage only workflow-related files
- [ ] Recovery possible from any checkpoint after session interrupt
- [ ] Final commit can squash all checkpoints with proper changelog
- [ ] All documentation files updated with new command names (sdd-change, subcommands)
- [ ] Template files (CLAUDE.md, README.md) updated with new command references
- [ ] check-tools skill tool requirements table updated
- [ ] epic-planning skill consistent with new workflow.yaml structure
- [ ] PERMISSIONS.md includes `.sdd/` directory in auto-approved paths
- [ ] sdd-init command references updated
- [ ] sdd-init Phase 2 (quick component selection) removed
- [ ] sdd-run.md reference to sdd-implement-change updated
- [ ] sdd-settings.md reference to sdd-new-change updated
- [ ] project-scaffolding/SKILL.md references to sdd-new-change updated
- [ ] commit-standards/SKILL.md reference to sdd-new-change updated
- [ ] Test data files renamed to match new command names
- [ ] `/sdd-change continue` resumes from any workflow state
- [ ] `/sdd-change list` displays all items with change IDs and statuses
- [ ] Every `specs/` modification is declared in a change SPEC.md's "Specs Directory Changes" section
- [ ] Implementation enforces specs traceability (no specs/ changes without originating change spec)
