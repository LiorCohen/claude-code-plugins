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
/sdd-change new --type feature --name checkout-flow
```

You'll go through a guided solicitation workflow:
- Context and problem description
- Functional and non-functional requirements
- User stories and acceptance criteria
- Edge cases and dependencies

**What happens automatically:**
- **Requirements gathering** - SDD guides you through comprehensive solicitation
- **Component detection** - Determines affected components
- **On-demand scaffolding** - If a component doesn't exist yet, it's scaffolded now
- **Domain updates** - Glossary updated with new entities from your feature

### 2. Review and Approve the Spec

The spec is created with new sections:
- `SPEC.md` - What you're building, including Domain Model and Specs Directory Changes

Review the spec. Status is now `spec_review`.

```
/sdd-change approve spec <change-id>
```

This creates the implementation plan (`PLAN.md`). Status advances to `plan_review`.

### 3. Approve the Plan and Implement

Review the plan, then approve it:

```
/sdd-change approve plan <change-id>
```

Now implement:

```
/sdd-change implement <change-id>
```

Specialized agents execute each phase of the plan:
- `api-designer` defines contracts
- `backend-dev` implements server logic
- `frontend-dev` builds the UI
- `tester` writes tests

Checkpoint commits are created after each phase for recovery.

### 4. Verify

```
/sdd-change verify <change-id>
```

The `reviewer` agent checks that the implementation matches the spec.

## Bugfix Workflow

Use this when fixing existing behavior.

```
/sdd-change new --type bugfix --name login-timeout-error
```

Bugfix specs require:
- Current (broken) behavior
- Expected (correct) behavior
- Steps to reproduce

The implementation plan is typically shorter - focused on the fix and regression tests.

## Refactor Workflow

Use this when restructuring code without changing behavior.

```
/sdd-change new --type refactor --name extract-auth-service
```

Refactor specs require:
- Current structure
- Target structure
- Reason for the change

The plan emphasizes maintaining behavior while changing structure.

## Epic Workflow

Use this when a goal requires multiple features working together.

```
/sdd-change new --type epic --name checkout-system
```

Epic specs require:
- Overall goal and acceptance criteria
- List of child changes (features) with descriptions
- Dependencies between child changes

The command creates workflow items for each child feature, tracking them in `.sdd/workflows/<workflow-id>/workflow.yaml`.

### Implementation

Each child change is implemented in dependency order:

```
/sdd-change implement <change-id>
```

The workflow tracks dependency order and implements child changes sequentially, creating checkpoint commits after each phase.

### Verification

```
/sdd-change verify <change-id>
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

## On-Demand Scaffolding

Components are scaffolded when you first create a change that needs them:

1. You create a feature that affects a server component
2. `/sdd-change new` detects the server component isn't scaffolded yet
3. The server component is scaffolded automatically
4. The component is added to `.sdd/sdd-settings.yaml`
5. Config sections for the component are added
6. Your feature spec is created

This means your project grows organically - you only have what you've actually needed.

## Tips

**Small changes are better.** A feature that takes 6 phases is harder to review than three 2-phase features.

**Specs are living documents.** If requirements change during implementation, update the spec first.

**Trust the agents.** Each agent has specific expertise. Let `backend-dev` handle server code, `frontend-dev` handle UI.

**Config before code.** When adding features that need configuration, add the config properties first, then implement the feature.

**First change scaffolds components.** Don't worry about component setup - the first change that needs a component will create it automatically.

## Next Steps

- [Commands](commands.md) - Full command reference
- [Agents](agents.md) - What each agent does
- [Configuration Guide](config-guide.md) - Config system details
