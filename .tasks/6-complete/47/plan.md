---
title: Local env create/start/stop workflow
created: 2026-02-01
---

# Plan: Local Environment Create/Start/Stop Workflow

## Problem Summary

Developers need a consistent way to manage local Kubernetes envs:
- Create/destroy local k8s clusters (kind/k3d)
- Install cluster infrastructure (observability stack)
- Deploy application Helm charts
- Start/stop/restart the env
- Port-forward services for local access

Currently, this requires manual kubectl/helm commands. This task adds an `env` namespace to the sdd-system CLI with commands that orchestrate these operations.

## Architecture

### Environment Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Local Environment                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐        │
│  │   Cluster    │ ──▶ │  Infra Stack │ ──▶ │  App Deploy  │        │
│  │ (kind/mini-  │     │ (telemetry)  │     │ (helm charts)│        │
│  │ kube/docker) │                                                  │
│  └──────────────┘     └──────────────┘     └──────────────┘        │
│                                                                     │
│  env:create           env:infra            env:deploy              │
│  env:destroy          (auto on create)     env:undeploy            │
│                                                                     │
│  env:start / env:stop / env:status                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Cluster Providers

Support multiple local Kubernetes providers via `--provider` flag:

| Provider | Default | Description |
|----------|---------|-------------|
| `kind` | Yes | Kubernetes IN Docker - fast, lightweight, disposable clusters |
| `minikube` | No | Full-featured local k8s with VM or Docker driver |
| `docker-desktop` | No | Uses Docker Desktop's built-in Kubernetes |

**Provider characteristics:**

| Feature | kind | minikube | docker-desktop |
|---------|------|----------|----------------|
| Cluster creation | CLI creates | CLI creates | Pre-existing |
| Start/stop | Docker container | `minikube start/stop` | Docker Desktop UI |
| Destroy | `kind delete` | `minikube delete` | N/A (always exists) |
| Multi-node | Yes | Yes | No |
| Speed | ~30 seconds | ~60 seconds | Already running |

**Auto-detection:** If `--provider` is not specified:
1. Check if Docker Desktop k8s is enabled → use `docker-desktop`
2. Check if minikube exists → use `minikube`
3. Default to `kind`

### Namespace Layout

| Namespace | Purpose | Contents |
|-----------|---------|----------|
| `telemetry` | Observability | Victoria Metrics, Victoria Logs |
| `<app-name>` | Application | User's Helm chart deployments |

The application namespace is derived from the `name` field in `.sdd/sdd-settings.yaml`. This keeps each project's resources isolated.

### Infrastructure Stack

**Victoria Metrics** (metrics collection):
```bash
helm repo add vm https://victoriametrics.github.io/helm-charts/
helm install vmstack vm/victoria-metrics-k8s-stack \
  -n telemetry --create-namespace \
  --set vmsingle.enabled=true \
  --set vmagent.enabled=true
```

**Victoria Logs** (log aggregation):
```bash
helm install vls vm/victoria-logs-single \
  -n telemetry \
  --set server.retentionPeriod=7d \
  --set server.persistentVolume.size=5Gi

helm install vlcollector vm/victoria-logs-collector \
  -n telemetry \
  --set "remoteWrite[0].url=http://vls-victoria-logs-single-server:9428"
```

### Command Design

Following the existing database namespace pattern:

```
/sdd-run env <action> [options]

Actions:
  create     Create local k8s cluster and install infrastructure
  destroy    Delete cluster entirely
  start      Resume a stopped cluster
  stop       Pause cluster (preserves state)
  restart    Restart cluster (stop + start)
  status     Show cluster and deployment status
  deploy     Deploy application Helm charts
  undeploy   Remove application deployments (keep infra)
  forward    Port-forward services for local access
  config     Generate local environment config file
  infra      Install/reinstall observability infrastructure
```

### Settings Integration

Environment commands read from `.sdd/sdd-settings.yaml`:
- Find all `type: helm` components to know what to deploy
- Use `type: database` components for database setup order
- Respect component dependencies via `depends_on`

## Files to Modify

| File | Changes |
|------|---------|
| **CLI Commands** | |
| `plugin/system/src/commands/env/index.ts` | **NEW** - Environment namespace handler |
| `plugin/system/src/commands/env/create.ts` | **NEW** - Create cluster + install infra |
| `plugin/system/src/commands/env/destroy.ts` | **NEW** - Delete cluster |
| `plugin/system/src/commands/env/start.ts` | **NEW** - Resume stopped cluster |
| `plugin/system/src/commands/env/stop.ts` | **NEW** - Pause cluster |
| `plugin/system/src/commands/env/status.ts` | **NEW** - Show status |
| `plugin/system/src/commands/env/deploy.ts` | **NEW** - Deploy helm charts |
| `plugin/system/src/commands/env/undeploy.ts` | **NEW** - Remove deployments |
| `plugin/system/src/commands/env/forward.ts` | **NEW** - Port forwarding |
| `plugin/system/src/commands/env/config.ts` | **NEW** - Generate local env config |
| `plugin/system/src/commands/env/restart.ts` | **NEW** - Restart cluster (stop + start) |
| `plugin/system/src/commands/env/infra.ts` | **NEW** - Install/reinstall observability stack |
| `plugin/system/src/commands/env/types.ts` | **NEW** - Shared types + provider interface |
| `plugin/system/src/commands/env/providers/index.ts` | **NEW** - Provider registry + auto-detection |
| `plugin/system/src/commands/env/providers/kind.ts` | **NEW** - kind provider implementation |
| `plugin/system/src/commands/env/providers/minikube.ts` | **NEW** - minikube provider implementation |
| `plugin/system/src/commands/env/providers/docker-desktop.ts` | **NEW** - Docker Desktop provider |
| `plugin/system/src/cli.ts` | Register env namespace |
| **Configuration** | |
| `plugin/system/src/commands/env/infra/` | **NEW** - Infrastructure helm values |
| **Documentation** | |
| `plugin/commands/sdd-run.md` | Add env commands documentation |
| `plugin/agents/devops.md` | Update with local env workflow |
| `plugin/skills/local-env/SKILL.md` | **NEW** - Local dev env skill |

## Implementation

### Phase 1: Environment Namespace Structure

Create the env command namespace following the database pattern.

**`plugin/system/src/commands/env/index.ts`:**
```typescript
import type { CommandResult, GlobalOptions } from '@/lib/args';
import type { CommandSchema } from '@/lib/schema-validator';
import { validateArgs, formatValidationErrors } from '@/lib/schema-validator';

const ACTIONS = [
  'create',
  'destroy',
  'start',
  'stop',
  'restart',
  'status',
  'deploy',
  'undeploy',
  'forward',
  'config',
  'infra',
] as const;

type EnvironmentAction = typeof ACTIONS[number];

interface EnvironmentArgs {
  readonly action: EnvironmentAction;
}

export const schema: CommandSchema = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: [...ACTIONS],
      description: 'Environment action to perform',
    },
  },
  required: ['action'],
};

export const handleEnvironment = async (
  action: string,
  args: readonly string[],
  options: GlobalOptions
): Promise<CommandResult> => {
  const validation = validateArgs<EnvironmentArgs>({ action }, schema);
  if (!validation.valid) {
    return { success: false, error: formatValidationErrors(validation.errors) };
  }

  const validatedArgs = validation.data;

  switch (validatedArgs.action) {
    case 'create': {
      const { create } = await import('./create');
      return create(args, options);
    }
    case 'destroy': {
      const { destroy } = await import('./destroy');
      return destroy(args, options);
    }
    case 'start': {
      const { start } = await import('./start');
      return start(args, options);
    }
    case 'stop': {
      const { stop } = await import('./stop');
      return stop(args, options);
    }
    case 'status': {
      const { status } = await import('./status');
      return status(args, options);
    }
    case 'deploy': {
      const { deploy } = await import('./deploy');
      return deploy(args, options);
    }
    case 'undeploy': {
      const { undeploy } = await import('./undeploy');
      return undeploy(args, options);
    }
    case 'forward': {
      const { forward } = await import('./forward');
      return forward(args, options);
    }
    case 'config': {
      const { config } = await import('./config');
      return config(args, options);
    }
    case 'restart': {
      const { restart } = await import('./restart');
      return restart(args, options);
    }
    case 'infra': {
      const { infra } = await import('./infra');
      return infra(args, options);
    }
    default:
      return { success: false, error: `Unknown action: ${action}` };
  }
};
```

**Register in `cli.ts`:**
```typescript
const NAMESPACES = [...existing, 'env'] as const;

const COMMAND_HANDLERS: Record<Namespace, CommandHandler> = {
  ...existing,
  env: handleEnvironment,
};
```

### Phase 2: Cluster Management (create/destroy/start/stop)

Commands use the provider abstraction from Phase 6.

**`plugin/system/src/commands/env/create.ts`:**
```typescript
import { execSync } from 'node:child_process';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { DEFAULT_CLUSTER_NAME, type ClusterProvider } from './types';
import { getProvider, detectProvider, persistClusterProvider } from './providers';

export const create = async (
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);
  const clusterName = named['name'] ?? DEFAULT_CLUSTER_NAME;
  const skipInfra = named['skip-infra'] === 'true';
  const providerName = (named['provider'] as ClusterProvider) ?? await detectProvider();

  // Check prerequisites
  const { checkPrerequisites } = await import('./providers');
  const prereqs = checkPrerequisites();
  if (!prereqs.ok) {
    return {
      success: false,
      error: `Missing prerequisites: ${prereqs.missing.join(', ')}. Please install them first.`,
    };
  }

  const provider = getProvider(providerName);

  try {
    // Check if cluster already exists
    if (await provider.exists(clusterName)) {
      if (await provider.isRunning(clusterName)) {
        return {
          success: false,
          error: `Cluster '${clusterName}' already exists and is running.`,
        };
      }
      return {
        success: false,
        error: `Cluster '${clusterName}' already exists. Use 'env start' to resume or 'env destroy' first.`,
      };
    }

    // Create cluster
    console.log(`Creating cluster '${clusterName}' using ${providerName}...`);
    await provider.create(clusterName);

    // Persist provider choice for later operations
    persistClusterProvider(clusterName, providerName);

    // Switch kubectl context for kind clusters
    if (providerName === 'kind') {
      execSync(`kubectl config use-context kind-${clusterName}`, { stdio: 'inherit' });
    }

    // Wait for cluster to be ready
    console.log('Waiting for cluster to be ready...');
    execSync('kubectl wait --for=condition=Ready nodes --all --timeout=120s', {
      stdio: 'inherit',
    });

    if (!skipInfra) {
      // Install infrastructure stack
      console.log('Installing observability infrastructure...');
      await installInfrastructure();
    }

    return {
      success: true,
      message: `Local env '${clusterName}' created successfully (provider: ${providerName})`,
      data: { clusterName, provider: providerName, infrastructure: !skipInfra },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to create env: ${message}` };
  }
};

