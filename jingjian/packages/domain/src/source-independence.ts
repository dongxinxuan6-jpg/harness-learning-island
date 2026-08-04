import { getDomain } from "tldts";

export function getIndependentSourceKey(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return getDomain(hostname, { allowPrivateDomains: true }) ?? hostname;
  } catch {
    return url.toLowerCase();
  }
}
