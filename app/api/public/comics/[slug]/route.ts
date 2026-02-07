import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireApiKey } from "@/lib/public-guard";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { error } = await requireApiKey(request);
  if (error) return error;

  const { slug } = await params;

  const rows = await sql`
    SELECT c.*, s.title as series_title, s.slug as series_slug
    FROM comics c LEFT JOIN series s ON c.series_id = s.id
    WHERE c.slug = ${slug}
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Comic not found" }, { status: 404 });
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
  const latestChapters = await sql`
    SELECT id, number, title, published_at FROM chapters
    WHERE comic_id = ${comic.id} ORDER BY created_at DESC LIMIT 10
  `;

  let relatedComicsInSeries: Record<string, unknown>[] = [];
  if (comic.series_id) {
    relatedComicsInSeries = await sql`
      SELECT id, slug, title, cover_image_url, status FROM comics
      WHERE series_id = ${comic.series_id} AND id != ${comic.id}
      ORDER BY title LIMIT 10
    `;
  }

  return NextResponse.json({
    ...comic,
    categories,
    tags,
    series: comic.series_id
      ? { id: comic.series_id, title: comic.series_title, slug: comic.series_slug }
      : null,
    latestChapters,
    relatedComicsInSeries,
  });
}
