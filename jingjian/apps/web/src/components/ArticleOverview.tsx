import type { ContentItem } from "@jingjian/domain";
import { Cpu, Glasses, Lightbulb, ShieldCheck, UserRound } from "lucide-react";

export function ArticleOverview({ item }: { item: ContentItem }) {
  const verification = item.score.verification === "verified" ? "已验证" : item.score.verification === "developing" ? "发展中" : "待验证";
  const branches = [
    { label: "用户价值", text: item.whyItMatters, icon: UserRound },
    { label: "技术机制", text: item.beginnerNote, icon: Cpu },
    { label: "产品取舍", text: item.productImpact, icon: Glasses },
    { label: "证据状态", text: `${verification} · ${item.score.independentSources} 个独立来源 · 置信度 ${Math.round(item.score.confidence * 100)}%`, icon: ShieldCheck }
  ];

  return (
    <section className="article-opening" aria-label="文章摘要与思维导图">
      <div className="article-summary">
        <span className="eyebrow"><Lightbulb size={13} />30 秒摘要</span>
        <h2>{item.summary}</h2>
        <dl>
          <div><dt>为什么现在看</dt><dd>{item.whyItMatters}</dd></div>
          <div><dt>产品结论</dt><dd>{item.productImpact}</dd></div>
          <div><dt>阅读线索</dt><dd>{item.tags.slice(0, 3).join("、")}</dd></div>
        </dl>
      </div>
      <div className="article-mindmap">
        <span className="eyebrow">产品思维导图</span>
        <div className="mindmap-flow">
          <div className="mindmap-root"><small>核心变化</small><strong>{item.title}</strong></div>
          <div className="mindmap-branches">
            {branches.map(({ label, text, icon: Icon }) => <div className="mindmap-node" key={label}><span><Icon size={15} />{label}</span><p>{text}</p></div>)}
          </div>
        </div>
      </div>
    </section>
  );
}
