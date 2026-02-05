---
name: workflow-state
description: Internal skill for managing workflow lifecycle state in .sdd/workflows/. Provides session-independent, resumable workflow tracking.
---

# Workflow State Skill

## Purpose

Manages `.sdd/workflows/<workflow-id>/` state - tracking where each item is in the solicitation → review → approval → implementation lifecycle.

**IMPORTANT**: This is completely separate from:
- The marketplace-level `tasks` skill (manages `.tasks/` directory for project backlog)
- The top-level `.tasks/` directory (issue tracking, planning)

This is **process state management**, not project task management.

## Core Principle: Zero Session Context

**ALL workflow state is persisted in `.sdd/` files.** A new session must be able to resume with ZERO knowledge of what happened before:
- No conversation history
- No in-memory state
- No assumptions

Read the files, know the state. This enables aggressive context compaction and allows users to clear sessions freely.

## Directory Structure

```
.sdd/
├── sdd-settings.yaml
├── archive/
│   └── external-specs/         # External specs archived here (read-only)
│       └── 20260205-feature-spec.md  # yyyymmdd-lowercased-filename.md
└── workflows/                  # Multiple concurrent workflows supported
    ├── a1b2c3/                 # One workflow (user A, branch feature-x)
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
    └── x7y8z9/                 # Another workflow (user B, branch feature-y)
        ├── workflow.yaml
        └── drafts/...
```

## workflow.yaml Schema

```yaml
id: a1b2c3                      # Short unique workflow ID (used in changes/ path)
source: external | interactive
external_source: .sdd/archive/external-specs/20260205-feature-spec.md
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
        change_id: a1b2-1       # Unique ID for user reference
        title: API Contracts
        type: feature
        status: spec_review
        location: changes/2026/02/05/a1b2c3/01-api-contracts
        context_sections: ["## API Design", "## Endpoints"]
        depends_on: []
      - id: 02-backend-service
        change_id: a1b2-2
        title: Backend Service
        type: feature
        status: pending
        location: .sdd/workflows/a1b2c3/drafts/01-user-management/02-backend-service
        context_sections: ["## Backend Logic", "## Data Model"]
        depends_on: [01-api-contracts]
  - id: 02-notifications
    title: Notifications
    type: epic
    status: pending
    depends_on: [01-user-management]
    children: [...]
```

## Status Progression

1. `pending` - Not yet started
2. `soliciting` - User is going through spec solicitation
3. `spec_review` - SPEC.md created, moved to changes/, user reviewing
4. `plan_review` - User approved SPEC.md, PLAN.md created, user reviewing
5. `plan_approved` - User approved PLAN.md, ready for implementation
6. `implementing` - Implementation in progress
7. `verifying` - Implementation complete, running verification
8. `complete` - Verification passed, ready for next item

**Note**: There is no `spec_approved` resting state. When user runs `/sdd-change approve spec`, the PLAN.md is immediately created and status transitions directly to `plan_review`.

## Internal API

These operations are called by other skills (sdd-change, spec-solicitation, change-creation, etc.):

### workflow_state.create_workflow(source, external_source?)

Create a new workflow with unique ID.

**Input:**
```yaml
source: external | interactive
external_source: <path to archived external spec>  # Only if source=external
```

**Output:**
```yaml
workflow_id: a1b2c3
workflow_path: .sdd/workflows/a1b2c3/
workflow_yaml_path: .sdd/workflows/a1b2c3/workflow.yaml
```

**Side Effects:**
- Creates `.sdd/workflows/<id>/` directory
- Creates `workflow.yaml` with initial state
- Creates `drafts/` subdirectory
- Creates checkpoint commit: `checkpoint: workflow <id> created`

### workflow_state.create_item(workflow_id, item_metadata)

Create a new item in the workflow.

**Input:**
```yaml
workflow_id: a1b2c3
id: 01-api-contracts
title: API Contracts
type: feature | epic
parent_id: 01-user-management  # Optional, for nested items
context_sections: ["## API Design"]
depends_on: []
```

**Output:**
```yaml
change_id: a1b2-1  # Assigned by skill
location: .sdd/workflows/a1b2c3/drafts/01-api-contracts
```

