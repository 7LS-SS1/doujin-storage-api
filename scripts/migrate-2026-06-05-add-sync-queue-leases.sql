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

CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_queue_leases_client_open
  ON sync_queue_leases(client_id)
  WHERE released_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sync_queue_leases_status_created_at
  ON sync_queue_leases(status, created_at);

CREATE INDEX IF NOT EXISTS idx_sync_queue_leases_expires_at
  ON sync_queue_leases(lease_expires_at);
