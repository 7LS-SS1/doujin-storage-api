import { randomUUID } from "crypto";
import { sql } from "./db";

export const SYNC_QUEUE_MODES = ["incremental", "full"] as const;
export type SyncQueueMode = (typeof SYNC_QUEUE_MODES)[number];

export const SYNC_QUEUE_ACTIONS = ["acquire", "heartbeat", "release"] as const;
export type SyncQueueAction = (typeof SYNC_QUEUE_ACTIONS)[number];

export const MAX_ACTIVE_SYNC_SITES = 20;
export const SYNC_QUEUE_RETRY_AFTER_SECONDS = 3;

const QUEUED_LEASE_TTL_SECONDS = 75;
const ACTIVE_LEASE_TTL_SECONDS: Record<SyncQueueMode, number> = {
  incremental: 5 * 60,
  full: 15 * 60,
};

type SyncLeaseRow = {
  id: number | string;
  client_id: number | string;
  client_name: string | null;
  site_url: string | null;
  mode: SyncQueueMode;
  status: "queued" | "active";
  lease_token: string;
  created_at: string;
  started_at: string | null;
  lease_expires_at: string;
  released_at: string | null;
};

function asRows(rows: unknown): Record<string, unknown>[] {
  return rows as Record<string, unknown>[];
}

export type SyncQueueStatus =
  | {
      acquired: true;
      activeCount: number;
      leaseToken: string;
      maxConcurrent: number;
      message: string;
      mode: SyncQueueMode;
      queuePosition: 0;
      retryAfterSeconds: number;
    }
  | {
      acquired: false;
      activeCount: number;
      leaseToken: string;
      maxConcurrent: number;
      message: string;
      mode: SyncQueueMode;
      queuePosition: number;
      retryAfterSeconds: number;
    };

function isUniqueViolation(error: unknown): error is { code: string } {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
  );
}

function normalizeSyncLeaseRow(row: Record<string, unknown>): SyncLeaseRow {
  return {
    id: row.id as number | string,
    client_id: row.client_id as number | string,
    client_name: (row.client_name as string | null | undefined) ?? null,
    site_url: (row.site_url as string | null | undefined) ?? null,
    mode: row.mode as SyncQueueMode,
    status: row.status as "queued" | "active",
    lease_token: String(row.lease_token),
    created_at: String(row.created_at),
    started_at: (row.started_at as string | null | undefined) ?? null,
    lease_expires_at: String(row.lease_expires_at),
    released_at: (row.released_at as string | null | undefined) ?? null,
  };
}

function getLeaseTtlSeconds(
  mode: SyncQueueMode,
  status: SyncLeaseRow["status"]
): number {
  return status === "active"
    ? ACTIVE_LEASE_TTL_SECONDS[mode]
    : QUEUED_LEASE_TTL_SECONDS;
}

async function cleanupExpiredSyncLeases(): Promise<void> {
  await sql`
    UPDATE sync_queue_leases
    SET released_at = COALESCE(released_at, NOW()),
        release_reason = CASE
          WHEN released_at IS NULL THEN 'expired'
          ELSE release_reason
        END,
        updated_at = NOW()
    WHERE released_at IS NULL
      AND lease_expires_at <= NOW()
  `;
}

async function getOpenLeaseByToken(
  clientId: number,
  leaseToken: string
): Promise<SyncLeaseRow | null> {
  const rows = await sql`
    SELECT id, client_id, client_name, site_url, mode, status, lease_token,
      created_at, started_at, lease_expires_at, released_at
    FROM sync_queue_leases
    WHERE client_id = ${clientId}
      AND lease_token = ${leaseToken}
      AND released_at IS NULL
    LIMIT 1
  `;

  const list = asRows(rows);
  if (list.length === 0) return null;
  return normalizeSyncLeaseRow(list[0]);
}

