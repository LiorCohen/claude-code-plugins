---
title: sdd-new-change planning regression - filesystem issues
created: 2026-02-02
updated: 2026-02-02
---

# Plan: Fix sdd-new-change External Spec Handling

## Problem Summary

When large external specs are provided to `sdd-new-change --spec`, the system creates a **flat list of unsorted features** with no epics. The epic creation flow exists in documentation but is not being executed.

**Current behavior (broken):**
- Flat decomposition at ONE header level
- ALL items become features (no epics)
- No ordering, no dependencies
- Epic logic documented but never triggered
- **No product discovery** - domain entities, personas, workflows not extracted

**Expected behavior:**
- **Product discovery runs first** - extracts domain knowledge from external spec
- H1 sections → **numbered EPICS** (01-epic-name, 02-epic-name)
- H2/H3 sections → **numbered FEATURES** within epics (01-feature, 02-feature)
- Order indicates implementation sequence (topological sort by dependencies)
- **Domain specs updated** - glossary, definitions, use-cases populated from discovery

## Expected Filesystem Structure

For a large external spec:

```
project/
├── specs/
│   ├── domain/
│   │   └── glossary.md
│   └── architecture/
├── changes/
│   ├── INDEX.md                    # Change index (moved from specs/)
│   └── YYYY/MM/DD/
│       ├── 01-epic-user-management/
│       │   ├── SPEC.md
│       │   ├── PLAN.md
│       │   └── changes/
│       │       ├── 01-registration/
│       │       │   ├── SPEC.md
│       │       │   └── PLAN.md
│       │       ├── 02-authentication/
│       │       │   ├── SPEC.md
│       │       │   └── PLAN.md
│       │       └── 03-password-reset/
│       │           ├── SPEC.md
│       │           └── PLAN.md
│       ├── 02-epic-dashboard/
│       │   ├── SPEC.md
│       │   ├── PLAN.md
│       │   └── changes/
│       │       ├── 01-analytics/
│       │       │   ├── SPEC.md
│       │       │   └── PLAN.md
│       │       └── 02-settings/
│       │           ├── SPEC.md
│       │           └── PLAN.md
│       └── 03-epic-billing/
│           ├── SPEC.md
│           ├── PLAN.md
│           └── changes/
│               ├── 01-payments/
│               │   ├── SPEC.md
│               │   └── PLAN.md
│               └── 02-invoices/
│                   ├── SPEC.md
│                   └── PLAN.md
└── archive/
    └── external-spec.md
```

**Key points:**
- Epics are numbered: `01-epic-name`, `02-epic-name`, `03-epic-name`
- Features within epics are numbered: `01-feature`, `02-feature`
- Numbers indicate implementation order (dependencies resolved via topological sort)
- No separate MASTER-PLAN.md needed - order is in the naming

## Files to Modify

| File | Changes |
|------|---------|
| **Product Discovery Integration** | |
| `plugin/commands/sdd-new-change.md` | Add product discovery step before decomposition |
| `plugin/skills/product-discovery/SKILL.md` | Accept spec_outline and spec_path inputs |
| **Core Changes** | |
| `plugin/skills/external-spec-integration/SKILL.md` | Make hierarchical decomposition mandatory for large specs |
| `plugin/skills/spec-decomposition/SKILL.md` | Add `mode: "hierarchical"` for two-level decomposition |
| **INDEX.md Relocation** | |
| `plugin/skills/project-scaffolding/SKILL.md` | Move INDEX.md from `specs/` to `changes/` in docs |
| `plugin/skills/project-scaffolding/templates/specs/INDEX.md` | Move to `templates/changes/INDEX.md` |
| `plugin/skills/change-creation/SKILL.md` | Update INDEX.md path to `changes/INDEX.md` (line 1183) |
| `plugin/system/src/commands/scaffolding/project.ts` | Create INDEX.md in `changes/` not `specs/` (line 532) |
| `plugin/skills/spec-index/SKILL.md` | Update path references from `specs/INDEX.md` to `changes/INDEX.md` |
| `plugin/skills/project-scaffolding/templates/project/CLAUDE.md` | Update INDEX.md path reference (line 48) |
| `plugin/system/src/commands/spec/generate-index.ts` | Update to scan `changes/` and write `changes/INDEX.md` |
| `plugin/system/src/commands/spec/index.ts` | Update help text (line 6) |
| `plugin/system/src/cli.ts` | Update help text (line 46) |
| **Path Fixes** | |
| `plugin/skills/project-scaffolding/SKILL.md` | Fix `specs/changes/` → `changes/` at root |
| **Test Fixes** | |
| `tests/src/tests/workflows/sdd-new-change.test.ts` | Fix `specs/INDEX.md` → `changes/INDEX.md` |
| `tests/src/tests/workflows/sdd-new-change-external-spec.test.ts` | Verify hierarchical output with numbered epics |

