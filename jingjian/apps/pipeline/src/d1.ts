export type D1Config = {
  accountId: string;
  databaseId: string;
  apiToken: string;
};

const REQUEST_TIMEOUT_MS = 15_000;

export function buildD1QueryRequest(config: D1Config, sql: string, params: unknown[] = []): {
  url: string;
  init: { method: string; headers: Record<string, string>; body: string; signal: AbortSignal };
} {
  return {
    url: `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/d1/database/${config.databaseId}/query`,
    init: {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sql, params }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    }
  };
}

export class D1RestClient {
  constructor(private readonly config: D1Config) {}

  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const request = buildD1QueryRequest(this.config, sql, params);
    const response = await fetch(request.url, request.init);
    if (!response.ok) throw new Error(`D1 query failed with ${response.status}`);
    const payload = await response.json() as { success: boolean; errors?: Array<{ message: string }>; result?: Array<{ results?: T[] }> };
    if (!payload.success) throw new Error(payload.errors?.[0]?.message ?? "D1 query failed");
    return payload.result?.flatMap((entry) => entry.results ?? []) ?? [];
  }
}
