import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireApiKey } from "@/lib/public-guard";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { error } = await requireApiKey(request);
  if (error) return error;

  const tags = await sql`SELECT id, slug, name FROM tags ORDER BY name`;
  return NextResponse.json({
    mappings: tags.map((t: Record<string, unknown>) => ({
      apiId: t.id,
      slug: t.slug,
      name: t.name,
      taxonomy: "post_tag",
    })),
  });
}
