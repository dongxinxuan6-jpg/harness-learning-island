import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { getBudgetPolicy, type ContentItem, type Product } from "@jingjian/domain";
import { createAiEnricher, createEditorialPlanner, createOpenAIResponder, EDITORIAL_RESPONSE_FORMAT } from "./ai";
import { loadSnapshotBaseline, mergeContentBySlug } from "./baseline";
import { canStartAiCall, processBudgetedCandidates, selectAiCandidates } from "./budget-selection";
import { calculateAiCost, type ModelName } from "./cost";
import { createArxivConnector, createRssConnector, hydrateCandidateFromPage } from "./connectors";
import { clusterEnrichedCandidates } from "./content-clusters";
import { toContentItem } from "./content-item";
import { D1RestClient } from "./d1";
import { refreshGitHubProjects } from "./github";
import { collectPublishedSnapshots, hydratePublishedProductAssets } from "./hydration";
import { runIngestion } from "./ingestion";
import { getBeijingDate, getDailyPublicationStatus, shouldPublishContentSnapshots, validateDailyPublication, type DailyPublication } from "./publication";
import { isLikelyAiGlassesContent } from "./relevance";
import { loadPipelineState } from "./pipeline-state";
import { calculateRunQuality } from "./quality";
import { canEnableAiRuntime, mergeFeedConfigs, parseFeedConfig, parsePositiveNumber } from "./runtime-config";
import { seedDataset } from "./seed-data";
import { createSnapshotFiles, writeSnapshotFiles, type SnapshotDataset } from "./snapshots";
import { persistSourceDocument } from "./source-persistence";
import { buildCurrentWeekly, isBeijingMonday } from "./weekly";
import {
  discoverProductCandidates,
  mergeProductDiscoveryRecords,
  updateProductCoverSourceManifest,
  type ProductDiscoveryInput,
  type ProductDiscoveryRecord
} from "./product-discovery";

loadLocalEnvironment();

const publicRoot = fileURLToPath(new URL("../../web/public/", import.meta.url));
const command = process.argv[2] ?? "seed";

async function generateSeed() {
  await writeSnapshotFiles(publicRoot, createSnapshotFiles(seedDataset));
  console.log(`Generated ${Object.keys(createSnapshotFiles(seedDataset)).length} seed snapshots in ${publicRoot}`);
}

async function hydratePublished() {
  const site = process.env.PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!site) {
    if (process.env.REQUIRE_PUBLISHED_SNAPSHOTS === "true") throw new Error("PUBLIC_SITE_URL is required for this snapshot refresh");
    console.log("Published snapshot hydration skipped because PUBLIC_SITE_URL is empty");
    return;
  }
  const files = await collectPublishedSnapshots(site);
  await writeSnapshotFiles(publicRoot, files);
  const products = (files["data/products/index.json"] as { items: Product[] }).items;
  const restoredCovers = await hydratePublishedProductAssets(site, publicRoot, products);
  console.log(`Hydrated ${Object.keys(files).length} snapshots and ${restoredCovers} product covers from ${site}`);
}

