import type { SearchResult } from "./data/types";

export function filterSearchResults(items: readonly SearchResult[], query: string, limit = 30): SearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  return items
    .filter((item) => `${item.title} ${item.summary}`.toLowerCase().includes(normalizedQuery))
    .slice(0, limit);
}
