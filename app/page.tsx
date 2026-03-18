// ============================================================
// Comic Reader — Homepage (Server Component)
//
// Data is fetched directly from the database.
// Interactive sections (Hero tabs, Row arrows, Reactions)
// are delegated to Client Components.
// ============================================================

import { Suspense } from "react";
import { sql } from "@/lib/db";
import type { Comic } from "@/types/reader";
import SiteNav from "@/components/reader/site-nav";
import HeroSection from "@/components/reader/hero-section";
import ComicRow from "@/components/reader/comic-row";
import { HeroSkeleton, ComicRowSkeleton } from "@/components/reader/skeletons";

// ── Data Fetchers ─────────────────────────────────────────────

async function getNewComics(): Promise<Comic[]> {
  try {
    const rows = await sql`
      SELECT
        c.id, c.slug, c.title, c.author_name, c.status,
        c.cover_image_url, c.created_at, c.updated_at,
        (SELECT COUNT(*) FROM chapters ch WHERE ch.comic_id = c.id)::int AS chapter_count
      FROM comics c
      ORDER BY c.created_at DESC
      LIMIT 20
    `;
    return rows as unknown as Comic[];
  } catch {
    return [];
  }
}

async function getTrendingComics(): Promise<Comic[]> {
  // Try analytics-based trending first
  try {
    const rows = await sql`
      SELECT
        c.id, c.slug, c.title, c.author_name, c.status,
        c.cover_image_url, c.created_at, c.updated_at,
        COUNT(ae.id)::int AS view_count,
        (SELECT COUNT(*) FROM chapters ch WHERE ch.comic_id = c.id)::int AS chapter_count
      FROM comics c
      LEFT JOIN analytics_events ae
        ON ae.comic_id = c.id
        AND ae.event_type = 'page_view'
        AND ae.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY c.id
      ORDER BY view_count DESC, c.updated_at DESC
      LIMIT 20
    `;
    return rows as unknown as Comic[];
  } catch {
    // Fallback: analytics table may not exist yet
    try {
      const rows = await sql`
        SELECT
          c.id, c.slug, c.title, c.author_name, c.status,
          c.cover_image_url, c.created_at, c.updated_at,
          0 AS view_count,
          (SELECT COUNT(*) FROM chapters ch WHERE ch.comic_id = c.id)::int AS chapter_count
        FROM comics c
        ORDER BY c.updated_at DESC
        LIMIT 20
      `;
      return rows as unknown as Comic[];
    } catch {
      return [];
    }
  }
}

async function getOngoingComics(): Promise<Comic[]> {
  try {
    const rows = await sql`
      SELECT
        c.id, c.slug, c.title, c.author_name, c.status,
        c.cover_image_url, c.created_at, c.updated_at,
        (SELECT COUNT(*) FROM chapters ch WHERE ch.comic_id = c.id)::int AS chapter_count
      FROM comics c
      WHERE c.status = 'ongoing'
      ORDER BY c.updated_at DESC
      LIMIT 20
    `;
    return rows as unknown as Comic[];
  } catch {
    return [];
  }
}

async function getCompletedComics(): Promise<Comic[]> {
  try {
    const rows = await sql`
      SELECT
        c.id, c.slug, c.title, c.author_name, c.status,
        c.cover_image_url, c.created_at, c.updated_at,
        (SELECT COUNT(*) FROM chapters ch WHERE ch.comic_id = c.id)::int AS chapter_count
      FROM comics c
      WHERE c.status = 'completed'
      ORDER BY c.updated_at DESC
      LIMIT 20
    `;
    return rows as unknown as Comic[];
  } catch {
    return [];
  }
}

// ── Page ──────────────────────────────────────────────────────

export default async function HomePage() {
  const [newComics, trendingComics, ongoingComics, completedComics] =
    await Promise.all([
      getNewComics(),
      getTrendingComics(),
      getOngoingComics(),
      getCompletedComics(),
    ]);

  const hasContent =
    newComics.length > 0 ||
    trendingComics.length > 0 ||
    ongoingComics.length > 0 ||
    completedComics.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection newComics={newComics} trendingComics={trendingComics} />
      </Suspense>

      {/* ── Comic rows ────────────────────────────────────────── */}
      {hasContent ? (
        <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
          <Suspense fallback={<ComicRowSkeleton />}>
            <ComicRow
              title="✨ มาใหม่ล่าสุด"
              comics={newComics}
              badge="มาใหม่"
              seeAllHref="/?sort=new"
            />
          </Suspense>

          <Suspense fallback={<ComicRowSkeleton />}>
            <ComicRow
              title="🔥 ยอดนิยมสัปดาห์นี้"
              comics={trendingComics}
              badge="HOT"
              seeAllHref="/?sort=trending"
            />
          </Suspense>

          {ongoingComics.length > 0 && (
            <Suspense fallback={<ComicRowSkeleton />}>
              <ComicRow
                title="📖 กำลังดำเนินเรื่อง"
                comics={ongoingComics}
                badge="อัปเดต"
                seeAllHref="/?status=ongoing"
              />
            </Suspense>
          )}

          {completedComics.length > 0 && (
            <Suspense fallback={<ComicRowSkeleton />}>
              <ComicRow
                title="✅ จบแล้ว"
                comics={completedComics}
                seeAllHref="/?status=completed"
              />
            </Suspense>
          )}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <span className="text-5xl" role="img" aria-label="ยังไม่มีการ์ตูน">
            📚
          </span>
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            ยังไม่มีการ์ตูนในระบบ
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            เพิ่มการ์ตูนผ่านแผงควบคุมได้เลย
          </p>
          <a
            href="/admin"
            className="mt-4 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            ไปยังแผงควบคุม →
          </a>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="mt-16 border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()} คลังการ์ตูน · ข้อมูลอัปเดตโดยอัตโนมัติ
        </p>
      </footer>
    </div>
  );
}
