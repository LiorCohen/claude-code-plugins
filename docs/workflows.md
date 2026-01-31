# SDD Workflows

<!--
This file is maintained by the docs-writer agent.
To update, invoke the docs-writer agent with your changes.
-->

> How to use SDD for features, bugfixes, refactors, and epics.

## The Core Loop

Every change in SDD follows the same pattern:

1. **Spec** - Define what you're building
2. **Plan** - Break it into implementation phases
3. **Implement** - Execute the plan with specialized agents
4. **Verify** - Confirm the code matches the spec

## Feature Workflow

Use this when adding new functionality.

### 1. Create the Feature Spec

```
/sdd-new-change --type feature --name checkout-flow
```

You'll be asked about:
- Which domain this feature belongs to
- What the feature does (acceptance criteria)
- Any dependencies or constraints

### 2. Review the Spec and Plan

The command creates two files:
- `SPEC.md` - What you're building
- `PLAN.md` - How to build it (phased implementation)

Review both. This is your last chance to catch misunderstandings before code is written.

### 3. Implement

```
/sdd-implement-change changes/2026/01/15/checkout-flow
```

Specialized agents execute each phase of the plan:
- `api-designer` defines contracts
- `backend-dev` implements server logic
- `frontend-dev` builds the UI
- `tester` writes tests

### 4. Verify

```
/sdd-verify-change changes/2026/01/15/checkout-flow
```

The `reviewer` agent checks that the implementation matches the spec.

## Bugfix Workflow

Use this when fixing existing behavior.

```
/sdd-new-change --type bugfix --name login-timeout-error
```

Bugfix specs require:
- Current (broken) behavior
- Expected (correct) behavior
- Steps to reproduce

The implementation plan is typically shorter - focused on the fix and regression tests.

## Refactor Workflow

Use this when restructuring code without changing behavior.

```
/sdd-new-change --type refactor --name extract-auth-service
```

Refactor specs require:
- Current structure
- Target structure
- Reason for the change

The plan emphasizes maintaining behavior while changing structure.

## Epic Workflow

Use this when a goal requires multiple features working together.

```
/sdd-new-change --type epic --name checkout-system
```

Epic specs require:
- Overall goal and acceptance criteria
- List of child changes (features) with descriptions
- Dependencies between child changes

The command creates an epic directory with a parent SPEC.md and PLAN.md, plus a `changes/` subdirectory containing child feature changes, each with their own SPEC.md and PLAN.md.

### Implementation

Each child change is implemented as an independent PR:

```
/sdd-implement-change changes/2026/01/27/checkout-system
```

The command reads the epic PLAN.md for dependency order and implements child changes sequentially, creating a branch per child change (`epic/checkout-system/shopping-cart`, etc.).

### Verification

```
/sdd-verify-change changes/2026/01/27/checkout-system
```

Verifies each child change individually, then checks that the combined implementation satisfies all epic-level acceptance criteria.

## Configuration Workflow

Use this when you need to add or modify configuration.

### 1. Add Config Property

Edit `components/config/envs/default/config.yaml`:

```yaml
server-task-service:
  port: 3000
  newProperty: value
```

### 2. Add Environment Override (if needed)

Edit `components/config/envs/local/config.yaml`:

```yaml
server-task-service:
  newProperty: localValue
```

### 3. Update Types

Edit `components/config/types/server.ts`:

```typescript
export type ServerConfig = Readonly<{
  port?: number;
  newProperty?: string;
}>;
```

### 4. Generate and Run

```bash
/sdd-config generate --env local --component server-task-service --output ./local-config.yaml
SDD_CONFIG_PATH=./local-config.yaml npm run dev
```

See the [Configuration Guide](config-guide.md) for complete details.

## Tips

**Small changes are better.** A feature that takes 6 phases is harder to review than three 2-phase features.

**Specs are living documents.** If requirements change during implementation, update the spec first.

**Trust the agents.** Each agent has specific expertise. Let `backend-dev` handle server code, `frontend-dev` handle UI.

**Config before code.** When adding features that need configuration, add the config properties first, then implement the feature.

## Next Steps

- [Commands](commands.md) - Full command reference
- [Agents](agents.md) - What each agent does
- [Configuration Guide](config-guide.md) - Config system details
