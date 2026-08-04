import { describe, expect, it } from "vitest";
import { buildD1QueryRequest } from "./d1";

describe("buildD1QueryRequest", () => {
  it("creates the Cloudflare D1 REST request without leaking credentials into the body", () => {
    const request = buildD1QueryRequest({
      accountId: "account",
      databaseId: "database",
      apiToken: "secret"
    }, "SELECT * FROM content_items WHERE id = ?", ["item-1"]);

    expect(request.url).toContain("/accounts/account/d1/database/database/query");
    expect(request.init.headers).toEqual(expect.objectContaining({ Authorization: "Bearer secret" }));
    expect(request.init.body).toBe(JSON.stringify({ sql: "SELECT * FROM content_items WHERE id = ?", params: ["item-1"] }));
  });
});
