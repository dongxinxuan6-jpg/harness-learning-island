import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import { XMLParser } from "fast-xml-parser";
import type { RawCandidate, SourceDescriptor } from "./types";

const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, trimValues: true });
const REQUEST_TIMEOUT_MS = 15_000;
const asArray = <T>(value: T | T[] | undefined): T[] => value === undefined ? [] : Array.isArray(value) ? value : [value];
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const plainText = (value: string) => cheerio.load(`<main>${value}</main>`)("main").text().replace(/\s+/g, " ").trim();

export function parseRssFeed(xml: string, source: SourceDescriptor): RawCandidate[] {
  const parsed = parser.parse(xml) as { rss?: { channel?: { item?: RssItem | RssItem[] } }; feed?: { entry?: AtomEntry | AtomEntry[] } };
  const items: RssItem[] = [
    ...asArray(parsed.rss?.channel?.item),
    ...asArray(parsed.feed?.entry).map((entry) => ({
      title: entry.title,
      link: entry.link,
      description: entry.summary ?? entry.content,
      published: entry.published,
      updated: entry.updated
    }))
  ];
  return items.flatMap((item, index) => {
    const text = plainText(item.description ?? item["content:encoded"] ?? item.encoded ?? "");
    const url = normalizeHttpUrl(readFeedLink(item.link));
    const rawDate = item.pubDate ?? item.published ?? item.updated;
    const publishedAt = rawDate ? normalizeDate(rawDate) : new Date().toISOString();
    if (!url || !publishedAt) return [];
    return [{
      id: `${source.id}-${hash(url || `${item.title}-${index}`).slice(0, 12)}`,
      sourceId: source.id,
      sourceName: source.name,
      sourceTier: source.tier,
      language: source.language,
      title: plainText(item.title ?? "Untitled"),
      url,
      text,
      publishedAt,
      contentHash: hash(text || item.title || url)
    }];
  });
}

function readFeedLink(value: RssItem["link"]): string {
  if (typeof value === "string") return value;
  const links = asArray(value);
  return links.find((link) => link?.["@_rel"] === "alternate")?.["@_href"] ?? links.find((link) => link?.["@_href"])?.["@_href"] ?? "";
}

export function parseArxivFeed(xml: string): RawCandidate[] {
  const parsed = parser.parse(xml) as { feed?: { entry?: AtomEntry | AtomEntry[] } };
  return asArray(parsed.feed?.entry).flatMap((entry, index) => {
    const title = plainText(entry.title ?? "Untitled paper");
    const text = plainText(entry.summary ?? "");
    const url = normalizeHttpUrl((entry.id ?? "").replace(/^http:\/\/arxiv\.org/, "https://arxiv.org"));
    const rawDate = entry.published ?? entry.updated;
    const publishedAt = rawDate ? normalizeDate(rawDate) : new Date().toISOString();
    if (!url || !publishedAt) return [];
    return [{
      id: `arxiv-${hash(url || `${title}-${index}`).slice(0, 12)}`,
      sourceId: "arxiv",
      sourceName: "arXiv",
      sourceTier: "research" as const,
      language: "en" as const,
      title,
      url,
      text,
      publishedAt,
      contentHash: hash(text || title)
    }];
  });
}

function normalizeDate(value: string): string | undefined {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
}

function normalizeHttpUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function extractReadableHtml(html: string, url: string): { title: string; text: string; url: string } {
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, aside, form").remove();
  const article = $("article").first();
  const root = article.length > 0 ? article : $("main").first().length > 0 ? $("main").first() : $("body");
  const title = root.find("h1").first().text().trim() || $("title").text().trim();
  return { title, text: root.text().replace(/\s+/g, " ").trim(), url };
}

export async function hydrateCandidateFromPage(candidate: RawCandidate, fetcher: typeof fetch = fetch): Promise<RawCandidate> {
  try {
    const response = await fetcher(candidate.url, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Jingjian/0.1 (+AI-glasses research reader)"
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    if (!response.ok) return candidate;
    const contentType = response.headers.get("content-type")?.toLowerCase();
    if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) return candidate;
    const readable = extractReadableHtml(await response.text(), candidate.url);
    if (readable.text.length <= candidate.text.length) return candidate;
    return { ...candidate, text: readable.text.slice(0, 40_000) };
  } catch {
    return candidate;
  }
}

type RssItem = {
  title?: string;
  link?: string | { "@_href"?: string; "@_rel"?: string } | Array<{ "@_href"?: string; "@_rel"?: string }>;
  description?: string;
  "content:encoded"?: string;
  encoded?: string;
  pubDate?: string;
  published?: string;
  updated?: string;
};

type AtomEntry = {
  id?: string;
  title?: string;
  summary?: string;
  content?: string;
  link?: RssItem["link"];
  published?: string;
  updated?: string;
};

export function createRssConnector(url: string, source: SourceDescriptor, fetcher: typeof fetch = fetch) {
  return {
    id: source.id,
    collect: async () => {
      const response = await fetcher(url, { headers: { "User-Agent": "Jingjian/0.1 (+AI-glasses research reader)" }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (!response.ok) throw new Error(`${source.id} RSS failed with ${response.status}`);
      return parseRssFeed(await response.text(), source);
    }
  };
}

export function createArxivConnector(query = "all:%22smart+glasses%22", fetcher: typeof fetch = fetch) {
  return {
    id: "arxiv",
    collect: async () => {
      const response = await fetcher(`https://export.arxiv.org/api/query?search_query=${query}&sortBy=submittedDate&sortOrder=descending&max_results=20`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (!response.ok) throw new Error(`arXiv failed with ${response.status}`);
      return parseArxivFeed(await response.text());
    }
  };
}
