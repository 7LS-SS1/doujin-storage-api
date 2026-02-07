import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { generateSlug } from "@/lib/slug";
import { z } from "zod";

const seriesSchema = z.object({
  title: z.string().min(1).max(500),
  slug: z.string().optional(),
  description: z.string().optional(),
});

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  let rows;
  if (search) {
    rows = await sql`
      SELECT s.*, (SELECT COUNT(*) FROM comics WHERE series_id = s.id) as comic_count
      FROM series s WHERE s.title ILIKE ${"%" + search + "%"} ORDER BY s.title
    `;
  } else {
    rows = await sql`
      SELECT s.*, (SELECT COUNT(*) FROM comics WHERE series_id = s.id) as comic_count
      FROM series s ORDER BY s.title
    `;
  }
  return NextResponse.json({ series: rows });
}

export async function POST(request: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = seriesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const slug = data.slug || generateSlug(data.title);

    const result = await sql`
      INSERT INTO series (slug, title, description)
      VALUES (${slug}, ${data.title}, ${data.description ?? null})
      RETURNING *
    `;

    await logAudit({ userEmail: session!.email, action: "create_series", entityType: "series", entityId: result[0].id });
    return NextResponse.json(result[0], { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("unique") || message.includes("duplicate")) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
