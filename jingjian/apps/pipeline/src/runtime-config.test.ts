import { describe, expect, it } from "vitest";
import { canEnableAiRuntime, DEFAULT_FEEDS, mergeFeedConfigs, parseFeedConfig, parsePositiveNumber } from "./runtime-config";

describe("runtime configuration", () => {
  it("keeps valid feeds and drops malformed entries", () => {
    const feeds = parseFeedConfig(JSON.stringify([
      { id: "official", name: "Official", url: "https://example.com/rss", tier: "official", language: "en" },
      { id: "bad-tier", name: "Bad", url: "https://example.com/bad", tier: "unknown", language: "en" },
      { id: "bad-url", name: "Bad", url: "not-a-url", tier: "media", language: "zh" }
    ]));

    expect(feeds).toEqual([
      { id: "official", name: "Official", url: "https://example.com/rss", tier: "official", language: "en" }
    ]);
  });

  it("returns an empty feed list for malformed JSON or a non-array value", () => {
    expect(parseFeedConfig("{")).toEqual([]);
    expect(parseFeedConfig("{}")).toEqual([]);
  });

  it("uses a conservative fallback for invalid positive numbers", () => {
    expect(parsePositiveNumber("7.3", 7.2)).toBe(7.3);
    expect(parsePositiveNumber("not-a-number", 7.2)).toBe(7.2);
    expect(parsePositiveNumber("-1", 7.2)).toBe(7.2);
    expect(parsePositiveNumber(undefined, 7.2)).toBe(7.2);
  });

  it("ships official and industry defaults while allowing an id-based override", () => {
    const override = { ...DEFAULT_FEEDS[0], url: "https://mirror.example/feed" };
    const merged = mergeFeedConfigs([override]);

    expect(DEFAULT_FEEDS.some((feed) => feed.tier === "official")).toBe(true);
    expect(DEFAULT_FEEDS.some((feed) => feed.tier === "media")).toBe(true);
    expect(merged.find((feed) => feed.id === override.id)?.url).toBe(override.url);
  });

  it("requires persistent state for AI unless a one-off run is explicit", () => {
    expect(canEnableAiRuntime(undefined, true, false)).toBe(false);
    expect(canEnableAiRuntime("key", false, false)).toBe(false);
    expect(canEnableAiRuntime("key", true, false)).toBe(true);
    expect(canEnableAiRuntime("key", false, true)).toBe(true);
  });
});
