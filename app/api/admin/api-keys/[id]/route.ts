import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
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

const updateSchema = z.object({
  isActive: z.boolean().optional(),
  scope: z.enum(COMIC_SCOPES).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const hasScopeColumn = await apiKeysHaveScopeColumn();
  const rawExisting = hasScopeColumn
    ? await sql`
        SELECT id, name, key_prefix, is_active, scope
        FROM api_keys
        WHERE id = ${id}
        LIMIT 1
      `
    : await sql`
        SELECT id, name, key_prefix, is_active
        FROM api_keys
        WHERE id = ${id}
        LIMIT 1
      `;
  const existing = asRows(rawExisting);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isActive =
    parsed.data.isActive !== undefined
      ? parsed.data.isActive
      : Boolean(existing[0].is_active);
  const scope =
    parsed.data.scope !== undefined
      ? parsed.data.scope
      : normalizeComicScope(existing[0].scope);

  const rawResult = hasScopeColumn
    ? await sql`
        UPDATE api_keys
        SET is_active = ${isActive}, scope = ${scope}
        WHERE id = ${id}
        RETURNING id, name, key_prefix, is_active, scope
      `
    : await sql`
        UPDATE api_keys
        SET is_active = ${isActive}
        WHERE id = ${id}
        RETURNING id, name, key_prefix, is_active
      `;
  const result = asRows(rawResult);

  await logAudit({ userEmail: session!.email, action: isActive ? "activate_api_key" : "revoke_api_key", entityType: "api_key", entityId: id });

  return NextResponse.json({
    ...result[0],
    scope: normalizeComicScope(result[0].scope),
    scopePersisted: hasScopeColumn,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  await sql`DELETE FROM api_keys WHERE id = ${id}`;
  await logAudit({ userEmail: session!.email, action: "delete_api_key", entityType: "api_key", entityId: id });
  return NextResponse.json({ success: true });
}
