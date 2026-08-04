import { canonicalizeUrl } from "@jingjian/domain";
import type { RawCandidate } from "./types";

type QueryClient = {
  query: (sql: string, params?: unknown[]) => Promise<unknown[]>;
};

export async function persistSourceDocument(
  client: QueryClient,
  item: RawCandidate,
  fetchedAt: string,
  queueForAi: boolean
): Promise<void> {
  const canonicalUrl = canonicalizeUrl(item.url);
  await client.query(
    "INSERT OR IGNORE INTO source_documents (id, source_id, canonical_url, content_hash, title, published_at, fetched_at, evidence_excerpt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [item.id, item.sourceId, canonicalUrl, item.contentHash, item.title, item.publishedAt, fetchedAt, item.text.slice(0, 500)]
  );

  if (!queueForAi) return;
  const rows = await client.query(
    "SELECT id FROM source_documents WHERE id = ? OR canonical_url = ? OR content_hash = ? LIMIT 1",
    [item.id, canonicalUrl, item.contentHash]
  ) as Array<{ id: string }>;
  const documentId = rows[0]?.id;
  if (!documentId) throw new Error(`Persisted source document ${item.id} was not found`);

  await client.query(
    "INSERT OR REPLACE INTO ai_queue (id, source_document_id, purpose, status, payload, created_at) VALUES (?, ?, 'content-enrichment', 'queued', ?, ?)",
    [`queue:${documentId}`, documentId, JSON.stringify({ ...item, id: documentId }), fetchedAt]
  );
}
