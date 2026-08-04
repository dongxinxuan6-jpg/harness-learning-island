import { ArrowRight, CalendarDays, CheckCircle2, GitFork, Glasses, GraduationCap, History } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ContentList } from "../components/ContentList";
import { DailyLead } from "../components/DailyLead";
import { HeatPanel } from "../components/HeatPanel";
import { LoadingPage, ErrorPage } from "../components/PageHeader";
import { ProductCard } from "../components/ProductCard";
import { ProjectRow } from "../components/ProjectRow";
import { dataPaths, type DailyPayload, type LearningPayload, type ProductPayload, type ProjectPayload, type RankingPayload, type WeeklyPayload } from "../data/types";
import { useJson } from "../data/useJson";
import { getPublicationCopy } from "../publication-copy";
import { getLearningProgress } from "../state/learningDb";

export function HomePage() {
  const daily = useJson<DailyPayload>(dataPaths.daily);
  const heat = useJson<RankingPayload>(dataPaths.heat);
  const products = useJson<ProductPayload>(dataPaths.products);
  const projects = useJson<ProjectPayload>(dataPaths.projects);
  const learning = useJson<LearningPayload>(dataPaths.learning);
  const weekly = useJson<WeeklyPayload>(dataPaths.weekly);
  const [progress, setProgress] = useState<Record<string, number>>({});
  useEffect(() => { getLearningProgress().then((items) => setProgress(Object.fromEntries(items.map((item) => [item.nodeId, item.percent])))).catch(() => setProgress({})); }, []);
  if (daily.loading || heat.loading || products.loading || projects.loading || learning.loading || weekly.loading) return <LoadingPage />;
  if (!daily.data || !heat.data || !products.data || !projects.data || !learning.data || !weekly.data) return <ErrorPage message={daily.error?.message} />;
  if (daily.data.items.length === 0 || learning.data.items.length === 0) return <ErrorPage title="今日内容正在生成" message="最近一期内容会在准备完成后显示。" />;
  const lead = daily.data.items.find((item) => item.id === daily.data?.leadId) ?? daily.data.items[0];
  const completed = learning.data.items.filter((item) => progress[item.id] === 100).length;
  const routeProgress = Math.round(completed / learning.data.items.length * 100);
  const nextNode = learning.data.items.find((item) => progress[item.id] !== 100) ?? learning.data.items[0];
  const publication = getPublicationCopy(daily.data.status);
  const PublicationIcon = daily.data.status === "published" ? CheckCircle2 : History;
  return (
    <div className="home-page">
      <header className="home-header">
        <div><span className="eyebrow">{formatDate(daily.data.date)} · 晨报</span><h1>{publication.heading}</h1></div>
        <div className="digest-meta"><span><PublicationIcon size={16} />{publication.status}</span><span>{daily.data.items.length} 条</span><span>{daily.data.totalReadMinutes} 分钟</span></div>
      </header>
      <div className="home-first-grid"><DailyLead item={lead} /><HeatPanel items={heat.data.items} /></div>

      <section className="page-section">
        <div className="section-heading"><div><span className="eyebrow">编辑精选</span><h2>{publication.ranking}</h2></div><Link to="/rankings">查看全部 <ArrowRight size={15} /></Link></div>
        <ContentList items={daily.data.items.filter((item) => item.id !== lead.id)} limit={4} />
      </section>

      <section className="page-section">
        <div className="section-heading"><div><span className="eyebrow"><Glasses size={13} />产品变化</span><h2>从具体产品理解技术</h2></div><Link to="/products">产品库 <ArrowRight size={15} /></Link></div>
        <div className="product-grid product-grid--home">{products.data.items.filter((item) => item.heroImage).slice(0, 2).map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>

      <div className="home-lower-grid">
        <section className="page-section compact-section">
          <div className="section-heading"><div><span className="eyebrow"><GitFork size={13} />代码现场</span><h2>活跃开源项目</h2></div><Link to="/projects">全部</Link></div>
          {projects.data.items.slice(0, 3).map((project) => <ProjectRow key={project.id} project={project} />)}
        </section>
        <section className="continue-panel">
          <span className="eyebrow"><GraduationCap size={13} />继续学习</span><div className="stage-number">{String(nextNode.stage).padStart(2, "0")}</div><h2>{nextNode.title}</h2><p>{nextNode.question}</p><div className="progress-line"><i style={{ width: `${routeProgress}%` }} /></div><small>路线进度 {routeProgress}%</small><Link to={`/learning#${nextNode.id}`}>进入学习路线 <ArrowRight size={16} /></Link>
        </section>
      </div>

      <Link className="weekly-banner" to="/weekly"><span><CalendarDays size={19} /><i><small>{weekly.data.isoWeek} · 每周复盘</small><strong>{weekly.data.title.replace(/^第\s*\d+\s*周[：:]\s*/, "")}</strong></i></span><ArrowRight size={18} /></Link>
    </div>
  );
}

const formatDate = (date: string) => new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(new Date(`${date}T00:00:00+08:00`));
