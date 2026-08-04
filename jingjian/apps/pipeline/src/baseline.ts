import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  ContentItemSchema,
  FrontierSignalSchema,
  GitHubProjectSchema,
  LearningNodeSchema,
  ProductSchema,
  WeeklyDigestSchema,
  type ContentItem
} from "@jingjian/domain";
import type { SnapshotDataset } from "./snapshots";
import { ProductDiscoveryRecordSchema } from "./product-discovery";

type JsonReader = (path: string) => Promise<unknown>;
type Collection = { generatedAt?: string; items?: unknown[] };

export async function loadSnapshotBaseline(
  root: string,
  fallback: SnapshotDataset,
  reader: JsonReader = async (path) => JSON.parse(await readFile(path, "utf8")) as unknown
): Promise<SnapshotDataset> {
  try {
    const [value, heat, products, productCandidates, projects, radar, learning, weekly] = await Promise.all([
      reader(join(root, "data/rankings/value.json")) as Promise<Collection>,
      reader(join(root, "data/rankings/heat.json")) as Promise<Collection>,
      reader(join(root, "data/products/index.json")) as Promise<Collection>,
      reader(join(root, "data/products/candidates.json"))
        .then((value) => value as Collection)
        .catch(() => ({ items: fallback.productCandidates ?? [] })),
      reader(join(root, "data/projects/index.json")) as Promise<Collection>,
      reader(join(root, "data/radar/latest.json")) as Promise<Collection>,
      reader(join(root, "data/learning/route.json")) as Promise<Collection>,
      reader(join(root, "data/weekly/latest.json")) as Promise<SnapshotDataset["weekly"][number]>
    ]);
    if (![value.items, heat.items, products.items, projects.items, radar.items, learning.items].every(Array.isArray) || !weekly?.isoWeek) {
      throw new Error("snapshot baseline is incomplete");
    }
    const valueItems = ContentItemSchema.array().parse(value.items);
    const heatItems = ContentItemSchema.array().parse(heat.items);
    const productItems = ProductSchema.array().parse(products.items);
    const productCandidateItems = ProductDiscoveryRecordSchema.array().parse(productCandidates.items ?? []);
    const projectItems = GitHubProjectSchema.array().parse(projects.items);
    const signalItems = FrontierSignalSchema.array().parse(radar.items);
    const learningItems = LearningNodeSchema.array().parse(learning.items);
    const weeklyItem = WeeklyDigestSchema.parse(weekly);
    const generatedAt = [value.generatedAt, heat.generatedAt].filter((item): item is string => typeof item === "string").sort().at(-1);
    return {
      generatedAt: generatedAt ?? fallback.generatedAt,
      contents: mergeContentBySlug(valueItems, heatItems),
      products: productItems,
      productCandidates: productCandidateItems,
      projects: projectItems,
      signals: signalItems,
      learningNodes: learningItems,
      weekly: [weeklyItem]
    };
  } catch (error) {
    console.warn(`Published baseline unavailable: ${error instanceof Error ? error.message : String(error)}`);
    return fallback;
  }
}

export function mergeContentBySlug(existing: ContentItem[], incoming: ContentItem[]): ContentItem[] {
  return Array.from(new Map([...existing, ...incoming].map((item) => [item.slug, item])).values());
}
