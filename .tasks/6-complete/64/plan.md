---
title: Refactor planning system architecture
created: 2026-01-31
updated: 2026-01-31
---

# Plan: Refactor Planning System Architecture

## Problem Summary

The current planning system has blurred boundaries between skills (interactive, main context) and agents (non-interactive, subagent). The `planner` and `spec-writer` agents duplicate functionality that should live in skills, and Phase 0 (domain documentation) happens during implementation when it should be specified during planning.

This refactor establishes clear separation: **skills handle all planning (interactive)**, **agents handle execution only (non-interactive)**. Plans become dynamically generated from `sdd-settings.yaml` rather than using rigid templates.

## Key Architectural Changes

### 1. Agent Consolidation
- Remove `planner` agent → merge into `change-creation` skill
- Remove `spec-writer` agent → merge into `change-creation` skill

### 2. Domain Documentation During Planning
- Plan explicitly specifies glossary terms, definitions, and doc updates
- Implementation simply executes those specifications (no discovery)

### 3. Dynamic Phase Generation
Phases generated from `sdd-settings.yaml`:
1. Read components from settings
2. Identify affected components for this change
3. Order by dependency graph: `config → contract → server → webapp → helm`
4. Assign agents contextually (component + change nature)

### 4. Component Dependency Graph
```
config ──────┐
             │
contract ────┼──→ server (includes DB) ──→ helm
             │           │
             │           ↓
             └───────→ webapp
```

### 5. Testing Split
- **Unit tests**: TDD during implementation (backend-dev, frontend-dev)
- **Integration/E2E**: Separate phase after implementation (tester)

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/agents/planner.md` | **DELETE** - planning moves to change-creation skill |
| `plugin/agents/spec-writer.md` | **DELETE** - spec writing moves to change-creation skill |
| `plugin/skills/change-creation/SKILL.md` | Major refactor - absorb planner/spec-writer, add dynamic phase generation |
| `plugin/skills/planning/SKILL.md` | Remove Phase 0, update templates to be dynamic-ready, remove `spec-writer` reference (line 67) |
| `plugin/commands/sdd-implement-change.md` | Remove Phase 0 logic, simplify to execute plan as-is |
| `plugin/commands/sdd-new-change.md` | Add domain documentation prompts to interactive mode (external spec mode already done in #65) |

**Note:** Task #65 already moved external spec handling from `sdd-init` to `sdd-new-change --spec`. The external spec mode is fully functional.

## Implementation Phases

### Phase 1: Update Planning Skill Templates

**Goal:** Remove Phase 0 from templates, prepare for dynamic generation

**Changes to `plugin/skills/planning/SKILL.md`:**
1. Remove Phase 0 (Domain Documentation) from feature template
2. Add new section: "Domain Documentation in Spec"
   - Explain that domain changes are specified in SPEC.md, not PLAN.md
3. Add "Dynamic Phase Generation" section
   - Document how phases are generated from sdd-settings.yaml
   - Include dependency graph reference
   - Show agent assignment rules table
4. Update bugfix/refactor templates to be component-aware

**Verification:**
- [ ] Phase 0 removed from all plan templates
- [ ] Domain documentation guidance moved to spec section
- [ ] Dynamic generation documented

### Phase 2: Refactor Change-Creation Skill

**Goal:** Absorb planner/spec-writer responsibilities, implement dynamic phases

**Changes to `plugin/skills/change-creation/SKILL.md`:**

1. **Add Domain Documentation Section to SPEC.md Templates**
   - New section: `## Domain Updates` with subsections:
     - `### Glossary Terms` - exact terms to add/modify
     - `### Definition Specs` - domain definition files to create/update
     - `### Architecture Docs` - architecture doc updates if needed

2. **Add Dynamic Phase Generation Logic**
   - New section: "Phase Generation Algorithm"
   - Input: change type, affected components from SPEC.md
   - Steps:
     1. Read `sdd-settings.yaml` for project components
     2. Filter to affected components
     3. Order by dependency: config → contract → server → webapp → helm
     4. For each component, assign agent based on (component + change nature):
        ```
        | Component | Agent |
        |-----------|-------|
        | contract | api-designer |
        | server | backend-dev |
        | webapp | frontend-dev |
        | helm | devops |
        | config (backend) | backend-dev |
        | config (frontend) | frontend-dev |
        | config (infra) | devops |
        ```
     5. Add final phase: tester for integration/E2E
     6. Add final phase: reviewer

3. **Update PLAN.md Generation**
   - Replace static templates with dynamic generation
   - Each phase specifies:
     - Component name and type
     - Agent to invoke
     - Specific work items from SPEC.md
     - Unit test requirements (TDD)

4. **Absorb Spec-Writer Guidance**
   - Move frontmatter validation rules from spec-writer
   - Move acceptance criteria format (Given/When/Then)
   - Move Git lifecycle documentation

