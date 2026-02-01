/**
 * Generate local environment configuration.
 *
 * Creates `components/config/envs/local/config.yaml` with localhost URLs
 * matching port-forwarded services.
 *
 * Usage:
 *   sdd-system env config
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import type { CommandResult, GlobalOptions } from '@/lib/args';
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

interface LocalConfigUrls {
  readonly databases: Readonly<Record<string, { host: string; port: number }>>;
  readonly services: Readonly<Record<string, string>>;
}

export const config = async (
  _args: readonly string[],
  _options: GlobalOptions
): Promise<CommandResult> => {
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

    const settings = yaml.parse(fs.readFileSync(settingsPath, 'utf-8')) as SddSettings;
    const databaseComponents =
      settings.components?.filter((c) => c.type === 'database') ?? [];
    const helmComponents = settings.components?.filter((c) => c.type === 'helm') ?? [];

    // Build local URLs based on port forward assignments
    const urls: LocalConfigUrls = {
      databases: {},
      services: {},
    };

    // Database URLs (ports start at 5432)
    let dbPort = 5432;
    const dbMutable: Record<string, { host: string; port: number }> = {};
    for (const db of databaseComponents) {
      dbMutable[db.name] = {
        host: 'localhost',
        port: dbPort++,
      };
    }
    urls.databases satisfies typeof urls.databases;
    Object.assign(urls, { databases: dbMutable });

    // Service URLs (ports start at 8080)
    let servicePort = 8080;
    const svcMutable: Record<string, string> = {};
    for (const component of helmComponents) {
      const helmSettings = component.settings;
      if (helmSettings?.deploy_type === 'server' || helmSettings?.deploy_type === 'webapp') {
        const serviceName = helmSettings.deploys ?? component.name;
        svcMutable[serviceName] = `http://localhost:${servicePort++}`;
      }
    }
    Object.assign(urls, { services: svcMutable });

    // Build the local config overlay
    const localConfig: Record<string, unknown> = {};

    // Add database connection strings
    for (const [dbName, dbConfig] of Object.entries(urls.databases)) {
      const db = databaseComponents.find((c) => c.name === dbName);
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
