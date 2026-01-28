# Plan: Task #9 - sdd-init Should Produce Ready-to-Work Components

## Executive Summary

"Ready-to-work" doesn't mean "has code." It means:
1. Developer can run commands and see something working
2. Developer understands what they're looking at
3. Developer knows what to do next
4. The example follows the same methodology they'll use for their own code

**Current state: 0 of 4 criteria are met.**

---

## The Real Problems (Not Just Missing READMEs)

### Problem 1: The Greetings Example is an Orphan

The templates include a complete "greetings" example across all layers:
- **Contract**: `openapi.yaml` with `/greetings` endpoints and `Greeting` schema
- **Backend**: `create_greeting.ts`, `get_greeting.ts` use-cases, DAL functions, HTTP handlers
- **Frontend**: `greeter.tsx` page, `use-greetings.ts` hook, `greetings.ts` API client

**But the greetings example exists NOWHERE in specs:**
- No `Greeting` entity in `specs/domain/definitions/`
- No `create-greeting` use-case in `specs/domain/use-cases/`
- No entry in `specs/domain/glossary.md`
- No change specification that created it

**This violates the core SDD principle: "Specs are truth."** The first thing a developer sees is code that contradicts the methodology.

### Problem 2: Hidden In-Memory Database

The backend has a clever in-memory database stub in `create_database.ts`:
```typescript
// In-memory store for development/testing
// Replace with actual database client in production
```

This means the backend WILL work without PostgreSQL. But:
- This is undocumented
- Developer might not realize PostgreSQL isn't needed for initial testing
- Developer might try to set up k8s/PostgreSQL unnecessarily
- The "TODO: Replace with actual database client" comment suggests it's incomplete

### Problem 3: The Project README Lies

The project README says:
```bash
# Start local Kubernetes cluster
minikube start

# Deploy locally
helm upgrade --install {{PROJECT_NAME}} ./components/<helm-component>/...
```

But:
- Helm templates don't exist (helm scaffolding is "(inline)" with no templates)
- This complexity is unnecessary for first run
- Developer will fail and not understand why

### Problem 4: Type Generation Timing is Unclear

The backend and frontend both import from `'{{CONTRACT_PACKAGE}}'`:
```typescript
import type { components } from '{{CONTRACT_PACKAGE}}';
```

This package doesn't have types until `npm run generate` is run on the contract component. But:
- When should this be run?
- The root `package.json` has scripts but they use placeholder paths
- TypeScript will fail on first compile without generated types

### Problem 5: The "Next Steps" are Wrong

After `sdd-init`, the completion report says:
```
Next steps:
  1. cd <project-name>
  2. npm install --workspaces
  3. cd components/<contract-component> && npm run generate:types
  4. Review: specs/domain/glossary.md, components/<contract-component>/openapi.yaml
  5. Create first change: /sdd-new-change --type feature --name <name>
```

Problems:
- Step 4 (review glossary) - glossary only has "User", not "Greeting" which is in the code
- Step 5 (create first change) - but there's already a greetings feature! Should they create another? Delete greetings first?
- No step to actually RUN the code and see if it works

### Problem 6: No Verification That It Works

There's no "smoke test" or verification that the scaffolded project actually runs. A developer should be able to:
1. Run the backend
2. Run the frontend
3. See the greeter page
4. Create a greeting and see it work

Currently, this path is:
1. Undocumented
2. Requires knowing the in-memory DB exists
3. Has no clear commands

---

## The Core Insight: Example Must Follow the Methodology

The greetings example should demonstrate SDD, not contradict it. Two options:

### Option A: Remove the Example Entirely (Minimal)

Generate a skeleton with no greetings:
- OpenAPI with just health endpoints
- Backend with CMDO structure but no business logic
- Frontend with app shell but no pages
- Empty specs ready to fill in
- Message: "Run `/sdd-new-change --type feature --name <first-feature>` to add your first feature"

**Pros**: Clean, follows methodology, no confusion
**Cons**: Nothing to learn from, cold start, harder to understand patterns

### Option B: Make the Example a Proper Change (Recommended)

Generate the greetings example AS IF it were created by `/sdd-new-change`:
- Create `specs/changes/example/greetings/SPEC.md` with full specification
- Create `specs/changes/example/greetings/PLAN.md` with implementation plan
- Add `Greeting` to `specs/domain/definitions/greeting.md`
- Add `CreateGreeting` to `specs/domain/use-cases/create-greeting.md`
- Add `Greeting` to `specs/domain/glossary.md`
- Keep the same implementation code
- Mark the change as `status: active` (already implemented)