## Changes

### 1. Add Product Discovery to sdd-new-change --spec Flow

**Rationale:** When an external spec is provided, we need to understand its domain before decomposition. Product discovery extracts domain entities, personas, and workflows that inform better decomposition and glossary updates.

**Update sdd-new-change.md Step 1b to add product discovery:**

```markdown
### 1b. External Spec Flow (if --spec provided)

1. **Validate spec path** (existing)

2. **Extract outline** (existing)

3. **Run product discovery on the spec** (NEW):
   ```
   INVOKE product-discovery skill with:
     spec_outline: <from step 2>
     spec_path: <absolute path to external spec>
     mode: "external-spec"  # Skip interactive questions, extract from spec
   ```

   The skill reads the spec content and extracts:
   - product_description (from intro/overview section)
   - domain_entities (capitalized nouns, defined terms)
   - user_personas (from user stories, "As a..." patterns)
   - core_workflows (from requirements, acceptance criteria)

   Store results for use in decomposition and domain spec updates.

4. **Check git branch** (existing)

5. **Invoke external-spec-integration** with discovery results:
   ```yaml
   spec_path: <absolute path>
   spec_outline: <from step 2>
   target_dir: <project root>
   primary_domain: <from discovery or sdd-settings.yaml>
   discovery_results:  # NEW
     domain_entities: <from step 3>
     user_personas: <from step 3>
     core_workflows: <from step 3>
   ```
```

**Update product-discovery/SKILL.md to support external spec mode:**

```markdown
## Input

| Parameter | Required | Description |
|-----------|----------|-------------|
| `project_name` | Yes (interactive) | Name of the project |
| `spec_outline` | No | Pre-extracted outline from external spec |
| `spec_path` | No | Path to external spec file |
| `mode` | No | `"interactive"` (default) or `"external-spec"` |

## Mode: external-spec

When `mode: "external-spec"` is provided with `spec_outline` and `spec_path`:

1. **Skip interactive questions** - extract everything from the spec
2. **Read intro section** using outline's line ranges (first H1 or content before first H2)
3. **Extract domain entities:**
   - Capitalized nouns that appear 3+ times
   - Terms in bold or defined inline
   - Glossary entries if present
4. **Extract user personas:**
   - "As a [role]" patterns from user stories
   - Actors mentioned in requirements
5. **Extract core workflows:**
   - Numbered steps or procedures
   - Acceptance criteria patterns
6. **Update domain specs:**
   - Add new terms to `specs/domain/glossary.md`
   - Create definition files in `specs/domain/definitions/`
   - Create use-case files in `specs/domain/use-cases/`
7. **Return results** (no user confirmation needed)
```

### 2. Add Hierarchical Decomposition to spec-decomposition

Add `mode: "hierarchical"` for two-level analysis:

**Input:**
```yaml
mode: "hierarchical"
spec_outline: <pre-extracted outline with line ranges>
```

**Output:**
```yaml
epics:
  - id: e1
    name: user-management
    title: User Management
    order: 1
    source_h1: "# User Management"
    features:
      - id: f1
        name: registration
        order: 1
        dependencies: []
      - id: f2
        name: authentication
        order: 2
        dependencies: [f1]
      - id: f3
        name: password-reset
        order: 3
        dependencies: [f2]
  - id: e2
    name: dashboard
    title: Dashboard
    order: 2
    epic_dependencies: [e1]
    features:
      - id: f4
        name: analytics
        order: 1
      - id: f5
        name: settings
        order: 2
        dependencies: [f4]
  - id: e3
    name: billing
    title: Billing
    order: 3
    epic_dependencies: [e1]
    features: [...]
```

