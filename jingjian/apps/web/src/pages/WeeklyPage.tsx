import { ArrowUpRight, BookOpen, CircleDot, TrendingUp } from "lucide-react";
import { ErrorPage, LoadingPage, PageHeader } from "../components/PageHeader";
import { dataPaths, type RadarPayload, type RankingPayload, type WeeklyPayload } from "../data/types";
import { useJson } from "../data/useJson";

export function WeeklyPage() {
  const result = useJson<WeeklyPayload>(dataPaths.weekly);
  const ranking = useJson<RankingPayload>(dataPaths.value);
  const heat = useJson<RankingPayload>(dataPaths.heat);
  const radar = useJson<RadarPayload>(dataPaths.radar);
  if (result.loading || ranking.loading || heat.loading || radar.loading) return <LoadingPage />;
  if (!result.data || !ranking.data || !heat.data || !radar.data) return <ErrorPage message={result.error?.message ?? ranking.error?.message ?? heat.error?.message ?? radar.error?.message} />;
  const weekly = result.data;
  const contents = ranking.data.items;
  const signals = radar.data.items;
  const weeklyContents = weekly.contentIds.flatMap((id) => {
    const item = contents.find((content) => content.id === id);
    return item ? [item] : [];
  });
  const valueLead = [...weeklyContents].sort((left, right) => right.score.value - left.score.value)[0];
  const weeklyIds = new Set(weekly.contentIds);
  const heatLead = heat.data.items.filter((item) => weeklyIds.has(item.id)).sort((left, right) => right.score.heat - left.score.heat).find((item) => item.id !== valueLead?.id);
  const signalLead = weekly.signalIds.flatMap((id) => {
    const item = signals.find((signal) => signal.id === id);
    return item ? [item] : [];
  }).sort((left, right) => right.impact - left.impact)[0];
  const studySection = weekly.sections[2];
  const noiseSection = weekly.sections[1];
  const matrix = [
    { eyebrow: "价值最高", title: valueLead?.title ?? compact(weekly.thesis), label: valueLead ? `价值 ${valueLead.score.value}` : "本周主线" },
    { eyebrow: "讨论最高", title: heatLead?.title ?? compact(noiseSection?.body), label: heatLead ? `热议 ${heatLead.score.heat}` : noiseSection?.title ?? "持续观察" },
    { eyebrow: "前沿信号", title: signalLead?.title ?? compact(weekly.thesis), label: signalLead ? `影响 ${signalLead.impact}` : "技术变化" },
    { eyebrow: "下周学习", title: compact(studySection?.body), label: studySection?.title ?? "继续学习" }
  ];
  const primarySource = valueLead?.sources.find((source) => source.tier === "official" || source.tier === "research") ?? valueLead?.sources[0];
  return (
    <article className="weekly-page"><PageHeader eyebrow={`${weekly.isoWeek} · 每周复盘`} title={weekly.title} description="把七天信息压缩成长期信号、短期噪音和下一步学习。" />
      <section className="weekly-thesis"><span><TrendingUp size={18} />本周产品主线</span><p>{weekly.thesis}</p></section>
      <div className="weekly-matrix">{matrix.map((item) => <div key={item.eyebrow}><small>{item.eyebrow}</small><strong>{item.title}</strong><span>{item.label}</span></div>)}</div>
      <div className="weekly-sections">{weekly.sections.map((section, index) => <section key={section.title}><span>{index === 0 ? <CircleDot size={18} /> : index === 1 ? <TrendingUp size={18} /> : <BookOpen size={18} />}</span><div><small>0{index + 1}</small><h2>{section.title}</h2><p>{section.body}</p></div></section>)}</div>
      {primarySource && <a className="source-cta" href={primarySource.url} target="_blank" rel="noreferrer">查看本周首要一手来源 · {primarySource.name} <ArrowUpRight size={16} /></a>}
    </article>
  );
}

const compact = (value = "继续沿本周主线学习"): string => {
  const sentence = value.split(/[。；.!?]/)[0]?.trim() || value;
  return sentence.length > 34 ? `${sentence.slice(0, 34)}…` : sentence;
};
