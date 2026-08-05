import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ProductSchema, ProductFormSchema, ProductStatusSchema, type Product, type Source } from "@jingjian/domain";
import * as cheerio from "cheerio";
import sharp from "sharp";
import { z } from "zod";
import type { RawCandidate } from "./types";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MIN_IMAGE_WIDTH = 600;
const MIN_IMAGE_HEIGHT = 300;

export const ProductCandidateSchema = z.object({
  brand: z.string().trim().min(1),
  name: z.string().trim().min(1),
  form: ProductFormSchema,
  status: ProductStatusSchema,
  positioning: z.string().trim().min(1),
  audience: z.string().trim().min(1),
  scenarios: z.array(z.string().trim().min(1)).min(1).max(8),
  capabilities: z.array(z.string().trim().min(1)).min(1).max(10),
  specs: z.array(z.object({ label: z.string().trim().min(1), value: z.string().trim().min(1) })).max(12),
  architecture: z.array(z.string().trim().min(1)).min(1).max(8),
  tradeoffs: z.array(z.string().trim().min(1)).min(1).max(8)
});

export type ProductCandidate = z.infer<typeof ProductCandidateSchema>;
export type ProductDiscoveryStatus = "published" | "updated" | "pending";
export type ProductDiscoveryReason = "source-not-official" | "cover-missing" | "cover-invalid";

export const ProductDiscoveryRecordSchema = z.object({
  id: z.string().min(1),
  sourceDocumentId: z.string().min(1),
  sourceUrl: z.string().url(),
  brand: z.string().min(1),
  name: z.string().min(1),
  status: z.enum(["published", "updated", "pending"]),
  reason: z.enum(["source-not-official", "cover-missing", "cover-invalid"]).optional(),
  productSlug: z.string().min(1).optional(),
  discoveredAt: z.string().datetime(),
  candidate: ProductCandidateSchema
});

export type ProductDiscoveryRecord = z.infer<typeof ProductDiscoveryRecordSchema>;

export type ProductCoverSource = {
  productSlug: string;
  pageUrl: string;
  imageUrl: string;
  localPath: string;
};

export type ProductDiscoveryInput = { source: RawCandidate; product: ProductCandidate };

export function mergeProductDiscoveryRecords(existing: ProductDiscoveryRecord[], incoming: ProductDiscoveryRecord[], limit = 200): ProductDiscoveryRecord[] {
  const merged = new Map(existing.map((record) => [record.id, record]));
  incoming.forEach((record) => merged.set(record.id, record));
  return [...merged.values()].sort((left, right) => right.discoveredAt.localeCompare(left.discoveredAt)).slice(0, limit);
}

export async function updateProductCoverSourceManifest(publicRoot: string, sources: ProductCoverSource[]): Promise<void> {
  if (sources.length === 0) return;
  const path = join(publicRoot, "assets", "products", "image-sources.json");
  let existing: Record<string, { pageUrl: string; assetUrl: string; note?: string }> = {};
  try {
    existing = JSON.parse(await readFile(path, "utf8")) as typeof existing;
  } catch {
    // The first downloaded cover creates the provenance manifest.
  }
  sources.forEach((source) => {
    existing[source.productSlug] = { pageUrl: source.pageUrl, assetUrl: source.imageUrl };
  });
  const ordered = Object.fromEntries(Object.entries(existing).sort(([left], [right]) => left.localeCompare(right)));
  await mkdir(join(publicRoot, "assets", "products"), { recursive: true });
  await writeFile(path, `${JSON.stringify(ordered, null, 2)}\n`, "utf8");
}

