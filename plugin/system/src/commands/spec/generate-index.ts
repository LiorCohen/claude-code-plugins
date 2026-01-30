/**
 * Generate specs/INDEX.md from all spec files.
 *
 * Usage:
 *   sdd-system spec index --specs-dir specs/
 */

import * as path from 'node:path';
import type { CommandResult } from '../../lib/args.js';
import { parseNamedArgs } from '../../lib/args.js';
import { findSpecFiles, directoryExists } from '../../lib/spec-utils.js';
import { writeText } from '../../lib/fs.js';
import type { SpecEntry } from '../../types/spec.js';

/**
 * Format a spec entry as a table row.
 */
const formatTableRow = (spec: SpecEntry): string => {
  const issueLink = spec.issue ? `[${spec.issue}](#)` : '';
  return `| ${spec.title} | ${spec.type} | [${spec.path}](${spec.path}) | ${spec.domain} | ${issueLink} | ${spec.created} |`;
};

/**
 * Generate INDEX.md content.
 */
const generateIndexContent = async (specsDir: string): Promise<string> => {
  const specs = await findSpecFiles(specsDir);

  // Transform specs to entries with status
  const entries: readonly SpecEntry[] = specs.map((spec) => {
    const fm = spec.frontmatter ?? {};
    return {
      title: fm['title'] ?? path.basename(spec.path, '.md'),
      type: fm['type'] ?? 'feature',
      path: spec.relativePath,
      domain: fm['domain'] ?? 'Unknown',
      issue: fm['issue'] ?? '',
      created: fm['created'] ?? '',
      status: fm['status'] ?? 'active',
    };
  });

  // Group by status using reduce
  const byStatus = entries.reduce(
    (acc, entry) => ({
      ...acc,
      [entry.status]: [...(acc[entry.status] ?? []), entry],
    }),
    {} as Readonly<Record<string, readonly SpecEntry[]>>
  );

  const activeSpecs = byStatus['active'] ?? [];
  const deprecatedSpecs = byStatus['deprecated'] ?? [];
  const archivedSpecs = byStatus['archived'] ?? [];

  // Count totals
  const total = specs.length;
  const active = activeSpecs.length;
  const deprecated = deprecatedSpecs.length;
  const archived = archivedSpecs.length;

  const today = new Date().toISOString().split('T')[0];

  // Generate active section rows
  const activeRows =
    activeSpecs.length > 0
      ? [...activeSpecs].sort((a, b) => a.created.localeCompare(b.created)).map(formatTableRow)
      : ['| *No active changes yet* | | | | | |'];

  // Generate deprecated section
  const deprecatedSection =
    deprecatedSpecs.length > 0
      ? [
          '| Change | Type | Spec | Domain | Issue | Deprecated |',
          '|--------|------|------|--------|-------|------------|',
          ...[...deprecatedSpecs]
            .sort((a, b) => a.created.localeCompare(b.created))
            .map(formatTableRow),
        ]
      : ['*None*'];

  // Generate archived section
  const archivedSection =
    archivedSpecs.length > 0
      ? [
          '| Change | Type | Spec | Domain | Issue | Archived |',
          '|--------|------|------|--------|-------|----------|',
          ...[...archivedSpecs]
            .sort((a, b) => a.created.localeCompare(b.created))
            .map(formatTableRow),
        ]
      : ['*None*'];

  // Combine all sections
  const lines: readonly string[] = [
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
    ...activeRows,
    '',
    '## Deprecated',
    '',
    ...deprecatedSection,
    '',
    '## Archived',
    '',
    ...archivedSection,
  ];

  return lines.join('\n') + '\n';
};

export const generateIndex = async (args: readonly string[]): Promise<CommandResult> => {
  const { named } = parseNamedArgs(args);
  const specsDir = named['specs-dir'] ?? 'specs/';

  if (!(await directoryExists(specsDir))) {
    return {
      success: false,
      error: `Specs directory not found: ${specsDir}`,
    };
  }

  const indexContent = await generateIndexContent(specsDir);
  const indexPath = path.join(specsDir, 'INDEX.md');
  await writeText(indexPath, indexContent);

  return {
    success: true,
    message: `Generated ${indexPath}`,
    data: { path: indexPath },
  };
};
