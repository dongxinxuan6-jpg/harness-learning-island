import type { Product } from "@jingjian/domain";
import { useMemo, useState } from "react";
import { PageHeader, LoadingPage, ErrorPage } from "../components/PageHeader";
import { ProductCard } from "../components/ProductCard";
import { dataPaths, type ProductPayload } from "../data/types";
import { useJson } from "../data/useJson";

const forms: Array<{ key: "all" | Product["form"]; label: string }> = [{ key: "all", label: "全部" }, { key: "audio", label: "无显示" }, { key: "display", label: "轻显示" }, { key: "spatial", label: "空间计算" }];

export function ProductsPage() {
  const result = useJson<ProductPayload>(dataPaths.products);
  const [form, setForm] = useState<(typeof forms)[number]["key"]>("all");
  const [status, setStatus] = useState("all");
  const items = useMemo(() => result.data?.items.filter((item) => (form === "all" || item.form === form) && (status === "all" || item.status === status)) ?? [], [form, result.data, status]);
  if (result.loading) return <LoadingPage />;
  if (!result.data) return <ErrorPage message={result.error?.message} />;
  if (result.data.items.length === 0) return <ErrorPage title="产品库正在更新" />;
  return (
    <div>
      <PageHeader eyebrow="动态产品库" title="从产品出发，理解 AI 与硬件" description={`已收录 ${result.data.items.length} 款主流产品，并持续跟踪交付状态与能力变化。`} actions={<select value={status} aria-label="产品状态" onChange={(event) => setStatus(event.target.value)}><option value="all">全部状态</option><option value="shipping">已上市</option><option value="announced">待上市</option><option value="developer-kit">开发套件</option></select>} />
      <div className="chip-control" aria-label="产品形态">{forms.map((item) => <button key={item.key} aria-pressed={form === item.key} className={form === item.key ? "is-active" : ""} onClick={() => setForm(item.key)}>{item.label}</button>)}</div>
      {items.length > 0 ? <div className="product-grid">{items.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="filter-empty"><strong>当前组合没有产品</strong><button onClick={() => { setForm("all"); setStatus("all"); }}>清除筛选</button></div>}
    </div>
  );
}
