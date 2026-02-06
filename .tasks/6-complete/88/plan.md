---
title: Remove product-discovery skill
created: 2026-02-06
---

# Plan: Remove product-discovery skill

## Problem Summary

The product-discovery skill handles interactive product requirement gathering (personas, workflows, domain entities). This plugin is for technical specs, not product specs. The skill should be removed along with all references.

## Impact Analysis

### No TypeScript/test/JSON references
- No references in `plugin/system/` (TypeScript source)
- No references in `tests/`
- No references in any `.json` files (manifests, configs)

### Active references (must be updated)

| File | Reference Type | Risk |
|------|---------------|------|
| `plugin/skills/product-discovery/SKILL.md` | The skill itself | **Delete** |
| `plugin/commands/sdd-change.md` | INVOKE in interactive Step 4 + external Step 7 | **High** — workflow steps must be renumbered |
| `plugin/commands/sdd-init.md` | Listed as "deferred to first change" | **Low** — just a bullet point |
| `plugin/skills/component-discovery/SKILL.md` | Input section references product-discovery results | **Medium** — "Interactive Mode (Legacy)" input format |
| `plugin/skills/domain-population/SKILL.md` | Description says "from product discovery" | **Low** — wording only |
| `plugin/skills/external-spec-integration/SKILL.md` | Optional `discovery_results` parameter | **Low** — optional param, not used in steps |
| `docs/commands.md` | "Product discovery" in deferred list | **Low** — bullet point |
| `docs/getting-started.md` | "No upfront product discovery" | **Low** — wording only |
| `docs/tutorial.md` | "SDD guides you through product discovery" | **Medium** — tutorial flow describes it |

### Archived task files (NO changes needed)
- `.tasks/6-complete/*/` — historical records, should not be modified

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/skills/product-discovery/` | Delete entire directory |
| `plugin/commands/sdd-change.md` | Remove product-discovery INVOKE from both flows |
| `plugin/commands/sdd-init.md` | Remove "Product discovery" from deferred list |
| `plugin/skills/component-discovery/SKILL.md` | Remove "Interactive Mode (Legacy)" input section referencing product-discovery |
| `plugin/skills/domain-population/SKILL.md` | Update description wording |
| `plugin/skills/external-spec-integration/SKILL.md` | Remove `discovery_results` parameter |
| `docs/commands.md` | Remove "Product discovery" from deferred list |
| `docs/getting-started.md` | Update wording about product discovery |
| `docs/tutorial.md` | Remove product discovery Q&A from tutorial flow |

## Changes

### 1. Delete product-discovery skill

Remove `plugin/skills/product-discovery/` directory entirely.

### 2. Update sdd-change.md — Interactive Flow (Step 4)

**Current** (lines 128-147): Step 4 "Discovery Skills (Mandatory)" invokes product-discovery, then component-discovery, then domain-population.

**After**: Remove the product-discovery INVOKE. Component-discovery and domain-population remain but need their inputs adjusted:
- Component-discovery currently receives `discovery_results` from product-discovery — change to receive from user's interactive input or remove that dependency
- Domain-population currently receives `discovery_results` — change to receive from the change context directly

Step numbering stays the same (Step 4 still exists, just without product-discovery).

### 3. Update sdd-change.md — External Spec Flow (Step 7)

**Current** (lines 265-274): Step 7 "Product Discovery" invokes product-discovery in external-spec mode.

**After**: Delete Step 7 entirely. Renumber Steps 8-13 to 7-12. The external flow already has transformation (Step 5) and component-discovery (Step 6) which cover what's needed.

### 4. Update component-discovery SKILL.md

**Current** (lines 56-76): "Interactive Mode (Legacy)" input section shows product-discovery output format.

**After**: Remove the "Interactive Mode (Legacy)" section and the reference on line 31 ("During `/sdd-init` after product discovery (interactive mode)"). The skill's primary input is classified_requirements from transformation.

### 5. Update domain-population SKILL.md

**Current** (line 9): "Populates the domain specification files with content extracted from product discovery."

**After**: "Populates the domain specification files with content extracted from change context." General wording fix only.

### 6. Update external-spec-integration SKILL.md

**Current** (line 54): Optional `discovery_results` parameter referencing product-discovery.

**After**: Remove the `discovery_results` row from the input table.

### 7. Update docs/commands.md

**Current** (line 28): "Product discovery" in the "What it does NOT do" list.

**After**: Remove that bullet. Keep "Domain population" if still relevant.

### 8. Update docs/getting-started.md

**Current** (line 122): "No upfront product discovery or architecture decisions"

**After**: "No upfront architecture decisions" (remove "product discovery" mention).

### 9. Update docs/tutorial.md

**Current** (lines 44-57): Describes product discovery Q&A flow during sdd-init.

**After**: Replace with the current minimal init flow (project name detection, environment check, minimal structure creation). The tutorial currently shows `--name` argument which is also outdated.

## Dependencies

1. Delete skill first, then update all references
2. sdd-change.md external flow step renumbering must be done carefully — all step references within the file must be consistent

## Tests

No TypeScript code or tests reference product-discovery, so no test changes needed.

### Manual Verification
- [ ] `grep -ri "product.discovery" plugin/ docs/` returns no results
- [ ] sdd-change.md interactive flow steps are coherent without product-discovery
- [ ] sdd-change.md external flow steps are correctly renumbered
- [ ] component-discovery SKILL.md has no dangling references
- [ ] tutorial.md init section matches current sdd-init behavior

## Verification

- [ ] product-discovery directory no longer exists
- [ ] No remaining references in any active skill or command file
- [ ] sdd-change.md step numbering is consistent in both flows
- [ ] Docs accurately describe current behavior
