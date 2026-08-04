import type { FrontierSignal } from "@jingjian/domain";
import { ArrowUpRight } from "lucide-react";

const maturityLabel = { research: "论文研究", "developer-preview": "开发预览", announced: "产品宣布", shipping: "正式交付" };

export function RadarSignal({ signal }: { signal: FrontierSignal }) {
  return (
    <article className="radar-signal" id={signal.id}>
      <div className="radar-signal__axis"><i /><span>{signal.date.slice(5)}</span></div>
      <div className="radar-signal__body"><div><span className={`maturity maturity--${signal.maturity}`}>{maturityLabel[signal.maturity]}</span><span>{signal.category}</span></div><h3>{signal.title}</h3><p>{signal.summary}</p><a href={signal.source.url} target="_blank" rel="noreferrer">{signal.source.name}<ArrowUpRight size={14} /></a></div>
      <strong className="impact-score">{signal.impact}<small>影响</small></strong>
    </article>
  );
}