const installInfrastructure = async (): Promise<void> => {
  // Add helm repos
  execSync('helm repo add vm https://victoriametrics.github.io/helm-charts/', { stdio: 'inherit' });
  execSync('helm repo update', { stdio: 'inherit' });

  // Create telemetry namespace
  execSync('kubectl create namespace telemetry --dry-run=client -o yaml | kubectl apply -f -', {
    stdio: 'inherit',
  });

  // Install Victoria Metrics stack
  console.log('Installing Victoria Metrics...');
  execSync(
    `helm upgrade --install vmstack vm/victoria-metrics-k8s-stack \
      -n telemetry \
      --set vmsingle.enabled=true \
      --set vmagent.enabled=true \
      --wait --timeout 5m`,
    { stdio: 'inherit' }
  );

  // Install Victoria Logs
  console.log('Installing Victoria Logs...');
  execSync(
    `helm upgrade --install vls vm/victoria-logs-single \
      -n telemetry \
      --set server.retentionPeriod=7d \
      --set server.persistentVolume.size=5Gi \
      --wait --timeout 3m`,
    { stdio: 'inherit' }
  );

  // Install log collector
  console.log('Installing log collector...');
  execSync(
    `helm upgrade --install vlcollector vm/victoria-logs-collector \
      -n telemetry \
      --set "remoteWrite[0].url=http://vls-victoria-logs-single-server:9428" \
      --wait --timeout 2m`,
    { stdio: 'inherit' }
  );
};
```

**`plugin/system/src/commands/env/destroy.ts`:**
```typescript
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { DEFAULT_CLUSTER_NAME, type ClusterProvider } from './types';
import { getProvider, getClusterProvider, removeClusterProvider } from './providers';

export const destroy = async (
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);
  const clusterName = named['name'] ?? DEFAULT_CLUSTER_NAME;

  // Get provider from persisted state (or explicit override)
  const explicitProvider = named['provider'] as ClusterProvider | undefined;
  const providerName = explicitProvider ?? getClusterProvider(clusterName);

  if (!providerName) {
    return {
      success: false,
      error: `Cluster '${clusterName}' not found. Either it doesn't exist or was not created via 'env create'.`,
    };
  }

  const provider = getProvider(providerName);

  try {
    if (!(await provider.exists(clusterName))) {
      // Clean up stale state
      removeClusterProvider(clusterName);
      return {
        success: false,
        error: `Cluster '${clusterName}' does not exist.`,
      };
    }

    console.log(`Destroying cluster '${clusterName}' (provider: ${providerName})...`);
    await provider.destroy(clusterName);

    // Remove from persisted state
    removeClusterProvider(clusterName);

    return {
      success: true,
      message: `Local env '${clusterName}' destroyed`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to destroy env: ${message}` };
  }
};
```

**`plugin/system/src/commands/env/start.ts`:**
```typescript
import { execSync } from 'node:child_process';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { DEFAULT_CLUSTER_NAME, type ClusterProvider } from './types';
import { getProvider, getClusterProvider } from './providers';

export const start = async (
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);
  const clusterName = named['name'] ?? DEFAULT_CLUSTER_NAME;

  // Get provider from persisted state (or explicit override)
  const explicitProvider = named['provider'] as ClusterProvider | undefined;
  const providerName = explicitProvider ?? getClusterProvider(clusterName);

  if (!providerName) {
    return {
      success: false,
      error: `Cluster '${clusterName}' not found. Use 'env create' first.`,
    };
  }

  const provider = getProvider(providerName);

  try {
    if (!(await provider.exists(clusterName))) {
      return {
        success: false,
        error: `Cluster '${clusterName}' does not exist. Use 'env create' first.`,
      };
    }

    if (await provider.isRunning(clusterName)) {
      return {
        success: true,
        message: `Cluster '${clusterName}' is already running`,
      };
    }

    console.log(`Starting cluster '${clusterName}' (provider: ${providerName})...`);
    await provider.start(clusterName);

    // Switch kubectl context for kind clusters
    if (providerName === 'kind') {
      execSync(`kubectl config use-context kind-${clusterName}`, { stdio: 'inherit' });
    }

    // Wait for API server to be ready
    console.log('Waiting for cluster API...');
    execSync('kubectl wait --for=condition=Ready nodes --all --timeout=120s', {
      stdio: 'inherit',
    });

    return {
      success: true,
      message: `Cluster '${clusterName}' started`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to start env: ${message}` };
  }
};
```

**`plugin/system/src/commands/env/stop.ts`:**
```typescript
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { DEFAULT_CLUSTER_NAME, type ClusterProvider } from './types';
import { getProvider, getClusterProvider } from './providers';

export const stop = async (
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);
  const clusterName = named['name'] ?? DEFAULT_CLUSTER_NAME;

  // Get provider from persisted state (or explicit override)
  const explicitProvider = named['provider'] as ClusterProvider | undefined;
  const providerName = explicitProvider ?? getClusterProvider(clusterName);

  if (!providerName) {
    return {
      success: false,
      error: `Cluster '${clusterName}' not found.`,
    };
  }

  const provider = getProvider(providerName);

  try {
    if (!(await provider.exists(clusterName))) {
      return {
        success: false,
        error: `Cluster '${clusterName}' does not exist.`,
      };
    }

    console.log(`Stopping cluster '${clusterName}' (provider: ${providerName})...`);
    await provider.stop(clusterName);

    return {
      success: true,
      message: `Cluster '${clusterName}' stopped (state preserved)`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to stop env: ${message}` };
  }
};
```

**`plugin/system/src/commands/env/restart.ts`:**
```typescript
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { stop } from './stop';
import { start } from './start';

export const restart = async (
  args: readonly string[],
  options: GlobalOptions
): Promise<CommandResult> => {
  // Stop the cluster
  const stopResult = await stop(args, options);
  if (!stopResult.success) {
    // If stop failed because cluster wasn't running, that's OK
    if (!stopResult.error?.includes('not found')) {
      return stopResult;
    }
  }

  // Start the cluster
  return start(args, options);
};
```

**`plugin/system/src/commands/env/infra.ts`:**
```typescript
import { execSync } from 'node:child_process';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';

export const infra = async (
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);
  const reinstall = named['reinstall'] === 'true';

  try {
    // Check cluster is running
    try {
      execSync('kubectl get nodes', { stdio: 'pipe' });
    } catch {
      return {
        success: false,
        error: 'No cluster available. Create one with "env create" first.',
      };
    }

    if (reinstall) {
      console.log('Removing existing infrastructure...');
      try {
        execSync('helm uninstall vmstack -n telemetry', { stdio: 'pipe' });
        execSync('helm uninstall vls -n telemetry', { stdio: 'pipe' });
        execSync('helm uninstall vlcollector -n telemetry', { stdio: 'pipe' });
      } catch {
        // Ignore uninstall errors - releases may not exist
      }
    }

    // Add helm repos
    execSync('helm repo add vm https://victoriametrics.github.io/helm-charts/', { stdio: 'inherit' });
    execSync('helm repo update', { stdio: 'inherit' });

    // Create telemetry namespace
    execSync('kubectl create namespace telemetry --dry-run=client -o yaml | kubectl apply -f -', {
      stdio: 'inherit',
    });

    // Install Victoria Metrics stack
    console.log('Installing Victoria Metrics...');
    execSync(
      `helm upgrade --install vmstack vm/victoria-metrics-k8s-stack \
        -n telemetry \
        --set vmsingle.enabled=true \
        --set vmagent.enabled=true \
        --wait --timeout 5m`,
      { stdio: 'inherit' }
    );

    // Install Victoria Logs
    console.log('Installing Victoria Logs...');
    execSync(
      `helm upgrade --install vls vm/victoria-logs-single \
        -n telemetry \
        --set server.retentionPeriod=7d \
        --set server.persistentVolume.size=5Gi \
        --wait --timeout 3m`,
      { stdio: 'inherit' }
    );

    // Install log collector
    console.log('Installing log collector...');
    execSync(
      `helm upgrade --install vlcollector vm/victoria-logs-collector \
        -n telemetry \
        --set "remoteWrite[0].url=http://vls-victoria-logs-single-server:9428" \
        --wait --timeout 2m`,
      { stdio: 'inherit' }
    );

    return {
      success: true,
      message: 'Infrastructure installed successfully',
      data: {
        metricsUrl: 'http://vmstack-victoria-metrics-k8s-stack:9090',
        logsUrl: 'http://vls-victoria-logs-single-server:9428',
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to install infrastructure: ${message}` };
  }
};
```

### Phase 3: Status Command

**`plugin/system/src/commands/env/status.ts`:**
```typescript
import { execSync } from 'node:child_process';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { DEFAULT_CLUSTER_NAME, type ClusterProvider } from './types';
import { getProvider, getClusterProvider } from './providers';

interface ClusterStatus {
  readonly cluster: string;
  readonly provider: ClusterProvider | null;
  readonly running: boolean;
  readonly exists: boolean;
  readonly nodes: readonly NodeStatus[];
  readonly namespaces: readonly NamespaceStatus[];
}

