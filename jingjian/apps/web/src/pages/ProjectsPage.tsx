import { ErrorPage, LoadingPage, PageHeader } from "../components/PageHeader";
import { ProjectRow } from "../components/ProjectRow";
import { dataPaths, type ProjectPayload } from "../data/types";
import { useJson } from "../data/useJson";

export function ProjectsPage() {
  const result = useJson<ProjectPayload>(dataPaths.projects);
  if (result.loading) return <LoadingPage />;
  if (!result.data) return <ErrorPage message={result.error?.message} />;
  if (result.data.items.length === 0) return <ErrorPage title="项目库正在更新" />;
  return <div><PageHeader eyebrow="GitHub 项目库" title="代码比发布稿更接近真实能力" description="结合活跃度、设备支持、许可证和架构价值判断项目，而不是只看 Star。" /><div className="project-table-header"><span>项目</span><span>最近活动</span><span>状态</span></div><section className="projects-list">{result.data.items.map((project) => <ProjectRow key={project.id} project={project} />)}</section></div>;
}
