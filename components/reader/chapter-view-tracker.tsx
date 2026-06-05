"use client";

import { useEffect } from "react";
import { getOrCreateSessionId } from "@/lib/reader/analytics";

function getDevice(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  if (window.innerWidth < 768) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
}

interface ChapterViewTrackerProps {
  comicId: string;
  chapterId: string;
}

export default function ChapterViewTracker({
  comicId,
  chapterId,
}: ChapterViewTrackerProps) {
  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    if (!sessionId) return;

    void fetch("/api/v1/events/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "chapter_view",
        comic_id: comicId,
        chapter_id: chapterId,
        session_id: sessionId,
        source: "web_reader",
        device: getDevice(),
        client_ts: new Date().toISOString(),
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [chapterId, comicId]);

  return null;
}
