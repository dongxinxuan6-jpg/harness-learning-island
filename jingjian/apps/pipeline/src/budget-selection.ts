import type { BudgetMode } from "@jingjian/domain";
import type { RawCandidate } from "./types";

export const AI_HARD_LIMIT_CNY = 200;

export function selectAiCandidates(candidates: RawCandidate[], mode: BudgetMode): RawCandidate[] {
  if (mode === "defer") return [];
  if (mode === "essential") {
    return candidates.filter((item) => item.sourceTier === "official" || item.sourceTier === "research").slice(0, 5);
  }
  if (mode === "conserve") {
    return candidates.filter((item) => item.sourceTier !== "community").slice(0, 12);
  }
  return candidates.slice(0, 30);
}

export function canStartAiCall(spentCny: number, purpose: "bulk" | "editorial"): boolean {
  const reserveCny = purpose === "editorial" ? 5 : 1;
  return Number.isFinite(spentCny) && spentCny <= AI_HARD_LIMIT_CNY - reserveCny;
}

export async function processBudgetedCandidates<TCandidate, TResult>(
  candidates: TCandidate[],
  startingSpentCny: number,
  getCurrentRunCostCny: () => number,
  process: (candidate: TCandidate, spentCny: number) => Promise<TResult>
): Promise<{
  fulfilled: Array<{ candidate: TCandidate; result: TResult }>;
  failed: Array<{ candidate: TCandidate; error: unknown }>;
  queued: TCandidate[];
  spentCny: number;
}> {
  const fulfilled: Array<{ candidate: TCandidate; result: TResult }> = [];
  const failed: Array<{ candidate: TCandidate; error: unknown }> = [];
  for (const [index, candidate] of candidates.entries()) {
    const spentCny = roundCny(startingSpentCny + getCurrentRunCostCny());
    if (!canStartAiCall(spentCny, "bulk")) {
      return { fulfilled, failed, queued: candidates.slice(index), spentCny };
    }
    try {
      fulfilled.push({ candidate, result: await process(candidate, spentCny) });
    } catch (error) {
      failed.push({ candidate, error });
    }
  }
  return { fulfilled, failed, queued: [], spentCny: roundCny(startingSpentCny + getCurrentRunCostCny()) };
}

const roundCny = (value: number): number => Math.round(value * 10000) / 10000;
