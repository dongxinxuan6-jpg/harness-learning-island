import { useSearchParams } from "react-router-dom";
import { ContentList } from "../components/ContentList";
import { ErrorPage, LoadingPage, PageHeader } from "../components/PageHeader";
import { ScoreBar } from "../components/Score";
import { dataPaths, type RankingPayload } from "../data/types";
import { useJson } from "../data/useJson";

export function RankingsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "heat" ? "heat" : "value";
  const result = useJson<RankingPayload>(tab === "value" ? dataPaths.value : dataPaths.heat);
  if (result.loading) return <LoadingPage />;
  if (!result.data) return <ErrorPage message={result.error?.message} />;
  if (result.data.items.length === 0) return <ErrorPage title="榜单正在生成" />;
  return (
    <div>
      <PageHeader eyebrow="双榜单" title={tab === "value" ? "真正值得读的内容" : "大家正在集中讨论什么"} description={tab === "value" ? "按证据、产品影响、信息增量与学习价值排序。" : "按讨论增速、跨平台集中度与独立来源排序。"} />
      <div className="segmented-control" role="tablist"><button role="tab" aria-selected={tab === "value"} onClick={() => setParams({ tab: "value" })}>价值榜</button><button role="tab" aria-selected={tab === "heat"} onClick={() => setParams({ tab: "heat" })}>热议榜</button></div>
      <div className="ranking-layout">
        <section className="ranking-main"><ContentList items={result.data.items} scoreKind={tab} /></section>
        <aside className="method-panel"><span className="eyebrow">评分方法</span><h2>{tab === "value" ? "价值由五个维度决定" : "热度不是点击量"}</h2>{tab === "value" ? <><ScoreBar label="证据质量" value={25} /><ScoreBar label="产品影响" value={25} /><ScoreBar label="信息增量" value={20} /><ScoreBar label="学习价值" value={20} /><ScoreBar label="时效性" value={10} /></> : <><ScoreBar label="讨论增速" value={30} /><ScoreBar label="跨平台" value={25} /><ScoreBar label="独立来源" value={20} /><ScoreBar label="专业参与" value={15} /><ScoreBar label="时间衰减" value={10} /></>}<p>{tab === "value" ? "同源转载只计一次，关键事实必须能定位到原始证据。" : "社区信号会显示验证状态，不会自动进入价值榜前列。"}</p></aside>
      </div>
    </div>
  );
}
