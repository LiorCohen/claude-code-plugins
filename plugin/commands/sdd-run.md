---
name: sdd-run
description: Manage local development environment and validate artifacts.
---

# /sdd-run

Manage your local development environment and validate artifacts.

## Usage

```
/sdd-run <namespace> <action> [args] [options]
```

## When to Use

While workflow commands (`/sdd-init`, `/sdd-implement-change`, etc.) orchestrate multi-step processes with agents, `/sdd-run` gives you direct control over local dev operations—spinning up databases, running migrations, or validating your API contract.

## Database Operations

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

## Contract Validation

Validate your OpenAPI specification:

```bash
# Validate the API contract
/sdd-run contract validate my-api
```

## Global Options

| Option | Description |
|--------|-------------|
| `--json` | Output in JSON format |
| `--verbose` | Enable verbose logging |
| `--help` | Show help for namespace/action |

## Execution

When you invoke `/sdd-run`, execute the following:

```bash
node --enable-source-maps "${CLAUDE_PLUGIN_ROOT}/system/dist/cli.js" <namespace> <action> [args] [options]
```

Where `CLAUDE_PLUGIN_ROOT` is the path to the SDD plugin directory.

---

## Internal Namespaces

The following namespaces are used internally by other commands and should not be invoked directly:

- `scaffolding` - Used by `/sdd-init` for project setup
- `spec` - Used for spec validation, indexing, and snapshots
- `version` - Used by the commit skill for version bumping
- `hook` - Hook handlers for internal use
- `contract generate-types` - Invoked automatically during implementation plans
