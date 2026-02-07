import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "50")));
  const offset = (page - 1) * pageSize;

  const rows = await sql`
    SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ${pageSize} OFFSET ${offset}
  `;
  const countResult = await sql`SELECT COUNT(*) as total FROM audit_logs`;

  return NextResponse.json({
    logs: rows,
    total: parseInt(countResult[0].total as string),
    page,
    pageSize,
  });
}
