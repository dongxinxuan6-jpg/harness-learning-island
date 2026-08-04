import { describe, expect, it, vi } from "vitest";
import { extractReadableHtml, hydrateCandidateFromPage, parseArxivFeed, parseRssFeed } from "./connectors";
import type { RawCandidate } from "./types";

describe("parseRssFeed", () => {
  it("maps RSS items to normalized candidates", () => {
    const result = parseRssFeed(`
      <rss><channel><item>
        <title>Android XR glasses update</title>
        <link>https://example.com/xr</link>
        <pubDate>Mon, 03 Aug 2026 01:00:00 GMT</pubDate>
        <description>Display glasses gain a new UI toolkit.</description>
      </item></channel></rss>
    `, { id: "android", name: "Android Developers", tier: "official", language: "en" });

    expect(result).toEqual([expect.objectContaining({
      sourceId: "android",
      title: "Android XR glasses update",
      url: "https://example.com/xr",
      text: "Display glasses gain a new UI toolkit."
    })]);
  });

  it("maps Atom entries used by developer blogs", () => {
    const result = parseRssFeed(`
      <feed xmlns="http://www.w3.org/2005/Atom"><entry>
        <title>New glasses SDK</title>
        <link href="https://example.com/atom-xr" />
        <updated>2026-08-03T01:00:00Z</updated>
        <summary>SDK support for display glasses.</summary>
      </entry></feed>
    `, { id: "developer-blog", name: "Developer Blog", tier: "official", language: "en" });

    expect(result).toEqual([expect.objectContaining({
      title: "New glasses SDK",
      url: "https://example.com/atom-xr",
      text: "SDK support for display glasses."
    })]);
  });
});

describe("parseArxivFeed", () => {
  it("extracts an entry and its canonical paper URL", () => {
    const result = parseArxivFeed(`
      <feed xmlns="http://www.w3.org/2005/Atom"><entry>
        <id>http://arxiv.org/abs/2606.07431v1</id>
        <updated>2026-06-05T16:27:02Z</updated>
        <published>2026-06-05T16:27:02Z</published>
        <title>OpenGlass: On-device gesture recognition</title>
        <summary> A modular smart eyewear platform. </summary>
      </entry></feed>
    `);

    expect(result[0]).toEqual(expect.objectContaining({
      url: "https://arxiv.org/abs/2606.07431v1",
      title: "OpenGlass: On-device gesture recognition",
      sourceId: "arxiv"
    }));
  });

  it("skips malformed entries without discarding valid items from the feed", () => {
    const result = parseRssFeed(`
      <rss><channel>
        <item><title>Broken date</title><link>https://example.com/broken</link><pubDate>not-a-date</pubDate></item>
        <item><title>Valid update</title><link>https://example.com/valid</link><pubDate>Mon, 03 Aug 2026 01:00:00 GMT</pubDate></item>
      </channel></rss>
    `, { id: "official", name: "Official", tier: "official", language: "en" });

    expect(result.map((item) => item.title)).toEqual(["Valid update"]);
  });
});

describe("extractReadableHtml", () => {
  it("removes navigation and keeps article text", () => {
    const result = extractReadableHtml(`
      <html><head><title>AI glasses</title></head><body>
      <nav>Menu</nav><article><h1>Display optics</h1><p>Waveguides keep information glanceable.</p></article>
      </body></html>
    `, "https://example.com/article");

    expect(result.title).toBe("Display optics");
    expect(result.text).toContain("Waveguides keep information glanceable.");
    expect(result.text).not.toContain("Menu");
  });

  it("hydrates a feed snippet with the official article body before AI analysis", async () => {
    const candidate: RawCandidate = {
      id: "official-launch",
      sourceId: "official",
      sourceName: "Official",
      sourceTier: "official",
      language: "en",
      title: "Vision One launch",
      url: "https://acme.example/vision-one",
      text: "Short feed snippet.",
      publishedAt: "2026-08-04T00:00:00.000Z",
      contentHash: "hash"
    };
    const fetcher = vi.fn(async () => new Response(`
      <article><h1>Vision One launch</h1><p>Vision One uses a monocular display.</p><p>It ships with a phone companion and voice assistant.</p></article>
    `, { headers: { "Content-Type": "text/html" } }));

    const hydrated = await hydrateCandidateFromPage(candidate, fetcher);

    expect(hydrated.text).toContain("monocular display");
    expect(hydrated.text.length).toBeGreaterThan(candidate.text.length);
    expect(hydrated.id).toBe(candidate.id);
  });

  it("keeps the feed text when the article page is unavailable", async () => {
    const candidate = parseRssFeed(`
      <rss><channel><item><title>Glasses update</title><link>https://example.com/update</link><pubDate>Mon, 03 Aug 2026 01:00:00 GMT</pubDate><description>Useful feed text.</description></item></channel></rss>
    `, { id: "official", name: "Official", tier: "official", language: "en" })[0];

    await expect(hydrateCandidateFromPage(candidate, vi.fn(async () => new Response(null, { status: 503 }))))
      .resolves.toEqual(candidate);
  });
});
