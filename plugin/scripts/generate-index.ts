#!/usr/bin/env npx ts-node --esm
/**
 * Generate specs/INDEX.md from all spec files.
 *
 * Usage: npx ts-node --esm generate-index.ts --specs-dir specs/
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { findSpecFiles, directoryExists } from './lib/spec-utils.js';

interface SpecEntry {
  readonly title: string;
  readonly type: string;
  readonly path: string;
  readonly domain: string;
  readonly issue: string;
  readonly created: string;
}

/**
 * Generate INDEX.md content.
 */
const generateIndex = async (specsDir: string): Promise<string> => {
  const specs = await findSpecFiles(specsDir);

  // Categorize by status
  const byStatus: Record<string, SpecEntry[]> = {
    active: [],
    deprecated: [],
    archived: [],
  };

  for (const spec of specs) {
    const fm = spec.frontmatter ?? {};
    const status = fm['status'] ?? 'active';
    const entry: SpecEntry = {
      title: fm['title'] ?? path.basename(spec.path, '.md'),
      type: fm['type'] ?? 'feature',
      path: spec.relativePath,
      domain: fm['domain'] ?? 'Unknown',
      issue: fm['issue'] ?? '',
      created: fm['created'] ?? '',
    };

    if (status in byStatus) {
      byStatus[status]?.push(entry);
    }
  }

  // Count totals
  const total = specs.length;
  const active = byStatus['active']?.length ?? 0;
  const deprecated = byStatus['deprecated']?.length ?? 0;
  const archived = byStatus['archived']?.length ?? 0;

  const today = new Date().toISOString().split('T')[0];

  // Generate markdown
  const lines: string[] = [
    '# Spec Index',
    '',
    `Last updated: ${today}`,
    '',
    `Total: ${total} specs (Active: ${active}, Deprecated: ${deprecated}, Archived: ${archived})`,
    '',
    '## Active Changes',
    '',
    '| Change | Type | Spec | Domain | Issue | Since |',
    '|--------|------|------|--------|-------|-------|',
  ];

  const activeSpecs = byStatus['active'] ?? [];
  if (activeSpecs.length > 0) {
    const sorted = [...activeSpecs].sort((a, b) => a.created.localeCompare(b.created));
    for (const spec of sorted) {
      const issueLink = spec.issue ? `[${spec.issue}](#)` : '';
      lines.push(
        `| ${spec.title} | ${spec.type} | [${spec.path}](${spec.path}) | ${spec.domain} | ${issueLink} | ${spec.created} |`
      );
    }
  } else {
    lines.push('| *No active changes yet* | | | | | |');
  }

  lines.push('');
  lines.push('## Deprecated');
  lines.push('');

  const deprecatedSpecs = byStatus['deprecated'] ?? [];
  if (deprecatedSpecs.length > 0) {
    lines.push('| Change | Type | Spec | Domain | Issue | Deprecated |');
    lines.push('|--------|------|------|--------|-------|------------|');
    const sorted = [...deprecatedSpecs].sort((a, b) => a.created.localeCompare(b.created));
    for (const spec of sorted) {
      const issueLink = spec.issue ? `[${spec.issue}](#)` : '';
      lines.push(
        `| ${spec.title} | ${spec.type} | [${spec.path}](${spec.path}) | ${spec.domain} | ${issueLink} | ${spec.created} |`
      );
    }
  } else {
    lines.push('*None*');
  }

  lines.push('');
  lines.push('## Archived');
  lines.push('');

  const archivedSpecs = byStatus['archived'] ?? [];
  if (archivedSpecs.length > 0) {
    lines.push('| Change | Type | Spec | Domain | Issue | Archived |');
    lines.push('|--------|------|------|--------|-------|----------|');
    const sorted = [...archivedSpecs].sort((a, b) => a.created.localeCompare(b.created));
    for (const spec of sorted) {
      const issueLink = spec.issue ? `[${spec.issue}](#)` : '';
      lines.push(
        `| ${spec.title} | ${spec.type} | [${spec.path}](${spec.path}) | ${spec.domain} | ${issueLink} | ${spec.created} |`
      );
    }
  } else {
    lines.push('*None*');
  }

  return lines.join('\n') + '\n';
};

/**
 * Parse command line arguments.
 */
const parseArgs = (args: readonly string[]): { specsDir: string } => {
  let specsDir = 'specs/';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--specs-dir') {
      specsDir = args[i + 1] ?? 'specs/';
      i++;
    }
  }

  return { specsDir };
};

const main = async (): Promise<number> => {
  const args = parseArgs(process.argv.slice(2));

  if (!(await directoryExists(args.specsDir))) {
    console.error(`Error: Specs directory not found: ${args.specsDir}`);
    return 1;
  }

  const indexContent = await generateIndex(args.specsDir);
  const indexPath = path.join(args.specsDir, 'INDEX.md');
  await fs.writeFile(indexPath, indexContent);

  console.log(`✓ Generated ${indexPath}`);
  return 0;
};

main()
  .then(process.exit)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