interface NodeStatus {
  readonly name: string;
  readonly status: string;
}

interface NamespaceStatus {
  readonly name: string;
  readonly pods: number;
  readonly ready: number;
}

export const status = async (
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);
  const clusterName = named['name'] ?? DEFAULT_CLUSTER_NAME;

  try {
    // Get provider for this cluster (from persisted state)
    const providerName = getClusterProvider(clusterName);

    if (!providerName) {
      return {
        success: true,
        message: `Cluster '${clusterName}' does not exist (no provider found)`,
        data: { cluster: clusterName, provider: null, running: false, exists: false, nodes: [], namespaces: [] },
      };
    }

    const provider = getProvider(providerName);

    // Check if cluster exists
    if (!(await provider.exists(clusterName))) {
      return {
        success: true,
        message: `Cluster '${clusterName}' does not exist`,
        data: { cluster: clusterName, provider: providerName, running: false, exists: false, nodes: [], namespaces: [] },
      };
    }

    // Check if running
    const isRunning = await provider.isRunning(clusterName);

    if (!isRunning) {
      return {
        success: true,
        message: `Cluster '${clusterName}' exists but is stopped (provider: ${providerName})`,
        data: { cluster: clusterName, provider: providerName, running: false, exists: true, nodes: [], namespaces: [] },
      };
    }

    // Get node status
    const nodesJson = execSync('kubectl get nodes -o json', { encoding: 'utf-8' });
    const nodes = JSON.parse(nodesJson);
    const nodeStatuses: NodeStatus[] = nodes.items.map((node: any) => ({
      name: node.metadata.name,
      status: node.status.conditions.find((c: any) => c.type === 'Ready')?.status === 'True'
        ? 'Ready'
        : 'NotReady',
    }));

    // Get namespace pod counts
    const namespacesJson = execSync('kubectl get namespaces -o json', { encoding: 'utf-8' });
    const namespaces = JSON.parse(namespacesJson);
    const namespaceStatuses: NamespaceStatus[] = [];

    for (const ns of namespaces.items) {
      const nsName = ns.metadata.name;
      if (nsName.startsWith('kube-')) continue; // Skip system namespaces

      const podsJson = execSync(`kubectl get pods -n ${nsName} -o json`, { encoding: 'utf-8' });
      const pods = JSON.parse(podsJson);
      const total = pods.items.length;
      const ready = pods.items.filter((p: any) =>
        p.status.conditions?.find((c: any) => c.type === 'Ready')?.status === 'True'
      ).length;

      if (total > 0) {
        namespaceStatuses.push({ name: nsName, pods: total, ready });
      }
    }

    const statusData: ClusterStatus = {
      cluster: clusterName,
      provider: providerName,
      running: true,
      exists: true,
      nodes: nodeStatuses,
      namespaces: namespaceStatuses,
    };

    // Format output
    let output = `Cluster: ${clusterName} (running, provider: ${providerName})\n\n`;
    output += 'Nodes:\n';
    for (const node of nodeStatuses) {
      output += `  ${node.name}: ${node.status}\n`;
    }
    output += '\nNamespaces:\n';
    for (const ns of namespaceStatuses) {
      output += `  ${ns.name}: ${ns.ready}/${ns.pods} pods ready\n`;
    }

    return {
      success: true,
      message: output,
      data: statusData,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Failed to get status: ${message}` };
  }
};
```

### Phase 4: Deploy/Undeploy Commands

**`plugin/system/src/commands/env/deploy.ts`:**
```typescript
import { execSync, spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { findProjectRoot } from '@/lib/config';

// Helper to wait for database pod to be ready
const waitForDatabase = async (releaseName: string, namespace: string): Promise<void> => {
  console.log(`  Waiting for ${releaseName} to be ready...`);
  execSync(
    `kubectl wait --for=condition=Ready pod -l app.kubernetes.io/instance=${releaseName} -n ${namespace} --timeout=120s`,
    { stdio: 'inherit' }
  );
};

// Helper to run port-forward temporarily for migrations
const withPortForward = async <T>(
  service: string,
  namespace: string,
  localPort: number,
  remotePort: number,
  fn: () => Promise<T>
): Promise<T> => {
  const child = spawn('kubectl', [
    'port-forward',
    `svc/${service}`,
    `${localPort}:${remotePort}`,
    '-n', namespace,
  ], { stdio: 'pipe' });

  // Wait a moment for port-forward to establish
  await new Promise(resolve => setTimeout(resolve, 2000));

  try {
    return await fn();
  } finally {
    child.kill();
  }
};

export const deploy = async (
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const { positional, named } = parseNamedArgs(args);
  const specificChart = positional[0]; // Optional: deploy specific chart only

  // Find project root
  const projectRoot = await findProjectRoot();
  if (!projectRoot) {
    return {
      success: false,
      error: 'Could not find project root (no package.json found)',
    };
  }

  const settingsPath = path.join(projectRoot, '.sdd', 'sdd-settings.yaml');
  const helmChartsDir = path.join(projectRoot, 'components', 'helm_charts');

  try {
    // Read settings to find helm components and app name
    if (!fs.existsSync(settingsPath)) {
      return {
        success: false,
        error: 'No .sdd/sdd-settings.yaml found. Is this an SDD project?',
      };
    }

    const settings = yaml.parse(fs.readFileSync(settingsPath, 'utf-8'));

    // Use app name from settings as namespace (can be overridden with --namespace)
    const namespace = named['namespace'] ?? settings.name;
    if (!namespace) {
      return {
        success: false,
        error: 'No app name in sdd-settings.yaml and no --namespace provided',
      };
    }

    const skipDb = named['skip-db'] === 'true';
    const skipMigrate = named['skip-migrate'] === 'true';
    const withConfig = named['with-config'] !== 'false'; // Default: true
    const excludeList = named['exclude']?.split(',').map((s: string) => s.trim()) ?? [];

    const databaseComponents = settings.components?.filter((c: any) => c.type === 'database') ?? [];
    const helmComponents = settings.components?.filter((c: any) => c.type === 'helm') ?? [];

    // Filter out excluded components
    const filteredHelmComponents = helmComponents.filter(
      (c: any) => !excludeList.includes(c.name) && !excludeList.includes(c.settings?.deploys)
    );

    // Create namespace if needed
    execSync(`kubectl create namespace ${namespace} --dry-run=client -o yaml | kubectl apply -f -`, {
      stdio: 'inherit',
    });

    // Step 1: Set up databases (unless --skip-db)
    const deployedDbs: string[] = [];
    if (!skipDb && databaseComponents.length > 0) {
      console.log('\n=== Setting up databases ===\n');
      for (const db of databaseComponents) {
        console.log(`Setting up database: ${db.name}...`);
        try {
          // Call existing database setup command
          const { setup } = await import('../database/setup');
          const result = await setup(db.name, [`--namespace=${namespace}`]);
          if (result.success) {
            deployedDbs.push(db.name);
            // Wait for database pod to be ready before continuing
            await waitForDatabase(`${db.name}-db`, namespace);
          } else {
            console.warn(`Warning: Database ${db.name} setup failed: ${result.error}`);
          }
        } catch (err) {
          console.warn(`Warning: Database ${db.name} setup failed: ${err}`);
        }
      }

      // Step 2: Run migrations (unless --skip-migrate)
      // Requires port-forward to each database
      if (!skipMigrate && deployedDbs.length > 0) {
        console.log('\n=== Running migrations ===\n');
        let dbPort = 5432;
        for (const dbName of deployedDbs) {
          console.log(`Migrating database: ${dbName}...`);
          const localPort = dbPort++;
          const serviceName = `${dbName}-db-postgresql`;

          try {
            await withPortForward(serviceName, namespace, localPort, 5432, async () => {
              const { migrate } = await import('../database/migrate');
              // Pass connection details for localhost port-forward
              await migrate(dbName, [
                `--host=localhost`,
                `--port=${localPort}`,
                `--database=${dbName}`,
                `--user=${dbName}`,
                `--password=${dbName}-local`,
              ]);
            });
          } catch (err) {
            console.warn(`Warning: Migration for ${dbName} failed: ${err}`);
          }
        }
      }
    }

    // Step 3: Deploy helm charts
    if (helmComponents.length === 0 && databaseComponents.length === 0) {
      return {
        success: false,
        error: 'No helm or database components defined in settings',
      };
    }

    // Log excluded components
    if (excludeList.length > 0) {
      const excluded = helmComponents.filter(
        (c: any) => excludeList.includes(c.name) || excludeList.includes(c.settings?.deploys)
      );
      if (excluded.length > 0) {
        console.log(`\nExcluded from deployment: ${excluded.map((c: any) => c.name).join(', ')}`);
        console.log('(Run these locally with npm run dev)\n');
      }
    }

    // Filter to specific chart if requested
    const toDeploy = specificChart
      ? filteredHelmComponents.filter((c: any) => c.name === specificChart)
      : filteredHelmComponents;

    if (specificChart && toDeploy.length === 0) {
      // Check if it was excluded
      if (excludeList.includes(specificChart)) {
        return {
          success: false,
          error: `Chart '${specificChart}' is in the exclude list`,
        };
      }
      return {
        success: false,
        error: `Helm chart '${specificChart}' not found in settings`,
      };
    }

    // Deploy each helm chart
    const deployedCharts: string[] = [];
    if (toDeploy.length > 0) {
      console.log('\n=== Deploying helm charts ===\n');
      for (const component of toDeploy) {
        const chartPath = path.join(helmChartsDir, component.name);
        if (!fs.existsSync(chartPath)) {
          console.warn(`Warning: Chart directory not found: ${chartPath}`);
          continue;
        }

        console.log(`Deploying ${component.name}...`);
        execSync(
          `helm upgrade --install ${component.name} ${chartPath} \
            -n ${namespace} \
            --wait --timeout 5m`,
          { stdio: 'inherit' }
        );
        deployedCharts.push(component.name);
      }
    }

    // Step 4: Generate local config (unless --with-config=false)
    if (withConfig) {
      console.log('\n=== Generating local config ===\n');
      const { config } = await import('./config');
      await config([], _options);
    }

    const summary: string[] = [];
    if (deployedDbs.length > 0) {
      summary.push(`${deployedDbs.length} database(s): ${deployedDbs.join(', ')}`);
    }
    if (deployedCharts.length > 0) {
      summary.push(`${deployedCharts.length} chart(s): ${deployedCharts.join(', ')}`);
    }

    return {
      success: true,
      message: `Deployed ${summary.join('; ')}`,
      data: { databases: deployedDbs, charts: deployedCharts, namespace },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Deployment failed: ${message}` };
  }
};
```

**`plugin/system/src/commands/env/undeploy.ts`:**
```typescript
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { findProjectRoot } from '@/lib/config';

