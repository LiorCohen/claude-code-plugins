#!/usr/bin/env npx ts-node --esm
/**
 * SDD Project Scaffolding Script
 *
 * Creates project structure from templates with variable substitution.
 * Called by Claude after user approves project configuration.
 *
 * Templates are colocated with their scaffolding skills:
 * - skills/project-scaffolding/templates/ - Root files, specs, config
 * - skills/backend-scaffolding/templates/ - Server components
 * - skills/frontend-scaffolding/templates/ - Webapp components
 * - skills/contract-scaffolding/templates/ - Contract component
 * - skills/database-scaffolding/templates/ - Database component
 *
 * Usage:
 *   npx ts-node --esm scaffolding.ts --config config.json
 *
 * Config JSON format:
 * {
 *   "project_name": "my-app",
 *   "project_description": "My application",
 *   "primary_domain": "E-commerce",
 *   "target_dir": "/path/to/output",
 *   "components": ["contract", "server", "webapp", "config"],
 *   "skills_dir": "/path/to/skills"
 * }
 */

import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';

interface Config {
  readonly project_name: string;
  readonly project_description: string;
  readonly primary_domain: string;
  readonly target_dir: string;
  readonly components: readonly string[];
  readonly skills_dir: string;
}

interface ParsedComponent {
  readonly component_type: string;
  readonly name: string | null;
  readonly dir_name: string;
}

interface ScaffoldingResult {
  readonly success: boolean;
  readonly target_dir: string;
  readonly created_dirs: number;
  readonly created_files: number;
  readonly files: readonly string[];
  readonly error?: string;
}

/**
 * Parse component specification into type, name, and directory name.
 *
 * Formats:
 * - Simple: "server" -> type=server, name=null, dir_name=server
 * - Named: "server:api" -> type=server, name=api, dir_name=server-api
 */
const parseComponent = (component: string): ParsedComponent => {
  if (component.includes(':')) {
    const [componentType, name] = component.split(':', 2);
    return {
      component_type: componentType ?? component,
      name: name ?? null,
      dir_name: `${componentType}-${name}`,
    };
  }
  return {
    component_type: component,
    name: null,
    dir_name: component,
  };
};

/**
 * Get all components of a specific type.
 */
const getComponentsByType = (
  components: readonly string[],
  componentType: string
): readonly ParsedComponent[] =>
  components.map(parseComponent).filter((c) => c.component_type === componentType);

/**
 * Replace template variables with config values.
 */
const substituteVariables = (content: string, config: Config): string => {
  const replacements: Record<string, string> = {
    '{{PROJECT_NAME}}': config.project_name,
    '{{PROJECT_DESCRIPTION}}': config.project_description,
    '{{PRIMARY_DOMAIN}}': config.primary_domain,
  };

  let result = content;
  for (const [variable, value] of Object.entries(replacements)) {
    result = result.replaceAll(variable, value);
  }
  return result;
};

const SUBSTITUTABLE_EXTENSIONS = ['.md', '.json', '.yaml', '.yml', '.ts', '.tsx', '.html', '.css', '.js'];

/**
 * Copy a template file, optionally substituting variables.
 */
const copyTemplateFile = async (
  src: string,
  dest: string,
  config: Config,
  substitute = true
): Promise<void> => {
  await fsp.mkdir(path.dirname(dest), { recursive: true });

  const ext = path.extname(src);
  if (substitute && SUBSTITUTABLE_EXTENSIONS.includes(ext)) {
    const content = await fsp.readFile(src, 'utf-8');
    const substituted = substituteVariables(content, config);
    await fsp.writeFile(dest, substituted);
  } else {
    await fsp.copyFile(src, dest);
  }

  const relativePath = path.relative(config.target_dir, dest);
  console.log(`  Created: ${relativePath}`);
};

/**
 * Create a directory if it doesn't exist.
 */
const createDirectory = async (dirPath: string, config: Config): Promise<void> => {
  await fsp.mkdir(dirPath, { recursive: true });
  const relativePath = path.relative(config.target_dir, dirPath);
  console.log(`  Created: ${relativePath}/`);
};

/**
 * Check if a directory exists.
 */
const directoryExists = (dirPath: string): boolean => {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
};

/**
 * Recursively walk a directory and return all file paths.
 */
