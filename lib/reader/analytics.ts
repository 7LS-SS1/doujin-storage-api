"use client";

import type { AnalyticsEventType } from "@/types/reader";

// ── Session ID ────────────────────────────────────────────────
const SESSION_KEY = "csr_session_id";

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function getDevice(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

// ── Analytics Tracker ─────────────────────────────────────────
interface QueuedEvent {
  event_type: AnalyticsEventType;
  comic_id?: number;
  chapter_id?: number;
  source_position?: number;
  session_id: string;
  device: string;
}

const FLUSH_DELAY = 2_000; // ms — flush after 2s of inactivity
const MAX_QUEUE = 20;
const DEDUP_WINDOW = 10_000; // ms — ignore repeated same event within 10s

class AnalyticsTracker {
  private queue: QueuedEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private recentKeys = new Map<string, number>(); // key → timestamp

  track(opts: {
    event_type: AnalyticsEventType;
    comic_id?: number;
    chapter_id?: number;
    source_position?: number;
  }): void {
    if (typeof window === "undefined") return;

    // Deduplication: skip if the same event fired recently
    const key = `${opts.event_type}:${opts.comic_id ?? ""}`;
    const last = this.recentKeys.get(key) ?? 0;
    if (Date.now() - last < DEDUP_WINDOW) return;
    this.recentKeys.set(key, Date.now());

    this.queue.push({
      ...opts,
      session_id: getOrCreateSessionId(),
      device: getDevice(),
    });

    if (this.queue.length >= MAX_QUEUE) {
      void this.flush();
      return;
    }

    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => void this.flush(), FLUSH_DELAY);
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    const events = this.queue.splice(0);
    try {
      await fetch("/api/reader/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
        keepalive: true, // fires even when page is closing
      });
    } catch {
      // Analytics failures must never break UX
    }
  }
}

// Singleton — share across all components
export const analytics = new AnalyticsTracker();
