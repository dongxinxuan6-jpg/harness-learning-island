import { describe, expect, it } from "vitest";
import { seedDataset } from "./seed-data";
import { createSnapshotFiles } from "./snapshots";
import { getDailyPublicationStatus, shouldPublishContentSnapshots, validateDailyPublication, type DailyPublication } from "./publication";

describe("validateDailyPublication", () => {
  it("accepts a timely digest with 5-10 evidenced items under 15 minutes", () => {
    const files = createSnapshotFiles(seedDataset);
    const daily = files["data/latest/daily.json"] as DailyPublication;
    expect(validateDailyPublication(daily, "2026-08-03")).toEqual([]);
  });

  it("reports stale, oversized and unsupported publication output", () => {
    const files = createSnapshotFiles(seedDataset);
    const daily = files["data/latest/daily.json"] as DailyPublication;
    const invalid = { ...daily, date: "2026-08-02", totalReadMinutes: 20, items: daily.items.slice(0, 4).map((item) => ({ ...item, sources: [] })) };
    expect(validateDailyPublication(invalid, "2026-08-03")).toEqual(expect.arrayContaining([
      expect.stringContaining("snapshot date"),
      expect.stringContaining("published item count"),
      expect.stringContaining("reading time"),
      expect.stringContaining("traceable evidence")
    ]));
  });

  it("preserves the previous public snapshots when every source fails", () => {
    expect(shouldPublishContentSnapshots("failed")).toBe(false);
    expect(shouldPublishContentSnapshots("partial")).toBe(true);
  });

  it("marks a digest stale when the run produced no newly enriched content", () => {
    expect(getDailyPublicationStatus(0)).toBe("stale");
    expect(getDailyPublicationStatus(1)).toBe("published");
  });
});
