import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireApiKey } from "@/lib/public-guard";

export async function GET(request: Request) {
  const { error } = await requireApiKey(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const tag = searchParams.get("tag") || "";
  const seriesSlug = searchParams.get("series") || "";
  const status = searchParams.get("status") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("pageSize") || "20"))
  );
  const offset = (page - 1) * pageSize;

  // Use parameterized queries only - build step by step
  let comics: Record<string, unknown>[];
  let total: number;

  if (category && tag) {
    comics = await sql`
      SELECT DISTINCT c.id, c.slug, c.title, c.alt_titles, c.description, c.author_name,
        c.status, c.cover_image_url, c.series_id, c.created_at, c.updated_at,
        s.title as series_title, s.slug as series_slug
      FROM comics c
      LEFT JOIN series s ON c.series_id = s.id
      JOIN comic_categories cc ON c.id = cc.comic_id JOIN categories cat ON cc.category_id = cat.id
      JOIN comic_tags ct ON c.id = ct.comic_id JOIN tags tg ON ct.tag_id = tg.id
      WHERE cat.slug = ${category} AND tg.slug = ${tag}
        AND (${search} = '' OR c.title ILIKE ${"%" + search + "%"} OR c.author_name ILIKE ${"%" + search + "%"})
        AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
        AND (${status} = '' OR c.status = ${status})
      ORDER BY c.updated_at DESC LIMIT ${pageSize} OFFSET ${offset}
    `;
    const cnt = await sql`
      SELECT COUNT(DISTINCT c.id) as total FROM comics c
      LEFT JOIN series s ON c.series_id = s.id
      JOIN comic_categories cc ON c.id = cc.comic_id JOIN categories cat ON cc.category_id = cat.id
      JOIN comic_tags ct ON c.id = ct.comic_id JOIN tags tg ON ct.tag_id = tg.id
      WHERE cat.slug = ${category} AND tg.slug = ${tag}
        AND (${search} = '' OR c.title ILIKE ${"%" + search + "%"} OR c.author_name ILIKE ${"%" + search + "%"})
        AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
        AND (${status} = '' OR c.status = ${status})
    `;
    total = parseInt(cnt[0]?.total as string || "0");
  } else if (category) {
    comics = await sql`
      SELECT DISTINCT c.id, c.slug, c.title, c.alt_titles, c.description, c.author_name,
        c.status, c.cover_image_url, c.series_id, c.created_at, c.updated_at,
        s.title as series_title, s.slug as series_slug
      FROM comics c
      LEFT JOIN series s ON c.series_id = s.id
      JOIN comic_categories cc ON c.id = cc.comic_id JOIN categories cat ON cc.category_id = cat.id
      WHERE cat.slug = ${category}
        AND (${search} = '' OR c.title ILIKE ${"%" + search + "%"} OR c.author_name ILIKE ${"%" + search + "%"})
        AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
        AND (${status} = '' OR c.status = ${status})
      ORDER BY c.updated_at DESC LIMIT ${pageSize} OFFSET ${offset}
    `;
    const cnt = await sql`
      SELECT COUNT(DISTINCT c.id) as total FROM comics c
      LEFT JOIN series s ON c.series_id = s.id
      JOIN comic_categories cc ON c.id = cc.comic_id JOIN categories cat ON cc.category_id = cat.id
      WHERE cat.slug = ${category}
        AND (${search} = '' OR c.title ILIKE ${"%" + search + "%"} OR c.author_name ILIKE ${"%" + search + "%"})
        AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
        AND (${status} = '' OR c.status = ${status})
    `;
    total = parseInt(cnt[0]?.total as string || "0");
  } else if (tag) {
    comics = await sql`
      SELECT DISTINCT c.id, c.slug, c.title, c.alt_titles, c.description, c.author_name,
        c.status, c.cover_image_url, c.series_id, c.created_at, c.updated_at,
        s.title as series_title, s.slug as series_slug
      FROM comics c
      LEFT JOIN series s ON c.series_id = s.id
      JOIN comic_tags ct ON c.id = ct.comic_id JOIN tags tg ON ct.tag_id = tg.id
      WHERE tg.slug = ${tag}
        AND (${search} = '' OR c.title ILIKE ${"%" + search + "%"} OR c.author_name ILIKE ${"%" + search + "%"})
        AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
        AND (${status} = '' OR c.status = ${status})
      ORDER BY c.updated_at DESC LIMIT ${pageSize} OFFSET ${offset}
    `;
    const cnt = await sql`
      SELECT COUNT(DISTINCT c.id) as total FROM comics c
      LEFT JOIN series s ON c.series_id = s.id
      JOIN comic_tags ct ON c.id = ct.comic_id JOIN tags tg ON ct.tag_id = tg.id
      WHERE tg.slug = ${tag}
        AND (${search} = '' OR c.title ILIKE ${"%" + search + "%"} OR c.author_name ILIKE ${"%" + search + "%"})
        AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
        AND (${status} = '' OR c.status = ${status})
    `;
    total = parseInt(cnt[0]?.total as string || "0");
  } else {
    comics = await sql`
      SELECT c.id, c.slug, c.title, c.alt_titles, c.description, c.author_name,
        c.status, c.cover_image_url, c.series_id, c.created_at, c.updated_at,
        s.title as series_title, s.slug as series_slug
      FROM comics c
      LEFT JOIN series s ON c.series_id = s.id
      WHERE (${search} = '' OR c.title ILIKE ${"%" + search + "%"} OR c.author_name ILIKE ${"%" + search + "%"})
        AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
        AND (${status} = '' OR c.status = ${status})
      ORDER BY c.updated_at DESC LIMIT ${pageSize} OFFSET ${offset}
    `;
    const cnt = await sql`
      SELECT COUNT(*) as total FROM comics c
      LEFT JOIN series s ON c.series_id = s.id
      WHERE (${search} = '' OR c.title ILIKE ${"%" + search + "%"} OR c.author_name ILIKE ${"%" + search + "%"})
        AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
        AND (${status} = '' OR c.status = ${status})
    `;
    total = parseInt(cnt[0]?.total as string || "0");
  }

  // Fetch categories and tags per comic
  const comicIds = comics.map((c) => c.id as number);
  let categories: Record<string, unknown>[] = [];
  let tags: Record<string, unknown>[] = [];

  if (comicIds.length > 0) {
    categories = await sql`
      SELECT cc.comic_id, cat.id, cat.slug, cat.name
      FROM comic_categories cc JOIN categories cat ON cc.category_id = cat.id
      WHERE cc.comic_id = ANY(${comicIds})
    `;
    tags = await sql`
      SELECT ct.comic_id, t.id, t.slug, t.name
      FROM comic_tags ct JOIN tags t ON ct.tag_id = t.id
      WHERE ct.comic_id = ANY(${comicIds})
    `;
  }

  const results = comics.map((c) => ({
    ...c,
    categories: categories.filter((cat) => cat.comic_id === c.id),
    tags: tags.filter((t) => t.comic_id === c.id),
    series: c.series_id
      ? { id: c.series_id, title: c.series_title, slug: c.series_slug }
      : null,
  }));

  return NextResponse.json({
    comics: results,
    total,
    page,
    pageSize,
  });
}
