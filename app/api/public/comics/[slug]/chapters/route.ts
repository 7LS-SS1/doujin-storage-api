import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireApiKey } from "@/lib/public-guard";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { error } = await requireApiKey(request);
  if (error) return error;

  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "50")));
  const offset = (page - 1) * pageSize;

  const comic = await sql`SELECT id FROM comics WHERE slug = ${slug}`;
  if (comic.length === 0) {
    return NextResponse.json({ error: "Comic not found" }, { status: 404 });
  }

  const chapters = await sql`
    SELECT id, number, title, published_at, created_at FROM chapters
    WHERE comic_id = ${comic[0].id} ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
  `;

  const countResult = await sql`SELECT COUNT(*) as total FROM chapters WHERE comic_id = ${comic[0].id}`;

  return NextResponse.json({
    chapters,
    total: parseInt(countResult[0].total as string),
    page,
    pageSize,
  });
}
