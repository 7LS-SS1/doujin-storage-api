"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Comic } from "@/types/reader";
import type { CardBadge } from "./comic-card";
import ComicCard from "./comic-card";

interface ComicRowProps {
  title: string;
  comics: Comic[];
  badge?: CardBadge;
  /** Link for "ดูทั้งหมด" button */
  seeAllHref?: string;
  emptyText?: string;
}

export default function ComicRow({
  title,
  comics,
  badge,
  seeAllHref,
  emptyText = "ยังไม่มีการ์ตูนในหมวดนี้",
}: ComicRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === "right" ? amount : -amount, behavior: "smooth" });
  }

  return (
    <section className="space-y-3">
      {/* Row header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground sm:text-lg">{title}</h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            ดูทั้งหมด
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {comics.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="group/row relative">
          {/* Left arrow (desktop) */}
          <button
            onClick={() => scroll("left")}
            aria-label="เลื่อนซ้าย"
            className="absolute -left-4 top-1/3 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-background/80 p-1.5 text-foreground shadow-lg ring-1 ring-border/60 backdrop-blur-sm transition-all hover:bg-accent group-hover/row:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Scroll container */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {comics.map((comic, i) => (
              <div key={comic.id} className="snap-start">
                <ComicCard comic={comic} badge={badge} position={i} />
              </div>
            ))}
          </div>

          {/* Right arrow (desktop) */}
          <button
            onClick={() => scroll("right")}
            aria-label="เลื่อนขวา"
            className="absolute -right-4 top-1/3 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-background/80 p-1.5 text-foreground shadow-lg ring-1 ring-border/60 backdrop-blur-sm transition-all hover:bg-accent group-hover/row:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </section>
  );
}
