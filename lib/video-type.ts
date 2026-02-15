export const API_VIDEO_TYPES = ["thai_clip", "av_movie"] as const
export type ApiVideoType = (typeof API_VIDEO_TYPES)[number]

export const API_VIDEO_BUCKETS = ["media", "jav"] as const
export type ApiVideoBucket = (typeof API_VIDEO_BUCKETS)[number]

export type PrismaVideoType = "THAI_CLIP" | "AV_MOVIE"

export const parseApiVideoType = (value: unknown): ApiVideoType | null => {
  if (value === "thai_clip" || value === "av_movie") {
    return value
  }
  return null
}

export const videoTypeFromBucket = (value: unknown): ApiVideoType | null => {
  if (value === "media") {
    return "thai_clip"
  }
  if (value === "jav") {
    return "av_movie"
  }
  return null
}

export const resolveApiVideoType = (input: {
  type?: unknown
  mode?: unknown
  bucket?: unknown
}): ApiVideoType | null => {
  const byType = parseApiVideoType(input.type)
  if (byType) return byType

  const byMode = parseApiVideoType(input.mode)
  if (byMode) return byMode

  return videoTypeFromBucket(input.bucket)
}

export const toPrismaVideoType = (value: ApiVideoType): PrismaVideoType =>
  value === "av_movie" ? "AV_MOVIE" : "THAI_CLIP"

export const toApiVideoType = (value?: string | null): ApiVideoType =>
  value === "AV_MOVIE" ? "av_movie" : "thai_clip"
