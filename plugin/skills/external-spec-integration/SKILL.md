---
name: external-spec-integration
description: Process external specifications into workflow items with decomposition and thinking step. Creates tasks, not full specs.
---

# External Spec Integration Skill

Processes external specification files into the SDD workflow structure. Creates workflow items with context - specs are created interactively one at a time.

## Purpose

When a user provides an external specification via `/sdd-change new --spec`:
- Archive the external spec to `.sdd/archive/external-specs/` (single copy, yyyymmdd-filename format)
- Analyze the spec with thinking step (domain extraction, gap analysis, API-first ordering)
- Create workflow items with context in `.sdd/workflows/<workflow-id>/`
- **DO NOT** create SPEC.md or PLAN.md files - those are created interactively

**CRITICAL: External specs are consumed ONCE during import, then archived. Specs are created through the solicitation process, not copied from external source.**

## When to Use

- During `/sdd-change new --spec <path>` when external spec is provided

## Input

| Parameter | Required | Description |
|-----------|----------|-------------|
| `spec_path` | Yes | Absolute path to the external specification file |
| `spec_outline` | Yes | Pre-extracted outline from sdd-change (sections with line ranges) |
| `target_dir` | Yes | Absolute path to the project directory |
| `primary_domain` | Yes | Primary domain for the project |
| `workflow_id` | Yes | Workflow ID from workflow-state skill |
| `discovery_results` | No | Results from product-discovery skill |

## Output

```yaml
success: true
external_spec_archived: ".sdd/archive/external-specs/20260205-feature-spec.md"
workflow_id: a1b2c3
is_hierarchical: true
items_created:
  - id: 01-user-management
    change_id: null  # Epics don't get change_ids
    type: epic
    title: User Management
    children:
      - id: 01-registration
        change_id: a1b2-1
        type: feature
        title: Registration
        context_path: .sdd/workflows/a1b2c3/drafts/01-user-management/01-registration/context.md
      - id: 02-authentication
        change_id: a1b2-2
        type: feature
        title: Authentication
        context_path: .sdd/workflows/a1b2c3/drafts/01-user-management/02-authentication/context.md
thinking_output:
  domain_model:
    entities: [User, Session, Token]
    relationships: ["User has-many Sessions"]
    glossary_terms: 5
    bounded_contexts: [Identity, Analytics]
  specs_impact:
    new: [specs/domain/session.md, specs/api/auth.md]
    modified: [specs/domain/user.md]
  gaps_identified: ["Password policy not specified"]
  recommended_order: [01-registration, 02-authentication, ...]
```

## Workflow

### Step 1: Archive External Spec

**Single location, single copy:**

1. Create archive directory: `.sdd/archive/external-specs/`
2. Generate filename: `yyyymmdd-lowercased-original-name.md`
3. Copy external spec to archive location
4. Display: "Archived to: .sdd/archive/external-specs/20260205-feature-spec.md"

**For directories:**
1. Create archive subdirectory: `.sdd/archive/external-specs/yyyymmdd-dirname/`
2. Copy all files preserving structure
3. Display file count

**IMPORTANT**: This is the ONLY copy. The archived spec is read-only and for audit trail only.

### Step 2: Present Outline to User

The `spec_outline` is already extracted. Detect hierarchical decomposition:

**Hierarchical decomposition applies when:**
- Spec has 2+ H1 sections
- At least one H1 has 2+ H2 subsections

**Display for hierarchical specs:**

```
I found the following structure in this spec:

EPICS (from H1 sections):
  01 User Management (lines 10-150)
     ├── 01 Registration
     ├── 02 Authentication
     └── 03 Password Reset

  02 Dashboard (lines 151-300) [depends on: User Management]
     ├── 01 Analytics
     └── 02 Settings

Total: 2 epics, 5 features
Implementation order: 01 → 02 (02 depends on 01)

Options:
  [A] Accept this breakdown
  [S] Single change (don't split)
  [C] Cancel
```

### Step 3: Thinking Step (Domain Analysis)

**CRITICAL NEW STEP**: Before creating items, perform deep analysis:

```yaml
INVOKE spec-decomposition skill with:
  mode: "hierarchical"
  spec_outline: <from input>
  spec_content: <full spec content from archive>
  default_domain: <primary_domain>
  include_thinking: true
```

The thinking step produces:

#### 3a. Domain Analysis

- **Entities**: Extract all domain entities (capitalized nouns that represent concepts)
- **Relationships**: Identify relationships (has-a, is-a, depends-on)
- **Glossary**: Build glossary of terms with precise definitions
- **Bounded Contexts**: Identify bounded contexts and aggregates
- **Spec Mapping**: Map each entity to a spec file path (new or existing)

