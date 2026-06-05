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
  const requestedComicType =
    searchParams.get("comicType") || searchParams.get("type") || "";
  const hasComicTypeColumn = await comicsHaveTypeColumn();
  const visibility = hasComicTypeColumn
    ? resolveComicVisibility(client.scope, requestedComicType)
    : "all";

  if (visibility === "none") {
    return NextResponse.json({ categories: [], tags: [] });
  }

  const comicTypeFilter = visibility === "all" ? "" : visibility;
  const categories = hasComicTypeColumn
    ? await sql`
        SELECT DISTINCT cat.id, cat.slug, cat.name
        FROM categories cat
        JOIN comic_categories cc ON cc.category_id = cat.id
        JOIN comics c ON c.id = cc.comic_id
        WHERE (${comicTypeFilter} = '' OR c.comic_type = ${comicTypeFilter})
        ORDER BY cat.name
      `
    : await sql`SELECT id, slug, name FROM categories ORDER BY name`;
  const tags = hasComicTypeColumn
    ? await sql`
        SELECT DISTINCT t.id, t.slug, t.name
        FROM tags t
        JOIN comic_tags ct ON ct.tag_id = t.id
        JOIN comics c ON c.id = ct.comic_id
        WHERE (${comicTypeFilter} = '' OR c.comic_type = ${comicTypeFilter})
        ORDER BY t.name
      `
    : await sql`SELECT id, slug, name FROM tags ORDER BY name`;

  return NextResponse.json({
    categories: categories.map((c: Record<string, unknown>) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      taxonomy: "category",
    })),
    tags: tags.map((t: Record<string, unknown>) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      taxonomy: "post_tag",
    })),
  });
}
