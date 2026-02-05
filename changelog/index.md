# Changelog Archive

This directory contains the full changelog history split by major version.

## Version Files

| File | Version Range | Description |
|------|---------------|-------------|
| [v6.md](v6.md) | 6.0.0 - current | Unified sdd-change command, zero session context |
| [v5.md](v5.md) | 5.0.0 - 5.13.0 | Directory restructure, clean slate templates |
| [v4.md](v4.md) | 4.0.0 - 4.9.0 | Product discovery, multi-instance components |
| [v3.md](v3.md) | 3.0.0 - 3.10.0 | CMDO architecture, change abstraction |
| [v2.md](v2.md) | 2.0.0 - 2.3.0 | App layer rename, scaffolding skill |
| [v1.md](v1.md) | 1.0.0 - 1.10.29 | Initial release |

## Why Split?

The original `CHANGELOG.md` exceeded Claude's maximum file size limit (~25,000 tokens). Splitting by major version keeps each file readable while preserving the full history.

## Structure

- **Root `CHANGELOG.md`** - Index with version table + latest entries (for quick access)
- **`changelog/v{N}.md`** - Complete history for each major version

## Adding New Entries

When committing changes, update **both** files:

1. Add entry to the appropriate version file (e.g., `changelog/v5.md` for version 5.x.x)
2. Add the same entry to root `CHANGELOG.md` after the version history table

See the [commit skill](../.claude/skills/commit/SKILL.md) for detailed guidance.