export const undeploy = async (
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const { positional, named } = parseNamedArgs(args);
  const specificChart = positional[0];

  const projectRoot = await findProjectRoot();
  if (!projectRoot) {
    return { success: false, error: 'Could not find project root (no package.json found)' };
  }
  const settingsPath = path.join(projectRoot, '.sdd', 'sdd-settings.yaml');

  try {
    const settings = yaml.parse(fs.readFileSync(settingsPath, 'utf-8'));

    // Use app name from settings as namespace (can be overridden with --namespace)
    const namespace = named['namespace'] ?? settings.name;
    if (!namespace) {
      return {
        success: false,
        error: 'No app name in sdd-settings.yaml and no --namespace provided',
      };
    }

    const helmComponents = settings.components?.filter((c: any) => c.type === 'helm') ?? [];

    const toUndeploy = specificChart
      ? helmComponents.filter((c: any) => c.name === specificChart)
      : helmComponents;

    if (specificChart && toUndeploy.length === 0) {
      return {
        success: false,
        error: `Helm chart '${specificChart}' not found in settings`,
      };
    }

    const undeployed: string[] = [];
    for (const component of toUndeploy) {
      console.log(`Undeploying ${component.name}...`);
      try {
        execSync(`helm uninstall ${component.name} -n ${namespace}`, { stdio: 'inherit' });
        undeployed.push(component.name);
      } catch {
        console.warn(`Warning: ${component.name} was not deployed or already removed`);
      }
    }

    return {
      success: true,
      message: `Undeployed ${undeployed.length} chart(s)`,
      data: { undeployed, namespace },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Undeploy failed: ${message}` };
  }
};
```

### Phase 4.5: Local Config Generation

Generate `components/config/envs/local/config.yaml` with localhost URLs matching port-forwarded services.

**`plugin/system/src/commands/env/config.ts`:**
```typescript
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { findProjectRoot } from '@/lib/config';

interface LocalConfigUrls {
  readonly databases: Record<string, { host: string; port: number }>;
  readonly services: Record<string, string>;
}

export const config = async (
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);

  const projectRoot = await findProjectRoot();
  if (!projectRoot) {
    return { success: false, error: 'Could not find project root (no package.json found)' };
  }

  const settingsPath = path.join(projectRoot, '.sdd', 'sdd-settings.yaml');
  const localEnvDir = path.join(projectRoot, 'components', 'config', 'envs', 'local');
  const localConfigPath = path.join(localEnvDir, 'config.yaml');

  try {
    if (!fs.existsSync(settingsPath)) {
      return {
        success: false,
        error: 'No .sdd/sdd-settings.yaml found. Is this an SDD project?',
      };
    }

    const settings = yaml.parse(fs.readFileSync(settingsPath, 'utf-8'));
    const databaseComponents = settings.components?.filter((c: any) => c.type === 'database') ?? [];
    const helmComponents = settings.components?.filter((c: any) => c.type === 'helm') ?? [];

    // Build local URLs based on port forward assignments
    const urls: LocalConfigUrls = {
      databases: {},
      services: {},
    };

    // Database URLs (ports start at 5432)
    let dbPort = 5432;
    for (const db of databaseComponents) {
      urls.databases[db.name] = {
        host: 'localhost',
        port: dbPort++,
      };
    }

    // Service URLs (ports start at 8080)
    let servicePort = 8080;
    for (const component of helmComponents) {
      const helmSettings = component.settings;
      if (helmSettings?.deploy_type === 'server' || helmSettings?.deploy_type === 'webapp') {
        const serviceName = helmSettings.deploys ?? component.name;
        urls.services[serviceName] = `http://localhost:${servicePort++}`;
      }
    }

    // Build the local config overlay
    const localConfig: Record<string, unknown> = {};

    // Add database connection strings
    for (const [dbName, dbConfig] of Object.entries(urls.databases)) {
      const db = databaseComponents.find((c: any) => c.name === dbName);
      const dbSettings = db?.settings ?? {};
      localConfig[dbName] = {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbSettings.database ?? dbName.replace(/-/g, '_'),
        user: dbSettings.user ?? 'postgres',
        password: dbSettings.password ?? 'postgres',
      };
    }

    // Add service URLs
    for (const [serviceName, url] of Object.entries(urls.services)) {
      localConfig[serviceName] = { url };
    }

    // Add telemetry URLs
    localConfig['telemetry'] = {
      metrics_url: 'http://localhost:9090',
      logs_url: 'http://localhost:9428',
    };

    // Ensure directory exists
    if (!fs.existsSync(localEnvDir)) {
      fs.mkdirSync(localEnvDir, { recursive: true });
    }

    // Write or update local config
    const yamlOutput = yaml.stringify(localConfig);
    fs.writeFileSync(localConfigPath, yamlOutput, 'utf-8');

    console.log('Generated local environment config:');
    console.log(yamlOutput);

    return {
      success: true,
      message: `Local config written to: ${localConfigPath}`,
      data: { path: localConfigPath, config: localConfig },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Config generation failed: ${message}` };
  }
};
```

### Phase 5: Port Forwarding

**`plugin/system/src/commands/env/forward.ts`:**
```typescript
import { spawn, execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { findProjectRoot } from '@/lib/config';

interface ForwardConfig {
  readonly service: string;
  readonly namespace: string;
  readonly localPort: number;
  readonly remotePort: number;
}

export const forward = async (
  args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
  const { positional, named } = parseNamedArgs(args);
  const action = positional[0] ?? 'start'; // start | stop | list

  try {
    if (action === 'list') {
      return listForwards();
    }

    if (action === 'stop') {
      return stopForwards();
    }

    // action === 'start' - read settings and start port forwards
    const projectRoot = await findProjectRoot();
    if (!projectRoot) {
      return { success: false, error: 'Could not find project root (no package.json found)' };
    }

    const settingsPath = path.join(projectRoot, '.sdd', 'sdd-settings.yaml');
    const settings = yaml.parse(fs.readFileSync(settingsPath, 'utf-8'));

    // Use app name from settings as namespace (can be overridden with --namespace)
    const namespace = named['namespace'] ?? settings.name;
    if (!namespace) {
      return {
        success: false,
        error: 'No app name in sdd-settings.yaml and no --namespace provided',
      };
    }

    const databaseComponents = settings.components?.filter((c: any) => c.type === 'database') ?? [];
    const helmComponents = settings.components?.filter((c: any) => c.type === 'helm') ?? [];

    // Build forward configs
    const forwards: ForwardConfig[] = [];

    // Database forwards (for hybrid local development)
    // Service name follows setup.ts convention: ${componentName}-db-postgresql
    let dbPort = 5432;
    for (const db of databaseComponents) {
      forwards.push({
        service: `${db.name}-db-postgresql`,  // bitnami chart service name
        namespace,
        localPort: dbPort++,
        remotePort: 5432,
      });
    }

    // Helm service forwards
    let nextPort = 8080;
    for (const component of helmComponents) {
      const helmSettings = component.settings;
      if (helmSettings.deploy_type === 'server' && helmSettings.ingress) {
        // API servers get port forward
        forwards.push({
          service: component.name,
          namespace,
          localPort: nextPort++,
          remotePort: 3000,
        });
      }
      if (helmSettings.deploy_type === 'webapp' && helmSettings.ingress) {
        // Webapps get port forward
        forwards.push({
          service: component.name,
          namespace,
          localPort: nextPort++,
          remotePort: 80,
        });
      }
    }

    // Telemetry forwards
    forwards.push(
      { service: 'vmstack-victoria-metrics-k8s-stack', namespace: 'telemetry', localPort: 9090, remotePort: 9090 },
      { service: 'vls-victoria-logs-single-server', namespace: 'telemetry', localPort: 9428, remotePort: 9428 }
    );

    // Start port forwards
    const started: string[] = [];
    for (const fwd of forwards) {
      try {
        // Check if service exists
        execSync(`kubectl get svc ${fwd.service} -n ${fwd.namespace}`, { stdio: 'pipe' });

        // Start port-forward in background
        const child = spawn('kubectl', [
          'port-forward',
          `svc/${fwd.service}`,
          `${fwd.localPort}:${fwd.remotePort}`,
          '-n', fwd.namespace,
        ], {
          detached: true,
          stdio: 'ignore',
        });
        child.unref();

        started.push(`${fwd.service} -> localhost:${fwd.localPort}`);
      } catch {
        console.warn(`Warning: Service ${fwd.service} not found, skipping`);
      }
    }

    let message = 'Port forwards started:\n';
    for (const s of started) {
      message += `  ${s}\n`;
    }

    return {
      success: true,
      message,
      data: { forwards: started },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Port forward failed: ${message}` };
  }
};

const listForwards = (): CommandResult => {
  try {
    const result = execSync('pgrep -af "kubectl port-forward"', { encoding: 'utf-8' });
    return {
      success: true,
      message: `Active port forwards:\n${result}`,
    };
  } catch {
    return {
      success: true,
      message: 'No active port forwards',
    };
  }
};

const stopForwards = (): CommandResult => {
  try {
    execSync('pkill -f "kubectl port-forward"', { stdio: 'pipe' });
    return {
      success: true,
      message: 'All port forwards stopped',
    };
  } catch {
    return {
      success: true,
      message: 'No port forwards were running',
    };
  }
};
```

### Phase 6: Types and Provider Abstraction

**`plugin/system/src/commands/env/types.ts`:**
```typescript
export const DEFAULT_CLUSTER_NAME = 'sdd-local';

