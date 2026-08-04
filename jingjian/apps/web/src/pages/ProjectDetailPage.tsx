import type { GitHubProject } from "@jingjian/domain";
import { ArrowLeft, ArrowUpRight, Box, Cloud, Cpu, GitFork, MonitorSmartphone, Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ErrorPage, LoadingPage } from "../components/PageHeader";
import { SaveButton } from "../components/SaveButton";
import { NoteEditor } from "../components/NoteEditor";
import { useJson } from "../data/useJson";

const layerIcons = [Cpu, MonitorSmartphone, Box, Cloud, ArrowUpRight];
const statusLabels = { active: "活跃", watch: "观察", stale: "低活跃", archived: "已归档", migrated: "已迁移" };
const difficultyLabels = { beginner: "入门", intermediate: "中等", advanced: "进阶" };

export function ProjectDetailPage() {
  const { slug } = useParams();
  const result = useJson<GitHubProject>(`/data/projects/${slug}.json`);
  if (result.loading) return <LoadingPage />;
  if (!result.data) return <ErrorPage title="项目档案未找到" message={result.error?.message} />;
  const project = result.data;
  return (
    <article className="detail-page project-detail">
      <div className="detail-tools"><Link to="/projects"><ArrowLeft size={17} />项目库</Link><SaveButton entityType="project" entityId={project.id} /></div>
      <header className="project-hero"><div className="repo-mark repo-mark--large"><GitFork size={30} /></div><div><span>{project.owner}</span><h1>{project.name}</h1><p>{project.description}</p><a className="primary-link" href={project.repositoryUrl} target="_blank" rel="noreferrer">打开 GitHub <ArrowUpRight size={16} /></a></div><div className="project-hero__stats"><span><Star size={15} />{project.stars.toLocaleString()}</span><span>{project.license}</span><span>{statusLabels[project.status]}</span></div></header>
      <section className="detail-section"><div className="detail-section__title"><Box size={19} /><h2>五层架构拆解</h2></div><div className="project-architecture">{project.architecture.map((item, index) => { const Icon = layerIcons[index]; return <div key={item}><span><Icon size={19} /></span><small>0{index + 1}</small><strong>{item}</strong>{index < 4 && <i />}</div>; })}</div></section>
      <div className="project-detail-grid"><section className="detail-section"><span className="eyebrow">产品启示</span><p className="large-copy">{project.productInsight}</p></section><section className="detail-section"><span className="eyebrow">运行门槛</span><dl className="project-facts"><div><dt>难度</dt><dd>{difficultyLabels[project.difficulty]}</dd></div><div><dt>支持设备</dt><dd>{project.supportedDevices.join("、") || "通用原型"}</dd></div><div><dt>语言</dt><dd>{project.languages.join("、") || "未标注"}</dd></div><div><dt>最近提交</dt><dd>{project.lastCommitAt.slice(0, 10)}</dd></div></dl></section></div>
      <NoteEditor entityType="project" entityId={project.id} />
    </article>
  );
}
