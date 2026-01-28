#!/usr/bin/env npx ts-node --esm
/**
 * SDD Domain Population Script
 *
 * Populates domain specs (glossary, definitions, use-cases) from discovery results.
 * Called by Claude after project scaffolding is complete.
 *
 * Usage:
 *   npx ts-node --esm domain-population.ts --config config.json
 *
 * Config JSON format:
 * {
 *   "target_dir": "/path/to/project",
 *   "primary_domain": "Task Management",
 *   "product_description": "Task management for engineering teams",
 *   "user_personas": [{"type": "PM", "actions": "create tasks"}],
 *   "core_workflows": ["Create tasks", "Assign tasks"],
 *   "domain_entities": ["Task", "User", "Project"]
 * }
 */

import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';

interface UserPersona {
  readonly type: string;
  readonly actions: string;
}

interface Config {
  readonly target_dir: string;
  readonly primary_domain: string;
  readonly product_description: string;
  readonly user_personas: readonly UserPersona[];
  readonly core_workflows: readonly string[];
  readonly domain_entities: readonly string[];
}

interface PopulationResult {
  readonly success: boolean;
  readonly files_updated: readonly string[];
  readonly entity_definitions_created: number;
  readonly use_cases_created: number;
  readonly glossary_entries_added: number;
  readonly error?: string;
}

/**
 * Convert a string to a slug (lowercase, hyphens).
 */
const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Create an entity definition stub file.
 */
const createEntityDefinition = async (
  entity: string,
  domain: string,
  targetDir: string
): Promise<string> => {
  const slug = slugify(entity);
  const filePath = path.join(targetDir, 'specs/domain/definitions', `${slug}.md`);

  const content = `---
name: ${entity}
domain: ${domain}
status: draft
---

# ${entity}

## Description

A ${entity.toLowerCase()} in the ${domain.toLowerCase()} domain.

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| id | string | Unique identifier |
| (to be defined) | | |

## Relationships

- (to be defined based on domain model)

## States (if applicable)

(to be defined)
`;

  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, content);

  return `specs/domain/definitions/${slug}.md`;
};

/**
 * Create a use-case stub file.
 */
const createUseCaseStub = async (
  workflow: string,
  domain: string,
  personas: readonly UserPersona[],
  targetDir: string
): Promise<string> => {
  const slug = slugify(workflow);
  const filePath = path.join(targetDir, 'specs/domain/use-cases', `${slug}.md`);

  // Find relevant actors based on workflow keywords
  const actors = personas.length > 0 ? personas.map((p) => p.type).join(', ') : 'User';

  const content = `---
name: ${workflow}
domain: ${domain}
actors: ${actors}
status: draft
---

# ${workflow}

## Summary

Allows users to ${workflow.toLowerCase()}.

## Actors

${personas.length > 0 ? personas.map((p) => `- ${p.type}`).join('\n') : '- User'}

## Preconditions

- (to be defined)

## Main Flow

1. Actor initiates the action
2. (to be defined)
3. System confirms completion

## Postconditions

- (to be defined)

## Alternative Flows

(to be defined)

## Error Handling

(to be defined)
`;

  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, content);

  return `specs/domain/use-cases/${slug}.md`;
};

/**
 * Update the glossary with new entities.
 */
const updateGlossary = async (
  entities: readonly string[],
  domain: string,
  targetDir: string
): Promise<number> => {
  const glossaryPath = path.join(targetDir, 'specs/domain/glossary.md');

  // Read existing glossary or create new one
  let content: string;
  try {
    content = await fsp.readFile(glossaryPath, 'utf-8');
  } catch {
    content = `# Domain Glossary

This glossary defines key terms and concepts in the ${domain} domain.

## Entities

| Term | Definition | Related Terms |
|------|------------|---------------|
`;
  }

  // Check which entities already exist
  const existingEntities = new Set<string>();
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.startsWith('|') && !line.includes('Term') && !line.includes('---')) {
      const term = line.split('|')[1]?.trim().toLowerCase();
      if (term) {
        existingEntities.add(term);
      }
    }
  }

  // Add new entities
  let addedCount = 0;
  const newEntries: string[] = [];

  for (const entity of entities) {
    if (!existingEntities.has(entity.toLowerCase())) {
      newEntries.push(`| ${entity} | A ${entity.toLowerCase()} in the ${domain.toLowerCase()} domain. | (to be defined) |`);
      addedCount++;
    }
  }

  if (newEntries.length > 0) {
    // Find the table and append entries
    const tableEndIndex = content.lastIndexOf('|');
    if (tableEndIndex !== -1) {
      // Find the end of the last table row
      const lastNewline = content.indexOf('\n', tableEndIndex);
      if (lastNewline !== -1) {
        content = content.slice(0, lastNewline + 1) + newEntries.join('\n') + '\n' + content.slice(lastNewline + 1);
      } else {
        content += '\n' + newEntries.join('\n') + '\n';
      }
    } else {
      // No table found, append at end
      content += '\n' + newEntries.join('\n') + '\n';
    }

    await fsp.writeFile(glossaryPath, content);
  }

  return addedCount;
};

