import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await request.json();
  const isActive = body.isActive !== undefined ? body.isActive : true;

  const result = await sql`
    UPDATE api_keys SET is_active = ${isActive} WHERE id = ${id} RETURNING id, name, key_prefix, is_active
  `;
  if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await logAudit({ userEmail: session!.email, action: isActive ? "activate_api_key" : "revoke_api_key", entityType: "api_key", entityId: id });
  return NextResponse.json(result[0]);
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
