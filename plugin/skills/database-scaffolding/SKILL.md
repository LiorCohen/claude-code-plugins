---
name: database-scaffolding
description: Scaffolds PostgreSQL database component with migrations, seeds, and management scripts.
---

# Database Scaffolding Skill

Creates database component structure for PostgreSQL-based projects.

## What It Creates

The directory path depends on the component name as defined in `sdd-settings.yaml`: `components/{type}-{name}/` (when type and name differ). Database components support multiple instances (e.g., `database-app-db/`, `database-analytics-db/`).

```
components/database[-<name>]/
├── package.json              # npm scripts (call sdd-system CLI)
├── README.md                 # Component documentation
├── migrations/
│   └── 001_initial_schema.sql
└── seeds/
    └── 001_seed_data.sql
```

## Template Variables

| Variable | Description |
|----------|-------------|
| `{{PROJECT_NAME}}` | Project name for naming and comments |

## When to Use

Use when your project needs:
- PostgreSQL database with version-controlled schema
- Migration-based schema management
- Seed data for development/testing
- Scripts for database lifecycle management

## Usage

After scaffolding, the database component provides npm scripts that call the sdd-system CLI:

```bash
# From components/database/ (path depends on component name)
npm run setup        # Deploy PostgreSQL to k8s
npm run teardown     # Remove PostgreSQL from k8s
npm run migrate      # Run all migrations in order
npm run seed         # Run all seed files in order
npm run reset        # Full reset: teardown + setup + migrate + seed
npm run port-forward # Port forward to local
npm run psql         # Open psql shell
```

Or use the CLI directly:

```bash
sdd-system database setup <component-name>
sdd-system database migrate <component-name>
sdd-system database seed <component-name>
sdd-system database reset <component-name>
```

## Prerequisites

The CLI commands require:
- PostgreSQL 14+ (client tools: `psql`, `createdb`, `dropdb`)
- Environment variables set:
  - `PGHOST` - Database host
  - `PGPORT` - Database port
  - `PGUSER` - Database user
  - `PGPASSWORD` - Database password
  - `PGDATABASE` - Database name

## Migration Conventions

Create numbered SQL files for sequential execution:

```
migrations/
├── 001_initial_schema.sql
├── 002_add_users_table.sql
├── 003_add_orders_table.sql
└── 004_add_indexes.sql
```

Each migration should:
- Be wrapped in `BEGIN`/`COMMIT` for transactional safety
- Be idempotent where possible (use `IF NOT EXISTS`)
- Follow patterns from the [postgresql skill](../postgresql/SKILL.md)

## Seed Conventions

Create numbered SQL files for seed data:

```
seeds/
├── 001_lookup_data.sql
├── 002_admin_users.sql
└── 003_sample_data.sql
```

Each seed file should:
- Use `ON CONFLICT DO NOTHING` for idempotency
- Be wrapped in transactions
- Follow patterns from [postgresql seed-data reference](../postgresql/references/seed-data.md)

## Integration with Server Component

The database component works alongside the server component:

```
components/
├── database/           # Schema, migrations, seeds
│   └── migrations/
└── server/
    └── src/dal/        # Data access layer queries
```

The server's DAL layer imports types and executes queries against the schema defined in the database component.

## Related Skills

- [postgresql](../postgresql/SKILL.md) - SQL patterns, deployment, and best practices
- [backend-scaffolding](../backend-scaffolding/SKILL.md) - Server component with DAL layer