const walkDir = async (dir: string): Promise<readonly string[]> => {
  const files: string[] = [];
  const entries = await fsp.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await walkDir(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
};

/**
 * Create the complete project structure.
 */
const scaffoldProject = async (config: Config): Promise<ScaffoldingResult> => {
  const target = config.target_dir;
  const skillsDir = config.skills_dir;
  const componentsRaw = config.components;

  // Template locations (colocated with skills)
  const projectTemplates = path.join(skillsDir, 'project-scaffolding', 'templates');
  const backendTemplates = path.join(skillsDir, 'backend-scaffolding', 'templates');
  const frontendTemplates = path.join(skillsDir, 'frontend-scaffolding', 'templates');
  const contractTemplates = path.join(skillsDir, 'contract-scaffolding', 'templates');
  const databaseTemplates = path.join(skillsDir, 'database-scaffolding', 'templates');

  // Parse all components
  const parsedComponents = componentsRaw.map(parseComponent);
  const componentTypes = new Set(parsedComponents.map((pc) => pc.component_type));

  const createdFiles: string[] = [];
  const createdDirs: string[] = [];

  // Create target directory
  await fsp.mkdir(target, { recursive: true });

  // Build display string for components
  const componentDisplay = parsedComponents.map((pc) =>
    pc.name ? `${pc.component_type}:${pc.name}` : pc.component_type
  );

  console.log(`\nScaffolding project: ${config.project_name}`);
  console.log(`Target: ${target}`);
  console.log(`Components: ${componentDisplay.join(', ')}`);
  console.log();

  // -------------------------------------------------------------------------
  // Step 1: Create root .gitignore
  // -------------------------------------------------------------------------
  console.log('Creating root files...');
  const gitignore = path.join(target, '.gitignore');
  await fsp.writeFile(
    gitignore,
    `node_modules/
.env
.DS_Store
dist/
*.log
`
  );
  createdFiles.push('.gitignore');
  console.log('  Created: .gitignore');

  // -------------------------------------------------------------------------
  // Step 2: Create directory structure
  // -------------------------------------------------------------------------
  console.log('\nCreating directory structure...');

  // Always create specs directories
  const specsDirs = [
    'specs',
    'specs/domain',
    'specs/domain/definitions',
    'specs/domain/use-cases',
    'specs/architecture',
    'specs/changes',
    'specs/external',
  ];
  for (const d of specsDirs) {
    await createDirectory(path.join(target, d), config);
    createdDirs.push(d);
  }

  // Config is always created
  const configDirs = ['components/config', 'components/config/schemas'];
  for (const d of configDirs) {
    await createDirectory(path.join(target, d), config);
    createdDirs.push(d);
  }

  // Component-specific directories
  if (componentTypes.has('contract')) {
    await createDirectory(path.join(target, 'components/contract'), config);
    createdDirs.push('components/contract');
  }

  // Server components (supports multiple instances)
  const serverComponents = getComponentsByType(componentsRaw, 'server');
  for (const server of serverComponents) {
    const dirName = server.dir_name;
    const serverSubdirs = [
      `components/${dirName}/src/operator`,
      `components/${dirName}/src/config`,
      `components/${dirName}/src/controller/http_handlers`,
      `components/${dirName}/src/model/definitions`,
      `components/${dirName}/src/model/use-cases`,
      `components/${dirName}/src/dal`,
    ];
    for (const d of serverSubdirs) {
      await createDirectory(path.join(target, d), config);
      createdDirs.push(d);
    }
  }

  // Webapp components (supports multiple instances)
  const webappComponents = getComponentsByType(componentsRaw, 'webapp');
  for (const webapp of webappComponents) {
    const dirName = webapp.dir_name;
    const webappSubdirs = [
      `components/${dirName}/src/pages`,
      `components/${dirName}/src/components`,
      `components/${dirName}/src/viewmodels`,
      `components/${dirName}/src/models`,
      `components/${dirName}/src/services`,
      `components/${dirName}/src/stores`,
      `components/${dirName}/src/types`,
      `components/${dirName}/src/utils`,
    ];
    for (const d of webappSubdirs) {
      await createDirectory(path.join(target, d), config);
      createdDirs.push(d);
    }
  }

  if (componentTypes.has('helm')) {
    await createDirectory(path.join(target, 'components/helm'), config);
    createdDirs.push('components/helm');
  }

  if (componentTypes.has('testing')) {
    const testingDirs = [
      'components/testing/tests/integration',
      'components/testing/tests/component',
      'components/testing/tests/e2e',
      'components/testing/testsuites',
    ];
    for (const d of testingDirs) {
      await createDirectory(path.join(target, d), config);
      createdDirs.push(d);
    }
  }

  if (componentTypes.has('cicd')) {
    await createDirectory(path.join(target, '.github/workflows'), config);
    createdDirs.push('.github/workflows');
  }

  if (componentTypes.has('database')) {
    const databaseDirs = [
      'components/database',
      'components/database/migrations',
      'components/database/seeds',
      'components/database/scripts',
    ];
    for (const d of databaseDirs) {
      await createDirectory(path.join(target, d), config);
      createdDirs.push(d);
    }
  }

  // -------------------------------------------------------------------------
  // Step 3: Copy and customize template files
  // -------------------------------------------------------------------------
  console.log('\nCopying template files...');

  // Root project files (from project-scaffolding skill)
  const projectFilesDir = path.join(projectTemplates, 'project');
  if (directoryExists(projectFilesDir)) {
    for (const templateFile of ['README.md', 'CLAUDE.md', 'package.json']) {
      const src = path.join(projectFilesDir, templateFile);
      if (fs.existsSync(src)) {
        await copyTemplateFile(src, path.join(target, templateFile), config);
        createdFiles.push(templateFile);
      }
    }
  }

  // Spec files (from project-scaffolding skill)
  const specsFilesDir = path.join(projectTemplates, 'specs');
  if (directoryExists(specsFilesDir)) {
    const specFiles: ReadonlyArray<readonly [string, string]> = [
      ['INDEX.md', 'specs/INDEX.md'],
      ['SNAPSHOT.md', 'specs/SNAPSHOT.md'],
      ['glossary.md', 'specs/domain/glossary.md'],
    ];
    for (const [srcName, destPath] of specFiles) {
      const src = path.join(specsFilesDir, srcName);
      if (fs.existsSync(src)) {
        await copyTemplateFile(src, path.join(target, destPath), config);
        createdFiles.push(destPath);
      }
    }
  }

  // Architecture overview (generate, not from template)
  const archOverview = path.join(target, 'specs/architecture/overview.md');
  let archContent = `# Architecture Overview

This document describes the architecture of ${config.project_name}.

## Components

`;

  // Static component descriptions
  const staticDescriptions: Record<string, string> = {
    contract: '- **Contract** (`components/contract/`): OpenAPI specifications and type generation',
    config: '- **Config** (`components/config/`): YAML-based configuration management',
    database:
      '- **Database** (`components/database/`): PostgreSQL migrations, seeds, and management scripts',
    helm: '- **Helm** (`components/helm/`): Kubernetes deployment charts',
    testing: '- **Testing** (`components/testing/`): Testkube test definitions',
  };

  // Add static components
  for (const compType of ['contract', 'config', 'database', 'helm', 'testing']) {
    if (componentTypes.has(compType)) {
      archContent += staticDescriptions[compType] + '\n';
    }
  }

  // Add server components (may be multiple)
  for (const server of serverComponents) {
    const dirName = server.dir_name;
    const displayName = server.name ?? 'Server';
    const titleCase = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    archContent += `- **${titleCase}** (\`components/${dirName}/\`): Node.js/TypeScript backend with CMDO architecture\n`;
  }

  // Add webapp components (may be multiple)
  for (const webapp of webappComponents) {
    const dirName = webapp.dir_name;
    const displayName = webapp.name ?? 'Webapp';
    const titleCase = displayName.charAt(0).toUpperCase() + displayName.slice(1);
    archContent += `- **${titleCase}** (\`components/${dirName}/\`): React/TypeScript frontend with MVVM pattern\n`;
  }

  await fsp.writeFile(archOverview, archContent);
  createdFiles.push('specs/architecture/overview.md');
  console.log('  Created: specs/architecture/overview.md');

  // Config component (from project-scaffolding skill, always created)
  const configFilesDir = path.join(projectTemplates, 'config');
  if (directoryExists(configFilesDir)) {
    const configFiles = [
      'config.yaml',
      'config-local.yaml',
      'config-testing.yaml',
      'config-production.yaml',
      'schemas/schema.json',
      'schemas/ops-schema.json',
      'schemas/app-schema.json',
    ];
    for (const cf of configFiles) {
      const src = path.join(configFilesDir, cf);
      if (fs.existsSync(src)) {
        await copyTemplateFile(src, path.join(target, 'components/config', cf), config);
        createdFiles.push(`components/config/${cf}`);
      }
    }
  }

  // Contract component (from contract-scaffolding skill)
  if (componentTypes.has('contract')) {
    if (directoryExists(contractTemplates)) {
      const contractFiles = ['package.json', 'openapi.yaml'];
      for (const cf of contractFiles) {
        const src = path.join(contractTemplates, cf);
        if (fs.existsSync(src)) {
          await copyTemplateFile(src, path.join(target, 'components/contract', cf), config);
          createdFiles.push(`components/contract/${cf}`);
        }
      }
    }

    // Create contract .gitignore
    const contractGitignore = path.join(target, 'components/contract/.gitignore');
    await fsp.writeFile(contractGitignore, 'node_modules/\ngenerated/\n');
    createdFiles.push('components/contract/.gitignore');
    console.log('  Created: components/contract/.gitignore');
  }

  // Server components (from backend-scaffolding skill, supports multiple instances)
  if (directoryExists(backendTemplates)) {
    for (const server of serverComponents) {
      const dirName = server.dir_name;

      // Walk through all server template files
      const srcFiles = await walkDir(backendTemplates);
      for (const srcFile of srcFiles) {
        const relPath = path.relative(backendTemplates, srcFile);
        const destFile = path.join(target, `components/${dirName}`, relPath);
        await copyTemplateFile(srcFile, destFile, config);
        createdFiles.push(`components/${dirName}/${relPath}`);
      }
    }
  }

  // Webapp components (from frontend-scaffolding skill, supports multiple instances)
  if (directoryExists(frontendTemplates)) {
    for (const webapp of webappComponents) {
      const dirName = webapp.dir_name;

      // Walk through all webapp template files
      const srcFiles = await walkDir(frontendTemplates);
      for (const srcFile of srcFiles) {
        const relPath = path.relative(frontendTemplates, srcFile);
        const destFile = path.join(target, `components/${dirName}`, relPath);
        await copyTemplateFile(srcFile, destFile, config);
        createdFiles.push(`components/${dirName}/${relPath}`);
      }
    }
  }

  // Database component (from database-scaffolding skill)
  if (componentTypes.has('database')) {
    if (directoryExists(databaseTemplates)) {
      // Walk through all database template files
      const srcFiles = await walkDir(databaseTemplates);
      for (const srcFile of srcFiles) {
        const relPath = path.relative(databaseTemplates, srcFile);
        const destFile = path.join(target, 'components/database', relPath);
        await copyTemplateFile(srcFile, destFile, config);
        createdFiles.push(`components/database/${relPath}`);
      }
    }
  }

  // CI/CD workflows
  if (componentTypes.has('cicd')) {
    const ciWorkflow = path.join(target, '.github/workflows/ci.yaml');

    const ciContent = `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm install --workspaces

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm run test

      - name: Build
        run: npm run build
`;
    await fsp.writeFile(ciWorkflow, ciContent);
    createdFiles.push('.github/workflows/ci.yaml');
    console.log('  Created: .github/workflows/ci.yaml');
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log(`\n${'='.repeat(60)}`);
  console.log('Scaffolding complete!');
  console.log(`${'='.repeat(60)}`);
  console.log(`Created ${createdDirs.length} directories`);
  console.log(`Created ${createdFiles.length} files`);
  console.log(`Location: ${target}`);

  return {
    success: true,
    target_dir: target,
    created_dirs: createdDirs.length,
    created_files: createdFiles.length,
    files: createdFiles,
  };
};

/**
 * Parse command line arguments.
 */
const parseArgs = (
  args: readonly string[]
): { configPath: string | null; jsonOutput: boolean } => {
  let configPath: string | null = null;
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--config') {
      configPath = args[i + 1] ?? null;
      i++;
    } else if (arg === '--json-output') {
      jsonOutput = true;
    }
  }

  return { configPath, jsonOutput };
};