5. **Absorb Planner Guidance**
   - Move phase structure rules
   - Move PR size guidelines (<400 lines target, 800 max)
   - Move dependency tracking requirements

**Verification:**
- [ ] Domain Updates section in all SPEC.md templates
- [ ] Phase generation algorithm documented
- [ ] Agent assignment table complete
- [ ] Spec-writer rules absorbed
- [ ] Planner rules absorbed

### Phase 3: Update sdd-implement-change Command

**Goal:** Simplify execution - no more Phase 0 discovery

**Changes to `plugin/commands/sdd-implement-change.md`:**

1. **Remove Phase 0 Execution Block**
   - Delete Step 2 (Execute Phase 0) entirely
   - Phase 0 no longer exists in plans

2. **Add Domain Documentation Execution**
   - New early step: "Execute Domain Updates from SPEC.md"
   - Read SPEC.md `## Domain Updates` section
   - Execute changes exactly as specified:
     - Update glossary with listed terms
     - Create/update definition specs as listed
     - Update architecture docs as listed
   - No discovery, no LLM reasoning - pure execution

3. **Simplify Phase Execution**
   - Read phases from PLAN.md
   - Execute each phase by invoking specified agent
   - Agents receive:
     - Full SPEC.md for context
     - Their specific phase from PLAN.md
     - Component directory from sdd-settings.yaml

4. **Update Testing Phase**
   - Unit tests: already done by component agents (TDD)
   - Final testing phase: invoke tester for integration/E2E only

**Verification:**
- [ ] Phase 0 block removed
- [ ] Domain updates execute from SPEC.md
- [ ] Phase execution uses dynamic agent assignment
- [ ] Testing phase is integration/E2E only

### Phase 4: Update sdd-new-change Command

**Goal:** Add domain documentation prompts to interactive mode

**Note:** Task #65 already implemented external spec mode (`--spec`). This phase focuses on domain documentation integration.

**Changes to `plugin/commands/sdd-new-change.md`:**

1. **Update Interactive Mode Prompts**
   - Add prompts for domain documentation:
     - "What glossary terms need to be added/updated?"
     - "What domain definitions are involved?"
   - Pass collected domain info to change-creation skill

2. **Update External Spec Mode** (already has `--spec` from #65)
   - Ensure spec-decomposition extracts domain concepts from imported specs
   - Pass domain info through to change-creation skill

3. **Remove Planner/Spec-Writer References**
   - Update any documentation that mentions these agents
   - Point to change-creation skill instead

**Verification:**
- [ ] Domain prompts added to interactive mode
- [ ] External spec mode handles domain extraction
- [ ] No references to removed agents

### Phase 5: Delete Agents

**Goal:** Remove deprecated agents

**Actions:**
1. Delete `plugin/agents/planner.md`
2. Delete `plugin/agents/spec-writer.md`
3. Update/remove references in codebase:
   - `plugin/skills/change-creation/SKILL.md:387` - references `spec-writer`
   - `plugin/skills/planning/SKILL.md:67` - references `spec-writer`

**Verification:**
- [ ] `plugin/agents/planner.md` deleted
- [ ] `plugin/agents/spec-writer.md` deleted
- [ ] No dangling references in codebase (run `grep -r "planner\|spec-writer" plugin/` excluding test examples)

### Phase 6: Integration Testing

**Goal:** Verify end-to-end workflow

**Test Scenarios:**
1. **New Feature via Interactive Mode**
   - Run `sdd-new-change --type feature --name test-feature`
   - Verify SPEC.md has Domain Updates section
   - Verify PLAN.md has dynamic phases based on sdd-settings.yaml
   - Verify phases are in dependency order

2. **New Feature via External Spec**
   - Import an external spec with `sdd-new-change --spec <path>`
   - Verify domain concepts extracted
   - Verify generated SPEC.md and PLAN.md are correct

3. **Implement Change**
   - Run `sdd-implement-change` on a generated change
   - Verify domain updates execute first (from SPEC.md)
   - Verify phases execute in dependency order
   - Verify correct agents invoked

4. **Bugfix Flow**
   - Create bugfix, verify simplified plan structure
   - Verify no domain documentation unless specified

**Verification:**
- [ ] Interactive feature creation works
- [ ] External spec import works
- [ ] Implementation executes correctly
- [ ] Bugfix flow works

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking existing changes in progress | Check for any in-progress changes before implementing; document migration path |
| Missing edge cases in dynamic generation | Test with various project configurations (single component, full stack, etc.) |
| Agent assignment ambiguity | Document clear rules in change-creation skill; default to most likely agent |

## Migration Notes

Existing `PLAN.md` files with Phase 0 will still work - the implementation command will simply skip phases that don't match the new structure. New changes will use the dynamic format.

## Success Metrics

- No `planner` or `spec-writer` agents in codebase
- Domain documentation fully specified at planning time
- Phases generated dynamically from project configuration
- Clear skill (interactive) vs agent (execution) separation