Example output:
```yaml
domain_model:
  entities:
    - name: User
      definition: "A person who authenticates with the system"
      spec_path: specs/domain/user.md
      status: existing  # or "new"
    - name: Session
      definition: "An authenticated period of user activity"
      spec_path: specs/domain/session.md
      status: new
  relationships:
    - "User has-many Sessions"
    - "Session belongs-to User"
  glossary_terms:
    - term: Authentication
      definition: "Process of verifying user identity"
    - term: Token
      definition: "JWT credential for session management"
  bounded_contexts:
    - name: Identity
      entities: [User, Session, Token]
    - name: Analytics
      entities: [Dashboard, Metric]
```

#### 3b. Specs Directory Impact

Show before/after of `specs/` directory:

```yaml
specs_impact:
  before:
    - specs/domain/user.md
    - specs/api/users.md
  after:
    - specs/domain/user.md          # MODIFIED
    - specs/domain/session.md       # NEW
    - specs/domain/auth-token.md    # NEW
    - specs/api/users.md
    - specs/api/auth.md             # NEW
  changes_summary:
    - path: specs/domain/user.md
      action: modify
      description: "Add sessions relationship, lastLogin field"
    - path: specs/domain/session.md
      action: create
      description: "New entity for user sessions"
```

#### 3c. Gap Analysis

Identify what's missing or assumed:

```yaml
gaps_identified:
  - "Password policy requirements not specified"
  - "Session timeout duration not defined"
  - "Email verification flow not detailed"
```

#### 3d. API-First Ordering

Reorder items for API-first implementation:

```yaml
recommended_order:
  1. API Contracts / Interfaces
  2. Data Models / Database
  3. Backend Services / Business Logic
  4. Frontend Components / UI
  5. Infrastructure / DevOps
```

### Step 4: Display Thinking Output

Show the analysis to user for review:

```
═══════════════════════════════════════════════════════════════
 DOMAIN ANALYSIS
═══════════════════════════════════════════════════════════════

ENTITIES IDENTIFIED:
  User          → specs/domain/user.md (existing, will modify)
  Session       → specs/domain/session.md (NEW)
  AuthToken     → specs/domain/auth-token.md (NEW)

RELATIONSHIPS:
  User ─────┬──── has-many ───→ Session
            └──── owns ───────→ AuthToken

SPECS IMPACT:
  Before: 2 files in specs/
  After: 4 files in specs/ (+2 new, 1 modified)

GAPS IDENTIFIED:
  - Password policy requirements not specified
  - Session timeout duration not defined

IMPLEMENTATION ORDER (API-first):
  1. 01-registration (API contracts first)
  2. 02-authentication (depends on 01)
  3. 03-password-reset (depends on 02)

Continue with this analysis? [Y/n]
```

### Step 5: Create Workflow Items

For each item in the decomposition:

```yaml
INVOKE workflow-state.create_item with:
  workflow_id: <workflow_id>
  id: <NN-slug>
  title: <Title>
  type: feature | epic
  parent_id: <epic-id if nested>
  context_sections: <sections from external spec>
  depends_on: <dependencies>
```

### Step 6: Create Context Files

For each leaf item, create `context.md` in drafts:

```markdown
# Context: Registration

> Extracted from: .sdd/archive/external-specs/20260205-feature-spec.md

## Original Content

[Full section content from external spec]

## Domain Analysis

### Entities
- User (new/existing)
- ...

### Specs Impact
- specs/domain/user.md (modify)
- ...

## Gaps Identified
- Password policy not specified

---
Note: This context is read-only. Use it as input during spec solicitation.
```

### Step 7: Return Summary

```yaml
success: true
external_spec_archived: ".sdd/archive/external-specs/20260205-feature-spec.md"
workflow_id: a1b2c3
items_created: [...]
thinking_output:
  domain_model: {...}
  specs_impact: {...}
  gaps_identified: [...]
  recommended_order: [...]
first_item:
  change_id: a1b2-1
  title: Registration
  status: pending
```

## Key Differences from Previous Version

| Before | After |
|--------|-------|
| Created SPEC.md + PLAN.md immediately | Creates workflow items with context only |
| Archived to `archive/` | Archives to `.sdd/archive/external-specs/` |
| No domain analysis | Comprehensive thinking step with domain extraction |
| Order in session only | Order persisted in workflow.yaml |
| All specs created upfront | Specs created one at a time through solicitation |

## Dependencies

This skill orchestrates:
- `workflow-state` - Creates workflow and items
- `spec-decomposition` - Analyzes spec structure with thinking step

This skill is called by:
- `/sdd-change new --spec` command

## Notes

- External specs are archived ONCE, then never read again by implementation
- Context files contain extracted content for use during solicitation
- All domain analysis output is preserved in context files
- Items are processed one at a time - user reviews each spec before moving to next
- Hierarchical decomposition is mandatory for specs meeting criteria (2+ H1 with H2+)
- Numbers indicate implementation order based on API-first dependency sort
