import { z } from "zod";

export const SourceTierSchema = z.enum(["official", "research", "media", "community"]);
export const VerificationSchema = z.enum(["verified", "developing", "unverified"]);
export const ProductFormSchema = z.enum(["audio", "display", "spatial"]);
export const ProductStatusSchema = z.enum(["shipping", "announced", "developer-kit", "discontinued"]);
export const MaturitySchema = z.enum(["research", "developer-preview", "announced", "shipping"]);

export const SourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  tier: SourceTierSchema,
  language: z.enum(["zh", "en"]),
  fetchedAt: z.string()
});

export const ScoreSnapshotSchema = z.object({
  value: z.number().min(0).max(100),
  heat: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  verification: VerificationSchema,
  independentSources: z.number().int().nonnegative(),
  scoredAt: z.string(),
  heatSignals: z.object({
    discussionVelocity: z.number().min(0).max(100),
    crossPlatformSources: z.number().int().nonnegative(),
    observedMentions: z.number().int().nonnegative(),
    windowHours: z.number().int().positive()
  }).optional()
});

export const ContentItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  originalTitle: z.string().optional(),
  summary: z.string(),
  whyItMatters: z.string(),
  beginnerNote: z.string(),
  productImpact: z.string(),
  publishedAt: z.string(),
  readMinutes: z.number().int().positive(),
  tags: z.array(z.string()),
  productSlugs: z.array(z.string()),
  learningNodeIds: z.array(z.string()),
  sources: z.array(SourceSchema).min(1),
  score: ScoreSnapshotSchema
});

export const ProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  brand: z.string(),
  name: z.string(),
  form: ProductFormSchema,
  status: ProductStatusSchema,
  heroImage: z.string().refine((value) => value.startsWith("/") || z.string().url().safeParse(value).success, "Expected an absolute URL or site-relative path").optional(),
  officialUrl: z.string().url(),
  positioning: z.string(),
  audience: z.string(),
  scenarios: z.array(z.string()),
  capabilities: z.array(z.string()),
  specs: z.record(z.string(), z.string()),
  architecture: z.array(z.string()),
  tradeoffs: z.array(z.string()),
  updatedAt: z.string(),
  sources: z.array(SourceSchema).min(1)
});

export const GitHubProjectSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  owner: z.string(),
  repositoryUrl: z.string().url(),
  description: z.string(),
  status: z.enum(["active", "watch", "stale", "archived", "migrated"]),
  license: z.string(),
  languages: z.array(z.string()),
  supportedDevices: z.array(z.string()),
  stars: z.number().int().nonnegative(),
  latestRelease: z.string().optional(),
  lastCommitAt: z.string(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  architecture: z.array(z.string()).length(5),
  productInsight: z.string()
});

export const FrontierSignalSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  category: z.string(),
  maturity: MaturitySchema,
  date: z.string(),
  source: SourceSchema,
  productSlugs: z.array(z.string()),
  projectSlugs: z.array(z.string()),
  impact: z.number().min(0).max(100)
});

export const LearningNodeSchema = z.object({
  id: z.string(),
  stage: z.number().int().min(1).max(4),
  title: z.string(),
  question: z.string(),
  summary: z.string(),
  durationMinutes: z.number().int().positive(),
  prerequisites: z.array(z.string()),
  productSlugs: z.array(z.string()),
  outcomes: z.array(z.string())
});

export const WeeklyDigestSchema = z.object({
  isoWeek: z.string(),
  generatedAt: z.string(),
  thesis: z.string(),
  signalIds: z.array(z.string()),
  contentIds: z.array(z.string()),
  title: z.string(),
  sections: z.array(z.object({ title: z.string(), body: z.string() })).length(3),
  editorial: z.boolean().optional()
});

export type Source = z.infer<typeof SourceSchema>;
export type ContentItem = z.infer<typeof ContentItemSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type GitHubProject = z.infer<typeof GitHubProjectSchema>;
export type FrontierSignal = z.infer<typeof FrontierSignalSchema>;
export type LearningNode = z.infer<typeof LearningNodeSchema>;
export type ScoreSnapshot = z.infer<typeof ScoreSnapshotSchema>;
export type SourceTier = z.infer<typeof SourceTierSchema>;
export type WeeklyDigest = z.infer<typeof WeeklyDigestSchema>;

export type IngestRun = {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: "running" | "succeeded" | "partial" | "failed";
  discovered: number;
  published: number;
  failedSources: string[];
};

export type TopicCluster = {
  id: string;
  title: string;
  contentIds: string[];
  firstSeenAt: string;
  updatedAt: string;
};

export type ProductSnapshot = Product & { version: number };
export type RepoSnapshot = GitHubProject & { capturedAt: string };
export type DailyDigest = { date: string; generatedAt: string; leadId: string; contentIds: string[]; totalReadMinutes: number };
export type Correction = { id: string; entityType: string; entityId: string; previousValue: string; nextValue: string; reason: string; sourceUrl: string; createdAt: string };
