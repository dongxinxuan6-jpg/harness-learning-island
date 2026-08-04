import { describe, expect, it } from "vitest";
import { getBudgetPolicy } from "./budget";

describe("getBudgetPolicy", () => {
  it.each([
    [119.99, "normal"],
    [120, "conserve"],
    [170, "essential"],
    [200, "defer"]
  ] as const)("maps %s CNY to %s", (spent, mode) => {
    expect(getBudgetPolicy(spent).mode).toBe(mode);
  });

  it("keeps ingestion enabled after the hard AI limit", () => {
    expect(getBudgetPolicy(220)).toEqual({
      mode: "defer",
      allowIngestion: true,
      allowBulkAi: false,
      allowEditorialAi: false
    });
  });
});
