export type ModelName = "gpt-5.6-luna" | "gpt-5.6-terra";

const PRICES: Record<ModelName, { input: number; cached: number; output: number }> = {
  "gpt-5.6-luna": { input: 1, cached: 0.1, output: 6 },
  "gpt-5.6-terra": { input: 2.5, cached: 0.25, output: 15 }
};

export function calculateAiCost(input: {
  model: string;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  cnyPerUsd: number;
}): { usd: number; cny: number } {
  const price = PRICES[input.model as ModelName] ?? PRICES["gpt-5.6-terra"];
  const inputTokens = finiteNonNegative(input.inputTokens);
  const outputTokens = finiteNonNegative(input.outputTokens);
  const cachedInputTokens = Math.min(finiteNonNegative(input.cachedInputTokens), inputTokens);
  const uncachedInputTokens = inputTokens - cachedInputTokens;
  const usd = uncachedInputTokens / 1_000_000 * price.input +
    cachedInputTokens / 1_000_000 * price.cached +
    outputTokens / 1_000_000 * price.output;
  const cnyPerUsd = finiteNonNegative(input.cnyPerUsd);
  return { usd: round(usd), cny: round(usd * cnyPerUsd) };
}

const finiteNonNegative = (value: number): number => Number.isFinite(value) ? Math.max(0, value) : 0;
const round = (value: number) => Math.round(value * 10000) / 10000;
