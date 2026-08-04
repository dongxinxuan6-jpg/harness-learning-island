import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
import { seedDataset } from "./seed-data";
import {
  discoverProductCandidates,
  extractProductImageUrls,
  mergeProductDiscoveryRecords,
  type ProductCandidate
} from "./product-discovery";
import type { RawCandidate } from "./types";

const productCandidate: ProductCandidate = {
  brand: "Acme",
  name: "Vision One",
  form: "display",
  status: "announced",
  positioning: "A lightweight display for contextual AI assistance.",
  audience: "Early adopters",
  scenarios: ["Navigation", "Translation"],
  capabilities: ["Camera", "Monocular display"],
  specs: [{ label: "display", value: "MicroLED" }],
  architecture: ["Glasses", "Phone companion", "Cloud model"],
  tradeoffs: ["Battery life remains unverified"]
};

const source = (tier: RawCandidate["sourceTier"] = "official", overrides: Partial<RawCandidate> = {}): RawCandidate => ({
  id: `source-${tier}`,
  sourceId: `feed-${tier}`,
  sourceName: tier === "official" ? "Acme Newsroom" : "Industry Media",
  sourceTier: tier,
  language: "en",
  title: "Acme launches Vision One AI glasses",
  url: "https://acme.example/news/vision-one",
  text: "Acme announced Vision One, a new pair of display AI glasses.",
  publishedAt: "2026-08-04T00:00:00.000Z",
  contentHash: `hash-${tier}`,
  ...overrides
});

describe("extractProductImageUrls", () => {
  it("extracts and resolves social, JSON-LD and image-src cover candidates", () => {
    const html = `
      <meta property="og:image" content="/media/hero.jpg">
      <meta name="twitter:image" content="https://cdn.example/social.png">
      <link rel="image_src" href="images/fallback.webp">
      <script type="application/ld+json">{"@type":"Product","image":["/media/product-front.jpg"]}</script>
    `;

    expect(extractProductImageUrls(html, "https://acme.example/news/vision-one")).toEqual([
      "https://acme.example/media/hero.jpg",
      "https://cdn.example/social.png",
      "https://acme.example/news/images/fallback.webp",
      "https://acme.example/media/product-front.jpg"
    ]);
  });

  it("ignores organization logos while retaining Product JSON-LD images", () => {
    const html = `
      <script type="application/ld+json">{"@type":"Organization","image":"/brand-logo.png"}</script>
      <script type="application/ld+json">{"@type":"Product","image":"/vision-one-front.jpg"}</script>
    `;

    expect(extractProductImageUrls(html, "https://acme.example/products/vision-one")).toEqual([
      "https://acme.example/vision-one-front.jpg"
    ]);
  });
});

