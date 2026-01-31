/**
 * Helm Component Template Tests
 *
 * WHY: Validates that all template files for the helm component exist
 * and contain the required content. Templates are the source of truth for
 * what gets generated during scaffolding.
 */

import { describe, expect, it } from 'vitest';
import { SKILLS_DIR, joinPath, fileExists, isDirectory, readFile } from '@/lib';

const HELM_TEMPLATES_DIR = joinPath(SKILLS_DIR, 'helm-scaffolding', 'templates');

/**
 * WHY: Chart.yaml is the required metadata file for any Helm chart.
 * Without it, Helm cannot recognize the directory as a valid chart.
 */
describe('Helm Chart.yaml Template', () => {
  it('Chart.yaml template exists', () => {
    const chartYaml = joinPath(HELM_TEMPLATES_DIR, 'Chart.yaml');
    expect(fileExists(chartYaml)).toBe(true);
  });

  /**
   * WHY: The {{CHART_NAME}} variable gets substituted during scaffolding.
   * Without it, all charts would have the same name.
   */
  it('Chart.yaml uses template variables', () => {
    const chartYaml = joinPath(HELM_TEMPLATES_DIR, 'Chart.yaml');
    const content = readFile(chartYaml);
    expect(content).toContain('{{CHART_NAME}}');
    expect(content).toContain('{{CHART_DESCRIPTION}}');
  });

  /**
   * WHY: apiVersion v2 is required for Helm 3.
   * Using v1 would cause compatibility issues.
   */
  it('Chart.yaml uses apiVersion v2', () => {
    const chartYaml = joinPath(HELM_TEMPLATES_DIR, 'Chart.yaml');
    const content = readFile(chartYaml);
    expect(content).toContain('apiVersion: v2');
  });
});

/**
 * WHY: values.yaml provides default configuration for the chart.
 * It's the primary way users customize deployments.
 */
describe('Helm values.yaml Template', () => {
  it('values.yaml template exists', () => {
    const valuesYaml = joinPath(HELM_TEMPLATES_DIR, 'values.yaml');
    expect(fileExists(valuesYaml)).toBe(true);
  });

  /**
   * WHY: nodeEnv is required for NODE_ENV injection in deployments.
   * Libraries like Express use NODE_ENV for performance optimizations.
   */
  it('values.yaml defines nodeEnv', () => {
    const valuesYaml = joinPath(HELM_TEMPLATES_DIR, 'values.yaml');
    const content = readFile(valuesYaml);
    expect(content).toContain('nodeEnv:');
  });

  /**
   * WHY: The config section holds application configuration.
   * It gets mounted into the container via ConfigMap.
   */
  it('values.yaml defines config section', () => {
    const valuesYaml = joinPath(HELM_TEMPLATES_DIR, 'values.yaml');
    const content = readFile(valuesYaml);
    expect(content).toContain('config:');
  });

  /**
   * WHY: Image configuration is required for pod deployment.
   * Without it, Kubernetes doesn't know which container to run.
   */
  it('values.yaml defines image configuration', () => {
    const valuesYaml = joinPath(HELM_TEMPLATES_DIR, 'values.yaml');
    const content = readFile(valuesYaml);
    expect(content).toContain('image:');
    expect(content).toContain('repository:');
    expect(content).toContain('tag:');
  });

  /**
   * WHY: Resource limits prevent runaway containers from consuming all resources.
   * Production deployments require defined resource boundaries.
   */
  it('values.yaml defines resource limits', () => {
    const valuesYaml = joinPath(HELM_TEMPLATES_DIR, 'values.yaml');
    const content = readFile(valuesYaml);
    expect(content).toContain('resources:');
    expect(content).toContain('limits:');
    expect(content).toContain('requests:');
  });
});

/**
 * WHY: values-local.yaml provides local development overrides.
 * Local k8s (minikube, kind) needs different settings than production.
 */
describe('Helm values-local.yaml Template', () => {
  it('values-local.yaml template exists', () => {
    const valuesLocal = joinPath(HELM_TEMPLATES_DIR, 'values-local.yaml');
    expect(fileExists(valuesLocal)).toBe(true);
  });

  /**
   * WHY: Local dev should use Never pull policy for locally built images.
   * This prevents pulling from registry for local-only images.
   */
  it('values-local.yaml uses Never pull policy', () => {
    const valuesLocal = joinPath(HELM_TEMPLATES_DIR, 'values-local.yaml');
    const content = readFile(valuesLocal);
    expect(content).toContain('pullPolicy: Never');
  });
});

