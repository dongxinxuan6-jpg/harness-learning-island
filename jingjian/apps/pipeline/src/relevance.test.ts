import { describe, expect, it } from "vitest";
import type { RawCandidate } from "./types";
import { isLikelyAiGlassesContent } from "./relevance";

const candidate = (title: string, text = ""): RawCandidate => ({
  id: "candidate",
  sourceId: "source",
  sourceName: "Source",
  sourceTier: "media",
  language: "en",
  title,
  text,
  url: "https://example.com/article",
  publishedAt: "2026-08-03T00:00:00Z",
  contentHash: "hash"
});

describe("isLikelyAiGlassesContent", () => {
  it.each([
    "Meta AI glasses get a new first-person model",
    "Android XR adds support for display glasses",
    "Rokid 发布新款 AI 眼镜",
    "Waveguide optics improve smart eyewear efficiency"
  ])("keeps relevant product and technology coverage: %s", (title) => {
    expect(isLikelyAiGlassesContent(candidate(title))).toBe(true);
  });

  it("drops unrelated stories from broad product feeds", () => {
    expect(isLikelyAiGlassesContent(candidate("New tools for online advertising", "Campaign measurement updates"))).toBe(false);
  });
});
