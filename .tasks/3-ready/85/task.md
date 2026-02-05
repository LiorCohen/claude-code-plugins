---
id: 85
title: External spec workflow UX and architecture improvements
priority: high
status: ready
created: 2026-02-05
depends_on: []
blocks: []
---

# Task 85: External spec workflow UX and architecture improvements

## Description

Several issues identified with the external spec workflow that need to be addressed together:

### 1. Modal Dialog Disruption
After spec decomposition, a modal dialog is displayed asking the user to make a decision before they've had time to read the suggestions. This should be replaced with a simple textual question without a dialog.

### 2. Redundant Tech Stack Questions
Planning skills should not ask about technical stack as this is predefined in the project's components. The stack is already defined and asking creates confusion.

### 3. File Links Not Clickable
File references should be shown as clickable links to make navigation easier. Ideally VSCode should open markdown files in preview mode.

### 4. Missing Spec Frontmatter Validation
Spec files have no frontmatter YAML! This needs validation to ensure all spec files have proper metadata.

### 5. Naive External Spec Processing
The current external spec processing is extremely naive:
- Does not separate between design details (UI/UX, user flows, visual requirements) and domain details (business logic, data models, rules)
- This separation is critical for proper spec decomposition

### 6. External vs Internal Spec Distinction
External specs should always be assumed to be **product specs** (WHAT and WHY - user needs, business value).
Internal specs are **tech specs** requiring different rigor (HOW - implementation details, architecture decisions, technical constraints).

The two spec types need different validation rules, required sections, and decomposition approaches.

### 7. .sdd Directory Should Not Be Gitignored
Nothing inside the `.sdd/` directory should be in `.gitignore`. The SDD artifacts (specs, plans, settings) are part of the project and should be version controlled.

### 8. External Spec → Tech Spec Transformation Before Decomposition
The first step when integrating an external spec should be to **transform it into a tech spec** before decomposing.

**Key assumption: External specs are always incomplete.** They may be:
- Lacking details not thought through by product people
- Missing technical implications not considered by non-engineers
- Incomplete extractions from existing codebases
- Missing edge cases, error handling, and non-functional requirements

The transformation should:

1. **Classify information types:**
   - Domain knowledge (business concepts, terminology, data relationships)
   - Constraints (technical limitations, business rules, compliance)
   - Requirements (must-have behaviors, acceptance criteria)
   - Design details (UI/UX, user flows, visual specifications)

2. **Identify gaps and missing information:**
   - What requirements are implied but not stated?
   - What edge cases are undefined?
   - What non-functional requirements are missing?
   - What terminology is ambiguous?

3. **Ask clarification questions:**
   - Fill critical gaps by asking the user
   - Extrapolate reasonable defaults where possible
   - Document assumptions when user doesn't know

4. **Discover required component types:**
   - Use classified requirements to determine which components are needed
   - This is done by the component-discovery skill, not by asking the user about tech stack

## Acceptance Criteria

- [ ] Modal dialogs replaced with non-blocking conversational interaction
- [ ] Freeform text responses supported (not just multiple choice)
- [ ] Multi-turn conversations supported for complex answers
- [ ] Planning skills no longer ask about technical stack
- [ ] File references shown as clickable links (especially in "spec ready for review" notifications)
- [ ] Spec file frontmatter validation added with clear error messages
- [ ] External spec processing separates design vs domain details
- [ ] External specs treated as product specs, internal specs as tech specs
- [ ] Different validation/rigor levels for each spec type
- [ ] .sdd directory contents not gitignored (ensure version control)
- [ ] External spec transformation step added before decomposition
- [ ] Transformation classifies: domain knowledge, constraints, requirements, design details
- [ ] Transformation identifies gaps and missing information
- [ ] Transformation asks clarification questions for critical gaps
- [ ] Component-discovery asks questions to determine which components are needed
- [ ] Component-specific discovery questions defined (backend, API, frontend, infra)
- [ ] UI/UX speccing asks user for visual assets (if not already in spec)
- [ ] Solicitation asks deep-dive questions for identified components
- [ ] Backend/API/Database requirements derived from frontend descriptions
- [ ] Derivation follows YAGNI - only operations visible in UI, no speculative full CRUD
- [ ] Solicitation depth weighted toward areas external specs lack (backend > frontend)
- [ ] Assumptions documented when user doesn't know the answer
- [ ] All Q&A preserved in SPEC.md (never lose user feedback)
- [ ] Questions timestamped and categorized by phase (transformation, discovery, solicitation)
- [ ] Multi-turn conversations captured as threaded exchanges
- [ ] Open questions tracked in SPEC.md and block approval until resolved
- [ ] Questions can be answered, assumed, or deferred (with justification)
- [ ] Specs contain only user-confirmed content (no speculative additions or "future ideas")
- [ ] Component-discovery skill determines required components (no tech stack questions)
- [ ] Spec phase produces SPEC.md only - no system changes, no PLAN.md
- [ ] Large specs: multiple SPEC.md files may be created before any PLAN.md
- [ ] Plan phase is separate and only starts after spec approval
- [ ] Review phase follows implementation with user approval required
- [ ] Implementation not complete until user approves in review phase
- [ ] Component-discovery never modifies sdd-settings.yaml (documents in SPEC.md only)
- [ ] Spec dependencies tracked and displayed clearly to user
- [ ] Changes to a spec trigger review of dependent specs
- [ ] Dependency chain shown when editing specs with dependents
- [ ] Phase regression supported (go back to earlier phase when issues discovered)
- [ ] Regression preserves valid work and archives discarded work
- [ ] Regression shows cascade effects on dependent items before confirming
- [ ] Decomposition can be revised during spec writing (merge/split/reorder/add/remove)
- [ ] Revised specs are archived, not deleted
- [ ] Progress display updates correctly after decomposition revision
- [ ] Workflow progress visualization built-in to all multi-step workflows
- [ ] User always sees: what's done, what's current, what's next, what's remaining
- [ ] Large specs (>15K tokens) handled via chunked processing
- [ ] Per-section progress shown during large spec transformation
- [ ] Cross-section dependencies preserved when merging chunked results
- [ ] Documentation updated to reflect all changes
