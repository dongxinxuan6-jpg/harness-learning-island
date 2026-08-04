import { expect, test } from "@playwright/test";

test("首页呈现今日重点并保持布局稳定", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /^(今天|最近一期)，先看清三个变化$/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^(今日|最近一期)价值榜$/ })).toBeVisible();
  await expect(page.getByText("前沿热议", { exact: true })).toBeVisible();
  const productImages = page.locator(".product-card__image img");
  await expect(productImages).toHaveCount(2);
  await expect.poll(() => productImages.evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({ path: testInfo.outputPath("home.png"), fullPage: true });
});

test("七个一级内容板块均可访问", async ({ page }, testInfo) => {
  const routes = [
    ["/rankings", "真正值得读的内容"],
    ["/products", "从产品出发，理解 AI 与硬件"],
    ["/projects", "代码比发布稿更接近真实能力"],
    ["/radar", "从研究走到产品交付"],
    ["/learning", "从看懂一款眼镜，到形成产品判断"],
    ["/weekly", /^第\s+\d+\s+周：.+$/]
  ] as const;

  for (const [route, heading] of routes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${route} 存在横向溢出`).toBeLessThanOrEqual(1);
  }
  await page.screenshot({ path: testInfo.outputPath("weekly.png"), fullPage: true });
});

test("文章摘要与思维导图在三种视口保持可读", async ({ page }, testInfo) => {
  await page.goto("/content/android-xr-dp4-glasses");
  await expect(page.getByRole("region", { name: "文章摘要与思维导图" })).toBeVisible();
  await expect(page.locator(".mindmap-node")).toHaveCount(4);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({ path: testInfo.outputPath("article.png"), fullPage: true });
});

test("PWA 缓存支持离线打开最近一期", async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "离线流程只需在一个 Chromium 视口验收");
  await page.goto("/");
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: /^(今天|最近一期)，先看清三个变化$/ })).toBeVisible();
});

test("核心路由没有控制台异常或站内资源错误", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "运行一次完整浏览器诊断即可");
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") failures.push(`console: ${message.text()}`); });
  page.on("response", (response) => {
    if (response.url().startsWith("http://127.0.0.1:4174") && response.status() >= 400) {
      failures.push(`${response.status()}: ${response.url()}`);
    }
  });

  for (const route of [
    "/",
    "/rankings?tab=heat",
    "/products/even-g2",
    "/projects/mentra-os",
    "/radar#signal-glimmer",
    "/learning#stage-1-form-factors",
    "/weekly",
    "/content/android-xr-dp4-glasses",
    "/search",
    "/settings"
  ]) {
    await page.goto(route);
    await expect(page.locator("main h1").first()).toBeVisible();
    await expect(page.locator(".loading-page")).toHaveCount(0);
    await expect(page.locator(".empty-state")).toHaveCount(0);
  }

  expect(failures).toEqual([]);
});
