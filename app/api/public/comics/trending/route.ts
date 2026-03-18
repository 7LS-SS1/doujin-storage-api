import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireApiKey } from "@/lib/public-guard";

export const dynamic = "force-dynamic";

// GET /api/public/comics/trending
// Returns the most-viewed comics in the last 7 days based on chapter_view_events.
// Falls back to most-recently-updated comics if the view table doesn't exist.
// Used by the WordPress companion plugin for "ยอดนิยมสัปดาห์นี้".
//
// Query params:
//   pageSize  number  default 20, max 50
//   days      number  default 7, max 30
export async function GET(request: Request) {
  const { error } = await requireApiKey(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10))
  );
  const days = Math.min(
    30,
    Math.max(1, parseInt(searchParams.get("days") ?? "7", 10))
  );

  try {
    const comics = await sql`
      SELECT
        c.id, c.slug, c.title, c.author_name, c.status,
        c.cover_image_url, c.created_at, c.updated_at,
        s.title AS series_title,
        s.slug  AS series_slug,
        COUNT(cve.id) AS view_count,
        (
          SELECT COUNT(*) FROM chapters ch WHERE ch.comic_id = c.id
        ) AS chapter_count
      FROM comics c
      LEFT JOIN series s ON c.series_id = s.id
      LEFT JOIN chapter_view_events cve
        ON cve.comic_id = c.id::text
        AND cve.event_type = 'chapter_view'
        AND cve.counted = true
        AND cve.created_at >= NOW() - (${days} || ' days')::INTERVAL
      GROUP BY c.id, s.title, s.slug
      ORDER BY view_count DESC, c.updated_at DESC
      LIMIT ${pageSize}
    `;

    return NextResponse.json({ comics, total: comics.length });
  } catch {
    // Fallback: chapter_view_events table may not exist yet — return recently updated
    const comics = await sql`
      SELECT
        c.id, c.slug, c.title, c.author_name, c.status,
        c.cover_image_url, c.created_at, c.updated_at,
        s.title AS series_title,
        s.slug  AS series_slug,
        0 AS view_count,
        (
          SELECT COUNT(*) FROM chapters ch WHERE ch.comic_id = c.id
        ) AS chapter_count
      FROM comics c
      LEFT JOIN series s ON c.series_id = s.id
      ORDER BY c.updated_at DESC
      LIMIT ${pageSize}
    `;
    return NextResponse.json({ comics, total: comics.length });
  }
}