**Ordering algorithm:**
1. Build dependency graph (features depend on other features, epics depend on other epics)
2. Topological sort to determine order
3. Assign numbers: 01, 02, 03, etc.

### 3. Update external-spec-integration Workflow

**Replace Step 2 (outline presentation) with hierarchical detection:**

```
I found the following structure in this spec:

EPICS (from H1 sections):
  01 📦 User Management (lines 10-150)
     ├── 01 Registration
     ├── 02 Authentication
     └── 03 Password Reset

  02 📦 Dashboard (lines 151-300) [depends on: User Management]
     ├── 01 Analytics
     └── 02 Settings

  03 📦 Billing (lines 301-450) [depends on: User Management]
     ├── 01 Payments
     └── 02 Invoices

Total: 3 epics, 8 features
Implementation order: 01 → 02 → 03 (02 and 03 can be parallel after 01)

[Enter] to accept, [C] to cancel
```

**Replace Step 5.5 (optional epic check) with MANDATORY hierarchical creation:**

For specs with multiple H1 sections containing H2+ content:
- Each H1 becomes a numbered epic
- Each H2/H3 within becomes a numbered feature
- This is NOT optional for large specs

**Update Step 7 (creation) to create numbered structure:**

```
For each epic (in order):
  1. Create directory: changes/YYYY/MM/DD/{NN}-epic-{name}/
  2. Create SPEC.md and PLAN.md
  3. Create changes/ subdirectory
  4. For each feature (in order):
     Create: changes/{NN}-{feature-name}/ with SPEC.md and PLAN.md
```

### 4. Move INDEX.md from specs/ to changes/

**Rationale:** INDEX.md tracks changes, so it belongs in `changes/` not `specs/`.

**project-scaffolding/SKILL.md - update directory structure:**

```markdown
### Project Structure

```
project/
├── specs/                    # Static domain knowledge
│   ├── domain/
│   │   ├── glossary.md
│   │   ├── definitions/
│   │   └── use-cases/
│   └── architecture/
├── changes/                  # Change specifications
│   ├── INDEX.md              # Change registry (moved here)
│   └── YYYY/MM/DD/<name>/
├── archive/                  # Archived external specs
└── components/
```
```

**plugin/system/src/commands/scaffolding/project.ts - update file creation:**

```typescript
// Current (incorrect):
['INDEX.md', 'specs/INDEX.md'],

// Fixed:
['INDEX.md', 'changes/INDEX.md'],
```

**change-creation/SKILL.md - update INDEX.md reference:**

```markdown
# Current (incorrect):
Add entry to `specs/INDEX.md`:

# Fixed:
Add entry to `changes/INDEX.md`:

# Links are now relative within changes/:
- [<title>](YYYY/MM/DD/<name>/SPEC.md)
```

**spec-index/SKILL.md - update path references:**

```markdown
# Current (incorrect):
Generates `specs/INDEX.md` from all spec files.
sdd-system spec index --specs-dir specs/

# Fixed:
Generates `changes/INDEX.md` from all change specs.
sdd-system spec index --changes-dir changes/
```

**generate-index.ts - update to scan changes directory:**

```typescript
// Current (incorrect):
const specsDir = named['specs-dir'] ?? 'specs/';
const indexPath = path.join(specsDir, 'INDEX.md');

// Fixed:
const changesDir = named['changes-dir'] ?? 'changes/';
const indexPath = path.join(changesDir, 'INDEX.md');
```

**cli.ts and spec/index.ts - update help text:**

```typescript
// Current:
index       Generate specs/INDEX.md

// Fixed:
index       Generate changes/INDEX.md
```

**project-scaffolding/templates/project/CLAUDE.md - update reference:**

```markdown
# Current (incorrect):
| `specs/INDEX.md` | Registry of all specs |

# Fixed:
| `changes/INDEX.md` | Registry of all change specs |
```

