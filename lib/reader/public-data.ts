import { sql } from "@/lib/db";

export interface UpdateEntry {
  comicId: string;
  comicSlug: string;
  comicTitle: string;
  comicDescription: string | null;
  authorName: string | null;
  status: "ongoing" | "completed" | "hiatus";
  coverImageUrl: string | null;
  chapterId: string;
  chapterNumber: string | null;
  chapterTitle: string | null;
  releasedAt: string;
  chapterCount: number;
  isFirstChapter: boolean;
  viewCount: number;
}

export interface RankingEntry {
  comicId: string;
  comicSlug: string;
  comicTitle: string;
  authorName: string | null;
  coverImageUrl: string | null;
  chapterCount: number;
  viewCount: number;
  latestReleaseAt: string | null;
}

export interface ProjectPulse {
  comicCount: number;
  chapterCount: number;
  updatesToday: number;
  seriesCount: number;
  lastPublishedAt: string | null;
}

export interface ComicChapterEntry {
  chapterId: string;
  chapterNumber: string | null;
  chapterTitle: string | null;
  releasedAt: string;
}

export interface ComicDetail {
  comicId: string;
  comicSlug: string;
  comicTitle: string;
  comicDescription: string | null;
  authorName: string | null;
  status: "ongoing" | "completed" | "hiatus";
  coverImageUrl: string | null;
  chapterCount: number;
  latestReleaseAt: string | null;
  viewCount: number;
  chapters: ComicChapterEntry[];
}

export interface ChapterImageEntry {
  id: string;
  imageUrl: string;
  sortOrder: number;
  width: number | null;
  height: number | null;
}

export interface ChapterDetail {
  chapterId: string;
  comicId: string;
  comicSlug: string;
  comicTitle: string;
  chapterNumber: string | null;
  chapterTitle: string | null;
  releasedAt: string;
  createdAt: string;
  previousChapterId: string | null;
  nextChapterId: string | null;
  images: ChapterImageEntry[];
}

function asDateString(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return null;
}

function normalizeUpdateRows(rows: Record<string, unknown>[]): UpdateEntry[] {
  return rows.map((row) => ({
    comicId: String(row.comicId),
    comicSlug: String(row.comicSlug),
    comicTitle: String(row.comicTitle),
    comicDescription:
      typeof row.comicDescription === "string" ? row.comicDescription : null,
    authorName: typeof row.authorName === "string" ? row.authorName : null,
    status: String(row.status) as UpdateEntry["status"],
    coverImageUrl: typeof row.coverImageUrl === "string" ? row.coverImageUrl : null,
    chapterId: String(row.chapterId),
    chapterNumber:
      typeof row.chapterNumber === "string" ? row.chapterNumber : row.chapterNumber != null ? String(row.chapterNumber) : null,
    chapterTitle: typeof row.chapterTitle === "string" ? row.chapterTitle : null,
    releasedAt: asDateString(row.releasedAt) ?? new Date(0).toISOString(),
    chapterCount: Number(row.chapterCount ?? 0),
    isFirstChapter: Boolean(row.isFirstChapter),
    viewCount: Number(row.viewCount ?? 0),
  }));
}

function normalizeRankingRows(rows: Record<string, unknown>[]): RankingEntry[] {
  return rows.map((row) => ({
    comicId: String(row.comicId),
    comicSlug: String(row.comicSlug),
    comicTitle: String(row.comicTitle),
    authorName: typeof row.authorName === "string" ? row.authorName : null,
    coverImageUrl: typeof row.coverImageUrl === "string" ? row.coverImageUrl : null,
    chapterCount: Number(row.chapterCount ?? 0),
    viewCount: Number(row.viewCount ?? 0),
    latestReleaseAt: asDateString(row.latestReleaseAt),
  }));
}

function searchPattern(query: string) {
  const trimmed = query.trim();
  return trimmed.length > 0 ? `%${trimmed}%` : "";
}

export function trimText(value: string, length: number) {
  if (value.length <= length) return value;
  return `${value.slice(0, Math.max(0, length - 1)).trimEnd()}…`;
}

export function isWithinHours(value: string | Date | null, hours: number) {
  if (!value) return false;
  const date = new Date(value);
  return Date.now() - date.getTime() <= hours * 60 * 60 * 1000;
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatLongDate(value: string | Date | null) {
  if (!value) return "Unknown date";

  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDayStamp(value: string | Date) {
  const date = new Date(value);
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
  })
    .format(date)
    .toUpperCase();

  return `${date.getMonth() + 1}.${date.getDate()} ${weekday}`;
}

