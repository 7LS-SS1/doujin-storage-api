-- ============================================================
-- Migration: Analytics Events + Comic Reactions
-- Date: 2026-02-23
-- Run once against the Neon PostgreSQL database.
-- ============================================================

-- ── analytics_events ─────────────────────────────────────────
-- Stores every reader interaction event.
-- Not linked to comics/chapters with FK to allow orphaned records
-- when content is deleted (analytics data should be preserved).
CREATE TABLE IF NOT EXISTS analytics_events (
    id            BIGSERIAL PRIMARY KEY,
    event_type    VARCHAR(50)  NOT NULL,   -- page_view | hero_click | card_click | read_click | reaction_click
    comic_id      INTEGER,                 -- nullable: some events may not be comic-specific
    chapter_id    INTEGER,                 -- nullable
    session_id    VARCHAR(100) NOT NULL,   -- anonymous UUID from localStorage
    source_position SMALLINT,             -- position in list (0-indexed)
    device        VARCHAR(20),             -- desktop | tablet | mobile
    extra         JSONB,                   -- future extensibility
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ae_comic_id    ON analytics_events (comic_id);
CREATE INDEX IF NOT EXISTS idx_ae_event_type  ON analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_ae_created_at  ON analytics_events (created_at);
CREATE INDEX IF NOT EXISTS idx_ae_session_id  ON analytics_events (session_id);

-- ── comic_reactions ───────────────────────────────────────────
-- One row per (comic, session). UPSERT on change.
-- reaction_type: like | love | heart | bad
CREATE TABLE IF NOT EXISTS comic_reactions (
    id            BIGSERIAL PRIMARY KEY,
    comic_id      INTEGER      NOT NULL,
    session_id    VARCHAR(100) NOT NULL,
    reaction_type VARCHAR(20)  NOT NULL CHECK (reaction_type IN ('like', 'love', 'heart', 'bad')),
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (comic_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_cr_comic_id ON comic_reactions (comic_id);
