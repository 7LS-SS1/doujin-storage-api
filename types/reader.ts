// ============================================================
// Reader-facing TypeScript types
// ============================================================

export interface Comic {
  id: number;
  slug: string;
  title: string;
  alt_titles?: string[] | null;
  description?: string | null;
  author_name?: string | null;
  status: "ongoing" | "completed" | "hiatus";
  cover_image_url?: string | null;
  series_id?: number | null;
  created_at: string;
  updated_at: string;
  // Relations (optional, populated by some queries)
  series?: { id: number; title: string; slug: string } | null;
  categories?: Array<{ id: number; slug: string; name: string }>;
  tags?: Array<{ id: number; slug: string; name: string }>;
  // Computed / analytics-enriched
  chapter_count?: number;
  latest_chapter_number?: number;
  view_count?: number; // weekly views from analytics
}

export type ComicStatus = Comic["status"];

export type ReactionType = "like" | "love" | "heart" | "bad";

export interface ReactionCounts {
  like: number;
  love: number;
  heart: number;
  bad: number;
}

export interface ReactionState {
  currentReaction: ReactionType | null;
  counts: ReactionCounts;
}

export type AnalyticsEventType =
  | "page_view"
  | "hero_click"
  | "card_click"
  | "read_click"
  | "reaction_click";

export interface AnalyticsEvent {
  event_type: AnalyticsEventType;
  comic_id?: number;
  chapter_id?: number;
  source_position?: number;
  device?: string;
}
