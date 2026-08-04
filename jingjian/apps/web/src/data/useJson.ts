import { useEffect, useState } from "react";
import { loadJsonWithCache } from "./cache";
import { validatePublicData } from "./schemas";

export function useJson<T>(path: string) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  useEffect(() => {
    let active = true;
    setData(undefined);
    setError(undefined);
    loadJsonWithCache<T>(path, fetch, globalThis.localStorage, (value) => validatePublicData(path, value) as T)
      .then((value) => { if (active) setData(value); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason : new Error(String(reason))); });
    return () => { active = false; };
  }, [path]);
  return { data, error, loading: !data && !error };
}
