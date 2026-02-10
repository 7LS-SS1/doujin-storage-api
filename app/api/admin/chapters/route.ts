import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { tableHasColumn } from "@/lib/db-schema";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const chapterSchema = z.object({
  comicId: z.union([z.string().min(1), z.number()]).transform(String),
  number: z.string().min(1),
  title: z.string().optional(),
  publishedAt: z.string().optional(),
});

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const comicId = searchParams.get("comicId");
  const search = (searchParams.get("search") || "").trim();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.max(
    1,
    Math.min(100, parseInt(searchParams.get("pageSize") || "20", 10) || 20)
  );
  const offset = (page - 1) * pageSize;
  const searchTerm = search ? `%${search}%` : null;

  if (comicId) {
    const chapters = searchTerm
      ? await sql`
          SELECT ch.*, (SELECT COUNT(*) FROM chapter_images WHERE chapter_id = ch.id) as image_count
          FROM chapters ch
          WHERE ch.comic_id = ${comicId}
            AND (ch.title ILIKE ${searchTerm} OR ch.number ILIKE ${searchTerm})
          ORDER BY ch.created_at DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `
      : await sql`
          SELECT ch.*, (SELECT COUNT(*) FROM chapter_images WHERE chapter_id = ch.id) as image_count
          FROM chapters ch WHERE ch.comic_id = ${comicId}
          ORDER BY ch.created_at DESC
          LIMIT ${pageSize} OFFSET ${offset}
        `;

    const countRows = searchTerm
      ? await sql`
          SELECT COUNT(*)::int as total FROM chapters ch
          WHERE ch.comic_id = ${comicId}
            AND (ch.title ILIKE ${searchTerm} OR ch.number ILIKE ${searchTerm})
        `
      : await sql`
          SELECT COUNT(*)::int as total FROM chapters ch WHERE ch.comic_id = ${comicId}
        `;

    return NextResponse.json({
      chapters,
      total: countRows[0]?.total ?? 0,
      page,
      pageSize,
    });
  }

  const chapters = searchTerm
    ? await sql`
        SELECT ch.*, c.id as comic_id, c.title as comic_title, c.slug as comic_slug,
          (SELECT COUNT(*) FROM chapter_images WHERE chapter_id = ch.id) as image_count
        FROM chapters ch
        JOIN comics c ON ch.comic_id = c.id
        WHERE ch.title ILIKE ${searchTerm}
          OR ch.number ILIKE ${searchTerm}
          OR c.title ILIKE ${searchTerm}
        ORDER BY ch.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `
    : await sql`
        SELECT ch.*, c.id as comic_id, c.title as comic_title, c.slug as comic_slug,
          (SELECT COUNT(*) FROM chapter_images WHERE chapter_id = ch.id) as image_count
        FROM chapters ch
        JOIN comics c ON ch.comic_id = c.id
        ORDER BY ch.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;

  const countRows = searchTerm
    ? await sql`
        SELECT COUNT(*)::int as total
        FROM chapters ch
        JOIN comics c ON ch.comic_id = c.id
        WHERE ch.title ILIKE ${searchTerm}
          OR ch.number ILIKE ${searchTerm}
          OR c.title ILIKE ${searchTerm}
      `
    : await sql`
        SELECT COUNT(*)::int as total FROM chapters
      `;

  return NextResponse.json({
    chapters,
    total: countRows[0]?.total ?? 0,
    page,
    pageSize,
  });
}

export async function POST(request: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = chapterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const hasPublishedAt = await tableHasColumn("chapters", "published_at");
    const result = hasPublishedAt
      ? await sql`
          INSERT INTO chapters (comic_id, number, title, published_at)
          VALUES (${data.comicId}, ${data.number}, ${data.title ?? null}, ${data.publishedAt ?? new Date().toISOString()})
          RETURNING *
        `
      : await sql`
          INSERT INTO chapters (comic_id, number, title)
          VALUES (${data.comicId}, ${data.number}, ${data.title ?? null})
          RETURNING *
        `;

    await logAudit({ userEmail: session!.email, action: "create_chapter", entityType: "chapter", entityId: result[0].id });
    return NextResponse.json(result[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Create chapter error:", err);
    const isDev = process.env.NODE_ENV !== "production";
    return NextResponse.json(
      { error: "Internal server error", details: isDev ? message : undefined },
      { status: 500 }
    );
  }
}
