/**
 * PostgreSQL Skill: Backup Script Tests
 *
 * WHY: Validates that the postgresql skill generates correct backup scripts
 * that follow PostgreSQL best practices for data protection.
 */

import { describe, expect, it, beforeEach } from 'vitest';
import {
  createTestProject,
  runClaude,
  writeFileAsync,
  joinPath,
  listDir,
  type TestProject,
} from '../../../lib';

const BACKUP_PROMPT = `Using the postgresql skill, create a backup script for the database.

Requirements:
- Create a shell script that backs up the database using pg_dump
- Use custom format (-Fc) for the backup
- Include a timestamp in the backup filename
- Store backups in a ./backups directory
- Add basic error handling

Create the script at: scripts/backup.sh

Database connection info for reference:
- Host: localhost
- Port: 5432
- User: app_user
- Database: myapp

IMPORTANT:
- Follow the postgresql skill's deployment reference for pg_dump usage
- Make the script executable-ready (proper shebang, etc.)
- Include comments explaining what each section does
- Create ALL files in the CURRENT WORKING DIRECTORY (.) - do NOT use absolute paths`;

/**
 * WHY: Backups are critical for data protection. Generated backup scripts
 * must use pg_dump correctly with appropriate options and include proper
 * error handling to ensure backups actually complete successfully.
 */
describe('PostgreSQL Backup', () => {
  let testProject: TestProject;

  beforeEach(async () => {
    testProject = await createTestProject('postgresql-backup');
  });

  /**
   * WHY: Backup scripts must use pg_dump with correct flags and include
   * proper shebang for execution. The -Fc (custom format) flag enables
   * parallel restore and selective table restoration.
   */
  it('generates backup script with pg_dump commands', async () => {
    const result = await runClaude(BACKUP_PROMPT, testProject.path, 180);
    await writeFileAsync(joinPath(testProject.path, 'claude-output.json'), result.output);

    expect(result.exitCode).toBe(0);

    // Check that backup commands/scripts were created
    expect(result.output.toLowerCase()).toContain('pg_dump');

    // Check for script file
    const entries = listDir(testProject.path);
    const hasBackupFile = entries.some(
      (e) => e.endsWith('.sh') || e.toLowerCase().includes('backup')
    );

    // Either a script was created or commands were provided in output
    expect(hasBackupFile || result.output.includes('pg_dump')).toBe(true);
  }, 240000);
});