**Pros**: Teaches full SDD workflow, everything consistent, developer sees real example
**Cons**: More files, more complex scaffolding

### Recommendation: Option B

The whole point of SDD is that specs come first. The example should demonstrate this. A developer should be able to:
1. Read `specs/changes/example/greetings/SPEC.md` and understand the feature
2. See how SPEC.md maps to PLAN.md
3. See how PLAN.md maps to the implementation
4. Use this as a template for their own changes

---

## Implementation Plan

### Phase 1: Fix the Immediate Pain (Can Run The Code)

**Goal**: After `sdd-init`, developer can run `npm run dev` and see something working.

#### 1.1 Create Bootstrap Script

Add to root `package.json`:
```json
{
  "scripts": {
    "bootstrap": "npm install && npm run generate && npm run dev"
  }
}
```

But `npm run generate` needs to work first.

#### 1.2 Fix Type Generation in Root package.json

Current template at `plugin/skills/project-scaffolding/templates/project/package.json` needs proper meta-scripts that work without placeholder paths.

**File**: `plugin/skills/scaffolding/scaffolding.ts`

The scaffolding script already generates the root package.json with component-specific scripts. Verify that:
- `npm run generate` runs type generation for all contracts
- Scripts use actual component directory names, not placeholders
- Dependencies are ordered correctly (contract generates before server/webapp)

#### 1.3 Document the In-Memory Database

The in-memory database in `create_database.ts` is actually a feature, not a bug. Document it:

**File**: `plugin/skills/backend-scaffolding/templates/README.md` (new)

```markdown
## Development Mode

The backend includes an **in-memory database** for development and testing.
No PostgreSQL setup is required for initial development.

The in-memory store persists data for the duration of the process.
It supports basic INSERT/SELECT operations for the greetings example.

To use a real PostgreSQL database, update `src/operator/create_database.ts`
and set the `DATABASE_URL` environment variable.
```

#### 1.4 Simplify the Project README

**File**: `plugin/skills/project-scaffolding/templates/project/README.md`

Replace the complex k8s instructions with a simple quick start:

```markdown
## Quick Start

# Install dependencies and generate types
npm run bootstrap

# Or step by step:
npm install
npm run generate    # Generate TypeScript types from OpenAPI
npm run dev         # Start backend + frontend

Visit http://localhost:5173 to see the app.
```

Move the k8s/helm instructions to a separate "Production Deployment" section.

### Phase 2: Align Specs with Code (Greetings as Proper Change)

**Goal**: The greetings example follows SDD methodology.

#### 2.1 Create Greeting Entity Spec

**File**: `plugin/skills/project-scaffolding/templates/specs/domain/definitions/greeting.md` (new)

```markdown
---
name: Greeting
domain: Example
status: active
---

# Greeting

## Description

A personalized greeting message created for a specific person.
This is an example entity demonstrating the SDD spec-to-code workflow.

## Attributes

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | uuid | Yes | Unique identifier |
| name | string | Yes | Name of the person being greeted |
| message | string | Yes | The greeting message (generated) |
| createdAt | timestamp | Yes | When the greeting was created |

## Relationships

- None (standalone example entity)

## Notes

This entity is part of the scaffolded example. Feel free to:
- Study it to understand spec structure
- Modify it to learn the workflow
- Delete it when ready to build your own features
```

#### 2.2 Create Greeting Use-Case Specs

**File**: `plugin/skills/project-scaffolding/templates/specs/domain/use-cases/create-greeting.md` (new)

```markdown
---
name: Create Greeting
domain: Example
actors: User
status: active
---

# Create Greeting

## Summary

Allows a user to create a personalized greeting message by providing their name.

## Actors

- User (anyone accessing the application)

## Preconditions

- None

## Main Flow

1. User submits their name via the greeting form
2. System validates the name (1-100 characters)
3. System generates a greeting message: "Hello, {name}!"
4. System persists the greeting with a unique ID
5. System returns the created greeting to the user

## Postconditions

- A new Greeting entity exists in the system
- The greeting is retrievable by its ID

## Error Cases

- **Invalid name**: Name is empty or exceeds 100 characters → Return 400 Bad Request
```

#### 2.3 Add Greeting to Glossary

**File**: `plugin/skills/project-scaffolding/templates/specs/glossary.md`

Update to include the Greeting term:
```markdown
| Term | Definition |
|------|------------|
| Greeting | A personalized message created for a specific person (example entity) |
| User | A registered account in the system |
```