export async function getRecentUpdates({
  query = "",
  limit = 21,
}: {
  query?: string;
  limit?: number;
}) {
  const pattern = searchPattern(query);

  try {
    const rows = await sql`
      WITH chapter_counts AS (
        SELECT comic_id, COUNT(*)::int AS chapter_count
        FROM chapters
        GROUP BY comic_id
      ),
      first_chapters AS (
        SELECT DISTINCT ON (comic_id) comic_id, id AS first_chapter_id
        FROM chapters
        ORDER BY comic_id, COALESCE(published_at, created_at) ASC, id ASC
      )
      SELECT
        c.id AS "comicId",
        c.slug AS "comicSlug",
        c.title AS "comicTitle",
        c.description AS "comicDescription",
        c.author_name AS "authorName",
        c.status AS "status",
        c.cover_image_url AS "coverImageUrl",
        ch.id AS "chapterId",
        ch.number AS "chapterNumber",
        ch.title AS "chapterTitle",
        COALESCE(ch.published_at, ch.created_at) AS "releasedAt",
        COALESCE(cc.chapter_count, 0)::int AS "chapterCount",
        CASE WHEN fc.first_chapter_id = ch.id THEN true ELSE false END AS "isFirstChapter",
        COUNT(cve.id)::int AS "viewCount"
      FROM chapters ch
      JOIN comics c ON c.id = ch.comic_id
      LEFT JOIN chapter_counts cc ON cc.comic_id = c.id
      LEFT JOIN first_chapters fc ON fc.comic_id = c.id
      LEFT JOIN chapter_view_events cve
        ON cve.chapter_id = ch.id::text
       AND cve.event_type = 'chapter_view'
       AND cve.counted = true
       AND cve.created_at >= NOW() - INTERVAL '30 days'
      WHERE (
        ${pattern} = ''
        OR c.title ILIKE ${pattern}
        OR COALESCE(c.author_name, '') ILIKE ${pattern}
        OR COALESCE(ch.title, '') ILIKE ${pattern}
      )
      GROUP BY c.id, ch.id, cc.chapter_count, fc.first_chapter_id
      ORDER BY COALESCE(ch.published_at, ch.created_at) DESC, ch.id DESC
      LIMIT ${limit}
    `;

    return normalizeUpdateRows(rows as Record<string, unknown>[]);
  } catch {
    const rows = await sql`
      WITH chapter_counts AS (
        SELECT comic_id, COUNT(*)::int AS chapter_count
        FROM chapters
        GROUP BY comic_id
      ),
      first_chapters AS (
        SELECT DISTINCT ON (comic_id) comic_id, id AS first_chapter_id
        FROM chapters
        ORDER BY comic_id, COALESCE(published_at, created_at) ASC, id ASC
      )
      SELECT
        c.id AS "comicId",
        c.slug AS "comicSlug",
        c.title AS "comicTitle",
        c.description AS "comicDescription",
        c.author_name AS "authorName",
        c.status AS "status",
        c.cover_image_url AS "coverImageUrl",
        ch.id AS "chapterId",
        ch.number AS "chapterNumber",
        ch.title AS "chapterTitle",
        COALESCE(ch.published_at, ch.created_at) AS "releasedAt",
        COALESCE(cc.chapter_count, 0)::int AS "chapterCount",
        CASE WHEN fc.first_chapter_id = ch.id THEN true ELSE false END AS "isFirstChapter",
        0 AS "viewCount"
      FROM chapters ch
      JOIN comics c ON c.id = ch.comic_id
      LEFT JOIN chapter_counts cc ON cc.comic_id = c.id
      LEFT JOIN first_chapters fc ON fc.comic_id = c.id
      WHERE (
        ${pattern} = ''
        OR c.title ILIKE ${pattern}
        OR COALESCE(c.author_name, '') ILIKE ${pattern}
        OR COALESCE(ch.title, '') ILIKE ${pattern}
      )
      ORDER BY COALESCE(ch.published_at, ch.created_at) DESC, ch.id DESC
      LIMIT ${limit}
    `;

    return normalizeUpdateRows(rows as Record<string, unknown>[]);
  }
}