**Side Effects:**
- Creates item directory in `drafts/`
- Creates `context.md` with extracted sections
- Updates `workflow.yaml` with new item
- Assigns unique change_id within workflow

### workflow_state.list()

Returns all items with their statuses.

**Output:**
```yaml
items:
  - change_id: a1b2-1
    title: API Contracts
    type: feature
    status: spec_review
    location: changes/2026/02/05/a1b2c3/01-api-contracts
  - change_id: a1b2-2
    title: Backend Service
    type: feature
    status: pending
    location: .sdd/workflows/a1b2c3/drafts/01-user-management/02-backend-service
```

### workflow_state.get_current()

Returns current item being worked on.

**Output:**
```yaml
change_id: a1b2-1
title: API Contracts
type: feature
status: spec_review
location: changes/2026/02/05/a1b2c3/01-api-contracts
context_path: .sdd/workflows/a1b2c3/drafts/01-user-management/01-api-contracts/context.md
```

### workflow_state.advance()

Move to next item in order. Returns the new current item.

**Output:**
```yaml
change_id: a1b2-2
title: Backend Service
type: feature
status: pending
previous: a1b2-1
```

**Side Effects:**
- Updates `current` in `workflow.yaml`

### workflow_state.update_status(change_id, status)

Update item status in workflow.yaml. Validates state transitions.

**Input:**
```yaml
change_id: a1b2-1
status: soliciting | spec_review | plan_review | plan_approved | implementing | verifying | complete
```

**Output:**
```yaml
success: true
previous_status: pending
new_status: soliciting
```

**Side Effects:**
- Updates `workflow.yaml`
- Creates checkpoint commit

**Valid Transitions:**
- `pending` → `soliciting`
- `soliciting` → `spec_review`
- `spec_review` → `plan_review` (when spec approved)
- `plan_review` → `plan_approved` (when plan approved)
- `plan_approved` → `implementing`
- `implementing` → `verifying`
- `verifying` → `complete`

### workflow_state.get_context(change_id)

Return context.md content for solicitation.

**Output:**
```yaml
context: |
  ## API Design

  Content extracted from external spec...
has_context: true
```

### workflow_state.save_spec(change_id, content)

Write SPEC.md to item folder (in drafts/).

**Input:**
```yaml
change_id: a1b2-1
content: |
  ---
  title: API Contracts
  ...
  ---

  # API Contracts
  ...
```

**Side Effects:**
- Writes `SPEC.md` to drafts location
- Creates checkpoint commit: `checkpoint: <change_id> spec created`

### workflow_state.ready_for_review(change_id)

Move item from drafts to changes/. Status becomes `spec_review`.

**Input:**
```yaml
change_id: a1b2-1
```

**Output:**
```yaml
new_location: changes/2026/02/05/a1b2c3/01-api-contracts
sequence_number: 1  # NN- prefix within workflow
```

**Side Effects:**
- Determines next sequence number within workflow
- Moves item folder from `.sdd/workflows/<wf-id>/drafts/` to `changes/YYYY/MM/DD/<wf-id>/NN-slug/`
- Updates `workflow.yaml` with new location
- Updates `changes/INDEX.md` with new entry
- Sets status to `spec_review`
- Deletes `solicitation-workflow.yaml` from drafts (cleanup)
- Preserves `context.md` in drafts for reference
- Creates checkpoint commit: `checkpoint: <change_id> ready for review`

### workflow_state.save_plan(change_id, content)

Write PLAN.md to item folder (now in changes/).

**Input:**
```yaml
change_id: a1b2-1
content: |
  ---
  title: API Contracts - Implementation Plan
  ...
  ---

  ## Overview
  ...
```

**Side Effects:**
- Writes `PLAN.md` to changes location
- Creates checkpoint commit: `checkpoint: <change_id> plan created`

### workflow_state.complete_item(change_id)

Mark item as complete. Item already in changes/.

**Input:**
```yaml
change_id: a1b2-1
```

**Side Effects:**
- Sets status to `complete`
- Removes entry from `workflow.yaml` items array (keeps manifest lean)
- Updates `INDEX.md` to show completion
- If all items complete: deletes entire `.sdd/workflows/<workflow-id>/` directory
- Creates checkpoint commit: `checkpoint: <change_id> complete`

