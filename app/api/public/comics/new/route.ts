import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireApiKey } from "@/lib/public-guard";
import {
  comicsHaveTypeColumn,
  resolveComicVisibility,
} from "@/lib/comic-scope";

export const dynamic = "force-dynamic";

// GET /api/public/comics/new
// Returns the most recently CREATED comics (sorted by created_at DESC).
// Used by the WordPress companion plugin for the "มาใหม่" section.
//
// Query params:
//   pageSize  number  default 20, max 50
export async function GET(request: Request) {
  const { error, client } = await requireApiKey(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const requestedComicType =
    searchParams.get("comicType") || searchParams.get("type") || "";
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10))
  );
  const hasComicTypeColumn = await comicsHaveTypeColumn();
  const visibility = hasComicTypeColumn
    ? resolveComicVisibility(client.scope, requestedComicType)
    : "all";

  if (visibility === "none") {
    return NextResponse.json({ comics: [], total: 0 });
  }

  const comicTypeFilter = visibility === "all" ? "" : visibility;
  const comics = hasComicTypeColumn
    ? await sql`
        SELECT
          c.id, c.slug, c.title, c.author_name, c.comic_type, c.status,
          c.cover_image_url, c.created_at, c.updated_at,
          s.title  AS series_title,
          s.slug   AS series_slug,
          (
            SELECT COUNT(*) FROM chapters ch WHERE ch.comic_id = c.id
          ) AS chapter_count
        FROM comics c
        LEFT JOIN series s ON c.series_id = s.id
        WHERE (${comicTypeFilter} = '' OR c.comic_type = ${comicTypeFilter})
        ORDER BY c.created_at DESC
        LIMIT ${pageSize}
      `
    : await sql`
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