export async function getRanking(limit = 12) {
  try {
    const rows = await sql`
      WITH chapter_counts AS (
        SELECT comic_id, COUNT(*)::int AS chapter_count
        FROM chapters
        GROUP BY comic_id
      ),
      latest_releases AS (
        SELECT comic_id, MAX(COALESCE(published_at, created_at)) AS latest_release_at
        FROM chapters
        GROUP BY comic_id
      )
      SELECT
        c.id AS "comicId",
        c.slug AS "comicSlug",
        c.title AS "comicTitle",
        c.author_name AS "authorName",
        c.cover_image_url AS "coverImageUrl",
        COALESCE(cc.chapter_count, 0)::int AS "chapterCount",
        COUNT(cve.id)::int AS "viewCount",
        lr.latest_release_at AS "latestReleaseAt"
      FROM comics c
      LEFT JOIN chapter_counts cc ON cc.comic_id = c.id
      LEFT JOIN latest_releases lr ON lr.comic_id = c.id
      LEFT JOIN chapter_view_events cve
        ON cve.comic_id = c.id::text
       AND cve.event_type = 'chapter_view'
       AND cve.counted = true
       AND cve.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY c.id, cc.chapter_count, lr.latest_release_at
      ORDER BY "viewCount" DESC, lr.latest_release_at DESC NULLS LAST
      LIMIT ${limit}
    `;

    return normalizeRankingRows(rows as Record<string, unknown>[]);
  } catch {
    const rows = await sql`
      WITH chapter_counts AS (
        SELECT comic_id, COUNT(*)::int AS chapter_count
        FROM chapters
        GROUP BY comic_id
      ),
      latest_releases AS (
        SELECT comic_id, MAX(COALESCE(published_at, created_at)) AS latest_release_at
        FROM chapters
        GROUP BY comic_id
      )
      SELECT
        c.id AS "comicId",
        c.slug AS "comicSlug",
        c.title AS "comicTitle",
        c.author_name AS "authorName",
        c.cover_image_url AS "coverImageUrl",
        COALESCE(cc.chapter_count, 0)::int AS "chapterCount",
        0 AS "viewCount",
        lr.latest_release_at AS "latestReleaseAt"
      FROM comics c
      LEFT JOIN chapter_counts cc ON cc.comic_id = c.id
      LEFT JOIN latest_releases lr ON lr.comic_id = c.id
      ORDER BY lr.latest_release_at DESC NULLS LAST, c.updated_at DESC
      LIMIT ${limit}
    `;

    return normalizeRankingRows(rows as Record<string, unknown>[]);
  }
}

