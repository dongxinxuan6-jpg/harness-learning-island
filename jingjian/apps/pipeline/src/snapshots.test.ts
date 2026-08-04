import { describe, expect, it } from "vitest";
import type { ContentItem } from "@jingjian/domain";
import { seedDataset } from "./seed-data";
import { createSnapshotFiles } from "./snapshots";

describe("createSnapshotFiles", () => {
  it("emits every public data contract", () => {
    const files = createSnapshotFiles({
      generatedAt: "2026-08-03T02:00:00Z",
      contents: [], products: [], projects: [], signals: [], learningNodes: [], weekly: []
    });

    expect(Object.keys(files)).toEqual(expect.arrayContaining([
      "data/latest/daily.json",
      "data/rankings/value.json",
      "data/rankings/heat.json",
      "data/products/index.json",
      "data/products/candidates.json",
      "data/projects/index.json",
      "data/radar/latest.json",
      "data/learning/route.json",
      "data/search-index.json"
    ]));
  });

  it("publishes the newest weekly digest through a stable URL", () => {
    const older = { isoWeek: "2026-W31", generatedAt: "2026-08-02T00:00:00Z", title: "Old weekly", thesis: "old", signalIds: [], contentIds: [], sections: [{ title: "长期信号", body: "old" }, { title: "短期噪音", body: "old" }, { title: "下周学习", body: "old" }] };
    const latest = { ...older, isoWeek: "2026-W32", thesis: "latest" };
    const files = createSnapshotFiles({ generatedAt: "2026-08-03T02:00:00Z", contents: [], products: [], projects: [], signals: [], learningNodes: [], weekly: [older, latest] });
    expect(files["data/weekly/latest.json"]).toEqual(latest);
  });

  it("uses the Beijing calendar date for the daily digest", () => {
    const files = createSnapshotFiles({
      generatedAt: "2026-08-02T20:17:00.000Z",
      contents: [], products: [], projects: [], signals: [], learningNodes: [], weekly: []
    });

    expect((files["data/latest/daily.json"] as { date: string }).date).toBe("2026-08-03");
  });

  it("limits a heat refresh to heat and search snapshots", () => {
    const files = createSnapshotFiles({
      generatedAt: "2026-08-03T04:17:00.000Z",
      contents: [], products: [], projects: [], signals: [], learningNodes: [], weekly: []
    }, { kind: "heat" });

    expect(Object.keys(files).sort()).toEqual([
      "data/rankings/heat.json",
      "data/search-index.json"
    ]);
  });

  it("keeps the daily digest within fifteen reading minutes", () => {
    const contents = Array.from({ length: 10 }, (_, index) => ({
      id: `item-${index}`,
      slug: `item-${index}`,
      title: `Item ${index}`,
      summary: "Summary",
      whyItMatters: "Why",
      beginnerNote: "Note",
      productImpact: "Impact",
      publishedAt: "2026-08-03T00:00:00.000Z",
      readMinutes: 2,
      tags: [],
      productSlugs: [],
      learningNodeIds: [],
      sources: [{ id: "source", name: "Source", url: "https://example.com", tier: "official", language: "en", fetchedAt: "2026-08-03T00:00:00.000Z" }],
      score: { value: 100 - index, heat: 50, confidence: 1, verification: "verified", independentSources: 1, scoredAt: "2026-08-03T00:00:00.000Z" }
    })) satisfies ContentItem[];
    const files = createSnapshotFiles({ generatedAt: "2026-08-03T02:00:00.000Z", contents, products: [], projects: [], signals: [], learningNodes: [], weekly: [] });
    const daily = files["data/latest/daily.json"] as { totalReadMinutes: number; items: ContentItem[] };

    expect(daily.totalReadMinutes).toBeLessThanOrEqual(15);
    expect(daily.items).toHaveLength(7);
  });

  it("publishes the requested freshness state without dropping fallback items", () => {
    const files = createSnapshotFiles({
      generatedAt: "2026-08-03T02:00:00.000Z",
      contents: [], products: [], projects: [], signals: [], learningNodes: [], weekly: []
    }, { dailyStatus: "stale" });

    expect(files["data/latest/daily.json"]).toEqual(expect.objectContaining({ status: "stale", items: [] }));
  });

  it("keeps developing reports out of the evidence-backed value ranking", () => {
    const verified = { ...seedDataset.contents[0], id: "verified", slug: "verified", score: { ...seedDataset.contents[0].score, value: 50, verification: "verified" as const } };
    const developing = { ...seedDataset.contents[0], id: "developing", slug: "developing", score: { ...seedDataset.contents[0].score, value: 100, verification: "developing" as const } };
    const files = createSnapshotFiles({ ...seedDataset, contents: [developing, verified] });

    expect((files["data/rankings/value.json"] as { items: ContentItem[] }).items.map((item) => item.id)).toEqual(["verified"]);
    expect((files["data/rankings/heat.json"] as { items: ContentItem[] }).items.map((item) => item.id)).toContain("developing");
  });

  it("decays heat scores as discussion signals age", () => {
    const item = { ...seedDataset.contents[0], score: { ...seedDataset.contents[0].score, heat: 100, scoredAt: "2026-08-01T00:00:00.000Z" } };
    const files = createSnapshotFiles({ ...seedDataset, generatedAt: "2026-08-04T00:00:00.000Z", contents: [item] });
    const output = (files["data/rankings/heat.json"] as { items: ContentItem[] }).items[0];

    expect(output.score.heat).toBe(50);
    expect(output.score.scoredAt).toBe("2026-08-04T00:00:00.000Z");
  });

  it("includes at least one newly verified item in a fresh daily digest", () => {
    const historical = Array.from({ length: 10 }, (_, index) => ({
      ...seedDataset.contents[0],
      id: `historical-${index}`,
      slug: `historical-${index}`,
      score: { ...seedDataset.contents[0].score, value: 100 - index, verification: "verified" as const }
    }));
    const fresh = {
      ...seedDataset.contents[0],
      id: "fresh",
      slug: "fresh",
      score: { ...seedDataset.contents[0].score, value: 70, verification: "verified" as const }
    };

    const files = createSnapshotFiles({ ...seedDataset, contents: [...historical, fresh] }, { dailyStatus: "published", freshContentIds: [fresh.id] });
    const daily = files["data/latest/daily.json"] as { status: string; items: ContentItem[] };

    expect(daily.status).toBe("published");
    expect(daily.items.map((item) => item.id)).toContain("fresh");
  });
});
