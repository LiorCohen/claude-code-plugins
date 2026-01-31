/**
 * Deep Merge Logic Tests
 *
 * WHY: The deepMerge function is core to config generation. It must correctly
 * implement the merge algorithm: objects merge recursively, arrays replace,
 * primitives replace, and null removes keys.
 */

import { describe, expect, it } from 'vitest';

type ConfigObject = Record<string, unknown>;

/**
 * Copy of deepMerge from generate.ts for unit testing.
 * This tests the algorithm in isolation.
 */
const deepMerge = (base: ConfigObject, override: ConfigObject): ConfigObject => {
  const result: ConfigObject = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (value === null) {
      delete result[key];
    } else if (
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof result[key] === 'object' &&
      !Array.isArray(result[key]) &&
      result[key] !== null
    ) {
      result[key] = deepMerge(result[key] as ConfigObject, value as ConfigObject);
    } else {
      result[key] = value;
    }
  }

  return result;
};

describe('deepMerge Algorithm', () => {
  describe('Primitive values', () => {
    it('override replaces base primitive', () => {
      const base = { port: 3000 };
      const override = { port: 8080 };
      const result = deepMerge(base, override);
      expect(result.port).toBe(8080);
    });

    it('preserves base value when override has no key', () => {
      const base = { port: 3000, host: 'localhost' };
      const override = { port: 8080 };
      const result = deepMerge(base, override);
      expect(result.port).toBe(8080);
      expect(result.host).toBe('localhost');
    });

    it('adds new keys from override', () => {
      const base = { port: 3000 };
      const override = { host: 'localhost' };
      const result = deepMerge(base, override);
      expect(result.port).toBe(3000);
      expect(result.host).toBe('localhost');
    });

    it('handles string values', () => {
      const base = { name: 'base' };
      const override = { name: 'override' };
      const result = deepMerge(base, override);
      expect(result.name).toBe('override');
    });

    it('handles boolean values', () => {
      const base = { enabled: true };
      const override = { enabled: false };
      const result = deepMerge(base, override);
      expect(result.enabled).toBe(false);
    });
  });

  describe('Object merging (recursive)', () => {
    it('recursively merges nested objects', () => {
      const base = {
        database: {
          host: 'db.internal',
          port: 5432,
          pool: 10,
        },
      };
      const override = {
        database: {
          host: 'localhost',
        },
      };
      const result = deepMerge(base, override);
      expect(result.database).toEqual({
        host: 'localhost',
        port: 5432,
        pool: 10,
      });
    });

    it('handles deeply nested objects', () => {
      const base = {
        server: {
          database: {
            connection: {
              host: 'db.internal',
              port: 5432,
            },
          },
        },
      };
      const override = {
        server: {
          database: {
            connection: {
              host: 'localhost',
            },
          },
        },
      };
      const result = deepMerge(base, override);
      expect((result.server as ConfigObject).database).toEqual({
        connection: {
          host: 'localhost',
          port: 5432,
        },
      });
    });

    it('adds new nested keys', () => {
      const base = {
        database: {
          host: 'localhost',
        },
      };
      const override = {
        database: {
          pool: 20,
        },
      };
      const result = deepMerge(base, override);
      expect(result.database).toEqual({
        host: 'localhost',
        pool: 20,
      });
    });
  });

  describe('Array replacement', () => {
    it('replaces arrays entirely (does not concatenate)', () => {
      const base = { tags: ['a', 'b', 'c'] };
      const override = { tags: ['x', 'y'] };
      const result = deepMerge(base, override);
      expect(result.tags).toEqual(['x', 'y']);
    });

    it('replaces empty array with non-empty array', () => {
      const base = { tags: [] };
      const override = { tags: ['a', 'b'] };
      const result = deepMerge(base, override);
      expect(result.tags).toEqual(['a', 'b']);
    });

    it('replaces non-empty array with empty array', () => {
      const base = { tags: ['a', 'b'] };
      const override = { tags: [] };
      const result = deepMerge(base, override);
      expect(result.tags).toEqual([]);
    });

    it('handles arrays of objects (replaces, not merges)', () => {
      const base = { servers: [{ host: 'a' }, { host: 'b' }] };
      const override = { servers: [{ host: 'x' }] };
      const result = deepMerge(base, override);
      expect(result.servers).toEqual([{ host: 'x' }]);
    });
  });

  describe('Null value handling', () => {
    it('null removes key from result', () => {
      const base = { port: 3000, host: 'localhost' };
      const override = { host: null };
      const result = deepMerge(base, override);
      expect(result.port).toBe(3000);
      expect(result).not.toHaveProperty('host');
    });

    it('null removes nested key', () => {
      const base = {
        database: {
          host: 'localhost',
          pool: 10,
        },
      };
      const override = {
        database: {
          pool: null,
        },
      };
      const result = deepMerge(base, override);
      expect(result.database).toEqual({ host: 'localhost' });
    });

    it('null removes entire object', () => {
      const base = {
        database: { host: 'localhost' },
        cache: { enabled: true },
      };
      const override = { database: null };
      const result = deepMerge(base, override);
      expect(result).not.toHaveProperty('database');
      expect(result.cache).toEqual({ enabled: true });
    });
  });

  describe('Edge cases', () => {
    it('handles empty base', () => {
      const base = {};
      const override = { port: 3000 };
      const result = deepMerge(base, override);
      expect(result).toEqual({ port: 3000 });
    });

    it('handles empty override', () => {
      const base = { port: 3000 };
      const override = {};
      const result = deepMerge(base, override);
      expect(result).toEqual({ port: 3000 });
    });

    it('handles both empty', () => {
      const base = {};
      const override = {};
      const result = deepMerge(base, override);
      expect(result).toEqual({});
    });

    it('does not mutate base object', () => {
      const base = { port: 3000, database: { host: 'localhost' } };
      const baseCopy = JSON.parse(JSON.stringify(base));
      const override = { port: 8080, database: { host: 'remote' } };
      deepMerge(base, override);
      expect(base).toEqual(baseCopy);
    });

    it('does not mutate override object', () => {
      const base = { port: 3000 };
      const override = { port: 8080 };
      const overrideCopy = JSON.parse(JSON.stringify(override));
      deepMerge(base, override);
      expect(override).toEqual(overrideCopy);
    });
  });

  describe('Real-world config scenarios', () => {
    it('merges server config like the plan example', () => {
      const defaultConfig = {
        'server-task-service': {
          port: 3000,
          database: {
            host: 'db.internal',
            pool: 10,
          },
        },
      };
      const localConfig = {
        'server-task-service': {
          database: {
            host: 'localhost',
          },
        },
      };
      const result = deepMerge(defaultConfig, localConfig);
      expect(result['server-task-service']).toEqual({
        port: 3000,
        database: {
          host: 'localhost',
          pool: 10,
        },
      });
    });

    it('handles multiple components', () => {
      const defaultConfig = {
        'server-api': { port: 3000 },
        'server-worker': { concurrency: 5 },
        'webapp-admin': { apiUrl: '/api' },
      };
      const localConfig = {
        'server-api': { port: 8080 },
        'webapp-admin': { apiUrl: 'http://localhost:3000/api' },
      };
      const result = deepMerge(defaultConfig, localConfig);
      expect(result).toEqual({
        'server-api': { port: 8080 },
        'server-worker': { concurrency: 5 },
        'webapp-admin': { apiUrl: 'http://localhost:3000/api' },
      });
    });

    it('handles production overrides with secrets', () => {
      const defaultConfig = {
        database: {
          host: 'localhost',
          port: 5432,
          user: 'dev',
          passwordSecret: 'dev-password',
        },
      };
      const productionConfig = {
        database: {
          host: 'db.production.internal',
          user: 'app',
          passwordSecret: 'prod-db-credentials',
        },
      };
      const result = deepMerge(defaultConfig, productionConfig);
      expect(result.database).toEqual({
        host: 'db.production.internal',
        port: 5432,
        user: 'app',
        passwordSecret: 'prod-db-credentials',
      });
    });
  });
});
