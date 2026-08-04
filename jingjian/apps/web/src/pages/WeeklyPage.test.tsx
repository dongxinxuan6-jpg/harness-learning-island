// @vitest-environment jsdom
import valueJson from "../../public/data/rankings/value.json";
import radarJson from "../../public/data/radar/latest.json";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WeeklyPage } from "./WeeklyPage";

describe("WeeklyPage", () => {
  beforeEach(() => {
    localStorage.clear();
    const content = {
      ...valueJson.items[0],
      id: "dynamic-content",
      title: "Dynamic product topic",
      sources: [{ ...valueJson.items[0].sources[0], name: "Dynamic official source", url: "https://example.com/dynamic-source" }]
    };
    const signal = { ...radarJson.items[0], id: "dynamic-signal", title: "Dynamic frontier signal" };
    const hot = { ...content, id: "dynamic-hot", slug: "dynamic-hot", title: "Dynamic hot discussion", score: { ...content.score, heat: 99, verification: "developing" as const } };
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const path = String(input);
      if (path.includes("weekly")) return Response.json({
        isoWeek: "2026-W33",
        generatedAt: "2026-08-10T02:00:00.000Z",
        title: "Dynamic weekly review",
        thesis: "Dynamic thesis",
        contentIds: [content.id, hot.id],
        signalIds: [signal.id],
        sections: [
          { title: "长期信号", body: "Long-term body." },
          { title: "短期噪音", body: "Noise body." },
          { title: "下周学习", body: "Study dynamic runtime first。Then compare products." }
        ]
      });
      if (path.includes("rankings/value")) return Response.json({ ...valueJson, items: [content] });
      if (path.includes("rankings/heat")) return Response.json({ ...valueJson, kind: "heat", items: [hot, content] });
      if (path.includes("radar")) return Response.json({ ...radarJson, items: [signal] });
      return new Response(null, { status: 404 });
    }));
  });

  afterEach(cleanup);

  it("derives the weekly matrix and primary source from this week's entities", async () => {
    render(<MemoryRouter><WeeklyPage /></MemoryRouter>);
    expect(await screen.findByText("Dynamic product topic")).toBeInTheDocument();
    expect(screen.getByText("Dynamic frontier signal")).toBeInTheDocument();
    expect(screen.getByText("Dynamic hot discussion")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Dynamic official source/ })).toHaveAttribute("href", "https://example.com/dynamic-source");
    expect(screen.queryByText("Android XR 形态分类")).not.toBeInTheDocument();
  });
});
