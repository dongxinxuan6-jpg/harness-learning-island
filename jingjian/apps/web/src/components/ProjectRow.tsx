import type { GitHubProject } from "@jingjian/domain";
import { ArrowUpRight, GitFork, Star } from "lucide-react";
import { Link } from "react-router-dom";

const statusLabel = { active: "活跃", watch: "观察", stale: "低活跃", archived: "已归档", migrated: "已迁移" };

export function ProjectRow({ project }: { project: GitHubProject }) {
  return (
    <Link to={`/projects/${project.slug}`} className="project-row">
      <div className="repo-mark"><GitFork size={20} /></div>
      <div className="project-row__copy"><div><span>{project.owner}</span><span className={`repo-status repo-status--${project.status}`}>{statusLabel[project.status]}</span></div><h3>{project.name}</h3><p>{project.description}</p><small>{project.languages.join(" · ")}</small></div>
      <div className="project-row__stat"><span><Star size={14} />{formatNumber(project.stars)}</span><ArrowUpRight size={17} /></div>
    </Link>
  );
}

const formatNumber = (value: number) => value >= 1000 ? `${Math.round(value / 100) / 10}k` : String(value);
