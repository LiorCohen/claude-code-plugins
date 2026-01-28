---
name: external-spec-integration
description: Process external specifications into change specs with decomposition and user adjustment.
---

# External Spec Integration Skill

Processes external specification files into the SDD change structure, with optional multi-change decomposition.

## Purpose

When a user provides an external specification via `--spec`:
- Copy the external spec to the archive (`specs/external/`)
- Analyze the spec for potential decomposition into multiple changes
- Present decomposition options to user for adjustment
- Create change specifications using the `change-creation` skill
- Update shared files (INDEX.md, glossary)

## When to Use

- During `/sdd-init --spec <path>` when external spec is provided
- For standalone spec import: `/sdd-import-spec <path>`

## Input

| Parameter | Required | Description |
|-----------|----------|-------------|
| `spec_path` | Yes | Absolute path to the external specification file |
| `target_dir` | Yes | Absolute path to the project directory |
| `primary_domain` | Yes | Primary domain for the project |

## Output

```yaml
success: true
external_spec_archived: "specs/external/original-spec.md"
changes_created:
  - name: "user-authentication"
    path: "specs/changes/2026/01/25/user-authentication/"
    type: "feature"
  - name: "password-reset"
    path: "specs/changes/2026/01/25/password-reset/"
    type: "feature"
suggested_order: ["user-authentication", "password-reset"]
shared_concepts_added: ["User", "Session", "Token"]
```

## Workflow

### Step 1: Copy External Spec to Archive

1. Determine the original filename from the spec path
2. Copy to: `specs/external/<original-filename>`
3. Display: "Copied external spec to: specs/external/<filename>"

### Step 2: Analyze Spec for Decomposition

Use the `spec-decomposition` skill to analyze the external spec:

```
INVOKE spec-decomposition skill with:
  spec_content: <content of the external spec>
  spec_path: <original path>
  default_domain: <primary_domain>
```

The skill returns a `DecompositionResult` with:
- `is_decomposable`: Whether the spec can be split
- `changes`: List of identified changes with metadata
- `shared_concepts`: Domain concepts used across changes
- `suggested_order`: Recommended implementation sequence
- `warnings`: Any issues detected

### Step 3: Handle Decomposition Result

**If `is_decomposable` is false:**
- Display any warnings
- Display: "This spec will be implemented as a single change."
- Proceed to Step 4 with single change

**If `is_decomposable` is true:**

Present the decomposition to the user:

```
I've identified N changes in this specification:

[c1] change-name (Domain) - feature - COMPLEXITY
     Brief description (1 line)
     Sections: "Section A", "Section B"
     Endpoints: METHOD /path, METHOD /path
     Dependencies: none

[c2] another-change (Domain) - feature - COMPLEXITY
     Brief description
     Sections: "Section C"
     Endpoints: METHOD /path
     Dependencies: c1

...

Shared concepts (will be added to domain glossary):
  - Concept1, Concept2, Concept3

Suggested implementation order: c1 → c2 → c3 → ...

Options:
  [A] Accept this breakdown
  [M] Merge changes (e.g., "merge c2 c3")
  [S] Split a change (e.g., "split c4")
  [R] Rename a change (e.g., "rename c1 new-name")
  [T] Change type (e.g., "type c2 bugfix")
  [K] Keep as single spec (skip decomposition)
  [C] Cancel
```

### Step 4: Handle User Adjustments

Process user adjustments in a loop:

| Option | Action |
|--------|--------|
| **[A] Accept** | Proceed to Step 5 with accepted changes |
| **[M] Merge** | Use merge operation from spec-decomposition, re-display |
| **[S] Split** | Ask for split criteria, use split operation, re-display |
| **[R] Rename** | Use rename operation, re-display |
| **[T] Change type** | Update change type (feature/bugfix/refactor), re-display |
| **[K] Keep as single** | Create single change containing all content |
| **[C] Cancel** | Return with cancelled status |

Continue until user accepts or cancels.

### Step 5: Create Change Specifications

For each accepted change, invoke the `change-creation` skill:

```
INVOKE change-creation skill with:
  name: <change-name>
  type: <feature|bugfix|refactor>
  title: <Change Title>
  description: <extracted description>
  domain: <primary_domain or detected>
  issue: TBD
  user_stories: <extracted user stories>
  acceptance_criteria: <extracted ACs>
  api_endpoints: <extracted endpoints>
  external_source: ../../external/<filename>
  decomposition_id: <uuid> (if multi-change)
  prerequisites: <prerequisite change names> (if dependencies)
```

