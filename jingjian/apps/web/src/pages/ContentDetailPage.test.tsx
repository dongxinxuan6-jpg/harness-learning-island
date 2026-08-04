// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import dailyJson from "../../public/data/latest/daily.json";
import type { DailyPayload } from "../data/types";
import { ContentDetailPage } from "./ContentDetailPage";

const daily = dailyJson as DailyPayload;
const item = daily.items[0];

describe("ContentDetailPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const path = String(input);
      if (path.endsWith("/data/latest/daily.json")) return Response.json({ ...daily, items: [item] });
      if (path.endsWith("/data/learning/route.json")) return Response.json({ generatedAt: daily.generatedAt, items: [] });
      if (path.includes("/data/rankings/")) return Response.json({ generatedAt: daily.generatedAt, kind: path.includes("heat") ? "heat" : "value", items: [] });
      return new Response(null, { status: 404 });
    }));
  });

  it("opens an item that exists only in the daily digest", async () => {
    render(
      <MemoryRouter initialEntries={[`/content/${item.slug}`]}>
        <Routes><Route path="content/:slug" element={<ContentDetailPage />} /></Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: item.title })).toBeInTheDocument();
  });
});
