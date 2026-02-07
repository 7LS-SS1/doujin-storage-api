import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { deleteR2Object } from "@/lib/r2";
import { z } from "zod";

const updateSchema = z.object({
  number: z.string().optional(),
  title: z.string().optional().nullable(),
  publishedAt: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const rows = await sql`
    SELECT ch.*, c.slug as comic_slug, c.title as comic_title
    FROM chapters ch JOIN comics c ON ch.comic_id = c.id
    WHERE ch.id = ${parseInt(id)}
  `;
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const images = await sql`
    SELECT * FROM chapter_images WHERE chapter_id = ${parseInt(id)} ORDER BY sort_order ASC
  `;

  return NextResponse.json({ ...rows[0], images });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const data = parsed.data;
  const result = await sql`
    UPDATE chapters SET
      number = COALESCE(${data.number ?? null}, number),
      title = ${data.title !== undefined ? data.title : null},
      published_at = COALESCE(${data.publishedAt ?? null}, published_at),
      updated_at = NOW()
    WHERE id = ${parseInt(id)} RETURNING *
  `;

  if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await logAudit({ userEmail: session!.email, action: "update_chapter", entityType: "chapter", entityId: parseInt(id) });
  return NextResponse.json(result[0]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const chapterId = parseInt(id);

  // Delete images from R2
  const images = await sql`SELECT object_key FROM chapter_images WHERE chapter_id = ${chapterId}`;
  for (const img of images) {
    try { await deleteR2Object(img.object_key); } catch {}
  }

  await sql`DELETE FROM chapters WHERE id = ${chapterId}`;
  await logAudit({ userEmail: session!.email, action: "delete_chapter", entityType: "chapter", entityId: chapterId });
  return NextResponse.json({ success: true });
}