#### 2.4 Create Example Change Spec

**File**: `plugin/skills/project-scaffolding/templates/specs/changes/example/greetings/SPEC.md` (new)

```markdown
---
title: Greetings Feature (Example)
type: feature
status: active
created: {{DATE}}
---

# Greetings Feature

This is an **example feature** demonstrating the SDD workflow. It is pre-implemented
in the scaffolded project to show how specs map to code.

## Overview

A simple greeting system where users can create and retrieve personalized greetings.

## Requirements

### Functional

1. Users can create a greeting by providing their name
2. System generates a greeting message: "Hello, {name}!"
3. Users can retrieve a greeting by its ID

### Non-Functional

1. Greeting names must be 1-100 characters
2. Greetings persist for the duration of the server process (in-memory)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/greetings | Create a new greeting |
| GET | /api/v1/greetings/{id} | Get greeting by ID |

## Domain Entities

- **Greeting**: See `specs/domain/definitions/greeting.md`

## Implementation Notes

This feature demonstrates:
- OpenAPI contract → TypeScript types
- CMDO architecture (Controller → Model → DAL → Operator)
- React hooks with TanStack Query
- In-memory database for development

## Learning Path

1. Read this spec to understand requirements
2. Review `PLAN.md` to see implementation phases
3. Trace the code: `openapi.yaml` → handlers → use-cases → DAL
4. Modify the greeting message format as an exercise
5. Add a "list all greetings" endpoint to practice the workflow
```

#### 2.5 Create Example Change Plan

**File**: `plugin/skills/project-scaffolding/templates/specs/changes/example/greetings/PLAN.md` (new)

```markdown
---
title: Greetings Feature Implementation Plan
status: completed
---

# Implementation Plan: Greetings Feature

## Phases

### Phase 1: Contract Definition ✓

- Define Greeting schema in OpenAPI
- Define CreateGreetingInput schema
- Define POST /greetings endpoint
- Define GET /greetings/{id} endpoint
- Generate TypeScript types

### Phase 2: Backend Implementation ✓

- Create Greeting type in model/definitions
- Implement insertGreeting DAL function
- Implement findGreetingById DAL function
- Implement createGreeting use-case
- Implement getGreeting use-case
- Create HTTP handlers
- Wire up routes in controller

### Phase 3: Frontend Implementation ✓

- Create greetingsApi client
- Implement useCreateGreeting hook
- Implement useGreeting hook
- Create Greeter page component
- Add route to app

### Phase 4: Testing ✓

- Backend use-cases work with in-memory database
- Frontend renders greeter page
- Create greeting flow works end-to-end

## Verification

Run `npm run dev` and visit http://localhost:5173/greeter to verify.
```

### Phase 3: Fix Completion Report and Next Steps

**Goal**: After sdd-init, developer knows exactly what to do.

#### 3.1 Update sdd-init Completion Report

**File**: `plugin/commands/sdd-init.md`

Update Phase 9 completion report:

```markdown
═══════════════════════════════════════════════════════════════
 PROJECT INITIALIZED: <project-name>
═══════════════════════════════════════════════════════════════

Location: <absolute-path>
Domain: <primary-domain>

┌─────────────────────────────────────────────────────────────┐
│ QUICK START                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   npm run bootstrap                                          │
│                                                              │
│   Then visit: http://localhost:5173                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘

WHAT'S INCLUDED:

  ✓ Greetings example feature (fully spec'd and implemented)
    → specs/changes/example/greetings/SPEC.md
    → Demonstrates the complete SDD workflow

  ✓ Domain specs pre-populated
    → specs/domain/glossary.md (Greeting entity)
    → specs/domain/definitions/greeting.md
    → specs/domain/use-cases/create-greeting.md

RECOMMENDED LEARNING PATH:

  1. Run `npm run bootstrap` and verify the app works
  2. Read specs/changes/example/greetings/SPEC.md
  3. Trace: SPEC.md → PLAN.md → Code
  4. Try modifying the greeting format as an exercise

READY TO BUILD YOUR OWN FEATURE:

  /sdd-new-change --type feature --name <your-feature>

  This will create a new change spec for you to fill in,
  then guide you through planning and implementation.
```

### Phase 4: Component-Level Documentation

**Goal**: Each component directory explains itself.

#### 4.1 Backend README

**File**: `plugin/skills/backend-scaffolding/templates/README.md` (new)

