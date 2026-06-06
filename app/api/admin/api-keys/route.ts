import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { generateApiKey } from "@/lib/api-key";
import { logAudit } from "@/lib/audit";
import {
  apiKeysHaveScopeColumn,
  COMIC_SCOPES,
  normalizeComicScope,
} from "@/lib/comic-scope";
import { z } from "zod";

export const dynamic = 'force-dynamic';

type ApiKeyRow = Record<string, unknown>;

function asRows(rows: unknown): ApiKeyRow[] {
  return rows as ApiKeyRow[];
}

const schema = z.object({
  name: z.string().min(1).max(255),
  scope: z.enum(COMIC_SCOPES).default("all"),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const hasScopeColumn = await apiKeysHaveScopeColumn();
  const rawRows = hasScopeColumn
    ? await sql`
        SELECT id, name, key_prefix, is_active, last_used_at, created_at, scope
        FROM api_keys
        ORDER BY created_at DESC
      `
    : await sql`
        SELECT id, name, key_prefix, is_active, last_used_at, created_at
        FROM api_keys
        ORDER BY created_at DESC
      `;
  const rows = asRows(rawRows);

  return NextResponse.json({
    scopePersistenceAvailable: hasScopeColumn,
    apiKeys: rows.map((row) => ({
      ...row,
      scope: normalizeComicScope(row.scope),
    })),
  });
}

export async function POST(request: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { raw, hash, prefix } = generateApiKey();
  const hasScopeColumn = await apiKeysHaveScopeColumn();

  const rawResult = hasScopeColumn
    ? await sql`
        INSERT INTO api_keys (name, key_hash, key_prefix, scope)
        VALUES (${parsed.data.name}, ${hash}, ${prefix}, ${parsed.data.scope})
        RETURNING id, name, key_prefix, is_active, created_at, scope
      `
    : await sql`
        INSERT INTO api_keys (name, key_hash, key_prefix)
        VALUES (${parsed.data.name}, ${hash}, ${prefix})
        RETURNING id, name, key_prefix, is_active, created_at
      `;
  const result = asRows(rawResult);

  await logAudit({
    userEmail: session!.email,
    action: "create_api_key",
    entityType: "api_key",
    entityId: result[0].id as string | number,
  });

  return NextResponse.json(
    {
      ...result[0],
      scope: normalizeComicScope(result[0].scope),
      scopePersisted: hasScopeColumn,
      key: raw,
    },
    { status: 201 }
  );
}
