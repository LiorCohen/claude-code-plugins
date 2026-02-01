/**
 * Deploy application to local Kubernetes environment.
 *
 * Deploys the full application stack in order:
 * 1. Databases - Sets up PostgreSQL instances for each `type: database` component
 * 2. Migrations - Runs database migrations
 * 3. Helm charts - Deploys application charts from `components/helm_charts/`
 *
 * Usage:
 *   sdd-system env deploy [chart-name] [--namespace=<app-name>] [--skip-db] [--skip-migrate] [--exclude=name,...]
 */

import { execSync, spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import type { CommandResult, GlobalOptions } from '@/lib/args';
import { parseNamedArgs } from '@/lib/args';
import { findProjectRoot } from '@/lib/config';

interface SddSettings {
  readonly name?: string;
  readonly components?: ReadonlyArray<{
    readonly name: string;
    readonly type: string;
    readonly settings?: {
      readonly deploys?: string;
      readonly deploy_type?: string;
      readonly ingress?: boolean;
      readonly database?: string;
      readonly user?: string;
      readonly password?: string;
    };
  }>;
}

/**
 * Wait for database pod to be ready.
 */
const waitForDatabase = async (releaseName: string, namespace: string): Promise<void> => {
  console.log(`  Waiting for ${releaseName} to be ready...`);
  execSync(
    `kubectl wait --for=condition=Ready pod -l app.kubernetes.io/instance=${releaseName} -n ${namespace} --timeout=120s`,
    { stdio: 'inherit' }
  );
};

/**
 * Run port-forward temporarily for migrations.
 */
const withPortForward = async <T>(
  service: string,
  namespace: string,
  localPort: number,
  remotePort: number,
  fn: () => Promise<T>
): Promise<T> => {
  const child = spawn(
    'kubectl',
    ['port-forward', `svc/${service}`, `${localPort}:${remotePort}`, '-n', namespace],
    { stdio: 'pipe' }
  );

  // Wait a moment for port-forward to establish
  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    return await fn();
  } finally {
    child.kill();
  }
};

export const deploy = async (
  args: readonly string[],
  options: GlobalOptions
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

    const settings = yaml.parse(fs.readFileSync(settingsPath, 'utf-8')) as SddSettings;

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
    const excludeList = named['exclude']?.split(',').map((s) => s.trim()) ?? [];

    const databaseComponents =
      settings.components?.filter((c) => c.type === 'database') ?? [];
    const helmComponents = settings.components?.filter((c) => c.type === 'helm') ?? [];

    // Filter out excluded components
    const filteredHelmComponents = helmComponents.filter(
      (c) => !excludeList.includes(c.name) && !excludeList.includes(c.settings?.deploys ?? '')
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
          console.warn(`Warning: Database ${db.name} setup failed: ${String(err)}`);
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
            console.warn(`Warning: Migration for ${dbName} failed: ${String(err)}`);
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
        (c) => excludeList.includes(c.name) || excludeList.includes(c.settings?.deploys ?? '')
      );
      if (excluded.length > 0) {
        console.log(`\nExcluded from deployment: ${excluded.map((c) => c.name).join(', ')}`);
        console.log('(Run these locally with npm run dev)\n');
      }
    }

    // Filter to specific chart if requested
    const toDeploy = specificChart
      ? filteredHelmComponents.filter((c) => c.name === specificChart)
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
      await config([], options);
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