describe("discoverProductCandidates", () => {
  it("keeps non-official discoveries pending without downloading an image", async () => {
    const fetcher = vi.fn();
    const result = await discoverProductCandidates({
      existingProducts: seedDataset.products,
      candidates: [{ source: source("media"), product: productCandidate }],
      generatedAt: "2026-08-04T02:00:00.000Z",
      publicRoot: "unused",
      fetcher
    });

    expect(result.products).toEqual(seedDataset.products);
    expect(result.records).toEqual([
      expect.objectContaining({ status: "pending", reason: "source-not-official", brand: "Acme", name: "Vision One" })
    ]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("publishes an official new product with a normalized local WebP cover and provenance", async () => {
    const root = await mkdtemp(join(tmpdir(), "jingjian-product-"));
    const pixels = Buffer.alloc(1600 * 900 * 3);
    pixels.forEach((_, index) => { pixels[index] = (index * 31 + Math.floor(index / 3000) * 17) % 256; });
    const original = await sharp(pixels, { raw: { width: 1600, height: 900, channels: 3 } }).png().toBuffer();
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url === "https://acme.example/news/vision-one") {
        return new Response('<meta property="og:image" content="https://acme.example/media/vision-one.png">', {
          headers: { "Content-Type": "text/html" }
        });
      }
      if (url === "https://acme.example/media/vision-one.png") {
        return new Response(new Uint8Array(original), { headers: { "Content-Type": "image/png" } });
      }
      return new Response(null, { status: 404 });
    });

    const result = await discoverProductCandidates({
      existingProducts: [],
      candidates: [{ source: source(), product: productCandidate }],
      generatedAt: "2026-08-04T02:00:00.000Z",
      publicRoot: root,
      fetcher
    });

    expect(result.products).toEqual([
      expect.objectContaining({
        slug: "acme-vision-one",
        heroImage: "/assets/products/acme-vision-one.webp",
        officialUrl: "https://acme.example/news/vision-one"
      })
    ]);
    expect(result.records).toEqual([expect.objectContaining({ status: "published", productSlug: "acme-vision-one" })]);
    expect(result.coverSources).toEqual([{
      productSlug: "acme-vision-one",
      pageUrl: "https://acme.example/news/vision-one",
      imageUrl: "https://acme.example/media/vision-one.png",
      localPath: "/assets/products/acme-vision-one.webp"
    }]);
    const metadata = await sharp(await readFile(join(root, "assets/products/acme-vision-one.webp"))).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.width).toBe(1200);
    expect(metadata.height).toBe(720);
  });

  it("keeps an official product pending when every discovered image fails the quality gate", async () => {
    const root = await mkdtemp(join(tmpdir(), "jingjian-product-"));
    const thumbnail = await sharp({ create: { width: 200, height: 100, channels: 3, background: "#dddddd" } }).png().toBuffer();
    const fetcher = vi.fn(async (input: string | URL | Request) => String(input).endsWith(".png")
      ? new Response(new Uint8Array(thumbnail), { headers: { "Content-Type": "image/png" } })
      : new Response('<meta property="og:image" content="https://acme.example/media/tiny.png">'));

    const result = await discoverProductCandidates({
      existingProducts: [],
      candidates: [{ source: source(), product: productCandidate }],
      generatedAt: "2026-08-04T02:00:00.000Z",
      publicRoot: root,
      fetcher
    });

    expect(result.products).toEqual([]);
    expect(result.records).toEqual([expect.objectContaining({ status: "pending", reason: "cover-invalid" })]);
  });

  it("rejects a high-resolution image that is effectively a blank placeholder", async () => {
    const root = await mkdtemp(join(tmpdir(), "jingjian-product-"));
    const blank = await sharp({ create: { width: 1600, height: 900, channels: 3, background: "#f3f3f3" } }).png().toBuffer();
    const fetcher = vi.fn(async (input: string | URL | Request) => String(input).endsWith(".png")
      ? new Response(new Uint8Array(blank), { headers: { "Content-Type": "image/png" } })
      : new Response('<meta property="og:image" content="https://acme.example/media/blank.png">'));

    const result = await discoverProductCandidates({
      existingProducts: [],
      candidates: [{ source: source(), product: productCandidate }],
      generatedAt: "2026-08-04T02:00:00.000Z",
      publicRoot: root,
      fetcher
    });

    expect(result.products).toEqual([]);
    expect(result.records[0]).toEqual(expect.objectContaining({ status: "pending", reason: "cover-invalid" }));
  });

  it("updates an existing product without changing its identity, landing page or curated cover", async () => {
    const existing = seedDataset.products[0];
    const fetcher = vi.fn();
    const result = await discoverProductCandidates({
      existingProducts: [existing],
      candidates: [{
        source: source("official", { url: "https://official.example/updates/new-firmware" }),
        product: {
          ...productCandidate,
          brand: existing.brand,
          name: existing.name,
          status: "shipping",
          positioning: "Updated product positioning"
        }
      }],
      generatedAt: "2026-08-04T02:00:00.000Z",
      publicRoot: "unused",
      fetcher
    });

    expect(result.products[0]).toEqual(expect.objectContaining({
      id: existing.id,
      slug: existing.slug,
      heroImage: existing.heroImage,
      officialUrl: existing.officialUrl,
      positioning: "Updated product positioning",
      updatedAt: "2026-08-04T02:00:00.000Z"
    }));
    expect(result.products[0].sources.map((item) => item.url)).toContain("https://official.example/updates/new-firmware");
    expect(result.records).toEqual([expect.objectContaining({ status: "updated", productSlug: existing.slug })]);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("recognizes a product when the model moves the product family into the brand field", async () => {
    const existing = seedDataset.products.find((product) => product.slug === "ray-ban-meta")!;
    const fetcher = vi.fn();
    const result = await discoverProductCandidates({
      existingProducts: [existing],
      candidates: [{
        source: source("official"),
        product: { ...productCandidate, brand: "Ray-Ban", name: "Meta", status: "shipping" }
      }],
      generatedAt: "2026-08-04T02:00:00.000Z",
      publicRoot: "unused",
      fetcher
    });

    expect(result.products).toHaveLength(1);
    expect(result.products[0].slug).toBe("ray-ban-meta");
    expect(result.records[0].status).toBe("updated");
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe("mergeProductDiscoveryRecords", () => {
  it("keeps history while replacing a repeated candidate with its newest state", () => {
    const older = {
      id: "candidate-one",
      sourceDocumentId: "source-one",
      sourceUrl: "https://acme.example/news/vision-one",
      brand: "Acme",
      name: "Vision One",
      status: "pending" as const,
      reason: "cover-missing" as const,
      productSlug: "acme-vision-one",
      discoveredAt: "2026-08-03T02:00:00.000Z",
      candidate: productCandidate
    };
    const newer = { ...older, status: "published" as const, reason: undefined, discoveredAt: "2026-08-04T02:00:00.000Z" };
    const separate = { ...older, id: "candidate-two", sourceDocumentId: "source-two" };

    expect(mergeProductDiscoveryRecords([older, separate], [newer])).toEqual([newer, separate]);
  });
});
