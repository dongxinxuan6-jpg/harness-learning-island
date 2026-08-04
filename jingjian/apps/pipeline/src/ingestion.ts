import { randomUUID } from "node:crypto";
import { groupDuplicateDocuments } from "@jingjian/domain";
import { RawCandidateSchema, type Connector, type RawCandidate } from "./types";

export type IngestionResult = {
  id: string;
  startedAt: string;
  completedAt: string;
  status: "succeeded" | "partial" | "failed";
  candidates: RawCandidate[];
  failedSources: string[];
};

export async function runIngestion(connectors: Connector[], now = new Date()): Promise<IngestionResult> {
  const results = await Promise.allSettled(connectors.map((connector) => connector.collect()));
  const failedSources: string[] = [];
  const collected: RawCandidate[] = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      collected.push(...result.value.flatMap((candidate) => {
        const parsed = RawCandidateSchema.safeParse(candidate);
        return parsed.success ? [parsed.data] : [];
      }));
    }
    else failedSources.push(connectors[index].id);
  });

  const tierPriority = { official: 4, research: 3, media: 2, community: 1 } as const;
  const candidates = groupDuplicateDocuments(collected).map((group) => {
    const primary = [...group].sort((left, right) => tierPriority[right.sourceTier] - tierPriority[left.sourceTier])[0];
    return {
      ...primary,
      observations: group.map(({ sourceId, sourceName, sourceTier, language, url, publishedAt }) => ({
        sourceId,
        sourceName,
        sourceTier,
        language,
        url,
        publishedAt
      }))
    };
  });
  const status = failedSources.length === 0 ? "succeeded" : candidates.length > 0 ? "partial" : "failed";
  return {
    id: randomUUID(),
    startedAt: now.toISOString(),
    completedAt: new Date().toISOString(),
    status,
    candidates,
    failedSources
  };
}
