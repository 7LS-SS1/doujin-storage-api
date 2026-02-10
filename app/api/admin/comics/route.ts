import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { generateSlug } from "@/lib/slug";
import { getComicsAltTitlesType } from "@/lib/db-schema";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const idSchema = z.union([z.string().min(1), z.number()]).transform(String);

const nullableIdSchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === "" || value === "none") {
    return null;
  }
  return value;
}, z.union([z.string().min(1), z.number()]).transform(String).nullable());

const comicSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().optional(),
  altTitles: z.array(z.string()).default([]),
  description: z.string().optional().nullable(),
  authorName: z.string().optional().nullable(),
  status: z.enum(["ongoing", "completed", "hiatus"]).default("ongoing"),
  coverImageUrl: z.string().optional().nullable(),
  coverObjectKey: z.string().optional().nullable(),
  seriesId: nullableIdSchema.optional(),
  categoryIds: z.array(idSchema).default([]),
  tagIds: z.array(idSchema).default([]),
});

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "20")));
  const offset = (page - 1) * pageSize;

  let comics;
  let countResult;

  if (search) {
    comics = await sql`
      SELECT c.*, s.title as series_title
      FROM comics c 
      LEFT JOIN series s ON c.series_id = s.id
      WHERE c.title ILIKE ${"%" + search + "%"} OR c.slug ILIKE ${"%" + search + "%"}
      ORDER BY c.updated_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;
    countResult = await sql`
      SELECT COUNT(*) as total FROM comics 
      WHERE title ILIKE ${"%" + search + "%"} OR slug ILIKE ${"%" + search + "%"}
    `;
  } else {
    comics = await sql`
      SELECT c.*, s.title as series_title
      FROM comics c
      LEFT JOIN series s ON c.series_id = s.id
      ORDER BY c.updated_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;
    countResult = await sql`SELECT COUNT(*) as total FROM comics`;
  }

  // Get categories and tags for each comic
  const comicIds = comics.map((c: { id: number }) => c.id);
  let categories: Record<string, unknown>[] = [];
  let tags: Record<string, unknown>[] = [];
  
  if (comicIds.length > 0) {
    categories = await sql`
      SELECT cc.comic_id, cat.id, cat.slug, cat.name
      FROM comic_categories cc
      JOIN categories cat ON cc.category_id = cat.id
      WHERE cc.comic_id = ANY(${comicIds})
    `;
    tags = await sql`
      SELECT ct.comic_id, t.id, t.slug, t.name
      FROM comic_tags ct
      JOIN tags t ON ct.tag_id = t.id
      WHERE ct.comic_id = ANY(${comicIds})
    `;
  }

  const comicsWithTaxonomies = comics.map((c: Record<string, unknown>) => ({
    ...c,
    categories: categories.filter((cat: Record<string, unknown>) => cat.comic_id === c.id),
    tags: tags.filter((tag: Record<string, unknown>) => tag.comic_id === c.id),
  }));

  return NextResponse.json({
    comics: comicsWithTaxonomies,
    total: parseInt(countResult[0].total as string),
    page,
    pageSize,
  });
}

export async function POST(request: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = comicSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const slug = data.slug || generateSlug(data.title);
    const altTitlesType = await getComicsAltTitlesType();
    const altTitlesValue =
      altTitlesType === "text_array"
        ? data.altTitles
        : JSON.stringify(data.altTitles);

    const result = await sql`
      INSERT INTO comics (slug, title, alt_titles, description, author_name, status, cover_image_url, cover_object_key, series_id)
      VALUES (
        ${slug}, ${data.title}, ${altTitlesValue},
        ${data.description ?? null}, ${data.authorName ?? null}, ${data.status},
        ${data.coverImageUrl ?? null}, ${data.coverObjectKey ?? null},
        ${data.seriesId ?? null}
      )
      RETURNING *
    `;

    const comic = result[0];

    // Insert category relations
    for (const catId of data.categoryIds) {
      await sql`INSERT INTO comic_categories (comic_id, category_id) VALUES (${comic.id}, ${catId}) ON CONFLICT DO NOTHING`;
    }
    // Insert tag relations
    for (const tagId of data.tagIds) {
      await sql`INSERT INTO comic_tags (comic_id, tag_id) VALUES (${comic.id}, ${tagId}) ON CONFLICT DO NOTHING`;
    }

    await logAudit({
      userEmail: session!.email,
      action: "create_comic",
      entityType: "comic",
      entityId: comic.id,
      details: { title: data.title, slug },
    });

    return NextResponse.json(comic, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("unique") || message.includes("duplicate")) {
      return NextResponse.json({ error: "A comic with this slug already exists" }, { status: 409 });
    }
    console.error("Create comic error:", err);
    const isDev = process.env.NODE_ENV !== "production";
    return NextResponse.json(
      { error: "Internal server error", details: isDev ? message : undefined },
      { status: 500 }
    );
  }
}