### Step 6: Update Shared Files

**Update INDEX.md with External Specifications table:**

```markdown
## External Specifications

| Source | Imported | Changes |
|--------|----------|---------|
| [<filename>](external/<filename>) | YYYY-MM-DD | change-1, change-2, ... |
```

**Update domain glossary with shared concepts:**

Add extracted shared concepts from decomposition to `specs/domain/glossary.md`.

### Step 7: Return Summary

Display completion summary:

```
External spec processed successfully!

External spec copied to: specs/external/<filename>
Created N change specifications:
  - specs/changes/YYYY/MM/DD/change-1/ (feature)
  - specs/changes/YYYY/MM/DD/change-2/ (feature)

Suggested implementation order: change-1 → change-2 → ...

Next step: Start with the first change:
  /sdd-implement-change specs/changes/YYYY/MM/DD/change-1
```

## Examples

### Example 1: Multi-Change Decomposition

```
Input:
  spec_path: /tmp/user-management-spec.md
  target_dir: /home/dev/my-app
  primary_domain: "User Management"

[Spec contains: user registration, login, password reset, profile management]

Agent: I've identified 4 changes in this specification:

[c1] user-registration (User Management) - feature - MEDIUM
     User registration with email verification
     Sections: "Registration", "Email Verification"
     Endpoints: POST /users, POST /users/verify
     Dependencies: none

[c2] user-authentication (User Management) - feature - MEDIUM
     Login and session management
     Sections: "Login", "Sessions"
     Endpoints: POST /auth/login, DELETE /auth/logout
     Dependencies: c1

[c3] password-reset (User Management) - feature - SMALL
     Password reset flow
     Sections: "Password Reset"
     Endpoints: POST /auth/reset, POST /auth/reset/confirm
     Dependencies: c2

[c4] profile-management (User Management) - feature - SMALL
     User profile CRUD
     Sections: "Profile"
     Endpoints: GET /users/me, PATCH /users/me
     Dependencies: c1

Shared concepts: User, Session, Token, Email
Suggested order: c1 → c2 → c3 → c4

Options: [A] Accept [M] Merge [S] Split [R] Rename [T] Type [K] Keep single [C] Cancel

User: A

Output:
  success: true
  external_spec_archived: "specs/external/user-management-spec.md"
  changes_created:
    - {name: "user-registration", path: "specs/changes/2026/01/25/user-registration/", type: "feature"}
    - {name: "user-authentication", path: "specs/changes/2026/01/25/user-authentication/", type: "feature"}
    - {name: "password-reset", path: "specs/changes/2026/01/25/password-reset/", type: "feature"}
    - {name: "profile-management", path: "specs/changes/2026/01/25/profile-management/", type: "feature"}
  suggested_order: ["user-registration", "user-authentication", "password-reset", "profile-management"]
  shared_concepts_added: ["User", "Session", "Token", "Email"]
```

### Example 2: User Merges Changes

```
Agent: [displays 4 changes as above]

User: merge c3 c4

Agent: Merged "password-reset" and "profile-management" into "user-account-management".

[c1] user-registration - feature - MEDIUM
     ...

[c2] user-authentication - feature - MEDIUM
     ...

[c3] user-account-management - feature - MEDIUM
     Password reset and profile management
     Sections: "Password Reset", "Profile"
     Endpoints: POST /auth/reset, POST /auth/reset/confirm, GET /users/me, PATCH /users/me
     Dependencies: c2

Suggested order: c1 → c2 → c3

Options: [A] Accept [M] Merge [S] Split [R] Rename [T] Type [K] Keep single [C] Cancel

User: A
```

### Example 3: Keep as Single Spec

```
Agent: [displays 4 changes]

User: K

Agent: Keeping as single change. Creating unified change spec...

Output:
  success: true
  external_spec_archived: "specs/external/user-management-spec.md"
  changes_created:
    - {name: "user-management", path: "specs/changes/2026/01/25/user-management/", type: "feature"}
  suggested_order: ["user-management"]
```

## Dependencies

This skill orchestrates:
- `spec-decomposition` - Analyzes spec for multi-change breakdown
- `change-creation` - Creates individual change directories

## Notes

- This skill is conversational and handles user interaction
- Always preserves the original external spec in `specs/external/`
- Decomposition is optional - user can always keep as single spec
- Dependencies between changes are tracked and affect suggested order