### workflow_state.checkpoint(message, files)

Create checkpoint commit on feature branch.

**Input:**
```yaml
message: "checkpoint: a1b2-1 spec created"
files:
  - .sdd/workflows/a1b2c3/drafts/01-api-contracts/SPEC.md
  - .sdd/workflows/a1b2c3/workflow.yaml
```

**Behavior:**
- Uses `--no-verify` to skip hooks
- No-op if on main/master branch
- Only stages workflow-related files (`.sdd/`, `changes/`, implementation files)

## Checkpoint Triggers

Checkpoints are created automatically on workflow state changes:

| Event | Commit Message | Files Committed |
|-------|----------------|-----------------|
| Workflow created | `checkpoint: workflow <id> created` | `workflow.yaml` |
| Spec solicitation progress | `checkpoint: <change-id> solicitation progress` | `solicitation-workflow.yaml` |
| SPEC.md created | `checkpoint: <change-id> spec created` | `SPEC.md`, `workflow.yaml` |
| SPEC.md approved | `checkpoint: <change-id> spec approved` | `workflow.yaml` |
| PLAN.md created | `checkpoint: <change-id> plan created` | `PLAN.md`, `workflow.yaml` |
| PLAN.md approved | `checkpoint: <change-id> plan approved` | `workflow.yaml` |
| Item moved to changes/ | `checkpoint: <change-id> ready for review` | All files, `workflow.yaml` |
| Implementation progress | `checkpoint: <change-id> implementation progress` | Changed files |
| Verification complete | `checkpoint: <change-id> verified` | `workflow.yaml` |
| Item complete | `checkpoint: <change-id> complete` | `workflow.yaml` |

## Workflow ID Generation

Workflow IDs are short, unique identifiers:

1. Generate 6 random alphanumeric characters (a-z, 0-9)
2. Check for collision with existing workflows
3. If collision, regenerate
4. Format: `a1b2c3`, `x7y8z9`, etc.

## Change ID Format

Change IDs are workflow-scoped:

- Format: `<workflow-short>-<seq>` (e.g., `a1b2-1`, `a1b2-2`)
- `workflow-short`: First 4 characters of workflow ID
- `seq`: Sequence number within workflow (1, 2, 3, ...)
- Unique across concurrent workflows (different workflows = different prefix)

## Epic Handling

- Each epic is an item with `type: epic` and `children` array
- Children are features within the epic
- Epic status tracks overall progress:
  - `pending` until first child starts
  - `complete` when all children complete
- Epic itself doesn't get a change_id - only leaf features get change_ids
- Epic folder in `changes/` contains child change folders

## Cleanup Behavior

- When item moves from `drafts/` to `changes/`:
  - Keep `context.md` in drafts for reference
  - Delete `solicitation-workflow.yaml`
- When item is marked `complete`:
  - Remove from `workflow.yaml` items array
- When all items complete:
  - Delete entire `.sdd/workflows/<workflow-id>/` directory including `workflow.yaml`
- Completed items remain in `changes/` permanently (that's the source of truth)

## INDEX.md Handling

- `changes/INDEX.md` is updated when items move to `changes/` directory
- No separate INDEX.md in `.sdd/workflows/` - workflow.yaml is the source of truth
- `workflow_state.ready_for_review()` updates `changes/INDEX.md` with new entry

## Consumers

This skill is called by:
- `sdd-change` command - creates workflows and manages lifecycle
- `spec-solicitation` skill - reads context, saves specs
- `change-creation` skill - saves plans
- External-spec-integration skill - creates workflows and items from decomposition

## Recovery Scenarios

| Scenario | Recovery |
|----------|----------|
| Session interrupted mid-solicitation | Resume from `solicitation-workflow.yaml`, last checkpoint has partial progress |
| Context compacted during implementation | Resume from `workflow.yaml`, implementation files in last checkpoint |
| Crash during spec creation | `SPEC.md` or `solicitation-workflow.yaml` in last checkpoint |
| Power loss | Git reflog + checkpoints ensure < 1 question of lost work |
