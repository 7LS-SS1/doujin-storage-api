import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireApiKey } from "@/lib/public-guard";
import {
  comicsHaveTypeColumn,
  resolveComicVisibility,
} from "@/lib/comic-scope";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { error, client } = await requireApiKey(request);
  if (error) return error;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const hasComicTypeColumn = await comicsHaveTypeColumn();
  const visibility = hasComicTypeColumn
    ? resolveComicVisibility(client.scope, body?.comicType)
    : "all";

  if (visibility === "none") {
    return NextResponse.json({ mappings: [] });
  }

  const comicTypeFilter = visibility === "all" ? "" : visibility;
  const categories = hasComicTypeColumn
    ? await sql`
        SELECT DISTINCT c.id, c.slug, c.name
        FROM categories c
        JOIN comic_categories cc ON cc.category_id = c.id
        JOIN comics cm ON cm.id = cc.comic_id
        WHERE (${comicTypeFilter} = '' OR cm.comic_type = ${comicTypeFilter})
        ORDER BY c.name
      `
    : await sql`SELECT id, slug, name FROM categories ORDER BY name`;

  return NextResponse.json({
    mappings: categories.map((c: Record<string, unknown>) => ({
      apiId: c.id,
      slug: c.slug,
      name: c.name,
      taxonomy: "category",
    })),
  });
}
