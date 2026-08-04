import OpenAI from "openai";
import { z } from "zod";
import type { BudgetMode } from "@jingjian/domain";
import { ProductCandidateSchema } from "./product-discovery";

const EnrichmentSchema = z.object({
  productRelevance: z.number().min(0).max(1),
  summary: z.string().min(1),
  whyItMatters: z.string().min(1),
  beginnerNote: z.string().min(1),
  productImpact: z.string().min(1),
  tags: z.array(z.string()).max(8),
  productCandidate: ProductCandidateSchema.nullable()
});

export const ENRICHMENT_RESPONSE_FORMAT = {
  name: "ai_glasses_content_enrichment",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["productRelevance", "summary", "whyItMatters", "beginnerNote", "productImpact", "tags", "productCandidate"],
    properties: {
      productRelevance: { type: "number", minimum: 0, maximum: 1 },
      summary: { type: "string" },
      whyItMatters: { type: "string" },
      beginnerNote: { type: "string" },
      productImpact: { type: "string" },
      tags: { type: "array", items: { type: "string" }, maxItems: 8 },
      productCandidate: {
        anyOf: [
          { type: "null" },
          {
            type: "object",
            additionalProperties: false,
            required: ["brand", "name", "form", "status", "positioning", "audience", "scenarios", "capabilities", "specs", "architecture", "tradeoffs"],
            properties: {
              brand: { type: "string" },
              name: { type: "string" },
              form: { type: "string", enum: ["audio", "display", "spatial"] },
              status: { type: "string", enum: ["shipping", "announced", "developer-kit", "discontinued"] },
              positioning: { type: "string" },
              audience: { type: "string" },
              scenarios: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 8 },
              capabilities: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 10 },
              specs: {
                type: "array",
                maxItems: 12,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["label", "value"],
                  properties: { label: { type: "string" }, value: { type: "string" } }
                }
              },
              architecture: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 8 },
              tradeoffs: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 8 }
            }
          }
        ]
      }
    }
  }
};

const EditorialPlanSchema = z.object({
  leadSlug: z.string(),
  weekly: z.object({
    title: z.string(),
    thesis: z.string(),
    sections: z.array(z.object({ title: z.string(), body: z.string() })).length(3)
  }).nullable()
});

export type Enrichment = z.infer<typeof EnrichmentSchema>;
export type AiResponder = (prompt: string) => Promise<string>;
export type EditorialPlan = z.infer<typeof EditorialPlanSchema>;

export const EDITORIAL_RESPONSE_FORMAT = {
  name: "ai_glasses_editorial_plan",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["leadSlug", "weekly"],
    properties: {
      leadSlug: { type: "string" },
      weekly: {
        anyOf: [{ type: "null" }, {
          type: "object",
          additionalProperties: false,
          required: ["title", "thesis", "sections"],
          properties: {
            title: { type: "string" },
            thesis: { type: "string" },
            sections: {
              type: "array",
              minItems: 3,
              maxItems: 3,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["title", "body"],
                properties: { title: { type: "string" }, body: { type: "string" } }
              }
            }
          }
        }]
      }
    }
  }
};

export function createAiEnricher(respond: AiResponder) {
  return async (candidate: { title: string; text: string; url: string }, mode: BudgetMode): Promise<
    { status: "queued" } | ({ status: "enriched" } & Enrichment)
  > => {
    if (mode === "defer") return { status: "queued" };
    const response = await respond([
      "你是 AI 眼镜产品研究编辑。只分析内容与 AI 眼镜产品、软硬件或生态的直接关系。",
      "输出 JSON，字段为 productRelevance、summary、whyItMatters、beginnerNote、productImpact、tags、productCandidate。",
      "仅当正文明确发布、宣布、交付或实质更新一个具体 AI 眼镜产品时填写 productCandidate，否则设为 null。只提取正文明确给出的事实，不猜测参数。",
      `标题：${candidate.title}`,
      `链接：${candidate.url}`,
      `正文：${candidate.text.slice(0, 12000)}`
    ].join("\n"));
    return { status: "enriched", ...EnrichmentSchema.parse(JSON.parse(response)) };
  };
}

export function createEditorialPlanner(respond: AiResponder) {
  return async (contents: Array<{ slug: string; title: string; summary: string; value: number; heat: number }>, includeWeekly: boolean): Promise<EditorialPlan> => {
    const response = await respond([
      "你是 AI 眼镜产品情报主编。选择最值得中文初学者今天首先阅读的一条内容。",
      "保持确定性分数不变，只输出首条 slug；周报只在 includeWeekly=true 时生成。",
      "周报 sections 固定为长期信号、短期噪音、下周学习，内容必须体现产品、AI 与硬件关系。",
      `includeWeekly=${includeWeekly}`,
      JSON.stringify(contents)
    ].join("\n"));
    return EditorialPlanSchema.parse(JSON.parse(response));
  };
}

export function createOpenAIResponder(options: {
  apiKey: string;
  baseURL?: string;
  model?: string;
  responseFormat?: { name: string; schema: Record<string, unknown> };
  maxOutputTokens?: number;
  onUsage?: (usage: { model: string; inputTokens: number; cachedInputTokens: number; outputTokens: number }) => void;
}): AiResponder {
  const client = new OpenAI({ apiKey: options.apiKey, baseURL: normalizeOpenAIBaseUrl(options.baseURL), timeout: 60_000, maxRetries: 2 });
  return async (prompt: string) => {
    const response = await client.responses.create({
      model: options.model ?? "gpt-5.6-luna",
      input: prompt,
      max_output_tokens: options.maxOutputTokens,
      reasoning: { effort: "low" },
      text: {
        format: {
          type: "json_schema",
          name: options.responseFormat?.name ?? ENRICHMENT_RESPONSE_FORMAT.name,
          strict: true,
          schema: options.responseFormat?.schema ?? ENRICHMENT_RESPONSE_FORMAT.schema
        }
      }
    });
    options.onUsage?.({
      model: options.model ?? "gpt-5.6-luna",
      inputTokens: response.usage?.input_tokens ?? 0,
      cachedInputTokens: response.usage?.input_tokens_details?.cached_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0
    });
    return response.output_text;
  };
}

export function normalizeOpenAIBaseUrl(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const url = new URL(value.trim());
  const path = url.pathname.replace(/\/+$/, "");
  url.pathname = path || "/v1";
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}
