import fs from 'node:fs';
import path from 'node:path';

describe('migration history regression', () => {
  test('NotificationPreference has a single table-creation migration', () => {
    const root = path.join(process.cwd(), 'prisma', 'migrations');
    const createMigrations = fs.readdirSync(root)
      .filter(name => name !== 'migration_lock.toml')
      .filter(name => {
        const migrationPath = path.join(root, name, 'migration.sql');
        return fs.existsSync(migrationPath) && /CREATE TABLE "NotificationPreference"/.test(fs.readFileSync(migrationPath, 'utf8'));
      });
    expect(createMigrations).toEqual(['20250315111500_add_notification_preference_and_dispute']);
  });
  test('phone verification migration adds explicit expiry and attempt-limit columns', () => {
    const sql = fs.readFileSync(path.join(process.cwd(), 'prisma/migrations/20261010114500_phone_otp_guards/migration.sql'), 'utf8');
    expect(sql).toContain('"phoneVerificationExpiresAt"');
    expect(sql).toContain('"phoneVerificationAttempts"');
  });
});
