ALTER TABLE comics
  ADD COLUMN IF NOT EXISTS comic_type VARCHAR(20);

UPDATE comics
SET comic_type = 'manga'
WHERE comic_type IS NULL;

ALTER TABLE comics
  ALTER COLUMN comic_type SET DEFAULT 'manga';

ALTER TABLE comics
  ALTER COLUMN comic_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'comics_comic_type_check'
  ) THEN
    ALTER TABLE comics
      ADD CONSTRAINT comics_comic_type_check
      CHECK (comic_type IN ('manga', 'doujin'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_comics_comic_type ON comics(comic_type);

ALTER TABLE api_keys
  ADD COLUMN IF NOT EXISTS scope VARCHAR(20);

UPDATE api_keys
SET scope = 'all'
WHERE scope IS NULL;

ALTER TABLE api_keys
  ALTER COLUMN scope SET DEFAULT 'all';

ALTER TABLE api_keys
  ALTER COLUMN scope SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'api_keys_scope_check'
  ) THEN
    ALTER TABLE api_keys
      ADD CONSTRAINT api_keys_scope_check
      CHECK (scope IN ('all', 'manga', 'doujin'));
  END IF;
END $$;
