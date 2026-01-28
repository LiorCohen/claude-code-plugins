# CLAUDE.md

## Git Rules

- **NEVER push to remote** without explicit user approval
- **ALWAYS use the `commit` skill** for commits (see Skills below)

## Tools

- **TypeScript LSP** - Configured in `.claude/cclsp.json`
- **Context7** - Enabled for up-to-date library documentation

## Skills

- **commit** - Use for all commits (handles version bump + changelog)
- **plugin-testing-standards** - Follow when writing or modifying tests
- **typescript-standards** - Follow when writing TypeScript code

## Repository Structure

```
claude-code-plugins/
├── .claude/
│   ├── cclsp.json                    # TypeScript LSP config
│   ├── settings.json                 # Context7 enabled
│   └── skills/
│       ├── commit/                   # Commit workflow with version/changelog
│       ├── plugin-testing-standards/ # Testing methodology for plugins
│       └── typescript-standards/     # TypeScript coding standards
├── .claude-plugin/
│   └── marketplace.json              # Marketplace manifest
├── plugin/                              # SDD plugin (see plugin/README.md)
├── tests/                               # Plugin tests
├── README.md
├── CLAUDE.md
├── CHANGELOG.md
└── CONTRIBUTING.md
```
