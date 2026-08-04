import { canonicalizeUrl } from "@jingjian/domain";
import { RawCandidateSchema, type RawCandidate } from "./types";

type QueryClient = {
  query: (sql: string, params?: unknown[]) => Promise<unknown[]>;
};

export type PipelineState = {
  spentCny: number;
  candidates: RawCandidate[];
  queuedCandidateIds: string[];
  persistence: "not-configured" | "succeeded" | "degraded";
};

export function getBeijingMonthWindow(now: Date): { start: string; end: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const year = Number(values.year);
  const monthIndex = Number(values.month) - 1;
  const offsetMs = 8 * 60 * 60 * 1000;
  return {
    start: new Date(Date.UTC(year, monthIndex, 1) - offsetMs).toISOString(),
    end: new Date(Date.UTC(year, monthIndex + 1, 1) - offsetMs).toISOString()
  };
}

export async function loadPipelineState(
  client: QueryClient | undefined,
  candidates: RawCandidate[],
  now: Date,
  configuredSpentCny: number
): Promise<PipelineState> {
  const manualSpend = Number.isFinite(configuredSpentCny) ? Math.max(0, configuredSpentCny) : 0;
  if (!client) return { spentCny: manualSpend, candidates, queuedCandidateIds: [], persistence: "not-configured" };

  try {
    const month = getBeijingMonthWindow(now);
    const spendRows = await client.query(
      "SELECT COALESCE(SUM(cost_cny), 0) AS spent_cny FROM ai_usage WHERE recorded_at >= ? AND recorded_at < ?",
      [month.start, month.end]
    ) as Array<{ spent_cny?: number }>;
    const queuedRows = await client.query(
      "SELECT source_document_id, payload FROM ai_queue WHERE status = 'queued' ORDER BY created_at LIMIT 100"
    ) as Array<{ source_document_id: string; payload: string }>;
    const candidateMap = new Map(candidates.map((candidate) => [candidate.id, candidate]));
    for (const row of queuedRows) {
      const queued = parseQueuedCandidate(row.payload);
      if (queued && !candidateMap.has(queued.id)) candidateMap.set(queued.id, queued);
    }
    const queuedCandidateIds = [...new Set(queuedRows.map((row) => row.source_document_id).filter((id) => candidateMap.has(id)))];
    const queuedSet = new Set(queuedCandidateIds);
    const mergedCandidates = [...candidateMap.values()];
    const documentRows: Array<{ id: string; canonical_url?: string; content_hash?: string }> = [];
    for (let offset = 0; offset < mergedCandidates.length; offset += 30) {
      const chunk = mergedCandidates.slice(offset, offset + 30);
      const ids = chunk.map((candidate) => candidate.id);
      const canonicalUrls = chunk.map((candidate) => canonicalizeUrl(candidate.url));
      const contentHashes = chunk.map((candidate) => candidate.contentHash);
      const placeholders = ids.map(() => "?").join(", ");
      const rows = await client.query(
        `SELECT id, canonical_url, content_hash FROM source_documents WHERE id IN (${placeholders}) OR canonical_url IN (${placeholders}) OR content_hash IN (${placeholders})`,
        [...ids, ...canonicalUrls, ...contentHashes]
      ) as Array<{ id: string; canonical_url?: string; content_hash?: string }>;
      documentRows.push(...rows);
    }
    const seenIds = new Set(documentRows.map((row) => row.id));
    const seenUrls = new Set(documentRows.flatMap((row) => row.canonical_url ? [row.canonical_url] : []));
    const seenHashes = new Set(documentRows.flatMap((row) => row.content_hash ? [row.content_hash] : []));
    const d1Spend = Number(spendRows[0]?.spent_cny ?? 0);
    return {
      spentCny: Math.max(manualSpend, Number.isFinite(d1Spend) ? d1Spend : 0),
      candidates: mergedCandidates.filter((candidate) => queuedSet.has(candidate.id) || !(
        seenIds.has(candidate.id) ||
        seenUrls.has(canonicalizeUrl(candidate.url)) ||
        seenHashes.has(candidate.contentHash)
      )),
      queuedCandidateIds,
      persistence: "succeeded"
    };
  } catch (error) {
    console.warn(`D1 state read degraded: ${error instanceof Error ? error.message : String(error)}`);
    return { spentCny: manualSpend, candidates: [], queuedCandidateIds: [], persistence: "degraded" };
  }
}

function parseQueuedCandidate(payload: string): RawCandidate | undefined {
  try {
    const parsed = RawCandidateSchema.safeParse(JSON.parse(payload));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}
