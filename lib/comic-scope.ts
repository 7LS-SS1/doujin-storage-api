import { tableHasColumn } from "./db-schema";

export const COMIC_TYPES = ["manga", "doujin"] as const;
export type ComicType = (typeof COMIC_TYPES)[number];

export const COMIC_SCOPES = ["all", ...COMIC_TYPES] as const;
export type ComicScope = (typeof COMIC_SCOPES)[number];

export type ComicVisibility = ComicType | "all" | "none";

export function normalizeComicType(value: unknown): ComicType | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === "manga" || normalized === "doujin") {
    return normalized;
  }

  return null;
}

export function normalizeComicScope(value: unknown): ComicScope {
  if (typeof value === "string" && value.trim().toLowerCase() === "all") {
    return "all";
  }

  return normalizeComicType(value) ?? "all";
}

export function resolveComicVisibility(
  scope: ComicScope,
  requestedType: unknown
): ComicVisibility {
  const requested = normalizeComicType(requestedType);

  if (scope === "all") {
    return requested ?? "all";
  }

  if (!requested) {
    return scope;
  }

  return requested === scope ? scope : "none";
}

export function comicTypeLabel(value: unknown): string {
  const type = normalizeComicType(value);
  if (type === "doujin") return "Doujin";
  return "Manga";
}

export async function comicsHaveTypeColumn(): Promise<boolean> {
  return tableHasColumn("comics", "comic_type");
}

export async function apiKeysHaveScopeColumn(): Promise<boolean> {
  return tableHasColumn("api_keys", "scope");
}
