---
name: tasks
description: Manage tasks and plans using the .tasks/ directory.
---

# Task Management Skill

Manage the project backlog, track progress, and organize implementation plans.

---

## Directory Structure

```
.tasks/
├── INDEX.md              # Index file - task numbers, titles, links
├── issues/               # Individual task files by priority
│   ├── inbox/            # Unsorted - new issues land here
│   ├── low/              # Low priority
│   ├── medium/           # Medium priority
│   ├── high/             # High priority
│   ├── consolidated/           # Consolidated into other tasks
│   └── complete/         # Done
└── plans/                # Implementation plans by status
    ├── new/              # Just created
    ├── in-progress/      # Being worked on
    ├── in-review/        # Ready for review
    └── complete/         # Done (requires explicit auth)
```

---

## Issue Schema

All issue files use YAML frontmatter.

### Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | yes | Unique task number |
| `title` | string | yes | Short title |
| `priority` | enum | yes | `inbox`, `low`, `medium`, `high` |
| `status` | enum | yes | `open`, `consolidated`, `complete` |
| `created` | date | yes | YYYY-MM-DD |
| `completed` | date | no | YYYY-MM-DD (when status=complete) |
| `consolidated_into` | number | no | Task ID (when status=consolidated) |
| `plan` | string | no | Relative path to plan file |
| `depends_on` | number[] | no | Task IDs this depends on |
| `blocks` | number[] | no | Task IDs blocked by this |

### Issue File Template

```markdown
---
id: 63
title: Short descriptive title
priority: medium
status: open
created: 2026-01-30
depends_on: []
blocks: []
---

# Task 63: Short descriptive title

## Description

Full description of what needs to be done.

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
```

### Completed Issue Template

```markdown
---
id: 7
title: External spec handling
priority: high
status: complete
created: 2026-01-25
completed: 2026-01-28
plan: ../../plans/complete/PLAN-task-7-external-spec-handling.md
---

# Task 7: External spec handling ✓

## Summary

Brief summary of what was accomplished.

## Details

- Fixed X
- Added Y
- Changed Z
```

### Consolidated Issue Template

```markdown
---
id: 28
title: Schema validation skill
priority: medium
status: consolidated
created: 2026-01-20
consolidated_into: 27
---

# Task 28: Schema validation skill → consolidated into #27

<!-- Original content preserved below -->

## Description

[Original description content remains here unchanged]

## Acceptance Criteria

[Original acceptance criteria remain here unchanged]
```

**IMPORTANT:** When consolidating, the original issue content MUST be preserved in full. Only the frontmatter and title are modified.

---

## Plan Schema

All plan files use YAML frontmatter.

### Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `task_id` | number | yes | Related task number |
| `title` | string | yes | Plan title |
| `status` | enum | yes | `new`, `in-progress`, `in-review`, `complete` |
| `created` | date | yes | YYYY-MM-DD |
| `updated` | date | no | YYYY-MM-DD (last modification) |
| `completed` | date | no | YYYY-MM-DD (when status=complete) |
| `version` | string | no | Plugin version when completed |

### Plan File Template

```markdown
---
task_id: 19
title: Task management skill
status: new
created: 2026-01-28
---

# Plan: Task Management Skill (Task 19)

## Problem Summary

Brief description of what needs to be done.

## Files to Modify

| File | Changes |
|------|---------|
| path/to/file.ts | Description of changes |

## Implementation

### Phase 1: Description

Details...

### Phase 2: Description

Details...

## Verification

1. How to verify phase 1 works
2. How to verify phase 2 works
```

### Completed Plan Template

```markdown
---
task_id: 7
title: External spec handling
status: complete
created: 2026-01-25
completed: 2026-01-28
version: v5.0.0
---

# Plan: External Spec Handling (Task 7) ✓

## Summary

What was accomplished...
```

---

## INDEX.md Index Structure

