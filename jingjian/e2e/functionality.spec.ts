import { expect, test } from "@playwright/test";

test("榜单、产品筛选和详情外链均可操作", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "核心交互在桌面 Chromium 验收一次");

  await page.goto("/rankings");
  await page.getByRole("tab", { name: "热议榜" }).click();
  await expect(page).toHaveURL(/rankings\?tab=heat/);
  await expect(page.getByRole("heading", { name: "大家正在集中讨论什么" })).toBeVisible();

  const productIndex = await page.request.get("/data/products/index.json").then((response) => response.json()) as {
    items: Array<{ form: string; status: string }>;
  };
  const spatialCount = productIndex.items.filter((product) => product.form === "spatial").length;
  const spatialShippingCount = productIndex.items.filter((product) => product.form === "spatial" && product.status === "shipping").length;

  await page.goto("/products");
  await page.getByLabel("产品形态").getByRole("button", { name: "空间计算" }).click();
  await expect(page.locator(".product-card")).toHaveCount(spatialCount);
  await page.getByLabel("产品状态").selectOption("shipping");
  if (spatialShippingCount === 0) await expect(page.getByText("当前组合没有产品")).toBeVisible();
  else await expect(page.locator(".product-card")).toHaveCount(spatialShippingCount);
  await page.getByRole("button", { name: "清除筛选" }).click();
  await expect(page.locator(".product-card")).toHaveCount(productIndex.items.length);

  await page.goto("/products/even-g2");
  await expect(page.getByRole("link", { name: /官方网站/ })).toHaveAttribute("href", "https://www.evenrealities.com/en-US/smart-glasses");
  await expect(page.getByRole("textbox", { name: "我的笔记" })).toBeVisible();

  await page.goto("/projects/mentra-os");
  await expect(page.locator(".project-architecture > div")).toHaveCount(5);
  await expect(page.getByRole("link", { name: /打开 GitHub/ })).toHaveAttribute("href", "https://github.com/Mentra-Community/MentraOS");
  await expect(page.getByRole("textbox", { name: "我的笔记" })).toBeVisible();
});

test("文章摘要、收藏、笔记和学习关联可持久化", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "核心交互在桌面 Chromium 验收一次");

  await page.goto("/content/android-xr-dp4-glasses");
  await expect(page.getByRole("region", { name: "文章摘要与思维导图" })).toBeVisible();
  await expect(page.getByText("产品思维导图")).toBeVisible();

  await page.getByRole("button", { name: "收藏" }).click();
  await expect(page.getByRole("button", { name: "取消收藏" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "取消收藏" })).toBeVisible();

  const note = page.getByRole("textbox", { name: "我的笔记" });
  await note.fill("端侧能力最终要回到续航和佩戴体验。 ");
  await page.getByRole("heading", { name: "为什么值得读" }).click();
  await expect(page.getByText("已保存", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("textbox", { name: "我的笔记" })).toHaveValue("端侧能力最终要回到续航和佩戴体验。 ");

  await page.goto("/settings");
  await expect(page.getByRole("link", { name: /Android XR 把 AI 眼镜正式拆成音频与显示两条产品路线/ })).toBeVisible();
  await page.getByRole("link", { name: /Android XR 把 AI 眼镜正式拆成音频与显示两条产品路线/ }).click();
  await page.getByRole("link", { name: /先分清三种产品形态/ }).click();
  await expect(page).toHaveURL(/learning#stage-1-form-factors/);
  await expect(page.locator("#stage-1-form-factors")).toBeVisible();
});

test("学习进度、搜索锚点和设置数据管理均使用真实状态", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-1440", "核心交互在桌面 Chromium 验收一次");

  await page.goto("/learning");
  await page.getByRole("button", { name: "完成 先分清三种产品形态" }).click();
  await expect(page.getByText("1/12")).toBeVisible();
  await page.reload();
  await expect(page.getByText("1/12")).toBeVisible();

  await page.goto("/search");
  await page.getByPlaceholder("输入产品、技术或项目名称").fill("Glimmer");
  await page.getByRole("link", { name: /Jetpack Compose Glimmer/ }).click();
  await expect(page).toHaveURL(/radar#signal-glimmer/);
  await expect(page.locator("#signal-glimmer")).toBeVisible();

  await page.goto("/settings");
  await expect(page.getByText("运行正常")).toBeVisible();
  await expect(page.getByText("1 个进度")).toBeVisible();
  const validBackup = {
    version: 1,
    exportedAt: "2026-08-03T00:00:00Z",
    progress: [{ nodeId: "stage-2-journey", percent: 100, updatedAt: "2026-08-03T00:00:00Z" }],
    saved: [],
    notes: []
  };
  await page.locator('input[type="file"]').setInputFiles({ name: "backup.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(validBackup)) });
  await expect(page.getByText("学习数据已导入")).toBeVisible();
  await expect(page.getByText("2 个进度")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出" }).click();
  expect((await downloadPromise).suggestedFilename()).toMatch(/^jingjian-learning-\d{4}-\d{2}-\d{2}\.json$/);

  await page.getByRole("button", { name: "清空" }).click();
  await page.getByRole("button", { name: "确认清空" }).click();
  await expect(page.getByText("本地学习数据已清空")).toBeVisible();
  await expect(page.getByText("0 个进度")).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({ name: "broken.json", mimeType: "application/json", buffer: Buffer.from('{"version":1}') });
  await expect(page.getByText("学习数据文件格式不正确")).toBeVisible();
});

test("手机侧栏和底部 Dock 均能导航", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-390", "手机导航只在移动视口验收");
  await page.goto("/");
  await page.getByRole("button", { name: "打开菜单" }).click();
  await expect(page.locator(".sidebar")).toHaveClass(/is-open/);
  await page.locator(".sidebar").getByRole("link", { name: "产品" }).click();
  await expect(page).toHaveURL(/\/products$/);
  await page.locator(".mobile-dock").getByRole("link", { name: "每周复盘" }).click();
  await expect(page).toHaveURL(/\/weekly$/);
});
