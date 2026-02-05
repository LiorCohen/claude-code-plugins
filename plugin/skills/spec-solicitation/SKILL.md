---
name: spec-solicitation
description: Guided requirements gathering skill for interactive spec creation. Used for ALL spec creation - both interactive and external spec paths.
---

# Spec Solicitation Skill

## Purpose

Guide users through structured requirements gathering to create comprehensive specifications. This skill is used for **ALL** spec creation - both interactive and external spec paths.

## Core Principles

### Zero Session Context

A new session must be able to resume solicitation with ZERO knowledge of prior conversation. All required information is stored in `solicitation-workflow.yaml`:

- Full Q&A history (questions AND answers)
- Current step and question
- Partial answers for spec generation
- Review feedback captured during iteration

### Context-Aware Solicitation

When processing a task from external spec decomposition:
1. Load `context.md` (extracted section from external spec)
2. Pre-populate answers where possible from context
3. Ask clarifying questions for gaps
4. User confirms/refines pre-populated content

When processing a purely interactive change:
1. No context available
2. Full solicitation flow from scratch

### External Specs Are Product-Oriented

Even if the external spec says nothing about backend, API, databases, etc., the solicitation MUST cover all technical aspects. The solicitation adds the technical dimension that product specs lack.

## Input

| Parameter | Required | Description |
|-----------|----------|-------------|
| `change_id` | Yes | The change ID from workflow-state (e.g., `a1b2-1`) |
| `workflow_id` | Yes | The workflow ID (e.g., `a1b2c3`) |
| `context_path` | No | Path to context.md (for external spec items) |
| `resume` | No | If true, resume from solicitation-workflow.yaml |

## Output

```yaml
success: true
spec_content: |
  ---
  title: ...
  ---
  # Spec content...
spec_path: .sdd/workflows/a1b2c3/drafts/01-api-contracts/SPEC.md
status: spec_review  # Ready for user review
```

## solicitation-workflow.yaml Schema

```yaml
started: YYYY-MM-DD HH:MM:SS
last_updated: YYYY-MM-DD HH:MM:SS
current_step: 3                        # Which solicitation step we're on
current_question: "What should the system do?"  # Exact question being asked

# Full Q&A history - questions AND answers
history:
  - step: 1
    category: context_goal
    question: "What problem does this solve?"
    answer: "User authentication is manual and error-prone"
    timestamp: YYYY-MM-DD HH:MM:SS
  - step: 2
    category: context_goal
    question: "Who is the primary user?"
    answer: "End users logging into the application"
    timestamp: YYYY-MM-DD HH:MM:SS
  - step: 3
    category: functional_requirements
    question: "What should the system do?"
    answer: null  # Awaiting response
    timestamp: YYYY-MM-DD HH:MM:SS

# Structured answers for spec generation
answers:
  context_goal:
    problem: "User authentication is manual"
    primary_user: "End users"
    expected_outcome: "Automated login"
  functional_requirements:
    - "Users can register"
    - "Users can login"
  non_functional_requirements:
    performance: null
    security: null
    scalability: null
  user_stories: []
  acceptance_criteria: []
  edge_cases: []
  dependencies: []
  tests:
    unit: []
    integration: []
    e2e: []
  technical_architecture:
    api: null
    data: null
    backend: null
    frontend: null
    infrastructure: null

# Review feedback (captured after spec/plan created)
review_feedback: []
```

## Solicitation Flow

### Step 1: Context & Goal

Questions to ask:
- "What problem does this solve?"
- "Who is the primary user?"
- "What's the expected outcome?"

If context exists from external spec:
- "Based on the external spec, this appears to be about X. Is that correct?"
- Pre-populate answers from context.md
- Ask for confirmation or clarification

### Step 2: Functional Requirements

Questions to ask:
- "What should the system do?" (iterative, can add multiple)
- "What are the main user actions?"
- "What data is involved?"

If context exists:
- "I extracted these requirements from the spec: [list]. Anything to add/modify?"

### Step 3: Non-Functional Requirements

Questions to ask:
- **Performance:** "Any latency/throughput requirements?"
- **Security:** "Authentication? Authorization? Data sensitivity?"
- **Scalability:** "Expected load? Growth expectations?"
- **Reliability:** "Uptime requirements? Failure handling?"

### Step 4: User Stories

Guide through "As a [role], I want [action], so that [benefit]" format.
- Prompt for multiple stories if complex feature
- Ensure all user roles are covered

### Step 5: Acceptance Criteria

For each user story or requirement:
- Prompt for Given/When/Then format
- "How will we know this is working correctly?"
- Ensure criteria are independently testable

### Step 6: Edge Cases & Error Handling

Questions to ask:
- "What could go wrong?"
- "What happens with invalid input?"
- "What are the boundary conditions?"

### Step 7: Dependencies & Constraints

Questions to ask:
- "What existing systems does this interact with?"
- "Any technical constraints or requirements?"
- "What must be true before this can work?"

### Step 8: Tests (TDD)

Questions to ask:
- "What tests would prove this works?"
- Prompt for unit, integration, E2E test ideas
- Each test should map to an acceptance criterion

