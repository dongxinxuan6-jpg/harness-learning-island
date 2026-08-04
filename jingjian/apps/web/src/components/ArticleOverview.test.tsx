// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ContentItem } from "@jingjian/domain";
import { ArticleOverview } from "./ArticleOverview";

const item = {
  title: "端侧 AI 进入眼镜",
  summary: "眼镜开始在本地完成识别。",
  whyItMatters: "响应更快且减少网络依赖。",
  beginnerNote: "模型在设备附近运行。",
  productImpact: "需要平衡功耗与准确率。",
  tags: ["端侧 AI", "芯片", "续航"],
  score: { verification: "verified", independentSources: 2, confidence: 0.91 }
} as ContentItem;

describe("ArticleOverview", () => {
  it("places a concise summary and product mind map before the long-form article", () => {
    render(<ArticleOverview item={item} />);
    expect(screen.getByRole("region", { name: "文章摘要与思维导图" })).toBeInTheDocument();
    expect(screen.getByText("30 秒摘要")).toBeInTheDocument();
    expect(screen.getByText("产品思维导图")).toBeInTheDocument();
    expect(screen.getByText("用户价值")).toBeInTheDocument();
    expect(screen.getByText(/已验证 · 2 个独立来源/)).toBeInTheDocument();
  });
});
