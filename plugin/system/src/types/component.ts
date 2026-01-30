/**
 * Type definitions for component-related operations.
 */

export interface ComponentEntry {
  readonly type: string;
  readonly name: string;
  readonly depends_on?: readonly string[];
}

export interface ScaffoldingConfig {
  readonly project_name: string;
  readonly project_description: string;
  readonly primary_domain: string;
  readonly target_dir: string;
  readonly components: readonly ComponentEntry[];
  readonly skills_dir: string;
}

export interface ScaffoldingResult {
  readonly success: boolean;
  readonly target_dir: string;
  readonly created_dirs: number;
  readonly created_files: number;
  readonly files: readonly string[];
  readonly error?: string;
}

export interface DomainConfig {
  readonly target_dir: string;
  readonly primary_domain: string;
  readonly product_description: string;
  readonly user_personas: readonly UserPersona[];
  readonly core_workflows: readonly string[];
  readonly domain_entities: readonly string[];
}

export interface UserPersona {
  readonly type: string;
  readonly actions: string;
}

export interface PopulationResult {
  readonly success: boolean;
  readonly files_updated: readonly string[];
  readonly entity_definitions_created: number;
  readonly use_cases_created: number;
  readonly glossary_entries_added: number;
  readonly error?: string;
}
