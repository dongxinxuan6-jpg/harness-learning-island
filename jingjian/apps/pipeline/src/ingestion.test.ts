import { describe, expect, it } from "vitest";
import { runIngestion } from "./ingestion";
import type { Connector } from "./types";

describe("runIngestion", () => {
  it("keeps successful sources when another connector fails and deduplicates results", async () => {
    const successful: Connector = {
      id: "official",
      collect: async () => [
        { id: "a", sourceId: "official", sourceName: "Official", sourceTier: "official", language: "en", title: "One", url: "https://example.com/post?utm_source=x", text: "same", publishedAt: "2026-08-03T01:00:00Z", contentHash: "hash" },
        { id: "b", sourceId: "official", sourceName: "Official", sourceTier: "official", language: "en", title: "One copy", url: "https://example.com/post", text: "same", publishedAt: "2026-08-03T01:00:00Z", contentHash: "hash2" }
      ]
    };
    const failed: Connector = { id: "community", collect: async () => { throw new Error("rate limited"); } };

    const result = await runIngestion([successful, failed], new Date("2026-08-03T01:30:00Z"));

    expect(result.status).toBe("partial");
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].observations).toHaveLength(2);
    expect(result.candidates[0].observations?.map((item) => item.url)).toEqual([
      "https://example.com/post?utm_source=x",
      "https://example.com/post"
    ]);
    expect(result.failedSources).toEqual(["community"]);
  });

  it("drops malformed candidates at the connector boundary", async () => {
    const connector: Connector = {
      id: "mixed",
      collect: async () => [
        { id: "bad", sourceId: "mixed", sourceName: "Mixed", sourceTier: "media", language: "en", title: "Bad", url: "javascript:alert(1)", text: "Bad", publishedAt: "2026-08-03T01:00:00Z", contentHash: "bad" },
        { id: "good", sourceId: "mixed", sourceName: "Mixed", sourceTier: "media", language: "en", title: "Good", url: "https://example.com/good", text: "Good", publishedAt: "2026-08-03T01:00:00Z", contentHash: "good" }
      ]
    };

    const result = await runIngestion([connector], new Date("2026-08-03T01:30:00Z"));

    expect(result.status).toBe("succeeded");
    expect(result.candidates.map((item) => item.id)).toEqual(["good"]);
  });
});
