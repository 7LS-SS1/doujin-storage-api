import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireApiKey } from "@/lib/public-guard";

export const dynamic = "force-dynamic";

// GET /api/public/comics/new
// Returns the most recently CREATED comics (sorted by created_at DESC).
// Used by the WordPress companion plugin for the "มาใหม่" section.
//
// Query params:
//   pageSize  number  default 20, max 50
export async function GET(request: Request) {
  const { error } = await requireApiKey(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10))
  );

  const comics = await sql`
    SELECT
      c.id, c.slug, c.title, c.author_name, c.status,
      c.cover_image_url, c.created_at, c.updated_at,
      s.title  AS series_title,
      s.slug   AS series_slug,
      (
        SELECT COUNT(*) FROM chapters ch WHERE ch.comic_id = c.id
      ) AS chapter_count
    FROM comics c
    LEFT JOIN series s ON c.series_id = s.id
    ORDER BY c.created_at DESC
    LIMIT ${pageSize}
  `;

  return NextResponse.json({ comics, total: comics.length });
}