export async function getProjectPulse(): Promise<ProjectPulse> {
  const rows = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM comics) AS "comicCount",
      (SELECT COUNT(*)::int FROM chapters) AS "chapterCount",
      (
        SELECT COUNT(*)::int
        FROM chapters
        WHERE COALESCE(published_at, created_at) >= NOW() - INTERVAL '24 hours'
      ) AS "updatesToday",
      (SELECT COUNT(*)::int FROM series) AS "seriesCount",
      (
        SELECT MAX(COALESCE(published_at, created_at))
        FROM chapters
      ) AS "lastPublishedAt"
  `;

  const row = rows[0] as Record<string, unknown>;

  return {
    comicCount: Number(row.comicCount ?? 0),
    chapterCount: Number(row.chapterCount ?? 0),
    updatesToday: Number(row.updatesToday ?? 0),
    seriesCount: Number(row.seriesCount ?? 0),
    lastPublishedAt: asDateString(row.lastPublishedAt),
  };
}

export async function getComicBySlug(slug: string): Promise<ComicDetail | null> {
  const [comic] = (await sql`
    SELECT
      c.id AS "comicId",
      c.slug AS "comicSlug",
      c.title AS "comicTitle",
      c.description AS "comicDescription",
      c.author_name AS "authorName",
      c.status AS "status",
      c.cover_image_url AS "coverImageUrl",
      COUNT(ch.id)::int AS "chapterCount",
      MAX(COALESCE(ch.published_at, ch.created_at)) AS "latestReleaseAt"
    FROM comics c
    LEFT JOIN chapters ch ON ch.comic_id = c.id
    WHERE c.slug = ${slug}
    GROUP BY c.id
    LIMIT 1
  `) as Record<string, unknown>[];

  if (!comic) {
    return null;
  }

  const chapters = (await sql`
    SELECT
      id AS "chapterId",
      number AS "chapterNumber",
      title AS "chapterTitle",
      COALESCE(published_at, created_at) AS "releasedAt"
    FROM chapters
    WHERE comic_id = ${comic.comicId}
    ORDER BY COALESCE(published_at, created_at) DESC, id DESC
  `) as Record<string, unknown>[];

  let viewCount = 0;
  try {
    const [views] = (await sql`
      SELECT COUNT(*)::int AS "total"
      FROM chapter_view_events
      WHERE comic_id = ${String(comic.comicId)}
        AND event_type = 'chapter_view'
        AND counted = true
    `) as Record<string, unknown>[];
    viewCount = Number(views?.total ?? 0);
  } catch {
    viewCount = 0;
  }

  return {
    comicId: String(comic.comicId),
    comicSlug: String(comic.comicSlug),
    comicTitle: String(comic.comicTitle),
    comicDescription:
      typeof comic.comicDescription === "string" ? comic.comicDescription : null,
    authorName: typeof comic.authorName === "string" ? comic.authorName : null,
    status: String(comic.status) as ComicDetail["status"],
    coverImageUrl: typeof comic.coverImageUrl === "string" ? comic.coverImageUrl : null,
    chapterCount: Number(comic.chapterCount ?? 0),
    latestReleaseAt: asDateString(comic.latestReleaseAt),
    viewCount,
    chapters: chapters.map((chapter) => ({
      chapterId: String(chapter.chapterId),
      chapterNumber:
        typeof chapter.chapterNumber === "string"
          ? chapter.chapterNumber
          : chapter.chapterNumber != null
          ? String(chapter.chapterNumber)
          : null,
      chapterTitle:
        typeof chapter.chapterTitle === "string" ? chapter.chapterTitle : null,
      releasedAt: asDateString(chapter.releasedAt) ?? new Date(0).toISOString(),
    })),
  };
}

export async function getChapterById(id: string): Promise<ChapterDetail | null> {
  const [chapter] = (await sql`
    SELECT
      ch.id AS "chapterId",
      ch.comic_id AS "comicId",
      c.slug AS "comicSlug",
      c.title AS "comicTitle",
      ch.number AS "chapterNumber",
      ch.title AS "chapterTitle",
      COALESCE(ch.published_at, ch.created_at) AS "releasedAt",
      ch.created_at AS "createdAt"
    FROM chapters ch
    JOIN comics c ON c.id = ch.comic_id
    WHERE ch.id = ${id}
    LIMIT 1
  `) as Record<string, unknown>[];

  if (!chapter) {
    return null;
  }

  const createdAt = asDateString(chapter.createdAt) ?? new Date(0).toISOString();
  const releasedAt = asDateString(chapter.releasedAt) ?? new Date(0).toISOString();

  const images = (await sql`
    SELECT
      id,
      image_url AS "imageUrl",
      sort_order AS "sortOrder",
      width,
      height
    FROM chapter_images
    WHERE chapter_id = ${id}
    ORDER BY sort_order ASC
  `) as Record<string, unknown>[];

  const [previous] = (await sql`
    SELECT id AS "chapterId"
    FROM chapters
    WHERE comic_id = ${chapter.comicId}
      AND created_at < ${createdAt}
    ORDER BY created_at DESC
    LIMIT 1
  `) as Record<string, unknown>[];

  const [next] = (await sql`
    SELECT id AS "chapterId"
    FROM chapters
    WHERE comic_id = ${chapter.comicId}
      AND created_at > ${createdAt}
    ORDER BY created_at ASC
    LIMIT 1
  `) as Record<string, unknown>[];

  return {
    chapterId: String(chapter.chapterId),
    comicId: String(chapter.comicId),
    comicSlug: String(chapter.comicSlug),
    comicTitle: String(chapter.comicTitle),
    chapterNumber:
      typeof chapter.chapterNumber === "string"
        ? chapter.chapterNumber
        : chapter.chapterNumber != null
        ? String(chapter.chapterNumber)
        : null,
    chapterTitle:
      typeof chapter.chapterTitle === "string" ? chapter.chapterTitle : null,
    releasedAt,
    createdAt,
    previousChapterId: previous ? String(previous.chapterId) : null,
    nextChapterId: next ? String(next.chapterId) : null,
    images: images.map((image) => ({
      id: String(image.id),
      imageUrl: String(image.imageUrl),
      sortOrder: Number(image.sortOrder ?? 0),
      width:
        typeof image.width === "number" ? image.width : image.width != null ? Number(image.width) : null,
      height:
        typeof image.height === "number" ? image.height : image.height != null ? Number(image.height) : null,
    })),
  };
}
