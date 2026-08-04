import { calculateHeatScore, calculateValueScore, canonicalizeUrl, getIndependentSourceKey, type ContentItem, type Source } from "@jingjian/domain";
import type { Enrichment } from "./ai";
import type { CandidateObservation, RawCandidate } from "./types";

const HOUR_MS = 60 * 60 * 1000;
const tierEvidence: Record<Source["tier"], number> = { official: 95, research: 90, media: 72, community: 52 };
const tierExpertise: Record<Source["tier"], number> = { official: 100, research: 100, media: 70, community: 30 };

export function toContentItem(candidate: RawCandidate, enrichment: Enrichment, now: Date): ContentItem {
  const observations = uniqueObservations(candidate.observations?.length ? candidate.observations : [toObservation(candidate)]);
  const independentSources = new Set(observations.map((item) => getIndependentSourceKey(item.url))).size;
  const ageHours = Math.min(...observations.map((item) => hoursSince(item.publishedAt, now)));
  const recentMentions = observations.filter((item) => hoursSince(item.publishedAt, now) <= 24).length;
  const discussionVelocity = clamp(Math.round(10 + recentMentions * 15 + Math.max(0, 24 - ageHours) * 0.8));
  const crossPlatformConcentration = scaleCount(independentSources, [15, 50, 75, 90, 100]);
  const independentSourceScore = scaleCount(independentSources, [20, 55, 80, 100]);
  const expertParticipation = Math.round(observations.reduce((sum, item) => sum + tierExpertise[item.sourceTier], 0) / observations.length);
  const recency = ageHours <= 6 ? 100 : ageHours <= 24 ? 85 : ageHours <= 72 ? 65 : ageHours <= 168 ? 40 : 15;
  const hasPrimaryEvidence = observations.some((item) => item.sourceTier === "official" || item.sourceTier === "research");
  const verification = hasPrimaryEvidence || (independentSources >= 2 && observations.some((item) => item.sourceTier === "media")) ? "verified" as const : "developing" as const;
  const confidence = Math.min(0.95, round2(0.52 + Math.min(independentSources, 3) * 0.08 + (verification === "verified" ? 0.15 : 0)));
  const evidence = Math.max(...observations.map((item) => tierEvidence[item.sourceTier]));
  const value = calculateValueScore({
    evidenceQuality: evidence,
    productImpact: enrichment.productRelevance * 100,
    informationGain: 72,
    learningValue: 80,
    recency
  });
  const heat = calculateHeatScore({
    discussionVelocity,
    crossPlatformConcentration,
    independentSources: independentSourceScore,
    expertParticipation,
    recency
  });
  const slug = candidate.title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || candidate.id;

  return {
    id: candidate.id,
    slug,
    title: candidate.title,
    summary: enrichment.summary,
    whyItMatters: enrichment.whyItMatters,
    beginnerNote: enrichment.beginnerNote,
    productImpact: enrichment.productImpact,
    publishedAt: candidate.publishedAt,
    readMinutes: 2,
    tags: enrichment.tags,
    productSlugs: [],
    learningNodeIds: ["stage-4-signals"],
    sources: observations.map((item) => ({
      id: item.sourceId,
      name: item.sourceName,
      url: item.url,
      tier: item.sourceTier,
      language: item.language,
      fetchedAt: now.toISOString()
    })),
    score: {
      value,
      heat,
      confidence,
      verification,
      independentSources,
      scoredAt: now.toISOString(),
      heatSignals: {
        discussionVelocity,
        crossPlatformSources: independentSources,
        observedMentions: observations.length,
        windowHours: 24
      }
    }
  };
}

function toObservation(candidate: RawCandidate): CandidateObservation {
  return {
    sourceId: candidate.sourceId,
    sourceName: candidate.sourceName,
    sourceTier: candidate.sourceTier,
    language: candidate.language,
    url: candidate.url,
    publishedAt: candidate.publishedAt
  };
}

function uniqueObservations(observations: CandidateObservation[]): CandidateObservation[] {
  return [...new Map(observations.map((item) => [canonicalizeUrl(item.url), item])).values()];
}

function hoursSince(value: string, now: Date): number {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return 168;
  return Math.max(0, (now.getTime() - timestamp) / HOUR_MS);
}

function scaleCount(count: number, scores: number[]): number {
  return scores[Math.min(Math.max(count, 1), scores.length) - 1];
}

const clamp = (value: number): number => Math.min(100, Math.max(0, value));
const round2 = (value: number): number => Math.round(value * 100) / 100;
