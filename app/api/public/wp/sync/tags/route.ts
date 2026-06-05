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
    mappings: tags.map((t: Record<string, unknown>) => ({
      apiId: t.id,
      slug: t.slug,
      name: t.name,
      taxonomy: "post_tag",
    })),
  });
}
