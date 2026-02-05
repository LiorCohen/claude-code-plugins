---
id: 85
title: External spec workflow UX and architecture improvements
priority: high
status: complete
created: 2026-02-05
completed: 2026-02-05
depends_on: []
blocks: []
---

# Task 85: External spec workflow UX and architecture improvements ✓

## Summary

Comprehensive workflow architecture improvements for external spec processing, including product/tech spec distinction, four-field status model, phase gating, Q&A preservation, TypeScript enforcement, and extensive documentation updates.

## Details

### TypeScript Implementation
- Added `SpecType` ('product' | 'tech') and `ChangeType` ('feature' | 'bugfix' | 'refactor' | 'epic') types
- Added conditional validation constants: `PRODUCT_SPEC_REQUIRED_FIELDS`, `TECH_SPEC_REQUIRED_FIELDS`
- Updated `validate.ts` with `getRequiredFields()` for spec_type-aware validation
- Product specs require fewer fields (no issue, no sdd_version)
- Tech specs require: title, spec_type, type, status, domain, issue, created, updated, sdd_version

### TypeScript Enforcement for Phase Gating
- Created `plugin/system/src/types/workflow.ts` - Complete workflow type definitions
- Created `plugin/system/src/commands/workflow/check-gate.ts` - Phase gate checking logic
- Created `plugin/system/src/commands/workflow/index.ts` - Command routing
- Updated `cli.ts` to add `workflow` namespace
- Implemented: `checkPlanGate`, `checkImplementGate`, `checkReviewGate`, `checkCompletionGate`
- Added `flattenItems` for epic hierarchy handling
- Added `hasStaleDepdendencies` for needs_rereview detection
- Usage: `sdd-system workflow check-gate --target plan --workflow-file <path>`

### Skill Documentation Updates
- `workflow-state/SKILL.md` - Four-field status model (spec_status, plan_status, impl_status, review_status), phase gating rules, regression support
- `spec-writing/SKILL.md` - Requirements Discovery section template, spec_type field, open questions blocking
- `spec-solicitation/SKILL.md` - Q&A preservation in SPEC.md
- `external-spec-integration/SKILL.md` - Transformation step (classification, gap analysis, clarifications)
- `component-discovery/SKILL.md` - Renamed from component-recommendation, no system modifications
- `planning/SKILL.md` - No tech stack questions
- `product-discovery/SKILL.md` - External mode without tech stack questions
- `project-scaffolding/SKILL.md` - .sdd not gitignored

### Command Documentation Updates
- `sdd-change.md` - New actions: plan, review, answer, assume, regress, request-changes
- `sdd-init.md` - Available Component Types section (Server, Webapp, Database, Contract, Helm, Testing, CI/CD)

### User Documentation Created
- `docs/workflows.md` - Phase gating, review phase, guided workflow
- `docs/external-specs.md` - Transformation, Q&A preservation, large spec handling
- `docs/workflow-progress.md` - Progress visualization, phase tracking, status symbols

### Tests
- 43 validation tests updated for spec_type, change types, and status validation
- Fixed scaffolding integration tests (pluralized database path)
- Added 59 tests for workflow check-gate command
- All 539 tests passing
