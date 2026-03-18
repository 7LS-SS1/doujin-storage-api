import { NextResponse } from "next/server";

const BASE_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",
  "Cache-Control": "no-store",
} as const;

export function engagementJson(
  body: unknown,
  status = 200,
  methods = "GET, POST, DELETE, OPTIONS"
) {
  return NextResponse.json(body, {
    status,
    headers: {
      ...BASE_CORS_HEADERS,
      "Access-Control-Allow-Methods": methods,
    },
  });
}

export function engagementOptions(methods = "GET, POST, DELETE, OPTIONS") {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...BASE_CORS_HEADERS,
      "Access-Control-Allow-Methods": methods,
      "Access-Control-Max-Age": "86400",
    },
  });
}

export function sanitizeString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

export function parsePrefixedId(
  value: unknown,
  prefix: string
): string | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return String(value);
  }

  if (typeof value !== "string") {
    return null;
  }

  const raw = value.trim();
  if (!raw) return null;

  let numericPart = raw;
  if (raw.startsWith(`${prefix}_`)) {
    numericPart = raw.slice(prefix.length + 1);
  } else if (raw.startsWith(`${prefix}:`)) {
    numericPart = raw.slice(prefix.length + 1);
  }

  if (!/^[A-Za-z0-9-]+$/.test(numericPart)) {
    return null;
  }

  return numericPart;
}

export function normalizeDevice(value: unknown): "mobile" | "tablet" | "desktop" | null {
  const device = sanitizeString(value, 20)?.toLowerCase();
  if (device === "mobile" || device === "tablet" || device === "desktop") {
    return device;
  }
  return null;
}

export function normalizeTimestamp(value: unknown): string | null {
  const raw = sanitizeString(value, 100);
  if (!raw) return null;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

export function buildActorKey({
  userId,
  anonId,
  sessionId,
}: {
  userId?: string | null;
  anonId?: string | null;
  sessionId?: string | null;
}) {
  if (userId) return `user:${userId}`;
  if (anonId) return `anon:${anonId}`;
  if (sessionId) return `session:${sessionId}`;
  return null;
}
