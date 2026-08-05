import { describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectPublishedSnapshots, hydratePublishedProductAssets } from "./hydration";
import { seedDataset } from "./seed-data";

describe("collectPublishedSnapshots", () => {
  it("collects stable indexes, detail records and the current weekly archive", async () => {
    const payloads: Record<string, unknown> = {
      "/data/latest/daily.json": { items: [] },
      "/data/rankings/value.json": { items: [] },
      "/data/rankings/heat.json": { items: [] },
      "/data/products/index.json": { items: [{ ...seedDataset.products[0], slug: "product-one" }] },
      "/data/products/candidates.json": { generatedAt: "2026-08-04T00:00:00.000Z", items: [] },
      "/data/products/product-one.json": { ...seedDataset.products[0], slug: "product-one" },
      "/data/projects/index.json": { items: [{ ...seedDataset.projects[0], slug: "project-one" }] },
      "/data/projects/project-one.json": { ...seedDataset.projects[0], slug: "project-one" },
      "/data/radar/latest.json": { items: [] },
      "/data/learning/route.json": { items: [] },
      "/data/system/status.json": { generatedAt: "2026-08-05T00:00:00.000Z", persistence: "succeeded" },
      "/data/search-index.json": { generatedAt: "2026-08-05T00:00:00.000Z", items: [] },
      "/data/weekly/latest.json": { ...seedDataset.weekly[0], isoWeek: "2026-W32" },
      "/data/weekly/2026-W32.json": { ...seedDataset.weekly[0], isoWeek: "2026-W32" },
      "/assets/products/image-sources.json": { "product-one": { pageUrl: "https://example.com/product", assetUrl: "https://example.com/image.webp" } }
    };
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const path = new URL(String(input)).pathname;
      return payloads[path] ? Response.json(payloads[path]) : new Response(null, { status: 404 });
    });

    const files = await collectPublishedSnapshots("https://jingjian.example/", fetcher);

    expect(fetcher.mock.calls.every(([input]) => new URL(String(input)).searchParams.has("hydrate"))).toBe(true);
    expect(Object.keys(files).sort()).toEqual(Object.keys(payloads).map((path) => path.slice(1)).sort());
  });

  it("stops hydration when a required snapshot is missing", async () => {
    await expect(collectPublishedSnapshots("https://jingjian.example", vi.fn(async () => new Response(null, { status: 404 }))))
      .rejects.toThrow("snapshot hydration failed");
  });

  it("keeps complete indexes when a regenerable detail snapshot is missing", async () => {
    const required: Record<string, unknown> = {
      "/data/latest/daily.json": { items: [] },
      "/data/rankings/value.json": { items: [] },
      "/data/rankings/heat.json": { items: [] },
      "/data/products/index.json": { items: [{ ...seedDataset.products[0], slug: "missing-detail" }] },
      "/data/projects/index.json": { items: [] },
      "/data/radar/latest.json": { items: [] },
      "/data/learning/route.json": { items: [] },
      "/data/system/status.json": { generatedAt: "2026-08-05T00:00:00.000Z", persistence: "succeeded" },
      "/data/search-index.json": { generatedAt: "2026-08-05T00:00:00.000Z", items: [] },
      "/data/weekly/latest.json": { ...seedDataset.weekly[0], isoWeek: "2026-W32" },
      "/data/weekly/2026-W32.json": { ...seedDataset.weekly[0], isoWeek: "2026-W32" }
    };
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const path = new URL(String(input)).pathname;
      return required[path] ? Response.json(required[path]) : new Response(null, { status: 404 });
    });

    await expect(collectPublishedSnapshots("https://jingjian.example", fetcher)).resolves.toEqual(
      Object.fromEntries(Object.entries(required).map(([path, value]) => [path.slice(1), value]))
    );
  });

  it("rejects malformed required snapshots before they reach the public directory", async () => {
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const path = new URL(String(input)).pathname;
      if (path === "/data/products/index.json") return Response.json({ items: [{}] });
      if (path === "/data/weekly/latest.json") return Response.json(seedDataset.weekly[0]);
      return Response.json({ generatedAt: "2026-08-03T00:00:00Z", items: [] });
    });

    await expect(collectPublishedSnapshots("https://jingjian.example", fetcher)).rejects.toThrow("snapshot hydration schema failed");
  });

  it("restores a generated product cover from the published site into a clean CI checkout", async () => {
    const root = await mkdtemp(join(tmpdir(), "jingjian-hydration-"));
    const product = { ...seedDataset.products[0], slug: "new-product", heroImage: "/assets/products/new-product.webp" };
    const bytes = new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4]);
    const fetcher = vi.fn(async (input: string | URL | Request) => String(input) === "https://jingjian.example/assets/products/new-product.webp"
      ? new Response(bytes, { headers: { "Content-Type": "image/webp" } })
      : new Response(null, { status: 404 }));

    const restored = await hydratePublishedProductAssets("https://jingjian.example", root, [product], fetcher);

    expect(restored).toBe(1);
    expect(new Uint8Array(await readFile(join(root, "assets/products/new-product.webp")))).toEqual(bytes);
  });

  it("stops hydration when a referenced generated cover is missing remotely", async () => {
    const root = await mkdtemp(join(tmpdir(), "jingjian-hydration-"));
    const product = { ...seedDataset.products[0], slug: "missing-cover", heroImage: "/assets/products/missing-cover.webp" };

    await expect(hydratePublishedProductAssets("https://jingjian.example", root, [product], vi.fn(async () => new Response(null, { status: 404 }))))
      .rejects.toThrow("product cover hydration failed");
  });
});
