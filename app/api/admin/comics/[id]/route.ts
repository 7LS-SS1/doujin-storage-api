import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { deleteR2Object } from "@/lib/r2";
import { getComicsAltTitlesType, tableHasColumn } from "@/lib/db-schema";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const idSchema = z.union([z.string().min(1), z.number()]).transform(String);

const nullableIdSchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === "" || value === "none") {
    return null;
  }
  return value;
}, z.union([z.string().min(1), z.number()]).transform(String).nullable());

const updateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  slug: z.string().optional(),
  altTitles: z.array(z.string()).optional(),
  description: z.string().optional().nullable(),
  authorName: z.string().optional().nullable(),
  status: z.enum(["ongoing", "completed", "hiatus"]).optional(),
  coverImageUrl: z.string().optional().nullable(),
  coverObjectKey: z.string().optional().nullable(),
  seriesId: nullableIdSchema.optional(),
  categoryIds: z.array(idSchema).optional(),
  tagIds: z.array(idSchema).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const rows = await sql`
    SELECT c.*, s.title as series_title, s.slug as series_slug
    FROM comics c
    LEFT JOIN series s ON c.series_id = s.id
    WHERE c.id = ${id}
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const comic = rows[0];

  const categories = await sql`
    SELECT cat.id, cat.slug, cat.name FROM comic_categories cc
    JOIN categories cat ON cc.category_id = cat.id WHERE cc.comic_id = ${comic.id}
  `;
  const tags = await sql`
    SELECT t.id, t.slug, t.name FROM comic_tags ct
    JOIN tags t ON ct.tag_id = t.id WHERE ct.comic_id = ${comic.id}
  `;

  const hasPublishedAt = await tableHasColumn("chapters", "published_at");
  const chapters = hasPublishedAt
    ? await sql`
        SELECT id, number, title, published_at, created_at FROM chapters
        WHERE comic_id = ${comic.id} ORDER BY created_at DESC
      `
    : await sql`
        SELECT id, number, title, created_at FROM chapters
        WHERE comic_id = ${comic.id} ORDER BY created_at DESC
      `;
  const chaptersWithPublishedAt = hasPublishedAt
    ? chapters
    : chapters.map((ch: { created_at: string }) => ({
        ...ch,
        published_at: ch.created_at,
      }));

  return NextResponse.json({
    ...comic,
    categories,
    tags,
    chapters: chaptersWithPublishedAt,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const comicId = id;

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const altTitlesType = await getComicsAltTitlesType();
    const altTitlesValue =
      data.altTitles !== undefined
        ? altTitlesType === "text_array"
          ? data.altTitles
          : JSON.stringify(data.altTitles)
        : null;

    // Build dynamic update
    const existing = await sql`SELECT * FROM comics WHERE id = ${comicId}`;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // If cover changed, delete old R2 object
    if (data.coverObjectKey && existing[0].cover_object_key && data.coverObjectKey !== existing[0].cover_object_key) {
      try { await deleteR2Object(existing[0].cover_object_key); } catch {}
    }

    const result = await sql`
      UPDATE comics SET
        title = COALESCE(${data.title ?? null}, title),
        slug = COALESCE(${data.slug ?? null}, slug),
        alt_titles = COALESCE(${altTitlesValue}, alt_titles),
        description = ${data.description !== undefined ? data.description : existing[0].description},
        author_name = ${data.authorName !== undefined ? data.authorName : existing[0].author_name},
        status = COALESCE(${data.status ?? null}, status),
        cover_image_url = ${data.coverImageUrl !== undefined ? data.coverImageUrl : existing[0].cover_image_url},
        cover_object_key = ${data.coverObjectKey !== undefined ? data.coverObjectKey : existing[0].cover_object_key},
        series_id = ${data.seriesId !== undefined ? data.seriesId : existing[0].series_id},
        updated_at = NOW()
      WHERE id = ${comicId}
      RETURNING *
    `;

    // Update categories if provided
    if (data.categoryIds !== undefined) {
      await sql`DELETE FROM comic_categories WHERE comic_id = ${comicId}`;
      for (const catId of data.categoryIds) {
        await sql`INSERT INTO comic_categories (comic_id, category_id) VALUES (${comicId}, ${catId}) ON CONFLICT DO NOTHING`;
      }
    }
    // Update tags if provided
    if (data.tagIds !== undefined) {
      await sql`DELETE FROM comic_tags WHERE comic_id = ${comicId}`;
      for (const tagId of data.tagIds) {
        await sql`INSERT INTO comic_tags (comic_id, tag_id) VALUES (${comicId}, ${tagId}) ON CONFLICT DO NOTHING`;
      }
    }

    await logAudit({
      userEmail: session!.email,
      action: "update_comic",
      entityType: "comic",
    entityId: comicId,
  });

    return NextResponse.json(result[0]);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("unique") || message.includes("duplicate")) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    console.error("Update comic error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const comicId = id;

  const existing = await sql`SELECT * FROM comics WHERE id = ${comicId}`;
  if (existing.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete cover from R2
  if (existing[0].cover_object_key) {
    try { await deleteR2Object(existing[0].cover_object_key); } catch {}
  }

  // Delete all chapter images from R2
  const chapterImagesHaveObjectKey = await tableHasColumn("chapter_images", "object_key");
  if (chapterImagesHaveObjectKey) {
    const images = await sql`
      SELECT ci.object_key FROM chapter_images ci
      JOIN chapters ch ON ci.chapter_id = ch.id
      WHERE ch.comic_id = ${comicId}
    `;
    for (const img of images) {
      if (!img.object_key) continue;
      try { await deleteR2Object(img.object_key); } catch {}
    }
  }

  await sql`DELETE FROM comics WHERE id = ${comicId}`;

  await logAudit({
    userEmail: session!.email,
    action: "delete_comic",
    entityType: "comic",
    entityId: comicId,
    details: { title: existing[0].title },
  });

  return NextResponse.json({ success: true });
}