```markdown
# Tasks Backlog

Task details in [issues/](issues/) | Plans in [plans/](plans/)

---

## Inbox (unsorted)

- [#63](issues/inbox/63.md): New feature idea

---

## High Priority

- [#60](issues/high/60.md): Standardize TypeScript imports
- [#59](issues/high/59.md): Audit and update agents

---

## Medium Priority

- [#10](issues/medium/10.md): Missing /sdd-help command

---

## Low Priority

- [#3](issues/low/3.md): Docs missing: CMDO Guide

---

## Consolidated

- [#28](issues/consolidated/28.md) → #27

---

## Complete

- [#62](issues/complete/62.md): Unified CLI system ✓ (2026-01-30)
```

---

## Commands

### View Backlog

```
User: /tasks
User: /tasks list
```

**Action:** Read INDEX.md and display the index, grouped by section.

### View Single Task

```
User: /tasks 19
```

**Action:** Read the individual task file (scan issues/ subdirs to find it).

### Add New Task

```
User: /tasks add <description>
```

**Workflow:**
1. Determine next task number (highest N + 1 across all subdirs)
2. Create file in `issues/inbox/` with frontmatter
3. Add entry to INDEX.md index under Inbox
4. Confirm with task number

New tasks always go to inbox first. User can prioritize later.

### Prioritize Task

```
User: /tasks prioritize 15 high
User: /tasks prioritize 15 medium
User: /tasks prioritize 15 low
```

**Workflow:**
1. Find task file
2. Move file to target priority dir (`issues/high/`, `issues/medium/`, `issues/low/`)
3. Update frontmatter `priority` field
4. Update INDEX.md index

### Complete Task

```
User: /tasks complete 7
```

**Workflow:**
1. Find task file
2. Move to `issues/complete/`
3. Update frontmatter: `status: complete`, add `completed` date
4. Update INDEX.md index
5. **If plan exists, ask user** before moving to `plans/complete/`

### Consolidate Tasks

```
User: /tasks consolidate 28 into 27
```

**Workflow:**
1. Find both task files
2. Move task 28 to `issues/consolidated/`
3. Update task 28:
   - Update frontmatter: `status: consolidated`, `consolidated_into: 27`
   - Update title to include `→ consolidated into #27`
   - **Preserve ALL original content** (description, acceptance criteria, etc.)
4. Update task 27 with consolidated context (add ## Consolidated section referencing #28)
5. Update INDEX.md index

### Create Plan

```
User: /tasks plan 19
```

**Workflow:**
1. Read task file
2. Analyze codebase
3. Create `plans/new/PLAN-task-N-slug.md` with frontmatter
4. Update task file frontmatter with `plan` path
5. Confirm creation

### Advance Plan Status

```
User: /tasks plan-status 19 in-progress
User: /tasks plan-status 19 in-review
User: /tasks plan-status 19 complete
```

**Workflow:**
1. Find plan file
2. Move to target status dir
3. Update frontmatter `status` field
4. Add `updated` or `completed` date as appropriate

**IMPORTANT:** Moving to `complete` requires explicit user confirmation.

### Review Plans

```
User: /tasks plans
```

**Action:** List all plans grouped by status (new, in-progress, in-review, complete).

---

## Task Numbering

- Task numbers are permanent identifiers (never reused)
- Find highest number across ALL subdirs, increment by 1
- Numbers may have gaps (merges, deletions)
- Reference as `#N` or `task N`

## Best Practices

1. **Inbox first** - New tasks go to inbox, prioritize later
2. **Keep atomic** - One clear outcome per task
3. **Consolidate related** - Don't duplicate effort
4. **Preserve on consolidate** - Never lose original issue content when consolidating
5. **Link plans** - Always link implementation plans
6. **Update both** - Task file AND INDEX.md must stay in sync
7. **Add context** - When completing, summarize what was done
8. **Date everything** - Completion dates help track velocity
9. **Never move plans without auth** - `plans/complete/` requires explicit approval

## Lifecycles

### Issue Lifecycle

```
inbox/ → [prioritize] → low/ | medium/ | high/
                              ↓
                        [implement]
                              ↓
                        complete/

Any priority → consolidated/ (if combined with another)
```

### Plan Lifecycle

```
new/ → in-progress/ → in-review/ → complete/
```

Plans move forward through explicit commands, never automatically.
