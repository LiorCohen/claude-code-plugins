---
title: External spec workflow UX and architecture improvements
created: 2026-02-05
---

# Plan: External Spec Workflow UX and Architecture Improvements

## Problem Summary

The external spec workflow has multiple UX and architectural issues that impede effective use:
1. Modal dialogs disrupt the flow
2. Redundant questions about tech stack
3. File references aren't clickable links
4. Missing spec frontmatter validation
5. Naive external spec processing (no design/domain separation)
6. No distinction between product specs (external) and tech specs (internal)
7. .sdd directory incorrectly gitignored
8. Missing product-spec → tech-spec transformation step before decomposition

## Key Architectural Insights

### 1. External specs are product specs. Internal specs are tech specs.

### 2. External specs are inherently incomplete.

### 3. Distinct phases: Spec → Plan → Implementation

**Spec phase** (produces SPEC.md files):
- Transform and classify external spec
- Decompose into multiple workflow items (if large spec)
- Create SPEC.md for each item iteratively
- User reviews and approves each SPEC.md
- NO system changes, NO PLAN.md files yet

**Plan phase** (only after spec approval):
- Creates PLAN.md for approved specs
- Defines phases, agents, deliverables
- Documents what system changes will happen

**Implementation phase** (only after plan approval):
- Updates `sdd-settings.yaml` with discovered components
- Scaffolds new components
- Writes code, runs tests

**Review phase** (after implementation):
- User reviews implemented code against SPEC.md
- Verifies acceptance criteria are met
- User approves or requests changes
- Only after approval is the change considered complete

### Important: Large External Specs - Guided Workflow

For large external specs that decompose into multiple epics/changes, **the workflow actively guides users to complete ALL spec work before planning**.

```
External Spec
     │
     ▼
Decomposition → Epic 1 (3 changes), Epic 2 (4 changes), Epic 3 (2 changes)
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  SPEC PHASE - Complete ALL specs before proceeding          │
│                                                             │
│  Epic 1:                                                    │
│    SPEC.md for Change 1.1 → Review → Approve                │
│    SPEC.md for Change 1.2 → Review → Approve                │
│    SPEC.md for Change 1.3 → Review → Approve                │
│                                                             │
│  Epic 2:                                                    │
│    SPEC.md for Change 2.1 → Review → Approve                │
│    SPEC.md for Change 2.2 → Review → Approve                │
│    ... (continue until ALL specs complete)                  │
│                                                             │
│  ═══════════════════════════════════════════════════════    │
│  CHECKPOINT: "All 9 specs created. Ready for planning?"     │
│  ═══════════════════════════════════════════════════════    │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  PLAN PHASE - Only after all specs approved                 │
│                                                             │
│  Create PLAN.md for each approved spec                      │
│  User reviews plans                                         │
│                                                             │
│  ═══════════════════════════════════════════════════════    │
│  CHECKPOINT: "All 9 plans created. Ready to implement?"     │
│  ═══════════════════════════════════════════════════════    │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  IMPLEMENTATION PHASE - By epic/change order                │
│                                                             │
│  For each change:                                           │
│    Implement → Tests pass → Ready for review                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  REVIEW PHASE - User approval required                      │
│                                                             │
│  For each implemented change:                               │
│    User reviews code against SPEC.md                        │
│    Verifies acceptance criteria met                         │
│    Approves or requests changes                             │
│                                                             │
│  ═══════════════════════════════════════════════════════    │
│  CHECKPOINT: "All changes reviewed. Ready to complete?"     │
│  ═══════════════════════════════════════════════════════    │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
  COMPLETE (merge to main)
```

**Workflow guidance messages:**

After decomposition:
```
═══════════════════════════════════════════════════════════════
 DECOMPOSITION COMPLETE
═══════════════════════════════════════════════════════════════

Found 3 epics with 9 total changes:
  Epic 1: User Management (3 changes)
  Epic 2: Dashboard (4 changes)
  Epic 3: Billing (2 changes)

NEXT: Create specs for all changes before planning.
      Starting with: Epic 1, Change 1.1 (Registration)

Run: /sdd-change continue
```

After each spec:
```
═══════════════════════════════════════════════════════════════
 SPEC 3/9 COMPLETE
═══════════════════════════════════════════════════════════════

Completed: [SPEC.md](changes/2026/02/05/.../03-password-reset/SPEC.md)

Progress: 3/9 specs created
Remaining: 6 specs (Epic 2: 4, Epic 3: 2)

NEXT: Continue with Epic 2, Change 2.1 (Analytics)

Run: /sdd-change continue
```

After all specs:
```
═══════════════════════════════════════════════════════════════
 ALL SPECS COMPLETE - READY FOR PLANNING
═══════════════════════════════════════════════════════════════

Created 9 specs across 3 epics:
  Epic 1: User Management (3 specs) ✓
  Epic 2: Dashboard (4 specs) ✓
  Epic 3: Billing (2 specs) ✓

Review all specs before proceeding to planning.

NEXT: Begin planning phase

Run: /sdd-change plan
```

**The workflow GUIDES users through this sequence - it's not optional.**

### 4. All Q&A must be preserved in SPEC.md - never lose user feedback.

**Core Principle:** Every question asked and every answer received during the spec workflow MUST be recorded in the SPEC.md file. This includes:
- Transformation clarification questions and answers
- Component discovery questions and answers
- Solicitation deep-dive questions and answers
- Any follow-up or multi-turn conversation content
- User corrections or overrides
- Assumptions made when user didn't know

**Why this matters:**
- Audit trail: Future readers understand WHY decisions were made
- Context preservation: Decisions can be revisited with full context
- No lost work: User's input is valuable and shouldn't disappear
- Traceability: Each requirement can be traced to a user statement

**Implementation:**
- `spec-solicitation` must append every Q&A to the spec's "Requirements Discovery" section
- Questions should be timestamped and categorized (transformation, discovery, solicitation)
- Answers should include verbatim user response + any interpretation
- Multi-turn conversations should be captured as threaded exchanges
- "I don't know" responses should be recorded with the assumption made

**SPEC.md Requirements Discovery Section Format:**
```markdown
## Requirements Discovery

> Complete Q&A trail from spec solicitation. Never delete entries.

### Transformation Phase

| # | Question | Answer | Source |
|---|----------|--------|--------|
| T1 | What should happen on duplicate email? | Return error, don't reveal if email exists | User |
| T2 | Session timeout duration? | 30 minutes of inactivity | User |
| T3 | Password requirements? | Unknown - using 8+ chars default | Assumption |

### Component Discovery Phase

| # | Question | Answer | Source |
|---|----------|--------|--------|
| D1 | Does data need persistence? | Yes, user accounts and sessions | User |
| D2 | External API consumers? | Mobile app + partner integrations | User |

### Solicitation Phase

| # | Question | Answer | Source |
|---|----------|--------|--------|
| S1 | Entity fields for User? | email, password_hash, created_at, last_login | User |
| S2 | Soft or hard delete for users? | Soft delete with 30-day retention | User |
| S3 | [Follow-up] What happens after 30 days? | Permanent deletion, notify user 7 days before | User |

### User Feedback & Corrections

- [2026-02-05] User corrected: "Admin" role should be "Operator" - updated throughout
- [2026-02-05] User added: Need audit logging for all admin actions

### Open Questions (BLOCKING)

> Questions that must be answered before spec can be approved.

| # | Question | Status | Blocker For |
|---|----------|--------|-------------|
| O1 | What's the rate limit for login attempts? | OPEN | Security section |
| O2 | Should failed logins trigger alerts? | OPEN | Monitoring section |
```

**Open questions block spec approval:**

Specs CANNOT be approved while open questions remain. The workflow enforces this:

```
═══════════════════════════════════════════════════════════════
 SPEC APPROVAL BLOCKED
═══════════════════════════════════════════════════════════════

Cannot approve 02-authentication - 2 open questions remain:

  O1: What's the rate limit for login attempts?
      (Blocks: Security section)

  O2: Should failed logins trigger alerts?
      (Blocks: Monitoring section)

Answer these questions or mark as assumptions:
  /sdd-change answer O1 "5 attempts per minute, then 15-min lockout"
  /sdd-change assume O1 "Industry standard: 5 attempts/min"
```

