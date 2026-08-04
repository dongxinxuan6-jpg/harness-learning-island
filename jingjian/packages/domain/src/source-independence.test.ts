import { describe, expect, it } from "vitest";
import { getIndependentSourceKey } from "./source-independence";

describe("getIndependentSourceKey", () => {
  it("collapses subdomains owned by the same registrable domain", () => {
    expect(getIndependentSourceKey("https://ai.meta.com/post")).toBe("meta.com");
    expect(getIndependentSourceKey("https://developers.meta.com/docs")).toBe("meta.com");
  });

  it("understands multi-label public suffixes", () => {
    expect(getIndependentSourceKey("https://news.example.co.uk/story")).toBe("example.co.uk");
  });

  it("falls back to a normalized hostname for private development domains", () => {
    expect(getIndependentSourceKey("https://WWW.brand.test/post")).toBe("brand.test");
  });
});
