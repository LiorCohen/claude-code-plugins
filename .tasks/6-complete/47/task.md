---
id: 47
title: Local environment create/start/stop workflow
priority: high
status: complete
created: 2026-01-25
completed: 2026-02-01
---

# Task 47: Local environment create/start/stop workflow ✓

## Summary

Implemented a comprehensive local Kubernetes environment management system through the `sdd-system env` CLI namespace.

## What Was Done

### CLI Commands (env namespace)
- `env create` - Create local k8s cluster + install infra
- `env destroy` - Delete cluster entirely
- `env start` - Resume stopped cluster
- `env stop` - Pause cluster (preserves state)
- `env restart` - Restart cluster (stop + start)
- `env status` - Show cluster and workload status
- `env deploy` - Deploy databases, run migrations, deploy helm charts
- `env undeploy` - Remove helm deployments
- `env forward` - Port-forward services for local access
- `env config` - Generate local environment config
- `env infra` - Install/reinstall observability stack

### Cluster Providers
- **kind** (default) - Docker-based lightweight clusters
- **minikube** - Full-featured local Kubernetes
- **docker-desktop** - Use existing Docker Desktop Kubernetes

### Infrastructure
- Victoria Metrics for metrics collection
- Victoria Logs for log aggregation
- Provider auto-detection based on available tools

### Supporting Files
- Provider abstractions in `plugin/system/src/commands/env/providers/`
- State persistence in `~/.sdd/clusters.json`
- Skill documentation in `plugin/skills/local-env/SKILL.md`
- DevOps agent updated with env commands

### Fixes Applied
- Fixed ESM module resolution with tsc-alias `-f` flag
- Fixed helm-standards SKILL.md to document `secretKeyRef`
- Fixed helm-scaffolding SKILL.md to document `{{CHART_DESCRIPTION}}` and `SDD_CONFIG_PATH`
- Fixed duplicate `execSync` declaration in test file

## Acceptance Criteria

- [x] Command to create local k8s cluster (kind/k3d)
- [x] Command to install cluster infrastructure (observability stack)
- [x] Command to deploy application Helm charts
- [x] Start/stop commands that preserve state
- [x] Port-forwarding for local access to services
- [x] Documentation for local dev workflow
