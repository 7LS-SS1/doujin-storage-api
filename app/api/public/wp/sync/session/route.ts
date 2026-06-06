import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiKey } from "@/lib/public-guard";
import {
  acquireOrHeartbeatSyncLease,
  releaseSyncLease,
  SYNC_QUEUE_ACTIONS,
  SYNC_QUEUE_MODES,
} from "@/lib/sync-queue";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  action: z.enum(SYNC_QUEUE_ACTIONS).default("acquire"),
  leaseToken: z.preprocess(
    (value) => {
      if (value === null || value === undefined) return undefined;
      if (typeof value === "string" && value.trim() === "") return undefined;
      return value;
    },
    z.string().trim().min(1).max(128).optional()
  ),
  mode: z.enum(SYNC_QUEUE_MODES).default("incremental"),
  siteUrl: z.preprocess(
    (value) => {
      if (value === null || value === undefined) return undefined;
      if (typeof value === "string" && value.trim() === "") return undefined;
      return value;
    },
    z.string().trim().max(500).optional()
  ),
});

export async function POST(request: Request) {
  const { error, client } = await requireApiKey(request);
  if (error || !client) return error;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sync session payload." }, { status: 400 });
  }

  if (parsed.data.action === "release") {
    const result = await releaseSyncLease({
      clientId: Number(client.id),
      leaseToken: parsed.data.leaseToken,
      releaseReason: "released",
    });

    return NextResponse.json({
      released: result.released,
      leaseToken: parsed.data.leaseToken ?? null,
    });
  }

  const result = await acquireOrHeartbeatSyncLease({
    clientId: Number(client.id),
    clientName: client.name,
    leaseToken: parsed.data.leaseToken,
    mode: parsed.data.mode,
    siteUrl: parsed.data.siteUrl || null,
  });

  return NextResponse.json(result);
}
