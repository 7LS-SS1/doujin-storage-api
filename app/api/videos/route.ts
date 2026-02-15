import { type NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { getUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createVideoSchema, videoQuerySchema } from "@/lib/validation"
import { resolveApiVideoType, toApiVideoType, toPrismaVideoType } from "@/lib/video-type"

const mapVideoResponse = <T extends { type?: string | null }>(video: T) => ({
  ...video,
  type: toApiVideoType(video.type),
})

const parseSinceDate = (value?: string): Date | null => {
  if (!value) return null

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

// POST - Create new video
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!["ADMIN", "EDITOR"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createVideoSchema.parse(body)
    const requestedType = resolveApiVideoType({
      type: validatedData.type,
      mode: body.mode,
      bucket: body.bucket,
    })

    // Create video with relations
    const video = await prisma.video.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        videoUrl: body.videoUrl, // From upload endpoint
        thumbnailUrl: body.thumbnailUrl,
        duration: body.duration,
        fileSize: body.fileSize,
        mimeType: body.mimeType,
        type: requestedType ? toPrismaVideoType(requestedType) : "THAI_CLIP",
        visibility: validatedData.visibility,
        status: "READY",
        categoryId: validatedData.categoryId,
        createdById: user.userId,
      },
      include: {
        category: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Add allowed domains if visibility is DOMAIN_RESTRICTED
    if (validatedData.visibility === "DOMAIN_RESTRICTED" && validatedData.allowedDomainIds) {
      await Promise.all(
        validatedData.allowedDomainIds.map((domainId) =>
          prisma.videoAllowedDomain.create({
            data: {
              videoId: video.id,
              domainId: domainId,
            },
          }),
        ),
      )
    }

    return NextResponse.json(
      {
        message: "Video created successfully",
        video: mapVideoResponse(video),
        data: mapVideoResponse(video),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create video error:", error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create video" }, { status: 500 })
  }
}

// GET - List videos with filters
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const validatedQuery = videoQuerySchema.parse(query)

    const limit = validatedQuery.per_page ?? validatedQuery.limit
    const requestedType = resolveApiVideoType({
      type: validatedQuery.type,
      mode: validatedQuery.mode,
      bucket: validatedQuery.bucket,
    })
    const sinceDate = parseSinceDate(validatedQuery.since)

    // Build where clause
    const filters: Prisma.VideoWhereInput[] = []

    if (validatedQuery.search) {
      filters.push({
        OR: [
          { title: { contains: validatedQuery.search, mode: "insensitive" } },
          { description: { contains: validatedQuery.search, mode: "insensitive" } },
        ],
      })
    }

    if (validatedQuery.categoryId) {
      filters.push({ categoryId: validatedQuery.categoryId })
    }

    if (requestedType) {
      filters.push({ type: toPrismaVideoType(requestedType) })
    }

    if (validatedQuery.visibility) {
      filters.push({ visibility: validatedQuery.visibility })
    }

    if (sinceDate) {
      filters.push({ updatedAt: { gt: sinceDate } })
    }

    // Non-admin users can only see public videos and their own
    if (user.role !== "ADMIN") {
      filters.push({ OR: [{ visibility: "PUBLIC" }, { createdById: user.userId }] })
    }

    const where: Prisma.VideoWhereInput = {
      status: "READY",
      ...(filters.length > 0 ? { AND: filters } : {}),
    }

    // Sorting
    const orderBy: Prisma.VideoOrderByWithRelationInput =
      validatedQuery.sort === "oldest"
        ? { createdAt: "asc" }
        : validatedQuery.sort === "popular"
          ? { views: "desc" }
          : { createdAt: "desc" }

    // Pagination
    const skip = (validatedQuery.page - 1) * limit
    const take = limit

    // Execute query
    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          category: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.video.count({ where }),
    ])

    const mappedVideos = videos.map((video) => mapVideoResponse(video))
    const totalPages = Math.ceil(total / limit)
    const hasMore = validatedQuery.page * limit < total

    return NextResponse.json({
      data: mappedVideos,
      videos: mappedVideos,
      pagination: {
        page: validatedQuery.page,
        limit,
        per_page: limit,
        total,
        totalPages,
        total_pages: totalPages,
        next_page: hasMore ? validatedQuery.page + 1 : null,
        has_more: hasMore,
      },
    })
  } catch (error) {
    console.error("List videos error:", error)
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 })
  }
}
