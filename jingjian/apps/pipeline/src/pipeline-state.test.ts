import { describe, expect, it, vi } from "vitest";
import type { RawCandidate } from "./types";
import { getBeijingMonthWindow, loadPipelineState } from "./pipeline-state";

const candidate = (id: string): RawCandidate => ({
  id,
  sourceId: "source",
  sourceName: "Source",
  sourceTier: "official",
  language: "en",
  title: id,
  url: `https://example.com/${id}`,
  text: id,
  publishedAt: "2026-08-03T00:00:00.000Z",
  contentHash: `hash-${id}`
});

describe("pipeline state", () => {
  it("builds Beijing month boundaries in UTC", () => {
    expect(getBeijingMonthWindow(new Date("2026-08-31T20:00:00.000Z"))).toEqual({
      start: "2026-08-31T16:00:00.000Z",
      end: "2026-09-30T16:00:00.000Z"
    });
  });

  it("uses D1 spend and removes content that was already enriched", async () => {
    const queued = candidate("queued");
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("SUM(cost_cny)")) return [{ spent_cny: 48.25 }];
      if (sql.includes("FROM ai_queue")) return [{ source_document_id: queued.id, payload: JSON.stringify(queued) }];
      return [{ id: "seen" }, { id: queued.id }];
    });

    const state = await loadPipelineState({ query }, [candidate("seen"), candidate("new")], new Date("2026-08-03T01:17:00.000Z"), 20);

    expect(state).toEqual({
      spentCny: 48.25,
      candidates: [candidate("new"), queued],
      queuedCandidateIds: [queued.id],
      persistence: "succeeded"
    });
  });

  it("keeps the higher manual spend as a conservative floor", async () => {
    const query = vi.fn(async (sql: string) => sql.includes("SUM(cost_cny)") ? [{ spent_cny: 48.25 }] : []);
    const state = await loadPipelineState({ query }, [candidate("new")], new Date("2026-08-03T01:17:00.000Z"), 60);
    expect(state.spentCny).toBe(60);
  });

  it("removes historical content even when a connector assigns a new id", async () => {
    const current = candidate("new-id");
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("SUM(cost_cny)")) return [{ spent_cny: 0 }];
      if (sql.includes("FROM ai_queue")) return [];
      return [{ id: "old-id", canonical_url: current.url, content_hash: current.contentHash }];
    });

    const state = await loadPipelineState({ query }, [current], new Date("2026-08-03T01:17:00.000Z"), 0);

    expect(state.candidates).toEqual([]);
  });

  it("fails closed when configured D1 state cannot be read", async () => {
    const query = vi.fn(async () => { throw new Error("D1 unavailable"); });
    const state = await loadPipelineState({ query }, [candidate("new")], new Date("2026-08-03T01:17:00.000Z"), 30);
    expect(state).toEqual({ spentCny: 30, candidates: [], queuedCandidateIds: [], persistence: "degraded" });
  });

  it("uses all candidates and manual spend in local mode", async () => {
    const candidates = [candidate("new")];
    await expect(loadPipelineState(undefined, candidates, new Date("2026-08-03T01:17:00.000Z"), 25))
      .resolves.toEqual({ spentCny: 25, candidates, queuedCandidateIds: [], persistence: "not-configured" });
  });

  it("ignores a malformed queued payload without blocking current candidates", async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("SUM(cost_cny)")) return [{ spent_cny: 0 }];
      if (sql.includes("FROM ai_queue")) return [{ source_document_id: "broken", payload: "{}" }];
      return [];
    });
    const current = candidate("current");
    const state = await loadPipelineState({ query }, [current], new Date("2026-08-03T01:17:00.000Z"), 0);
    expect(state.candidates).toEqual([current]);
    expect(state.queuedCandidateIds).toEqual([]);
  });

  it("ignores queued payloads with unsafe source URLs", async () => {
    const unsafe = { ...candidate("unsafe"), url: "javascript:alert(1)" };
    const query = vi.fn(async (sql: string) => {
      if (sql.includes("SUM(cost_cny)")) return [{ spent_cny: 0 }];
      if (sql.includes("FROM ai_queue")) return [{ source_document_id: unsafe.id, payload: JSON.stringify(unsafe) }];
      return [];
    });

    const state = await loadPipelineState({ query }, [], new Date("2026-08-03T01:17:00.000Z"), 0);

    expect(state.candidates).toEqual([]);
    expect(state.queuedCandidateIds).toEqual([]);
  });

  it("chunks historical fingerprint lookups below the D1 parameter limit", async () => {
    const query = vi.fn(async (sql: string, params: unknown[] = []) => {
      if (params.length > 90) throw new Error("too many SQL variables");
      if (sql.includes("SUM(cost_cny)")) return [{ spent_cny: 0 }];
      return [];
    });
    const candidates = Array.from({ length: 50 }, (_, index) => candidate(`candidate-${index}`));

    const state = await loadPipelineState({ query }, candidates, new Date("2026-08-03T01:17:00.000Z"), 0);

    expect(state.candidates).toHaveLength(50);
    expect(query.mock.calls.filter(([sql]) => String(sql).includes("FROM source_documents"))).toHaveLength(2);
  });
});
