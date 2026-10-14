-- Migration: Additive voluntary Pot configuration (goal and organizer message)
-- Safe, additive migration without dropping or altering existing records.

ALTER TABLE parties
  ADD COLUMN IF NOT EXISTS pot_goal NUMERIC(12, 4) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pot_message TEXT DEFAULT NULL;

COMMENT ON COLUMN parties.pot_goal IS 'Voluntary funding target in native MON (does not gate attendance)';
COMMENT ON COLUMN parties.pot_message IS 'Optional organizer message or purpose for the voluntary party pot';
