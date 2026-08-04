export type BudgetMode = "normal" | "conserve" | "essential" | "defer";

export type BudgetPolicy = {
  mode: BudgetMode;
  allowIngestion: true;
  allowBulkAi: boolean;
  allowEditorialAi: boolean;
};

export function getBudgetPolicy(spentCny: number): BudgetPolicy {
  if (spentCny >= 200) {
    return { mode: "defer", allowIngestion: true, allowBulkAi: false, allowEditorialAi: false };
  }
  if (spentCny >= 170) {
    return { mode: "essential", allowIngestion: true, allowBulkAi: false, allowEditorialAi: true };
  }
  if (spentCny >= 120) {
    return { mode: "conserve", allowIngestion: true, allowBulkAi: true, allowEditorialAi: true };
  }
  return { mode: "normal", allowIngestion: true, allowBulkAi: true, allowEditorialAi: true };
}
