CREATE TABLE IF NOT EXISTS product_candidates (
  id TEXT PRIMARY KEY,
  source_document_id TEXT NOT NULL,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('published', 'updated', 'pending')),
  reason TEXT,
  product_slug TEXT,
  source_url TEXT NOT NULL,
  payload TEXT NOT NULL,
  discovered_at TEXT NOT NULL,
  processed_at TEXT,
  FOREIGN KEY (source_document_id) REFERENCES source_documents(id)
);

CREATE INDEX IF NOT EXISTS idx_product_candidates_status ON product_candidates(status, discovered_at);
