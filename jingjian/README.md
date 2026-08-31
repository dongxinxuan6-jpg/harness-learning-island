# 镜见｜AI眼镜产品与技术

面向中文初学者的 AI 眼镜产品学习 PWA。应用以产品问题为入口，把每日情报、双榜单、产品档案、开源项目、技术雷达、学习路线和每周复盘组织在同一套信息架构中。

在线体验：[lensforward.pages.dev](https://lensforward.pages.dev)

## 工程结构

```text
jingjian/
  apps/web/          React + Vite PWA，读取版本化 JSON 快照
  apps/pipeline/     采集、去重、AI 结构化、评分与快照生成
  packages/domain/  Zod 数据契约、双榜评分、预算守卫、URL 去重
  infra/d1/          Cloudflare D1 初始迁移
  e2e/               Playwright 多视口和离线验收
```

Web 与采集流程解耦。发布异常时，PWA 的 Cache Storage 与 IndexedDB 会继续提供最近一期内容和本地学习状态。
数据快照使用网络优先、3 秒超时的运行时缓存；可变 JSON 不进入构建期预缓存，避免发布后首屏仍读取上一版数据。

## 本地运行

要求 Node.js 22+。

```bash
npm install
npm run generate
npm run dev
```

开发地址默认为 `http://localhost:5173/`。生产预览：

```bash
npm run build
npm run preview -w @jingjian/web
```

## 验证

```bash
npm test
npm run build
npm run test:e2e
```

单元测试覆盖 URL 规范化、传递性去重、来源独立性、双榜评分、产品状态、预算守卫、连接器、AI 成本、D1 请求、GitHub 映射、快照契约和本地状态导入导出。Playwright 覆盖 1440、1024、390 三个视口及 PWA 离线回退。

当前固定使用 React Router `7.18.2`。npm 审计中的 RSC Action 公告只影响本项目未启用的 unstable RSC 服务端 API；本应用使用 `BrowserRouter` 客户端静态路由。npm 发布覆盖该公告且不重新引入客户端导航公告的版本后再升级。

## 数据管线

`npm run pipeline` 依次执行：

1. 读取内置基线资料、默认官方/行业 RSS、arXiv 和 GitHub 增量。
2. 规范化 URL，按 URL 与内容指纹完成传递性去重，并保留每个来源观察。
3. 根据月度预算模式筛选候选，调用 Responses API 输出结构化 JSON。
4. 按关键标签与标题实体做保守主题聚类，使用近 24 小时观察、独立域名、来源层级和时间衰减计算热议分。
5. 写入 `apps/web/public/data/`，可选同步运行与成本记录到 D1。

静态接口包括：

- `/data/latest/daily.json`
- `/data/rankings/value.json` 与 `/data/rankings/heat.json`
- `/data/products/index.json` 与 `/data/products/:slug.json`
- `/data/projects/index.json` 与 `/data/projects/:slug.json`
- `/data/radar/latest.json`
- `/data/learning/route.json`
- `/data/weekly/:week.json`
- `/data/search-index.json`

## 环境变量

从 `.env.example` 配置本地环境，CI 中使用同名 GitHub Secrets 或 Variables。

| 变量 | 用途 |
| --- | --- |
| `OPENAI_API_KEY` | Responses API 结构化与摘要 |
| `OPENAI_BASE_URL` | OpenAI 兼容代理地址；填写站点根地址时自动补 `/v1` |
| `ALLOW_STATELESS_AI` | 仅用于一次性本地试跑；设为 `true` 后允许无 D1 调用 AI |
| `GITHUB_TOKEN` | GitHub 仓库快照，减少匿名限流 |
| `RSS_SOURCES_JSON` | 追加或按同名 `id` 覆盖默认 RSS 来源，格式见 `.env.example` |
| `AI_SPENT_CNY` | 当月已使用 AI 费用 |
| `CNY_PER_USD` | 美元到人民币成本换算 |
| `CLOUDFLARE_ACCOUNT_ID` | D1 与 Pages 账户 |
| `CLOUDFLARE_API_TOKEN` | D1 与 Pages API 凭证 |
| `D1_DATABASE_ID` | D1 数据库 ID |
| `CF_PAGES_PROJECT` | Pages 项目名 |
| `PUBLIC_SITE_URL` | 09:47 健康检查使用的 Pages 线上地址 |

## 预算策略

月度硬额度为 200 元，常态目标 50-100 元：

- 0-119 元：正常处理 Luna 候选，Terra 仅做终审与复杂综合。
- 120-169 元：加强缓存并过滤低相关候选。
- 170-199 元：只处理高价值新增、晨报和周报。
- 200 元起：继续规则采集并保存候选，AI 任务进入下月队列。

每次调用记录模型、输入/输出 token、缓存 token、人民币估算和内容用途。

定时发布默认只在 D1 状态可读时启用 AI，以保证历史判重和月度累计有效。D1 缺失或读取降级时继续采集并保留现有快照；一次性本地验证可显式设置 `ALLOW_STATELESS_AI=true`。

默认 RSS 覆盖 Meta Product News、Android Developers、Google Product News 和 UploadVR。广域来源先经过 AI 眼镜产品、品牌与技术关键词初筛，再进入月度预算选择，避免把无关产品新闻送入模型。

## 自动发布

仓库工作流 `.github/workflows/jingjian-publish.yml` 采用 UTC 调度，对应北京时间：

- 09:17 主流程
- 09:47 发布检查
- 每四小时热议信号刷新

主流程执行生成、测试、构建，并在 Cloudflare 配置完整时部署 `apps/web/dist`。09:47 任务读取 `PUBLIC_SITE_URL/data/latest/daily.json` 验证日期、状态、条数、阅读时长和证据完整性。周一运行会同时更新当周复盘快照。

首次部署前按编号执行 `infra/d1/migrations/0001_initial.sql` 与 `infra/d1/migrations/0002_product_candidates.sql`，再在 GitHub 配置上述 Secrets 与 Variables。

## 运行可靠性

- `npm run hydrate` 会在流水线执行前从 `PUBLIC_SITE_URL` 回填当前线上晨报、价值榜、产品、候选审计、产品封面、项目、雷达、学习路线与周报，避免全新 CI 工作目录覆盖已发布内容。
- 回填同时读取热议榜，四小时刷新产生的新条目会进入下一轮基线；缺失的产品、项目或周报详情会从完整索引重新生成。
- 每日流程从上一期价值榜继续累积内容；相同 slug 的新结构化结果会替换旧版本。
- 四小时热议流程只发布热议榜、搜索索引和系统状态，晨报与其他档案保持当前线上版本。
- D1 的 `ai_usage` 月度合计是额度判断主数据，`AI_SPENT_CNY` 作为更保守的人工下限；已生成的内容不会重复调用 AI。
- 历史判重同时检查候选 ID、规范 URL 与内容指纹；补算队列保存完整候选，并在成功、低相关或失败状态之间正确流转。
- 每次模型调用前预留费用，失败响应产生的 token 也会进入本轮累计；达到调用预留线后的候选进入补算队列。
- 晨报选择器同时限制 10 条和 15 分钟，日期按北京时间生成。
- 本轮没有新增结构化内容时，晨报明确标记为“最近一期”，健康检查继续报告发布异常，页面保留可读内容。
- 系统状态记录来源成功率、证据完整率、主流产品覆盖率、发布条数和阅读时长，设置页可直接查看。
- RSS 配置逐项校验，异常条目不会阻断其余来源；未知模型按最高已知价格估算，汇率异常时使用保守默认值。
- 每日 AI 结构化会同时识别具体产品。官方来源中的新品先从原页面提取 Open Graph、Twitter Card、JSON-LD 封面，图片通过尺寸、比例、格式与体积门禁后转为本地 `1200×720 WebP` 再发布；媒体与社区发现进入待核验记录。
- 产品候选审计发布在 `/data/products/candidates.json`，D1 同步保存发布、更新和待核验状态；同名档案更新会保留既有产品 ID、官网与人工封面。