export type ClusterProvider = 'kind' | 'minikube' | 'docker-desktop';

export interface EnvironmentConfig {
  readonly clusterName: string;
  readonly provider: ClusterProvider;
  readonly namespace: string;
}

export interface InfrastructureConfig {
  readonly metricsEnabled: boolean;
  readonly logsEnabled: boolean;
  readonly metricsRetention: string;
  readonly logsRetention: string;
}

export const DEFAULT_INFRA_CONFIG: InfrastructureConfig = {
  metricsEnabled: true,
  logsEnabled: true,
  metricsRetention: '7d',
  logsRetention: '7d',
};

// Provider interface for cluster lifecycle operations
export interface ClusterProviderOps {
  readonly name: ClusterProvider;
  readonly create: (clusterName: string) => Promise<void>;
  readonly destroy: (clusterName: string) => Promise<void>;
  readonly start: (clusterName: string) => Promise<void>;
  readonly stop: (clusterName: string) => Promise<void>;
  readonly exists: (clusterName: string) => Promise<boolean>;
  readonly isRunning: (clusterName: string) => Promise<boolean>;
}
```

**`plugin/system/src/commands/env/providers/kind.ts`:**
```typescript
import { execSync } from 'node:child_process';
import type { ClusterProviderOps } from '../types';

export const kindProvider: ClusterProviderOps = {
  name: 'kind',

  create: async (clusterName: string) => {
    const kindConfig = `
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
  - role: control-plane
    extraPortMappings:
      - containerPort: 80
        hostPort: 80
        protocol: TCP
      - containerPort: 443
        hostPort: 443
        protocol: TCP
`;
    execSync(`echo '${kindConfig}' | kind create cluster --name ${clusterName} --config=-`, {
      stdio: 'inherit',
    });
  },

  destroy: async (clusterName: string) => {
    execSync(`kind delete cluster --name ${clusterName}`, { stdio: 'inherit' });
  },

  start: async (clusterName: string) => {
    const containerName = `${clusterName}-control-plane`;
    execSync(`docker start ${containerName}`, { stdio: 'inherit' });
  },

  stop: async (clusterName: string) => {
    const containerName = `${clusterName}-control-plane`;
    execSync(`docker stop ${containerName}`, { stdio: 'inherit' });
  },

  exists: async (clusterName: string) => {
    const clusters = execSync('kind get clusters', { encoding: 'utf-8' });
    return clusters.split('\n').includes(clusterName);
  },

  isRunning: async (clusterName: string) => {
    const containerName = `${clusterName}-control-plane`;
    try {
      const status = execSync(`docker inspect -f '{{.State.Status}}' ${containerName}`, {
        encoding: 'utf-8',
      }).trim();
      return status === 'running';
    } catch {
      return false;
    }
  },
};
```

**`plugin/system/src/commands/env/providers/minikube.ts`:**
```typescript
import { execSync } from 'node:child_process';
import type { ClusterProviderOps } from '../types';

export const minikubeProvider: ClusterProviderOps = {
  name: 'minikube',

  create: async (clusterName: string) => {
    execSync(`minikube start --profile=${clusterName}`, { stdio: 'inherit' });
  },

  destroy: async (clusterName: string) => {
    execSync(`minikube delete --profile=${clusterName}`, { stdio: 'inherit' });
  },

  start: async (clusterName: string) => {
    execSync(`minikube start --profile=${clusterName}`, { stdio: 'inherit' });
  },

  stop: async (clusterName: string) => {
    execSync(`minikube stop --profile=${clusterName}`, { stdio: 'inherit' });
  },

  exists: async (clusterName: string) => {
    try {
      const profiles = execSync('minikube profile list -o json', { encoding: 'utf-8' });
      const data = JSON.parse(profiles);
      return data.valid?.some((p: any) => p.Name === clusterName) ?? false;
    } catch {
      return false;
    }
  },

  isRunning: async (clusterName: string) => {
    try {
      const status = execSync(`minikube status --profile=${clusterName} -o json`, {
        encoding: 'utf-8',
      });
      const data = JSON.parse(status);
      return data.Host === 'Running';
    } catch {
      return false;
    }
  },
};
```

**`plugin/system/src/commands/env/providers/docker-desktop.ts`:**
```typescript
import { execSync } from 'node:child_process';
import type { ClusterProviderOps } from '../types';

