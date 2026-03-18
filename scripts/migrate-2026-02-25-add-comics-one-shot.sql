-- Add one-shot flag to comics so WordPress can open reader directly.
-- Safe to run multiple times.

ALTER TABLE comics
  ADD COLUMN IF NOT EXISTS is_one_shot BOOLEAN NOT NULL DEFAULT FALSE;
