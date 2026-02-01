/**
 * Show status of local Kubernetes environment.
 *
 * Displays cluster status, node health, and workload information.
 *
 * Usage:
 *   sdd-system env status [--name=cluster-name]
 */

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

interface KubeNode {
  readonly metadata: { readonly name: string };
  readonly status: {
    readonly conditions: ReadonlyArray<{
      readonly type: string;
      readonly status: string;
    }>;
  };
}

interface KubeNamespace {
  readonly metadata: { readonly name: string };
}

interface KubePod {
  readonly status?: {
    readonly conditions?: ReadonlyArray<{
      readonly type: string;
      readonly status: string;
    }>;
  };
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
        data: {
          cluster: clusterName,
          provider: null,
          running: false,
          exists: false,
          nodes: [],
          namespaces: [],
        },
      };
    }

    const provider = getProvider(providerName);

    // Check if cluster exists
    if (!(await provider.exists(clusterName))) {
      return {
        success: true,
        message: `Cluster '${clusterName}' does not exist`,
        data: {
          cluster: clusterName,
          provider: providerName,
          running: false,
          exists: false,
          nodes: [],
          namespaces: [],
        },
      };
    }

    // Check if running
    const isRunning = await provider.isRunning(clusterName);

    if (!isRunning) {
      return {
        success: true,
        message: `Cluster '${clusterName}' exists but is stopped (provider: ${providerName})`,
        data: {
          cluster: clusterName,
          provider: providerName,
          running: false,
          exists: true,
          nodes: [],
          namespaces: [],
        },
      };
    }

    // Get node status
    const nodesJson = execSync('kubectl get nodes -o json', { encoding: 'utf-8' });
    const nodes = JSON.parse(nodesJson) as { items: readonly KubeNode[] };
    const nodeStatuses: NodeStatus[] = nodes.items.map((node) => ({
      name: node.metadata.name,
      status:
        node.status.conditions.find((c) => c.type === 'Ready')?.status === 'True'
          ? 'Ready'
          : 'NotReady',
    }));

    // Get namespace pod counts
    const namespacesJson = execSync('kubectl get namespaces -o json', { encoding: 'utf-8' });
    const namespaces = JSON.parse(namespacesJson) as { items: readonly KubeNamespace[] };
    const namespaceStatuses: NamespaceStatus[] = [];

    for (const ns of namespaces.items) {
      const nsName = ns.metadata.name;
      if (nsName.startsWith('kube-')) continue; // Skip system namespaces

      const podsJson = execSync(`kubectl get pods -n ${nsName} -o json`, { encoding: 'utf-8' });
      const pods = JSON.parse(podsJson) as { items: readonly KubePod[] };
      const total = pods.items.length;
      const ready = pods.items.filter(
        (p) => p.status?.conditions?.find((c) => c.type === 'Ready')?.status === 'True'
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
