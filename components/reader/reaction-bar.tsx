"use client";

import { useEffect, useState, useCallback } from "react";
import { getOrCreateSessionId } from "@/lib/reader/analytics";
import { analytics } from "@/lib/reader/analytics";
import type { ReactionType, ReactionCounts } from "@/types/reader";

const REACTIONS: Array<{
  type: ReactionType;
  emoji: string;
  label: string;
}> = [
  { type: "like",  emoji: "👍", label: "กดไลค์" },
  { type: "love",  emoji: "❤️", label: "ชอบ" },
  { type: "heart", emoji: "😍", label: "รักเลย" },
  { type: "bad",   emoji: "👎", label: "ห่วย" },
];

interface ReactionBarProps {
  comicId: number;
}

type Status = "idle" | "loading" | "error";

export default function ReactionBar({ comicId }: ReactionBarProps) {
  const [current, setCurrent] = useState<ReactionType | null>(null);
  const [counts, setCounts] = useState<ReactionCounts>({
    like: 0, love: 0, heart: 0, bad: 0,
  });
  const [status, setStatus] = useState<Status>("loading");

  // Fetch initial state on mount
  useEffect(() => {
    const sessionId = getOrCreateSessionId();
    if (!sessionId) { setStatus("idle"); return; }

    fetch(`/api/reader/reactions?comic_id=${comicId}&session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((data: { currentReaction: ReactionType | null; counts: ReactionCounts }) => {
        setCurrent(data.currentReaction);
        setCounts(data.counts);
        setStatus("idle");
      })
      .catch(() => setStatus("idle"));
  }, [comicId]);

  const handleReaction = useCallback(
    async (type: ReactionType) => {
      if (status === "loading") return;

      const sessionId = getOrCreateSessionId();
      if (!sessionId) return;

      // Optimistic update
      const prevCurrent = current;
      const prevCounts = { ...counts };

      setCurrent(type);
      setCounts((prev) => {
        const next = { ...prev };
        // Remove old reaction count
        if (prevCurrent && prevCurrent !== type) {
          next[prevCurrent] = Math.max(0, next[prevCurrent] - 1);
        }
        // Add new reaction (if not already this type)
        if (prevCurrent !== type) {
          next[type] = next[type] + 1;
        }
        return next;
      });

      setStatus("loading");

      // Track analytics
      analytics.track({ event_type: "reaction_click", comic_id: comicId });

      try {
        const res = await fetch("/api/reader/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comic_id: comicId,
            session_id: sessionId,
            reaction_type: type,
          }),
        });

        if (res.ok) {
          const data = await res.json() as {
            ok: boolean;
            currentReaction: ReactionType;
            counts: ReactionCounts;
          };
          setCurrent(data.currentReaction);
          setCounts(data.counts);
        } else {
          // Revert on failure
          setCurrent(prevCurrent);
          setCounts(prevCounts);
          setStatus("error");
        }
      } catch {
        setCurrent(prevCurrent);
        setCounts(prevCounts);
        setStatus("error");
      } finally {
        setStatus("idle");
      }
    },
    [comicId, counts, current, status]
  );

  const totalReactions = counts.like + counts.love + counts.heart + counts.bad;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        ความคิดเห็นของคุณ
        {totalReactions > 0 && (
          <span className="ml-1.5 text-foreground/60">
            ({totalReactions.toLocaleString("th-TH")} คน)
          </span>
        )}
      </p>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Reactions">
        {REACTIONS.map(({ type, emoji, label }) => {
          const isSelected = current === type;
          const count = counts[type];

          return (
            <button
              key={type}
              onClick={() => void handleReaction(type)}
              disabled={status === "loading"}
              aria-label={`${label}${isSelected ? " (เลือกอยู่)" : ""}`}
              aria-pressed={isSelected}
              className={`
                flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm
                font-medium transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                disabled:cursor-not-allowed disabled:opacity-60
                ${isSelected
                  ? "border-primary/60 bg-primary/15 text-foreground shadow-sm shadow-primary/20"
                  : "border-border bg-card/60 text-muted-foreground hover:border-border/80 hover:bg-card hover:text-foreground"
                }
              `}
            >
              <span role="img" aria-hidden className="text-base leading-none">
                {emoji}
              </span>
              <span className="text-xs">{label}</span>
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-px text-[10px] font-bold ${
                    isSelected
                      ? "bg-primary/30 text-primary"
                      : "bg-muted/60 text-muted-foreground"
                  }`}
                >
                  {count.toLocaleString("th-TH")}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {status === "error" && (
        <p className="text-[11px] text-destructive" role="alert">
          เกิดข้อผิดพลาด กรุณาลองใหม่
        </p>
      )}
    </div>
  );
}
