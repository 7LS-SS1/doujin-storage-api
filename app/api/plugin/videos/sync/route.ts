import { type NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { getUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveApiVideoType, toApiVideoType, toPrismaVideoType } from "@/lib/video-type"

type SyncInput = {
  mode?: unknown
  type?: unknown
  bucket?: unknown
  since?: unknown
  limit?: unknown
  per_page?: unknown
}

const parseLimit = (value: unknown, fallback = 1000): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(Math.max(Math.floor(value), 1), 1000)
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return Math.min(Math.max(Math.floor(parsed), 1), 1000)
    }
  }

  return fallback
}

const parseSinceDate = (value: unknown): Date | null => {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null
  }

  const numeric = Number(value)
  if (Number.isFinite(numeric)) {
    const ms = numeric < 1_000_000_000_000 ? numeric * 1000 : numeric
    const date = new Date(ms)
    if (!Number.isNaN(date.getTime())) {
      return date
    }
  }

  const date = new Date(value)
  if (!Number.isNaN(date.getTime())) {
    return date
  }

  return null
}

const hasFilterInput = (input: SyncInput): boolean =>
  input.type !== undefined || input.mode !== undefined || input.bucket !== undefined

const getSyncInputFromRequest = async (request: NextRequest): Promise<SyncInput> => {
  if (request.method === "GET") {
    const { searchParams } = new URL(request.url)
    return {
      mode: searchParams.get("mode") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      bucket: searchParams.get("bucket") ?? undefined,
      since: searchParams.get("since") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      per_page: searchParams.get("per_page") ?? undefined,
    }
  }

  const body = await request.json().catch(() => ({}))
  return {
    mode: body.mode,
    type: body.type,
    bucket: body.bucket,
    since: body.since,
    limit: body.limit,
    per_page: body.per_page,
  }
}

const handleSync = async (request: NextRequest) => {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["ADMIN", "EDITOR"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const input = await getSyncInputFromRequest(request)
    const requestedType = resolveApiVideoType({
      type: input.type,
      mode: input.mode,
      bucket: input.bucket,
    })

    if (hasFilterInput(input) && !requestedType) {
      return NextResponse.json(
        { error: "Invalid type/mode/bucket. Allowed: type|mode=thai_clip|av_movie, bucket=media|jav" },
        { status: 400 },
      )
    }

    const where: Prisma.VideoWhereInput = {
      status: "READY",
    }

    if (requestedType) {
      where.type = toPrismaVideoType(requestedType)
    }

    const sinceDate = parseSinceDate(input.since)
    if (sinceDate) {
      where.updatedAt = { gt: sinceDate }
    }

    const limit = parseLimit(input.limit ?? input.per_page)

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          videoUrl: true,
          thumbnailUrl: true,
          duration: true,
          type: true,
          updatedAt: true,
          createdAt: true,
        },
      }),
      prisma.video.count({ where }),
    ])

    const mappedVideos = videos.map((video) => ({
      ...video,
      type: toApiVideoType(video.type),
      video_url: video.videoUrl,
      thumbnail_url: video.thumbnailUrl,
      created_at: video.createdAt,
      updated_at: video.updatedAt,
    }))

    return NextResponse.json({
      message: "Plugin sync completed",
      mode: requestedType,
      type: requestedType,
      data: mappedVideos,
      pagination: {
        page: 1,
        per_page: limit,
        total,
        total_pages: Math.ceil(total / limit),
        next_page: total > limit ? 2 : null,
        has_more: total > limit,
      },
      summary: {
        matched: total,
        returned: mappedVideos.length,
        has_more: total > mappedVideos.length,
      },
    })
  } catch (error) {
    console.error("Plugin sync error:", error)
    return NextResponse.json({ error: "Failed to sync plugin videos" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handleSync(request)
}

export async function POST(request: NextRequest) {
  return handleSync(request)
}
