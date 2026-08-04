import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ContentItemSchema, FrontierSignalSchema, getIndependentSourceKey, GitHubProjectSchema, LearningNodeSchema, ProductSchema } from "@jingjian/domain";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "apps/web/public");
const read = <T>(path: string): T => JSON.parse(readFileSync(join(root, path), "utf8")) as T;
const unique = (values: string[]) => new Set(values).size === values.length;

describe("public snapshot integrity", () => {
  it("keeps every entity valid, unique and addressable", () => {
    const value = read<{ items: unknown[] }>("data/rankings/value.json").items.map((item) => ContentItemSchema.parse(item));
    const heat = read<{ items: unknown[] }>("data/rankings/heat.json").items.map((item) => ContentItemSchema.parse(item));
    const products = read<{ items: unknown[] }>("data/products/index.json").items.map((item) => ProductSchema.parse(item));
    const projects = read<{ items: unknown[] }>("data/projects/index.json").items.map((item) => GitHubProjectSchema.parse(item));
    const signals = read<{ items: unknown[] }>("data/radar/latest.json").items.map((item) => FrontierSignalSchema.parse(item));
    const learning = read<{ items: unknown[] }>("data/learning/route.json").items.map((item) => LearningNodeSchema.parse(item));

    for (const items of [value, heat, products, projects, signals, learning]) {
      expect(unique(items.map((item) => item.id))).toBe(true);
    }
    expect(unique(value.map((item) => item.slug))).toBe(true);
    expect(value.every((item) => item.score.verification === "verified")).toBe(true);
    expect(unique(products.map((item) => item.slug))).toBe(true);
    expect(unique(projects.map((item) => item.slug))).toBe(true);
    [...value, ...heat].forEach((item) => {
      const traceableDomains = new Set(item.sources.map((source) => getIndependentSourceKey(source.url)));
      expect(item.score.independentSources, `${item.slug} traceable source count`).toBe(traceableDomains.size);
    });

    products.forEach((product) => {
      expect(read(`data/products/${product.slug}.json`)).toEqual(product);
      expect(product.heroImage, `${product.slug} cover image`).toMatch(/^\/assets\/products\/.+\.webp$/);
      expect(existsSync(join(root, product.heroImage!)), `${product.slug} cover file`).toBe(true);
    });
    projects.forEach((project) => expect(read(`data/projects/${project.slug}.json`)).toEqual(project));
  });

  it("resolves every cross-reference and search destination", () => {
    const value = read<{ items: Array<{ id: string; slug: string; productSlugs: string[]; learningNodeIds: string[] }> }>("data/rankings/value.json").items;
    const heat = read<{ items: Array<{ id: string; slug: string; productSlugs: string[]; learningNodeIds: string[] }> }>("data/rankings/heat.json").items;
    const contents = [...new Map([...value, ...heat].map((item) => [item.id, item])).values()];
    const products = read<{ items: Array<{ slug: string }> }>("data/products/index.json").items;
    const projects = read<{ items: Array<{ slug: string }> }>("data/projects/index.json").items;
    const signals = read<{ items: Array<{ id: string; productSlugs: string[]; projectSlugs: string[] }> }>("data/radar/latest.json").items;
    const learning = read<{ items: Array<{ id: string; prerequisites: string[]; productSlugs: string[] }> }>("data/learning/route.json").items;
    const weekly = read<{ isoWeek: string; contentIds: string[]; signalIds: string[] }>("data/weekly/latest.json");
    const search = read<{ items: Array<{ type: string; slug: string }> }>("data/search-index.json").items;
    const productSlugs = new Set(products.map((item) => item.slug));
    const projectSlugs = new Set(projects.map((item) => item.slug));
    const contentIds = new Set(contents.map((item) => item.id));
    const contentSlugs = new Set(contents.map((item) => item.slug));
    const signalIds = new Set(signals.map((item) => item.id));
    const learningIds = new Set(learning.map((item) => item.id));

    contents.forEach((item) => {
      item.productSlugs.forEach((slug) => expect(productSlugs.has(slug), `missing product ${slug}`).toBe(true));
      item.learningNodeIds.forEach((id) => expect(learningIds.has(id), `missing learning node ${id}`).toBe(true));
    });
    signals.forEach((item) => {
      item.productSlugs.forEach((slug) => expect(productSlugs.has(slug), `missing product ${slug}`).toBe(true));
      item.projectSlugs.forEach((slug) => expect(projectSlugs.has(slug), `missing project ${slug}`).toBe(true));
    });
    learning.forEach((item) => {
      item.prerequisites.forEach((id) => expect(learningIds.has(id), `missing prerequisite ${id}`).toBe(true));
      item.productSlugs.forEach((slug) => expect(productSlugs.has(slug), `missing product ${slug}`).toBe(true));
    });
    weekly.contentIds.forEach((id) => expect(contentIds.has(id), `missing weekly content ${id}`).toBe(true));
    weekly.signalIds.forEach((id) => expect(signalIds.has(id), `missing weekly signal ${id}`).toBe(true));
    expect(existsSync(join(root, `data/weekly/${weekly.isoWeek}.json`))).toBe(true);

    search.forEach((item) => {
      const exists = item.type === "content" ? contentSlugs.has(item.slug)
        : item.type === "product" ? productSlugs.has(item.slug)
          : item.type === "project" ? projectSlugs.has(item.slug)
            : signalIds.has(item.slug);
      expect(exists, `broken search target ${item.type}:${item.slug}`).toBe(true);
    });
  });
});