/**
 * Update SNAPSHOT.md with product overview.
 */
const updateSnapshot = async (
  config: Config,
  targetDir: string
): Promise<void> => {
  const snapshotPath = path.join(targetDir, 'specs/SNAPSHOT.md');

  // Read existing snapshot
  let content: string;
  try {
    content = await fsp.readFile(snapshotPath, 'utf-8');
  } catch {
    content = `# Project Snapshot

Current state of the project specifications.

`;
  }

  // Check if Product Overview already exists
  if (content.includes('## Product Overview')) {
    // Already has overview, skip
    return;
  }

  // Build the overview section
  let overview = `## Product Overview

**Problem:** ${config.product_description}

`;

  if (config.user_personas.length > 0) {
    overview += '**Target Users:**\n';
    for (const persona of config.user_personas) {
      overview += `- ${persona.type}: ${persona.actions}\n`;
    }
    overview += '\n';
  }

  if (config.core_workflows.length > 0) {
    overview += '**Core Capabilities:**\n';
    for (const workflow of config.core_workflows) {
      overview += `- ${workflow}\n`;
    }
    overview += '\n';
  }

  if (config.domain_entities.length > 0) {
    overview += `**Key Entities:** ${config.domain_entities.join(', ')}\n\n`;
  }

  // Append overview to snapshot
  content += overview;
  await fsp.writeFile(snapshotPath, content);
};

/**
 * Populate all domain specs.
 */
const populateDomain = async (config: Config): Promise<PopulationResult> => {
  const targetDir = config.target_dir;
  const filesUpdated: string[] = [];

  console.log(`\nPopulating domain specs for: ${config.primary_domain}`);
  console.log(`Target: ${targetDir}`);
  console.log();

  // Create entity definitions
  console.log('Creating entity definitions...');
  let entityCount = 0;
  for (const entity of config.domain_entities) {
    const filePath = await createEntityDefinition(entity, config.primary_domain, targetDir);
    filesUpdated.push(filePath);
    entityCount++;
    console.log(`  Created: ${filePath}`);
  }

  // Create use-case stubs
  console.log('\nCreating use-case stubs...');
  let useCaseCount = 0;
  for (const workflow of config.core_workflows) {
    const filePath = await createUseCaseStub(
      workflow,
      config.primary_domain,
      config.user_personas,
      targetDir
    );
    filesUpdated.push(filePath);
    useCaseCount++;
    console.log(`  Created: ${filePath}`);
  }

  // Update glossary
  console.log('\nUpdating glossary...');
  const glossaryEntries = await updateGlossary(
    config.domain_entities,
    config.primary_domain,
    targetDir
  );
  if (glossaryEntries > 0) {
    filesUpdated.push('specs/domain/glossary.md');
    console.log(`  Updated: specs/domain/glossary.md (${glossaryEntries} entries added)`);
  } else {
    console.log('  No new entries to add');
  }

  // Update SNAPSHOT
  console.log('\nUpdating SNAPSHOT...');
  await updateSnapshot(config, targetDir);
  filesUpdated.push('specs/SNAPSHOT.md');
  console.log('  Updated: specs/SNAPSHOT.md');

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('Domain population complete!');
  console.log(`${'='.repeat(60)}`);
  console.log(`Created ${entityCount} entity definitions`);
  console.log(`Created ${useCaseCount} use-case stubs`);
  console.log(`Added ${glossaryEntries} glossary entries`);
  console.log('Updated SNAPSHOT with product overview');

  return {
    success: true,
    files_updated: filesUpdated,
    entity_definitions_created: entityCount,
    use_cases_created: useCaseCount,
    glossary_entries_added: glossaryEntries,
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
    console.error('Usage: npx ts-node --esm domain-population.ts --config config.json');
    return 1;
  }

  // Load config
  if (!fs.existsSync(args.configPath)) {
    console.error(`Error: Config file not found: ${args.configPath}`);
    return 1;
  }

  const configContent = await fsp.readFile(args.configPath, 'utf-8');
  const rawConfig = JSON.parse(configContent) as Record<string, unknown>;

  // Validate required fields
  const required = ['target_dir', 'primary_domain', 'product_description'];
  for (const field of required) {
    if (!(field in rawConfig)) {
      console.error(`Error: Missing required config field: ${field}`);
      return 1;
    }
  }

  // Set defaults
  const config: Config = {
    target_dir: rawConfig['target_dir'] as string,
    primary_domain: rawConfig['primary_domain'] as string,
    product_description: rawConfig['product_description'] as string,
    user_personas: (rawConfig['user_personas'] as UserPersona[]) ?? [],
    core_workflows: (rawConfig['core_workflows'] as string[]) ?? [],
    domain_entities: (rawConfig['domain_entities'] as string[]) ?? [],
  };

  // Run population
  try {
    const result = await populateDomain(config);

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
