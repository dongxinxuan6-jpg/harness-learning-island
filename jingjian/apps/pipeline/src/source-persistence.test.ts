import { describe, expect, it, vi } from "vitest";
import type { RawCandidate } from "./types";
import { persistSourceDocument } from "./source-persistence";

const item: RawCandidate = {
  id: "new-id",
  sourceId: "source",
  sourceName: "Source",
  sourceTier: "official",
  language: "en",
  title: "Title",
  url: "https://example.com/post?utm_source=test",
  text: "Evidence text",
  publishedAt: "2026-08-03T00:00:00.000Z",
  contentHash: "hash"
};

describe("persistSourceDocument", () => {
  it("uses the preserved document id when a fingerprint already exists", async () => {
    const query = vi.fn(async (sql: string, _params?: unknown[]) => sql.startsWith("SELECT id") ? [{ id: "old-id" }] : []);

    await persistSourceDocument({ query }, item, "2026-08-03T02:00:00.000Z", true);

    expect(query.mock.calls[0][0]).toContain("INSERT OR IGNORE");
    const queueCall = query.mock.calls.find(([sql]) => String(sql).includes("INTO ai_queue"));
    expect(queueCall?.[1]?.[0]).toBe("queue:old-id");
    expect(queueCall?.[1]?.[1]).toBe("old-id");
    expect(JSON.parse(String(queueCall?.[1]?.[2])).id).toBe("old-id");
  });
});
