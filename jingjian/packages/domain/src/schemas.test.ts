import { describe, expect, it } from "vitest";
import { ProductSchema, ScoreSnapshotSchema, WeeklyDigestSchema } from "./schemas";

describe("ProductSchema media paths", () => {
  it("accepts both local PWA assets and remote product images", () => {
    expect(ProductSchema.shape.heroImage.parse("/assets/products/even-g2.jpg")).toBe("/assets/products/even-g2.jpg");
    expect(ProductSchema.shape.heroImage.parse("https://example.com/glasses.jpg")).toBe("https://example.com/glasses.jpg");
  });

  it("rejects ambiguous relative paths", () => {
    expect(ProductSchema.shape.heroImage.safeParse("assets/glasses.jpg").success).toBe(false);
  });
});

describe("ScoreSnapshotSchema heat evidence", () => {
  it("accepts measured heat signals", () => {
    const score = ScoreSnapshotSchema.parse({
      value: 80,
      heat: 77,
      confidence: 0.9,
      verification: "verified",
      independentSources: 3,
      scoredAt: "2026-08-03T02:00:00.000Z",
      heatSignals: { discussionVelocity: 73, crossPlatformSources: 3, observedMentions: 3, windowHours: 24 }
    });

    expect(score.heatSignals?.observedMentions).toBe(3);
  });
});

describe("WeeklyDigestSchema", () => {
  it("requires the three published review sections", () => {
    const base = { isoWeek: "2026-W32", generatedAt: "2026-08-03T02:00:00Z", title: "Week 32", thesis: "Thesis", signalIds: [], contentIds: [] };
    expect(WeeklyDigestSchema.safeParse(base).success).toBe(false);
    expect(WeeklyDigestSchema.safeParse({ ...base, sections: [{ title: "长期信号", body: "A" }, { title: "短期噪音", body: "B" }, { title: "下周学习", body: "C" }] }).success).toBe(true);
  });
});
