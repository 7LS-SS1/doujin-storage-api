import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { generateSlug } from "@/lib/slug";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().optional(),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const rows = await sql`SELECT * FROM tags ORDER BY name`;
  return NextResponse.json({ tags: rows });
}

export async function POST(request: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const slug = parsed.data.slug || generateSlug(parsed.data.name);
  try {
    const result = await sql`
      INSERT INTO tags (slug, name) VALUES (${slug}, ${parsed.data.name}) RETURNING *
    `;
    await logAudit({ userEmail: session!.email, action: "create_tag", entityType: "tag", entityId: result[0].id });
    return NextResponse.json(result[0], { status: 201 });
  } catch {
    return NextResponse.json({ error: "Tag already exists" }, { status: 409 });
  }
}
