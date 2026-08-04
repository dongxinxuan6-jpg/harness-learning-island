import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ContentItem, FrontierSignal, GitHubProject, LearningNode, Product, WeeklyDigest } from "@jingjian/domain";
import type { ProductDiscoveryRecord } from "./product-discovery";

export type SnapshotDataset = {
  generatedAt: string;
  leadSlug?: string;
  contents: ContentItem[];
  products: Product[];
  productCandidates?: ProductDiscoveryRecord[];
  projects: GitHubProject[];
  signals: FrontierSignal[];
  learningNodes: LearningNode[];
  weekly: WeeklyDigest[];
};

export function createSnapshotFiles(dataset: SnapshotDataset, options: { kind?: "daily" | "heat"; dailyStatus?: "published" | "partial" | "stale"; freshContentIds?: string[] } = {}): Record<string, unknown> {
  const currentContents = dataset.contents.map((item) => decayHeatScore(item, dataset.generatedAt));
  const value = currentContents.filter((item) => item.score.verification === "verified").sort((a, b) => b.score.value - a.score.value);
  const heat = [...currentContents].sort((a, b) => b.score.heat - a.score.heat);
  const dailyItems = value.reduce<ContentItem[]>((selected, item) => {
    if (selected.length >= 10) return selected;
    const minutes = selected.reduce((sum, selectedItem) => sum + selectedItem.readMinutes, 0);
    if (minutes + item.readMinutes <= 15) selected.push(item);
    return selected;
  }, []);
  const freshIds = new Set(options.freshContentIds ?? []);
  const freshItem = value.find((item) => freshIds.has(item.id));
  if (freshItem && !dailyItems.some((item) => item.id === freshItem.id)) {
    while (dailyItems.length > 0 && dailyItems.reduce((sum, item) => sum + item.readMinutes, 0) + freshItem.readMinutes > 15) dailyItems.pop();
    if (dailyItems.length < 10 && dailyItems.reduce((sum, item) => sum + item.readMinutes, 0) + freshItem.readMinutes <= 15) dailyItems.push(freshItem);
  }
  const searchIndex = {
    generatedAt: dataset.generatedAt,
    items: [
      ...dataset.contents.map((item) => ({ type: "content", slug: item.slug, title: item.title, summary: item.summary })),
      ...dataset.products.map((item) => ({ type: "product", slug: item.slug, title: `${item.brand} ${item.name}`, summary: item.positioning })),
      ...dataset.projects.map((item) => ({ type: "project", slug: item.slug, title: item.name, summary: item.description })),
      ...dataset.signals.map((item) => ({ type: "signal", slug: item.id, title: item.title, summary: item.summary }))
    ]
  };
  if (options.kind === "heat") {
    return {
      "data/rankings/heat.json": { generatedAt: dataset.generatedAt, kind: "heat", items: heat },
      "data/search-index.json": searchIndex
    };
  }
  const files: Record<string, unknown> = {
    "data/latest/daily.json": {
      date: getBeijingDate(dataset.generatedAt),
      generatedAt: dataset.generatedAt,
      status: options.dailyStatus === "published" && freshIds.size > 0 && !dailyItems.some((item) => freshIds.has(item.id)) ? "stale" : options.dailyStatus ?? "published",
      totalReadMinutes: dailyItems.reduce((sum, item) => sum + item.readMinutes, 0),
      leadId: dailyItems.find((item) => item.slug === dataset.leadSlug)?.id ?? dailyItems[0]?.id ?? null,
      items: dailyItems
    },
    "data/rankings/value.json": { generatedAt: dataset.generatedAt, kind: "value", items: value },
    "data/rankings/heat.json": { generatedAt: dataset.generatedAt, kind: "heat", items: heat },
    "data/products/index.json": { generatedAt: dataset.generatedAt, items: dataset.products },
    "data/products/candidates.json": { generatedAt: dataset.generatedAt, items: dataset.productCandidates ?? [] },
    "data/projects/index.json": { generatedAt: dataset.generatedAt, items: dataset.projects },
    "data/radar/latest.json": { generatedAt: dataset.generatedAt, items: [...dataset.signals].sort((a, b) => b.impact - a.impact) },
    "data/learning/route.json": { generatedAt: dataset.generatedAt, items: dataset.learningNodes },
    "data/search-index.json": searchIndex
  };
  dataset.products.forEach((product) => { files[`data/products/${product.slug}.json`] = product; });
  dataset.projects.forEach((project) => { files[`data/projects/${project.slug}.json`] = project; });
  dataset.weekly.forEach((week) => { files[`data/weekly/${week.isoWeek}.json`] = week; });
  const latestWeek = [...dataset.weekly].sort((a, b) => b.isoWeek.localeCompare(a.isoWeek))[0];
  if (latestWeek) files["data/weekly/latest.json"] = latestWeek;
  return files;
}

function decayHeatScore(item: ContentItem, generatedAt: string): ContentItem {
  const scoredAt = Date.parse(item.score.scoredAt);
  const currentTime = Date.parse(generatedAt);
  if (!Number.isFinite(scoredAt) || !Number.isFinite(currentTime) || currentTime <= scoredAt) return item;
  const ageHours = (currentTime - scoredAt) / (60 * 60 * 1000);
  const heat = Math.round(item.score.heat * 2 ** (-ageHours / 72));
  return { ...item, score: { ...item.score, heat, scoredAt: generatedAt } };
}

const getBeijingDate = (value: string): string => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
}).format(new Date(value));

export async function writeSnapshotFiles(root: string, files: Record<string, unknown>): Promise<void> {
  await Promise.all(Object.entries(files).map(async ([relativePath, value]) => {
    const target = join(root, relativePath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  }));
}
