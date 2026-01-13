# Claude Code Plugin Marketplace

This repository contains a collection of plugins for [Claude Code](https://claude.com/code), organized as a local plugin marketplace.

## What is Claude Code?

Claude Code is an AI-powered coding assistant that helps developers with software engineering tasks. It supports a plugin system that allows extending its capabilities with custom commands, agents, and workflows.

## What is a Plugin Marketplace?

A plugin marketplace is a directory structure that organizes multiple Claude Code plugins in one location. Claude Code can discover and load plugins from marketplace directories, making it easy to manage and distribute collections of related plugins.

## Structure

```
.
├── .claude-plugin/
│   └── marketplace.json                # Marketplace manifest
└── full-stack-spec-driven-dev/         # Individual plugin directory
    ├── .claude-plugin/
    │   └── plugin.json                 # Plugin manifest
    ├── agents/                         # Specialized agents
    ├── commands/                       # Slash commands
    ├── skills/                         # Reusable knowledge modules
    ├── templates/                      # Project scaffolding
    ├── scripts/                        # Utility scripts
    ├── README.md                       # Plugin documentation
    ├── QUICKSTART.md                  # Getting started guide
    └── CHANGELOG.md                   # Version history
```

## Plugins in this Marketplace

### SDD (Spec-Driven Development)

**Version:** 1.9.0

A comprehensive plugin for spec-driven development methodology, designed for full-stack TypeScript/React teams.

**Key Features:**
- 10 specialized agents (spec-writer, planner, backend-dev, frontend-dev, etc.)
- 5 slash commands for project lifecycle management
- Contract-first API development with OpenAPI
- 5-layer backend architecture with strict patterns
- MVVM frontend architecture with TanStack ecosystem
- Built-in observability with OpenTelemetry

**Commands:**
- `/sdd-init` - Initialize new project from template
- `/sdd-new-feature` - Create feature spec and plan
- `/sdd-implement-plan` - Execute implementation plan
- `/sdd-verify-spec` - Verify implementation matches spec
- `/sdd-generate-snapshot` - Regenerate product snapshot

**Documentation:**
- [Plugin README](./full-stack-spec-driven-dev/README.md) - Complete feature overview
- [Quick Start Guide](./full-stack-spec-driven-dev/QUICKSTART.md) - Getting started tutorial
- [Changelog](./full-stack-spec-driven-dev/CHANGELOG.md) - Version history and updates

## Installation

### Local Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/LiorCohen/claude-code-plugins.git
   cd claude-code-plugins
   ```

2. Configure Claude Code to use this marketplace:
   - Open Claude Code settings
   - Add this directory as a plugin marketplace source
   - The plugins will be automatically discovered and available

### Direct Plugin Installation

You can also install individual plugins by copying the plugin directory to your Claude Code plugins folder.

## Usage

Once installed, plugins provide:

- **Slash commands** - Execute workflows with `/command-name` in chat
- **Agents** - Specialized AI agents for specific tasks
- **Skills** - Reusable knowledge modules agents can reference
- **Templates** - Project scaffolding and boilerplate code

Example usage:
```
# Initialize a new project
/sdd-init my-app

# Start a new feature
/sdd-new-feature user-authentication

# Implement a feature plan
/sdd-implement-plan specs/features/2026/01/13/user-auth/PLAN.md
```

## Plugin Development

Each plugin in this marketplace follows Claude Code's plugin specification:

### Plugin Manifest (`plugin.json`)
```json
{
  "name": "plugin-name",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": {
    "name": "Author Name"
  },
  "commands": [
    "./commands/command1.md",
    "./commands/command2.md"
  ]
}
```

### Marketplace Manifest (`marketplace.json`)
```json
{
  "name": "marketplace-name",
  "owner": {
    "name": "Owner Name"
  },
  "plugins": [
    {
      "name": "plugin-name",
      "source": "./your-plugin-directory",
      "description": "Plugin description",
      "version": "1.0.0"
    }
  ]
}
```

## Contributing

To add a new plugin to this marketplace:

1. Create a new directory under the root: `./your-plugin-name/`
2. Add required plugin structure (agents, commands, etc.)
3. Create `plugin.json` manifest in `.claude-plugin/` subdirectory
4. Update root `marketplace.json` to include your plugin
5. Submit a pull request

## License

See individual plugin directories for licensing information.

## Resources

- [Claude Code Documentation](https://docs.anthropic.com/claude/docs/claude-code)
- [Plugin Development Guide](https://docs.anthropic.com/claude/docs/claude-code-plugins)
- [Claude Agent SDK](https://github.com/anthropics/anthropic-sdk-typescript)

## Support

For issues or questions:
- Open an issue in this repository
- Check plugin-specific README files for detailed documentation
- Consult the Claude Code documentation
