import type { ContentItem, FrontierSignal, GitHubProject, LearningNode, Product } from "@jingjian/domain";

export type Collection<T> = { generatedAt: string; items: T[] };
export type DailyPayload = {
  date: string;
  generatedAt: string;
  status: "published" | "partial" | "stale";
  totalReadMinutes: number;
  leadId: string | null;
  items: ContentItem[];
};
export type RankingPayload = Collection<ContentItem> & { kind: "value" | "heat" };
export type ProductPayload = Collection<Product>;
export type ProjectPayload = Collection<GitHubProject>;
export type RadarPayload = Collection<FrontierSignal>;
export type LearningPayload = Collection<LearningNode>;
export type SearchResult = { type: "content" | "product" | "project" | "signal"; slug: string; title: string; summary: string };
export type SearchPayload = Collection<SearchResult>;
export type WeeklyPayload = { isoWeek: string; generatedAt: string; thesis: string; title: string; signalIds: string[]; contentIds: string[]; sections: Array<{ title: string; body: string }> };
export type SystemStatusPayload = {
  generatedAt: string;
  ingestion: { status: "succeeded" | "partial" | "failed"; discovered: number; failedSources: string[] };
  budget: { spentCny: number; hardLimitCny: number; mode: "normal" | "conserve" | "essential" | "defer"; queuedForNextMonth: number };
  persistence: "not-configured" | "succeeded" | "degraded";
  quality?: { sourceSuccessRate: number; evidenceCompleteness: number; productCoverage: number; publishedItems: number; readMinutes: number };
  usage: Array<{ model: string; purpose: string; cny: number }>;
};

export const dataPaths = {
  daily: "/data/latest/daily.json",
  value: "/data/rankings/value.json",
  heat: "/data/rankings/heat.json",
  products: "/data/products/index.json",
  projects: "/data/projects/index.json",
  radar: "/data/radar/latest.json",
  learning: "/data/learning/route.json",
  search: "/data/search-index.json",
  weekly: "/data/weekly/latest.json",
  status: "/data/system/status.json"
} as const;
