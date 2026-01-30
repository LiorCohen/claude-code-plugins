/**
 * Type definitions for spec-related operations.
 */

export interface ValidationError {
  readonly file: string;
  readonly message: string;
}

export interface SpecEntry {
  readonly title: string;
  readonly type: string;
  readonly path: string;
  readonly domain: string;
  readonly issue: string;
  readonly created: string;
  readonly status: string;
}

export interface ActiveSpec {
  readonly title: string;
  readonly path: string;
  readonly domain: string;
  readonly issue: string;
  readonly overview: string;
}

export const REQUIRED_FIELDS = ['title', 'status', 'domain', 'issue', 'created', 'updated'] as const;
export const VALID_STATUSES = ['active', 'deprecated', 'superseded', 'archived'] as const;
export const PLACEHOLDER_ISSUES = ['PROJ-XXX', '[PROJ-XXX]', 'TODO', '', '{{ISSUE}}'] as const;