**Question lifecycle:**

| Status | Meaning |
|--------|---------|
| `OPEN` | Not yet answered - blocks approval |
| `ANSWERED` | User provided answer - recorded in Q&A |
| `ASSUMED` | User said "I don't know" - assumption documented |
| `DEFERRED` | Explicitly moved to later phase (rare, requires justification) |

**Handling open questions:**

1. **Answer directly**: User provides the answer
2. **Mark as assumption**: Use reasonable default, document it
3. **Defer** (with justification): Move to plan/impl phase (e.g., "will determine during load testing")

Deferred questions are tracked and must be resolved before the deferred phase completes.

**CRITICAL: No speculative additions.**

Specs must contain ONLY:
- What the user explicitly stated
- What was derived and CONFIRMED by the user
- Assumptions that were DOCUMENTED and acknowledged

NEVER add:
- "Future ideas" or "nice to haves"
- Features the user didn't ask for
- Speculative enhancements
- Wishlist items

If the agent thinks something is missing, it must be raised as an OPEN QUESTION for the user to answer, not silently added to the spec.

### 5. External specs are inherently incomplete.

**Always assume external specs are lacking:**
- Details not thought through by product people
- Technical implications not considered by non-engineers
- Information not properly extracted from existing codebases
- Edge cases, error handling, and non-functional requirements undefined
- Implicit assumptions never made explicit

**Critical asymmetry in external specs:**

External specs from product/design teams have a predictable pattern:

| Area | Typical Detail Level | Action Required |
|------|---------------------|-----------------|
| **Frontend/UI** | High - mockups, flows, interactions | Extract and classify |
| **UX/Design** | High - visual specs, branding, accessibility | Extract and classify |
| **User Stories** | Medium - happy paths covered | Probe for edge cases |
| **API/Contracts** | Low - rarely specified | Must be derived from UI actions |
| **Backend Logic** | Very Low - business rules implied | Must be extracted through questions |
| **Database/Models** | Very Low - data relationships unclear | Must be discovered from UI + user actions |
| **Non-Functional** | Absent - performance, security not mentioned | Must be explicitly asked |

**Gap analysis should be weighted accordingly:**
- Expect RICH information about: what the user sees, how they interact, visual design
- Expect SPARSE information about: data models, API contracts, business rules, error handling
- The transformation must DERIVE backend requirements from frontend descriptions

**Example derivation:**
```
Frontend spec says: "User sees a list of their orders"
                            ↓
Derived backend needs:
  - Order entity with user relationship
  - GET /orders endpoint filtered by user
  - Pagination (list implies many items)
  - Authorization (user can only see own orders)
  - What fields are shown? → defines API response shape
```

**The transformation must:**
1. Extract and classify what IS present (mostly frontend/UX)
2. **Derive** backend requirements from frontend descriptions
3. Identify what is MISSING or unclear (mostly backend/API/data)
4. Ask targeted questions weighted toward backend gaps
5. Extrapolate reasonable defaults where possible
6. Document assumptions made

The fundamental workflow change is:

```
═══════════════════════════════════════════════════════════════
 SPEC PHASE (produces SPEC.md only, no system changes)
═══════════════════════════════════════════════════════════════

EXTERNAL (product) SPEC
         │
         ▼
┌─────────────────────────────────────┐
│  TRANSFORMATION                     │
│  1. Classify information            │
│  2. Gap analysis                    │
│  3. Clarification questions         │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  COMPONENT DISCOVERY                │
│  - Asks discovery questions         │
│  - Identifies needed components     │
│  - Documents in SPEC.md             │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  DECOMPOSITION (if needed)          │
└─────────────────────────────────────┘
         │
         ▼
      SPEC.md
         │
         ▼
    USER APPROVAL
         │
═══════════════════════════════════════════════════════════════
 PLAN PHASE (only after spec approval)
═══════════════════════════════════════════════════════════════
         │
         ▼
      PLAN.md
         │
         ▼
    USER APPROVAL
         │
═══════════════════════════════════════════════════════════════
 IMPLEMENTATION PHASE (only after plan approval)
═══════════════════════════════════════════════════════════════
         │
         ▼
  Update sdd-settings.yaml
  Scaffold components
  Write code
  Run tests
```

**Note on sdd-settings.yaml**: Component-discovery NEVER modifies this file. It only analyzes requirements and documents needed components in SPEC.md. The `sdd-settings.yaml` is modified during implementation if/when new components are actually created.

## Files to Modify

| File | Changes |
|------|---------|
| [plugin/skills/external-spec-integration/SKILL.md](plugin/skills/external-spec-integration/SKILL.md) | Add transformation step with classification, large spec chunking |
| [plugin/skills/component-recommendation/SKILL.md](plugin/skills/component-recommendation/SKILL.md) | Rename to component-discovery, accept classified input, reduce redundant questions |
| [plugin/skills/spec-decomposition/SKILL.md](plugin/skills/spec-decomposition/SKILL.md) | Update to work with classified content, not raw product spec |
| [plugin/skills/spec-solicitation/SKILL.md](plugin/skills/spec-solicitation/SKILL.md) | Remove tech stack questions, use inline questions not dialogs, **add Q&A preservation to SPEC.md Requirements Discovery section** |
| [plugin/skills/spec-writing/SKILL.md](plugin/skills/spec-writing/SKILL.md) | Add product spec vs tech spec templates, validation rules, **Requirements Discovery section template with Open Questions** |
| [plugin/skills/product-discovery/SKILL.md](plugin/skills/product-discovery/SKILL.md) | Remove tech stack questions for external spec mode |
| [plugin/skills/planning/SKILL.md](plugin/skills/planning/SKILL.md) | Remove tech stack questions |
| [plugin/commands/sdd-change.md](plugin/commands/sdd-change.md) | Update external spec flow, inline questions, remove scaffolding from spec phase, **add new commands: `regress`, `request-changes`, `answer`, `assume`, `plan`, `review`** |
| [plugin/skills/project-scaffolding/SKILL.md](plugin/skills/project-scaffolding/SKILL.md) | Ensure .sdd not in .gitignore template |
| [plugin/skills/workflow-state/SKILL.md](plugin/skills/workflow-state/SKILL.md) | **Major schema redesign** (see note below) |

**⚠️ workflow-state Schema Redesign:**

The current skill uses a single `status` field per item with immediate `spec_approved → plan_review` transition. This plan introduces:

1. **Four separate status fields** for granular tracking:
   - `spec_status`: pending | in_progress | ready_for_review | approved | needs_rereview
   - `plan_status`: pending | in_progress | approved
   - `impl_status`: pending | in_progress | complete
   - `review_status`: pending | ready_for_review | approved | changes_requested

2. **`spec_status: approved` as a resting state** - Current design has "no `spec_approved` resting state" but phase gating requires ALL specs approved before ANY planning starts.

3. **New review phase** after implementation (currently goes implementing → verifying → complete).

4. **New fields**: `progress` (aggregate tracking), `substep` (transformation|discovery|solicitation|writing), `regression` (history tracking).

5. **Phase gating enforcement** with blocking rules.

This is a **fundamental workflow change**, not just an extension.

**Regression archiving mechanism:**
- Use `git stash` to capture uncommitted changes
- Copy implementation files to `.sdd/archive/regressions/<change-id>-<phase>-<date>/`
- Create git patch for committed-but-not-pushed changes
- Record all in regression tracking metadata

## Changes

### 1. New Transformation Step in External Spec Integration

Add a transformation step that runs BEFORE decomposition:

**Step 1: Classification** - Parse the external spec and classify each piece of information:
- **Domain Knowledge**: Business concepts, terminology, entity definitions, data relationships
- **Constraints**: Technical limitations, business rules, compliance requirements, performance targets
- **Requirements**: Must-have behaviors, acceptance criteria, user needs
- **Design Details**: UI mockups, user flows, visual specifications, interaction patterns

**Step 2: Gap Analysis** - Identify what's MISSING or unclear:
- **Missing requirements**: What behaviors are implied but not stated?
- **Undefined edge cases**: What happens when things go wrong?
- **Unclear acceptance criteria**: How do we know it's working?
- **Missing non-functional requirements**: Performance, security, scalability?
- **Ambiguous terminology**: Terms used without definition?
- **Implicit assumptions**: What's assumed but never stated?

