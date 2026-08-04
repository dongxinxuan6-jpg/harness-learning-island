import {
  ContentItemSchema,
  FrontierSignalSchema,
  GitHubProjectSchema,
  LearningNodeSchema,
  ProductSchema,
  WeeklyDigestSchema
} from "@jingjian/domain";
import { z, type ZodType } from "zod";

const collection = (item: ZodType) => z.object({ generatedAt: z.string(), items: z.array(item) }).passthrough();
const rankingSchema = collection(ContentItemSchema).extend({ kind: z.enum(["value", "heat"]) });
const dailySchema = z.object({
  date: z.string(),
  generatedAt: z.string(),
  status: z.enum(["published", "partial", "stale"]),
  totalReadMinutes: z.number().nonnegative(),
  leadId: z.string().nullable(),
  items: z.array(ContentItemSchema)
}).passthrough();
const weeklySchema = WeeklyDigestSchema.extend({
  title: z.string(),
  sections: z.array(z.object({ title: z.string(), body: z.string() }))
});
const searchSchema = collection(z.object({
  type: z.enum(["content", "product", "project", "signal"]),
  slug: z.string(),
  title: z.string(),
  summary: z.string()
}));
const systemStatusSchema = z.object({
  generatedAt: z.string(),
  ingestion: z.object({ status: z.enum(["succeeded", "partial", "failed"]), discovered: z.number().int().nonnegative(), failedSources: z.array(z.string()) }),
  budget: z.object({ spentCny: z.number().nonnegative(), hardLimitCny: z.number().positive(), mode: z.enum(["normal", "conserve", "essential", "defer"]), queuedForNextMonth: z.number().int().nonnegative() }),
  persistence: z.enum(["not-configured", "succeeded", "degraded"]),
  quality: z.object({ sourceSuccessRate: z.number(), evidenceCompleteness: z.number(), productCoverage: z.number(), publishedItems: z.number().int().nonnegative(), readMinutes: z.number().nonnegative() }).optional(),
  usage: z.array(z.object({
    model: z.string(),
    purpose: z.string(),
    inputTokens: z.number().nonnegative(),
    cachedInputTokens: z.number().nonnegative(),
    outputTokens: z.number().nonnegative(),
    usd: z.number().nonnegative(),
    cny: z.number().nonnegative()
  }))
}).passthrough();

export function validatePublicData(path: string, value: unknown): unknown {
  const pathname = path.split("?", 1)[0];
  if (pathname === "/data/latest/daily.json") return dailySchema.parse(value);
  if (pathname === "/data/rankings/value.json" || pathname === "/data/rankings/heat.json") return rankingSchema.parse(value);
  if (pathname === "/data/products/index.json") return collection(ProductSchema).parse(value);
  if (pathname === "/data/projects/index.json") return collection(GitHubProjectSchema).parse(value);
  if (pathname === "/data/radar/latest.json") return collection(FrontierSignalSchema).parse(value);
  if (pathname === "/data/learning/route.json") return collection(LearningNodeSchema).parse(value);
  if (pathname === "/data/search-index.json") return searchSchema.parse(value);
  if (pathname === "/data/system/status.json") return systemStatusSchema.parse(value);
  if (/^\/data\/products\/[^/]+\.json$/.test(pathname)) return ProductSchema.parse(value);
  if (/^\/data\/projects\/[^/]+\.json$/.test(pathname)) return GitHubProjectSchema.parse(value);
  if (pathname === "/data/weekly/latest.json" || /^\/data\/weekly\/[^/]+\.json$/.test(pathname)) return weeklySchema.parse(value);
  return value;
}
