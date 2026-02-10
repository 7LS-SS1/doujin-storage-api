import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import { tableHasColumn } from "@/lib/db-schema";

export const dynamic = 'force-dynamic';

const schema = z.object({
  chapterId: z.union([z.string().min(1), z.number()]).optional(),
  comicId: z.union([z.string().min(1), z.number()]).optional(),
  items: z.array(
    z.object({
      objectKey: z.string(),
      publicUrl: z.string(),
      sortOrder: z.number().default(0),
      width: z.number().optional(),
      height: z.number().optional(),
    })
  ),
});

export async function POST(request: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const { chapterId, comicId, items } = parsed.data;

  if (chapterId) {
    // Chapter images
    const hasObjectKey = await tableHasColumn("chapter_images", "object_key");
    for (const item of items) {
      if (hasObjectKey) {
        await sql`
          INSERT INTO chapter_images (chapter_id, image_url, object_key, sort_order, width, height)
          VALUES (${chapterId}, ${item.publicUrl}, ${item.objectKey}, ${item.sortOrder}, ${item.width ?? null}, ${item.height ?? null})
        `;
      } else {
        await sql`
          INSERT INTO chapter_images (chapter_id, image_url, sort_order, width, height)
          VALUES (${chapterId}, ${item.publicUrl}, ${item.sortOrder}, ${item.width ?? null}, ${item.height ?? null})
        `;
      }
    }
    await logAudit({
      userEmail: session!.email,
      action: "upload_chapter_images",
      entityType: "chapter",
      entityId: chapterId,
      details: { count: items.length },
    });
  } else if (comicId && items.length > 0) {
    // Cover image
    const item = items[0];
    await sql`
      UPDATE comics SET cover_image_url = ${item.publicUrl}, cover_object_key = ${item.objectKey}, updated_at = NOW()
      WHERE id = ${comicId}
    `;
    await logAudit({
      userEmail: session!.email,
      action: "upload_cover",
      entityType: "comic",
      entityId: comicId,
    });
  }

  return NextResponse.json({ success: true });
}
