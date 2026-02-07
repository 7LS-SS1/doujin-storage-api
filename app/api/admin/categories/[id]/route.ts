import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await request.json();
  const result = await sql`
    UPDATE categories SET name = ${body.name}, slug = ${body.slug} WHERE id = ${parseInt(id)} RETURNING *
  `;
  if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await logAudit({ userEmail: session!.email, action: "update_category", entityType: "category", entityId: parseInt(id) });
  return NextResponse.json(result[0]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  await sql`DELETE FROM categories WHERE id = ${parseInt(id)}`;
  await logAudit({ userEmail: session!.email, action: "delete_category", entityType: "category", entityId: parseInt(id) });
  return NextResponse.json({ success: true });
}
