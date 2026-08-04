import { getIndependentSourceKey, type ContentItem, type Product } from "@jingjian/domain";

export type RunQuality = {
  sourceSuccessRate: number;
  evidenceCompleteness: number;
  productCoverage: number;
  publishedItems: number;
  readMinutes: number;
};

export function calculateRunQuality(input: {
  totalSources: number;
  failedSources: number;
  contents: ContentItem[];
  products: Product[];
  publishedItems: number;
  readMinutes: number;
}): RunQuality {
  const successfulSources = Math.max(0, input.totalSources - input.failedSources);
  const sourceSuccessRate = percentage(successfulSources, input.totalSources);
  const completeEvidence = input.contents.filter((item) => {
    if (item.sources.length === 0 || item.sources.some((source) => !source.url)) return false;
    const independentDomains = new Set(item.sources.map((source) => getIndependentSourceKey(source.url))).size;
    return independentDomains === item.score.independentSources;
  }).length;
  const evidenceCompleteness = percentage(completeEvidence, input.contents.length);
  const productCoverage = percentage(input.products.filter((product) => product.sources.length > 0).length, input.products.length);

  return {
    sourceSuccessRate,
    evidenceCompleteness,
    productCoverage,
    publishedItems: input.publishedItems,
    readMinutes: input.readMinutes
  };
}

const percentage = (value: number, total: number): number => total > 0 ? Math.round(value / total * 100) : 0;
