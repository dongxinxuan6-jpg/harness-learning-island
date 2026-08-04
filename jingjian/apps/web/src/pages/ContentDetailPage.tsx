import type { ContentItem } from "@jingjian/domain";
import { ArrowLeft, ArrowUpRight, BookOpen, CircleHelp, Glasses, ShieldCheck } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ArticleOverview } from "../components/ArticleOverview";
import { NoteEditor } from "../components/NoteEditor";
import { ErrorPage, LoadingPage } from "../components/PageHeader";
import { SaveButton } from "../components/SaveButton";
import { VerificationBadge } from "../components/Score";
import { dataPaths, type DailyPayload, type LearningPayload, type RankingPayload } from "../data/types";
import { useJson } from "../data/useJson";

export function ContentDetailPage() {
  const { slug } = useParams();
  const value = useJson<RankingPayload>(dataPaths.value);
  const heat = useJson<RankingPayload>(dataPaths.heat);
  const daily = useJson<DailyPayload>(dataPaths.daily);
  const learning = useJson<LearningPayload>(dataPaths.learning);
  if (value.loading || heat.loading || daily.loading || learning.loading) return <LoadingPage />;
  const item = [...(daily.data?.items ?? []), ...(value.data?.items ?? []), ...(heat.data?.items ?? [])].find((content) => content.slug === slug);
  if (!item) return <ErrorPage title="内容未找到" message={daily.error?.message ?? value.error?.message ?? heat.error?.message} />;
  return <ContentArticle item={item} learning={learning.data?.items ?? []} />;
}

function ContentArticle({ item, learning }: { item: ContentItem; learning: LearningPayload["items"] }) {
  const verificationLabel = item.score.verification === "verified" ? "已验证" : item.score.verification === "developing" ? "发展中" : "待验证";
  return (
    <article className="detail-page content-detail">
      <div className="detail-tools"><Link to="/"><ArrowLeft size={17} />今日</Link><SaveButton entityType="content" entityId={item.id} /></div>
      <header className="content-hero"><div className="content-hero__meta"><VerificationBadge state={item.score.verification} /><span>{item.tags.join(" · ")}</span><span>{item.readMinutes} 分钟</span></div><h1>{item.title}</h1>{item.originalTitle && <p className="original-title">{item.originalTitle}</p>}<div className="content-score-pair"><div><strong>{item.score.value}</strong><span>价值分</span></div><div><strong>{item.score.heat}</strong><span>热议分</span></div></div></header>
      <ArticleOverview item={item} />
      <div className="article-layout"><main className="article-body">
        <section><span className="article-icon"><BookOpen size={18} /></span><div><h2>为什么值得读</h2><p>{item.whyItMatters}</p></div></section>
        <section><span className="article-icon"><CircleHelp size={18} /></span><div><h2>小白解释</h2><p>{item.beginnerNote}</p></div></section>
        <section><span className="article-icon"><Glasses size={18} /></span><div><h2>产品影响</h2><p>{item.productImpact}</p></div></section>
        <section><span className="article-icon"><ShieldCheck size={18} /></span><div><h2>事实与边界</h2><p>关键结论依据下列来源。验证状态为“{verificationLabel}”，当前记录 {item.score.independentSources} 个独立来源，置信度 {Math.round(item.score.confidence * 100)}%。</p></div></section>
        <NoteEditor entityType="content" entityId={item.id} />
      </main><aside className="article-aside"><span className="eyebrow">关键证据</span>{item.sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer"><span className={`source-tier source-tier--${source.tier}`}>{source.tier === "official" ? "一手" : source.tier === "research" ? "研究" : source.tier === "media" ? "媒体" : "社区"}</span><strong>{source.name}</strong><small>{source.language === "zh" ? "中文" : "英文原文"}</small><ArrowUpRight size={15} /></a>)}<span className="eyebrow">关联学习</span>{item.learningNodeIds.map((node) => <Link key={node} to={`/learning#${node}`}>{learning.find((item) => item.id === node)?.title ?? node}<ArrowUpRight size={14} /></Link>)}</aside></div>
    </article>
  );
}
