export async function loadJsonWithCache<T>(
  path: string,
  fetcher: typeof fetch = fetch,
  storage: Storage = globalThis.localStorage,
  validate: (value: unknown) => T = (value) => value as T
): Promise<T> {
  const key = `jingjian:${path}`;
  try {
    const response = await fetcher(path, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`${path} returned ${response.status}`);
    const value = validate(await response.json());
    try { storage.setItem(key, JSON.stringify(value)); } catch { /* Fresh network data remains usable without browser storage. */ }
    return value;
  } catch (error) {
    let cached: string | null = null;
    try { cached = storage.getItem(key); } catch { throw error; }
    if (cached) {
      try {
        return validate(JSON.parse(cached));
      } catch {
        try { storage.removeItem(key); } catch { /* A blocked storage backend has no usable fallback. */ }
      }
    }
    throw error;
  }
}
