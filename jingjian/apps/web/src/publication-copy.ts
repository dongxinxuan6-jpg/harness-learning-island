import type { DailyPayload } from "./data/types";

export function getPublicationCopy(status: DailyPayload["status"]): { heading: string; status: string; ranking: string } {
  if (status === "published") return { heading: "今天，先看清三个变化", status: "已发布", ranking: "今日价值榜" };
  if (status === "stale") return { heading: "最近一期，先看清三个变化", status: "最近一期", ranking: "最近一期价值榜" };
  return { heading: "本期更新中，先看清三个变化", status: "更新中", ranking: "本期价值榜" };
}
