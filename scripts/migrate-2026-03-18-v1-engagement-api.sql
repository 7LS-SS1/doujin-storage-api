-- ============================================================
-- Migration: API v1 engagement endpoints
-- Date: 2026-03-18
-- Ensures chapter view events and comic likes tables exist
-- for /api/v1/events/view and /api/v1/comics/:id/likes
-- ============================================================

CREATE TABLE IF NOT EXISTS chapter_view_events (
    id               BIGSERIAL PRIMARY KEY,
    event_type       VARCHAR(50)  NOT NULL DEFAULT 'chapter_view',
    comic_id         TEXT         NOT NULL,
    chapter_id       TEXT         NOT NULL,
    user_id          VARCHAR(255),
    anon_id          VARCHAR(255),
    session_id       VARCHAR(100),
    dedupe_key       VARCHAR(255) NOT NULL,
    source           VARCHAR(100),
    referrer         TEXT,
    locale           VARCHAR(20),
    device           VARCHAR(20),
    client_ts        TIMESTAMPTZ,
    counted          BOOLEAN      NOT NULL DEFAULT TRUE,
    duplicate_reason VARCHAR(50),
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cve_comic_id
    ON chapter_view_events (comic_id);
CREATE INDEX IF NOT EXISTS idx_cve_chapter_id
    ON chapter_view_events (chapter_id);
CREATE INDEX IF NOT EXISTS idx_cve_created_at
    ON chapter_view_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cve_dedupe_recent
    ON chapter_view_events (chapter_id, dedupe_key, created_at DESC);

CREATE TABLE IF NOT EXISTS comic_likes (
    id         BIGSERIAL PRIMARY KEY,
    comic_id   TEXT         NOT NULL,
    user_id    VARCHAR(255) NOT NULL,
    source     VARCHAR(100),
    client_ts  TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (comic_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_cl_comic_id
    ON comic_likes (comic_id);
CREATE INDEX IF NOT EXISTS idx_cl_user_id
    ON comic_likes (user_id);
