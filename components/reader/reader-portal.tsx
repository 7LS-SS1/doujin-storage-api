import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  Clock3,
  ExternalLink,
  Eye,
  Flame,
  Layers3,
  Search,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatCompactNumber,
  formatDayStamp,
  formatLongDate,
  getProjectPulse,
  getRanking,
  getRecentUpdates,
  isWithinHours,
  trimText,
  type ProjectPulse,
  type RankingEntry,
  type UpdateEntry,
} from "@/lib/reader/public-data";

type PortalNavKey = "updates" | "comic" | "chapter";

interface PortalFrameProps {
  active: PortalNavKey;
  children: React.ReactNode;
  query?: string;
}

interface UpdatesPortalPageProps {
  query?: string;
}

const STATUS_LABEL: Record<string, string> = {
  ongoing: "ONGOING",
  completed: "COMPLETE",
  hiatus: "HIATUS",
};

const STATUS_CLASS: Record<string, string> = {
  ongoing: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  completed: "border-sky-400/20 bg-sky-400/10 text-sky-100",
  hiatus: "border-amber-400/20 bg-amber-400/10 text-amber-100",
};

function chapterLabel(number: string | null, fallbackId: string | number) {
  if (number && number.trim().length > 0) {
    return `#${number}`;
  }

  if (typeof fallbackId === "string" && fallbackId.trim().length > 0) {
    return "SPECIAL";
  }

  return `CH ${fallbackId}`;
}

function updateBadge(entry: UpdateEntry) {
  if (entry.isFirstChapter) {
    return "New Series";
  }

  if (isWithinHours(entry.releasedAt, 24)) {
    return "Latest 24 Hours";
  }

  return formatDayStamp(entry.releasedAt);
}

function sectionSummary(query: string) {
  if (!query.trim()) {
    return "หยิบตอนล่าสุดจากคลังของคุณมาเรียงใหม่ในสไตล์ MANGA Plus feed";
  }

  return `ผลลัพธ์สำหรับ “${query.trim()}”`;
}

