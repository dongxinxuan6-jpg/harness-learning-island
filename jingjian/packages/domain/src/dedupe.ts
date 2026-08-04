export type DedupeDocument = {
  id: string;
  url: string;
  contentHash: string;
};

const TRACKING_PARAMS = new Set(["fbclid", "gclid", "igshid", "mc_cid", "mc_eid"]);

export function canonicalizeUrl(input: string): string {
  const url = new URL(input);
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  url.hash = "";

  for (const key of Array.from(url.searchParams.keys())) {
    if (key.toLowerCase().startsWith("utm_") || TRACKING_PARAMS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString().replace(/\?$/, "");
}

export function groupDuplicateDocuments<T extends DedupeDocument>(documents: T[]): T[][] {
  const parent = documents.map((_, index) => index);
  const find = (index: number): number => {
    if (parent[index] !== index) parent[index] = find(parent[index]);
    return parent[index];
  };
  const union = (left: number, right: number) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent[rightRoot] = leftRoot;
  };

  const urls = new Map<string, number>();
  const hashes = new Map<string, number>();
  documents.forEach((document, index) => {
    const url = canonicalizeUrl(document.url);
    const matchingUrl = urls.get(url);
    const matchingHash = hashes.get(document.contentHash);
    if (matchingUrl !== undefined) union(matchingUrl, index);
    else urls.set(url, index);
    if (matchingHash !== undefined) union(matchingHash, index);
    else hashes.set(document.contentHash, index);
  });

  const groups = new Map<number, T[]>();
  documents.forEach((document, index) => {
    const root = find(index);
    const group = groups.get(root) ?? [];
    group.push(document);
    groups.set(root, group);
  });
  return Array.from(groups.values());
}
