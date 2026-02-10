-- Add missing cover columns to comics table (safe to run multiple times)

ALTER TABLE comics
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_object_key TEXT;

