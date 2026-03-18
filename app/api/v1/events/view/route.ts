import { sql } from "@/lib/db";
import {
  buildActorKey,
  engagementJson,
  engagementOptions,
  normalizeDevice,
  normalizeTimestamp,
  parsePrefixedId,
  sanitizeString,
} from "@/lib/engagement";

export const dynamic = "force-dynamic";

const METHODS = "POST, OPTIONS";
const DEDUPE_REASON = "duplicate_within_30m";
const SUPPORTED_EVENT = "chapter_view";

interface ViewPayload {
  event?: unknown;
  comic_id?: unknown;
  chapter_id?: unknown;
  user_id?: unknown;
  anon_id?: unknown;
  session_id?: unknown;
  source?: unknown;
  referrer?: unknown;
  locale?: unknown;
  device?: unknown;
  client_ts?: unknown;
}

export function OPTIONS() {
  return engagementOptions(METHODS);
}

export async function POST(request: Request) {
  let body: ViewPayload;

  try {
    body = (await request.json()) as ViewPayload;
  } catch {
    return engagementJson({ ok: false, error: "Invalid JSON body" }, 400, METHODS);
  }

  const event = sanitizeString(body.event, 50);
  const comicId = parsePrefixedId(body.comic_id, "comic");
  const chapterId = parsePrefixedId(body.chapter_id, "chapter");
  const userId = sanitizeString(body.user_id, 255);
  const anonId = sanitizeString(body.anon_id, 255);
  const incomingSessionId = sanitizeString(body.session_id, 100);
  const fallbackSessionId = sanitizeString(anonId ?? userId, 100);
  const storedSessionId = (incomingSessionId ?? fallbackSessionId ?? "anonymous").slice(0, 100);
  const actorKey = buildActorKey({
    userId,
    anonId,
    sessionId: incomingSessionId ?? fallbackSessionId,
  });
  const source = sanitizeString(body.source, 100) ?? "chapter_reader";
  const referrer = sanitizeString(body.referrer, 500);
  const locale = sanitizeString(body.locale, 20);
  const device = normalizeDevice(body.device);
  const clientTs = normalizeTimestamp(body.client_ts);

  if (event !== SUPPORTED_EVENT) {
    return engagementJson(
      { ok: false, error: `Unsupported event. Use "${SUPPORTED_EVENT}".` },
      400,
      METHODS
    );
  }

  if (!comicId || !chapterId) {
    return engagementJson(
      { ok: false, error: "comic_id and chapter_id are required." },
      400,
      METHODS
    );
  }

  if (!actorKey) {
    return engagementJson(
      { ok: false, error: "Provide at least one of user_id, anon_id, or session_id." },
      400,
      METHODS
    );
  }

  try {
    const chapterRows = await sql`
      SELECT ch.id::text AS id, ch.comic_id::text AS comic_id_text
      FROM chapters ch
      WHERE ch.id::text = ${chapterId}
      LIMIT 1
    `;

    if (chapterRows.length === 0) {
      return engagementJson({ ok: false, error: "Chapter not found." }, 404, METHODS);
    }

    const chapterComicId = String(chapterRows[0].comic_id_text ?? "");
    if (chapterComicId !== comicId) {
      return engagementJson(
        { ok: false, error: "chapter_id does not belong to comic_id." },
        400,
        METHODS
      );
    }

    const duplicateRows = await sql`
      SELECT id
      FROM chapter_view_events
      WHERE event_type = ${SUPPORTED_EVENT}
        AND comic_id = ${comicId}
        AND chapter_id = ${chapterId}
        AND dedupe_key = ${actorKey}
        AND counted = true
        AND created_at >= NOW() - INTERVAL '30 minutes'
      LIMIT 1
    `;

    if (duplicateRows.length > 0) {
      await sql`
        INSERT INTO chapter_view_events (
          event_type,
          comic_id,
          chapter_id,
          user_id,
          anon_id,
          session_id,
          dedupe_key,
          source,
          referrer,
          locale,
          device,
          client_ts,
          counted,
          duplicate_reason
        )
        VALUES (
          ${SUPPORTED_EVENT},
          ${comicId},
          ${chapterId},
          ${userId},
          ${anonId},
          ${storedSessionId},
          ${actorKey},
          ${source},
          ${referrer},
          ${locale},
          ${device},
          ${clientTs},
          false,
          ${DEDUPE_REASON}
        )
      `;

      return engagementJson(
        {
          ok: true,
          counted: false,
          reason: DEDUPE_REASON,
        },
        200,
        METHODS
      );
    }

    await sql`
      INSERT INTO chapter_view_events (
        event_type,
        comic_id,
        chapter_id,
        user_id,
        anon_id,
        session_id,
        dedupe_key,
        source,
        referrer,
        locale,
        device,
        client_ts,
        counted
      )
      VALUES (
        ${SUPPORTED_EVENT},
        ${comicId},
        ${chapterId},
        ${userId},
        ${anonId},
        ${storedSessionId},
        ${actorKey},
        ${source},
        ${referrer},
        ${locale},
        ${device},
        ${clientTs},
        true
      )
    `;

    const [chapterCountRows, comicCountRows, uniqueReaderRows] = await Promise.all([
      sql`
        SELECT COUNT(*)::int AS total
        FROM chapter_view_events
        WHERE event_type = ${SUPPORTED_EVENT}
          AND chapter_id = ${chapterId}
          AND counted = true
      `,
      sql`
        SELECT COUNT(*)::int AS total
        FROM chapter_view_events
        WHERE event_type = ${SUPPORTED_EVENT}
          AND comic_id = ${comicId}
          AND counted = true
      `,
      sql`
        SELECT COUNT(DISTINCT COALESCE(
          NULLIF(user_id, ''),
          NULLIF(anon_id, ''),
          NULLIF(dedupe_key, ''),
          session_id
        ))::int AS total
        FROM chapter_view_events
        WHERE event_type = ${SUPPORTED_EVENT}
          AND comic_id = ${comicId}
          AND counted = true
          AND created_at >= NOW() - INTERVAL '30 days'
      `,
    ]);

    return engagementJson(
      {
        ok: true,
        counted: true,
        stats: {
          chapter_view_count_total: Number(chapterCountRows[0]?.total ?? 0),
          comic_view_count_total: Number(comicCountRows[0]?.total ?? 0),
          comic_reader_count_unique_30d: Number(uniqueReaderRows[0]?.total ?? 0),
        },
      },
      200,
      METHODS
    );
  } catch (error) {
    console.error("[api/v1/events/view]", error);
    return engagementJson({ ok: false, error: "Internal server error" }, 500, METHODS);
  }
}
