# CLAUDE.md

## Git Rules

- **NEVER push to remote** without explicit user approval
- **ALWAYS use the `commit` skill** for commits (see Skills below)

## Tools

- **TypeScript LSP** - Configured in `.claude/cclsp.json`
- **Context7** - Enabled for up-to-date library documentation

## Skills

- **commit** - Use for all commits (handles version bump + changelog)
- **tasks** - Manage tasks and plans using `tasks/` directory
- **plugin-testing-standards** - Follow when writing or modifying tests
- **typescript-standards** - Follow when writing TypeScript code

## Repository Structure

```
sdd/
├── .claude/
│   ├── cclsp.json                    # TypeScript LSP config
│   ├── settings.json                 # Context7 enabled
│   └── skills/
│       ├── commit/                   # Commit workflow with version/changelog
│       ├── tasks/                    # Task management skill
│       ├── plugin-testing-standards/ # Testing methodology for plugins
│       └── typescript-standards/     # TypeScript coding standards
├── .claude-plugin/
│   └── marketplace.json              # Marketplace manifest
├── tasks/                               # Task data (TASKS.md + plans/)
│   ├── TASKS.md                         # Backlog with all tasks
│   └── plans/                           # Implementation plans
├── plugin/                              # SDD plugin
├── tests/                               # Plugin tests
├── README.md
├── CLAUDE.md
├── CHANGELOG.md
└── CONTRIBUTING.md
```
