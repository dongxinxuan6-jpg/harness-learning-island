import type { LearningNode } from "@jingjian/domain";
import { Check, CheckCircle2, Circle, Clock3 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorPage, LoadingPage, PageHeader } from "../components/PageHeader";
import { dataPaths, type LearningPayload, type ProductPayload } from "../data/types";
import { useJson } from "../data/useJson";
import { useHashScroll } from "../hooks/useHashScroll";
import { getLearningProgress, setLearningProgress } from "../state/learningDb";

const stageInfo = [
  { title: "看懂产品形态", question: "它是什么，为谁解决什么问题？" },
  { title: "理解产品体验", question: "用户每天戴着它，真实体验怎样？" },
  { title: "拆解产品系统", question: "能力靠什么实现，代价是什么？" },
  { title: "形成产品判断", question: "它是否有价值，未来走向哪里？" }
];

export function LearningPage() {
  const result = useJson<LearningPayload>(dataPaths.learning);
  const products = useJson<ProductPayload>(dataPaths.products);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [storageError, setStorageError] = useState("");
  const pendingRef = useRef(new Set<string>());
  useHashScroll(Boolean(result.data));
  useEffect(() => { getLearningProgress().then((items) => setProgress(Object.fromEntries(items.map((item) => [item.nodeId, item.percent])))).catch(() => setStorageError("进度读取失败，请重试")); }, []);
  const items = result.data?.items;
  const completed = items?.filter((item) => progress[item.id] === 100).length ?? 0;
  const totalMinutes = items?.reduce((sum, item) => sum + item.durationMinutes, 0) ?? 0;
  const grouped = useMemo(() => items ? [1, 2, 3, 4].map((stage) => items.filter((item) => item.stage === stage)) : [], [items]);
  if (result.loading || products.loading) return <LoadingPage />;
  if (!result.data || !products.data) return <ErrorPage message={result.error?.message ?? products.error?.message} />;
  if (result.data.items.length === 0) return <ErrorPage title="学习路线正在更新" />;
  const update = async (node: LearningNode) => {
    if (pendingRef.current.has(node.id)) return;
    const value = progress[node.id] === 100 ? 0 : 100;
    pendingRef.current.add(node.id);
    setPending(new Set(pendingRef.current));
    setStorageError("");
    try {
      await setLearningProgress(node.id, value);
      setProgress((current) => ({ ...current, [node.id]: value }));
    } catch {
      setStorageError("进度保存失败，请重试");
    } finally {
      pendingRef.current.delete(node.id);
      setPending(new Set(pendingRef.current));
    }
  };
  const nodeTitles = new Map(result.data.items.map((node) => [node.id, node.title]));
  const productNames = new Map(products.data.items.map((product) => [product.slug, `${product.brand} ${product.name}`]));
  return (
    <div><PageHeader eyebrow="产品视角学习路线" title="从看懂一款眼镜，到形成产品判断" description="所有 AI、软件和硬件知识都从具体产品问题进入。" />
      {storageError && <p className="inline-status" role="status">{storageError}</p>}
      <div className="learning-overview"><div><strong>{completed}/{result.data.items.length}</strong><span>已完成节点</span></div><div><strong>{Math.round(completed / result.data.items.length * 100)}%</strong><span>路线进度</span></div><div><strong>{Math.round(totalMinutes / 60)}h</strong><span>预计总时长</span></div><div className="learning-overview__bar"><i style={{ width: `${completed / result.data.items.length * 100}%` }} /></div></div>
      <div className="learning-stages">{grouped.map((nodes, stageIndex) => <section className="learning-stage" key={stageIndex}><header><span>0{stageIndex + 1}</span><div><h2>{stageInfo[stageIndex].title}</h2><p>{stageInfo[stageIndex].question}</p></div></header><div className="learning-nodes">{nodes.map((node) => { const done = progress[node.id] === 100; const saving = pending.has(node.id); return <article id={node.id} className={done ? "is-complete" : ""} key={node.id}><button disabled={saving} aria-label={saving ? `正在保存 ${node.title}` : done ? `取消完成 ${node.title}` : `完成 ${node.title}`} onClick={() => update(node)}>{done ? <CheckCircle2 size={22} /> : <Circle size={22} />}</button><div><span><Clock3 size={13} />{node.durationMinutes} 分钟 · {node.productSlugs.length} 个产品案例</span><h3>{node.title}</h3><p>{node.summary}</p><div className="outcomes">{node.outcomes.map((outcome) => <span key={outcome}><Check size={12} />{outcome}</span>)}</div><div className="learning-links">{node.prerequisites.map((id) => <a key={id} href={`#${id}`}>前置：{nodeTitles.get(id) ?? id}</a>)}{node.productSlugs.map((slug) => <Link key={slug} to={`/products/${slug}`}>{productNames.get(slug) ?? slug}</Link>)}</div></div></article>; })}</div></section>)}</div>
    </div>
  );
}
