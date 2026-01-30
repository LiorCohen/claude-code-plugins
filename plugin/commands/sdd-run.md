---
name: sdd-run
description: Run sdd-system CLI commands.
---

# /sdd-run

Unified command to run sdd-system CLI operations.

## Usage

```
/sdd-run <namespace> <action> [args] [options]
```

## Namespaces

| Namespace | Description |
|-----------|-------------|
| `scaffolding` | Project and domain scaffolding |
| `spec` | Spec validation, indexing, snapshots |
| `version` | Version bumping |
| `database` | Database component operations |
| `contract` | Contract component operations |
| `hook` | Hook handlers (internal use) |

## Examples

### Spec Operations

```bash
# Validate a specific spec
/sdd-run spec validate specs/feature.md

# Validate all specs
/sdd-run spec validate --all --specs-dir specs/

# Generate index
/sdd-run spec index --specs-dir specs/

# Generate snapshot
/sdd-run spec snapshot --specs-dir specs/
```

### Scaffolding

```bash
# Create new project structure
/sdd-run scaffolding project --config /tmp/config.json

# Populate domain specs
/sdd-run scaffolding domain --config /tmp/domain-config.json
```

### Version

```bash
# Bump patch version
/sdd-run version bump patch

# Bump minor version
/sdd-run version bump minor

# Bump major version
/sdd-run version bump major
```

### Database Operations

```bash
# Deploy PostgreSQL
/sdd-run database setup my-db

# Run migrations
/sdd-run database migrate my-db

# Seed database
/sdd-run database seed my-db

# Reset database (teardown + setup + migrate + seed)
/sdd-run database reset my-db

# Port forward to local
/sdd-run database port-forward my-db

# Open psql shell
/sdd-run database psql my-db

# Teardown
/sdd-run database teardown my-db
```

### Contract Operations

```bash
# Generate TypeScript types from OpenAPI spec
/sdd-run contract generate-types my-api

# Validate OpenAPI spec
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

## Help

To see available actions for a namespace:

```bash
/sdd-run <namespace> --help
```

To see all namespaces:

```bash
/sdd-run --help
```
