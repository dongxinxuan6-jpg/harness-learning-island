import {
  ContentItemSchema,
  FrontierSignalSchema,
  GitHubProjectSchema,
  LearningNodeSchema,
  ProductSchema,
  WeeklyDigestSchema,
  type Product
} from "@jingjian/domain";
import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z, type ZodType } from "zod";
import { ProductDiscoveryRecordSchema } from "./product-discovery";

type SnapshotCollection = { items?: Array<{ slug?: string }> };
type WeeklySnapshot = { isoWeek?: string };
const REQUEST_TIMEOUT_MS = 15_000;

const stablePaths = [
  "data/latest/daily.json",
  "data/rankings/value.json",
  "data/rankings/heat.json",
  "data/products/index.json",
  "data/projects/index.json",
  "data/radar/latest.json",
  "data/learning/route.json",
  "data/weekly/latest.json"
] as const;
const optionalStablePaths = ["data/products/candidates.json", "assets/products/image-sources.json"] as const;

export async function collectPublishedSnapshots(
  siteUrl: string,
  fetcher: typeof fetch = fetch
): Promise<Record<string, unknown>> {
  const base = siteUrl.replace(/\/$/, "");
  const files: Record<string, unknown> = {};
  const fetchSnapshot = async (path: string): Promise<unknown> => {
    const response = await fetcher(`${base}/${path}`, { headers: { "Cache-Control": "no-cache", Accept: "application/json" }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`snapshot hydration failed for ${path}: ${response.status}`);
    const value = await response.json();
    try {
      return validateSnapshot(path, value);
    } catch {
      throw new Error(`snapshot hydration schema failed for ${path}`);
    }
  };

  await Promise.all(stablePaths.map(async (path) => { files[path] = await fetchSnapshot(path); }));
  await Promise.all(optionalStablePaths.map(async (path) => {
    try {
      files[path] = await fetchSnapshot(path);
    } catch {
      // Older deployments predate candidate auditing; the next daily run creates it.
    }
  }));
  const products = files["data/products/index.json"] as SnapshotCollection;
  const projects = files["data/projects/index.json"] as SnapshotCollection;
  const weekly = files["data/weekly/latest.json"] as WeeklySnapshot;
  const detailPaths = [
    ...(products.items ?? []).flatMap((item) => item.slug ? [`data/products/${item.slug}.json`] : []),
    ...(projects.items ?? []).flatMap((item) => item.slug ? [`data/projects/${item.slug}.json`] : []),
    ...(weekly.isoWeek ? [`data/weekly/${weekly.isoWeek}.json`] : [])
  ];
  await Promise.all(detailPaths.map(async (path) => {
    try {
      files[path] = await fetchSnapshot(path);
    } catch {
      // Complete indexes are sufficient for the pipeline to regenerate detail snapshots.
    }
  }));
  return files;
}

export async function hydratePublishedProductAssets(
  siteUrl: string,
  publicRoot: string,
  products: Product[],
  fetcher: typeof fetch = fetch
): Promise<number> {
  const base = siteUrl.replace(/\/$/, "");
  let restored = 0;
  const failures: string[] = [];
  const localCovers = [...new Set(products.flatMap((product) => {
    const match = product.heroImage?.match(/^\/assets\/products\/([^/]+\.webp)$/i);
    return match ? [match[1]] : [];
  }))];

  for (const filename of localCovers) {
    const target = join(publicRoot, "assets", "products", filename);
    try {
      await access(target);
      continue;
    } catch {
      // A generated cover is absent in a clean checkout and must be restored.
    }
    try {
      const response = await fetcher(`${base}/assets/products/${filename}`, {
        headers: { Accept: "image/webp,image/*" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      const contentType = response.headers.get("content-type")?.toLowerCase();
      if (!response.ok || !contentType?.startsWith("image/")) throw new Error(`HTTP ${response.status}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength === 0 || bytes.byteLength > 12 * 1024 * 1024) throw new Error("invalid size");
      await mkdir(join(publicRoot, "assets", "products"), { recursive: true });
      await writeFile(target, bytes);
      restored += 1;
    } catch {
      failures.push(filename);
    }
  }
  if (failures.length > 0) throw new Error(`product cover hydration failed: ${failures.join(", ")}`);
  return restored;
}

const collectionSchema = (item: ZodType) => z.object({ items: z.array(item) }).passthrough();

function validateSnapshot(path: string, value: unknown): unknown {
  if (path === "data/latest/daily.json" || path === "data/rankings/value.json" || path === "data/rankings/heat.json") {
    return collectionSchema(ContentItemSchema).parse(value);
  }
  if (path === "data/products/index.json") return collectionSchema(ProductSchema).parse(value);
  if (path === "data/products/candidates.json") return collectionSchema(ProductDiscoveryRecordSchema).parse(value);
  if (path === "assets/products/image-sources.json") {
    return z.record(z.string(), z.object({ pageUrl: z.string().url(), assetUrl: z.string().url(), note: z.string().optional() })).parse(value);
  }
  if (path === "data/projects/index.json") return collectionSchema(GitHubProjectSchema).parse(value);
  if (path === "data/radar/latest.json") return collectionSchema(FrontierSignalSchema).parse(value);
  if (path === "data/learning/route.json") return collectionSchema(LearningNodeSchema).parse(value);
  if (/^data\/products\/[^/]+\.json$/.test(path)) return ProductSchema.parse(value);
  if (/^data\/projects\/[^/]+\.json$/.test(path)) return GitHubProjectSchema.parse(value);
  if (path === "data/weekly/latest.json" || /^data\/weekly\/[^/]+\.json$/.test(path)) return WeeklyDigestSchema.parse(value);
  return value;
}
