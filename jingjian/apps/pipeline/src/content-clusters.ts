import type { Enrichment } from "./ai";
import type { CandidateObservation, RawCandidate } from "./types";

export type EnrichedCandidate = { candidate: RawCandidate; enrichment: Enrichment };

const genericTags = new Set(["ai眼镜", "ai", "眼镜", "smartglasses", "smartglasses", "xr", "ar", "产品", "技术"]);
const tierPriority: Record<RawCandidate["sourceTier"], number> = { official: 4, research: 3, media: 2, community: 1 };

export function clusterEnrichedCandidates(items: EnrichedCandidate[]): EnrichedCandidate[] {
  const parent = items.map((_, index) => index);
  const find = (index: number): number => {
    if (parent[index] !== index) parent[index] = find(parent[index]);
    return parent[index];
  };
  const union = (left: number, right: number) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
  };

  for (let left = 0; left < items.length; left += 1) {
    for (let right = left + 1; right < items.length; right += 1) {
      if (isSameTopic(items[left], items[right])) union(left, right);
    }
  }

  const groups = new Map<number, EnrichedCandidate[]>();
  items.forEach((item, index) => {
    const root = find(index);
    groups.set(root, [...(groups.get(root) ?? []), item]);
  });

  return [...groups.values()].map(mergeCluster);
}

function isSameTopic(left: EnrichedCandidate, right: EnrichedCandidate): boolean {
  const leftTags = specificTags(left.enrichment.tags);
  const rightTags = specificTags(right.enrichment.tags);
  const sharedTags = [...leftTags].filter((tag) => rightTags.has(tag)).length;
  if (sharedTags >= 2) return true;
  if (sharedTags === 0) return false;

  const rightTitleTokens = titleTokens(right.candidate.title);
  return [...titleTokens(left.candidate.title)].some((token) => rightTitleTokens.has(token));
}

function mergeCluster(cluster: EnrichedCandidate[]): EnrichedCandidate {
  const primary = [...cluster].sort((left, right) => {
    const tierDifference = tierPriority[right.candidate.sourceTier] - tierPriority[left.candidate.sourceTier];
    return tierDifference || right.enrichment.productRelevance - left.enrichment.productRelevance;
  })[0];
  const observations = cluster.flatMap(({ candidate }) => candidate.observations?.length ? candidate.observations : [toObservation(candidate)]);
  const newestPublishedAt = cluster.map((item) => item.candidate.publishedAt).sort().at(-1) ?? primary.candidate.publishedAt;
  const tags = [...new Set(cluster.flatMap((item) => item.enrichment.tags))].slice(0, 8);

  return {
    candidate: { ...primary.candidate, publishedAt: newestPublishedAt, observations },
    enrichment: {
      ...primary.enrichment,
      productRelevance: Math.max(...cluster.map((item) => item.enrichment.productRelevance)),
      tags
    }
  };
}

function specificTags(tags: string[]): Set<string> {
  return new Set(tags.map(normalize).filter((tag) => tag && !genericTags.has(tag)));
}

function titleTokens(title: string): Set<string> {
  return new Set((title.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []).filter((token) => !genericTags.has(token)));
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
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