**Step 3: Clarification Questions** - Ask the user about gaps:
- Present what was found and what's missing
- Ask targeted questions to fill critical gaps
- Allow user to confirm or override extrapolations
- Document assumptions when user says "I don't know"

**Output Structure** (from transformation):
```yaml
transformation:
  domain_knowledge:
    entities: [...]
    glossary: [...]
    relationships: [...]
  constraints:
    technical: [...]
    business: [...]
    compliance: [...]
  requirements:
    functional: [...]
    non_functional: [...]
    acceptance_criteria: [...]
  design_details:
    ui_specs: [...]
    user_flows: [...]
    visual_requirements: [...]

  # NEW: Gap analysis results
  gaps:
    missing_requirements:
      - "Error handling for failed login not specified"
      - "Password requirements not defined"
    undefined_edge_cases:
      - "What happens if user registers with existing email?"
      - "Session timeout behavior not specified"
    missing_nfrs:
      - "No performance requirements stated"
      - "Security requirements undefined"
    ambiguous_terms:
      - "User" - is this the same as "Account"?
    implicit_assumptions:
      - "Assumes email-based authentication"
      - "Assumes single-tenant deployment"

  # Clarifications obtained from user
  clarifications:
    - question: "What should happen on duplicate email registration?"
      answer: "Return error, don't reveal if email exists"
    - question: "Session timeout duration?"
      answer: "30 minutes of inactivity"

  # Assumptions made (user said "I don't know" or skipped)
  assumptions:
    - "Password minimum 8 characters (industry standard)"
    - "Rate limiting on auth endpoints (security best practice)"
```

### 2. Component Discovery (after transformation)

Rename `component-recommendation` skill to `component-discovery` (better reflects its purpose).

**When component discovery runs:**
- **For external specs**: Runs ONCE after transformation, before decomposition
- Identifies components needed for the ENTIRE scope of the external spec
- Results feed into decomposition (which items need which components)
- Per-item solicitation then asks deep-dive questions for that item's components

**Why run once, not per-item:**
- Component discovery determines the overall architecture
- Decomposed items reference the already-identified components
- Avoids redundant "do you need a database?" questions for every item

The classified requirements feed into component-discovery which:
- Asks targeted discovery questions (see Section 3)
- Analyzes requirements + answers to determine what components are needed
- Maps requirements to component types (e.g., "user login" → server, webapp, database)
- Asks component-specific questions to understand scope
- User confirms/adjusts
- Result is DOCUMENTED in SPEC.md (not written to system files)

**IMPORTANT: Component-discovery is purely analytical.** It:
1. Identifies what components are needed based on requirements
2. Documents them in SPEC.md's "Components" section
3. Makes NO changes to `sdd-settings.yaml` or any system files

Component-discovery NEVER modifies `sdd-settings.yaml`. The spec simply documents what's needed. Implementation decides how/when to update settings.

**This is the existing skill's purpose** - it already takes discovery results and recommends components. We just need to:
1. Feed it classified transformation output
2. Ensure it doesn't ask redundant questions (the requirements already tell us what's needed)
3. Ensure it does NOT trigger scaffolding

```yaml
# Input to component-discovery (from transformation)
classified_requirements:
  functional:
    - "Users can register with email"
    - "Users can login"
    - "Dashboard shows analytics"
  non_functional:
    - "API latency < 200ms"
    - "Support 10k concurrent users"

# Output from component-discovery
recommended_components:
  - type: server
    reason: "Backend for auth + analytics"
  - type: webapp
    reason: "Dashboard UI"
  - type: database
    reason: "User data persistence"
  - type: contract
    reason: "API definition"
```

### 3. Component Discovery Questions

Component-discovery uses targeted questions to determine WHICH components are needed. These questions guide the discovery process.

#### Discovery Questions (determine if component needed)

| Question | If Yes → Component |
|----------|-------------------|
| Does data need to be persisted? | **database** |
| Are there user actions that modify data? | **server** |
| Do external clients need to call this system? | **contract** |
| Is there a user interface? | **webapp** |
| Does this need to be deployed to Kubernetes? | **helm** |

#### Component-Specific Discovery Questions

Once a component type is identified, ask deeper questions to understand scope.

**IMPORTANT**: Backend/API/Database questions require more depth since external specs rarely cover these areas. Frontend questions can often be answered directly from the spec.

**Backend (server + database)** - HIGH PRIORITY, DERIVE FROM UI

External specs won't **necessarily** have this info. Must be derived from UI descriptions + explicit questions.

**YAGNI Principle**: Only derive operations that are explicitly shown in the UI. Do NOT assume full CRUD for every entity. If the UI only shows a list view, don't assume Create/Update/Delete endpoints exist.

| Category | Discovery Question | Derivation Hint |
|----------|-------------------|-----------------|
| **Entities** | What pieces of data need to be stored? | Look at what's DISPLAYED in UI |
| **Relationships** | What are the relationships between data? | Look at lists, dropdowns, links between screens |
| **User Actions** | What user actions modify data? | Look at buttons, forms, CTAs in mockups |
| **Action Effects** | How does each action affect data? | "Save" = Create/Update, "Delete" = Delete - **only operations visible in UI** |
| **Business Rules** | What validation/constraints apply? | Often missing - verify or ask explicitly |
| **Authorization** | Who can perform each action? | Often missing - verify or ask explicitly |
| **Derived Data** | What calculated/aggregated data exists? | Look at dashboards, summaries, totals |

**API Contract** - TYPICALLY DERIVED

External specs rarely specify APIs in detail. Verify, then derive from UI + ask clarifying questions as needed.

| Category | Discovery Question | Derivation Hint |
|----------|-------------------|-----------------|
| **Endpoints** | What operations are needed? | Only endpoints for UI-visible actions - no speculative CRUD |
| **Consumers** | Who calls this API? (webapp, mobile, external) | Ask explicitly |
| **Request Shape** | What data is sent with each action? | Look at form fields in mockups |
| **Response Shape** | What data is returned? | Look at what's displayed after action |
| **Error Cases** | What can go wrong? | Rarely in external specs - verify or ask |

**Frontend (webapp)** - TYPICALLY WELL-SPECIFIED

External specs usually have good detail here. Extract rather than ask.

| Category | Discovery Question | Where to Find |
|----------|-------------------|---------------|
| **Pages/Views** | What screens does the user see? | Mockups, user flows |
| **Forms** | What data does the user input? | Form mockups, field labels |
| **Display** | What data is shown to the user? | Screen mockups |
| **States** | Loading, empty, error states? | Sometimes missing - ask if unclear |
| **Navigation** | How do users move between screens? | User flow diagrams |

**Ask for visual assets (if not already provided):**

When UI/UX is involved and the external spec doesn't already include or reference visual assets (images, Figma links, etc.), proactively ask:

```
Do you have any visual assets I can reference?
  - Mockups or wireframes (Figma, Sketch, etc.)
  - Screenshots of existing UI
  - Rough sketches or drawings
  - Reference images from other products

If you can share images, I can extract much more accurate
requirements than from text descriptions alone.
```

**Skip this question if** the spec already includes embedded images, links to design tools (Figma, Sketch, InVision), or references to attached mockups.

Visual assets help:
- Derive entities from what's displayed
- Identify form fields and validation needs
- Understand navigation and user flows
- Spot edge cases (empty states, error states)
- Ensure nothing is missed

These questions are asked during component-discovery to identify AND scope components. The answers are documented in SPEC.md.

**Key insight**: The discovery process should DERIVE backend requirements from frontend specs, then CONFIRM with the user. Don't ask "what API endpoints do you need?" - instead say "Based on this UI, you'll need these endpoints: [list]. Is this correct?"

### 4. Decomposition Revision During Spec Writing

