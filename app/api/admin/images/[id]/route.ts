import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { deleteR2Object } from "@/lib/r2";
import { logAudit } from "@/lib/audit";

export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const imageId = parseInt(id);

  const rows = await sql`SELECT * FROM chapter_images WHERE id = ${imageId}`;
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await deleteR2Object(rows[0].object_key);
  } catch {}

  await sql`DELETE FROM chapter_images WHERE id = ${imageId}`;
  await logAudit({ userEmail: session!.email, action: "delete_image", entityType: "chapter_image", entityId: imageId });
  return NextResponse.json({ success: true });
}
