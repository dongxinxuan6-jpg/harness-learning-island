import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useHashScroll(ready: boolean): void {
  const { hash } = useLocation();
  useEffect(() => {
    if (!ready || !hash) return;
    const id = decodeHashId(hash);
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }));
    return () => cancelAnimationFrame(frame);
  }, [hash, ready]);
}

export function decodeHashId(hash: string): string {
  const value = hash.startsWith("#") ? hash.slice(1) : hash;
  try { return decodeURIComponent(value); } catch { return value; }
}
