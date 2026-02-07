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

  const rows = await sql`SELECT * FROM series WHERE slug = ${slug}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  const series = rows[0];
  const comics = await sql`
    SELECT id, slug, title, cover_image_url, status, author_name, created_at
    FROM comics WHERE series_id = ${series.id} ORDER BY title
  `;

  return NextResponse.json({ ...series, comics });
}
