---
name: helm-standards
description: Standards for Helm charts in SDD projects.
---

# Helm Standards Skill

Standards for Helm charts in SDD projects.

## Values File Conventions

| File | Purpose |
|------|---------|
| `values.yaml` | Default values (development-safe) |
| `values-{env}.yaml` | Environment overrides (local, staging, production) |

## Required Values

Every Helm chart must define these values:

```yaml
# Infrastructure settings (NOT application config)
nodeEnv: development          # NODE_ENV for libraries (Express caching, etc.)

# Application config (from config component)
config: {}                    # Merged config from components/config/envs/{env}/
```

## Environment Variables

| Var | Source | Purpose |
|-----|--------|---------|
| `NODE_ENV` | `.Values.nodeEnv` | Library behavior (Express caching, etc.) |
| `SDD_CONFIG_PATH` | Static `/app/config/config.yaml` | Path to mounted config |

## Config Injection Pattern

Config is mounted via ConfigMap:

```yaml
# templates/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-config
data:
  config.yaml: |
    {{- toYaml .Values.config | nindent 4 }}
```

```yaml
# templates/deployment.yaml
volumeMounts:
  - name: config
    mountPath: /app/config
    readOnly: true
volumes:
  - name: config
    configMap:
      name: {{ .Release.Name }}-config
```

## Environment Variable Injection

```yaml
# templates/deployment.yaml
env:
  - name: NODE_ENV
    value: {{ .Values.nodeEnv }}
  - name: SDD_CONFIG_PATH
    value: /app/config/config.yaml
```

## Secret References

Config contains secret **names**, not values:

```yaml
# values.yaml or values-production.yaml
config:
  database:
    host: db.production.internal
    passwordSecret: "my-db-credentials"  # K8s Secret name
```

Deployment maps to actual secret:

```yaml
# templates/deployment.yaml
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: {{ .Values.config.database.passwordSecret }}
        key: password
```

## Populating Config at Deploy Time

Use `/sdd-config generate` to create merged config, then inject into Helm:

```bash
# Generate config for production environment
sdd-system config generate --env production --component server-task-service \
  --output helm-values-config.yaml

# Deploy with config
helm install my-release ./components/helm-task-service \
  -f values-production.yaml \
  --set-file config=helm-values-config.yaml
```

Alternative: Use Helm's `--values` with a complete values file that includes the config section.

## Chart Structure

```
components/helm-{name}/
├── Chart.yaml                # Chart metadata
├── values.yaml               # Default values (nodeEnv: development)
├── values-local.yaml         # Local dev overrides (optional)
├── values-staging.yaml       # Staging overrides (add as needed)
├── values-production.yaml    # Production overrides (add as needed)
└── templates/
    ├── deployment.yaml       # Pod spec with config mount
    ├── service.yaml          # Service definition
    └── configmap.yaml        # Config file mount
```

## NODE_ENV Handling

**NODE_ENV is an infrastructure exception**, not application config. It exists because third-party libraries check it for performance optimizations.

**Key principle:** Application code NEVER reads NODE_ENV. It's injected by infrastructure for library behavior only.

| Environment | NODE_ENV Setting |
|-------------|------------------|
| Local development | Not set (libraries default to development) |
| Staging | `development` (safer for debugging) |
| Production | `production` (enables optimizations) |

**What NODE_ENV controls (library behavior, NOT app logic):**
- Express view caching
- Express error verbosity
- Some npm packages' internal optimizations

**What NODE_ENV does NOT control (use config YAML instead):**
- Logging level → `config.logging.level`
- Feature flags → `config.features.*`
- API endpoints → `config.api.baseUrl`
- Any application behavior

## Best Practices

1. **Never hardcode environment-specific values** in templates
2. **Use values files** for all environment differences
3. **Keep secrets external** - reference K8s Secrets by name only
4. **Config component is source of truth** - Helm just mounts it
5. **Validate config before deploy** - Use `/sdd-config validate` in CI/CD

## Related Skills

- `config-scaffolding` - Creates the config component
- `config-standards` - Standards for configuration management
- `helm-scaffolding` - Scaffolds Helm chart structure
