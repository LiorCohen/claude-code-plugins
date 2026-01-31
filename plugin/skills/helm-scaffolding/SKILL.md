---
name: helm-scaffolding
description: Scaffolds Helm chart structure for SDD components.
---

# Helm Scaffolding Skill

Scaffolds Helm chart structure for deploying SDD components to Kubernetes.

## When to Use

This skill is called by the main `scaffolding` skill when creating helm components. It creates a Helm chart that integrates with the SDD config system.

## What It Creates

```
components/helm-{name}/
├── Chart.yaml                # Chart metadata
├── values.yaml               # Default values (development-safe)
├── values-local.yaml         # Local development overrides
└── templates/
    ├── deployment.yaml       # Pod spec with config mount and env vars
    ├── service.yaml          # Service definition
    └── configmap.yaml        # ConfigMap for config file
```

## Template Variables

| Variable | Description |
|----------|-------------|
| `{{CHART_NAME}}` | Helm chart name (from component name) |
| `{{CHART_DESCRIPTION}}` | Chart description |
| `{{APP_VERSION}}` | Application version |
| `{{PROJECT_NAME}}` | Project name |

## Usage

Called programmatically by the scaffolding skill:

```python
from helm_scaffolding import scaffold_helm

scaffold_helm(
    target_dir="/path/to/project",
    component_name="task-service",    # Creates helm-task-service/
    project_name="my-app",
)
```

## Config Integration

The Helm chart integrates with the config component:

1. **Config values** are passed via `--set-file config=<generated-config.yaml>` at deploy time
2. **ConfigMap** mounts the config at `/app/config/config.yaml`
3. **Deployment** sets `SDD_CONFIG_PATH=/app/config/config.yaml`

### Deployment Workflow

```bash
# 1. Generate merged config for the target environment
sdd-system config generate --env production --component server-task-service \
  --output production-config.yaml

# 2. Deploy with Helm
helm install my-release ./components/helm-task-service \
  -f values-production.yaml \
  --set-file config=production-config.yaml
```

## Templates Location

All templates are colocated in this skill's `templates/` directory:

```
skills/helm-scaffolding/templates/
├── Chart.yaml
├── values.yaml
├── values-local.yaml
└── templates/
    ├── deployment.yaml
    ├── service.yaml
    └── configmap.yaml
```

## Related Skills

- `helm-standards` - Standards for Helm charts
- `config-scaffolding` - Creates the config component
- `backend-scaffolding` - Creates the server component that this chart deploys
