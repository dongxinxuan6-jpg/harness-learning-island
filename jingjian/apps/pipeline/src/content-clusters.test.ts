import { describe, expect, it } from "vitest";
import type { Enrichment } from "./ai";
import { clusterEnrichedCandidates } from "./content-clusters";
import type { RawCandidate } from "./types";

const candidate = (id: string, title: string, url: string, sourceTier: RawCandidate["sourceTier"] = "media"): RawCandidate => ({
  id,
  sourceId: id,
  sourceName: id,
  sourceTier,
  language: "en",
  title,
  url,
  text: title,
  publishedAt: "2026-08-03T00:00:00.000Z",
  contentHash: id
});

const enrichment = (tags: string[]): Enrichment => ({
  productRelevance: 0.9,
  summary: "Summary",
  whyItMatters: "Why",
  beginnerNote: "Note",
  productImpact: "Impact",
  tags,
  productCandidate: null
});

describe("clusterEnrichedCandidates", () => {
  it("merges independently reported candidates with the same specific topic", () => {
    const clustered = clusterEnrichedCandidates([
      { candidate: candidate("official", "Meta launches display glasses", "https://meta.test/news", "official"), enrichment: enrichment(["Meta", "轻显示", "手势交互"]) },
      { candidate: candidate("media", "Meta display glasses launch analysis", "https://media.test/story"), enrichment: enrichment(["Meta", "轻显示", "产品发布"]) },
      { candidate: candidate("community", "Hands on with new Meta display", "https://forum.test/thread", "community"), enrichment: enrichment(["Meta", "轻显示", "体验"]) }
    ]);

    expect(clustered).toHaveLength(1);
    expect(clustered[0].candidate.id).toBe("official");
    expect(clustered[0].candidate.observations).toHaveLength(3);
  });

  it("does not merge unrelated candidates that only share a generic tag", () => {
    const clustered = clusterEnrichedCandidates([
      { candidate: candidate("one", "Battery architecture", "https://one.test/a"), enrichment: enrichment(["AI 眼镜", "续航"]) },
      { candidate: candidate("two", "Optical display", "https://two.test/b"), enrichment: enrichment(["AI 眼镜", "光学"]) }
    ]);

    expect(clustered).toHaveLength(2);
  });
});
