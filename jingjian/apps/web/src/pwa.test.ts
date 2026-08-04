import { describe, expect, it } from "vitest";
import { dataRuntimeCache, pwaGlobIgnores } from "./pwa";

describe("PWA data cache policy", () => {
  it("checks the network before serving a cached JSON snapshot", () => {
    expect(dataRuntimeCache.handler).toBe("NetworkFirst");
    expect(dataRuntimeCache.options.networkTimeoutSeconds).toBeLessThanOrEqual(3);
  });

  it("keeps mutable data snapshots out of the immutable precache", () => {
    expect(pwaGlobIgnores).toContain("data/**/*.json");
  });
});
