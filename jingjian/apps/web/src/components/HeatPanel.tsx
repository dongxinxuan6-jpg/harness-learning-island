import type { ContentItem } from "@jingjian/domain";
import { Activity, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import { AnimatedList } from "./ReactBits";
import { VerificationBadge } from "./Score";

export function HeatPanel({ items }: { items: ContentItem[] }) {
  return (
    <section className="heat-panel">
      <div className="section-heading"><div><span className="eyebrow"><Radio size={13} />24 小时</span><h2>前沿热议</h2></div><Link to="/rankings?tab=heat">完整榜单</Link></div>
      <AnimatedList>
        {items.slice(0, 4).map((item, index) => (
          <Link className="heat-item" to={`/content/${item.slug}`} key={item.id}>
            <span className="heat-index">{index + 1}</span>
            <div><h3>{item.title}</h3><span><VerificationBadge state={item.score.verification} />{item.score.heatSignals ? `增速 ${item.score.heatSignals.discussionVelocity} · ${item.score.heatSignals.crossPlatformSources} 平台 · ` : ""}{item.score.independentSources} 个独立来源</span></div>
            <strong><Activity size={14} />{item.score.heat}</strong>
          </Link>
        ))}
      </AnimatedList>
    </section>
  );
}
