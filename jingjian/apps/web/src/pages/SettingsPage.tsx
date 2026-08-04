import { Database, Download, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { dataPaths, type DailyPayload, type ProductPayload, type ProjectPayload, type RankingPayload, type SystemStatusPayload } from "../data/types";
import { useJson } from "../data/useJson";
import { clearLearningData, exportLearningData, getLocalDataSummary, getSavedItems, importLearningData, type SavedRecord } from "../state/learningDb";

export function SettingsPage() {
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [summary, setSummary] = useState({ progress: 0, saved: 0, notes: 0 });
  const [savedItems, setSavedItems] = useState<SavedRecord[]>([]);
  const system = useJson<SystemStatusPayload>(dataPaths.status);
  const daily = useJson<DailyPayload>(dataPaths.daily);
  const contents = useJson<RankingPayload>(dataPaths.value);
  const heat = useJson<RankingPayload>(dataPaths.heat);
  const products = useJson<ProductPayload>(dataPaths.products);
  const projects = useJson<ProjectPayload>(dataPaths.projects);
  const refreshLocalData = useCallback(() => {
    Promise.all([getLocalDataSummary(), getSavedItems()]).then(([counts, saved]) => { setSummary(counts); setSavedItems(saved); }).catch(() => setStatus("本地数据读取失败，请重试"));
  }, []);
  useEffect(refreshLocalData, [refreshLocalData]);
  const download = async () => {
    try {
      const value = await exportLearningData();
      const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `jingjian-learning-${new Date().toISOString().slice(0, 10)}.json`; anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setStatus("学习数据已导出");
    } catch { setStatus("学习数据导出失败，请重试"); }
  };
  const upload = async (file: File) => {
    try {
      await importLearningData(JSON.parse(await file.text()));
      setStatus("学习数据已导入");
      refreshLocalData();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "导入失败");
    } finally {
      if (input.current) input.current.value = "";
    }
  };
  const clear = async () => {
    if (!confirmingClear) { setConfirmingClear(true); return; }
    try {
      await clearLearningData();
      setConfirmingClear(false);
      setStatus("本地学习数据已清空");
      refreshLocalData();
    } catch { setStatus("本地数据清理失败，请重试"); }
  };
  const budget = system.data?.budget;
  const budgetPercent = budget ? Math.min(100, Math.round(budget.spentCny / budget.hardLimitCny * 100)) : 0;
  const modeLabel = { normal: "正常", conserve: "节制", essential: "关键任务", defer: "补算队列" }[budget?.mode ?? "normal"];
  const updateLabel = system.data?.ingestion.status === "succeeded" ? "运行正常" : system.data?.ingestion.status === "partial" ? "部分来源异常" : system.data ? "采集异常" : system.error ? "状态读取异常" : "等待状态数据";
  const resolveSaved = (saved: SavedRecord) => {
    if (saved.entityType === "content") { const item = [...(daily.data?.items ?? []), ...(contents.data?.items ?? []), ...(heat.data?.items ?? [])].find((entry) => entry.id === saved.entityId); return { title: item?.title ?? saved.entityId, to: item ? `/content/${item.slug}` : "/rankings", label: "文章" }; }
    if (saved.entityType === "product") { const item = products.data?.items.find((entry) => entry.id === saved.entityId); return { title: item ? `${item.brand} ${item.name}` : saved.entityId, to: item ? `/products/${item.slug}` : "/products", label: "产品" }; }
    const item = projects.data?.items.find((entry) => entry.id === saved.entityId); return { title: item?.name ?? saved.entityId, to: item ? `/projects/${item.slug}` : "/projects", label: "项目" };
  };
  return <div><PageHeader eyebrow="本地数据与运行状态" title="设置" description="学习数据保存在当前设备；发布和额度状态来自最近一次管线运行。" />
    <section className="settings-band"><div><h2>学习数据</h2><p>{status || "可导出备份，并在另一台设备中手动导入。"}</p><div className="local-data-counts"><span>{summary.progress} 个进度</span><span>{summary.saved} 个收藏</span><span>{summary.notes} 条笔记</span></div></div><div><button className="secondary-button" onClick={download}><Download size={17} />导出</button><button className="primary-button" onClick={() => input.current?.click()}><Upload size={17} />导入</button><button className={confirmingClear ? "danger-button is-confirming" : "danger-button"} onClick={clear}><Trash2 size={17} />{confirmingClear ? "确认清空" : "清空"}</button><input ref={input} hidden type="file" accept="application/json" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} /></div></section>
    <section className="settings-band"><div><h2>内容更新</h2><p>{system.data ? `最近运行 ${formatTime(system.data.generatedAt)}，发现 ${system.data.ingestion.discovered} 个候选。` : "每天 10:00 发布晨报，热议信号每四小时刷新。"}</p>{system.data?.quality ? <div className="local-data-counts"><span>来源成功 {system.data.quality.sourceSuccessRate}%</span><span>证据完整 {system.data.quality.evidenceCompleteness}%</span><span>产品覆盖 {system.data.quality.productCoverage}%</span><span>发布 {system.data.quality.publishedItems} 条 / {system.data.quality.readMinutes} 分钟</span></div> : null}</div><span className={`status-pill status-pill--${system.data?.ingestion.status ?? "loading"}`}><i />{updateLabel}</span></section>
    <section className="settings-band"><div><h2>AI 月度额度</h2><p>120 元预警，170 元保留关键任务，200 元进入补算队列。</p><div className="budget-line"><i style={{ width: `${budgetPercent}%` }} /></div><small>{budget ? `已用 ¥${budget.spentCny.toFixed(2)} · ${modeLabel}${budget.queuedForNextMonth ? ` · ${budget.queuedForNextMonth} 条待补算` : ""}` : "读取额度状态"}</small></div><strong>¥{budget?.hardLimitCny ?? 200}</strong></section>
    <section className="settings-band"><div><h2>云端记录</h2><p>D1 保存采集运行、去重指纹、版本档案和 AI 成本。</p></div><span className="status-pill"><Database size={15} />{system.data?.persistence === "succeeded" ? "D1 已同步" : system.data?.persistence === "degraded" ? "D1 降级" : "本地模式"}</span></section>
    <section className="saved-library"><div><span className="eyebrow">稍后阅读</span><h2>我的收藏</h2></div>{savedItems.length > 0 ? <div>{[...savedItems].sort((a, b) => b.savedAt.localeCompare(a.savedAt)).map((saved) => { const item = resolveSaved(saved); return <Link key={saved.id} to={item.to}><span>{item.label}</span><strong>{item.title}</strong></Link>; })}</div> : <p>收藏文章、产品或项目后，会集中显示在这里。</p>}</section>
  </div>;
}

const formatTime = (value: string) => new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Shanghai" }).format(new Date(value));
