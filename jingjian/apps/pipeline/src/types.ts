import { SourceTierSchema, type SourceTier } from "@jingjian/domain";
import { z } from "zod";

const httpUrlSchema = z.string().url().refine((value) => value.startsWith("https://") || value.startsWith("http://"));

export const CandidateObservationSchema = z.object({
  sourceId: z.string().trim().min(1),
  sourceName: z.string().trim().min(1),
  sourceTier: SourceTierSchema,
  language: z.enum(["zh", "en"]),
  url: httpUrlSchema,
  publishedAt: z.string().datetime()
});

export const RawCandidateSchema = z.object({
  id: z.string().trim().min(1),
  sourceId: z.string().trim().min(1),
  sourceName: z.string().trim().min(1),
  sourceTier: SourceTierSchema,
  language: z.enum(["zh", "en"]),
  title: z.string().trim().min(1),
  url: httpUrlSchema,
  text: z.string(),
  publishedAt: z.string().datetime(),
  contentHash: z.string().trim().min(1),
  observations: z.array(CandidateObservationSchema).optional()
});

export type CandidateObservation = z.infer<typeof CandidateObservationSchema>;
export type RawCandidate = z.infer<typeof RawCandidateSchema>;

export type Connector = {
  id: string;
  collect: () => Promise<RawCandidate[]>;
};

export type SourceDescriptor = {
  id: string;
  name: string;
  tier: SourceTier;
  language: "zh" | "en";
};
