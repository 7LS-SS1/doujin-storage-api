import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const rows = await sql`SELECT * FROM series WHERE id = ${id}`;
  if (rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const seriesId = id;

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const data = parsed.data;
  const result = await sql`
    UPDATE series SET
      title = COALESCE(${data.title ?? null}, title),
      slug = COALESCE(${data.slug ?? null}, slug),
      description = ${data.description !== undefined ? data.description : null},
      updated_at = NOW()
    WHERE id = ${seriesId} RETURNING *
  `;

  if (result.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await logAudit({ userEmail: session!.email, action: "update_series", entityType: "series", entityId: seriesId });
  return NextResponse.json(result[0]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  const { id } = await params;
  const seriesId = id;
  await sql`DELETE FROM series WHERE id = ${seriesId}`;
  await logAudit({ userEmail: session!.email, action: "delete_series", entityType: "series", entityId: seriesId });
  return NextResponse.json({ success: true });
}
