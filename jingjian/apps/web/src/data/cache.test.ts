import { describe, expect, it, vi } from "vitest";
import { loadJsonWithCache } from "./cache";

describe("loadJsonWithCache", () => {
  it("caches a successful response", async () => {
    const storage = createStorage();
    const result = await loadJsonWithCache("/data/test.json", vi.fn(async () => new Response(JSON.stringify({ value: 1 }), { status: 200 })), storage);

    expect(result).toEqual({ value: 1 });
    expect(JSON.parse(storage.getItem("jingjian:/data/test.json") ?? "{}")).toEqual({ value: 1 });
  });

  it("returns the last snapshot when the network fails", async () => {
    const storage = createStorage({ "jingjian:/data/test.json": JSON.stringify({ value: 2 }) });
    const result = await loadJsonWithCache("/data/test.json", vi.fn(async () => { throw new Error("offline"); }), storage);

    expect(result).toEqual({ value: 2 });
  });

  it("returns fresh network data when browser cache storage is full", async () => {
    const storage = createStorage();
    storage.setItem = () => { throw new DOMException("Quota exceeded", "QuotaExceededError"); };

    await expect(loadJsonWithCache(
      "/data/test.json",
      vi.fn(async () => Response.json({ value: 3 })),
      storage
    )).resolves.toEqual({ value: 3 });
  });

  it("removes a malformed fallback and keeps the original network error", async () => {
    const storage = createStorage({ "jingjian:/data/test.json": "{" });

    await expect(loadJsonWithCache(
      "/data/test.json",
      vi.fn(async () => { throw new Error("offline"); }),
      storage
    )).rejects.toThrow("offline");
    expect(storage.getItem("jingjian:/data/test.json")).toBeNull();
  });

  it("keeps the network error when browser storage itself is unavailable", async () => {
    const storage = createStorage();
    storage.getItem = () => { throw new DOMException("Blocked", "SecurityError"); };

    await expect(loadJsonWithCache(
      "/data/test.json",
      vi.fn(async () => { throw new Error("offline"); }),
      storage
    )).rejects.toThrow("offline");
  });

  it("rejects malformed network data and falls back to a validated snapshot", async () => {
    const storage = createStorage({ "jingjian:/data/test.json": JSON.stringify({ value: 2 }) });
    const validate = (value: unknown) => {
      if (!value || typeof value !== "object" || typeof (value as { value?: unknown }).value !== "number") throw new Error("invalid data");
      return value as { value: number };
    };

    await expect(loadJsonWithCache(
      "/data/test.json",
      vi.fn(async () => Response.json({ value: "broken" })),
      storage,
      validate
    )).resolves.toEqual({ value: 2 });
    expect(JSON.parse(storage.getItem("jingjian:/data/test.json") ?? "{}")).toEqual({ value: 2 });
  });
});

function createStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial));
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => Array.from(data.keys())[index] ?? null,
    removeItem: (key) => { data.delete(key); },
    setItem: (key, value) => { data.set(key, value); }
  };
}