export const dockerDesktopProvider: ClusterProviderOps = {
  name: 'docker-desktop',

  create: async (_clusterName: string) => {
    // Docker Desktop k8s is pre-existing, just verify it's enabled
    try {
      execSync('kubectl config use-context docker-desktop', { stdio: 'inherit' });
    } catch {
      throw new Error(
        'Docker Desktop Kubernetes is not enabled. ' +
        'Enable it in Docker Desktop Settings > Kubernetes > Enable Kubernetes'
      );
    }
  },

  destroy: async (_clusterName: string) => {
    throw new Error(
      'Cannot destroy Docker Desktop Kubernetes cluster. ' +
      'Disable it in Docker Desktop Settings if needed.'
    );
  },

  start: async (_clusterName: string) => {
    // Docker Desktop k8s starts with Docker Desktop
    console.log('Docker Desktop Kubernetes starts automatically with Docker Desktop.');
    console.log('Ensure Docker Desktop is running.');
  },

  stop: async (_clusterName: string) => {
    throw new Error(
      'Cannot stop Docker Desktop Kubernetes independently. ' +
      'Stop Docker Desktop if you need to stop the cluster.'
    );
  },

  exists: async (_clusterName: string) => {
    try {
      const contexts = execSync('kubectl config get-contexts -o name', { encoding: 'utf-8' });
      return contexts.split('\n').includes('docker-desktop');
    } catch {
      return false;
    }
  },

  isRunning: async (_clusterName: string) => {
    try {
      execSync('kubectl --context=docker-desktop get nodes', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  },
};
```

**`plugin/system/src/commands/env/providers/index.ts`:**
```typescript
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { ClusterProvider, ClusterProviderOps } from '../types';
import { kindProvider } from './kind';
import { minikubeProvider } from './minikube';
import { dockerDesktopProvider } from './docker-desktop';

const providers: Record<ClusterProvider, ClusterProviderOps> = {
  'kind': kindProvider,
  'minikube': minikubeProvider,
  'docker-desktop': dockerDesktopProvider,
};

// Cluster state file location
const STATE_DIR = path.join(os.homedir(), '.sdd');
const STATE_FILE = path.join(STATE_DIR, 'clusters.json');

interface ClusterState {
  readonly clusters: Record<string, ClusterProvider>;
}

const readState = (): ClusterState => {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch {
    // Ignore parse errors
  }
  return { clusters: {} };
};

const writeState = (state: ClusterState): void => {
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
};

/**
 * Get provider instance by name.
 */
export const getProvider = (name: ClusterProvider): ClusterProviderOps => {
  return providers[name];
};

/**
 * Get the provider used to create a cluster (from persisted state).
 * Returns null if cluster is not tracked.
 */
export const getClusterProvider = (clusterName: string): ClusterProvider | null => {
  const state = readState();
  return state.clusters[clusterName] ?? null;
};

/**
 * Persist the provider used for a cluster (called after create).
 */
export const persistClusterProvider = (clusterName: string, provider: ClusterProvider): void => {
  const state = readState();
  state.clusters[clusterName] = provider;
  writeState({ clusters: { ...state.clusters } });
};

/**
 * Remove cluster from persisted state (called after destroy).
 */
export const removeClusterProvider = (clusterName: string): void => {
  const state = readState();
  const { [clusterName]: _, ...rest } = state.clusters;
  writeState({ clusters: rest });
};

/**
 * Auto-detect the best available provider for creating a new cluster.
 * Order: docker-desktop (if running) → minikube (if installed) → kind (default)
 */
export const detectProvider = async (): Promise<ClusterProvider> => {
  // 1. Check if Docker Desktop k8s is available and running
  try {
    execSync('kubectl --context=docker-desktop get nodes', { stdio: 'pipe' });
    return 'docker-desktop';
  } catch {
    // Not available or not running
  }

  // 2. Check if minikube is installed
  try {
    execSync('which minikube', { stdio: 'pipe' });
    return 'minikube';
  } catch {
    // Not installed
  }

  // 3. Default to kind
  return 'kind';
};

/**
 * Check prerequisites for running env commands.
 */
export const checkPrerequisites = (): { ok: boolean; missing: string[] } => {
  const missing: string[] = [];

  // Check docker
  try {
    execSync('docker version', { stdio: 'pipe' });
  } catch {
    missing.push('docker');
  }

  // Check kubectl
  try {
    execSync('kubectl version --client', { stdio: 'pipe' });
  } catch {
    missing.push('kubectl');
  }

  // Check helm
  try {
    execSync('helm version', { stdio: 'pipe' });
  } catch {
    missing.push('helm');
  }

  return { ok: missing.length === 0, missing };
};
```

### Phase 7: Update CLI Registration

**Update `plugin/system/src/cli.ts`:**
```typescript
// Add to NAMESPACES
const NAMESPACES = [
  'scaffolding',
  'spec',
  'version',
  'hook',
  'database',
  'contract',
  'config',
  'env',  // NEW
] as const;

// Add to COMMAND_HANDLERS
import { handleEnvironment } from './commands/env';

const COMMAND_HANDLERS: Record<Namespace, CommandHandler> = {
  scaffolding: handleScaffolding,
  spec: handleSpec,
  version: handleVersion,
  hook: handleHook,
  database: handleDatabase,
  contract: handleContract,
  config: handleConfig,
  env: handleEnvironment,  // NEW
};
```

### Phase 8: Documentation

**Update `plugin/commands/sdd-run.md`** - Add env section:
```markdown
## Environment Commands

Manage local Kubernetes development envs.

### Create Environment

```
/sdd-run env create [--name=cluster-name] [--provider=kind|minikube|docker-desktop] [--skip-infra]
```

Creates a local k8s cluster and installs the observability stack (Victoria Metrics + Victoria Logs).

Options:
- `--name`: Cluster name (default: sdd-local)
- `--provider`: Cluster provider (default: auto-detected)
  - `kind`: Kubernetes IN Docker (fast, lightweight)
  - `minikube`: Full-featured local k8s
  - `docker-desktop`: Uses Docker Desktop's built-in Kubernetes
- `--skip-infra`: Skip installing observability stack

### Destroy Environment

```
/sdd-run env destroy [--name=cluster-name] [--provider=...]
```

Completely removes the local cluster (not available for docker-desktop).

### Start/Stop Environment

```
/sdd-run env start [--name=cluster-name] [--provider=...]
/sdd-run env stop [--name=cluster-name] [--provider=...]
```

Pause and resume the cluster. State is preserved when stopped.

### Environment Status

```
/sdd-run env status [--name=cluster-name]
```

Shows cluster status, node health, and deployed workloads.

### Deploy Applications

```
/sdd-run env deploy [chart-name] [--namespace=<app-name>] [--skip-db] [--skip-migrate] [--exclude=name,...]
```

Deploys the full application stack in order:
1. **Databases** - Sets up PostgreSQL instances for each `type: database` component
2. **Migrations** - Runs database migrations
3. **Helm charts** - Deploys application charts from `components/helm_charts/`

If a specific chart name is provided, only deploys that chart (skips databases).

Options:
- `--namespace`: Override namespace (default: app name from sdd-settings.yaml)
- `--skip-db`: Skip database setup (useful for redeploying apps only)
- `--skip-migrate`: Skip running migrations
- `--exclude`: Comma-separated list of charts or components to skip (for hybrid local/k8s development)

### Hybrid Development (Local + k8s)

Run most services in k8s while developing one service locally:

```bash
# Deploy everything except main-server (which you'll run locally)
/sdd-run env deploy --exclude=main-server-api

# Start port forwards (databases, other services)
/sdd-run env forward

# Run your service locally - it connects to k8s databases via port forwards
cd components/servers/main-server
npm run dev
```

The `--exclude` flag accepts:
- Helm chart names (e.g., `main-server-api`)
- Component names from `deploys` setting (e.g., `main-server`)
- Multiple values: `--exclude=main-server-api,admin-dashboard`

### Undeploy Applications

```
/sdd-run env undeploy [chart-name] [--namespace=<app-name>]
```

Removes deployed applications (keeps infrastructure).

Options:
- `--namespace`: Override namespace (default: app name from sdd-settings.yaml)

### Port Forwarding

```
/sdd-run env forward [start|stop|list] [--namespace=<app-name>]
```

Manages port forwards for local access to services:
- `start`: Start port forwards for all services (default)
- `stop`: Stop all port forwards
- `list`: Show active port forwards

Options:
- `--namespace`: Override namespace (default: app name from sdd-settings.yaml)

### Generate Local Config

```
/sdd-run env config
```

Generates `components/config/envs/local/config.yaml` with localhost URLs matching port-forwarded services.

The generated config includes:
- **Database connections**: `localhost:5432`, `localhost:5433`, etc.
- **Service URLs**: `http://localhost:8080`, `http://localhost:8081`, etc.
- **Telemetry endpoints**: Victoria Metrics at `localhost:9090`, Victoria Logs at `localhost:9428`

This is automatically called by `env deploy` (use `--with-config=false` to skip).

Example generated config:
```yaml
primary-db:
  host: localhost
  port: 5432
  database: primary_db
  user: postgres
  password: postgres
main-server:
  url: http://localhost:8080
admin-dashboard:
  url: http://localhost:8081
telemetry:
  metrics_url: http://localhost:9090
  logs_url: http://localhost:9428
```
```

**Create `plugin/skills/local-env/SKILL.md`:**
```markdown
# Local Environment Skill

Manage local Kubernetes development envs for SDD projects.

## Prerequisites

- Docker installed and running
- kubectl installed
- helm installed
- One of the following cluster providers:
  - **kind** (`brew install kind`) - recommended
  - **minikube** (`brew install minikube`)
  - **Docker Desktop** with Kubernetes enabled

## Quick Start

```bash
# Create local env (auto-detects best provider)
/sdd-run env create

# Or specify a provider explicitly
/sdd-run env create --provider=kind
/sdd-run env create --provider=minikube
/sdd-run env create --provider=docker-desktop

# Deploy your application
/sdd-run env deploy

# Start port forwards
/sdd-run env forward

# Check status
/sdd-run env status

# Stop when done (preserves state)
/sdd-run env stop

# Resume later
/sdd-run env start

# Full cleanup
/sdd-run env destroy
```

## Architecture

### Cluster Providers

| Provider | Best For | Create Time | Notes |
|----------|----------|-------------|-------|
| `kind` | CI/CD, disposable clusters | ~30 seconds | Default, recommended |
| `minikube` | Feature-rich local dev | ~60 seconds | Supports addons |
| `docker-desktop` | Simple local dev | Already running | Uses existing cluster |

**Auto-detection order:**
1. If Docker Desktop k8s is running → `docker-desktop`
2. If minikube is installed → `minikube`
3. Default → `kind`

### Infrastructure Stack

The telemetry namespace contains:
- **Victoria Metrics**: Metrics collection and storage
- **Victoria Logs**: Log aggregation
- **Log Collector**: DaemonSet collecting logs from all pods

### Namespace Layout

| Namespace | Contents |
|-----------|----------|
| `telemetry` | Observability stack |
| `<app-name>` | Application deployments (from sdd-settings.yaml `name` field) |

## Commands Reference

| Command | Description |
|---------|-------------|
| `env create` | Create cluster + install infra |
| `env destroy` | Delete cluster entirely |
| `env start` | Resume stopped cluster |
| `env stop` | Pause cluster (preserves state) |
| `env restart` | Restart cluster (stop + start) |
| `env status` | Show cluster and workload status |
| `env deploy` | Set up databases, run migrations, deploy helm charts, generate local config |
| `env undeploy` | Remove helm deployments (databases persist) |
| `env forward` | Manage port forwards |
| `env config` | Generate local environment config file |
| `env infra` | Install/reinstall observability infrastructure |

## Integration with Settings

The deploy command reads `.sdd/sdd-settings.yaml` to:
1. Get the app `name` (used as the Kubernetes namespace)
2. Find all `type: database` components to set up
3. Find all `type: helm` components to deploy

```yaml
name: acme-backend  # Used as the Kubernetes namespace

components:
  - name: primary-db
    type: database
    settings:
      provider: postgresql

  - name: main-server-api
    type: helm
    settings:
      deploys: main-server
      deploy_type: server
      ingress: true
```

Running `env deploy`:
1. Sets up `primary-db` PostgreSQL in the `acme-backend` namespace
2. Runs migrations from `components/databases/primary-db/migrations/`
3. Deploys `main-server-api` helm chart

## Hybrid Development

Run most services in k8s while developing one locally for faster iteration:

```bash
# Deploy everything except the service you're working on
/sdd-run env deploy --exclude=main-server-api

# Start port forwards so your local service can reach k8s
/sdd-run env forward

# Run your service locally
cd components/servers/main-server
npm run dev
```

Your local service connects to:
- **Databases**: via port-forwarded PostgreSQL (localhost:5432)
- **Other APIs**: via port-forwarded services (localhost:8080+)
- **Telemetry**: Victoria Metrics at localhost:9090

The local config is auto-generated at `components/config/envs/local/config.yaml` during deploy with the correct localhost URLs. Use `sdd-system config generate --env local` to merge it with your default config.

## Troubleshooting

### Cluster won't start
```bash
# Check Docker is running
docker ps

# Check kind clusters
kind get clusters

# Delete and recreate
/sdd-run env destroy
/sdd-run env create
```

### Pods not starting
```bash
# Check pod status
kubectl get pods -A

# Check pod logs
kubectl logs <pod-name> -n <namespace>

# Describe pod for events
kubectl describe pod <pod-name> -n <namespace>
```

### Port forward not working
```bash
# List active forwards
/sdd-run env forward list

# Stop all and restart
/sdd-run env forward stop
/sdd-run env forward start
```
```

### Phase 9: Update devops.md Agent

Add local env workflow section to `plugin/agents/devops.md`.

## Verification

1. **Cluster lifecycle**
   - `env create` creates kind cluster and installs infrastructure
   - `env stop` pauses the cluster (docker stop)
   - `env start` resumes the cluster
   - `env restart` stops and starts the cluster
   - `env destroy` removes the cluster
   - Provider is persisted in `~/.sdd/clusters.json`
   - Subsequent operations use persisted provider

2. **Infrastructure installation**
   - Victoria Metrics pods running in telemetry namespace
   - Victoria Logs pods running in telemetry namespace
   - Log collector DaemonSet running
   - `env infra` can reinstall infrastructure on existing cluster
   - `env infra --reinstall` removes and reinstalls

3. **Deploy/undeploy**
   - Reads database and helm components from settings
   - Sets up PostgreSQL for each database component
   - Waits for database pods to be ready
   - Port-forwards and runs migrations
   - Deploys charts from `components/helm_charts/`
   - `--skip-db` and `--skip-migrate` flags work correctly
   - Undeploy removes helm releases (databases persist)

4. **Port forwarding**
   - Forwards services based on settings
   - Uses correct service names: `${db.name}-db-postgresql`
   - Includes telemetry services
   - Can list and stop forwards

5. **Status command**
   - Uses provider abstraction (works with kind/minikube/docker-desktop)
   - Shows cluster state (running/stopped/missing)
   - Shows provider name
   - Shows node health
   - Shows namespace pod counts

6. **Config generation**
   - Generates `components/config/envs/local/config.yaml`
   - Contains correct database connection strings
   - Contains correct service URLs
   - Auto-runs during deploy (unless `--with-config=false`)

7. **Prerequisites**
   - Checks for docker, kubectl, helm before operations
   - Provides helpful error message listing missing tools

## Dependencies

- **Task #44** (component settings + Helm charts) - Required for deploy command to work. Helm charts must exist in `components/helm_charts/`.

## Tests

Tests are located in `tests/system/commands/env/`.

### Unit Tests

#### `types.test.ts` - Types and Constants
```typescript
describe('env/types', () => {
  it('exports DEFAULT_CLUSTER_NAME as sdd-local', () => {});
  it('exports ClusterProvider type with kind | minikube | docker-desktop', () => {});
  it('exports DEFAULT_INFRA_CONFIG with expected defaults', () => {});
  it('ClusterProviderOps interface has all required methods', () => {});
});
```

#### `providers/kind.test.ts` - Kind Provider
```typescript
describe('kindProvider', () => {
  describe('create', () => {
    it('calls kind create cluster with correct name', () => {});
    it('passes kind config with port mappings', () => {});
    it('throws on kind CLI failure', () => {});
  });

  describe('destroy', () => {
    it('calls kind delete cluster with correct name', () => {});
    it('throws on kind CLI failure', () => {});
  });

  describe('start', () => {
    it('calls docker start on control-plane container', () => {});
    it('uses correct container name format: {name}-control-plane', () => {});
  });

  describe('stop', () => {
    it('calls docker stop on control-plane container', () => {});
  });

  describe('exists', () => {
    it('returns true when cluster in kind get clusters output', () => {});
    it('returns false when cluster not in output', () => {});
    it('returns false when kind CLI fails', () => {});
  });

  describe('isRunning', () => {
    it('returns true when docker inspect shows running', () => {});
    it('returns false when docker inspect shows stopped', () => {});
    it('returns false when container does not exist', () => {});
  });
});
```

#### `providers/minikube.test.ts` - Minikube Provider
```typescript
describe('minikubeProvider', () => {
  describe('create', () => {
    it('calls minikube start with --profile flag', () => {});
  });

  describe('destroy', () => {
    it('calls minikube delete with --profile flag', () => {});
  });

  describe('start', () => {
    it('calls minikube start with --profile flag', () => {});
  });

  describe('stop', () => {
    it('calls minikube stop with --profile flag', () => {});
  });

  describe('exists', () => {
    it('returns true when profile in minikube profile list', () => {});
    it('returns false when profile not found', () => {});
    it('handles empty profile list', () => {});
  });

  describe('isRunning', () => {
    it('returns true when status shows Host: Running', () => {});
    it('returns false when status shows stopped', () => {});
    it('returns false on status error', () => {});
  });
});
```

#### `providers/docker-desktop.test.ts` - Docker Desktop Provider
```typescript
describe('dockerDesktopProvider', () => {
  describe('create', () => {
    it('switches kubectl context to docker-desktop', () => {});
    it('throws helpful error when k8s not enabled', () => {});
  });

  describe('destroy', () => {
    it('throws error explaining cannot destroy docker-desktop', () => {});
  });

  describe('start', () => {
    it('logs message about Docker Desktop managing lifecycle', () => {});
  });

  describe('stop', () => {
    it('throws error explaining cannot stop independently', () => {});
  });

  describe('exists', () => {
    it('returns true when docker-desktop context exists', () => {});
    it('returns false when context not found', () => {});
  });

  describe('isRunning', () => {
    it('returns true when kubectl can reach nodes', () => {});
    it('returns false when kubectl fails', () => {});
  });
});
```

#### `providers/index.test.ts` - Provider Registry and Persistence
```typescript
describe('providers/index', () => {
  describe('getProvider', () => {
    it('returns kindProvider for kind', () => {});
    it('returns minikubeProvider for minikube', () => {});
    it('returns dockerDesktopProvider for docker-desktop', () => {});
  });

  describe('detectProvider', () => {
    it('returns docker-desktop when kubectl can reach docker-desktop context', () => {});
    it('returns minikube when docker-desktop unavailable and minikube installed', () => {});
    it('returns kind as default when others unavailable', () => {});
  });

  describe('getClusterProvider', () => {
    it('returns null for unknown cluster', () => {});
    it('returns persisted provider for known cluster', () => {});
  });

  describe('persistClusterProvider', () => {
    it('creates ~/.sdd directory if not exists', () => {});
    it('writes cluster to clusters.json', () => {});
    it('preserves existing clusters when adding new one', () => {});
  });

  describe('removeClusterProvider', () => {
    it('removes cluster from clusters.json', () => {});
    it('handles non-existent cluster gracefully', () => {});
  });

  describe('checkPrerequisites', () => {
    it('returns ok: true when all tools installed', () => {});
    it('returns missing array with docker when not installed', () => {});
    it('returns missing array with kubectl when not installed', () => {});
    it('returns missing array with helm when not installed', () => {});
    it('returns multiple missing tools', () => {});
  });
});
```

### Command Tests

#### `index.test.ts` - Environment Namespace Handler
```typescript
describe('handleEnvironment', () => {
  it('returns error for missing action', () => {});
  it('returns error for unknown action', () => {});
  it('routes create action to create module', () => {});
  it('routes destroy action to destroy module', () => {});
  it('routes start action to start module', () => {});
  it('routes stop action to stop module', () => {});
  it('routes restart action to restart module', () => {});
  it('routes status action to status module', () => {});
  it('routes deploy action to deploy module', () => {});
  it('routes undeploy action to undeploy module', () => {});
  it('routes forward action to forward module', () => {});
  it('routes config action to config module', () => {});
  it('routes infra action to infra module', () => {});
});
```

#### `create.test.ts` - Create Command
```typescript
describe('env create', () => {
  describe('prerequisites', () => {
    it('returns error listing missing tools when prerequisites fail', () => {});
  });

  describe('argument parsing', () => {
    it('uses DEFAULT_CLUSTER_NAME when --name not provided', () => {});
    it('uses provided --name value', () => {});
    it('auto-detects provider when --provider not provided', () => {});
    it('uses provided --provider value', () => {});
  });

  describe('cluster creation', () => {
    it('returns error if cluster already exists and running', () => {});
    it('returns error if cluster exists but stopped (suggests start or destroy)', () => {});
    it('calls provider.create with cluster name', () => {});
    it('persists provider after successful create', () => {});
    it('switches kubectl context for kind clusters', () => {});
    it('waits for nodes to be ready after create', () => {});
  });

  describe('infrastructure installation', () => {
    it('adds vm helm repo', () => {});
    it('creates telemetry namespace', () => {});
    it('installs victoria-metrics-k8s-stack', () => {});
    it('installs victoria-logs-single', () => {});
    it('installs victoria-logs-collector', () => {});
    it('skips infra when --skip-infra is true', () => {});
  });

  describe('error handling', () => {
    it('returns error with message on provider.create failure', () => {});
    it('returns error on infrastructure installation failure', () => {});
  });

  describe('success response', () => {
    it('returns success with cluster name in message', () => {});
    it('returns success with provider in message', () => {});
    it('returns data with clusterName, provider, infrastructure fields', () => {});
  });
});
```

#### `destroy.test.ts` - Destroy Command
```typescript
describe('env destroy', () => {
  describe('provider resolution', () => {
    it('uses persisted provider from clusters.json', () => {});
    it('uses explicit --provider override', () => {});
    it('returns error when cluster not in persisted state', () => {});
  });

  describe('destruction', () => {
    it('returns error if cluster does not exist', () => {});
    it('cleans up stale state when cluster not found', () => {});
    it('calls provider.destroy with cluster name', () => {});
    it('removes cluster from persisted state on success', () => {});
    it('returns success message on successful destroy', () => {});
    it('returns error with message on destroy failure', () => {});
  });
});
```

#### `start.test.ts` - Start Command
```typescript
describe('env start', () => {
  describe('provider resolution', () => {
    it('uses persisted provider from clusters.json', () => {});
    it('uses explicit --provider override', () => {});
    it('returns error when cluster not in persisted state', () => {});
  });

  describe('lifecycle', () => {
    it('returns error if cluster does not exist', () => {});
    it('returns success (already running) if cluster is running', () => {});
    it('calls provider.start with cluster name', () => {});
    it('waits for nodes to be ready after start', () => {});
    it('switches kubectl context for kind clusters', () => {});
    it('returns success message on successful start', () => {});
    it('returns error with message on start failure', () => {});
  });
});
```

#### `stop.test.ts` - Stop Command
```typescript
describe('env stop', () => {
  describe('provider resolution', () => {
    it('uses persisted provider from clusters.json', () => {});
    it('uses explicit --provider override', () => {});
    it('returns error when cluster not in persisted state', () => {});
  });

  describe('lifecycle', () => {
    it('returns error if cluster does not exist', () => {});
    it('calls provider.stop with cluster name', () => {});
    it('returns success message indicating state preserved', () => {});
    it('returns error with message on stop failure', () => {});
  });
});
```

#### `restart.test.ts` - Restart Command
```typescript
describe('env restart', () => {
  describe('provider resolution', () => {
    it('uses persisted provider from clusters.json', () => {});
    it('uses explicit --provider override', () => {});
    it('returns error when cluster not in persisted state', () => {});
  });

  describe('lifecycle', () => {
    it('returns error if cluster does not exist', () => {});
    it('calls stop then start in sequence', () => {});
    it('waits for nodes to be ready after restart', () => {});
    it('returns success message on successful restart', () => {});
    it('returns error if stop fails (does not attempt start)', () => {});
    it('returns error if start fails after stop', () => {});
  });
});
```

#### `status.test.ts` - Status Command
```typescript
describe('env status', () => {
  describe('provider resolution', () => {
    it('uses persisted provider from clusters.json', () => {});
    it('uses explicit --provider override', () => {});
    it('returns exists: false when cluster not in persisted state', () => {});
  });

  describe('cluster not found', () => {
    it('returns success with exists: false when provider.exists returns false', () => {});
    it('cleans up stale state from clusters.json when cluster not found', () => {});
  });

  describe('cluster stopped', () => {
    it('returns success with running: false when provider.isRunning returns false', () => {});
    it('returns provider type in status output', () => {});
  });

  describe('cluster running', () => {
    it('returns node status for each node', () => {});
    it('returns namespace pod counts (excluding kube-* namespaces)', () => {});
    it('counts ready vs total pods per namespace', () => {});
    it('formats output with cluster, nodes, namespaces sections', () => {});
    it('includes provider type in formatted output', () => {});
  });

  describe('error handling', () => {
    it('returns error on kubectl failure', () => {});
  });
});
```

#### `deploy.test.ts` - Deploy Command
```typescript
describe('env deploy', () => {
  describe('argument parsing', () => {
    it('uses settings.name as namespace when --namespace not provided', () => {});
    it('uses provided --namespace value', () => {});
    it('returns error when no namespace available', () => {});
    it('parses --exclude as comma-separated list', () => {});
    it('parses --skip-db flag', () => {});
    it('parses --skip-migrate flag', () => {});
    it('parses --with-config flag (default: true)', () => {});
  });

  describe('settings validation', () => {
    it('returns error when sdd-settings.yaml not found', () => {});
    it('returns error when no helm or database components', () => {});
  });

  describe('namespace creation', () => {
    it('creates namespace using kubectl apply (idempotent)', () => {});
  });

  describe('database setup', () => {
    it('calls database setup for each type: database component', () => {});
    it('passes namespace to database setup', () => {});
    it('skips database setup when --skip-db', () => {});
    it('logs warning and continues on database setup failure', () => {});
  });

  describe('migrations', () => {
    it('runs migrations for each successfully deployed database', () => {});
    it('skips migrations when --skip-migrate', () => {});
    it('skips migrations when --skip-db (no databases deployed)', () => {});
    it('logs warning and continues on migration failure', () => {});
  });

  describe('helm deployment', () => {
    it('deploys each type: helm component', () => {});
    it('uses helm upgrade --install with chart path', () => {});
    it('passes namespace to helm', () => {});
    it('uses --wait and --timeout flags', () => {});
    it('logs warning when chart directory not found', () => {});
    it('deploys only specified chart when positional arg provided', () => {});
    it('returns error when specified chart not found', () => {});
  });

  describe('exclude filtering', () => {
    it('excludes components by helm chart name', () => {});
    it('excludes components by deploys setting value', () => {});
    it('logs excluded components to console', () => {});
    it('returns error when specific chart is in exclude list', () => {});
  });

  describe('config generation', () => {
    it('calls config command after deployment by default', () => {});
    it('skips config when --with-config=false', () => {});
  });

  describe('success response', () => {
    it('returns summary with database and chart counts', () => {});
    it('returns data with databases, charts, namespace arrays', () => {});
  });
});
```

#### `undeploy.test.ts` - Undeploy Command
```typescript
describe('env undeploy', () => {
  it('uses settings.name as namespace when --namespace not provided', () => {});
  it('returns error when no namespace available', () => {});
  it('calls helm uninstall for each helm component', () => {});
  it('uninstalls only specified chart when positional arg provided', () => {});
  it('returns error when specified chart not found in settings', () => {});
  it('logs warning and continues when chart was not deployed', () => {});
  it('returns success with undeployed count', () => {});
});
```

#### `forward.test.ts` - Port Forward Command
```typescript
describe('env forward', () => {
  describe('start action', () => {
    it('reads settings to build forward configs', () => {});
    it('assigns database ports starting at 5432', () => {});
    it('assigns service ports starting at 8080', () => {});
    it('forwards servers with ingress: true', () => {});
    it('forwards webapps with ingress: true', () => {});
    it('adds telemetry forwards (9090, 9428)', () => {});
    it('checks service exists before forwarding', () => {});
    it('spawns detached kubectl port-forward process', () => {});
    it('logs warning when service not found', () => {});
    it('returns list of started forwards', () => {});
  });

  describe('stop action', () => {
    it('kills all kubectl port-forward processes', () => {});
    it('returns success even if no forwards running', () => {});
  });

  describe('list action', () => {
    it('returns active port forwards from pgrep', () => {});
    it('returns "no active forwards" when none running', () => {});
  });

  describe('default action', () => {
    it('defaults to start when no action specified', () => {});
  });
});
```

#### `config.test.ts` - Config Generation Command
```typescript
describe('env config', () => {
  describe('settings validation', () => {
    it('returns error when sdd-settings.yaml not found', () => {});
  });

  describe('database config generation', () => {
    it('generates config for each database component', () => {});
    it('assigns sequential ports starting at 5432', () => {});
    it('uses database name from settings or derives from component name', () => {});
    it('uses user/password from settings or defaults to postgres', () => {});
  });

  describe('service config generation', () => {
    it('generates URL for each server component', () => {});
    it('generates URL for each webapp component', () => {});
    it('assigns sequential ports starting at 8080', () => {});
    it('uses deploys setting as service key when available', () => {});
  });

  describe('telemetry config', () => {
    it('includes metrics_url pointing to localhost:9090', () => {});
    it('includes logs_url pointing to localhost:9428', () => {});
  });

  describe('file operations', () => {
    it('creates envs/local directory if not exists', () => {});
    it('writes config.yaml with YAML formatting', () => {});
    it('overwrites existing local config', () => {});
  });

  describe('success response', () => {
    it('logs generated config to console', () => {});
    it('returns path and config in data', () => {});
  });
});
```

#### `infra.test.ts` - Infrastructure Command
```typescript
describe('env infra', () => {
  describe('prerequisites', () => {
    it('returns error when cluster does not exist', () => {});
    it('returns error when cluster is not running', () => {});
  });

  describe('helm repo setup', () => {
    it('adds vm helm repo', () => {});
    it('calls helm repo update', () => {});
    it('continues if repo already exists', () => {});
  });

  describe('namespace creation', () => {
    it('creates telemetry namespace if not exists', () => {});
    it('uses kubectl apply for idempotent creation', () => {});
  });

  describe('victoria metrics installation', () => {
    it('installs victoria-metrics-k8s-stack', () => {});
    it('uses correct helm values for metrics stack', () => {});
    it('uses --wait and --timeout flags', () => {});
  });

  describe('victoria logs installation', () => {
    it('installs victoria-logs-single', () => {});
    it('installs victoria-logs-collector', () => {});
    it('uses correct helm values for logs', () => {});
  });

  describe('error handling', () => {
    it('returns error on helm install failure', () => {});
    it('includes failed component in error message', () => {});
  });

  describe('success response', () => {
    it('returns success with installed components list', () => {});
    it('logs URLs for metrics and logs endpoints', () => {});
  });
});
```

### Integration Tests

#### `integration/cluster-lifecycle.test.ts`
```typescript
describe('cluster lifecycle (integration)', () => {
  // These tests require Docker and are skipped in CI without Docker

  beforeAll(() => {
    // Skip if Docker not available
  });

  afterAll(() => {
    // Cleanup: destroy any test clusters
  });

  it('create → status → stop → start → destroy lifecycle', async () => {
    // 1. Create cluster
    const createResult = await create(['--name=test-cluster', '--skip-infra'], options);
    expect(createResult.success).toBe(true);

    // 2. Check status shows running
    const statusResult = await status(['--name=test-cluster'], options);
    expect(statusResult.data.running).toBe(true);

    // 3. Stop cluster
    const stopResult = await stop(['--name=test-cluster'], options);
    expect(stopResult.success).toBe(true);

    // 4. Check status shows stopped
    const statusResult2 = await status(['--name=test-cluster'], options);
    expect(statusResult2.data.running).toBe(false);

    // 5. Start cluster
    const startResult = await start(['--name=test-cluster'], options);
    expect(startResult.success).toBe(true);

    // 6. Destroy cluster
    const destroyResult = await destroy(['--name=test-cluster'], options);
    expect(destroyResult.success).toBe(true);
  });
});
```

#### `integration/deploy-workflow.test.ts`
```typescript
describe('deploy workflow (integration)', () => {
  // Requires running cluster - skipped without one

  it('deploys database → runs migrations → deploys helm charts', async () => {
    // Setup: create test sdd-settings.yaml with test components
    // 1. Run deploy
    // 2. Verify database pods running
    // 3. Verify helm releases installed
    // 4. Verify local config generated
    // 5. Cleanup: undeploy
  });

  it('respects --exclude flag for hybrid development', async () => {
    // 1. Deploy with --exclude=test-api
    // 2. Verify test-api not deployed
    // 3. Verify other components deployed
  });

  it('generates correct local config matching deployed services', async () => {
    // 1. Deploy
    // 2. Check config has correct ports
    // 3. Verify ports match forward command output
  });
});
```

### Test Utilities

#### `tests/system/commands/env/__mocks__/`
```typescript
// execSync mock for testing CLI commands
export const mockExecSync = jest.fn();

// Provider mocks
export const mockKindProvider = {
  name: 'kind' as const,
  create: jest.fn(),
  destroy: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  exists: jest.fn(),
  isRunning: jest.fn(),
};

// Settings mock
export const mockSettings = {
  name: 'test-app',
  components: [
    { name: 'test-db', type: 'database', settings: { provider: 'postgresql' } },
    { name: 'test-api', type: 'helm', settings: { deploys: 'api', deploy_type: 'server', ingress: true } },
  ],
};

// File system mocks for config tests
export const mockFs = {
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
};
```

### Test Configuration

Add to `tests/system/commands/env/jest.config.js`:
```javascript
module.exports = {
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/integration/'],
  // Integration tests run separately with: npm run test:integration
};
```

Add to `package.json`:
```json
{
  "scripts": {
    "test:env": "jest tests/system/commands/env --testPathIgnorePatterns=integration",
    "test:env:integration": "jest tests/system/commands/env/integration"
  }
}
```

## Out of Scope

- Multi-cluster management (managing multiple clusters simultaneously)
- Remote cluster support (only local providers: kind, minikube, docker-desktop)
- Custom infrastructure stack configuration (fixed observability stack)
- Grafana dashboards / alerting rules
- Database seeding (use `/sdd-run database seed <db-name>` after deploy)
