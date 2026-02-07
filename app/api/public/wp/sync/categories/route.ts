import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireApiKey } from "@/lib/public-guard";

export async function POST(request: Request) {
  const { error } = await requireApiKey(request);
  if (error) return error;

  const categories = await sql`SELECT id, slug, name FROM categories ORDER BY name`;
  return NextResponse.json({
    mappings: categories.map((c: Record<string, unknown>) => ({
      apiId: c.id,
      slug: c.slug,
      name: c.name,
      taxonomy: "category",
    })),
  });
}
