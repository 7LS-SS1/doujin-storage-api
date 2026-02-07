import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireApiKey } from "@/lib/public-guard";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { error } = await requireApiKey(request);
  if (error) return error;

  const categories = await sql`SELECT id, slug, name FROM categories ORDER BY name`;
  const tags = await sql`SELECT id, slug, name FROM tags ORDER BY name`;

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
