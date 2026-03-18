import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_REACTIONS = new Set(["like", "love", "heart", "bad"]);

// GET /api/reader/reactions?comic_id=&session_id=
// Returns { currentReaction, counts }
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const comicId = parseInt(searchParams.get("comic_id") ?? "0");
  const sessionId = (searchParams.get("session_id") ?? "").slice(0, 100);

  if (!comicId || comicId < 1) {
    return NextResponse.json({ error: "Missing comic_id" }, { status: 400 });
  }

  const [countsRows, userRow] = await Promise.all([
    sql`
      SELECT reaction_type, COUNT(*) AS count
      FROM comic_reactions
      WHERE comic_id = ${comicId}
      GROUP BY reaction_type
    `,
    sessionId
      ? sql`
          SELECT reaction_type FROM comic_reactions
          WHERE comic_id = ${comicId} AND session_id = ${sessionId}
          LIMIT 1
        `
      : Promise.resolve([]),
  ]);

  const counts = { like: 0, love: 0, heart: 0, bad: 0 };
  for (const row of countsRows) {
    const key = row.reaction_type as keyof typeof counts;
    if (key in counts) counts[key] = parseInt(row.count as string, 10);
  }

  const currentReaction =
    (userRow[0]?.reaction_type as string | undefined) ?? null;

  return NextResponse.json({ currentReaction, counts });
}

// POST /api/reader/reactions
// Body: { comic_id, session_id, reaction_type }
// Returns { ok, currentReaction, counts }
export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      comic_id?: unknown;
      session_id?: unknown;
      reaction_type?: unknown;
    };

    const comicId = typeof body.comic_id === "number" ? body.comic_id : 0;
    const sessionId =
      typeof body.session_id === "string" ? body.session_id.slice(0, 100) : "";
    const reactionType =
      typeof body.reaction_type === "string" ? body.reaction_type : "";

    if (!comicId || !sessionId || !reactionType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!VALID_REACTIONS.has(reactionType)) {
      return NextResponse.json(
        { error: "Invalid reaction type" },
        { status: 400 }
      );
    }

    // Upsert — one reaction per session per comic
    await sql`
      INSERT INTO comic_reactions (comic_id, session_id, reaction_type)
      VALUES (${comicId}, ${sessionId}, ${reactionType})
      ON CONFLICT (comic_id, session_id)
      DO UPDATE SET reaction_type = ${reactionType}, updated_at = NOW()
    `;

    // Return fresh counts
    const countsRows = await sql`
      SELECT reaction_type, COUNT(*) AS count
      FROM comic_reactions
      WHERE comic_id = ${comicId}
      GROUP BY reaction_type
    `;

    const counts = { like: 0, love: 0, heart: 0, bad: 0 };
    for (const row of countsRows) {
      const key = row.reaction_type as keyof typeof counts;
      if (key in counts) counts[key] = parseInt(row.count as string, 10);
    }

    return NextResponse.json({ ok: true, currentReaction: reactionType, counts });
  } catch (error) {
    console.error("[reactions POST]", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