function ActiveNav({ active }: { active: PortalNavKey }) {
  const items = [
    { key: "updates", label: "Updates", href: "/updates" },
    { key: "catalog", label: "Catalog", href: "/updates#catalog" },
    { key: "ranking", label: "Ranking", href: "/updates#ranking" },
    { key: "admin", label: "Admin", href: "/admin" },
  ] as const;

  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {items.map((item) => {
        const isActive =
          item.key === "updates" && active === "updates";

        return (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              isActive
                ? "bg-white text-black"
                : "text-zinc-300 hover:bg-white/8 hover:text-white"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function PortalHeader({ active, query = "" }: { active: PortalNavKey; query?: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/updates" className="shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#ff5c00_0%,#dc0914_100%)] text-white shadow-[0_14px_34px_rgba(220,9,20,0.28)]">
              <BookOpenText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-zinc-500">
                Comic Storage
              </p>
              <p className="text-lg font-semibold leading-none text-white">
                Updates Portal
              </p>
            </div>
          </div>
        </Link>

        <ActiveNav active={active} />

        <div className="ml-auto hidden min-w-[280px] max-w-[360px] flex-1 lg:block">
          <form action="/updates" className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="ค้นหาชื่อเรื่อง / ตอน / ผู้แต่ง"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-white/25 focus:bg-white/8"
            />
          </form>
        </div>
      </div>
    </header>
  );
}

function PortalFooter() {
  return (
    <footer className="border-t border-white/8 bg-black/40">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-8 text-sm text-zinc-400 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>
          Reader theme inspired by MANGA Plus updates and adapted for your
          Comic Storage project.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/updates" className="transition hover:text-white">
            Latest feed
          </Link>
          <Link href="/admin" className="transition hover:text-white">
            Admin dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
}

function UpdatesStatRail({ pulse }: { pulse: ProjectPulse }) {
  const stats = [
    {
      label: "Titles",
      value: pulse.comicCount.toLocaleString("en-US"),
      hint: "active in library",
    },
    {
      label: "Chapters",
      value: pulse.chapterCount.toLocaleString("en-US"),
      hint: "ready to read",
    },
    {
      label: "Fresh",
      value: pulse.updatesToday.toLocaleString("en-US"),
      hint: "within 24 hours",
    },
    {
      label: "Series",
      value: pulse.seriesCount.toLocaleString("en-US"),
      hint: "linked entries",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-4"
        >
          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">
            {stat.label}
          </p>
          <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
          <p className="mt-1 text-sm text-zinc-400">{stat.hint}</p>
        </div>
      ))}
    </div>
  );
}

function FeaturedUpdate({ entry }: { entry: UpdateEntry }) {
  return (
    <section className="grid gap-px overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_30px_90px_rgba(0,0,0,0.35)] lg:grid-cols-[minmax(0,0.92fr)_1.08fr]">
      <div className="relative overflow-hidden bg-[#080809] px-6 py-7 sm:px-8 sm:py-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,9,20,0.3),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent_48%)]" />
        <div className="relative flex h-full flex-col justify-between gap-6">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full bg-[#dc0914] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                {updateBadge(entry)}
              </span>
              <span
                className={cn(
                  "inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                  STATUS_CLASS[entry.status] ?? STATUS_CLASS.ongoing
                )}
              >
                {STATUS_LABEL[entry.status] ?? entry.status}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="max-w-xl text-4xl font-semibold leading-none text-white sm:text-5xl">
                {entry.comicTitle}
              </h1>
              {entry.authorName && (
                <p className="text-lg text-zinc-300">{entry.authorName}</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-300">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <Layers3 className="h-4 w-4 text-[#ffd600]" />
                {chapterLabel(entry.chapterNumber, entry.chapterId)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <Eye className="h-4 w-4 text-[#ff5c00]" />
                {formatCompactNumber(entry.viewCount)} views
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <Clock3 className="h-4 w-4 text-zinc-400" />
                {formatLongDate(entry.releasedAt)}
              </span>
            </div>

            <div className="space-y-3">
              <p className="max-w-xl text-lg font-medium text-white">
                {entry.chapterTitle?.trim() || "Fresh drop from your latest feed"}
              </p>
              <p className="max-w-xl text-sm leading-7 text-zinc-300">
                {trimText(
                  entry.comicDescription?.trim()
                    ? entry.comicDescription
                    : "ใช้ feed ล่าสุดจากฐานข้อมูลของคุณแทน headline แบบ static เพื่อให้หน้าอัปเดตนี้พร้อมใช้งานจริงทุกครั้งที่ sync ข้อมูลเข้าโปรเจกต์.",
                  220
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/chapter/${entry.chapterId}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#dc0914] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b00914]"
            >
              เปิดอ่านตอนนี้
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/comic/${entry.comicSlug}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/25 hover:bg-white/10"
            >
              ดูหน้าซีรีส์
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <Link
        href={`/chapter/${entry.chapterId}`}
        className="group relative block min-h-[260px] overflow-hidden bg-[#0e0e10] sm:min-h-[340px]"
      >
        {entry.coverImageUrl ? (
          <Image
            src={entry.coverImageUrl}
            alt={entry.comicTitle}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 760px"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ff5c00_0%,transparent_32%),linear-gradient(180deg,#18181b_0%,#050505_100%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
      </Link>
    </section>
  );
}

function UpdateCard({ entry }: { entry: UpdateEntry }) {
  return (
    <Link
      href={`/chapter/${entry.chapterId}`}
      className="group flex h-full flex-col gap-3 rounded-[24px] border border-white/10 bg-[#101013] p-3 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#141419]"
    >
      <div className="relative overflow-hidden rounded-[18px]">
        {entry.coverImageUrl ? (
          <div className="relative aspect-[2/3]">
            <Image
              src={entry.coverImageUrl}
              alt={entry.comicTitle}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 16vw"
              className="object-cover transition duration-700 group-hover:scale-[1.06]"
            />
          </div>
        ) : (
          <div className="aspect-[2/3] bg-[radial-gradient(circle_at_top,#dc0914_0%,transparent_32%),linear-gradient(180deg,#1b1b1f_0%,#070707_100%)]" />
        )}

        <div className="absolute left-2 top-2 inline-flex rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur">
          {updateBadge(entry)}
        </div>

        {entry.isFirstChapter && (
          <div className="absolute right-2 top-2 rounded-full border border-[#ff5c00]/25 bg-[#ff5c00]/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ffc29c]">
            Debut
          </div>
        )}

        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/15 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
          <p className="text-sm font-semibold text-white">
            {entry.chapterTitle?.trim() || "Open latest chapter"}
          </p>
          <p className="mt-1 text-xs text-zinc-300">
            {formatCompactNumber(entry.viewCount)} views
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 px-1">
        <div className="space-y-1.5">
          <p className="line-clamp-2 text-lg font-semibold leading-tight text-white">
            {entry.comicTitle}
          </p>
          <p className="line-clamp-1 text-sm text-zinc-400">
            {entry.authorName || "Unknown creator"}
          </p>
          <p className="line-clamp-2 text-sm text-zinc-200">
            {entry.chapterTitle?.trim() || "Fresh chapter synced from your storage"}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
          <span>{chapterLabel(entry.chapterNumber, entry.chapterId)}</span>
          <span>{formatDayStamp(entry.releasedAt)}</span>
        </div>
      </div>
    </Link>
  );
}

function RankingCard({ ranking }: { ranking: RankingEntry[] }) {
  return (
    <section
      id="ranking"
      className="overflow-hidden rounded-[28px] border border-white/10 bg-black/30 xl:sticky xl:top-24"
    >
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              Weekly Ranking
            </p>
            <h2 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
              <Trophy className="h-5 w-5 text-[#ffd600]" />
              มีคนดูมากที่สุด
            </h2>
          </div>
        </div>
      </div>

      <div className="space-y-px bg-white/5">
        {ranking.length > 0 ? (
          ranking.map((item, index) => (
            <Link
              key={item.comicId}
              href={`/comic/${item.comicSlug}`}
              className="group grid grid-cols-[32px_56px_minmax(0,1fr)] items-center gap-3 bg-[#101013] px-5 py-4 transition hover:bg-[#16161a]"
            >
              <div className="text-lg font-semibold text-zinc-500">
                {index + 1}
              </div>
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-zinc-900">
                {item.coverImageUrl ? (
                  <Image
                    src={item.coverImageUrl}
                    alt={item.comicTitle}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-[linear-gradient(180deg,#26262b_0%,#09090b_100%)]" />
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white transition group-hover:text-[#ffd600]">
                  {item.comicTitle}
                </p>
                <p className="mt-1 truncate text-xs text-zinc-400">
                  {item.authorName || "Unknown creator"}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-300">
                  <Eye className="h-3.5 w-3.5 text-[#ff5c00]" />
                  {formatCompactNumber(item.viewCount)} views
                </p>
              </div>
            </Link>
          ))
        ) : (
          <div className="px-5 py-8 text-sm text-zinc-400">
            ยังไม่มีข้อมูลพอสำหรับจัดอันดับ
          </div>
        )}
      </div>
    </section>
  );
}

function ProjectCard({ pulse }: { pulse: ProjectPulse }) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-black/30">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
          Project Adaptation
        </p>
        <h2 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
          <Flame className="h-5 w-5 text-[#ff5c00]" />
          Built for your API
        </h2>
      </div>

      <div className="space-y-4 px-5 py-5 text-sm leading-7 text-zinc-300">
        <p>
          หน้าอัปเดตนี้อ่านข้อมูลตรงจากตาราง <code>comics</code> และ{" "}
          <code>chapters</code> ของโปรเจกต์คุณ พร้อม fallback อัตโนมัติเมื่อ
          analytics feed ยังไม่พร้อม.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
              Last Sync Window
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {pulse.lastPublishedAt ? formatLongDate(pulse.lastPublishedAt) : "No updates yet"}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
              Reader Ready
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              Feed, series page, and chapter viewer are wired
            </p>
          </div>
        </div>

        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          เปิดแผงจัดการ
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

export function PortalFrame({
  active,
  children,
  query = "",
}: PortalFrameProps) {
  return (
    <div className="updates-page min-h-screen bg-[#09090b] text-white">
      <PortalHeader active={active} query={query} />
      <main className="relative mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {children}
      </main>
      <PortalFooter />
    </div>
  );
}

export default async function UpdatesPortalPage({
  query = "",
}: UpdatesPortalPageProps) {
  const [updates, ranking, pulse] = await Promise.all([
    getRecentUpdates({ query, limit: 21 }),
    getRanking(12),
    getProjectPulse(),
  ]);

  const featured = updates[0] ?? null;
  const gridEntries = featured ? updates.slice(1) : updates;

  return (
    <PortalFrame active="updates" query={query}>
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.28em] text-zinc-500">
            home / updates
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                Latest Comic Updates
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">
                {sectionSummary(query)}
              </p>
            </div>
            <Link
              href="/admin/chapters"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-white/25 hover:bg-white/10"
            >
              จัดการตอนทั้งหมด
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            {featured ? (
              <FeaturedUpdate entry={featured} />
            ) : (
              <div className="rounded-[32px] border border-dashed border-white/15 bg-black/20 px-6 py-12 text-center text-zinc-400">
                ยังไม่พบตอนที่ตรงกับเงื่อนไขนี้
              </div>
            )}

            <UpdatesStatRail pulse={pulse} />

            <section id="catalog" className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                    Catalog Feed
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    อัปเดตล่าสุดจากคลังของคุณ
                  </h2>
                </div>

                {query.trim() ? (
                  <Link
                    href="/updates"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-white/25 hover:bg-white/10"
                  >
                    ล้างตัวกรอง
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {gridEntries.length > 0 ? (
                  gridEntries.map((entry) => (
                    <UpdateCard key={entry.chapterId} entry={entry} />
                  ))
                ) : (
                  <div className="rounded-[28px] border border-dashed border-white/15 bg-black/20 px-6 py-12 text-center text-zinc-400 sm:col-span-2 xl:col-span-5">
                    ไม่มีตอนเพิ่มเติมในชุดข้อมูลนี้
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <ProjectCard pulse={pulse} />
            <RankingCard ranking={ranking} />
          </div>
        </div>
      </div>
    </PortalFrame>
  );
}
