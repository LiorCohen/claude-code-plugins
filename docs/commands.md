# SDD Commands

<!--
This file is maintained by the docs-writer agent.
To update, invoke the docs-writer agent with your changes.
-->

> Reference for all SDD slash commands.

## /sdd-init

Initialize a new SDD project with minimal structure.

```
/sdd-init
```

**No arguments required.** Project name is derived from the current directory.

**What it does:**
1. Detects project name from current directory
2. Verifies environment (required tools, plugin, permissions)
3. Asks about planned components (informational only)
4. Creates minimal structure (config component only)
5. Initializes git and commits

**What it does NOT do (deferred to first change):**
- Product discovery
- Domain population
- Full component scaffolding

**Example:**
```bash
cd inventory-tracker
/sdd-init
```

---

## /sdd-new-change

Start a new feature, bugfix, refactor, epic, or import from an external spec.

```
/sdd-new-change --type <type> --name <name>
/sdd-new-change --spec <path>
```

**Arguments:**
- `--type` (required without `--spec`) - One of: `feature`, `bugfix`, `refactor`, `epic`
- `--name` (required without `--spec`) - Short identifier for the change
- `--spec` (alternative mode) - Path to external specification file

**What it does:**

*Interactive mode (`--type` and `--name`):*
1. Runs discovery skills to understand the change
2. Recommends affected components
3. **Scaffolds components on-demand** (if not yet scaffolded)
4. Updates domain glossary with new entities
5. Creates a spec (`SPEC.md`) with acceptance criteria
6. Creates an implementation plan (`PLAN.md`)
7. Places files in `changes/YYYY/MM/DD/<name>/`

*External spec mode (`--spec`):*
1. Analyzes the external spec for change decomposition
2. Lets you adjust the breakdown (merge, rename, etc.)
3. Creates self-sufficient change specs with embedded content
4. Archives original spec to `archive/` for audit

**Examples:**
```bash
# Interactive mode
/sdd-new-change --type feature --name user-preferences

# From external spec
/sdd-new-change --spec /path/to/requirements.md
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

Manage your local development environment and validate artifacts.

```
/sdd-run <namespace> <action> [args] [options]
```

**When to use:** While workflow commands (`/sdd-init`, `/sdd-implement-change`, etc.) orchestrate multi-step processes with agents, `/sdd-run` gives you direct control over local dev operations—spinning up databases, running migrations, or validating your API contract.

### Database Operations

Manage your local PostgreSQL database:

```bash
# Start a local database
/sdd-run database setup my-db

# Run migrations
/sdd-run database migrate my-db

# Seed with test data
/sdd-run database seed my-db

# Reset database (teardown + setup + migrate + seed)
/sdd-run database reset my-db

# Open psql shell for debugging
/sdd-run database psql my-db

# Port forward to access remote database locally
/sdd-run database port-forward my-db

# Tear down when done
/sdd-run database teardown my-db
```

### Contract Validation

Validate your OpenAPI specification:

```bash
# Validate the API contract
/sdd-run contract validate my-api
```

### Permission Management

Configure Claude Code permissions for SDD:

```bash
# Merge SDD recommended permissions into your settings
/sdd-run permissions configure
```

**Global Options:**
- `--json` - Output in JSON format
- `--verbose` - Enable verbose logging
- `--help` - Show help for namespace/action

---

## Next Steps

- [Getting Started](getting-started.md) - First project tutorial
- [Workflows](workflows.md) - How to use these commands together
- [Agents](agents.md) - The specialized agents behind the commands
- [Configuration Guide](config-guide.md) - Config system details
