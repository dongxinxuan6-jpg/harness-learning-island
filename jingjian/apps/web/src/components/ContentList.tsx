import type { ContentItem } from "@jingjian/domain";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatedList } from "./ReactBits";
import { VerificationBadge } from "./Score";

export function ContentList({ items, scoreKind = "value", limit }: { items: ContentItem[]; scoreKind?: "value" | "heat"; limit?: number }) {
  return (
    <AnimatedList className="content-list">
      {items.slice(0, limit ?? items.length).map((item, index) => (
        <Link to={`/content/${item.slug}`} className="content-row" key={item.id}>
          <span className="content-row__rank">{String(index + 1).padStart(2, "0")}</span>
          <div className="content-row__copy">
            <div className="content-row__meta"><VerificationBadge state={item.score.verification} /><span>{item.tags[0]}</span>{scoreKind === "heat" && item.score.heatSignals ? <><span>增速 {item.score.heatSignals.discussionVelocity}</span><span>{item.score.heatSignals.crossPlatformSources} 平台</span></> : null}<span><Clock3 size={13} />{item.readMinutes} 分钟</span></div>
            <h3>{item.title}</h3>
            <p>{item.summary}</p>
          </div>
          <div className="content-row__score"><strong>{scoreKind === "value" ? item.score.value : item.score.heat}</strong><small>{scoreKind === "value" ? "价值" : "热度"}</small><ArrowUpRight size={16} /></div>
        </Link>
      ))}
    </AnimatedList>
  );
}