Full README explaining:
- CMDO architecture with diagram
- Directory structure
- How to add a new endpoint (step by step)
- How to add a new use-case
- How to add a new DAL function
- In-memory vs PostgreSQL database
- Configuration
- Testing

#### 4.2 Frontend README

**File**: `plugin/skills/frontend-scaffolding/templates/README.md` (new)

Full README explaining:
- MVVM pattern with hooks as ViewModels
- Directory structure
- How to add a new page
- How to add a new API call
- TanStack Query patterns
- Tailwind CSS
- Vite configuration

#### 4.3 Contract README

**File**: `plugin/skills/contract-scaffolding/templates/README.md` (new)

Full README explaining:
- OpenAPI 3.0 structure
- How to add a new endpoint
- How to add a new schema
- Type generation (when and how)
- Validation

### Phase 5: Infrastructure Templates (Deferred)

The helm, testing, and cicd scaffolding skills can be deferred. They're not blocking the "ready-to-work" goal since:
- Helm isn't needed for local development
- Testing structure exists (vitest configured)
- CI/CD is post-MVP

Create placeholder READMEs explaining these are coming:

**File**: `plugin/skills/project-scaffolding/templates/components/helm/README.md` (if helm selected)
```markdown
# Helm Charts

Helm chart scaffolding is coming soon.

For now, you can manually create Helm charts in this directory
or use `helm create <chart-name>` to generate a starter chart.
```

---

## File Changes Summary

### New Files

| File | Phase | Purpose |
|------|-------|---------|
| `templates/specs/domain/definitions/greeting.md` | 2.1 | Greeting entity spec |
| `templates/specs/domain/use-cases/create-greeting.md` | 2.2 | Create greeting use-case spec |
| `templates/specs/changes/example/greetings/SPEC.md` | 2.4 | Example change specification |
| `templates/specs/changes/example/greetings/PLAN.md` | 2.5 | Example implementation plan |
| `templates/backend/README.md` | 4.1 | Backend documentation |
| `templates/frontend/README.md` | 4.2 | Frontend documentation |
| `templates/contract/README.md` | 4.3 | Contract documentation |

### Modified Files

| File | Phase | Changes |
|------|-------|---------|
| `templates/project/package.json` | 1.1 | Add bootstrap script |
| `templates/project/README.md` | 1.4 | Simplify quick start |
| `templates/specs/glossary.md` | 2.3 | Add Greeting term |
| `plugin/commands/sdd-init.md` | 3.1 | Update completion report |
| `scaffolding.ts` | 1.2 | Verify script generation |

### Template Directories to Create

```
templates/specs/
├── domain/
│   ├── definitions/
│   │   └── greeting.md          # NEW
│   └── use-cases/
│       └── create-greeting.md   # NEW
└── changes/
    └── example/
        └── greetings/
            ├── SPEC.md          # NEW
            └── PLAN.md          # NEW
```

---

## Success Criteria

After implementation, a developer should be able to:

1. **Run `sdd-init --name my-app`** and get a complete project
2. **Run `npm run bootstrap`** with zero errors
3. **See the greeter page** at http://localhost:5173
4. **Create a greeting** and see it work
5. **Read the example spec** at `specs/changes/example/greetings/SPEC.md`
6. **Understand how specs map to code** by tracing the example
7. **Know exactly what to do next**: `/sdd-new-change --type feature --name <feature>`

---

## Verification Checklist

Before marking complete, verify:

- [ ] `npm run bootstrap` works on fresh project
- [ ] Frontend loads at http://localhost:5173
- [ ] Greeter page creates a greeting successfully
- [ ] `specs/changes/example/greetings/SPEC.md` exists and is readable
- [ ] `specs/domain/glossary.md` includes Greeting
- [ ] `specs/domain/definitions/greeting.md` exists
- [ ] Completion report shows clear next steps
- [ ] Each component has a README

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Too many new files overwhelm the developer | Keep specs concise, add "This is an example" markers everywhere |
| Example feels contrived | Make it genuinely useful - a greeting system is simple but real |
| Complexity creep | Defer infrastructure templates (helm, cicd) to separate task |
| Breaking existing scaffolding | Add tests for scaffolding output verification |

---

## Open Questions Resolved

1. **Should the example be a change spec?** → Yes, it demonstrates the methodology
2. **Should we remove k8s from quick start?** → Yes, defer to "Production Deployment" section
3. **Is in-memory database a feature or hack?** → Feature - document it as such
4. **Should greeting specs be part of domain-population?** → No, they're static templates (the example is fixed, not dynamic based on discovery)
