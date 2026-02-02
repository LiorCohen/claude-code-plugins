# CLAUDE.md

## Task Management Rules (MANDATORY)

**You MUST use the `tasks` skill (`/tasks`) for all non-trivial work:**

1. **Before ANY implementation work:**
   - Use `/tasks add <description>` to create a task first
   - Do NOT start coding until a task exists

2. **Before planning:**
   - Use `/tasks plan <id>` to move task to planning status
   - Create a plan.md in the task folder

3. **Before implementing:**
   - Use `/tasks implement <id>` to move task to implementing status
   - This creates a feature branch automatically

4. **After completing work:**
   - Use `/tasks complete <id>` or `/tasks review <id>`

**NEVER:**
- Jump straight into code changes without a task
- Make implementation changes on main branch
- Skip the planning phase for non-trivial work

**Exceptions (no task needed):**
- Typo fixes
- Task management operations themselves
- Answering questions / research only

## Git Rules

- **NEVER push to remote** without explicit user approval
- **ALWAYS use the `commit` skill** for commits (see Skills below)

## Tools

- **TypeScript LSP** - Configured in `.claude/cclsp.json`
- **Context7** - Enabled for up-to-date library documentation

## Skills

- **commit** - Use for all commits (handles version bump + changelog)
- **tasks** - Manage tasks and plans using `.tasks/` directory
- **manifest-validation** - Validate plugin/marketplace manifests before commits
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
│       ├── manifest-validation/      # Validate plugin manifests
│       ├── plugin-testing-standards/ # Testing methodology for plugins
│       └── typescript-standards/     # TypeScript coding standards
├── .claude-plugin/
│   └── marketplace.json              # Marketplace manifest
├── .tasks/                              # Task data
│   ├── INDEX.md                         # Task index (links to issues/)
│   ├── issues/                          # Individual task files by status
│   └── plans/                           # Implementation plans
├── plugin/                              # SDD plugin
├── tests/                               # Plugin tests
├── README.md
├── CLAUDE.md
├── CHANGELOG.md
└── CONTRIBUTING.md
```
