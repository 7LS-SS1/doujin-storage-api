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
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, client } = await requireApiKey(request);
  if (error) return error;

  const { id } = await params;
  const chapterId = id;
  const { searchParams } = new URL(request.url);
  const requestedComicType =
    searchParams.get("comicType") || searchParams.get("type") || "";
  const hasComicTypeColumn = await comicsHaveTypeColumn();
  const visibility = hasComicTypeColumn
    ? resolveComicVisibility(client.scope, requestedComicType)
    : "all";

  if (visibility === "none") {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  const comicTypeFilter = visibility === "all" ? "" : visibility;
  const rows = hasComicTypeColumn
    ? await sql`
        SELECT ch.*, c.slug as comic_slug, c.title as comic_title
        FROM chapters ch JOIN comics c ON ch.comic_id = c.id
        WHERE ch.id = ${chapterId}
          AND (${comicTypeFilter} = '' OR c.comic_type = ${comicTypeFilter})
      `
    : await sql`
        SELECT ch.*, c.slug as comic_slug, c.title as comic_title
        FROM chapters ch JOIN comics c ON ch.comic_id = c.id
        WHERE ch.id = ${chapterId}
      `;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  const chapter = rows[0];

  const images = await sql`
    SELECT id, image_url, sort_order, width, height FROM chapter_images
    WHERE chapter_id = ${chapterId} ORDER BY sort_order ASC
  `;

  // Get previous and next chapter IDs
  const prevChapter = await sql`
    SELECT id FROM chapters
    WHERE comic_id = ${chapter.comic_id} AND created_at < ${chapter.created_at}
    ORDER BY created_at DESC LIMIT 1
  `;

  const nextChapter = await sql`
    SELECT id FROM chapters
    WHERE comic_id = ${chapter.comic_id} AND created_at > ${chapter.created_at}
    ORDER BY created_at ASC LIMIT 1
  `;

  return NextResponse.json({
    ...chapter,
    images,
    comic: { slug: chapter.comic_slug, title: chapter.comic_title },
    previousChapterId: prevChapter.length > 0 ? prevChapter[0].id : null,
    nextChapterId: nextChapter.length > 0 ? nextChapter[0].id : null,
  });
}