const main = async (): Promise<number> => {
  const args = parseArgs(process.argv.slice(2));

  if (!args.configPath) {
    console.error('Error: --config argument is required');
    return 1;
  }

  // Load config
  if (!fs.existsSync(args.configPath)) {
    console.error(`Error: Config file not found: ${args.configPath}`);
    return 1;
  }

  const configContent = await fsp.readFile(args.configPath, 'utf-8');
  const rawConfig = JSON.parse(configContent) as Record<string, unknown>;

  // Support both old template_dir and new skills_dir
  if (!rawConfig['skills_dir'] && rawConfig['template_dir']) {
    const templateDir = rawConfig['template_dir'] as string;
    rawConfig['skills_dir'] = path.join(path.dirname(templateDir), 'skills');
  }

  // Validate required fields
  const required = ['project_name', 'target_dir', 'components', 'skills_dir'];
  for (const field of required) {
    if (!(field in rawConfig)) {
      console.error(`Error: Missing required config field: ${field}`);
      return 1;
    }
  }

  // Set defaults
  const config: Config = {
    project_name: rawConfig['project_name'] as string,
    project_description:
      (rawConfig['project_description'] as string) ??
      `A ${rawConfig['project_name']} project`,
    primary_domain: (rawConfig['primary_domain'] as string) ?? 'General',
    target_dir: rawConfig['target_dir'] as string,
    components: rawConfig['components'] as string[],
    skills_dir: rawConfig['skills_dir'] as string,
  };

  // Run scaffolding
  try {
    const result = await scaffoldProject(config);

    if (args.jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    }

    return result.success ? 0 : 1;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${errorMessage}`);
    if (args.jsonOutput) {
      console.log(JSON.stringify({ success: false, error: errorMessage }));
    }
    return 1;
  }
};

main()
  .then(process.exit)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
