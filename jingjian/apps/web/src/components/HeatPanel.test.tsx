// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { ContentItem } from "@jingjian/domain";
import { HeatPanel } from "./HeatPanel";

describe("HeatPanel", () => {
  it("shows measured velocity, platform and source evidence", () => {
    const item = {
      id: "one",
      slug: "one",
      title: "端侧 AI 热议",
      summary: "Summary",
      whyItMatters: "Why",
      beginnerNote: "Note",
      productImpact: "Impact",
      publishedAt: "2026-08-03T00:00:00.000Z",
      readMinutes: 2,
      tags: ["端侧 AI"],
      productSlugs: [],
      learningNodeIds: [],
      sources: [{ id: "source", name: "Source", url: "https://example.com", tier: "official", language: "en", fetchedAt: "2026-08-03T02:00:00.000Z" }],
      score: {
        value: 90,
        heat: 77,
        confidence: 0.9,
        verification: "verified",
        independentSources: 3,
        scoredAt: "2026-08-03T02:00:00.000Z",
        heatSignals: { discussionVelocity: 73, crossPlatformSources: 3, observedMentions: 4, windowHours: 24 }
      }
    } satisfies ContentItem;

    render(<MemoryRouter><HeatPanel items={[item]} /></MemoryRouter>);

    expect(screen.getByText(/增速 73 · 3 平台 · 3 个独立来源/)).toBeInTheDocument();
  });
});
