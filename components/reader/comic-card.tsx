"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { Comic } from "@/types/reader";
import { analytics } from "@/lib/reader/analytics";

const STATUS_LABEL: Record<string, string> = {
  ongoing: "กำลังดำเนิน",
  completed: "จบแล้ว",
  hiatus: "หยุดชั่วคราว",
};

const STATUS_COLOR: Record<string, string> = {
  ongoing: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  hiatus: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export type CardBadge = "มาใหม่" | "HOT" | "อัปเดต" | null;

interface ComicCardProps {
  comic: Comic;
  badge?: CardBadge;
  position?: number;
  /** 'new' | 'trending' | 'ongoing' | 'completed' — the row it appears in */
  source?: string;
}

export default function ComicCard({
  comic,
  badge,
  position,
  source,
}: ComicCardProps) {
  const href = `/comic/${comic.slug}`;

  function handleClick() {
    analytics.track({
      event_type: "card_click",
      comic_id: comic.id,
      source_position: position,
    });
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className="group relative flex w-[140px] shrink-0 flex-col sm:w-[160px]"
      aria-label={`อ่าน ${comic.title}`}
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-card shadow-lg ring-1 ring-white/5 transition-all duration-300 group-hover:ring-primary/40 group-hover:shadow-primary/10">
        {comic.cover_image_url ? (
          <Image
            src={comic.cover_image_url}
            alt={comic.title}
            fill
            sizes="(max-width: 640px) 140px, 160px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-card to-accent/30 p-2">
            <BookOpen className="h-8 w-8 text-muted-foreground/40" />
            <span className="line-clamp-3 text-center text-[10px] leading-tight text-muted-foreground/60">
              {comic.title}
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Top-left badge */}
        {badge && (
          <div
            className={`absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
              badge === "HOT"
                ? "bg-orange-500 text-white"
                : badge === "มาใหม่"
                ? "bg-primary text-primary-foreground"
                : "bg-sky-500 text-white"
            }`}
          >
            {badge}
          </div>
        )}

        {/* Bottom hover CTA */}
        <div className="absolute inset-x-0 bottom-0 flex translate-y-1 items-center justify-center pb-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-lg">
            อ่านเลย
          </span>
        </div>
      </div>

      {/* Title + meta */}
      <div className="mt-2 px-0.5">
        <p className="line-clamp-2 text-[12px] font-medium leading-tight text-foreground transition-colors group-hover:text-primary">
          {comic.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {comic.author_name && (
            <span className="text-[10px] text-muted-foreground/70">
              {comic.author_name}
            </span>
          )}
          {comic.status && (
            <span
              className={`inline-flex rounded border px-1 py-px text-[9px] font-semibold ${
                STATUS_COLOR[comic.status] ?? STATUS_COLOR.ongoing
              }`}
            >
              {STATUS_LABEL[comic.status] ?? comic.status}
            </span>
          )}
        </div>
        {typeof comic.chapter_count === "number" &&
          comic.chapter_count > 0 && (
            <p className="mt-0.5 text-[10px] text-muted-foreground/60">
              {comic.chapter_count} ตอน
            </p>
          )}
      </div>
    </Link>
  );
}
