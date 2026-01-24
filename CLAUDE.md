# CLAUDE.md

## Git Rules

- **NEVER push to remote** without explicit user approval
- **ALWAYS use the `commit` skill** for commits

## Tools

- **TypeScript LSP** - Configured in `.claude/cclsp.json`
- **Context7** - Enabled for up-to-date library documentation

## Repository Structure

```
claude-code-plugins/
├── .claude/
│   ├── cclsp.json                    # TypeScript LSP config
│   ├── settings.json                 # Context7 enabled
│   └── skills/
│       ├── commit/                   # Commit workflow with version/changelog
│       └── typescript-standards/     # TypeScript coding standards
├── .claude-plugin/
│   └── marketplace.json              # Marketplace manifest
├── plugins/
│   └── sdd/                          # SDD plugin (see plugins/sdd/README.md)
├── tests/sdd/                        # Plugin tests
├── README.md
├── CLAUDE.md
├── CHANGELOG.md
└── CONTRIBUTING.md
```
