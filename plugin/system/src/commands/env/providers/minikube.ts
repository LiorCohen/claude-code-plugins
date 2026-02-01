/**
 * Minikube cluster provider implementation.
 *
 * Minikube is a tool that runs a single-node Kubernetes cluster locally.
 */

import { execSync } from 'node:child_process';
import type { ClusterProviderOps } from '../types';

export const minikubeProvider: ClusterProviderOps = {
  name: 'minikube',

  create: async (clusterName: string): Promise<void> => {
    execSync(`minikube start --profile=${clusterName}`, { stdio: 'inherit' });
  },

  destroy: async (clusterName: string): Promise<void> => {
    execSync(`minikube delete --profile=${clusterName}`, { stdio: 'inherit' });
  },

  start: async (clusterName: string): Promise<void> => {
    execSync(`minikube start --profile=${clusterName}`, { stdio: 'inherit' });
  },

  stop: async (clusterName: string): Promise<void> => {
    execSync(`minikube stop --profile=${clusterName}`, { stdio: 'inherit' });
  },

  exists: async (clusterName: string): Promise<boolean> => {
    try {
      const profiles = execSync('minikube profile list -o json', { encoding: 'utf-8' });
      const data = JSON.parse(profiles) as { valid?: Array<{ Name: string }> };
      return data.valid?.some((p) => p.Name === clusterName) ?? false;
    } catch {
      return false;
    }
  },

  isRunning: async (clusterName: string): Promise<boolean> => {
    try {
      const status = execSync(`minikube status --profile=${clusterName} -o json`, {
        encoding: 'utf-8',
      });
      const data = JSON.parse(status) as { Host?: string };
      return data.Host === 'Running';
    } catch {
      return false;
    }
  },
};
