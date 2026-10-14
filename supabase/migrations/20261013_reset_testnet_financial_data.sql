-- ==============================================================================
-- Migration: 20261013_reset_testnet_financial_data.sql
-- Purpose: Scoped reset of stale dollar-denominated test financial records
-- Author: Senior Architect
-- Date: 2026-10-13
--
-- AUTHORIZATION & SAFETY NOTE:
-- DO NOT EXECUTE THIS SCRIPT DIRECTLY AGAINST REMOTE OR PRODUCTION DATABASES
-- WITHOUT EXPLICIT OPERATOR APPROVAL AND A RECENT BACKUP.
--
-- PRESERVED DATA:
--   ✓ users (profiles, handles, Privy auth identities, avatars)
--   ✓ parties (events, dates, locations, hosts, codes, cover images)
--   ✓ party_members (rosters, RSVP status, attendance)
--   ✓ crews & crew_members
--   ✓ invitations
--   ✓ polls & game_sessions
--   ✓ party_memories (photos, albums)
--   ✓ social_follows
--
-- SCOPED RESET TARGETS:
--   ✗ expenses (stale dollar split debts and unpersisted custom weights)
--   ✗ pot_transactions (stale simulated USDC / dollar transactions)
--   ✗ parties.pot_balance (reset to 0.0000; will reflect true verified onchain MON deposits)
--   ✗ activities of type 'expense' and 'pot'
-- ==============================================================================

BEGIN;

-- 1. Backup verification advisory
-- Run before applying:
-- pg_dump --data-only -t expenses -t pot_transactions -t activities > backup_financial_pre_reset.sql

-- 2. Clear stale test expenses
DELETE FROM expenses;

-- 3. Clear stale pot transactions
DELETE FROM pot_transactions;

-- 4. Reset party pot balances to zero native MON
UPDATE parties
SET pot_balance = 0.0000;

-- 5. Clear stale financial activity feeds (retaining social, RSVP, and game activities)
DELETE FROM activities
WHERE type IN ('expense', 'pot');

-- 6. Verify table invariants
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM expenses LIMIT 1) THEN
    RAISE EXCEPTION 'Reset failed: expenses table is not empty.';
  END IF;

  IF EXISTS (SELECT 1 FROM pot_transactions LIMIT 1) THEN
    RAISE EXCEPTION 'Reset failed: pot_transactions table is not empty.';
  END IF;

  IF EXISTS (SELECT 1 FROM parties WHERE pot_balance != 0 LIMIT 1) THEN
    RAISE EXCEPTION 'Reset failed: one or more parties have non-zero pot_balance.';
  END IF;
END $$;

COMMIT;
