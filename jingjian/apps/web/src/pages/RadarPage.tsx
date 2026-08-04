import { ErrorPage, LoadingPage, PageHeader } from "../components/PageHeader";
import { RadarSignal } from "../components/RadarSignal";
import { dataPaths, type RadarPayload } from "../data/types";
import { useJson } from "../data/useJson";
import { useHashScroll } from "../hooks/useHashScroll";

export function RadarPage() {
  const result = useJson<RadarPayload>(dataPaths.radar);
  useHashScroll(Boolean(result.data));
  if (result.loading) return <LoadingPage />;
  if (!result.data) return <ErrorPage message={result.error?.message} />;
  if (result.data.items.length === 0) return <ErrorPage title="技术信号正在聚合" />;
  const counts = result.data.items.reduce<Record<string, number>>((all, item) => ({ ...all, [item.maturity]: (all[item.maturity] ?? 0) + 1 }), {});
  return (
    <div><PageHeader eyebrow="前沿技术雷达" title="从研究走到产品交付" description="技术价值取决于成熟度、产品关联和真实体验影响。" />
      <div className="radar-summary"><div><strong>{counts.research ?? 0}</strong><span>论文研究</span></div><div><strong>{counts["developer-preview"] ?? 0}</strong><span>开发预览</span></div><div><strong>{counts.announced ?? 0}</strong><span>产品宣布</span></div><div><strong>{counts.shipping ?? 0}</strong><span>正式交付</span></div></div>
      <section className="radar-timeline">{result.data.items.map((signal) => <RadarSignal key={signal.id} signal={signal} />)}</section>
    </div>
  );
}