async function runLive() {
  const now = new Date();
  const baseline = await loadSnapshotBaseline(publicRoot, seedDataset);
  const pipelineKind = process.env.PIPELINE_KIND ?? "daily";
  const configuredSpentCny = Number(process.env.AI_SPENT_CNY ?? 0);
  const cnyPerUsd = parsePositiveNumber(process.env.CNY_PER_USD, 7.2);
  const connectors = [createArxivConnector()];
  const configuredFeeds = mergeFeedConfigs(parseFeedConfig(process.env.RSS_SOURCES_JSON));
  connectors.push(...configuredFeeds.map((feed) => createRssConnector(feed.url, feed)));
  const ingestion = await runIngestion(connectors, now);
  const relevantCandidates = ingestion.candidates.filter(isLikelyAiGlassesContent);
  const d1 = createD1ClientFromEnvironment();
  const pipelineState = await loadPipelineState(d1, relevantCandidates, now, configuredSpentCny);
  const aiRuntimeConfigured = canEnableAiRuntime(process.env.OPENAI_API_KEY, Boolean(d1), process.env.ALLOW_STATELESS_AI === "true");
  const canRunAi = aiRuntimeConfigured && pipelineState.persistence !== "degraded";
  if (process.env.OPENAI_API_KEY && !canRunAi) console.warn("AI processing paused because persistent budget and deduplication state is unavailable");
  let runningSpentCny = pipelineState.spentCny;
  const initialPolicy = getBudgetPolicy(runningSpentCny);

  const usage: Array<{ model: string; purpose: string; inputTokens: number; cachedInputTokens: number; outputTokens: number; usd: number; cny: number }> = [];
  let newContents: ContentItem[] = [];
  const discoveredProductInputs: ProductDiscoveryInput[] = [];
  const queuedCandidateIds = new Set<string>(pipelineState.queuedCandidateIds);
  const completedCandidateIds = new Set<string>();
  if (initialPolicy.mode === "defer") pipelineState.candidates.forEach((candidate) => queuedCandidateIds.add(candidate.id));
  const selectedCandidates = selectAiCandidates(pipelineState.candidates, initialPolicy.mode).slice(0, pipelineKind === "heat" ? 8 : 30);
  if (canRunAi && process.env.OPENAI_API_KEY && selectedCandidates.length > 0) {
    const hydratedCandidates = await hydrateCandidates(selectedCandidates);
    const responder = createOpenAIResponder({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
      model: process.env.OPENAI_BULK_MODEL ?? "gpt-5.6-luna",
      maxOutputTokens: 2000,
      onUsage: (item) => {
        const cost = calculateAiCost({ ...item, model: item.model as ModelName, cnyPerUsd });
        usage.push({ ...item, purpose: "content-enrichment", ...cost });
      }
    });
    const enrich = createAiEnricher(responder);
    const run = await processBudgetedCandidates(
      hydratedCandidates,
      pipelineState.spentCny,
      () => usage.reduce((sum, item) => sum + item.cny, 0),
      (candidate, spentCny) => enrich(candidate, getBudgetPolicy(spentCny).mode)
    );
    runningSpentCny = run.spentCny;
    run.queued.forEach((candidate) => queuedCandidateIds.add(candidate.id));
    run.failed.forEach(({ candidate, error }) => {
      queuedCandidateIds.add(candidate.id);
      console.warn(`Content enrichment failed for ${candidate.id}: ${error instanceof Error ? error.message : String(error)}`);
    });
    run.fulfilled.forEach(({ candidate, result }) => {
      queuedCandidateIds.delete(candidate.id);
      completedCandidateIds.add(candidate.id);
      if (result.status === "enriched" && result.productRelevance >= 0.7 && result.productCandidate) {
        discoveredProductInputs.push({ source: candidate, product: result.productCandidate });
      }
    });
    const enrichedCandidates = run.fulfilled.flatMap(({ candidate, result }) => result.status === "enriched" && result.productRelevance >= 0.7
      ? [{ candidate, enrichment: result }]
      : []);
    newContents = clusterEnrichedCandidates(enrichedCandidates).map(({ candidate, enrichment }) => toContentItem(candidate, enrichment, now));
  } else if (d1 && !canRunAi) {
    pipelineState.candidates.forEach((candidate) => queuedCandidateIds.add(candidate.id));
  }
  if (d1 && pipelineState.persistence === "degraded") relevantCandidates.forEach((candidate) => queuedCandidateIds.add(candidate.id));

  const projects = await refreshGitHubProjects(baseline.projects, process.env.GITHUB_TOKEN);
  const productDiscovery = pipelineKind === "daily"
    ? await discoverProductCandidates({
        existingProducts: baseline.products,
        candidates: discoveredProductInputs,
        generatedAt: now.toISOString(),
        publicRoot
      })
    : { products: baseline.products, records: [] as ProductDiscoveryRecord[], coverSources: [] };
  await updateProductCoverSourceManifest(publicRoot, productDiscovery.coverSources);
  const productCandidates = mergeProductDiscoveryRecords(baseline.productCandidates ?? [], productDiscovery.records);
  const contents = mergeContentBySlug(baseline.contents, newContents);
  let weekly = buildCurrentWeekly(baseline.weekly[0] ?? seedDataset.weekly[0], now, contents, baseline.signals);
  let leadSlug: string | undefined;
  const editorialPolicy = getBudgetPolicy(runningSpentCny);
  if (canRunAi && process.env.OPENAI_API_KEY && editorialPolicy.allowEditorialAi && pipelineKind === "daily" && canStartAiCall(runningSpentCny, "editorial")) {
    const includeWeekly = isBeijingMonday(now);
    const editorialResponder = createOpenAIResponder({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
      model: process.env.OPENAI_EDITOR_MODEL ?? "gpt-5.6-terra",
      responseFormat: EDITORIAL_RESPONSE_FORMAT,
      maxOutputTokens: 1800,
      onUsage: (item) => {
        const cost = calculateAiCost({ ...item, model: item.model as ModelName, cnyPerUsd });
        usage.push({ ...item, purpose: includeWeekly ? "daily-review-and-weekly" : "daily-final-review", ...cost });
      }
    });
    try {
      const plan = await createEditorialPlanner(editorialResponder)(contents.slice(0, 10).map((item) => ({ slug: item.slug, title: item.title, summary: item.summary, value: item.score.value, heat: item.score.heat })), includeWeekly);
      if (contents.some((item) => item.slug === plan.leadSlug)) leadSlug = plan.leadSlug;
      if (includeWeekly && plan.weekly) weekly = { ...weekly, ...plan.weekly, editorial: true };
      runningSpentCny = pipelineState.spentCny + usage.reduce((sum, item) => sum + item.cny, 0);
    } catch (error) {
      console.warn(`Editorial review degraded: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  const dataset = {
    ...baseline,
    generatedAt: now.toISOString(),
    contents,
    products: productDiscovery.products,
    productCandidates,
    projects,
    leadSlug,
    weekly: [weekly]
  };
  const freshVerifiedIds = newContents.filter((item) => item.score.verification === "verified").map((item) => item.id);
  const files = shouldPublishContentSnapshots(ingestion.status) ? createSnapshotFiles(dataset, {
    kind: pipelineKind === "heat" ? "heat" : "daily",
    dailyStatus: getDailyPublicationStatus(freshVerifiedIds.length),
    freshContentIds: freshVerifiedIds
  }) : {};
  const d1Status = await persistRunIfConfigured(d1, ingestion, dataset, usage, newContents.length, queuedCandidateIds, completedCandidateIds, productDiscovery.records);
  const persistence = pipelineState.persistence === "degraded" ? "degraded" : d1Status;
  const finalSpentCny = roundCny(pipelineState.spentCny + usage.reduce((sum, item) => sum + item.cny, 0));
  const finalPolicy = getBudgetPolicy(finalSpentCny);
  const dailySnapshot = files["data/latest/daily.json"] as { status: DailyPublication["status"]; items: ContentItem[]; totalReadMinutes: number } | undefined;
  const qualityContents = dailySnapshot?.items ?? newContents;
  const freshDaily = dailySnapshot?.status === "published";
  const quality = calculateRunQuality({
    totalSources: connectors.length,
    failedSources: ingestion.failedSources.length,
    contents: qualityContents,
    products: dataset.products,
    publishedItems: dailySnapshot ? (freshDaily ? dailySnapshot.items.length : 0) : newContents.length,
    readMinutes: dailySnapshot ? (freshDaily ? dailySnapshot.totalReadMinutes : 0) : newContents.reduce((sum, item) => sum + item.readMinutes, 0)
  });
  files["data/system/status.json"] = {
    generatedAt: now.toISOString(),
    ingestion: { status: ingestion.status, discovered: ingestion.candidates.length, failedSources: ingestion.failedSources },
    budget: { spentCny: finalSpentCny, hardLimitCny: 200, mode: finalPolicy.mode, queuedForNextMonth: queuedCandidateIds.size },
    productDiscovery: {
      discovered: productDiscovery.records.length,
      published: productDiscovery.records.filter((item) => item.status === "published").length,
      updated: productDiscovery.records.filter((item) => item.status === "updated").length,
      pending: productDiscovery.records.filter((item) => item.status === "pending").length
    },
    persistence,
    quality,
    usage
  };
  await writeSnapshotFiles(publicRoot, files);
  console.log(JSON.stringify({ status: ingestion.status, published: newContents.length, products: files["data/products/index.json"] ? productDiscovery.records.length : 0, failedSources: ingestion.failedSources, budgetMode: finalPolicy.mode, spentCny: finalSpentCny, queued: queuedCandidateIds.size }));
}

async function checkPublication() {
  const site = process.env.PUBLIC_SITE_URL?.replace(/\/$/, "");
  const daily = site
    ? await fetch(`${site}/data/latest/daily.json`, { headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(15_000) }).then(async (response) => {
        if (!response.ok) throw new Error(`publication endpoint returned ${response.status}`);
        return response.json() as Promise<DailyPublication>;
      })
    : JSON.parse(await readFile(fileURLToPath(new URL("../../web/public/data/latest/daily.json", import.meta.url)), "utf8")) as DailyPublication;
  const expectedDate = process.env.EXPECTED_DATE ?? getBeijingDate(new Date());
  const errors = validateDailyPublication(daily, expectedDate);
  if (errors.length > 0) throw new Error(`Publication check failed: ${errors.join("; ")}`);
  console.log(JSON.stringify({ status: "healthy", date: daily.date, published: daily.items.length, readMinutes: daily.totalReadMinutes }));
}

function createD1ClientFromEnvironment(): D1RestClient | undefined {
  const { CLOUDFLARE_ACCOUNT_ID: accountId, D1_DATABASE_ID: databaseId, CLOUDFLARE_API_TOKEN: apiToken } = process.env;
  return accountId && databaseId && apiToken ? new D1RestClient({ accountId, databaseId, apiToken }) : undefined;
}

const roundCny = (value: number): number => Math.round(value * 10000) / 10000;

function loadLocalEnvironment(): void {
  try {
    process.loadEnvFile(fileURLToPath(new URL("../../../.env", import.meta.url)));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

async function hydrateCandidates<T extends Parameters<typeof hydrateCandidateFromPage>[0]>(candidates: T[]): Promise<T[]> {
  const hydrated: T[] = [];
  for (let index = 0; index < candidates.length; index += 6) {
    const chunk = candidates.slice(index, index + 6);
    hydrated.push(...await Promise.all(chunk.map((candidate) => hydrateCandidateFromPage(candidate) as Promise<T>)));
  }
  return hydrated;
}

async function persistRunIfConfigured(
  d1: D1RestClient | undefined,
  ingestion: Awaited<ReturnType<typeof runIngestion>>,
  dataset: SnapshotDataset,
  usage: Array<{ model: string; purpose: string; inputTokens: number; cachedInputTokens: number; outputTokens: number; usd: number; cny: number }>,
  published: number,
  queuedCandidateIds: Set<string>,
  completedCandidateIds: Set<string>,
  productDiscoveryRecords: ProductDiscoveryRecord[]
): Promise<"not-configured" | "succeeded" | "degraded"> {
  if (!d1) return "not-configured";
  try {
    await d1.query("INSERT OR REPLACE INTO ingest_runs (id, started_at, completed_at, status, discovered, published, failed_sources) VALUES (?, ?, ?, ?, ?, ?, ?)", [ingestion.id, ingestion.startedAt, ingestion.completedAt, ingestion.status, ingestion.candidates.length, published, JSON.stringify(ingestion.failedSources)]);
    for (const item of ingestion.candidates) {
      await persistSourceDocument(d1, item, ingestion.completedAt, queuedCandidateIds.has(item.id));
    }
    for (const item of dataset.contents) {
      await d1.query("INSERT OR REPLACE INTO content_items (id, slug, title, summary, published_at, payload, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)", [item.id, item.slug, item.title, item.summary, item.publishedAt, JSON.stringify(item), dataset.generatedAt]);
    }
    for (const product of dataset.products) {
      await d1.query("INSERT OR REPLACE INTO products (id, slug, brand, name, form_factor, status, payload, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [product.id, product.slug, product.brand, product.name, product.form, product.status, JSON.stringify(product), dataset.generatedAt]);
    }
    for (const project of dataset.projects) {
      await d1.query("INSERT OR REPLACE INTO repo_snapshots (id, repository_url, captured_at, payload) VALUES (?, ?, ?, ?)", [`${project.id}:${dataset.generatedAt}`, project.repositoryUrl, dataset.generatedAt, JSON.stringify(project)]);
    }
    for (const item of usage) {
      await d1.query("INSERT INTO ai_usage (recorded_at, model, purpose, input_tokens, cached_input_tokens, output_tokens, cost_usd, cost_cny) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [dataset.generatedAt, item.model, item.purpose, item.inputTokens, item.cachedInputTokens, item.outputTokens, item.usd, item.cny]);
    }
    for (const id of completedCandidateIds) {
      await d1.query("UPDATE ai_queue SET status = 'completed', processed_at = ? WHERE source_document_id = ? AND status = 'queued'", [dataset.generatedAt, id]);
    }
    for (const record of productDiscoveryRecords) {
      try {
        await d1.query("INSERT OR REPLACE INTO product_candidates (id, source_document_id, brand, name, status, reason, product_slug, source_url, payload, discovered_at, processed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
          record.id,
          record.sourceDocumentId,
          record.brand,
          record.name,
          record.status,
          record.reason ?? null,
          record.productSlug ?? null,
          record.sourceUrl,
          JSON.stringify(record.candidate),
          record.discoveredAt,
          record.status === "pending" ? null : dataset.generatedAt
        ]);
      } catch (error) {
        console.warn(`Product candidate persistence skipped: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    return "succeeded";
  } catch (error) {
    console.warn(`D1 persistence degraded: ${error instanceof Error ? error.message : String(error)}`);
    return "degraded";
  }
}

if (command === "run") await runLive();
else if (command === "hydrate") await hydratePublished();
else if (command === "check") await checkPublication();
else await generateSeed();
