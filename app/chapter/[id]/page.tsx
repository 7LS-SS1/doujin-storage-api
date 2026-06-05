import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  Layers3,
} from "lucide-react";
import ChapterViewTracker from "@/components/reader/chapter-view-tracker";
import { PortalFrame } from "@/components/reader/reader-portal";
import {
  formatLongDate,
  getChapterById,
} from "@/lib/reader/public-data";

function chapterLabel(number: string | null, fallbackId: string | number) {
  if (number && number.trim().length > 0) {
    return `#${number}`;
  }

  if (typeof fallbackId === "string" && fallbackId.trim().length > 0) {
    return "ตอนพิเศษ";
  }

  return `ตอน ${fallbackId}`;
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chapter = await getChapterById(id);

  if (!chapter) {
    notFound();
  }

  return (
    <PortalFrame active="chapter">
      <ChapterViewTracker comicId={chapter.comicId} chapterId={chapter.chapterId} />

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/comic/${chapter.comicSlug}`}
            className="inline-flex items-center gap-2 text-sm text-zinc-300 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับไป {chapter.comicTitle}
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {chapter.previousChapterId ? (
              <Link
                href={`/chapter/${chapter.previousChapterId}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-white/25 hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
                ตอนก่อนหน้า
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-500">
                <ChevronLeft className="h-4 w-4" />
                ตอนก่อนหน้า
              </span>
            )}

            {chapter.nextChapterId ? (
              <Link
                href={`/chapter/${chapter.nextChapterId}`}
                className="inline-flex items-center gap-2 rounded-full bg-[#dc0914] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#b00914]"
              >
                ตอนถัดไป
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-4 py-2 text-sm font-medium text-zinc-500">
                ตอนถัดไป
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>

        <section className="overflow-hidden rounded-[30px] border border-white/10 bg-black/25">
          <div className="relative overflow-hidden px-5 py-6 sm:px-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,9,20,0.18),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_60%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_230px] lg:items-end">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
                  Chapter Reader
                </p>
                <h1 className="text-3xl font-semibold leading-none text-white sm:text-4xl">
                  {chapter.comicTitle}
                </h1>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex rounded-full border border-[#ffd600]/25 bg-[#ffd600]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#ffe070]">
                    {chapterLabel(chapter.chapterNumber, chapter.chapterId)}
                  </span>
                  <span className="text-sm text-zinc-300">
                    {chapter.chapterTitle?.trim() || "Untitled chapter"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-zinc-400">
                    <Layers3 className="h-4 w-4" />
                    {chapter.images.length.toLocaleString("en-US")} หน้า
                  </span>
                </div>
                <p className="text-sm text-zinc-400">
                  อัปเดต {formatLongDate(chapter.releasedAt)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Link
                  href={`/comic/${chapter.comicSlug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-white/25 hover:bg-white/10"
                >
                  <BookOpenText className="h-4 w-4" />
                  รายละเอียดเรื่อง
                </Link>
                <Link
                  href="/updates"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-white/25 hover:bg-white/10"
                >
                  Feed อัปเดต
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[920px] space-y-5">
          {chapter.images.length > 0 ? (
            chapter.images.map((image) => (
              <div
                key={image.id}
                className="overflow-hidden rounded-[28px] border border-white/10 bg-black/30 shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
              >
                <Image
                  src={image.imageUrl}
                  alt={`${chapter.comicTitle} ${chapter.chapterTitle || ""}`.trim()}
                  width={image.width ?? 1200}
                  height={image.height ?? 1700}
                  sizes="(max-width: 1024px) 100vw, 920px"
                  className="h-auto w-full object-contain"
                />
              </div>
            ))
          ) : (
            <div className="rounded-[28px] border border-dashed border-white/15 bg-black/20 px-6 py-12 text-center text-zinc-400">
              ตอนนี้ยังไม่มีภาพในระบบ
            </div>
          )}
        </section>
      </div>
    </PortalFrame>
  );
}
