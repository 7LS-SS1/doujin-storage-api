import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { generateApiKey } from "@/lib/api-key";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(255),
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const rows = await sql`
    SELECT id, name, key_prefix, is_active, last_used_at, created_at FROM api_keys ORDER BY created_at DESC
  `;
  return NextResponse.json({ apiKeys: rows });
}

export async function POST(request: Request) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { raw, hash, prefix } = generateApiKey();

  const result = await sql`
    INSERT INTO api_keys (name, key_hash, key_prefix) VALUES (${parsed.data.name}, ${hash}, ${prefix}) RETURNING id, name, key_prefix, is_active, created_at
  `;

  await logAudit({ userEmail: session!.email, action: "create_api_key", entityType: "api_key", entityId: result[0].id });

  return NextResponse.json({ ...result[0], key: raw }, { status: 201 });
}
