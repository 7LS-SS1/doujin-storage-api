-- Add missing audit log columns (safe to run multiple times)

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS entity_id INTEGER,
  ADD COLUMN IF NOT EXISTS details JSONB;

