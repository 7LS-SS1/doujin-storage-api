import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireApiKey } from "@/lib/public-guard";
import {
  comicsHaveTypeColumn,
  resolveComicVisibility,
} from "@/lib/comic-scope";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { error, client } = await requireApiKey(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const tag = searchParams.get("tag") || "";
  const seriesSlug = searchParams.get("series") || "";
  const status = searchParams.get("status") || "";
  const requestedComicType =
    searchParams.get("comicType") || searchParams.get("type") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("pageSize") || "20"))
  );
  const offset = (page - 1) * pageSize;

  const hasComicTypeColumn = await comicsHaveTypeColumn();
  const visibility = hasComicTypeColumn
    ? resolveComicVisibility(client.scope, requestedComicType)
    : "all";

  if (visibility === "none") {
    return NextResponse.json({
      comics: [],
      total: 0,
      page,
      pageSize,
    });
  }

  const comicTypeFilter = visibility === "all" ? "" : visibility;
  const searchPattern = `%${search}%`;

  let comics: Record<string, unknown>[] = [];
  let total = 0;

  if (hasComicTypeColumn) {
    if (category && tag) {
      comics = await sql`
        SELECT DISTINCT c.id, c.slug, c.title, c.alt_titles, c.description, c.author_name,
          c.comic_type, c.status, c.cover_image_url, c.series_id, c.created_at, c.updated_at,
          s.title as series_title, s.slug as series_slug
        FROM comics c
        LEFT JOIN series s ON c.series_id = s.id
        JOIN comic_categories cc ON c.id = cc.comic_id JOIN categories cat ON cc.category_id = cat.id
        JOIN comic_tags ct ON c.id = ct.comic_id JOIN tags tg ON ct.tag_id = tg.id
        WHERE cat.slug = ${category} AND tg.slug = ${tag}
          AND (${search} = '' OR c.title ILIKE ${searchPattern} OR c.author_name ILIKE ${searchPattern})
          AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
          AND (${status} = '' OR c.status = ${status})
          AND (${comicTypeFilter} = '' OR c.comic_type = ${comicTypeFilter})
        ORDER BY c.updated_at DESC LIMIT ${pageSize} OFFSET ${offset}
      `;
      const countRows = await sql`
        SELECT COUNT(DISTINCT c.id) as total
        FROM comics c
        LEFT JOIN series s ON c.series_id = s.id
        JOIN comic_categories cc ON c.id = cc.comic_id JOIN categories cat ON cc.category_id = cat.id
        JOIN comic_tags ct ON c.id = ct.comic_id JOIN tags tg ON ct.tag_id = tg.id
        WHERE cat.slug = ${category} AND tg.slug = ${tag}
          AND (${search} = '' OR c.title ILIKE ${searchPattern} OR c.author_name ILIKE ${searchPattern})
          AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
          AND (${status} = '' OR c.status = ${status})
          AND (${comicTypeFilter} = '' OR c.comic_type = ${comicTypeFilter})
      `;
      total = parseInt((countRows[0]?.total as string) || "0");
    } else if (category) {
      comics = await sql`
        SELECT DISTINCT c.id, c.slug, c.title, c.alt_titles, c.description, c.author_name,
          c.comic_type, c.status, c.cover_image_url, c.series_id, c.created_at, c.updated_at,
          s.title as series_title, s.slug as series_slug
        FROM comics c
        LEFT JOIN series s ON c.series_id = s.id
        JOIN comic_categories cc ON c.id = cc.comic_id JOIN categories cat ON cc.category_id = cat.id
        WHERE cat.slug = ${category}
          AND (${search} = '' OR c.title ILIKE ${searchPattern} OR c.author_name ILIKE ${searchPattern})
          AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
          AND (${status} = '' OR c.status = ${status})
          AND (${comicTypeFilter} = '' OR c.comic_type = ${comicTypeFilter})
        ORDER BY c.updated_at DESC LIMIT ${pageSize} OFFSET ${offset}
      `;
      const countRows = await sql`
        SELECT COUNT(DISTINCT c.id) as total
        FROM comics c
        LEFT JOIN series s ON c.series_id = s.id
        JOIN comic_categories cc ON c.id = cc.comic_id JOIN categories cat ON cc.category_id = cat.id
        WHERE cat.slug = ${category}
          AND (${search} = '' OR c.title ILIKE ${searchPattern} OR c.author_name ILIKE ${searchPattern})
          AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
          AND (${status} = '' OR c.status = ${status})
          AND (${comicTypeFilter} = '' OR c.comic_type = ${comicTypeFilter})
      `;
      total = parseInt((countRows[0]?.total as string) || "0");
    } else if (tag) {
      comics = await sql`
        SELECT DISTINCT c.id, c.slug, c.title, c.alt_titles, c.description, c.author_name,
          c.comic_type, c.status, c.cover_image_url, c.series_id, c.created_at, c.updated_at,
          s.title as series_title, s.slug as series_slug
        FROM comics c
        LEFT JOIN series s ON c.series_id = s.id
        JOIN comic_tags ct ON c.id = ct.comic_id JOIN tags tg ON ct.tag_id = tg.id
        WHERE tg.slug = ${tag}
          AND (${search} = '' OR c.title ILIKE ${searchPattern} OR c.author_name ILIKE ${searchPattern})
          AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
          AND (${status} = '' OR c.status = ${status})
          AND (${comicTypeFilter} = '' OR c.comic_type = ${comicTypeFilter})
        ORDER BY c.updated_at DESC LIMIT ${pageSize} OFFSET ${offset}
      `;
      const countRows = await sql`
        SELECT COUNT(DISTINCT c.id) as total
        FROM comics c
        LEFT JOIN series s ON c.series_id = s.id
        JOIN comic_tags ct ON c.id = ct.comic_id JOIN tags tg ON ct.tag_id = tg.id
        WHERE tg.slug = ${tag}
          AND (${search} = '' OR c.title ILIKE ${searchPattern} OR c.author_name ILIKE ${searchPattern})
          AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
          AND (${status} = '' OR c.status = ${status})
          AND (${comicTypeFilter} = '' OR c.comic_type = ${comicTypeFilter})
      `;
      total = parseInt((countRows[0]?.total as string) || "0");
    } else {
      comics = await sql`
        SELECT c.id, c.slug, c.title, c.alt_titles, c.description, c.author_name,
          c.comic_type, c.status, c.cover_image_url, c.series_id, c.created_at, c.updated_at,
          s.title as series_title, s.slug as series_slug
        FROM comics c
        LEFT JOIN series s ON c.series_id = s.id
        WHERE (${search} = '' OR c.title ILIKE ${searchPattern} OR c.author_name ILIKE ${searchPattern})
          AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
          AND (${status} = '' OR c.status = ${status})
          AND (${comicTypeFilter} = '' OR c.comic_type = ${comicTypeFilter})
        ORDER BY c.updated_at DESC LIMIT ${pageSize} OFFSET ${offset}
      `;
      const countRows = await sql`
        SELECT COUNT(*) as total
        FROM comics c
        LEFT JOIN series s ON c.series_id = s.id
        WHERE (${search} = '' OR c.title ILIKE ${searchPattern} OR c.author_name ILIKE ${searchPattern})
          AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
          AND (${status} = '' OR c.status = ${status})
          AND (${comicTypeFilter} = '' OR c.comic_type = ${comicTypeFilter})
      `;
      total = parseInt((countRows[0]?.total as string) || "0");
    }
  } else if (category && tag) {
    comics = await sql`
      SELECT DISTINCT c.id, c.slug, c.title, c.alt_titles, c.description, c.author_name,
        c.status, c.cover_image_url, c.series_id, c.created_at, c.updated_at,
        s.title as series_title, s.slug as series_slug
      FROM comics c
      LEFT JOIN series s ON c.series_id = s.id
      JOIN comic_categories cc ON c.id = cc.comic_id JOIN categories cat ON cc.category_id = cat.id
      JOIN comic_tags ct ON c.id = ct.comic_id JOIN tags tg ON ct.tag_id = tg.id
      WHERE cat.slug = ${category} AND tg.slug = ${tag}
        AND (${search} = '' OR c.title ILIKE ${searchPattern} OR c.author_name ILIKE ${searchPattern})
        AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
        AND (${status} = '' OR c.status = ${status})
      ORDER BY c.updated_at DESC LIMIT ${pageSize} OFFSET ${offset}
    `;
    const countRows = await sql`
      SELECT COUNT(DISTINCT c.id) as total FROM comics c
      LEFT JOIN series s ON c.series_id = s.id
      JOIN comic_categories cc ON c.id = cc.comic_id JOIN categories cat ON cc.category_id = cat.id
      JOIN comic_tags ct ON c.id = ct.comic_id JOIN tags tg ON ct.tag_id = tg.id
      WHERE cat.slug = ${category} AND tg.slug = ${tag}
        AND (${search} = '' OR c.title ILIKE ${searchPattern} OR c.author_name ILIKE ${searchPattern})
        AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
        AND (${status} = '' OR c.status = ${status})
    `;
    total = parseInt((countRows[0]?.total as string) || "0");
  } else if (category) {
    comics = await sql`
      SELECT DISTINCT c.id, c.slug, c.title, c.alt_titles, c.description, c.author_name,
        c.status, c.cover_image_url, c.series_id, c.created_at, c.updated_at,
        s.title as series_title, s.slug as series_slug
      FROM comics c
      LEFT JOIN series s ON c.series_id = s.id
      JOIN comic_categories cc ON c.id = cc.comic_id JOIN categories cat ON cc.category_id = cat.id
      WHERE cat.slug = ${category}
        AND (${search} = '' OR c.title ILIKE ${searchPattern} OR c.author_name ILIKE ${searchPattern})
        AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
        AND (${status} = '' OR c.status = ${status})
      ORDER BY c.updated_at DESC LIMIT ${pageSize} OFFSET ${offset}
    `;
    const countRows = await sql`
      SELECT COUNT(DISTINCT c.id) as total FROM comics c
      LEFT JOIN series s ON c.series_id = s.id
      JOIN comic_categories cc ON c.id = cc.comic_id JOIN categories cat ON cc.category_id = cat.id
      WHERE cat.slug = ${category}
        AND (${search} = '' OR c.title ILIKE ${searchPattern} OR c.author_name ILIKE ${searchPattern})
        AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
        AND (${status} = '' OR c.status = ${status})
    `;
    total = parseInt((countRows[0]?.total as string) || "0");
  } else if (tag) {
    comics = await sql`
      SELECT DISTINCT c.id, c.slug, c.title, c.alt_titles, c.description, c.author_name,
        c.status, c.cover_image_url, c.series_id, c.created_at, c.updated_at,
        s.title as series_title, s.slug as series_slug
      FROM comics c
      LEFT JOIN series s ON c.series_id = s.id
      JOIN comic_tags ct ON c.id = ct.comic_id JOIN tags tg ON ct.tag_id = tg.id
      WHERE tg.slug = ${tag}
        AND (${search} = '' OR c.title ILIKE ${searchPattern} OR c.author_name ILIKE ${searchPattern})
        AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
        AND (${status} = '' OR c.status = ${status})
      ORDER BY c.updated_at DESC LIMIT ${pageSize} OFFSET ${offset}
    `;
    const countRows = await sql`
      SELECT COUNT(DISTINCT c.id) as total FROM comics c
      LEFT JOIN series s ON c.series_id = s.id
      JOIN comic_tags ct ON c.id = ct.comic_id JOIN tags tg ON ct.tag_id = tg.id
      WHERE tg.slug = ${tag}
        AND (${search} = '' OR c.title ILIKE ${searchPattern} OR c.author_name ILIKE ${searchPattern})
        AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
        AND (${status} = '' OR c.status = ${status})
    `;
    total = parseInt((countRows[0]?.total as string) || "0");
  } else {
    comics = await sql`
      SELECT c.id, c.slug, c.title, c.alt_titles, c.description, c.author_name,
        c.status, c.cover_image_url, c.series_id, c.created_at, c.updated_at,
        s.title as series_title, s.slug as series_slug
      FROM comics c
      LEFT JOIN series s ON c.series_id = s.id
      WHERE (${search} = '' OR c.title ILIKE ${searchPattern} OR c.author_name ILIKE ${searchPattern})
        AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
        AND (${status} = '' OR c.status = ${status})
      ORDER BY c.updated_at DESC LIMIT ${pageSize} OFFSET ${offset}
    `;
    const countRows = await sql`
      SELECT COUNT(*) as total FROM comics c
      LEFT JOIN series s ON c.series_id = s.id
      WHERE (${search} = '' OR c.title ILIKE ${searchPattern} OR c.author_name ILIKE ${searchPattern})
        AND (${seriesSlug} = '' OR s.slug = ${seriesSlug})
        AND (${status} = '' OR c.status = ${status})
    `;
    total = parseInt((countRows[0]?.total as string) || "0");
  }

  const comicIds = comics.map((comic) => comic.id as number);
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

  const results = comics.map((comic) => ({
    ...comic,
    comic_type: hasComicTypeColumn ? comic.comic_type ?? null : null,
    categories: categories.filter((categoryItem) => categoryItem.comic_id === comic.id),
    tags: tags.filter((tagItem) => tagItem.comic_id === comic.id),
    series: comic.series_id
      ? { id: comic.series_id, title: comic.series_title, slug: comic.series_slug }
      : null,
  }));

  return NextResponse.json({
    comics: results,
    total,
    page,
    pageSize,
  });
}