export async function discoverProductCandidates(options: {
  existingProducts: Product[];
  candidates: ProductDiscoveryInput[];
  generatedAt: string;
  publicRoot: string;
  fetcher?: typeof fetch;
}): Promise<{ products: Product[]; records: ProductDiscoveryRecord[]; coverSources: ProductCoverSource[] }> {
  const products = deduplicateProductAliases(options.existingProducts);
  const records: ProductDiscoveryRecord[] = [];
  const coverSources: ProductCoverSource[] = [];
  const fetcher = options.fetcher ?? fetch;

  for (const input of options.candidates) {
    const candidate = ProductCandidateSchema.parse(input.product);
    const candidateSlug = slugify(`${candidate.brand}-${candidate.name}`);
    const baseRecord = createRecord(input.source, candidate, candidateSlug, options.generatedAt);

    if (input.source.sourceTier !== "official") {
      records.push({ ...baseRecord, status: "pending", reason: "source-not-official" });
      continue;
    }

    const existingIndex = products.findIndex((product) => isSameProduct(product, candidate, input.source.url));
    if (existingIndex >= 0) {
      const existing = products[existingIndex];
      products[existingIndex] = ProductSchema.parse({
        ...existing,
        form: candidate.form,
        status: candidate.status,
        positioning: candidate.positioning,
        audience: candidate.audience,
        scenarios: candidate.scenarios,
        capabilities: candidate.capabilities,
        specs: toSpecsRecord(candidate.specs),
        architecture: candidate.architecture,
        tradeoffs: candidate.tradeoffs,
        updatedAt: options.generatedAt,
        sources: mergeSources(existing.sources, toSource(input.source, options.generatedAt))
      });
      records.push({ ...baseRecord, status: "updated", productSlug: existing.slug });
      continue;
    }

    const cover = await acquireProductCover({
      slug: candidateSlug,
      pageUrl: input.source.url,
      publicRoot: options.publicRoot,
      fetcher
    });
    if (cover.status === "rejected") {
      records.push({ ...baseRecord, status: "pending", reason: cover.reason });
      continue;
    }

    const product = ProductSchema.parse({
      id: `product-${createHash("sha256").update(normalizeProductKey(candidate.brand, candidate.name)).digest("hex").slice(0, 12)}`,
      slug: candidateSlug,
      brand: candidate.brand,
      name: candidate.name,
      form: candidate.form,
      status: candidate.status,
      heroImage: cover.localPath,
      officialUrl: input.source.url,
      positioning: candidate.positioning,
      audience: candidate.audience,
      scenarios: candidate.scenarios,
      capabilities: candidate.capabilities,
      specs: toSpecsRecord(candidate.specs),
      architecture: candidate.architecture,
      tradeoffs: candidate.tradeoffs,
      updatedAt: options.generatedAt,
      sources: [toSource(input.source, options.generatedAt)]
    });
    products.push(product);
    records.push({ ...baseRecord, status: "published", productSlug: product.slug });
    coverSources.push({
      productSlug: product.slug,
      pageUrl: input.source.url,
      imageUrl: cover.imageUrl,
      localPath: cover.localPath
    });
  }

  return { products, records, coverSources };
}

export function extractProductImageUrls(html: string, pageUrl: string): string[] {
  const $ = cheerio.load(html);
  const rawUrls = [
    $('meta[property="og:image"]').attr("content"),
    $('meta[property="og:image:secure_url"]').attr("content"),
    $('meta[name="twitter:image"]').attr("content"),
    $('meta[name="twitter:image:src"]').attr("content"),
    $('link[rel="image_src"]').attr("href"),
    ...extractJsonLdImages($('script[type="application/ld+json"]').toArray().map((element) => $(element).text()))
  ];
  const resolved = rawUrls.flatMap((value) => {
    if (!value) return [];
    try {
      const url = new URL(value, pageUrl);
      return url.protocol === "https:" || url.protocol === "http:" ? [url.toString()] : [];
    } catch {
      return [];
    }
  });
  return [...new Set(resolved)];
}

async function acquireProductCover(options: {
  slug: string;
  pageUrl: string;
  publicRoot: string;
  fetcher: typeof fetch;
}): Promise<
  { status: "accepted"; imageUrl: string; localPath: string }
  | { status: "rejected"; reason: "cover-missing" | "cover-invalid" }
