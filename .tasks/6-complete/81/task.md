---
id: 81
title: Redesign sdd-change with external spec workflow
priority: high
status: complete
created: 2026-02-05
completed: 2026-02-05
depends_on: [82]
blocks: [83, 84]
---

# Task 81: Redesign sdd-change with external spec workflow ✓

## Description

The current `sdd-change` command has several issues when handling external specs. This task addresses a comprehensive redesign of the workflow.

## Issues to Fix

1. **Redundant copying** - External spec copying happens in 2 places. Need to remove redundancy.

2. **Premature spec creation** - `new-change` should not touch `/specs` before implementation begins.

3. **Implementation order not persisted** - Order just appears in session, which is brittle. Needs to be saved.

4. **Plans created on import** - When importing external specs, don't create plans. Just create specs.

5. **Review-first workflow** - Next steps should point user to review the first item. Only after iterating do we create the plan.

6. **Missing tests in specs** - Generated specs do not include TESTS. This is TDD - tests must be included!

7. **Wrong implementation order** - Why start from UI? Should start from API and backend.

8. **Specs too lean** - Specs don't capture enough information to be useful.

9. **No domain extraction** - No definitions or domain knowledge being extracted formally.

10. **Missing component list** - Specs do not include which components are to be created.

11. **No system thinking** - Specs seem limited to what was in the external spec. No extra thinking done. The base entry point for dev review is very weak.

## Acceptance Criteria

- [ ] External spec copying happens in exactly one place
- [ ] Implementation order is persisted to a file (not just session state)
- [ ] Importing external specs creates specs only, not plans
- [ ] Workflow guides user to review first spec before proceeding
- [ ] Plan created only after user approves spec
- [ ] Implementation blocked until user approves plan
- [ ] All specs include a Tests section with TDD approach
- [ ] Default implementation order is API-first, then backend, then UI
- [ ] Specs include comprehensive detail: context, dependencies, interfaces
- [ ] Specs include comprehensive Domain Model section (entities, relationships, glossary, bounded contexts)
- [ ] Specs include Specs Directory Changes section showing before/after tree and changes summary
- [ ] Each entity is mapped to a spec file path with new/modify status
- [ ] Specs list all components to be created/modified
- [ ] System includes "thinking" step that goes beyond just breaking down the external spec
- [ ] Interactive mode uses spec-solicitation skill to guide requirements gathering
- [ ] Spec solicitation always covers technical architecture (API, backend, database) unless user explicitly opts out
- [ ] Internal workflow-state skill provides API for workflow lifecycle in `.sdd/workflows/`
- [ ] Verification step required after implementation before marking complete
- [ ] All skills maintain full session-independent resumable state in `.sdd/`
- [ ] Zero session context assumed - new session can resume with only file contents (no conversation history)
- [ ] Specs include Requirements Discovery section with full Q&A trail from solicitation
- [ ] Completed workflow items removed from workflow.yaml (keeps manifest lean)
- [ ] Each workflow has a unique ID that appears in the changes path (changes/YYYY/MM/DD/<workflow-id>/NN-slug/)
- [ ] Each change has a workflow-scoped ID (<workflow-short>-<seq>, e.g., a1b2-1) for multi-user safety
- [ ] Completed items from same workflow grouped together under workflow ID folder
- [ ] Items move to `changes/` when ready for review (not after completion)
- [ ] User review and approval happens in `changes/`, not in `.sdd/workflows/drafts/`
