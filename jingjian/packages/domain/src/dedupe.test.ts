import { describe, expect, it } from "vitest";
import { canonicalizeUrl, groupDuplicateDocuments } from "./dedupe";

describe("canonicalizeUrl", () => {
  it("removes tracking parameters, fragments, and trailing slashes", () => {
    expect(canonicalizeUrl("HTTPS://Example.com/news/?utm_source=x&id=42#top"))
      .toBe("https://example.com/news?id=42");
  });
});

describe("groupDuplicateDocuments", () => {
  it("groups canonical URLs and identical content hashes", () => {
    const groups = groupDuplicateDocuments([
      { id: "a", url: "https://a.com/post?utm_medium=social", contentHash: "one" },
      { id: "b", url: "https://a.com/post", contentHash: "two" },
      { id: "c", url: "https://b.com/repost", contentHash: "one" },
      { id: "d", url: "https://c.com/original", contentHash: "three" }
    ]);

    expect(groups.map((group) => group.map((item) => item.id))).toEqual([
      ["a", "b", "c"],
      ["d"]
    ]);
  });
});
