import { describe, expect, it } from "vitest";
import type { ContentItem, Product } from "@jingjian/domain";
import { calculateRunQuality } from "./quality";

const content = (id: string, independentSources: number, urls: string[]): ContentItem => ({
  id,
  slug: id,
  title: id,
  summary: "Summary",
  whyItMatters: "Why",
  beginnerNote: "Note",
  productImpact: "Impact",
  publishedAt: "2026-08-03T00:00:00.000Z",
  readMinutes: 2,
  tags: [],
  productSlugs: [],
  learningNodeIds: [],
  sources: urls.map((url, index) => ({ id: `s-${index}`, name: "Source", url, tier: "official", language: "en", fetchedAt: "2026-08-03T02:00:00.000Z" })),
  score: { value: 80, heat: 70, confidence: 0.9, verification: "verified", independentSources, scoredAt: "2026-08-03T02:00:00.000Z" }
});

describe("calculateRunQuality", () => {
  it("reports source, evidence and product coverage from published data", () => {
    const products = [
      { sources: [{ url: "https://brand.test" }] },
      { sources: [] }
    ] as unknown as Product[];

    expect(calculateRunQuality({
      totalSources: 3,
      failedSources: 1,
      contents: [
        content("traceable", 2, ["https://one.test/a", "https://two.test/b"]),
        content("mismatch", 2, ["https://one.test/a"])
      ],
      products,
      publishedItems: 2,
      readMinutes: 4
    })).toEqual({
      sourceSuccessRate: 67,
      evidenceCompleteness: 50,
      productCoverage: 50,
      publishedItems: 2,
      readMinutes: 4
    });
  });
});
