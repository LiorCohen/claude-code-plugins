---
title: Fix sdd-init Phase 1 — plugin verification first, tool checks via system CLI
created: 2026-02-07
---

# Plan: Fix sdd-init Phase 1

## Problem Summary

The sdd-init command's Phase 1 (Environment Verification) has three issues:

1. **Plugin verification comes too late** — currently Phase 1.4, but nothing else works without the plugin. Must be first.
2. **Tool checking is prompt-based** — Claude runs `node --version` etc. individually. This should be a single system CLI call.
3. **Missing .claude/settings.json verification** — the project needs SDD marketplace and plugin entries to function.
4. **Redundant "NOT done during init" lists** — the command enumerates what it doesn't do instead of just defining what it does. The minimal structure in Phase 2 already makes this clear.

## Files to Create

| File | Purpose |
|------|---------|
| `plugin/system/src/commands/env/check-tools.ts` | New CLI action: checks required/optional tools, returns structured JSON |
| `tests/src/tests/unit/commands/env/check-tools.test.ts` | Unit tests for the check-tools command |

## Files to Modify

| File | Changes |
|------|---------|
| `plugin/system/src/commands/env/index.ts` | Add `check-tools` action to env namespace |
| `plugin/system/src/cli.ts` | Update help text to document `env check-tools` |
| `plugin/commands/sdd-init.md` | Restructure Phase 1: plugin verification first, tool checks via CLI, settings.json check |

---

## Change 1: New `env check-tools` CLI Action

Add a `check-tools` action to the existing `env` namespace that:

- Checks each tool by running its version command with a timeout (5s)
- Categorizes tools as `required` or `optional`
- Returns structured JSON via `CommandResult.data`

**Required tools:** node, npm, git, docker
**Optional tools:** jq, kubectl, helm

**Output data shape:**

```json
{
  "tools": [
    { "name": "node", "required": true, "installed": true, "version": "v20.10.0" },
    { "name": "docker", "required": true, "installed": false, "version": null },
    { "name": "jq", "required": false, "installed": false, "version": null }
  ],
  "allRequiredInstalled": false,
  "missingRequired": ["docker"],
  "missingOptional": ["jq"]
}
```

**Human-readable output** (non-JSON mode):
```
  ✓ node (v20.10.0)
  ✓ npm (v10.2.3)
  ✓ git (v2.42.0)
  ✗ docker not found
  ⚠ jq not found (optional)
```

**Version extraction:** Each tool has a specific command and parse strategy:
- `node --version` → output directly
- `npm --version` → output directly
- `git --version` → parse "git version X.Y.Z"
- `docker --version` → parse "Docker version X.Y.Z"
- `jq --version` → output directly
- `kubectl version --client -o json` → parse JSON `.clientVersion.gitVersion`
- `helm version --short` → output directly

**Tool execution:** Use `execSync` with `{ timeout: 5000 }` and catch errors. Non-zero exit or timeout = not installed.

**Install hints:** Each tool should include an install suggestion using brew or the system's package manager. The CLI command should store these hints per tool and include them in both human-readable and JSON output when a tool is missing:

| Tool | Install hint |
|------|-------------|
| node | `brew install node` or https://nodejs.org |
| npm | Included with node |
| git | `brew install git` or `xcode-select --install` |
| docker | `brew install docker` or https://docs.docker.com/get-docker/ |
| jq | `brew install jq` |
| kubectl | `brew install kubectl` |
| helm | `brew install helm` |

---

## Change 2: Register `check-tools` in Env Namespace

Update `env/index.ts`:
- Add `'check-tools'` to the `ACTIONS` array
- Add case in the switch statement to dispatch to the new module

Update `cli.ts`:
- Add `check-tools` to the env section of the help text

---

## Change 3: Restructure sdd-init Phase 1

Rewrite Phase 1 in `sdd-init.md` with this new ordering:

### Phase 1.0: Plugin Installation Verification (HARD BLOCKER)

This is the first check and it must pass before anything else. The plugin's absolute path is available via `${CLAUDE_PLUGIN_ROOT}` (set by Claude when the plugin loads). Steps:

1. Check `${CLAUDE_PLUGIN_ROOT}`. If set, use it as the plugin path. If not set, fall back to searching `~/.claude/plugins` recursively for the SDD plugin (look for `marketplace.json` or `plugin.json` marker files). If neither finds the plugin: **STOP** — display installation instructions and exit.
2. Verify the plugin path exists and contains expected marker files (`plugin.json` or `.claude-plugin/marketplace.json`)
3. Check build readiness:
   - `${CLAUDE_PLUGIN_ROOT}/system/node_modules/` exists (dependencies installed)
   - `${CLAUDE_PLUGIN_ROOT}/system/dist/` exists (plugin built)
