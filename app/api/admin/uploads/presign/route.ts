import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { generatePresignedUrl, validateFile } from "@/lib/r2";
import { z } from "zod";

const itemSchema = z.object({
  fileName: z.string(),
  contentType: z.string(),
  size: z.number(),
  targetType: z.enum(["cover", "chapterPage"]),
  comicSlug: z.string(),
  chapterId: z.number().optional(),
  sortOrder: z.number().optional(),
});

const schema = z.array(itemSchema).min(1).max(100);

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const results = [];
  for (const item of parsed.data) {
    const validationError = validateFile(item.contentType, item.size);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const presigned = await generatePresignedUrl({
      contentType: item.contentType,
      targetType: item.targetType,
      comicSlug: item.comicSlug,
      chapterId: item.chapterId,
      sortOrder: item.sortOrder,
    });

    results.push(presigned);
  }

  return NextResponse.json(results);
}
