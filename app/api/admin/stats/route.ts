import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [comics] = await sql`SELECT COUNT(*) as count FROM comics`;
  const [chapters] = await sql`SELECT COUNT(*) as count FROM chapters`;
  const [images] = await sql`SELECT COUNT(*) as count FROM chapter_images`;
  const [series] = await sql`SELECT COUNT(*) as count FROM series`;
  const [categories] = await sql`SELECT COUNT(*) as count FROM categories`;
  const [tags] = await sql`SELECT COUNT(*) as count FROM tags`;
  const [apiKeys] = await sql`SELECT COUNT(*) as count FROM api_keys WHERE is_active = true`;

  return NextResponse.json({
    comics: parseInt(comics.count as string),
    chapters: parseInt(chapters.count as string),
    images: parseInt(images.count as string),
    series: parseInt(series.count as string),
    categories: parseInt(categories.count as string),
    tags: parseInt(tags.count as string),
    activeApiKeys: parseInt(apiKeys.count as string),
  });
}
