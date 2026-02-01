/**
 * Provider registry and cluster state management.
 */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { ClusterProvider, ClusterProviderOps } from '../types';
import { kindProvider } from './kind';
import { minikubeProvider } from './minikube';
import { dockerDesktopProvider } from './docker-desktop';

const providers: Readonly<Record<ClusterProvider, ClusterProviderOps>> = {
  kind: kindProvider,
  minikube: minikubeProvider,
  'docker-desktop': dockerDesktopProvider,
};

// Cluster state file location
const STATE_DIR = path.join(os.homedir(), '.sdd');
const STATE_FILE = path.join(STATE_DIR, 'clusters.json');

interface ClusterState {
  readonly clusters: Readonly<Record<string, ClusterProvider>>;
}

const readState = (): ClusterState => {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) as ClusterState;
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
  writeState({ clusters: { ...state.clusters, [clusterName]: provider } });
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
export const checkPrerequisites = (): { ok: boolean; missing: readonly string[] } => {
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
