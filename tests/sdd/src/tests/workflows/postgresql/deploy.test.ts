/**
 * PostgreSQL Skill: Docker Deployment Tests
 *
 * WHY: Validates that the postgresql skill generates correct Docker deployment
 * configurations. Developers need reliable docker-compose files to spin up
 * PostgreSQL for local development.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import {
  createTestProject,
  runClaude,
  writeFileAsync,
  joinPath,
  statAsync,
  readFileAsync,
  type TestProject,
} from '../../../lib';

const DEPLOY_DOCKER_PROMPT = `Using the postgresql skill, create a Docker Compose configuration for local PostgreSQL development.

Requirements:
- PostgreSQL 16 image
- Database name: myapp
- User: app_user
- Password: dev_password
- Expose port 5432
- Persistent volume for data
- Health check using pg_isready

Create the docker-compose.yml file in the current directory.

IMPORTANT:
- Use the postgresql skill's deployment reference for best practices
- Include health check configuration
- Make it suitable for local development
- Create ALL files in the CURRENT WORKING DIRECTORY (.) - do NOT use absolute paths`;

/**
 * WHY: Docker deployment is the most common way to run PostgreSQL locally.
 * If the generated docker-compose.yml is malformed, developers can't start
 * their database and all development grinds to a halt.
 */
describe('PostgreSQL Docker Deployment', () => {
  let testProject: TestProject;

  beforeEach(async () => {
    testProject = await createTestProject('postgresql-deploy');
  });

  /**
   * WHY: docker-compose.yml is the standard way to define PostgreSQL services.
   * The file must contain correct image reference, port mappings, and
   * environment variables for the database to start correctly.
   */
  it('generates Docker Compose deployment configuration', async () => {
    const result = await runClaude(DEPLOY_DOCKER_PROMPT, testProject.path, 180);
    await writeFileAsync(joinPath(testProject.path, 'claude-output.json'), result.output);

    expect(result.exitCode).toBe(0);

    // Check that deployment files were created
    const composeYml = joinPath(testProject.path, 'docker-compose.yml');
    const composeYaml = joinPath(testProject.path, 'docker-compose.yaml');

    const ymlStat = await statAsync(composeYml);
    const yamlStat = await statAsync(composeYaml);

    expect(ymlStat?.isFile() || yamlStat?.isFile()).toBe(true);

    // Verify docker-compose content
    const composeFile = ymlStat?.isFile() ? composeYml : composeYaml;
    const content = await readFileAsync(composeFile);
    expect(content.toLowerCase()).toContain('postgres');
    expect(content).toContain('5432');
    expect(content).toContain('POSTGRES_');
  }, 240000);
});
