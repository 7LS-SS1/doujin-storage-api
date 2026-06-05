import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Clock3,
  Play,
  Sparkles,
} from "lucide-react";
import ReactionBar from "@/components/reader/reaction-bar";
import { PortalFrame } from "@/components/reader/reader-portal";
import {
  formatCompactNumber,
  formatLongDate,
  getComicBySlug,
} from "@/lib/reader/public-data";

const STATUS_LABEL: Record<string, string> = {
  ongoing: "กำลังอัปเดต",
  completed: "จบแล้ว",
  hiatus: "พักชั่วคราว",
};

const STATUS_CLASS: Record<string, string> = {
  ongoing: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  completed: "border-sky-400/25 bg-sky-400/10 text-sky-100",
  hiatus: "border-amber-400/25 bg-amber-400/10 text-amber-100",
};

function chapterLabel(number: string | null, fallbackId: string | number) {
  if (number && number.trim().length > 0) {
    return `#${number}`;
  }

  if (typeof fallbackId === "string" && fallbackId.trim().length > 0) {
    return "ตอนพิเศษ";
  }

  return `ตอน ${fallbackId}`;
}

export default async function ComicDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const comic = await getComicBySlug(slug);

  if (!comic) {
    notFound();
  }

  const latestChapter = comic.chapters[0] ?? null;
  const firstChapter = comic.chapters[comic.chapters.length - 1] ?? null;

  return (
    <PortalFrame active="comic">
      <div className="space-y-10">
        <Link
          href="/updates"
          className="inline-flex items-center gap-2 text-sm text-zinc-300 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปหน้าอัปเดต
        </Link>

        <section className="grid gap-6 overflow-hidden rounded-[32px] border border-white/10 bg-black/30 shadow-[0_30px_90px_rgba(0,0,0,0.35)] lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="relative aspect-[3/4] overflow-hidden bg-zinc-950 lg:aspect-auto">
            {comic.coverImageUrl ? (
              <Image
                src={comic.coverImageUrl}
                alt={comic.comicTitle}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 320px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#dc0914_0%,transparent_42%),linear-gradient(180deg,#111113_0%,#050505_100%)] p-10 text-center text-2xl font-semibold text-white/80">
                {comic.comicTitle}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          </div>

          <div className="relative overflow-hidden px-6 py-7 sm:px-8 sm:py-9">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,9,20,0.18),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_50%)]" />
            <div className="relative space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${
                    STATUS_CLASS[comic.status] ?? STATUS_CLASS.ongoing
                  }`}
                >
                  {STATUS_LABEL[comic.status] ?? comic.status}
                </span>
                <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-200">
                  {comic.chapterCount.toLocaleString("en-US")} chapters
                </span>
                {comic.latestReleaseAt && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
                    <Clock3 className="h-3.5 w-3.5" />
                    ล่าสุด {formatLongDate(comic.latestReleaseAt)}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <h1 className="max-w-4xl text-4xl font-semibold leading-none text-white sm:text-5xl">
                  {comic.comicTitle}
                </h1>
                {comic.authorName && (
                  <p className="text-base text-zinc-300 sm:text-lg">
                    {comic.authorName}
                  </p>
                )}
              </div>

              <p className="max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">
                {comic.comicDescription?.trim()
                  ? comic.comicDescription
                  : "เรื่องนี้ยังไม่มีคำโปรยในระบบ แต่ feed ตอนล่าสุดพร้อมให้คุณเปิดอ่านต่อจากหน้านี้ได้ทันที."}
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                    Total Chapters
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {comic.chapterCount.toLocaleString("en-US")}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                    Total Views
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {formatCompactNumber(comic.viewCount)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                    Feed Status
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-xl font-semibold text-white">
                    <Sparkles className="h-5 w-5 text-[#ff5c00]" />
                    Live
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {latestChapter && (
                  <Link
                    href={`/chapter/${latestChapter.chapterId}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[#dc0914] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#b00914]"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    อ่านตอนล่าสุด
                  </Link>
                )}
                {firstChapter && (
                  <Link
                    href={`/chapter/${firstChapter.chapterId}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                  >
                    <BookOpenText className="h-4 w-4" />
                    เริ่มจากตอนแรก
                  </Link>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <ReactionBar comicId={comic.comicId} />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                Chapter Feed
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                รายชื่อตอนทั้งหมด
              </h2>
            </div>
            <Link
              href="/updates"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-white/25 hover:bg-white/10"
            >
              ดูอัปเดตล่าสุด
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/25">
            <div className="grid gap-px bg-white/5">
              {comic.chapters.map((chapter, index) => (
                <Link
                  key={chapter.chapterId}
                  href={`/chapter/${chapter.chapterId}`}
                  className="group grid gap-3 bg-[#101012] px-5 py-4 transition hover:bg-[#17171b] sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="text-sm font-semibold text-[#ffd600]">
                    {chapterLabel(chapter.chapterNumber, chapter.chapterId)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium text-white">
                      {chapter.chapterTitle?.trim() || "Untitled chapter"}
                    </p>
                    <p className="mt-1 text-sm text-zinc-400">
                      {formatLongDate(chapter.releasedAt)}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300 transition group-hover:text-white">
                    {index === 0 ? "ล่าสุด" : "เปิดอ่าน"}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PortalFrame>
  );
}