The initial decomposition is a best guess. During spec solicitation, we may discover:
- Two changes should be merged (they're too intertwined)
- One change should be split (it's too large/complex)
- Epic boundaries are wrong
- Dependencies were misidentified
- A change was missed entirely

**Detecting decomposition issues:**

During solicitation, watch for signals:
- "This overlaps heavily with [other change]"
- "We can't do X without also doing Y"
- "This is actually three separate features"
- "We missed the admin panel entirely"

**Revision workflow:**

```
═══════════════════════════════════════════════════════════════
 DECOMPOSITION REVISION NEEDED
═══════════════════════════════════════════════════════════════

While working on "02-authentication", I noticed:
  - It heavily overlaps with "03-password-reset"
  - Both share the same user session model
  - Implementing them separately would cause rework

Suggested revision:
  MERGE: 02-authentication + 03-password-reset → 02-user-auth

This would change:
  - Total changes: 9 → 8
  - Epic 1 changes: 3 → 2

Options:
  [M] Merge these changes
  [K] Keep them separate (I'll handle the overlap)
  [D] Discuss further

Your choice: _
```

**Revision types:**

| Revision | Action | Impact |
|----------|--------|--------|
| **Merge** | Combine two+ changes | Delete extra SPEC.md, update dependencies |
| **Split** | Divide one change | Create new change, update dependencies |
| **Reorder** | Change dependency order | Update workflow.yaml dependencies |
| **Add** | New change discovered | Add to workflow, may require re-review of dependents |
| **Remove** | Change not needed | Mark as removed, update dependents |

**Handling already-created specs:**

If a spec was already created/approved and decomposition changes:

```
═══════════════════════════════════════════════════════════════
 REVISION AFFECTS APPROVED SPECS
═══════════════════════════════════════════════════════════════

The merge of 02-authentication + 03-password-reset affects:
  ✓ 02-authentication (APPROVED) - will be updated
  ○ 03-password-reset (PENDING) - will be merged into 02

After merge:
  - 02-user-auth will contain content from both
  - You'll need to re-review the merged spec
  - 03-password-reset SPEC.md will be archived (not deleted)

Proceed with merge? [Y/n]
```

**Archive, don't delete:**
- Removed/merged specs are moved to `.sdd/archive/revised-specs/`
- Preserves audit trail of decomposition decisions
- Can be referenced if revision was wrong

**Progress display after revision:**

```
═══════════════════════════════════════════════════════════════
 DECOMPOSITION REVISED
═══════════════════════════════════════════════════════════════

 Epic 1: User Management (was 3 changes, now 2)
   ✓ 01-registration      APPROVED
   ● 02-user-auth         MERGED (was 02 + 03), needs re-review
   ✗ 03-password-reset    MERGED into 02

Progress: 1/8 specs approved (was 1/9)

NEXT: Re-review merged spec [02-user-auth](changes/.../02-user-auth/SPEC.md)
```

### 4b. Phase Regression (Going Back to Earlier Phases)

Users may discover during later phases that earlier work needs revision. The workflow must support going back without losing valid work.

**Common regression scenarios:**

| From Phase | To Phase | Trigger | Example |
|------------|----------|---------|---------|
| Plan → Spec | Spec gap discovered during planning | "We can't plan this - the spec doesn't define error handling" |
| Implement → Plan | Plan is incomplete/wrong | "The plan doesn't account for the caching layer" |
| Implement → Spec | Fundamental requirement missing | "We need OAuth, not just password auth" |
| Review → Implement | Changes requested | "The error messages aren't user-friendly" |
| Review → Spec | Major requirement missed | "This doesn't handle the mobile use case at all" |

**Regression workflow:**

```
═══════════════════════════════════════════════════════════════
 PHASE REGRESSION REQUESTED
═══════════════════════════════════════════════════════════════

You're currently in: IMPLEMENTATION (02-authentication)
You want to go back to: SPEC

Reason provided: "Need to add OAuth support, not just password auth"

This will:
  ⚠️  Mark 02-authentication SPEC as needs-revision
  ⚠️  Mark 02-authentication PLAN as invalidated (will need re-plan)
  ⚠️  Discard implementation progress for 02-authentication

  ✓  Keep: 01-registration (already complete, unaffected)
  ✓  Keep: 03-password-reset spec (dependent, but unchanged)

Downstream effects:
  ❗ 03-password-reset may need spec review after 02 is revised
     (depends on 02-authentication)

Proceed with regression? [Y/n]
```

**State management for regression:**

```yaml
items:
  - id: 02-authentication
    spec_status: needs_revision    # Was: approved
    plan_status: invalidated       # Was: approved
    impl_status: discarded         # Was: in_progress
    review_status: pending
    regression:
      from_phase: implement
      to_phase: spec
      reason: "Need to add OAuth support"
      timestamp: 2026-02-05T14:30:00Z
      preserved_work:
        - path: .sdd/archive/regressions/02-auth-impl-20260205/
          type: implementation
          description: "Partial password auth implementation"
```

**What gets preserved vs discarded:**

| Regression | Preserved | Discarded/Invalidated |
|------------|-----------|----------------------|
| Plan → Spec | Nothing (plan depends on spec) | Plan marked invalidated |
| Impl → Plan | Spec remains approved | Plan invalidated, impl discarded |
| Impl → Spec | Nothing | Plan invalidated, impl discarded |
| Review → Impl | Spec + Plan approved | Impl marked needs-changes |
| Review → Spec | Nothing | Plan invalidated, impl discarded |

**Archiving discarded work:**

When implementation is discarded due to regression:
1. Archive to `.sdd/archive/regressions/<change-id>-<phase>-<date>/`
2. Include: code changes, test files, any generated artifacts
3. Record reason and timestamp
4. Can be referenced if regression was wrong

**Cascade effects:**

When a change regresses, check dependents:

```yaml
cascade_check:
  regressed_item: 02-authentication
  dependents:
    - id: 03-password-reset
      current_phase: spec
      impact: may_need_review  # Depends on 02's spec
    - id: 04-dashboard
      current_phase: plan
      impact: blocked  # Can't plan until 02 spec is re-approved
```

**User communication after regression:**

```
═══════════════════════════════════════════════════════════════
 REGRESSION COMPLETE
═══════════════════════════════════════════════════════════════

02-authentication has been moved back to SPEC phase.

Archived:
  - Implementation: .sdd/archive/regressions/02-auth-impl-20260205/

Status changes:
  02-authentication: SPEC (needs revision)
  03-password-reset: SPEC (flagged for review after 02)
  04-dashboard: PLAN (blocked until 02 spec approved)

NEXT: Revise spec for 02-authentication
      Add OAuth support as discussed

Run: /sdd-change spec 02-authentication
```

**Commands for regression:**

```bash
# Go back to spec phase for a specific change
/sdd-change regress 02-authentication --to spec --reason "Need OAuth"

# Go back to plan phase
/sdd-change regress 02-authentication --to plan --reason "Missing caching"

# Request changes during review (implicit regression to impl)
/sdd-change request-changes 02-authentication --reason "Error messages unclear"
```

**Key constraints:**
- Always archive discarded work (never delete)
- Always explain cascade effects before confirming
- Always require a reason for regression
- Track regression history for audit trail
- Don't allow regression during active processing (must complete or cancel current operation first)

### 5. Spec Dependency Tracking

When decomposing external specs, identify dependencies between specs. During spec iteration, changes must cascade to dependent specs.

**Dependency identification during decomposition:**
- Extract explicit dependencies from spec content ("requires", "depends on", "after")
- Infer implicit dependencies from domain model (entity relationships)
- API-first ordering creates natural dependency chain

**Dependency storage in workflow.yaml:**
```yaml
items:
  - id: 01-user-model
    depends_on: []
  - id: 02-authentication
    depends_on: [01-user-model]
  - id: 03-password-reset
    depends_on: [02-authentication]
  - id: 04-dashboard
    depends_on: [01-user-model, 02-authentication]
```

**Display dependency chain when editing specs:**

When user reviews/edits a spec that has dependents:
```
═══════════════════════════════════════════════════════════════
 SPEC REVIEW: 01-user-model
═══════════════════════════════════════════════════════════════

⚠️  This spec has 3 dependents that may need updates:
    ├── 02-authentication (depends on: User entity)
    ├── 03-password-reset (depends on: 02-authentication)
    └── 04-dashboard (depends on: User entity)

Review the spec: [SPEC.md](changes/.../01-user-model/SPEC.md)

After making changes, dependent specs will be flagged for review.
```

**Cascade changes to dependents:**

When a spec is modified:
1. Identify all direct dependents
2. Flag them as "needs-review" in workflow state
3. Show user which specs need re-review:

```
═══════════════════════════════════════════════════════════════
 SPEC UPDATED: 01-user-model
═══════════════════════════════════════════════════════════════

Changes detected in: User entity definition

The following dependent specs need review:
  ❗ 02-authentication - uses User entity
  ❗ 04-dashboard - uses User entity

Review and update these specs before proceeding.

NEXT: Review [02-authentication](changes/.../02-authentication/SPEC.md)
```

**Prevent proceeding with stale dependents:**

```
═══════════════════════════════════════════════════════════════
 CANNOT PROCEED - STALE DEPENDENCIES
═══════════════════════════════════════════════════════════════

The following specs have unreviewed upstream changes:
  ❗ 02-authentication (01-user-model changed)
  ❗ 03-password-reset (02-authentication not reviewed)

Review these specs before planning:
  /sdd-change review 02-authentication
```

### 6. Workflow Progress Visualization

Every multi-step workflow must display clear progress indication. Users should never wonder "where am I?" or "what's left?".

**Standard Progress Display Format:**

```
═══════════════════════════════════════════════════════════════
 EXTERNAL SPEC WORKFLOW                              [3/7 STEPS]
═══════════════════════════════════════════════════════════════

 ✓ Transform      Classify, gap analysis, clarifications
 ✓ Discover       Identify required components
 ● Decompose      Break into epics/changes          ← CURRENT
 ○ Spec 1/5       User Management - Registration
 ○ Spec 2/5       User Management - Authentication
 ○ Spec 3/5       Dashboard - Analytics
 ○ Review         Final spec review
 ○ Plan           Create implementation plans

───────────────────────────────────────────────────────────────
 CURRENT: Decomposing spec into workflow items...
 NEXT:    Create spec for "Registration" (Epic 1, Change 1)
───────────────────────────────────────────────────────────────
```

**Progress Symbols:**
- `✓` = Completed
- `●` = Current (in progress)
- `○` = Pending
- `❗` = Needs attention (stale dependency, review needed)
- `✗` = Failed/blocked

**Compact Progress Bar (for quick status):**

```
[████████░░░░░░░░░░░░] 3/7 steps │ Decomposing...
```

**Always Show Context:**

After every operation, display:
```
───────────────────────────────────────────────────────────────
 DONE:    [Brief description of what just completed]
 CURRENT: [What's happening now, if async]
 NEXT:    [The immediate next step]

 Run: [command to continue]
───────────────────────────────────────────────────────────────
```

**Workflow-Specific Progress Examples:**

**Spec Creation (within large external spec):**
```
═══════════════════════════════════════════════════════════════
 SPEC CREATION                                       [2/9 SPECS]
═══════════════════════════════════════════════════════════════

 Epic 1: User Management
   ✓ 01-registration
   ● 02-authentication                               ← CURRENT
   ○ 03-password-reset

 Epic 2: Dashboard
   ○ 04-analytics
   ○ 05-settings
   ○ 06-notifications

 Epic 3: Billing
   ○ 07-subscription
   ○ 08-invoices
   ○ 09-payment-methods

───────────────────────────────────────────────────────────────
 DONE:    Created SPEC.md for 01-registration
 CURRENT: Soliciting requirements for 02-authentication
 NEXT:    03-password-reset (after this spec approved)
───────────────────────────────────────────────────────────────
```

**Planning Phase:**
```
═══════════════════════════════════════════════════════════════
 PLANNING PHASE                                     [4/9 PLANS]
═══════════════════════════════════════════════════════════════

 ✓ 01-registration      PLAN.md created, approved
 ✓ 02-authentication    PLAN.md created, approved
 ✓ 03-password-reset    PLAN.md created, approved
 ● 04-analytics         Creating plan...            ← CURRENT
 ○ 05-settings
 ○ 06-notifications
 ○ 07-subscription
 ○ 08-invoices
 ○ 09-payment-methods

───────────────────────────────────────────────────────────────
```

**Implementation Phase:**
```
═══════════════════════════════════════════════════════════════
 IMPLEMENTATION                                      [1/9 DONE]
═══════════════════════════════════════════════════════════════

 ✓ 01-registration      Implemented, tests passing
 ● 02-authentication    Implementing...             ← CURRENT
   └─ Phase 1/3: API contracts
 ○ 03-password-reset    Blocked by: 02-authentication
 ○ 04-analytics
 ...

───────────────────────────────────────────────────────────────
```

**Integration with workflow-state skill:**

The workflow-state skill must track:
```yaml
workflow:
  id: a1b2c3
  # High-level phase (matches workflow diagram)
  phase: spec  # spec | plan | implement

  # Detailed step within phase
  step: spec_creation  # transform | discover | decompose | spec_creation | spec_review (for spec phase)
                       # plan_creation | plan_review (for plan phase)
                       # implementing | testing (for implement phase)

  current_item: 02-authentication

  progress:
    total_items: 9
    specs_completed: 1
    specs_pending: 8
    plans_completed: 0
    plans_pending: 9
    implemented: 0
    reviewed: 0

  items:
    - id: 01-registration
      spec_status: approved      # pending | in_progress | ready_for_review | approved | needs_rereview
      plan_status: pending       # pending | in_progress | approved
      impl_status: pending       # pending | in_progress | complete
      review_status: pending     # pending | ready_for_review | approved | changes_requested
      depends_on: []

    - id: 02-authentication
      spec_status: in_progress
      plan_status: pending
      impl_status: pending
      review_status: pending
      depends_on: [01-registration]
      substep: solicitation      # transformation | discovery | solicitation | writing

    - id: 03-password-reset
      spec_status: pending
      plan_status: pending
      impl_status: pending
      review_status: pending
      depends_on: [02-authentication]
```

**Phase gating rules (enforced by sdd-change):**
- Cannot approve a spec while open questions remain (must be answered or marked as assumption)
- Cannot start `plan` phase until ALL items have `spec_status: approved`
- Cannot start `implement` phase until ALL items have `plan_status: approved`
- Cannot complete workflow until ALL items have `review_status: approved`
- Cannot approve a spec if dependencies have `spec_status: needs_rereview`
- Deferred questions must be resolved before the deferred-to phase completes

**Display on Every Command:**

Every `/sdd-change` command should show abbreviated progress:
```
[████░░░░░░] 2/9 specs │ Current: 02-authentication │ Next: 03-password-reset
```

**Who renders progress visualization:**
- `workflow-state` skill: Tracks progress data in `workflow.yaml`
- `sdd-change` command: Renders progress display by reading from workflow-state
- All progress rendering happens in `sdd-change.md` - it's the orchestrator
- Other skills (solicitation, planning) don't render progress - they return to sdd-change which renders

### 7. Solicitation Deep-Dive (after discovery)

After component-discovery identifies components, solicitation asks DETAILED questions for each.

**Question depth should be inversely proportional to spec coverage:**
- Backend/API/Database: ASK MANY questions (spec has little info)
- Frontend/UI: ASK FEW questions (spec likely has answers)

| Component | Spec Coverage | Deep-Dive Depth | Key Questions |
|-----------|---------------|-----------------|---------------|
| **Backend** | Very Low | **Extensive** | Validation rules, authorization per-endpoint, error handling, transaction boundaries, caching strategy, audit logging |
| **API** | Very Low | **Extensive** | Request/response schemas for EACH endpoint, error codes and messages, authentication method, rate limiting, versioning strategy |
| **Database** | Very Low | **Extensive** | Entity attributes, indexes, constraints, migrations strategy, seed data |
| **Frontend** | High | Minimal | Confirm states (loading/error/empty), interaction details not in mockups |
| **Infra** | Absent | Moderate | Scaling requirements, resource limits, dependencies |

**Backend deep-dive questions (since spec won't have this):**

**YAGNI**: Only ask questions about operations the UI actually requires. Don't assume full CRUD.

```
For each entity derived from UI (only if UI shows data storage/retrieval):
  - What fields does [Entity] have?
  - Which fields are required vs optional?
  - What validation rules apply to each field?
  - What are the relationships to other entities?
  - If delete is needed: soft or hard deletes?
  - What audit/history is needed?

For each user action derived from UI:
  - Who is authorized to perform this action?
  - What validation happens before the action?
  - What happens if validation fails?
  - What side effects occur (emails, notifications, logs)?
  - Is this action idempotent?
  - What's the transaction boundary?
```

**Frontend deep-dive questions (brief, since spec has most info):**

```
For screens NOT fully mocked:
  - What does the loading state look like?
  - What does the empty state look like?
  - What does the error state look like?
```

Discovery determines WHAT components. Solicitation determines HOW they work in detail. **Weight solicitation effort toward areas the external spec doesn't cover.**

### 8. Product Spec vs Tech Spec Distinction

**Product Specs** (external input):
- Focus on WHAT and WHY
- Required sections: Overview, User Stories, Requirements, Acceptance Criteria
- No technical implementation details required
- Validation: Check business value, user focus, testability
- **These are archived, not generated** - they are INPUT to the workflow

**Tech Specs** (generated SPEC.md files):
- Focus on HOW
- Required sections: All product spec sections PLUS: Technical Design, API Contracts, Data Model, Security, Error Handling, Observability, Tests
- Full implementation details gathered through solicitation
- Validation: Check completeness, technical accuracy, specs traceability
- **These are the output of spec creation** - they are what we build from

**Transformation Flow:**
```
External Product Spec (archived, read-only)
         │
         ▼
    Transform + Classify
         │
         ▼
    Component Discovery
         │
         ▼
    Decompose into items
         │
         ▼
    For each item:
         │
         ├─→ Solicitation (deep-dive questions)
         │
         └─→ Generate Tech Spec (SPEC.md)
              └─ Contains: requirements FROM product spec
                          + technical details FROM solicitation
                          + components FROM discovery
```

**Key insight**: The external product spec is consumed ONCE during transformation. The generated SPEC.md files are tech specs that include both product requirements AND technical details.

Add `spec_type` to frontmatter:
```yaml
---
spec_type: product | tech
type: feature | bugfix | refactor | epic  # (separate field - kind of change)
# ... other fields
---
```

**Note**: `spec_type` (product/tech) is different from `type` (feature/bugfix/etc). Both fields are needed.

### 9. Non-Blocking Conversational Interaction

**Core principle: Never lock the user out of reading your output before they can respond.**

In `sdd-change.md` and `spec-solicitation/SKILL.md`:

**NEVER:**
- Use modal dialogs that block interaction
- Force multiple choice when freeform is more appropriate
- Assume answers are single-line or single-message
- Require immediate response before user has read the output

**ALWAYS:**
- Present information FIRST, then ask questions
- Allow freeform text responses (not just A/B/C)
- Support multi-turn conversations for complex answers
- Let the user read, think, and respond at their pace

**Question types and when to use them:**

| Question Type | When to Use | Example |
|---------------|-------------|---------|
| **Freeform** | Complex topics, user expertise needed | "What validation rules apply to email addresses?" |
| **Confirmation** | Verifying derived information | "I derived these endpoints from the UI: [list]. Correct?" |
| **Clarification** | Ambiguous requirements | "The spec mentions 'admin users' - what permissions do they have?" |
| **Multiple choice** | ONLY for truly discrete options | "Should deleted records be soft-delete or hard-delete?" |

**Example of good interaction flow:**

```
═══════════════════════════════════════════════════════════════
 TRANSFORMATION COMPLETE
═══════════════════════════════════════════════════════════════

I analyzed the external spec and found:

EXTRACTED (from spec):
  - 5 screens with mockups
  - 3 user flows
  - 12 UI components

DERIVED (from UI descriptions):
  - 4 entities: User, Order, Product, Cart
  - 8 API endpoints (see below)
  - Authorization: users see only their own data

GAPS IDENTIFIED:
  - Password requirements not specified
  - Session timeout not defined
  - Error message format unclear

DERIVED ENDPOINTS:
  1. POST /auth/login
  2. POST /auth/register
  3. GET /orders (user's orders)
  4. POST /orders (create order)
  5. GET /products (catalog)
  6. POST /cart/items (add to cart)
  7. DELETE /cart/items/:id (remove from cart)
  8. POST /cart/checkout

───────────────────────────────────────────────────────────────

I have some questions about the gaps. Take your time to read the
above, then let me know when you're ready to continue.

You can also:
  - Ask me to explain any of the derived items
  - Correct anything that looks wrong
  - Add context I might have missed
```

**Then, when user responds, ask ONE question at a time:**

```
Let's fill in the gaps. First question:

What are your password requirements?
(e.g., minimum length, special characters, etc.)

If you're not sure, I'll use industry standard defaults
(8+ chars, mixed case, number required) and document that
as an assumption.
```

**Multi-turn conversation support:**

Some answers require extended discussion. Don't rush to the next question.

```
User: "Admins should be able to see all orders"
Agent: "Got it. So admins have elevated read permissions. A few follow-up 
questions:

1. Can admins also modify or cancel orders, or just view them?
2. Should there be different admin levels (super admin vs regular admin)?
3. Should admin access be logged for audit purposes?"

User: "Just view for now. No different levels. Yes to audit logging."

Agent: "Perfect. I'll document:
- Admins can view all orders (read-only)
- Single admin role (no hierarchy)
- All admin order views are audit logged

Let me know if you want to discuss any of this further, or we can 
move to the next gap."
```

**Key principles for conversational interaction:**
1. Present information first, let user absorb it
2. Ask one question (or related set) at a time
3. Allow freeform answers - don't force choices
4. Support multi-turn discussion for complex topics
5. Summarize and confirm understanding before moving on
6. Never use modal dialogs that block the user

### 10. Remove Tech Stack Questions from Planning Skills

Update these skills to NOT ask about technical stack:
- `product-discovery/SKILL.md` - in external-spec mode, classification provides the info
- `planning/SKILL.md` - uses components documented in SPEC.md as the source of truth for what's needed; may read sdd-settings.yaml for existing component info, but absence from settings doesn't mean component shouldn't exist
- `spec-solicitation/SKILL.md` - Step 9 "Technical Architecture" questions should use discovered components, not ask user

**Key insight**: By the time we reach solicitation/planning, component-discovery has already determined what components are needed. These are documented in SPEC.md. SPEC.md is the source of truth for required components. The planning skill may reference sdd-settings.yaml for existing component details, but if SPEC.md says a component is needed and it's not in settings yet, that's expected - it will be created during implementation. Questions should be about WHAT to build, not WHICH technology.

### 11. Clickable File Links

Update all skills to use markdown link format for file references:
- Use: `[SPEC.md](changes/2026/02/05/a1b2c3/01-feature/SPEC.md)`
- Not: `changes/2026/02/05/a1b2c3/01-feature/SPEC.md`

For VSCode preview mode, file links should use relative paths from workspace root.

**Especially important for "spec ready for review" notifications:**

```
═══════════════════════════════════════════════════════════════
 SPEC READY FOR REVIEW
═══════════════════════════════════════════════════════════════

Change: a1b2-1 (User Authentication)

Review the spec: [SPEC.md](changes/2026/02/05/a1b2c3/01-user-auth/SPEC.md)

When satisfied, run: /sdd-change approve spec a1b2-1
```

The spec path MUST be a clickable link so users can easily open and review it.

### 12. Spec Frontmatter Validation

Add validation in `spec-writing/SKILL.md`:

**Product Spec Required Fields**:
- title, spec_type: product, status, domain, created, updated

**Tech Spec Required Fields**:
- title, spec_type: tech, type (feature/bugfix/refactor/epic), status, domain, issue, created, updated, sdd_version

Create validation function that returns clear error messages:
```
Spec validation failed:
  - Missing required field: issue
  - Missing required section: ## Technical Design
  - Acceptance criteria not in Given/When/Then format (line 45)
```

### 13. Ensure .sdd Not Gitignored

In `project-scaffolding/SKILL.md`:
- Remove any .sdd entries from .gitignore template
- Add explicit note: "The .sdd directory is version controlled"
- Check existing .gitignore files and remove .sdd if present

### 14. Update Documentation

Update/create these documentation files:

| File | Action | Updates Needed |
|------|--------|----------------|
| `docs/workflows.md` | Update | Add external spec workflow, phase gating, progress visualization |
| `docs/external-specs.md` | **Create** | Product spec → tech spec transformation flow, Q&A preservation |
| `docs/workflow-progress.md` | **Create** | Progress visualization, phase tracking |
| `plugin/commands/sdd-change.md` | Update | Document new commands: regress, answer, assume, plan, review |

Key topics to document:
- External (product) specs → internal (tech) specs transformation
- Gap analysis and clarification questions
- Component discovery process
- Non-blocking conversational interaction (no modal dialogs)
- Spec dependency tracking and cascade behavior
- Workflow progress visualization
- Large spec handling (>15K tokens) with chunked processing

### 15. Large Spec Handling

External specs over ~15K tokens cannot be processed in a single pass. The transformation must handle arbitrarily large specs through chunked processing.

**Token Estimation:**

Before processing, estimate spec size:
```
Estimated tokens ≈ character_count / 4
```

**Threshold:** If estimated tokens > 15,000, use chunked processing.

**Chunked Processing Strategy:**

```
LARGE SPEC DETECTED (>15K tokens)

Pass 1: Structure Extraction (small context needed)
  ┌─────────────────────────────────────────────────┐
  │ Extract:                                        │
  │   - All headers (H1, H2, H3) with line ranges   │
  │   - Section word counts                         │
  │   - Cross-references between sections           │
  │   - Embedded images/diagrams locations          │
  └─────────────────────────────────────────────────┘
           │
           ▼
Pass 2: Per-Section Transformation
  ┌─────────────────────────────────────────────────┐
  │ For each major section (H1 or large H2):        │
  │   - Read section content (fits in context)      │
  │   - Classify: domain, constraints, requirements │
  │   - Identify section-local gaps                 │
  │   - Note cross-section dependencies             │
  └─────────────────────────────────────────────────┘
           │
           ▼
Pass 3: Merge & Cross-Section Analysis
  ┌─────────────────────────────────────────────────┐
  │ Merge all section classifications               │
  │ Identify cross-section gaps:                    │
  │   - Entity referenced but not defined           │
  │   - Relationship spans sections                 │
  │   - Terminology inconsistencies                 │
  └─────────────────────────────────────────────────┘
           │
           ▼
Pass 4: Unified Gap Analysis & Questions
  ┌─────────────────────────────────────────────────┐
  │ Generate clarification questions from:          │
  │   - Section-local gaps                          │
  │   - Cross-section gaps                          │
  │   - Missing NFRs (usually absent entirely)      │
  └─────────────────────────────────────────────────┘
```

**Section Chunking Rules:**

| Section Size | Strategy |
|-------------|----------|
| < 5K tokens | Process as single chunk |
| 5K - 15K tokens | Process alone (full context) |
| > 15K tokens | Split at H2/H3 boundaries |

**Cross-Section Dependency Tracking:**

During per-section transformation, track:
```yaml
section_dependencies:
  - section: "User Management"
    references:
      - entity: "Organization"
        defined_in: "Organization Setup"
      - term: "admin user"
        defined_in: null  # GAP: not defined anywhere
    referenced_by:
      - "Dashboard"
      - "Billing"
```

**Merge Strategy:**

When merging section classifications:
1. Deduplicate entities (same entity may appear in multiple sections)
2. Unify glossary terms (pick most complete definition)
3. Aggregate relationships into single domain model
4. Combine gaps from all sections + cross-section gaps

**User Communication for Large Specs:**

```
═══════════════════════════════════════════════════════════════
 LARGE SPEC DETECTED
═══════════════════════════════════════════════════════════════

This spec is approximately 28,000 tokens (~112 pages).
I'll process it in sections to ensure thorough analysis.

Found 5 major sections:
  1. User Management (8,200 tokens)
  2. Dashboard (6,100 tokens)
  3. Billing (5,800 tokens)
  4. Reporting (4,500 tokens)
  5. Admin Panel (3,400 tokens)

Processing section 1 of 5: User Management...

[████░░░░░░░░░░░░░░░░] 1/5 sections
```

**Implementation in external-spec-integration:**

```yaml
# Input includes size info
spec_info:
  path: /path/to/spec.md
  estimated_tokens: 28000
  is_large: true
  sections:
    - title: "User Management"
      line_start: 1
      line_end: 450
      estimated_tokens: 8200
    - title: "Dashboard"
      line_start: 451
      line_end: 780
      estimated_tokens: 6100
    # ...

# Processing mode determined by size
processing_mode: chunked  # or "single-pass" for small specs
```

**Key Constraints:**
- Never attempt to load >15K tokens into context at once
- Always show progress during multi-section processing
- Preserve cross-section relationships in merged output
- Gap analysis must consider the FULL spec, not just individual sections

## Dependencies

Changes must be applied in this order:

**Phase 1: Foundation (no dependencies)**
1. `spec-writing` - validation rules, product/tech spec templates
2. `workflow-state` - dependency tracking, progress tracking, phase management
3. `project-scaffolding` - .gitignore fix (independent)

**Phase 2: Core workflow (depends on Phase 1)**
4. `component-recommendation` → rename to `component-discovery` - discovery questions, no system modifications
5. `external-spec-integration` - transformation step, uses workflow-state
6. `spec-decomposition` - work with classified content, dependency identification

**Phase 3: Skill updates (depends on Phase 2)**
7. `spec-solicitation` - inline questions, deep-dive questions, no tech stack
8. `product-discovery` - no tech stack in external mode
9. `planning` - reads components from SPEC.md, no tech stack questions

**Phase 4: Orchestration (depends on all above)**
10. `sdd-change` - updated flow, progress rendering, phase gating

## Tests

### Unit Tests
- [ ] `test_classify_domain_knowledge_from_product_spec`
- [ ] `test_classify_constraints_from_product_spec`
- [ ] `test_classify_requirements_from_product_spec`
- [ ] `test_classify_design_details_from_product_spec`
- [ ] `test_identify_missing_requirements`
- [ ] `test_identify_undefined_edge_cases`
- [ ] `test_identify_missing_nfrs`
- [ ] `test_identify_ambiguous_terminology`
- [ ] `test_identify_implicit_assumptions`
- [ ] `test_generate_clarification_questions`
- [ ] `test_record_user_clarifications`
- [ ] `test_document_assumptions_when_unknown`
- [ ] `test_all_qa_appended_to_spec`
- [ ] `test_qa_includes_timestamp_and_phase`
- [ ] `test_multi_turn_conversation_captured`
- [ ] `test_user_corrections_recorded`
- [ ] `test_qa_never_deleted_only_appended`
- [ ] `test_open_questions_tracked_in_spec`
- [ ] `test_spec_approval_blocked_with_open_questions`
- [ ] `test_question_answered_removes_from_open`
- [ ] `test_question_assumed_removes_from_open`
- [ ] `test_question_deferred_requires_justification`
- [ ] `test_deferred_questions_tracked_for_later_phase`
- [ ] `test_spec_contains_only_user_confirmed_content`
- [ ] `test_no_speculative_additions_in_spec`
- [ ] `test_component_discovery_from_functional_requirements`
- [ ] `test_component_discovery_from_non_functional_requirements`
- [ ] `test_component_discovery_does_not_modify_settings`
- [ ] `test_backend_solicitation_asks_data_questions`
- [ ] `test_backend_solicitation_asks_action_questions`
- [ ] `test_api_solicitation_asks_endpoint_questions`
- [ ] `test_frontend_solicitation_asks_page_questions`
- [ ] `test_ui_discovery_asks_for_visual_assets_when_missing`
- [ ] `test_ui_discovery_skips_visual_asset_question_when_provided`
- [ ] `test_only_relevant_component_questions_asked`
- [ ] `test_backend_requirements_derived_from_ui_descriptions`
- [ ] `test_api_endpoints_derived_from_user_actions`
- [ ] `test_solicitation_depth_weighted_backend_over_frontend`
- [ ] `test_gap_analysis_expects_sparse_backend_info`
- [ ] `test_identify_spec_dependencies_from_content`
- [ ] `test_infer_dependencies_from_domain_model`
- [ ] `test_store_dependencies_in_workflow_yaml`
- [ ] `test_display_dependency_chain_on_review`
- [ ] `test_flag_dependents_when_spec_modified`
- [ ] `test_prevent_planning_with_stale_dependents`
- [ ] `test_decomposition_merge_two_changes`
- [ ] `test_decomposition_split_change`
- [ ] `test_decomposition_revision_archives_not_deletes`
- [ ] `test_decomposition_revision_updates_progress`
- [ ] `test_decomposition_revision_flags_approved_specs_for_rereview`
- [ ] `test_regression_from_impl_to_spec`
- [ ] `test_regression_from_impl_to_plan`
- [ ] `test_regression_from_plan_to_spec`
- [ ] `test_regression_from_review_to_impl`
- [ ] `test_regression_archives_discarded_work`
- [ ] `test_regression_cascade_effects_calculated`
- [ ] `test_regression_requires_reason`
- [ ] `test_regression_blocked_during_active_processing`
- [ ] `test_progress_display_shows_all_steps`
- [ ] `test_progress_symbols_correct_for_status`
- [ ] `test_current_next_done_always_shown`
- [ ] `test_compact_progress_bar_format`
- [ ] `test_workflow_state_tracks_current_phase`
- [ ] `test_phase_gating_blocks_plan_until_specs_approved`
- [ ] `test_phase_gating_blocks_impl_until_plans_approved`
- [ ] `test_review_phase_after_implementation`
- [ ] `test_workflow_not_complete_until_review_approved`
- [ ] `test_cannot_approve_spec_with_stale_dependencies`
- [ ] `test_workflow_state_four_status_fields` (spec_status, plan_status, impl_status, review_status)
- [ ] `test_workflow_state_progress_tracking`
- [ ] `test_workflow_state_substep_tracking`
- [ ] `test_sdd_change_regress_command`
- [ ] `test_sdd_change_answer_command`
- [ ] `test_sdd_change_assume_command`
- [ ] `test_sdd_change_plan_command`
- [ ] `test_sdd_change_review_command`
- [ ] `test_sdd_change_request_changes_command`
- [ ] `test_regression_archives_via_git_stash`
- [ ] `test_regression_creates_patch_for_committed_changes`
- [ ] `test_validate_product_spec_frontmatter`
- [ ] `test_validate_tech_spec_frontmatter`
- [ ] `test_validate_tech_spec_required_sections`
- [ ] `test_validation_error_messages_clear`
- [ ] `test_file_links_use_markdown_format`
- [ ] `test_non_blocking_conversational_interaction`
- [ ] `test_freeform_answers_supported`
- [ ] `test_multi_turn_conversation_supported`
- [ ] `test_estimate_spec_tokens`
- [ ] `test_detect_large_spec_threshold`
- [ ] `test_extract_section_structure_from_large_spec`
- [ ] `test_chunk_spec_by_section_boundaries`
- [ ] `test_transform_single_section`
- [ ] `test_track_cross_section_dependencies`
- [ ] `test_merge_section_classifications`
- [ ] `test_deduplicate_entities_on_merge`
- [ ] `test_cross_section_gap_detection`

### Integration Tests
- [ ] `test_external_spec_transformation_before_decomposition`
- [ ] `test_decomposition_uses_classified_content`
- [ ] `test_component_discovery_uses_classified_requirements`
- [ ] `test_solicitation_no_tech_stack_questions`
- [ ] `test_derivation_only_ui_visible_operations` (YAGNI - no speculative CRUD)
- [ ] `test_inline_questions_not_modal`
- [ ] `test_spec_changes_cascade_to_dependents`
- [ ] `test_planning_blocked_when_dependents_stale`
- [ ] `test_progress_displayed_after_every_operation`
- [ ] `test_large_spec_chunked_transformation`
- [ ] `test_large_spec_progress_shown_per_section`
- [ ] `test_full_workflow_preserves_all_qa_in_spec`
- [ ] `test_regression_updates_dependent_item_status`

### E2E Tests
- [ ] `test_external_spec_full_workflow_with_transformation`
- [ ] `test_product_spec_becomes_tech_spec`
- [ ] `test_sdd_directory_not_gitignored`
- [ ] `test_large_spec_all_specs_created_before_any_plan`
- [ ] `test_plan_phase_blocked_until_all_specs_approved`
- [ ] `test_workflow_progress_shown_throughout_large_spec`
- [ ] `test_dependency_cascade_triggers_rereviews`
- [ ] `test_decomposition_revision_mid_workflow`
- [ ] `test_large_spec_full_workflow_chunked`
- [ ] `test_full_workflow_spec_plan_implement_review`
- [ ] `test_regression_and_recovery_workflow`

## Verification

- [ ] External spec is transformed before decomposition
- [ ] Transformation classifies all information types
- [ ] Transformation identifies gaps and missing information
- [ ] User is asked clarification questions for critical gaps
- [ ] Assumptions are documented when user doesn't know
- [ ] All Q&A preserved in SPEC.md (never deleted, only appended)
- [ ] Questions timestamped and categorized by workflow phase
- [ ] Multi-turn conversations captured as threaded exchanges
- [ ] User corrections and feedback recorded with dates
- [ ] Open questions tracked in SPEC.md with blocking status
- [ ] Spec approval blocked while open questions remain
- [ ] Questions can be answered, assumed, or deferred with justification
- [ ] Deferred questions tracked and must be resolved in deferred phase
- [ ] Specs contain only user-confirmed content (no speculative "future ideas")
- [ ] Component discovery uses classified requirements (no redundant questions)
- [ ] Backend/API/Database requirements are DERIVED from frontend descriptions
- [ ] Gap analysis weights expectations (rich frontend, sparse backend)
- [ ] Solicitation asks more questions for backend than frontend
- [ ] UI/UX discovery prompts user for visual assets (mockups, screenshots)
- [ ] Spec phase produces SPEC.md only (no system changes, no PLAN.md)
- [ ] Plan phase is separate and only starts after ALL specs approved (phase gating)
- [ ] Implementation phase only starts after ALL plans approved (phase gating)
- [ ] Review phase follows implementation with user approval required
- [ ] Workflow not complete until ALL items pass review approval
- [ ] Component-discovery never modifies sdd-settings.yaml
- [ ] Scaffolding and system changes happen only during implementation
- [ ] Product and tech specs have different validation rules
- [ ] No modal dialogs in the workflow
- [ ] Non-blocking conversational interaction throughout
- [ ] Freeform and multi-turn responses supported
- [ ] File references are clickable links
- [ ] .sdd directory is version controlled
- [ ] Spec dependencies identified during decomposition
- [ ] Dependencies stored in workflow.yaml
- [ ] Dependency chain displayed when reviewing specs with dependents
- [ ] Dependent specs flagged for review when upstream spec changes
- [ ] Planning blocked when dependent specs are stale
- [ ] Decomposition can be revised during spec writing
- [ ] Merge/split/reorder/add/remove operations supported
- [ ] Revised specs archived to `.sdd/archive/revised-specs/`
- [ ] Approved specs flagged for re-review after decomposition revision
- [ ] Phase regression supported (user can go back to earlier phase)
- [ ] Regression archives discarded work (never deleted)
- [ ] Regression shows cascade effects before confirming
- [ ] Regression requires reason and tracks history
- [ ] Workflow progress visualization shown on all multi-step workflows
- [ ] Progress display shows: done, current, next, remaining
- [ ] Every command shows abbreviated progress bar
- [ ] Large specs (>15K tokens) detected and handled with chunked processing
- [ ] Per-section progress shown during large spec transformation
- [ ] Cross-section dependencies preserved in merged output
- [ ] workflow-state uses four status fields (spec_status, plan_status, impl_status, review_status)
- [ ] workflow-state tracks progress aggregates across all items
- [ ] workflow-state tracks substep within spec creation (transformation, discovery, solicitation, writing)
- [ ] New sdd-change commands implemented: regress, answer, assume, plan, review, request-changes
- [ ] Regression archives uncommitted changes via git stash
- [ ] Regression creates patches for committed-but-not-pushed changes
- [ ] All documentation updated
