# SDD Commands

<!--
This file is maintained by the docs-writer agent.
To update, invoke the docs-writer agent with your changes.
-->

> Reference for all SDD slash commands.

## /sdd-init

Initialize a new SDD project.

```
/sdd-init --name <project-name> [--spec <path>]
```

**Arguments:**
- `--name` (required) - Your project name
- `--spec` (optional) - Path to an external spec to import

**What it does:**
1. Runs interactive product discovery
2. Recommends components based on your needs
3. Creates project structure after your approval
4. Populates domain glossary and definitions

**Example:**
```
/sdd-init --name inventory-tracker
```

---

## /sdd-new-change

Start a new feature, bugfix, refactor, or epic.

```
/sdd-new-change --type <type> --name <name>
```

**Arguments:**
- `--type` (required) - One of: `feature`, `bugfix`, `refactor`, `epic`
- `--name` (required) - Short identifier for the change

**What it does:**
1. Collects information about the change
2. Creates a spec (`SPEC.md`) with acceptance criteria
3. Creates an implementation plan (`PLAN.md`)
4. Places files in `changes/YYYY/MM/DD/<name>/`

**Example:**
```
/sdd-new-change --type feature --name user-preferences
```

---

## /sdd-implement-change

Execute an implementation plan.

```
/sdd-implement-change <change-dir>
```

**Arguments:**
- `<change-dir>` (required) - Path to the change directory containing `PLAN.md`

**What it does:**
1. Reads the implementation plan
2. Executes each phase using specialized agents
3. Runs tests as specified in the plan

**Example:**
```
/sdd-implement-change changes/2026/01/15/user-preferences
```

---

## /sdd-verify-change

Verify implementation matches the spec.

```
/sdd-verify-change <change-dir>
```

**Arguments:**
- `<change-dir>` (required) - Path to the change directory containing `SPEC.md`

**What it does:**
1. Reads the spec and acceptance criteria
2. Reviews the implemented code
3. Reports any discrepancies

**Example:**
```
/sdd-verify-change changes/2026/01/15/user-preferences
```

---

## /sdd-config

Manage project configuration.

```
/sdd-config <operation> [options]
```

**Operations:**
- `generate` - Generate merged config for an environment
- `validate` - Validate config against schemas
- `diff` - Show differences between environments
- `add-env` - Add a new environment

**Examples:**
```bash
# Generate config for local development
/sdd-config generate --env local --component server-task-service --output ./local-config.yaml

# Validate all environments
/sdd-config validate

# Compare local vs production
/sdd-config diff local production

# Add staging environment
/sdd-config add-env staging
```

See [Configuration Guide](config-guide.md) for detailed usage.

---

## /sdd-run

Run a server or webapp component with config.

```
/sdd-run <component> [--env <env>]
```

**Arguments:**
- `<component>` (required) - Component to run (e.g., `server-task-service`)
- `--env` (optional) - Environment to use (default: `local`)

**What it does:**
1. Generates merged config for the component
2. Sets `SDD_CONFIG_PATH` environment variable
3. Runs the component's dev script

**Example:**
```
/sdd-run server-task-service --env local
```

---

## Next Steps

- [Getting Started](getting-started.md) - First project tutorial
- [Workflows](workflows.md) - How to use these commands together
- [Agents](agents.md) - The specialized agents behind the commands
- [Configuration Guide](config-guide.md) - Config system details