### 5. Fix Test Directory Structure

**sdd-new-change.test.ts:**

```typescript
// Current (incorrect):
await mkdir(joinPath(testProject.path, 'specs', 'changes'));
await writeFileAsync(joinPath(testProject.path, 'specs', 'INDEX.md'), ...);

// Fixed:
await mkdir(joinPath(testProject.path, 'changes'));
await writeFileAsync(joinPath(testProject.path, 'changes', 'INDEX.md'), ...);
```

**sdd-new-change-external-spec.test.ts:**

```typescript
// Current (incorrect - line 144):
await writeFileAsync(joinPath(testProject.path, 'INDEX.md'), ...);

// Fixed:
await writeFileAsync(joinPath(testProject.path, 'changes', 'INDEX.md'), ...);
```

**Enhance external spec test to verify new behavior:**

The test currently only checks that SPEC.md and PLAN.md files exist. Enhance to verify:

1. **Numbered epic directories:**
   ```typescript
   // Verify epic structure with numbered prefixes
   const epicDirs = await findDirs(changesDir, /^\d{2}-epic-/);
   expect(epicDirs.length).toBeGreaterThan(0);
   // Verify order: 01-epic-*, 02-epic-*, etc.
   ```

2. **Numbered feature directories within epics:**
   ```typescript
   // Within each epic, verify numbered features
   const featureDirs = await findDirs(epicDir, /^\d{2}-/);
   expect(featureDirs[0]).toMatch(/^01-/);
   ```

3. **Domain specs updated (product discovery ran):**
   ```typescript
   // Verify glossary was updated
   const glossary = await readFileAsync(joinPath(testProject.path, 'specs/domain/glossary.md'));
   expect(glossary).toContain('User');  // Domain entity extracted
   ```

## Epic Detection Logic

**When to create hierarchical structure:**
- Spec has 2+ H1 sections
- At least one H1 has 2+ H2 subsections

**Numbering rules:**
- Epics: `01-epic-name`, `02-epic-name`, etc.
- Features: `01-feature-name`, `02-feature-name`, etc.
- Numbers based on topological sort of dependency graph
- Independent items can share the same "phase" but get sequential numbers

## Tests

### Unit Tests
- [ ] `test_product_discovery_external_spec_mode` - Extracts entities from spec content
- [ ] `test_product_discovery_extracts_personas` - Finds "As a [role]" patterns
- [ ] `test_hierarchical_creates_numbered_epics` - H1s become 01-epic, 02-epic
- [ ] `test_features_numbered_within_epic` - H2s become 01-feature, 02-feature
- [ ] `test_ordering_respects_dependencies` - Dependencies determine numbers

### Integration Tests
- [ ] `test_external_spec_runs_discovery` - Product discovery invoked before decomposition
- [ ] `test_domain_specs_updated_from_discovery` - Glossary, definitions, use-cases updated
- [ ] `test_large_spec_creates_numbered_hierarchy` - Full structure with numbers
- [ ] `test_index_at_changes_root` - INDEX.md created at `changes/INDEX.md`
- [ ] `test_index_links_relative_within_changes` - Links are `YYYY/MM/DD/...`

## Verification

1. **Run with large external spec:**
   ```bash
   /sdd-new-change --spec /path/to/large-spec.md
   ```

2. **Verify product discovery ran:**
   - Domain entities extracted and displayed
   - Domain specs updated:
     - `specs/domain/glossary.md` - new terms added
     - `specs/domain/definitions/` - new entity definitions created
     - `specs/domain/use-cases/` - new use cases created
   - No interactive questions asked (extracted from spec)

3. **Verify numbered structure:**
   - Epic directories: `01-epic-*`, `02-epic-*`, `03-epic-*`
   - Feature directories within: `01-*`, `02-*`, `03-*`
   - Numbers indicate implementation order

4. **Verify paths:**
   - `changes/` at project root (sibling of `specs/`)
   - `changes/INDEX.md` exists (not `specs/INDEX.md`)
   - `archive/` at project root
   - INDEX.md links use relative paths within changes/ (e.g., `YYYY/MM/DD/...`)
