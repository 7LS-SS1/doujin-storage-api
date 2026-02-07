import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const chapterSchema = z.object({
  comicId: z.number(),
  number: z.string().min(1),
  title: z.string().optional(),
  publishedAt: z.string().optional(),
});

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const comicId = searchParams.get("comicId");

  if (!comicId) {
    return NextResponse.json({ error: "comicId required" }, { status: 400 });
  }

  const chapters = await sql`
    SELECT ch.*, (SELECT COUNT(*) FROM chapter_images WHERE chapter_id = ch.id) as image_count
    FROM chapters ch WHERE ch.comic_id = ${parseInt(comicId)}
    ORDER BY ch.created_at DESC
  `;

  return NextResponse.json({ chapters });
}

export async function POST(request: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = chapterSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const result = await sql`
    INSERT INTO chapters (comic_id, number, title, published_at)
    VALUES (${data.comicId}, ${data.number}, ${data.title ?? null}, ${data.publishedAt ?? new Date().toISOString()})
    RETURNING *
  `;

  await logAudit({ userEmail: session!.email, action: "create_chapter", entityType: "chapter", entityId: result[0].id });
  return NextResponse.json(result[0], { status: 201 });
}