4. If dependencies missing: run `npm install` in `${CLAUDE_PLUGIN_ROOT}/system/`
5. If not built: run `npm run build:plugin` from `${CLAUDE_PLUGIN_ROOT}`
6. If repairs fail: **STOP** — display error details and exit

**This is a hard blocker.** If the plugin is not installed, not built, or not functional after repair attempts, do NOT continue to other phases.

### Phase 1.1: Plugin Update Check

Same as current — check for newer version, suggest upgrade.

### Phase 1.2: .claude/settings.json Verification

Check the project's `.claude/settings.json` for required entries:
- `extraKnownMarketplaces` must include `{ "name": "sdd", "url": "https://github.com/LiorCohen/sdd" }`
- `enabledPlugins` must include `"sdd@sdd"`

If missing: create or merge the required entries (preserve existing settings).

### Phase 1.3: Required & Optional Tools Check (via System CLI)

Run `sdd-system env check-tools --json` and interpret the result:
- Display the human-readable tool summary
- If any tools are missing (required or optional): list the missing tools with their install hints, then present three options:
  ```
  Missing tools:
    ✗ docker — brew install docker
    ⚠ jq — brew install jq (optional)

  How would you like to proceed?
  1. Install for me — I'll run: brew install docker jq
  2. I'll install them myself — tell me when you're ready and I'll re-check
  3. Skip — continue without missing tools (only if all required tools are present)
  ```
  - Option 1: run the install commands, then re-run `check-tools` to verify
  - Option 2: wait for the user to install manually, then re-run `check-tools` when they say they're ready
  - Option 3: only available if no required tools are missing (i.e., only optional tools). Continue with warnings. If required tools are missing, this option is not offered.

This replaces the current prompt-based tool checking (Phases 1.0–1.3). One CLI call instead of 7+ individual version commands.

### Phase 1.4: Permissions Check

Same as current Phase 1.5.

---

## Change 4: Remove Redundant "NOT done" Lists

Remove from `sdd-init.md`:
- The "What's NOT done during init (deferred to implementation)" block in the Workflow table area
- The "NOT created during init" block under Phase 2

The minimal structure file tree in Phase 2 is the single source of truth for what gets created. If it's not in the tree, it's not created — no need to say so twice.

---

## Dependencies

- Change 1 (check-tools CLI) must be implemented before Change 3 (sdd-init.md restructure) since the command references it
- Change 2 (registration) must accompany Change 1

## Tests

### Unit Tests

- [ ] `test_check_tools_returns_structured_result` — verify CommandResult shape with data containing tools array
- [ ] `test_check_tools_detects_installed_tool` — mock execSync to return version, verify installed: true and version extracted
- [ ] `test_check_tools_detects_missing_tool` — mock execSync to throw, verify installed: false
- [ ] `test_check_tools_timeout_treated_as_not_installed` — mock timeout error, verify installed: false
- [ ] `test_check_tools_parses_node_version` — input "v20.10.0", expect "v20.10.0"
- [ ] `test_check_tools_parses_git_version` — input "git version 2.42.0", expect "2.42.0"
- [ ] `test_check_tools_parses_docker_version` — input "Docker version 24.0.6, build ...", expect "24.0.6"
- [ ] `test_check_tools_parses_kubectl_version` — input JSON, expect gitVersion value
- [ ] `test_check_tools_allRequiredInstalled_true_when_all_present` — all required tools installed
- [ ] `test_check_tools_allRequiredInstalled_false_when_any_missing` — one required tool missing
- [ ] `test_check_tools_missingOptional_lists_only_optional` — optional missing doesn't affect allRequiredInstalled
- [ ] `test_check_tools_json_output_mode` — verify --json flag produces valid JSON CommandResult
- [ ] `test_check_tools_human_readable_output` — verify non-JSON output uses checkmark/warning/cross symbols

## Verification

- [ ] `sdd-system env check-tools` runs and reports tool status
- [ ] `sdd-system env check-tools --json` returns structured JSON
- [ ] sdd-init.md Phase 1 starts with plugin verification as a hard blocker
- [ ] sdd-init.md Phase 1 uses `sdd-system env check-tools` instead of individual version commands
- [ ] sdd-init.md Phase 1 checks `.claude/settings.json` for SDD marketplace and plugin entries
- [ ] All existing tests pass (`npm test`)
- [ ] Plugin builds successfully (`npm run build:plugin`)
