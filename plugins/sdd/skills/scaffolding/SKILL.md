---
name: scaffolding
description: Orchestrates project scaffolding using component-specific scaffolding skills.
---

# Scaffolding Skill

Orchestrates project scaffolding by delegating to component-specific scaffolding skills.

## Architecture

This skill coordinates multiple component scaffolding skills:

| Skill | Purpose | Templates Location |
|-------|---------|-------------------|
| `project-scaffolding` | Root files, specs, config | `skills/project-scaffolding/templates/` |
| `backend-scaffolding` | Server components (CMDO) | `skills/backend-scaffolding/templates/` |
| `frontend-scaffolding` | Webapp components (MVVM) | `skills/frontend-scaffolding/templates/` |
| `contract-scaffolding` | OpenAPI contract | `skills/contract-scaffolding/templates/` |
| `database-scaffolding` | PostgreSQL database | `skills/database-scaffolding/templates/` |

## When to Use

Use this skill when you need to create the SDD project structure after the user has approved the project configuration.

## Usage

After gathering project configuration in `/sdd-init`, call the scaffold script:

```bash
# 1. Create a config JSON file
cat > /tmp/sdd-scaffold-config.json << 'EOF'
{
    "project_name": "<user-provided-name>",
    "project_description": "<user-provided-description>",
    "primary_domain": "<user-provided-domain>",
    "target_dir": "<absolute-path-to-project-directory>",
    "components": ["contract", "server", "webapp", "config", "testing", "cicd"],
    "skills_dir": "<path-to-plugin>/skills"
}
EOF

# 2. Run the scaffold script
npx ts-node --esm <path-to-plugin>/skills/scaffolding/scaffolding.ts --config /tmp/sdd-scaffold-config.json

# 3. Clean up config file
rm /tmp/sdd-scaffold-config.json
```

## Config Fields

| Field | Required | Description |
|-------|----------|-------------|
| `project_name` | Yes | Project name (used for variable substitution) |
| `project_description` | No | Brief description (defaults to "A {name} project") |
| `primary_domain` | No | Primary business domain (defaults to "General") |
| `target_dir` | Yes | Absolute path to create project in |
| `components` | Yes | List of components to create (see below for formats) |
| `skills_dir` | Yes | Path to the skills directory (templates are colocated) |

## Component Format

Components are specified as a list of objects with `type` and `name` (both required):

```yaml
components:
  - type: contract
    name: contract                  # -> components/contract/
  - type: server
    name: server                    # -> components/server/
  - type: webapp
    name: webapp                    # -> components/webapp/
  - type: database
    name: database                  # -> components/database/
  - type: config
    name: config                    # -> config/
  - type: testing
    name: testing                   # -> testing config
  - type: cicd
    name: cicd                      # -> CI/CD workflows
```

**Multiple instances of the same type:**
```yaml
components:
  - type: server
    name: api                       # -> components/server-api/
  - type: server
    name: worker                    # -> components/server-worker/
  - type: webapp
    name: admin                     # -> components/webapp-admin/
  - type: webapp
    name: public                    # -> components/webapp-public/
```

### Directory Naming

| Component | Directory Created |
|-----------|-------------------|
| `{type: server, name: server}` | `components/server/` |
| `{type: server, name: api}` | `components/server-api/` |
| `{type: webapp, name: admin}` | `components/webapp-admin/` |

### Rules

- Both `type` and `name` are ALWAYS required
- Names must be lowercase, hyphens allowed, no spaces
- When `name` matches `type`, directory is `components/{type}/`
- When `name` differs from `type`, directory is `components/{type}-{name}/`

## Available Components

| Component | Scaffolding Skill | Multiple Instances |
|-----------|-------------------|-------------------|
| `contract` | `contract-scaffolding` | No |
| `server` | `backend-scaffolding` | Yes |
| `webapp` | `frontend-scaffolding` | Yes |
| `database` | `database-scaffolding` | No |
| `config` | `project-scaffolding` | No (always included) |
| `helm` | (inline) | No |
| `testing` | (inline) | No |
| `cicd` | (inline) | No |

## Component Presets

**Full-Stack Application (default):**
```yaml
- {type: contract, name: contract}
- {type: server, name: server}
- {type: webapp, name: webapp}
- {type: database, name: database}
- {type: config, name: config}
- {type: testing, name: testing}
- {type: cicd, name: cicd}
```

**Backend API Only:**
```yaml
- {type: contract, name: contract}
- {type: server, name: server}
- {type: config, name: config}
- {type: testing, name: testing}
- {type: cicd, name: cicd}
```

**Frontend Only:**
```yaml
- {type: webapp, name: webapp}
- {type: config, name: config}
- {type: testing, name: testing}
- {type: cicd, name: cicd}
```

**Multi-Backend:**
```yaml
- {type: contract, name: contract}
- {type: server, name: api}
- {type: server, name: worker}
- {type: config, name: config}
- {type: testing, name: testing}
- {type: cicd, name: cicd}
```

**Multi-Frontend:**
```yaml
- {type: contract, name: contract}
- {type: server, name: server}
- {type: webapp, name: admin}
- {type: webapp, name: public}
- {type: config, name: config}
- {type: testing, name: testing}
- {type: cicd, name: cicd}
```

**Backend with Database:**
```yaml
- {type: contract, name: contract}
- {type: server, name: server}
- {type: database, name: database}
- {type: config, name: config}
- {type: testing, name: testing}
- {type: cicd, name: cicd}
```

## Scaffolding Order

The script executes in this order:

1. **Project scaffolding** - Root files, specs, config (always first)
2. **Contract scaffolding** - OpenAPI spec (if selected)
3. **Backend scaffolding** - Server components (for each instance)
4. **Frontend scaffolding** - Webapp components (for each instance)
5. **Database scaffolding** - Migrations, seeds, scripts (if selected)
6. **Infrastructure** - Helm, testing, CI/CD (inline, if selected)

## Template Locations

Templates are colocated with their scaffolding skills:

```
skills/
├── project-scaffolding/
│   ├── SKILL.md
│   └── templates/
│       ├── project/          # README.md, CLAUDE.md, package.json
│       ├── specs/            # INDEX.md, SNAPSHOT.md, glossary.md
│       └── config/           # config.yaml, schemas/
├── backend-scaffolding/
│   ├── SKILL.md
│   └── templates/            # Server component files
├── frontend-scaffolding/
│   ├── SKILL.md
│   └── templates/            # Webapp component files
├── contract-scaffolding/
│   ├── SKILL.md
│   └── templates/            # openapi.yaml, package.json
├── database-scaffolding/
│   ├── SKILL.md
│   └── templates/            # migrations/, seeds/, scripts/
└── scaffolding/
    ├── SKILL.md              # This file (orchestrator)
    └── scaffolding.ts        # TypeScript script
```

## After Scaffolding

1. **Initialize git** (if not already in a repo):
   ```bash
   cd <project-dir> && git init && git add . && git commit -m "Initial project setup"
   ```

2. **Verify structure** with `tree` command

3. **Display next steps** to the user
