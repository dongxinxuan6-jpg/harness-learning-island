PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ingest_runs (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'partial', 'failed')),
  discovered INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 0,
  failed_sources TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS source_documents (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  title TEXT NOT NULL,
  published_at TEXT,
  fetched_at TEXT NOT NULL,
  evidence_excerpt TEXT,
  UNIQUE(canonical_url),
  UNIQUE(content_hash)
);

CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  published_at TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  form_factor TEXT NOT NULL,
  status TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS repo_snapshots (
  id TEXT PRIMARY KEY,
  repository_url TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  payload TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recorded_at TEXT NOT NULL,
  model TEXT NOT NULL,
  purpose TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  cached_input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_usd REAL NOT NULL,
  cost_cny REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_queue (
  id TEXT PRIMARY KEY,
  source_document_id TEXT NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  processed_at TEXT,
  FOREIGN KEY (source_document_id) REFERENCES source_documents(id)
);

CREATE INDEX IF NOT EXISTS idx_documents_published ON source_documents(published_at);
CREATE INDEX IF NOT EXISTS idx_content_published ON content_items(published_at);
CREATE INDEX IF NOT EXISTS idx_products_form_status ON products(form_factor, status);
CREATE INDEX IF NOT EXISTS idx_ai_queue_status ON ai_queue(status, created_at);
