// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { clearLearningData, exportLearningData, getLocalDataSummary, importLearningData, isSaved, saveNote, setLearningProgress, toggleSaved } from "./learningDb";

describe("learningDb", () => {
  beforeEach(async () => clearLearningData());

  it("exports and imports learning progress", async () => {
    await setLearningProgress("stage-1-form-factors", 100);
    const exported = await exportLearningData();
    await clearLearningData();
    await importLearningData(exported);

    expect(await exportLearningData()).toEqual(expect.objectContaining({
      progress: [expect.objectContaining({ nodeId: "stage-1-form-factors", percent: 100 })]
    }));
  });

  it("reports persisted progress, saved items and notes", async () => {
    await setLearningProgress("stage-1", 100);
    await toggleSaved("content", "content-1");
    await saveNote("content", "content-1", "产品判断");

    expect(await isSaved("content", "content-1")).toBe(true);
    expect(await getLocalDataSummary()).toEqual({ progress: 1, saved: 1, notes: 1 });
  });

  it("rejects malformed imports before opening a write transaction", async () => {
    await expect(importLearningData({ version: 1 } as never)).rejects.toThrow("学习数据文件格式不正确");
  });

  it("rejects malformed nested records without changing stored data", async () => {
    await setLearningProgress("existing-node", 50);

    await expect(importLearningData({
      version: 1,
      exportedAt: new Date().toISOString(),
      progress: [],
      saved: [{ id: "signal:bad", entityType: "signal", entityId: "bad", savedAt: new Date().toISOString() }],
      notes: []
    } as never)).rejects.toThrow("学习数据文件格式不正确");

    expect(await getLocalDataSummary()).toEqual({ progress: 1, saved: 0, notes: 0 });
  });
});
