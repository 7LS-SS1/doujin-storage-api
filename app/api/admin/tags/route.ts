import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { generateSlug } from "@/lib/slug";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const singleSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().optional(),
});

const bulkSchema = z.object({
  names: z.array(z.string().min(1).max(255)).min(1).max(200),
});

const schema = z.union([singleSchema, bulkSchema]);

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

  if ("names" in parsed.data) {
    const normalized = new Map<string, string>();
    let invalidCount = 0;

    for (const rawName of parsed.data.names) {
      const name = rawName.trim();
      if (!name) {
        invalidCount += 1;
        continue;
      }
      const slug = generateSlug(name);
      if (!slug) {
        invalidCount += 1;
        continue;
      }
      if (!normalized.has(slug)) {
        normalized.set(slug, name);
      }
    }

    const candidates = Array.from(normalized.entries()).map(([slug, name]) => ({ slug, name }));
    if (candidates.length === 0) {
      return NextResponse.json(
        { error: "No valid tags to create" },
        { status: 400 }
      );
    }

    const created: Record<string, unknown>[] = [];
    const skipped: string[] = [];

    for (const item of candidates) {
      const result = await sql`
        INSERT INTO tags (slug, name)
        VALUES (${item.slug}, ${item.name})
        ON CONFLICT (slug) DO NOTHING
        RETURNING *
      `;
      if (result.length > 0) {
        created.push(result[0]);
      } else {
        skipped.push(item.name);
      }
    }

    await logAudit({
      userEmail: session!.email,
      action: "create_tags_bulk",
      entityType: "tag",
      details: {
        requested: parsed.data.names.length,
        created: created.length,
        skipped: skipped.length,
        invalid: invalidCount,
      },
    });

    return NextResponse.json(
      {
        created,
        createdCount: created.length,
        skippedCount: skipped.length,
        invalidCount,
        skipped,
      },
      { status: created.length > 0 ? 201 : 200 }
    );
  }

  const slug = parsed.data.slug || generateSlug(parsed.data.name);
  if (!slug) {
    return NextResponse.json({ error: "Invalid tag name or slug" }, { status: 400 });
  }

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
