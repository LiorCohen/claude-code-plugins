---
id: 44
title: Component settings system + Helm charts
priority: high
status: planning
created: 2026-01-25
depends_on: []
blocks: []
---

# Task 44: Component settings system + Helm charts

## Description

Introduce **component settings** as a first-class concept that drives scaffolding, config initialization, and Helm chart generation.

**Component settings:**
- Structural decisions about a component (uses_database, ingress, server_type, etc.)
- Defined at component creation, changeable post-init
- Drive what gets scaffolded and how

**Helm chart improvements:**
- Settings-driven chart generation (only include templates needed by settings)
- Chart-per-server pattern with optional umbrella chart
- App-level observability integration (ServiceMonitor, structured logs)

**Note:** Cluster-level observability (Victoria Metrics, Victoria Logs installation) is handled by task #47.

## Acceptance Criteria

- [ ] Component settings schema defined (TypeScript types + JSON Schema)
- [ ] Settings stored in sdd-settings.yaml per component
- [ ] Backend scaffolding adapts to settings (DAL layer conditional, etc.)
- [ ] Config initialization adapts to settings (DB section conditional, etc.)
- [ ] Helm charts generated based on settings (ingress.yaml conditional, etc.)
- [ ] Sync commands for incremental scaffolding when settings change
- [ ] `/sdd-settings` command for viewing/modifying settings
- [ ] Documentation updated (helm-standards, project-settings, devops.md)

## Consolidated

- #46: Missing Helm chart template
- #53: Missing helm-standards skill
- #57: Add /sdd-settings command
