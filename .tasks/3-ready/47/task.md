---
id: 47
title: Local environment create/start/stop workflow
priority: high
status: ready
created: 2026-01-25
---

# Task 47: Local environment create/start/stop workflow

## Description

Missing a way to manage local development environments:
- Create a local environment (spin up k8s, databases, services)
- Start/stop the local environment
- Consistent commands across projects (e.g., `npm run env:up`, `npm run env:down`)
- Integrate with docker-compose or local k8s (minikube, kind, k3d)
- Handle dependencies between services

## Cluster Infrastructure

The local environment should include cluster-level observability:

### Victoria Metrics (Metrics)

```bash
helm repo add vm https://victoriametrics.github.io/helm-charts/
helm repo update

# Install the full k8s monitoring stack
helm install vmstack vm/victoria-metrics-k8s-stack \
  -n telemetry --create-namespace \
  --set vmsingle.enabled=true \
  --set vmagent.enabled=true
```

### Victoria Logs (Logs)

```bash
# Install Victoria Logs server
helm install vls vm/victoria-logs-single \
  -n telemetry \
  --set server.retentionPeriod=30d \
  --set server.persistentVolume.size=10Gi

# Install log collector (DaemonSet - collects from all pods)
helm install vlcollector vm/victoria-logs-collector \
  -n telemetry \
  --set "remoteWrite[0].url=http://vls-victoria-logs-single-server:9428"
```

### Namespace Layout

| Namespace | Contents |
|-----------|----------|
| `telemetry` | Victoria Metrics + Victoria Logs |
| App namespaces | Application deployments |

## Acceptance Criteria

- [ ] Command to create local k8s cluster (kind/k3d)
- [ ] Command to install cluster infrastructure (observability stack)
- [ ] Command to deploy application Helm charts
- [ ] Start/stop commands that preserve state
- [ ] Port-forwarding for local access to services
- [ ] Documentation for local dev workflow
