// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { DailyLead } from "./DailyLead";

afterEach(cleanup);

describe("DailyLead", () => {
  it("shows the lead conclusion, value score and source", () => {
    render(<MemoryRouter><DailyLead item={{
      id: "one", slug: "one", title: "Android XR 定义显示眼镜", summary: "平台开始形成。", whyItMatters: "影响产品形态。",
      beginnerNote: "短信息显示。", productImpact: "降低适配成本。", publishedAt: "2026-08-03", readMinutes: 2,
      tags: ["Android XR"], productSlugs: [], learningNodeIds: [],
      sources: [{ id: "s", name: "Android Developers", url: "https://example.com", tier: "official", language: "en", fetchedAt: "2026-08-03" }],
      score: { value: 94, heat: 80, confidence: 0.9, verification: "verified", independentSources: 2, scoredAt: "2026-08-03" }
    }} /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: "Android XR 定义显示眼镜" })).toBeInTheDocument();
    expect(screen.getByText("94")).toBeInTheDocument();
    expect(screen.getByText("Android Developers")).toBeInTheDocument();
  });

  it("does not label a media source as first-party evidence", () => {
    render(<MemoryRouter><DailyLead item={{
      id: "media", slug: "media", title: "Hands-on", summary: "Summary", whyItMatters: "Why", beginnerNote: "Note", productImpact: "Impact", publishedAt: "2026-08-03", readMinutes: 2,
      tags: [], productSlugs: [], learningNodeIds: [],
      sources: [{ id: "s", name: "Media", url: "https://example.com", tier: "media", language: "en", fetchedAt: "2026-08-03" }],
      score: { value: 80, heat: 80, confidence: 0.8, verification: "verified", independentSources: 2, scoredAt: "2026-08-03" }
    }} /></MemoryRouter>);

    expect(screen.getByText("媒体")).toBeInTheDocument();
    expect(screen.queryByText("一手")).not.toBeInTheDocument();
  });
});
