import { describe, expect, it } from "vitest";
import { canStartAiCall, processBudgetedCandidates, selectAiCandidates } from "./budget-selection";
import type { RawCandidate } from "./types";

const candidate = (id: string, sourceTier: RawCandidate["sourceTier"]): RawCandidate => ({
  id,
  sourceId: id,
  sourceName: id,
  sourceTier,
  language: "en",
  title: id,
  url: `https://example.com/${id}`,
  text: id,
  publishedAt: "2026-08-03T00:00:00Z",
  contentHash: id
});

const candidates = [candidate("official", "official"), candidate("paper", "research"), candidate("media", "media"), candidate("forum", "community")];

describe("selectAiCandidates", () => {
  it("keeps all source layers in normal mode", () => {
    expect(selectAiCandidates(candidates, "normal")).toHaveLength(4);
  });

  it("drops community candidates in conserve mode", () => {
    expect(selectAiCandidates(candidates, "conserve").map((item) => item.id)).toEqual(["official", "paper", "media"]);
  });

  it("keeps only primary and research evidence in essential mode", () => {
    expect(selectAiCandidates(candidates, "essential").map((item) => item.id)).toEqual(["official", "paper"]);
  });

  it("queues every candidate after the hard limit", () => {
    expect(selectAiCandidates(candidates, "defer")).toEqual([]);
  });

  it("reserves enough budget before starting each model call", () => {
    expect(canStartAiCall(199, "bulk")).toBe(true);
    expect(canStartAiCall(199.01, "bulk")).toBe(false);
    expect(canStartAiCall(195, "editorial")).toBe(true);
    expect(canStartAiCall(195.01, "editorial")).toBe(false);
  });

  it("counts a failed model response before deciding whether to start the next call", async () => {
    let runCostCny = 0;
    const process = async (item: string) => {
      runCostCny += 1.2;
      if (item === "first") throw new Error("invalid model JSON");
      return item;
    };

    const result = await processBudgetedCandidates(["first", "second"], 198.9, () => runCostCny, process);

    expect(result.fulfilled).toEqual([]);
    expect(result.failed.map((entry) => entry.candidate)).toEqual(["first"]);
    expect(result.queued).toEqual(["second"]);
    expect(result.spentCny).toBe(200.1);
  });
});
