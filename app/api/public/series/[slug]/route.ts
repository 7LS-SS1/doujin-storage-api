import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireApiKey } from "@/lib/public-guard";
import {
  comicsHaveTypeColumn,
  resolveComicVisibility,
} from "@/lib/comic-scope";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { error, client } = await requireApiKey(request);
  if (error) return error;

  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const requestedComicType =
    searchParams.get("comicType") || searchParams.get("type") || "";
  const hasComicTypeColumn = await comicsHaveTypeColumn();
  const visibility = hasComicTypeColumn
    ? resolveComicVisibility(client.scope, requestedComicType)
    : "all";

  if (visibility === "none") {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  const rows = await sql`SELECT * FROM series WHERE slug = ${slug}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  const series = rows[0];
  const comicTypeFilter = visibility === "all" ? "" : visibility;
  const comics = hasComicTypeColumn
    ? await sql`
        SELECT id, slug, title, comic_type, cover_image_url, status, author_name, created_at
        FROM comics
        WHERE series_id = ${series.id}
          AND (${comicTypeFilter} = '' OR comic_type = ${comicTypeFilter})
        ORDER BY title
      `
    : await sql`
        SELECT id, slug, title, cover_image_url, status, author_name, created_at
        FROM comics WHERE series_id = ${series.id} ORDER BY title
      `;

  if (hasComicTypeColumn && visibility !== "all" && comics.length === 0) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  return NextResponse.json({ ...series, comics });
}
