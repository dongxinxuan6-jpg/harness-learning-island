import { describe, expect, it } from "vitest";
import { mapGitHubRepository } from "./github";

describe("mapGitHubRepository", () => {
  const now = new Date("2026-08-03T00:00:00Z");

  it("maps activity metadata and detects archived repositories", () => {
    const project = mapGitHubRepository({
      id: 42,
      name: "sample",
      full_name: "org/sample",
      html_url: "https://github.com/org/sample",
      description: "Smart glasses sample",
      archived: true,
      stargazers_count: 120,
      language: "TypeScript",
      license: { spdx_id: "MIT" },
      pushed_at: "2025-01-01T00:00:00Z"
    }, now);

    expect(project).toEqual(expect.objectContaining({
      name: "sample",
      owner: "org",
      status: "archived",
      license: "MIT",
      stars: 120
    }));
  });

  it.each([
    ["2026-07-20T00:00:00Z", "active"],
    ["2026-03-01T00:00:00Z", "watch"],
    ["2025-01-01T00:00:00Z", "stale"]
  ] as const)("classifies %s as %s from the last push", (pushedAt, status) => {
    const project = mapGitHubRepository({
      id: 42,
      name: "sample",
      full_name: "org/sample",
      html_url: "https://github.com/org/sample",
      description: "Smart glasses sample",
      archived: false,
      stargazers_count: 120,
      language: "TypeScript",
      license: { spdx_id: "MIT" },
      pushed_at: pushedAt
    }, now);

    expect(project.status).toBe(status);
  });
});
