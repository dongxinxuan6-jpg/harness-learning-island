import { SourceTierSchema } from "@jingjian/domain";
import { z } from "zod";

const FeedConfigSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  url: z.string().url().refine((value) => value.startsWith("https://") || value.startsWith("http://")),
  tier: SourceTierSchema,
  language: z.enum(["zh", "en"])
});

export type FeedConfig = z.infer<typeof FeedConfigSchema>;

export const DEFAULT_FEEDS: FeedConfig[] = [
  { id: "meta-product-news", name: "Meta Product News", url: "https://about.fb.com/news/category/product-news/feed/", tier: "official", language: "en" },
  { id: "android-developers", name: "Android Developers", url: "https://android-developers.googleblog.com/feeds/posts/default", tier: "official", language: "en" },
  { id: "google-products", name: "Google Product News", url: "https://blog.google/rss/", tier: "official", language: "en" },
  { id: "uploadvr", name: "UploadVR", url: "https://www.uploadvr.com/rss/", tier: "media", language: "en" }
];

export function parseFeedConfig(value: string | undefined): FeedConfig[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      const result = FeedConfigSchema.safeParse(item);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
}

export function mergeFeedConfigs(configured: FeedConfig[]): FeedConfig[] {
  return [...new Map([...DEFAULT_FEEDS, ...configured].map((feed) => [feed.id, feed])).values()];
}

export function parsePositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function canEnableAiRuntime(apiKey: string | undefined, persistenceConfigured: boolean, allowStateless: boolean): boolean {
  return Boolean(apiKey && (persistenceConfigured || allowStateless));
}
