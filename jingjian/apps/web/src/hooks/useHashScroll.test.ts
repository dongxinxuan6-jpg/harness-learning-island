import { describe, expect, it } from "vitest";
import { decodeHashId } from "./useHashScroll";

describe("decodeHashId", () => {
  it("decodes valid fragments and tolerates malformed percent encoding", () => {
    expect(decodeHashId("#stage-1%20intro")).toBe("stage-1 intro");
    expect(decodeHashId("#%E0%A4%A")).toBe("%E0%A4%A");
  });
});