async function getOpenLeaseByClientId(
  clientId: number
): Promise<SyncLeaseRow | null> {
  const rows = await sql`
    SELECT id, client_id, client_name, site_url, mode, status, lease_token,
      created_at, started_at, lease_expires_at, released_at
    FROM sync_queue_leases
    WHERE client_id = ${clientId}
      AND released_at IS NULL
    ORDER BY created_at DESC, id DESC
    LIMIT 1
  `;

  const list = asRows(rows);
  if (list.length === 0) return null;
  return normalizeSyncLeaseRow(list[0]);
}

async function insertQueuedLease(params: {
  clientId: number;
  clientName: string;
  mode: SyncQueueMode;
  siteUrl?: string | null;
}): Promise<SyncLeaseRow> {
  const leaseToken = randomUUID();

  try {
    const rows = await sql`
      INSERT INTO sync_queue_leases (
        client_id,
        client_name,
        site_url,
        mode,
        status,
        lease_token,
        lease_expires_at
      )
      VALUES (
        ${params.clientId},
        ${params.clientName},
        ${params.siteUrl ?? null},
        ${params.mode},
        'queued',
        ${leaseToken},
        NOW() + (${QUEUED_LEASE_TTL_SECONDS} * INTERVAL '1 second')
      )
      RETURNING id, client_id, client_name, site_url, mode, status, lease_token,
        created_at, started_at, lease_expires_at, released_at
    `;

    return normalizeSyncLeaseRow(asRows(rows)[0]);
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }

    const existing = await getOpenLeaseByClientId(params.clientId);
    if (!existing) throw error;
    return existing;
  }
}

async function extendLease(
  lease: SyncLeaseRow,
  clientName: string,
  mode: SyncQueueMode,
  status: SyncLeaseRow["status"],
  siteUrl?: string | null
): Promise<SyncLeaseRow | null> {
  const ttlSeconds = getLeaseTtlSeconds(mode, status);
  const rows = await sql`
    UPDATE sync_queue_leases
    SET mode = ${mode},
        status = ${status},
        site_url = COALESCE(${siteUrl ?? null}, site_url),
        client_name = COALESCE(${clientName}, client_name),
        started_at = CASE
          WHEN ${status} = 'active' THEN COALESCE(started_at, NOW())
          ELSE started_at
        END,
        lease_expires_at = NOW() + (${ttlSeconds} * INTERVAL '1 second'),
        updated_at = NOW()
    WHERE id = ${lease.id}
      AND released_at IS NULL
    RETURNING id, client_id, client_name, site_url, mode, status, lease_token,
      created_at, started_at, lease_expires_at, released_at
  `;

  const list = asRows(rows);
  if (list.length === 0) return null;
  return normalizeSyncLeaseRow(list[0]);
}

async function getActiveLeaseCount(): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM sync_queue_leases
    WHERE released_at IS NULL
      AND status = 'active'
  `;

  return Number(asRows(rows)[0]?.count ?? 0);
}

async function getQueuedPosition(lease: SyncLeaseRow): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM sync_queue_leases
    WHERE released_at IS NULL
      AND status = 'queued'
      AND (
        created_at < ${lease.created_at}
        OR (created_at = ${lease.created_at} AND id < ${lease.id})
      )
  `;

  return Number(asRows(rows)[0]?.count ?? 0) + 1;
}

async function tryPromoteQueuedLease(
  lease: SyncLeaseRow,
  mode: SyncQueueMode,
  activeCount: number,
  siteUrl?: string | null
): Promise<SyncLeaseRow | null> {
  const availableSlots = MAX_ACTIVE_SYNC_SITES - activeCount;
  if (availableSlots <= 0) return null;

  const queuePosition = await getQueuedPosition(lease);
  if (queuePosition > availableSlots) return null;

  return extendLease(lease, String(lease.client_name ?? ""), mode, "active", siteUrl);
}

