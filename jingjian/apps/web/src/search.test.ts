import { describe, expect, it } from "vitest";
import { filterSearchResults } from "./search";

const items = [
  { type: "product" as const, slug: "meta-ray-ban", title: "Meta Ray-Ban", summary: "无显示 AI 眼镜" },
  { type: "signal" as const, slug: "first-person", title: "第一视角理解", summary: "First-person multimodal models" }
];

describe("filterSearchResults", () => {
  it("does not expose the full index before a query is entered", () => {
    expect(filterSearchResults(items, "")).toEqual([]);
    expect(filterSearchResults(items, "   ")).toEqual([]);
  });

  it("matches title and summary case-insensitively", () => {
    expect(filterSearchResults(items, "ray-BAN")).toEqual([items[0]]);
    expect(filterSearchResults(items, "MULTIMODAL")).toEqual([items[1]]);
  });
});
