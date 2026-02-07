import { NextResponse } from "next/server";
import { getSession } from "./auth";

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }
  return { error: null, session };
}
