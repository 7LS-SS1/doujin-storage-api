"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, Info } from "lucide-react";
import type { Comic } from "@/types/reader";
import { analytics } from "@/lib/reader/analytics";

type Tab = "new" | "trending";

const STATUS_LABEL: Record<string, string> = {
  ongoing: "กำลังดำเนิน",
  completed: "จบแล้ว",
  hiatus: "หยุดชั่วคราว",
};

const STATUS_COLOR: Record<string, string> = {
  ongoing: "bg-emerald-500/30 text-emerald-300 border-emerald-400/40",
  completed: "bg-blue-500/30 text-blue-300 border-blue-400/40",
  hiatus: "bg-amber-500/30 text-amber-300 border-amber-400/40",
};

interface HeroSectionProps {
  newComics: Comic[];
  trendingComics: Comic[];
}

const AUTO_ROTATE_MS = 6_000;
const FEATURED_COUNT = 5; // max comics shown in thumbnail strip

export default function HeroSection({ newComics, trendingComics }: HeroSectionProps) {
  const [activeTab, setActiveTab] = useState<Tab>("new");
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const currentList = activeTab === "new" ? newComics : trendingComics;
  const featured = currentList.slice(0, FEATURED_COUNT);
  const comic = featured[activeIndex] ?? featured[0];

  const goTo = useCallback(
    (index: number, fromInteraction = false) => {
      if (index === activeIndex) return;
      setTransitioning(true);
      setTimeout(() => {
        setActiveIndex(index);
        setTransitioning(false);
      }, 200);
      if (fromInteraction) setPaused(true);
    },
    [activeIndex]
  );

  const goNext = useCallback(() => {
    if (featured.length <= 1) return;
    goTo((activeIndex + 1) % featured.length, true);
  }, [activeIndex, featured.length, goTo]);

  const goPrev = useCallback(() => {
    if (featured.length <= 1) return;
    goTo((activeIndex - 1 + featured.length) % featured.length, true);
  }, [activeIndex, featured.length, goTo]);

  // Auto-rotate
  useEffect(() => {
    if (paused || featured.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % featured.length);
    }, AUTO_ROTATE_MS);
    return () => clearInterval(id);
  }, [paused, featured.length]);

  // Reset index when tab changes
  function switchTab(tab: Tab) {
    setActiveTab(tab);
    setActiveIndex(0);
    setPaused(false);
  }

  function handleHeroClick() {
    if (!comic) return;
    analytics.track({
      event_type: "hero_click",
      comic_id: comic.id,
      source_position: activeIndex,
    });
  }

  if (!comic) return null;

  const comicUrl = `/comic/${comic.slug}`;
  const descriptionExcerpt = comic.description
    ? comic.description.slice(0, 180) + (comic.description.length > 180 ? "…" : "")
    : null;

  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "clamp(380px, 60vh, 620px)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Background image ───────────────────────────────────── */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          transitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        {comic.cover_image_url ? (
          <Image
            src={comic.cover_image_url}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center blur-sm brightness-50 scale-105"
            aria-hidden
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-card via-accent/20 to-background" />
        )}
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="relative flex h-full flex-col px-4 pb-8 pt-6 md:px-8 lg:px-14">
        <div className="mx-auto w-full max-w-7xl flex-1">

          {/* Tabs */}
          <div className="mb-6 flex gap-2" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === "new"}
              onClick={() => switchTab("new")}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                activeTab === "new"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-white/10 text-foreground/70 hover:bg-white/15 hover:text-foreground"
              }`}
            >
              ✨ มาใหม่
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "trending"}
              onClick={() => switchTab("trending")}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                activeTab === "trending"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-white/10 text-foreground/70 hover:bg-white/15 hover:text-foreground"
              }`}
            >
              🔥 ยอดนิยมสัปดาห์นี้
            </button>
          </div>

          {/* Featured comic info */}
          <div
            className={`flex flex-col gap-5 transition-all duration-300 sm:flex-row sm:items-end ${
              transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
            }`}
          >
            {/* Cover thumbnail */}
            <Link
              href={comicUrl}
              onClick={handleHeroClick}
              className="relative shrink-0 overflow-hidden rounded-xl shadow-2xl ring-2 ring-white/10 transition-transform hover:scale-105"
              style={{ width: "clamp(110px, 18vw, 160px)", aspectRatio: "3/4" }}
              aria-label={`ดูรายละเอียด ${comic.title}`}
            >
              {comic.cover_image_url ? (
                <Image
                  src={comic.cover_image_url}
                  alt={comic.title}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-card">
                  <span className="text-3xl">📚</span>
                </div>
              )}
            </Link>

            {/* Text info */}
            <div className="max-w-lg space-y-2.5 sm:max-w-xl">
              {/* Status + categories */}
              <div className="flex flex-wrap items-center gap-2">
                {comic.status && (
                  <span
                    className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold ${
                      STATUS_COLOR[comic.status] ?? STATUS_COLOR.ongoing
                    }`}
                  >
                    {STATUS_LABEL[comic.status] ?? comic.status}
                  </span>
                )}
                {comic.categories?.slice(0, 2).map((cat) => (
                  <span
                    key={cat.id}
                    className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-medium text-foreground/70"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h2 className="text-xl font-extrabold leading-tight text-foreground drop-shadow-sm sm:text-2xl md:text-3xl lg:text-4xl">
                {comic.title}
              </h2>

              {/* Author */}
              {comic.author_name && (
                <p className="text-xs text-muted-foreground sm:text-sm">
                  โดย {comic.author_name}
                  {typeof comic.chapter_count === "number" && comic.chapter_count > 0 && (
                    <span className="ml-2 text-muted-foreground/60">
                      · {comic.chapter_count} ตอน
                    </span>
                  )}
                </p>
              )}

              {/* Description */}
              {descriptionExcerpt && (
                <p className="hidden text-sm leading-relaxed text-foreground/70 sm:line-clamp-2 md:line-clamp-3">
                  {descriptionExcerpt}
                </p>
              )}

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href={comicUrl}
                  onClick={handleHeroClick}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Play className="h-4 w-4 fill-current" />
                  อ่านเลย
                </Link>
                <Link
                  href={comicUrl}
                  className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Info className="h-4 w-4" />
                  รายละเอียด
                </Link>
              </div>
            </div>
          </div>

          {/* ── Thumbnail strip + navigation ─────────────────── */}
          {featured.length > 1 && (
            <div className="mt-6 flex items-center gap-3">
              {/* Prev */}
              <button
                onClick={goPrev}
                aria-label="ก่อนหน้า"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-foreground/70 transition-all hover:bg-white/20 hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Thumbnails */}
              <div className="flex gap-2 overflow-hidden">
                {featured.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => goTo(i, true)}
                    aria-label={`เลือก ${c.title}`}
                    aria-current={i === activeIndex}
                    className={`relative h-14 w-10 shrink-0 overflow-hidden rounded-md ring-1 transition-all duration-200 sm:h-16 sm:w-12 ${
                      i === activeIndex
                        ? "ring-primary shadow-lg shadow-primary/30 scale-110"
                        : "ring-white/10 opacity-60 hover:opacity-90"
                    }`}
                  >
                    {c.cover_image_url ? (
                      <Image
                        src={c.cover_image_url}
                        alt={c.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-card text-xs">
                        📚
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Next */}
              <button
                onClick={goNext}
                aria-label="ถัดไป"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-foreground/70 transition-all hover:bg-white/20 hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Dots */}
              <div className="ml-1 flex items-center gap-1" role="presentation">
                {featured.map((_, i) => (
                  <span
                    key={i}
                    className={`inline-block rounded-full transition-all duration-300 ${
                      i === activeIndex
                        ? "h-1.5 w-4 bg-primary"
                        : "h-1.5 w-1.5 bg-white/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
