import { describe, expect, it, vi } from "vitest";
import { createAiEnricher, createEditorialPlanner, normalizeOpenAIBaseUrl } from "./ai";

describe("normalizeOpenAIBaseUrl", () => {
  it("adds the conventional v1 path to a provider root URL", () => {
    expect(normalizeOpenAIBaseUrl("https://sol.hnivj.com/")).toBe("https://sol.hnivj.com/v1");
  });

  it("keeps an explicit API path and removes its trailing slash", () => {
    expect(normalizeOpenAIBaseUrl("https://sol.hnivj.com/v1/")).toBe("https://sol.hnivj.com/v1");
    expect(normalizeOpenAIBaseUrl(undefined)).toBeUndefined();
  });
});

describe("createAiEnricher", () => {
  it("defers enrichment without calling the model after the hard budget limit", async () => {
    const respond = vi.fn();
    const enrich = createAiEnricher(respond);

    const result = await enrich({ title: "AI glasses", text: "New display", url: "https://example.com" }, "defer");

    expect(result).toEqual({ status: "queued" });
    expect(respond).not.toHaveBeenCalled();
  });

  it("validates structured model output", async () => {
    const enrich = createAiEnricher(async () => JSON.stringify({
      productRelevance: 0.92,
      summary: "新型显示方案降低了眼镜端的信息负担。",
      whyItMatters: "影响全天佩戴体验。",
      beginnerNote: "显示信息保持短小可扫读。",
      productImpact: "改善交互和续航取舍。",
      tags: ["显示", "交互"],
      productCandidate: null
    }));

    await expect(enrich({ title: "Display", text: "Details", url: "https://example.com" }, "normal"))
      .resolves.toEqual(expect.objectContaining({ status: "enriched", productRelevance: 0.92 }));
  });

  it("extracts a concrete product candidate in the same enrichment call", async () => {
    const enrich = createAiEnricher(async () => JSON.stringify({
      productRelevance: 0.98,
      summary: "Acme 发布了 Vision One。",
      whyItMatters: "新增了轻显示产品形态。",
      beginnerNote: "它通过单目显示提供短信息。",
      productImpact: "扩展全天佩戴场景。",
      tags: ["Acme", "轻显示"],
      productCandidate: {
        brand: "Acme",
        name: "Vision One",
        form: "display",
        status: "announced",
        positioning: "面向日常提醒的轻显示 AI 眼镜",
        audience: "希望获得免手持信息的用户",
        scenarios: ["导航", "翻译"],
        capabilities: ["相机", "单目显示"],
        specs: [{ label: "display", value: "MicroLED" }],
        architecture: ["眼镜", "手机伴生应用", "云端模型"],
        tradeoffs: ["续航数据仍待交付验证"]
      }
    }));

    await expect(enrich({ title: "Vision One", text: "Launch details", url: "https://acme.example/news" }, "normal"))
      .resolves.toEqual(expect.objectContaining({
        productCandidate: expect.objectContaining({ brand: "Acme", name: "Vision One", form: "display" })
      }));
  });

  it("validates the Terra editorial plan", async () => {
    const plan = createEditorialPlanner(async () => JSON.stringify({
      leadSlug: "android-xr",
      weekly: {
        title: "第 32 周：平台能力进入产品",
        thesis: "端侧 AI 与系统平台共同定义体验。",
        sections: [
          { title: "长期信号", body: "平台持续成熟。" },
          { title: "短期噪音", body: "参数仍需交付验证。" },
          { title: "下周学习", body: "继续拆解端云链路。" }
        ]
      }
    }));
    await expect(plan([{ slug: "android-xr", title: "Android XR", summary: "summary", value: 94, heat: 88 }], true))
      .resolves.toEqual(expect.objectContaining({ leadSlug: "android-xr" }));
  });
});
