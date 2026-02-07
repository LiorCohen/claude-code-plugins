---
id: 96
title: Fix sdd-init Phase 1 — plugin verification first, tool checks via system CLI
priority: high
status: open
created: 2026-02-07
depends_on: []
blocks: []
---

# Task 96: Fix sdd-init Phase 1 — plugin verification first, tool checks via system CLI

## Description

Two issues with the current sdd-init command's Phase 1 (Environment Verification):

### 1. Plugin installation must be verified FIRST

Currently Phase 1.4 (Plugin Build Check) comes after tool checking (1.0–1.3). Plugin installation verification must be the **first thing** that happens. If the plugin is not installed, its dependencies aren't installed (`npm install`), or it hasn't been built (`npm run build`), we must **stop and dig deeper** — we cannot continue until the plugin is verified as installed, built, and ready for use.

### 2. Tool checking should use system CLI, not prompts

Currently the command instructs Claude to run individual shell commands (`node --version`, `npm --version`, etc.) as prompts. Once plugin installation is verified, tool checking can be offloaded to the system CLI (e.g., `sdd-system env check-tools`). This is more reliable, faster, and removes unnecessary prompt-based version extraction.

## Acceptance Criteria

- [ ] Phase 1 reordered: plugin installation verification is the first check (before any tool checks)
- [ ] Plugin verification is a hard blocker — if it fails, stop and investigate (don't continue to other phases)
- [ ] Plugin verification checks: installed, dependencies installed, built and ready
- [ ] New system CLI command added (e.g., `sdd-system env check-tools`) that checks required and optional tools
- [ ] System CLI command returns structured JSON with tool name, installed status, version, and required/optional flag
- [ ] sdd-init.md updated to invoke system CLI for tool checking instead of prompt-based version commands
- [ ] Tests added for the new system CLI command
