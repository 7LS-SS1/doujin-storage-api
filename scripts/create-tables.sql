-- Comic Storage API - Database Schema

CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS series (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comics (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  alt_titles JSONB DEFAULT '[]',
  description TEXT,
  author_name VARCHAR(255),
  comic_type VARCHAR(20) NOT NULL DEFAULT 'manga' CHECK (comic_type IN ('manga', 'doujin')),
  status VARCHAR(50) DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'hiatus')),
  is_one_shot BOOLEAN NOT NULL DEFAULT FALSE,
  cover_image_url TEXT,
  cover_object_key TEXT,
  series_id INTEGER REFERENCES series(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  comic_id INTEGER NOT NULL REFERENCES comics(id) ON DELETE CASCADE,
  number VARCHAR(50) NOT NULL,
  title VARCHAR(500),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chapter_images (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  object_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comic_categories (
  comic_id INTEGER NOT NULL REFERENCES comics(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (comic_id, category_id)
);

CREATE TABLE IF NOT EXISTS comic_tags (
  comic_id INTEGER NOT NULL REFERENCES comics(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (comic_id, tag_id)
);

CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(10) NOT NULL,
  scope VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (scope IN ('all', 'manga', 'doujin')),
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INTEGER,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  comic_id INTEGER,
  chapter_id INTEGER,
  session_id VARCHAR(100) NOT NULL,
  source_position SMALLINT,
  device VARCHAR(20),
  extra JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comic_reactions (
  id BIGSERIAL PRIMARY KEY,
  comic_id INTEGER NOT NULL REFERENCES comics(id) ON DELETE CASCADE,
  session_id VARCHAR(100) NOT NULL,
  reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'heart', 'bad')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (comic_id, session_id)
);

CREATE TABLE IF NOT EXISTS chapter_view_events (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL DEFAULT 'chapter_view',
  comic_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  user_id VARCHAR(255),
  anon_id VARCHAR(255),
  session_id VARCHAR(100),
  dedupe_key VARCHAR(255) NOT NULL,
  source VARCHAR(100),
  referrer TEXT,
  locale VARCHAR(20),
  device VARCHAR(20),
  client_ts TIMESTAMPTZ,
  counted BOOLEAN NOT NULL DEFAULT TRUE,
  duplicate_reason VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comic_likes (
  id BIGSERIAL PRIMARY KEY,
  comic_id TEXT NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  source VARCHAR(100),
  client_ts TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (comic_id, user_id)
);

CREATE TABLE IF NOT EXISTS sync_queue_leases (
  id BIGSERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  client_name VARCHAR(255),
  site_url TEXT,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('incremental', 'full')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('queued', 'active')),
  lease_token UUID NOT NULL UNIQUE,
  started_at TIMESTAMPTZ,
  lease_expires_at TIMESTAMPTZ NOT NULL,
  released_at TIMESTAMPTZ,
  release_reason VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comics_slug ON comics(slug);
CREATE INDEX IF NOT EXISTS idx_comics_comic_type ON comics(comic_type);
CREATE INDEX IF NOT EXISTS idx_comics_series_id ON comics(series_id);
CREATE INDEX IF NOT EXISTS idx_comics_status ON comics(status);
CREATE INDEX IF NOT EXISTS idx_chapters_comic_id ON chapters(comic_id);
CREATE INDEX IF NOT EXISTS idx_chapters_number ON chapters(number);
CREATE INDEX IF NOT EXISTS idx_chapter_images_chapter_id ON chapter_images(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_images_sort_order ON chapter_images(sort_order);
CREATE INDEX IF NOT EXISTS idx_series_slug ON series(slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_comic_id ON analytics_events(comic_id);
CREATE INDEX IF NOT EXISTS idx_ae_chapter_id ON analytics_events(chapter_id);
CREATE INDEX IF NOT EXISTS idx_ae_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_ae_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_ae_event_chapter_created_at ON analytics_events(event_type, chapter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_event_comic_created_at ON analytics_events(event_type, comic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cr_comic_id ON comic_reactions(comic_id);
CREATE INDEX IF NOT EXISTS idx_cve_comic_id ON chapter_view_events(comic_id);
CREATE INDEX IF NOT EXISTS idx_cve_chapter_id ON chapter_view_events(chapter_id);
CREATE INDEX IF NOT EXISTS idx_cve_created_at ON chapter_view_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cve_dedupe_recent ON chapter_view_events(chapter_id, dedupe_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cl_comic_id ON comic_likes(comic_id);
CREATE INDEX IF NOT EXISTS idx_cl_user_id ON comic_likes(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_queue_leases_client_open
  ON sync_queue_leases(client_id)
  WHERE released_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sync_queue_leases_status_created_at
  ON sync_queue_leases(status, created_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_leases_expires_at
  ON sync_queue_leases(lease_expires_at);