/**
 * WHY: The templates/ directory contains Kubernetes manifests.
 * These are the actual resources that get deployed.
 */
describe('Helm templates/ Directory', () => {
  it('templates directory exists', () => {
    const templatesDir = joinPath(HELM_TEMPLATES_DIR, 'templates');
    expect(fileExists(templatesDir)).toBe(true);
    expect(isDirectory(templatesDir)).toBe(true);
  });

  /**
   * WHY: deployment.yaml defines the pod specification.
   * This is the core template that runs the application.
   */
  it('deployment.yaml template exists', () => {
    const deployment = joinPath(HELM_TEMPLATES_DIR, 'templates', 'deployment.yaml');
    expect(fileExists(deployment)).toBe(true);
  });

  /**
   * WHY: service.yaml exposes the deployment to other pods.
   * Without it, the application isn't accessible.
   */
  it('service.yaml template exists', () => {
    const service = joinPath(HELM_TEMPLATES_DIR, 'templates', 'service.yaml');
    expect(fileExists(service)).toBe(true);
  });

  /**
   * WHY: configmap.yaml mounts the application config.
   * This is how SDD config gets into the container.
   */
  it('configmap.yaml template exists', () => {
    const configmap = joinPath(HELM_TEMPLATES_DIR, 'templates', 'configmap.yaml');
    expect(fileExists(configmap)).toBe(true);
  });
});

/**
 * WHY: The deployment template must integrate with the SDD config system.
 * It needs to mount config and set environment variables correctly.
 */
describe('Helm Deployment Template Config Integration', () => {
  /**
   * WHY: SDD_CONFIG_PATH tells the app where to find its config file.
   * Without it, the app can't load configuration.
   */
  it('deployment.yaml sets SDD_CONFIG_PATH environment variable', () => {
    const deployment = joinPath(HELM_TEMPLATES_DIR, 'templates', 'deployment.yaml');
    const content = readFile(deployment);
    expect(content).toContain('SDD_CONFIG_PATH');
    expect(content).toContain('/app/config/config.yaml');
  });

  /**
   * WHY: NODE_ENV is needed for library performance optimizations.
   * It's sourced from values.yaml so it can vary by environment.
   */
  it('deployment.yaml sets NODE_ENV from values', () => {
    const deployment = joinPath(HELM_TEMPLATES_DIR, 'templates', 'deployment.yaml');
    const content = readFile(deployment);
    expect(content).toContain('NODE_ENV');
    expect(content).toContain('.Values.nodeEnv');
  });

  /**
   * WHY: The config volume mounts the ConfigMap into the container.
   * This makes the config file available at /app/config/.
   */
  it('deployment.yaml mounts config volume', () => {
    const deployment = joinPath(HELM_TEMPLATES_DIR, 'templates', 'deployment.yaml');
    const content = readFile(deployment);
    expect(content).toContain('volumeMounts:');
    expect(content).toContain('mountPath: /app/config');
    expect(content).toContain('volumes:');
    expect(content).toContain('configMap:');
  });

  /**
   * WHY: Config changes should trigger pod restarts.
   * The checksum annotation ensures pods restart when config changes.
   */
  it('deployment.yaml has config checksum annotation', () => {
    const deployment = joinPath(HELM_TEMPLATES_DIR, 'templates', 'deployment.yaml');
    const content = readFile(deployment);
    expect(content).toContain('checksum/config');
    expect(content).toContain('sha256sum');
  });
});

/**
 * WHY: The ConfigMap template must correctly render the config YAML.
 * This is how .Values.config becomes a file in the container.
 */
describe('Helm ConfigMap Template', () => {
  /**
   * WHY: The config.yaml key maps to the mounted file name.
   * The deployment expects /app/config/config.yaml.
   */
  it('configmap.yaml creates config.yaml key', () => {
    const configmap = joinPath(HELM_TEMPLATES_DIR, 'templates', 'configmap.yaml');
    const content = readFile(configmap);
    expect(content).toContain('config.yaml:');
  });

  /**
   * WHY: The toYaml function renders .Values.config as YAML.
   * Without it, the config would be serialized incorrectly.
   */
  it('configmap.yaml uses toYaml for config rendering', () => {
    const configmap = joinPath(HELM_TEMPLATES_DIR, 'templates', 'configmap.yaml');
    const content = readFile(configmap);
    expect(content).toContain('toYaml');
    expect(content).toContain('.Values.config');
  });
});
