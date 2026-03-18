import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

const VALID_EVENTS = new Set([
  "chapter_view",
  "page_view",
  "hero_click",
  "card_click",
  "read_click",
  "reaction_click",
]);

interface IncomingEvent {
  event_type: string;
  comic_id?: number;
  chapter_id?: number;
  session_id: string;
  source_position?: number;
  device?: string;
}

// POST /api/reader/analytics
// No auth required — internal reader endpoint.
// Body: { events: IncomingEvent[] }
export async function POST(request: Request) {
  try {
    const body = await request.json() as { events?: IncomingEvent[] };
    const rawEvents = body.events;

    if (!Array.isArray(rawEvents) || rawEvents.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const events = rawEvents
      .filter(
        (e) =>
          typeof e.event_type === "string" &&
          VALID_EVENTS.has(e.event_type) &&
          typeof e.session_id === "string" &&
          e.session_id.length > 0 &&
          e.session_id.length <= 100
      )
      .slice(0, 50); // hard cap per batch

    for (const e of events) {
      await sql`
        INSERT INTO analytics_events
          (event_type, comic_id, chapter_id, session_id, source_position, device)
        VALUES (
          ${e.event_type},
          ${typeof e.comic_id === "number" ? e.comic_id : null},
          ${typeof e.chapter_id === "number" ? e.chapter_id : null},
          ${e.session_id},
          ${typeof e.source_position === "number" ? e.source_position : null},
          ${typeof e.device === "string" ? e.device.slice(0, 20) : null}
        )
      `;
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Silently succeed — analytics must never return errors that break client code
    return NextResponse.json({ ok: true });
  }
}