> {
  let page: Response;
  try {
    page = await options.fetcher(options.pageUrl, {
      headers: { Accept: "text/html,application/xhtml+xml" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch {
    return { status: "rejected", reason: "cover-missing" };
  }
  if (!page?.ok) return { status: "rejected", reason: "cover-missing" };
  const imageUrls = extractProductImageUrls(await page.text(), options.pageUrl).slice(0, 8);
  if (imageUrls.length === 0) return { status: "rejected", reason: "cover-missing" };

  for (const imageUrl of imageUrls) {
    try {
      const response = await options.fetcher(imageUrl, {
        headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,*/*" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      if (!response.ok || !response.headers.get("content-type")?.toLowerCase().startsWith("image/")) continue;
      const contentLength = Number(response.headers.get("content-length") ?? 0);
      if (contentLength > MAX_IMAGE_BYTES) continue;
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) continue;
      const metadata = await sharp(buffer).metadata();
      if (!isAcceptableCover(metadata.width, metadata.height)) continue;
      const statistics = await sharp(buffer).stats();
      if (statistics.entropy < 1.5) continue;

      const localPath = `/assets/products/${options.slug}.webp`;
      const outputPath = join(options.publicRoot, "assets", "products", `${options.slug}.webp`);
      await mkdir(join(options.publicRoot, "assets", "products"), { recursive: true });
      const normalized = await sharp(buffer)
        .rotate()
        .resize(1200, 720, { fit: "contain", background: { r: 243, g: 243, b: 241, alpha: 1 } })
        .webp({ quality: 84 })
        .toBuffer();
      await writeFile(outputPath, normalized);
      return { status: "accepted", imageUrl, localPath };
    } catch {
      // Continue through the ranked image candidates until one passes the gate.
    }
  }
  return { status: "rejected", reason: "cover-invalid" };
}

function extractJsonLdImages(blocks: string[]): string[] {
  return blocks.flatMap((block) => {
    try {
      return collectJsonLdImages(JSON.parse(block) as unknown);
    } catch {
      return [];
    }
  });
}

function collectJsonLdImages(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectJsonLdImages);
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const ownImages = isCoverBearingJsonLdType(record["@type"]) ? readImageValue(record.image) : [];
  return [...ownImages, ...Object.entries(record).filter(([key]) => key !== "image").flatMap(([, nested]) => collectJsonLdImages(nested))];
}

function isCoverBearingJsonLdType(value: unknown): boolean {
  const types = Array.isArray(value) ? value : [value];
  const allowed = new Set(["product", "productmodel", "article", "newsarticle", "blogposting"]);
  return types.some((type) => typeof type === "string" && allowed.has(type.toLowerCase()));
}

function readImageValue(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(readImageValue);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return [record.url, record.contentUrl].filter((item): item is string => typeof item === "string");
  }
  return [];
}

function isAcceptableCover(width?: number, height?: number): boolean {
  if (!width || !height || width < MIN_IMAGE_WIDTH || height < MIN_IMAGE_HEIGHT) return false;
  const ratio = width / height;
  return ratio >= 0.6 && ratio <= 5;
}

function toSpecsRecord(specs: ProductCandidate["specs"]): Record<string, string> {
  return Object.fromEntries(specs.map((item) => [item.label, item.value]));
}

function isSameProduct(product: Product, candidate: ProductCandidate, sourceUrl: string): boolean {
  if (normalizeProductKey(product.brand, product.name) === normalizeProductKey(candidate.brand, candidate.name)) return true;
  if (normalizeProductName(product.name) === normalizeProductName(candidate.name) && productSourceUrls(product).has(canonicalUrl(sourceUrl))) return true;
  const existingTokens = productIdentityTokens(product.brand, product.name);
  const candidateTokens = productIdentityTokens(candidate.brand, candidate.name);
  const shared = [...existingTokens].filter((token) => candidateTokens.has(token)).length;
  const union = new Set([...existingTokens, ...candidateTokens]).size;
  return shared >= 2 && union > 0 && shared / union >= 0.8;
}

function deduplicateProductAliases(products: Product[]): Product[] {
  const deduplicated: Product[] = [];
  for (const product of products) {
    const aliasIndex = deduplicated.findIndex((existing) => isHistoricalAlias(existing, product));
    if (aliasIndex < 0) {
      deduplicated.push(product);
      continue;
    }
    const canonical = deduplicated[aliasIndex];
    const identity = canonical.updatedAt.localeCompare(product.updatedAt) <= 0 ? canonical : product;
    const latest = canonical.updatedAt.localeCompare(product.updatedAt) >= 0 ? canonical : product;
    deduplicated[aliasIndex] = ProductSchema.parse({
      ...latest,
      id: identity.id,
      slug: identity.slug,
      brand: identity.brand,
      name: identity.name,
      heroImage: identity.heroImage,
      officialUrl: identity.officialUrl,
      sources: mergeProductSourceLists(canonical.sources, product.sources)
    });
  }
  return deduplicated;
}

function isHistoricalAlias(left: Product, right: Product): boolean {
  if (normalizeProductName(left.name) !== normalizeProductName(right.name)) return false;
  const leftSources = productSourceUrls(left);
  return [...productSourceUrls(right)].some((url) => leftSources.has(url));
}

function normalizeProductName(name: string): string {
  return name.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function productSourceUrls(product: Product): Set<string> {
  return new Set([product.officialUrl, ...product.sources.map((source) => source.url)].map(canonicalUrl));
}

function productIdentityTokens(brand: string, name: string): Set<string> {
  return new Set(`${brand} ${name}`.normalize("NFKD").toLowerCase().match(/[a-z0-9]+|[\p{Script=Han}]+/gu) ?? []);
}

function normalizeProductKey(brand: string, name: string): string {
  return `${brand} ${name}`.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function slugify(value: string): string {
  const slug = value.normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
  return slug || `product-${createHash("sha256").update(value).digest("hex").slice(0, 12)}`;
}

function toSource(candidate: RawCandidate, fetchedAt: string): Source {
  return {
    id: candidate.id,
    name: candidate.sourceName,
    url: candidate.url,
    tier: candidate.sourceTier,
    language: candidate.language,
    fetchedAt
  };
}

function mergeSources(existing: Source[], incoming: Source): Source[] {
  const byUrl = new Map(existing.map((source) => [canonicalUrl(source.url), source]));
  byUrl.set(canonicalUrl(incoming.url), incoming);
  return [...byUrl.values()];
}

function mergeProductSourceLists(left: Source[], right: Source[]): Source[] {
  const byUrl = new Map(left.map((source) => [canonicalUrl(source.url), source]));
  right.forEach((source) => byUrl.set(canonicalUrl(source.url), source));
  return [...byUrl.values()];
}

function canonicalUrl(value: string): string {
  const url = new URL(value);
  url.hash = "";
  url.searchParams.sort();
  return url.toString().replace(/\/$/, "");
}

function createRecord(source: RawCandidate, candidate: ProductCandidate, slug: string, discoveredAt: string): Omit<ProductDiscoveryRecord, "status"> {
  return {
    id: `candidate-${createHash("sha256").update(`${source.id}:${normalizeProductKey(candidate.brand, candidate.name)}`).digest("hex").slice(0, 16)}`,
    sourceDocumentId: source.id,
    sourceUrl: source.url,
    brand: candidate.brand,
    name: candidate.name,
    productSlug: slug,
    discoveredAt,
    candidate
  };
}
