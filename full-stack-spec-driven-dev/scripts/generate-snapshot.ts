#!/usr/bin/env npx ts-node --esm
/**
 * Generate specs/SNAPSHOT.md from all active spec files.
 *
 * Usage: npx ts-node --esm generate-snapshot.ts --specs-dir specs/
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { extractOverview } from './lib/frontmatter.js';
import { findSpecFiles, directoryExists } from './lib/spec-utils.js';

interface ActiveSpec {
  readonly title: string;
  readonly path: string;
  readonly domain: string;
  readonly issue: string;
  readonly overview: string;
}

/**
 * Generate SNAPSHOT.md content.
 */
const generateSnapshot = async (specsDir: string): Promise<string> => {
  const allSpecs = await findSpecFiles(specsDir);

  // Filter to active specs only
  const specs: ActiveSpec[] = [];
  for (const spec of allSpecs) {
    const fm = spec.frontmatter ?? {};
    if (fm['status'] === 'active') {
      specs.push({
        title: fm['title'] ?? path.basename(spec.path, '.md'),
        path: spec.relativePath,
        domain: fm['domain'] ?? 'Unknown',
        issue: fm['issue'] ?? '',
        overview: extractOverview(spec.content),
      });
    }
  }

  // Group by domain
  const byDomain: Record<string, ActiveSpec[]> = {};
  for (const spec of specs) {
    if (!byDomain[spec.domain]) {
      byDomain[spec.domain] = [];
    }
    byDomain[spec.domain]?.push(spec);
  }

  const today = new Date().toISOString().split('T')[0];
  const domains = Object.keys(byDomain).sort();

  // Generate markdown
  const lines: string[] = [
    '# Product Snapshot',
    '',
    `Generated: ${today}`,
    '',
    'This document represents the current active state of the product by compiling all active specifications.',
    '',
  ];

  // Table of contents
  if (domains.length > 0) {
    lines.push('## Table of Contents');
    lines.push('');
    for (const domain of domains) {
      const anchor = domain.toLowerCase().replace(/ /g, '-');
      lines.push(`- [${domain}](#${anchor})`);
    }
    lines.push('');
  }

  // By domain
  lines.push('## By Domain');
  lines.push('');

  for (const domain of domains) {
    lines.push(`### ${domain}`);
    lines.push('');

    const domainSpecs = byDomain[domain] ?? [];
    const sorted = [...domainSpecs].sort((a, b) => a.title.localeCompare(b.title));

    for (const spec of sorted) {
      lines.push(`#### ${spec.title}`);
      lines.push(`**Spec:** [${spec.path}](${spec.path})`);

      if (spec.issue) {
        lines.push(`**Issue:** [${spec.issue}](#)`);
      }

      lines.push('');

      if (spec.overview) {
        lines.push(spec.overview);
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }
  }

  if (domains.length === 0) {
    lines.push('*No active specs yet*');
    lines.push('');
  }

  return lines.join('\n');
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

  const snapshotContent = await generateSnapshot(args.specsDir);
  const snapshotPath = path.join(args.specsDir, 'SNAPSHOT.md');
  await fs.writeFile(snapshotPath, snapshotContent);

  console.log(`✓ Generated ${snapshotPath}`);
  return 0;
};

main()
  .then(process.exit)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
