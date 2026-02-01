---
id: 44
title: Component settings system + Helm charts
priority: high
status: complete
created: 2026-01-25
completed: 2026-02-01
depends_on: []
blocks: []
---

# Task 44: Component settings system + Helm charts ✓

## Summary

Implemented component settings as a first-class concept that drives scaffolding, config initialization, and Helm chart generation. Added complete Helm templates for servers, webapps, and umbrella charts. Created /sdd-settings command for viewing/modifying settings.

## Details

- TypeScript types and JSON Schema for all component settings
- Settings-driven conditional scaffolding for backend, config, and Helm
- Complete Helm templates: server (single/hybrid), webapp (nginx + config injection), umbrella
- /sdd-settings command with preview and auto-sync
- 105 unit tests for the settings system
- Updated 6 skills and 1 agent with settings documentation

## Consolidated

- #46: Missing Helm chart template
- #53: Missing helm-standards skill
- #57: Add /sdd-settings command
