/**
 * Config Component Template Tests
 *
 * WHY: Validates that all template files for the config component exist
 * and contain the required content. Templates are the source of truth for
 * what gets generated during scaffolding.
 */

import { describe, expect, it } from 'vitest';
import { SKILLS_DIR, joinPath, fileExists, isDirectory, readFile } from '@/lib';

const CONFIG_TEMPLATES_DIR = joinPath(SKILLS_DIR, 'config-scaffolding', 'templates');

/**
 * WHY: The package.json template defines how the config component is
 * configured as an npm workspace package. Errors here break workspace imports.
 */
describe('Config package.json Template', () => {
  /**
   * WHY: package.json is required for npm workspaces to recognize the component.
   * Without it, other components can't import types from @project/config/types.
   */
  it('package.json template exists', () => {
    const packageJson = joinPath(CONFIG_TEMPLATES_DIR, 'package.json');
    expect(fileExists(packageJson)).toBe(true);
  });

  /**
   * WHY: The {{PROJECT_NAME}} variable gets substituted during scaffolding.
   * Without it, all projects would have the same package name, causing conflicts.
   */
  it('package.json uses {{PROJECT_NAME}} variable', () => {
    const packageJson = joinPath(CONFIG_TEMPLATES_DIR, 'package.json');
    const content = readFile(packageJson);
    expect(content).toContain('{{PROJECT_NAME}}');
  });

  /**
   * WHY: The exports field enables workspace imports via @project/config/types.
   * Without it, TypeScript can't find the type definitions.
   */
  it('package.json defines exports for types', () => {
    const packageJson = joinPath(CONFIG_TEMPLATES_DIR, 'package.json');
    const content = JSON.parse(readFile(packageJson)) as {
      exports?: Record<string, unknown>;
    };

    expect(content.exports).toBeDefined();
    expect(content.exports?.['./types']).toBeDefined();
  });
});

/**
 * WHY: The tsconfig.json enables TypeScript compilation for the types directory.
 * Without it, type checking and IntelliSense won't work for config types.
 */
describe('Config tsconfig.json Template', () => {
  it('tsconfig.json template exists', () => {
    const tsconfig = joinPath(CONFIG_TEMPLATES_DIR, 'tsconfig.json');
    expect(fileExists(tsconfig)).toBe(true);
  });

  it('tsconfig.json includes types directory', () => {
    const tsconfig = joinPath(CONFIG_TEMPLATES_DIR, 'tsconfig.json');
    const content = JSON.parse(readFile(tsconfig)) as {
      include?: readonly string[];
    };

    expect(content.include).toBeDefined();
    expect(content.include?.some((p) => p.includes('types'))).toBe(true);
  });

  it('tsconfig.json uses strict mode', () => {
    const tsconfig = joinPath(CONFIG_TEMPLATES_DIR, 'tsconfig.json');
    const content = JSON.parse(readFile(tsconfig)) as {
      compilerOptions?: { strict?: boolean };
    };

    expect(content.compilerOptions?.strict).toBe(true);
  });
});

/**
 * WHY: The envs directory contains environment-specific configuration files.
 * This is the core of the environment layering system.
 */
describe('Config envs/ Templates', () => {
  /**
   * WHY: The envs directory is where all environment configs live.
   * Without it, there's no place for environment-specific configurations.
   */
  it('envs directory exists', () => {
    const envsDir = joinPath(CONFIG_TEMPLATES_DIR, 'envs');
    expect(fileExists(envsDir)).toBe(true);
    expect(isDirectory(envsDir)).toBe(true);
  });

  /**
   * WHY: The default environment is always merged first.
   * All other environments inherit from it.
   */
  it('envs/default/config.yaml exists', () => {
    const defaultConfig = joinPath(CONFIG_TEMPLATES_DIR, 'envs', 'default', 'config.yaml');
    expect(fileExists(defaultConfig)).toBe(true);
  });

  /**
   * WHY: Local environment is always present for development.
   * Developers need a place to put local-only overrides.
   */
  it('envs/local/config.yaml exists', () => {
    const localConfig = joinPath(CONFIG_TEMPLATES_DIR, 'envs', 'local', 'config.yaml');
    expect(fileExists(localConfig)).toBe(true);
  });

  /**
   * WHY: YAML Language Server schema reference enables IDE validation.
   * Without it, editors won't validate config files against the schema.
   */
  it('default config.yaml has yaml-language-server schema reference', () => {
    const defaultConfig = joinPath(CONFIG_TEMPLATES_DIR, 'envs', 'default', 'config.yaml');
    const content = readFile(defaultConfig);
    expect(content).toContain('yaml-language-server');
    expect(content).toContain('$schema');
  });

  /**
   * WHY: The global section is reserved for cross-cutting concerns.
   * Even if empty, it establishes the structure for future use.
   */
  it('default config.yaml has global section', () => {
    const defaultConfig = joinPath(CONFIG_TEMPLATES_DIR, 'envs', 'default', 'config.yaml');
    const content = readFile(defaultConfig);
    expect(content).toContain('global:');
  });
});

/**
 * WHY: The schemas directory contains JSON Schema for validation.
 * Schema validation catches config errors before runtime.
 */
describe('Config schemas/ Templates', () => {
  /**
   * WHY: The schemas directory holds validation schemas.
   * Without it, there's no standard location for schema files.
   */
  it('schemas directory exists', () => {
    const schemasDir = joinPath(CONFIG_TEMPLATES_DIR, 'schemas');
    expect(fileExists(schemasDir)).toBe(true);
    expect(isDirectory(schemasDir)).toBe(true);
  });

  /**
   * WHY: The main schema file validates all config.
   * Without it, configs can't be validated.
   */
  it('config.schema.json exists', () => {
    const schema = joinPath(CONFIG_TEMPLATES_DIR, 'schemas', 'config.schema.json');
    expect(fileExists(schema)).toBe(true);
  });

  /**
   * WHY: The schema must be valid JSON Schema.
   * Invalid schema breaks validation tooling.
   */
  it('config.schema.json is valid JSON Schema', () => {
    const schema = joinPath(CONFIG_TEMPLATES_DIR, 'schemas', 'config.schema.json');
    const content = JSON.parse(readFile(schema)) as {
      $schema?: string;
      type?: string;
    };

    expect(content.$schema).toContain('json-schema.org');
    expect(content.type).toBe('object');
  });
});

/**
 * WHY: The types directory contains TypeScript type definitions.
 * Components import these types for type-safe config access.
 */
describe('Config types/ Templates', () => {
  /**
   * WHY: The types directory holds TypeScript type definitions.
   * Without it, there's no standard location for config types.
   */
  it('types directory exists', () => {
    const typesDir = joinPath(CONFIG_TEMPLATES_DIR, 'types');
    expect(fileExists(typesDir)).toBe(true);
    expect(isDirectory(typesDir)).toBe(true);
  });

  /**
   * WHY: index.ts re-exports all config types.
   * This provides a single import point for consuming components.
   */
  it('types/index.ts exists', () => {
    const indexTs = joinPath(CONFIG_TEMPLATES_DIR, 'types', 'index.ts');
    expect(fileExists(indexTs)).toBe(true);
  });

  /**
   * WHY: BaseConfig type is the foundation for all config types.
   * Components that don't need specific types can use BaseConfig.
   */
  it('types/index.ts exports BaseConfig type', () => {
    const indexTs = joinPath(CONFIG_TEMPLATES_DIR, 'types', 'index.ts');
    const content = readFile(indexTs);
    expect(content).toContain('BaseConfig');
    expect(content).toContain('export');
  });
});
