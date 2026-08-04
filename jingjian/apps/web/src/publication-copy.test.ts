import { describe, expect, it } from "vitest";
import { getPublicationCopy } from "./publication-copy";

describe("getPublicationCopy", () => {
  it("labels fallback content as the latest available edition", () => {
    expect(getPublicationCopy("stale")).toEqual({
      heading: "最近一期，先看清三个变化",
      status: "最近一期",
      ranking: "最近一期价值榜"
    });
  });

  it("keeps today's wording for a newly published digest", () => {
    expect(getPublicationCopy("published")).toEqual({
      heading: "今天，先看清三个变化",
      status: "已发布",
      ranking: "今日价值榜"
    });
  });
});
