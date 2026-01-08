# Quick Start Guide

## Plugin Overview

This plugin implements a complete spec-driven development methodology for full-stack teams.

## Directory Structure

```
sdd/
├── plugin.json                 # Plugin configuration
├── README.md                   # Plugin documentation
├── QUICKSTART.md              # This file
├── agents/                     # 10 specialized agents
│   ├── spec-writer.md
│   ├── planner.md
│   ├── api-designer.md
│   ├── frontend-dev.md
│   ├── backend-dev.md
│   ├── db-advisor.md
│   ├── devops.md
│   ├── ci-dev.md
│   ├── tester.md
│   └── reviewer.md
├── skills/                     # 4 reusable skills
│   ├── spec-writing.md
│   ├── planning.md
│   ├── testing.md
│   └── spec-index.md
├── commands/                   # 5 slash commands
│   ├── init.md
│   ├── new-feature.md
│   ├── implement-spec.md
│   ├── verify-spec.md
│   └── generate-snapshot.md
├── templates/                  # Project scaffolding
│   ├── project/
│   ├── specs/
│   └── components/
└── scripts/                    # Utility scripts
    ├── validate-spec.py
    ├── generate-index.py
    └── generate-snapshot.py
```

## Getting Started

### 1. Using the Plugin

This plugin is designed to work with Claude Code. Once loaded, you'll have access to:

**Agents:**
- `/agent spec-writer` - Create/update specifications
- `/agent planner` - Create implementation plans
- `/agent api-designer` - Design OpenAPI contracts
- `/agent frontend-dev` - Build React components
- `/agent backend-dev` - Build Node.js backend
- `/agent db-advisor` - Review database design
- `/agent devops` - Configure Kubernetes/Helm
- `/agent ci-dev` - Create CI/CD pipelines
- `/agent tester` - Write tests
- `/agent reviewer` - Code review

**Commands:**
- `/project:init [name]` - Initialize new project
- `/project:new-feature [name]` - Start new feature
- `/project:implement-spec [path]` - Implement a spec
- `/project:verify-spec [path]` - Verify implementation
- `/project:generate-snapshot` - Regenerate product snapshot

### 2. Initialize a New Project

```bash
# In Claude Code
/project:init my-awesome-app
```

This creates:
```
my-awesome-app/
├── specs/                  # Specifications
├── components/
│   ├── contract/          # OpenAPI API contract
│   ├── server/            # Node.js backend
│   ├── webapp/            # React frontend
│   ├── helm/              # Kubernetes deployment
│   └── testing/           # Testkube tests
└── .github/workflows/     # CI/CD
```

### 3. Create Your First Feature

```bash
# In Claude Code
/project:new-feature user-authentication
```

This will:
1. Create a spec in `specs/features/user-authentication/SPEC.md`
2. Create a plan in `specs/plans/YYYY/MM/DD/user-authentication/PLAN.md`
3. Update `specs/INDEX.md`

### 4. Implement the Feature

```bash
# In Claude Code
/project:implement-spec specs/features/user-authentication/SPEC.md
```

This orchestrates all agents to:
1. Design API contract (api-designer)
2. Build backend (backend-dev)
3. Build frontend (frontend-dev)
4. Create tests (tester)
5. Review code (reviewer, db-advisor)

### 5. Verify Implementation

```bash
# In Claude Code
/project:verify-spec specs/features/user-authentication/SPEC.md
```

## Core Principles

1. **Specs are truth** - Every feature has a SPEC.md before code
2. **Issue required** - Every spec references a tracking issue (JIRA, GitHub, etc.)
3. **Git = state machine** - PR = draft, merged to main = active
4. **Contract-first** - OpenAPI spec generates types for both frontend and backend
5. **5-layer backend** - Server → Controller → Model → Dependencies → DAL
6. **Immutable** - `readonly` everywhere, no mutations
7. **Test in Kubernetes** - Testkube for integration and E2E tests

## Workflow Example

```
┌─────────────────┐
│ 1. Write Spec   │ (spec-writer)
└────────┬────────┘
         ↓
┌─────────────────┐
│ 2. Create Plan  │ (planner)
└────────┬────────┘
         ↓
┌─────────────────┐
│ 3. Design API   │ (api-designer)
└────────┬────────┘
         ↓
┌─────────────────┐
│ 4. Implement    │ (backend-dev, frontend-dev)
└────────┬────────┘
         ↓
┌─────────────────┐
│ 5. Test         │ (tester)
└────────┬────────┘
         ↓
┌─────────────────┐
│ 6. Review       │ (reviewer, db-advisor)
└─────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `specs/INDEX.md` | Registry of all specs |
| `specs/SNAPSHOT.md` | Current product state |
| `specs/domain/glossary.md` | Domain terminology |
| `components/contract/openapi.yaml` | API contract |

## Validation

```bash
# Validate single spec
python scripts/validate-spec.py specs/features/my-feature/SPEC.md

# Validate all specs
python scripts/validate-spec.py --all --specs-dir specs/

# Generate index
python scripts/generate-index.py --specs-dir specs/

# Generate snapshot
python scripts/generate-snapshot.py --specs-dir specs/
```

## Next Steps

1. Read the full methodology in the original spec document
2. Explore agent definitions in `agents/`
3. Review templates in `templates/`
4. Initialize your first project with `/project:init`

## Support

For issues or questions, refer to:
- Plugin README.md
- Agent documentation in `agents/`
- Skill documentation in `skills/`
- Template examples in `templates/`
