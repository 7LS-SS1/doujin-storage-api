import { sql } from "@/lib/db";
import {
  engagementJson,
  engagementOptions,
  normalizeTimestamp,
  parsePrefixedId,
  sanitizeString,
} from "@/lib/engagement";

export const dynamic = "force-dynamic";

const METHODS = "POST, DELETE, OPTIONS";

interface LikePayload {
  action?: unknown;
  user_id?: unknown;
  client_ts?: unknown;
  source?: unknown;
}

export function OPTIONS() {
  return engagementOptions(METHODS);
}

async function resolveComicId(rawId: string) {
  const comicId = parsePrefixedId(rawId, "comic");
  if (!comicId) {
    return { comicId: null, exists: false };
  }

  const rows = await sql`
    SELECT id::text AS id
    FROM comics
    WHERE id::text = ${comicId}
    LIMIT 1
  `;

  return {
    comicId,
    exists: rows.length > 0,
  };
}

async function getLikeCount(comicId: number) {
  const rows = await sql`
    SELECT COUNT(*)::int AS total
    FROM comic_likes
    WHERE comic_id = ${comicId}
  `;

  return Number(rows[0]?.total ?? 0);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: LikePayload;

  try {
    body = (await request.json()) as LikePayload;
  } catch {
    return engagementJson({ ok: false, error: "Invalid JSON body" }, 400, METHODS);
  }

  const { comicId, exists } = await resolveComicId(id);
  if (!comicId) {
    return engagementJson({ ok: false, error: "Invalid comic id." }, 400, METHODS);
  }
  if (!exists) {
    return engagementJson({ ok: false, error: "Comic not found." }, 404, METHODS);
  }

  const action = sanitizeString(body.action, 20);
  const userId = sanitizeString(body.user_id, 255);
  const source = sanitizeString(body.source, 100);
  const clientTs = normalizeTimestamp(body.client_ts);

  if (action !== "like") {
    return engagementJson({ ok: false, error: 'action must be "like".' }, 400, METHODS);
  }

  if (!userId) {
    return engagementJson({ ok: false, error: "user_id is required." }, 400, METHODS);
  }

  try {
    await sql`
      INSERT INTO comic_likes (
        comic_id,
        user_id,
        source,
        client_ts
      )
      VALUES (
        ${comicId},
        ${userId},
        ${source},
        ${clientTs}
      )
      ON CONFLICT (comic_id, user_id)
      DO UPDATE
      SET
        source = COALESCE(EXCLUDED.source, comic_likes.source),
        client_ts = COALESCE(EXCLUDED.client_ts, comic_likes.client_ts),
        updated_at = NOW()
    `;

    return engagementJson(
      {
        ok: true,
        liked: true,
        stats: {
          like_count: await getLikeCount(comicId),
        },
      },
      200,
      METHODS
    );
  } catch (error) {
    console.error("[api/v1/comics/:id/likes POST]", error);
    return engagementJson({ ok: false, error: "Internal server error" }, 500, METHODS);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: LikePayload;

  try {
    body = (await request.json()) as LikePayload;
  } catch {
    return engagementJson({ ok: false, error: "Invalid JSON body" }, 400, METHODS);
  }

  const { comicId, exists } = await resolveComicId(id);
  if (!comicId) {
    return engagementJson({ ok: false, error: "Invalid comic id." }, 400, METHODS);
  }
  if (!exists) {
    return engagementJson({ ok: false, error: "Comic not found." }, 404, METHODS);
  }

  const userId = sanitizeString(body.user_id, 255);
  if (!userId) {
    return engagementJson({ ok: false, error: "user_id is required." }, 400, METHODS);
  }

  try {
    await sql`
      DELETE FROM comic_likes
      WHERE comic_id = ${comicId}
        AND user_id = ${userId}
    `;

    return engagementJson(
      {
        ok: true,
        liked: false,
        stats: {
          like_count: await getLikeCount(comicId),
        },
      },
      200,
      METHODS
    );
  } catch (error) {
    console.error("[api/v1/comics/:id/likes DELETE]", error);
    return engagementJson({ ok: false, error: "Internal server error" }, 500, METHODS);
  }
}
