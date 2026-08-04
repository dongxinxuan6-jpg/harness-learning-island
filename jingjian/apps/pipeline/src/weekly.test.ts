import { describe, expect, it } from "vitest";
import { contents, signals } from "./seed-data";
import { buildCurrentWeekly, getBeijingIsoWeek, isBeijingMonday } from "./weekly";

describe("weekly publication", () => {
  it("calculates the ISO week from Beijing local time", () => {
    expect(getBeijingIsoWeek(new Date("2026-08-02T16:30:00Z"))).toBe("2026-W32");
  });

  it("creates an idempotent path for every run in the same week", () => {
    const base = { isoWeek: "2026-W31", generatedAt: "old", thesis: "thesis", signalIds: [], contentIds: [], title: "old", sections: [] };
    expect(buildCurrentWeekly(base, new Date("2026-08-03T01:17:00Z"), contents, signals).isoWeek).toBe("2026-W32");
    expect(buildCurrentWeekly(base, new Date("2026-08-09T12:00:00Z"), contents, signals).isoWeek).toBe("2026-W32");
  });

  it("rebuilds a new week from current ranked content and frontier signals", () => {
    const base = {
      isoWeek: "2026-W31",
      generatedAt: "old",
      thesis: "旧周结论",
      signalIds: ["old-signal"],
      contentIds: ["old-content"],
      title: "第 31 周：旧标题",
      sections: [{ title: "长期信号", body: "旧周正文" }]
    };

    const weekly = buildCurrentWeekly(base, new Date("2026-08-03T01:17:00Z"), contents, signals);

    expect(weekly.title).toContain(contents[0].tags[0]);
    expect(weekly.title).not.toContain("旧标题");
    expect(weekly.thesis).toContain(contents[0].title);
    expect(weekly.contentIds).toEqual(contents.slice(0, 3).map((item) => item.id));
    expect(weekly.signalIds).toEqual(signals.slice(0, 3).map((item) => item.id));
    expect(weekly.sections?.[0].body).toContain(signals[0].summary);
    expect(JSON.stringify(weekly)).not.toContain("旧周");
  });

  it("preserves an editorial result during repeated runs in the same week", () => {
    const base = {
      isoWeek: "2026-W32",
      generatedAt: "old",
      thesis: "主编结论",
      signalIds: [signals[0].id],
      contentIds: [contents[0].id],
      title: "主编标题",
      sections: [{ title: "长期信号", body: "主编正文" }],
      editorial: true
    };

    const weekly = buildCurrentWeekly(base, new Date("2026-08-04T01:17:00Z"), contents, signals);

    expect(weekly).toEqual({ ...base, generatedAt: "2026-08-04T01:17:00.000Z" });
  });

  it("rebuilds an unmarked legacy fallback during the current week", () => {
    const base = {
      isoWeek: "2026-W32",
      generatedAt: "old",
      thesis: "旧周结论",
      signalIds: [],
      contentIds: [],
      title: "第 32 周：平台开始定义眼镜形态",
      sections: []
    };

    const weekly = buildCurrentWeekly(base, new Date("2026-08-04T01:17:00Z"), contents, signals);

    expect(weekly.title).toContain(contents[0].tags[0]);
    expect(weekly).toEqual(expect.objectContaining({ editorial: false }));
  });

  it("uses Beijing weekday boundaries for weekly synthesis", () => {
    expect(isBeijingMonday(new Date("2026-08-02T16:30:00Z"))).toBe(true);
    expect(isBeijingMonday(new Date("2026-08-09T15:59:00Z"))).toBe(false);
  });
});
