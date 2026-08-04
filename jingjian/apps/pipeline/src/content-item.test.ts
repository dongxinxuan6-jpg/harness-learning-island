import { describe, expect, it } from "vitest";
import type { Enrichment } from "./ai";
import { toContentItem } from "./content-item";
import type { RawCandidate } from "./types";

const enrichment: Enrichment = {
  productRelevance: 0.9,
  summary: "Summary",
  whyItMatters: "Why it matters",
  beginnerNote: "Beginner note",
  productImpact: "Product impact",
  tags: ["端侧 AI"],
  productCandidate: null
};

describe("toContentItem", () => {
  it("scores heat from traceable observations instead of fixed placeholders", () => {
    const candidate: RawCandidate = {
      id: "topic-1",
      sourceId: "official",
      sourceName: "Official",
      sourceTier: "official",
      language: "en",
      title: "AI glasses topic",
      url: "https://brand.test/post",
      text: "text",
      publishedAt: "2026-08-03T00:00:00.000Z",
      contentHash: "hash",
      observations: [
        { sourceId: "official", sourceName: "Official", sourceTier: "official", language: "en", url: "https://brand.test/post", publishedAt: "2026-08-03T00:00:00.000Z" },
        { sourceId: "media", sourceName: "Media", sourceTier: "media", language: "en", url: "https://media.test/story", publishedAt: "2026-08-03T00:00:00.000Z" },
        { sourceId: "community", sourceName: "Community", sourceTier: "community", language: "zh", url: "https://forum.test/thread", publishedAt: "2026-08-03T00:00:00.000Z" }
      ]
    };

    const item = toContentItem(candidate, enrichment, new Date("2026-08-03T02:00:00.000Z"));

    expect(item.sources).toHaveLength(3);
    expect(item.score.independentSources).toBe(3);
    expect(item.score.verification).toBe("verified");
    expect(item.score.heat).toBe(77);
    expect(item.score.heatSignals).toEqual({
      discussionVelocity: 73,
      crossPlatformSources: 3,
      observedMentions: 3,
      windowHours: 24
    });
  });

  it("keeps a single community observation in developing state", () => {
    const candidate: RawCandidate = {
      id: "topic-2",
      sourceId: "community",
      sourceName: "Community",
      sourceTier: "community",
      language: "zh",
      title: "Community topic",
      url: "https://forum.test/thread",
      text: "text",
      publishedAt: "2026-08-01T00:00:00.000Z",
      contentHash: "hash"
    };

    const item = toContentItem(candidate, enrichment, new Date("2026-08-03T02:00:00.000Z"));

    expect(item.score.independentSources).toBe(1);
    expect(item.score.verification).toBe("developing");
    expect(item.score.confidence).toBeLessThan(0.7);
  });
});
