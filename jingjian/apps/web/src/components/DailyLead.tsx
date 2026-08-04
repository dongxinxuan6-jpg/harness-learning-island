import type { ContentItem } from "@jingjian/domain";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { SpotlightCard } from "./ReactBits";

const sourceLabels = { official: "一手", research: "研究", media: "媒体", community: "社区" };

export function DailyLead({ item }: { item: ContentItem }) {
  return (
    <SpotlightCard className="daily-lead">
      <div className="daily-lead__topline">
        <span className="eyebrow">今日最值得读</span>
        <span className="score" aria-label={`价值分 ${item.score.value}`}><strong>{item.score.value}</strong><small>价值分</small></span>
      </div>
      <div className="daily-lead__body">
        <div className="source-line"><span className={`source-tier source-tier--${item.sources[0].tier}`}>{sourceLabels[item.sources[0].tier]}</span>{item.sources[0].name}</div>
        <h2>{item.title}</h2>
        <p>{item.summary}</p>
      </div>
      <div className="daily-lead__footer">
        <span><BookOpen size={16} />{item.readMinutes} 分钟</span>
        <Link to={`/content/${item.slug}`}>阅读拆解 <ArrowUpRight size={16} /></Link>
      </div>
    </SpotlightCard>
  );
}
