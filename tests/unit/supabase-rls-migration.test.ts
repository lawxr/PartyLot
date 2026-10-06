import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('MKT-02c: Deny-by-default client-access migration', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/20261006_pr08_deny_by_default_client_access.sql'
  );

  it('migration file exists in supabase/migrations/', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  const privateTables = [
    'parties',
    'party_members',
    'invitations',
    'expenses',
    'pot_transactions',
    'tasks',
    'polls',
    'activities',
    'party_memories',
    'game_sessions',
    'crews',
    'crew_members',
  ];

  it('covers all 12 private business tables with RLS and restrictive deny policy', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    for (const table of privateTables) {
      expect(sql).toContain(`'${table}'`);
    }

    expect(sql).toContain('ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('FORCE ROW LEVEL SECURITY');
    expect(sql).toContain('AS RESTRICTIVE FOR ALL TO anon, authenticated');
    expect(sql).toContain('USING (false) WITH CHECK (false)');
  });

  it('revokes direct table permissions from client roles (anon, authenticated)', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('REVOKE ALL ON TABLE');
    expect(sql).toContain('FROM anon, authenticated');
  });

  it('drops all historical permissive policies idempotently', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('Public read parties');
    expect(sql).toContain('Public read party_members');
    expect(sql).toContain('Public read expenses');
    expect(sql).toContain('Public read tasks');
    expect(sql).toContain('Public read polls');
    expect(sql).toContain('Public read crews');
    expect(sql).toContain('Public read crew_members');
    expect(sql).toContain('Allow all read on activities');
    expect(sql).toContain('Allow all read on party_memories');
    expect(sql).toContain('Allow all read on game_sessions');
    expect(sql).toContain('Allow all read on pot_transactions');
    expect(sql).toContain('Allow all read on invitations');
  });

  it('locks down security definer RPCs to service_role only', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('validate_invite_code');
    expect(sql).toContain('join_party_with_invite');
    expect(sql).toContain('update_user_profile');
    expect(sql).toContain('REVOKE EXECUTE ON FUNCTION');
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION');
    expect(sql).toContain('TO service_role');
  });
});
