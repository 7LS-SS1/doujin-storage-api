import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const schema = z.object({
  items: z.array(
    z.object({
      id: z.union([z.string().min(1), z.number()]).transform(String),
      sortOrder: z.number(),
    })
  ),
});

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  for (const item of parsed.data.items) {
    await sql`UPDATE chapter_images SET sort_order = ${item.sortOrder} WHERE id = ${item.id}`;
  }

  return NextResponse.json({ success: true });
}