function buildAcquiredStatus(
  lease: SyncLeaseRow,
  mode: SyncQueueMode,
  activeCount: number
): SyncQueueStatus {
  return {
    acquired: true,
    activeCount,
    leaseToken: lease.lease_token,
    maxConcurrent: MAX_ACTIVE_SYNC_SITES,
    message: `Sync slot acquired. ${activeCount}/${MAX_ACTIVE_SYNC_SITES} active site(s).`,
    mode,
    queuePosition: 0,
    retryAfterSeconds: SYNC_QUEUE_RETRY_AFTER_SECONDS,
  };
}

function buildQueuedStatus(
  lease: SyncLeaseRow,
  mode: SyncQueueMode,
  activeCount: number,
  queuePosition: number
): SyncQueueStatus {
  return {
    acquired: false,
    activeCount,
    leaseToken: lease.lease_token,
    maxConcurrent: MAX_ACTIVE_SYNC_SITES,
    message:
      activeCount >= MAX_ACTIVE_SYNC_SITES
        ? `All ${MAX_ACTIVE_SYNC_SITES} sync slots are busy. Queue position ${queuePosition}.`
        : `Waiting for earlier queued site(s). Queue position ${queuePosition}.`,
    mode,
    queuePosition,
    retryAfterSeconds: SYNC_QUEUE_RETRY_AFTER_SECONDS,
  };
}

export async function acquireOrHeartbeatSyncLease(params: {
  clientId: number;
  clientName: string;
  mode: SyncQueueMode;
  leaseToken?: string | null;
  siteUrl?: string | null;
}): Promise<SyncQueueStatus> {
  await cleanupExpiredSyncLeases();

  let lease =
    params.leaseToken?.trim()
      ? await getOpenLeaseByToken(params.clientId, params.leaseToken.trim())
      : await getOpenLeaseByClientId(params.clientId);

  if (!lease) {
    lease = await insertQueuedLease({
      clientId: params.clientId,
      clientName: params.clientName,
      mode: params.mode,
      siteUrl: params.siteUrl,
    });
  }

  if (lease.status === "active") {
    const refreshed =
      (await extendLease(
        lease,
        params.clientName,
        params.mode,
        "active",
        params.siteUrl
      )) ?? lease;
    const activeCount = await getActiveLeaseCount();
    return buildAcquiredStatus(refreshed, params.mode, activeCount);
  }

  const refreshedQueued =
    (await extendLease(
      lease,
      params.clientName,
      params.mode,
      "queued",
      params.siteUrl
    )) ?? lease;
  const activeCount = await getActiveLeaseCount();
  const promoted = await tryPromoteQueuedLease(
    refreshedQueued,
    params.mode,
    activeCount,
    params.siteUrl
  );

  if (promoted) {
    return buildAcquiredStatus(promoted, params.mode, activeCount + 1);
  }

  const queuePosition = await getQueuedPosition(refreshedQueued);
  return buildQueuedStatus(refreshedQueued, params.mode, activeCount, queuePosition);
}

export async function releaseSyncLease(params: {
  clientId: number;
  leaseToken?: string | null;
  releaseReason?: string;
}): Promise<{ released: boolean }> {
  await cleanupExpiredSyncLeases();

  const releaseReason = params.releaseReason?.trim() || "released";
  const rows =
    params.leaseToken?.trim()
      ? await sql`
          UPDATE sync_queue_leases
          SET released_at = NOW(),
              release_reason = ${releaseReason},
              updated_at = NOW()
          WHERE client_id = ${params.clientId}
            AND lease_token = ${params.leaseToken.trim()}
            AND released_at IS NULL
          RETURNING id
        `
      : await sql`
          UPDATE sync_queue_leases
          SET released_at = NOW(),
              release_reason = ${releaseReason},
              updated_at = NOW()
          WHERE client_id = ${params.clientId}
            AND released_at IS NULL
          RETURNING id
        `;

  return { released: asRows(rows).length > 0 };
}
