import type { GitHubProject } from "@jingjian/domain";

export type GitHubRepositoryPayload = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  archived: boolean;
  stargazers_count: number;
  language: string | null;
  license: { spdx_id: string } | null;
  pushed_at: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15_000;

function repositoryStatus(payload: GitHubRepositoryPayload, now: Date): GitHubProject["status"] {
  if (payload.archived) return "archived";

  const pushedAt = Date.parse(payload.pushed_at);
  if (!Number.isFinite(pushedAt)) return "stale";

  const ageDays = Math.max(0, (now.getTime() - pushedAt) / DAY_MS);
  if (ageDays <= 90) return "active";
  if (ageDays <= 365) return "watch";
  return "stale";
}

export function mapGitHubRepository(payload: GitHubRepositoryPayload, now = new Date()): GitHubProject {
  const [owner] = payload.full_name.split("/");
  return {
    id: `github-${payload.id}`,
    slug: payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name: payload.name,
    owner,
    repositoryUrl: payload.html_url,
    description: payload.description ?? "GitHub project",
    status: repositoryStatus(payload, now),
    license: payload.license?.spdx_id ?? "Unspecified",
    languages: payload.language ? [payload.language] : [],
    supportedDevices: [],
    stars: payload.stargazers_count,
    lastCommitAt: payload.pushed_at,
    difficulty: "intermediate",
    architecture: ["眼镜硬件", "手机或主机", "SDK / Runtime", "端侧或云端模型", "用户输出"],
    productInsight: "活动数据用于判断项目维护状态，产品价值仍需结合设备支持与架构阅读。"
  };
}

export async function fetchGitHubRepository(
  fullName: string,
  token?: string,
  now = new Date()
): Promise<GitHubProject> {
  const response = await fetch(`https://api.github.com/repos/${fullName}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`GitHub ${fullName} failed with ${response.status}`);
  return mapGitHubRepository(await response.json() as GitHubRepositoryPayload, now);
}

export async function refreshGitHubProjects(
  projects: GitHubProject[],
  token?: string,
  now = new Date()
): Promise<GitHubProject[]> {
  const refreshed = await Promise.allSettled(projects.map(async (project) => {
    const live = await fetchGitHubRepository(`${project.owner}/${project.name}`, token, now);
    return {
      ...project,
      status: project.status === "migrated" ? "migrated" as const : live.status,
      license: live.license,
      languages: live.languages.length > 0 ? live.languages : project.languages,
      stars: live.stars,
      lastCommitAt: live.lastCommitAt
    };
  }));
  return refreshed.map((result, index) => result.status === "fulfilled" ? result.value : projects[index]);
}
