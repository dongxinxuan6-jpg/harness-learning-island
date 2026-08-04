import { describe, expect, it, vi } from "vitest";
import { seedDataset } from "./seed-data";
import { loadSnapshotBaseline, mergeContentBySlug } from "./baseline";

describe("loadSnapshotBaseline", () => {
  it("continues from the currently published content and weekly snapshot", async () => {
    const previous = { ...seedDataset.contents[0], id: "previous-live", slug: "previous-live" };
    const heatOnly = { ...seedDataset.contents[1], id: "heat-only", slug: "heat-only" };
    const reader = vi.fn(async (path: string) => {
      const normalized = path.replace(/\\/g, "/");
      if (normalized.endsWith("rankings/value.json")) return { generatedAt: "2026-08-04T00:00:00.000Z", items: [previous] };
      if (normalized.endsWith("rankings/heat.json")) return { generatedAt: "2026-08-04T04:00:00.000Z", items: [previous, heatOnly] };
      if (normalized.endsWith("products/index.json")) return { items: seedDataset.products };
      if (normalized.endsWith("projects/index.json")) return { items: seedDataset.projects };
      if (normalized.endsWith("radar/latest.json")) return { items: seedDataset.signals };
      if (normalized.endsWith("learning/route.json")) return { items: seedDataset.learningNodes };
      if (normalized.endsWith("weekly/latest.json")) return seedDataset.weekly[0];
      throw new Error(`Unexpected path ${path}`);
    });

    const result = await loadSnapshotBaseline("public", seedDataset, reader);

    expect(result.generatedAt).toBe("2026-08-04T04:00:00.000Z");
    expect(result.contents).toEqual([previous, heatOnly]);
    expect(result.weekly).toEqual([seedDataset.weekly[0]]);
  });

  it("falls back to the repository baseline when published data is corrupt", async () => {
    const reader = vi.fn(async () => { throw new Error("corrupt snapshot"); });
    await expect(loadSnapshotBaseline("public", seedDataset, reader)).resolves.toBe(seedDataset);
  });

  it("rejects a collection whose items violate the public data schema", async () => {
    const reader = vi.fn(async (path: string) => {
      const normalized = path.replace(/\\/g, "/");
      if (normalized.endsWith("rankings/value.json")) return { items: [{}] };
      if (normalized.endsWith("rankings/heat.json")) return { items: [] };
      if (normalized.endsWith("products/index.json")) return { items: seedDataset.products };
      if (normalized.endsWith("projects/index.json")) return { items: seedDataset.projects };
      if (normalized.endsWith("radar/latest.json")) return { items: seedDataset.signals };
      if (normalized.endsWith("learning/route.json")) return { items: seedDataset.learningNodes };
      if (normalized.endsWith("weekly/latest.json")) return seedDataset.weekly[0];
      throw new Error(`Unexpected path ${path}`);
    });

    await expect(loadSnapshotBaseline("public", seedDataset, reader)).resolves.toBe(seedDataset);
  });

  it("lets newly enriched content replace an older snapshot with the same slug", () => {
    const older = { ...seedDataset.contents[0], id: "older" };
    const newer = { ...seedDataset.contents[0], id: "newer", summary: "Updated summary" };
    expect(mergeContentBySlug([older], [newer])).toEqual([newer]);
  });
});