### Step 9: Technical Architecture

**These questions are always asked** even if external spec is product-only. User can explicitly opt out of each area.

- **API:** "What endpoints are needed? What's the contract?" (or "N/A - no API needed")
- **Data:** "What data models? Database changes?" (or "N/A - no database")
- **Backend:** "What services/logic are needed?" (or "N/A - frontend only")
- **Frontend:** "What UI components? State management?"
- **Infrastructure:** "Deployment considerations? Scaling?"

## Resume Behavior

On resume (when `resume: true`):

1. Read `solicitation-workflow.yaml`
2. Display summary of collected answers so far:
   ```
   Resuming spec solicitation for: API Contracts

   Previously collected:
   - Problem: User authentication is manual
   - Primary user: End users
   - Requirements: 2 collected

   Continuing from: Step 3 - Functional Requirements
   Last question: "What should the system do?"
   ```
3. Continue from `current_step` / `current_question`
4. No conversation history needed - everything is in the file

## Spec Generation

After all questions answered, generate SPEC.md with:

### Required Sections

1. **Standard frontmatter** (title, type, status, etc.)
2. **Overview** with Background and Current State
3. **Original Requirements** (if from external spec - embed full context)
4. **User Stories**
5. **Functional Requirements**
6. **Non-Functional Requirements**
7. **Technical Design** (Architecture, Data Model, Algorithms)
8. **API Contract** (if applicable)
9. **Security Considerations**
10. **Error Handling**
11. **Observability**
12. **Acceptance Criteria** (Given/When/Then format)

### NEW Required Sections

13. **Domain Model**
    - Entities table (Entity, Definition, Spec Path, Status)
    - Relationships diagram
    - Glossary table (Term, Definition, First Defined In)
    - Bounded Contexts list

14. **Specs Directory Changes** (MANDATORY for traceability)
    - Before/After directory tree
    - Changes Summary table (Path, Action, Description)

15. **Components**
    - New Components table (Component, Type, Purpose)
    - Modified Components table (Component, Changes)

16. **System Analysis**
    - Inferred Requirements
    - Gaps & Assumptions
    - Dependencies

17. **Requirements Discovery** (NEW - full Q&A trail)
    - Questions & Answers table (Step, Question, Answer)
    - User Feedback section (clarifications during review)

18. **Testing Strategy**
    - Unit Tests table
    - Integration Tests table
    - E2E Tests table
    - Test Data requirements

19. **Dependencies** (Internal and External)
20. **Migration / Rollback**
21. **Out of Scope**
22. **Open Questions**
23. **References**

## Workflow Integration

After spec generation:

1. Save SPEC.md to drafts location via `workflow_state.save_spec()`
2. Update status to `spec_review` via `workflow_state.update_status()`
3. Move to changes/ via `workflow_state.ready_for_review()`
4. Prompt user to review the spec

## User Feedback Capture

During spec review, when user provides feedback:

1. Capture feedback in `review_feedback` array of solicitation-workflow.yaml
2. Update the spec based on feedback
3. Save updated spec
4. Continue until user approves

## Example Usage

### Interactive Path (No External Context)

```
User: /sdd-change new --type feature --name user-auth

Agent: Starting spec solicitation for: user-auth

Step 1: Context & Goal
What problem does this solve?

User: Users can't log in securely

Agent: Who is the primary user?

User: End users of the application

Agent: What's the expected outcome?

User: Secure login with session management

[... continues through all steps ...]

Agent: Generating SPEC.md from collected requirements...
Agent: Spec created at: changes/2026/02/05/a1b2c3/01-user-auth/SPEC.md
Agent: Please review the spec. When satisfied, run /sdd-change approve spec a1b2-1
```

### External Path (With Context)

```
User: /sdd-change continue

Agent: Resuming workflow a1b2c3
Agent: Current item: API Contracts (a1b2-1)
Agent: Loading context from external spec...

Step 1: Context & Goal
Based on the external spec, this appears to be about:
- Building REST API endpoints for user authentication
- Including login, logout, and session refresh

Is that correct? (yes/no/modify)

User: yes, but also add password reset

Agent: Got it. Adding password reset to the requirements.

[... continues with context-aware questions ...]
```

### Resume Mid-Solicitation

```
User: /sdd-change continue

Agent: Resuming spec solicitation for: API Contracts (a1b2-1)

Previously collected:
  - Problem: User authentication needs API endpoints
  - Primary user: Frontend developers
  - Expected outcome: REST API for auth operations
  - Requirements: 3 collected (login, logout, refresh)

Continuing from: Step 5 - Acceptance Criteria

For the requirement "Users can login with email and password":
What acceptance criteria should we have? (Given/When/Then format)

User: Given valid credentials, when user submits login form, then they receive a JWT token

[... continues ...]
```

## Dependencies

This skill uses:
- `workflow-state` skill - for state management
- `spec-writing` skill - for spec template and formatting

## Notes

- Spec creation is **always collaborative** - external spec content is INPUT, not output
- User always has opportunity to refine, clarify, and approve
- Technical architecture questions are mandatory (user can opt out per area)
- All Q&A is captured for traceability in Requirements Discovery section
