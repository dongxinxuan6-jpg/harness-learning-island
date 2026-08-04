import type { Product } from "@jingjian/domain";
import { ArrowLeft, ArrowUpRight, Box, Braces, CircleUserRound, Gauge, Layers3 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ErrorPage, LoadingPage } from "../components/PageHeader";
import { SaveButton } from "../components/SaveButton";
import { NoteEditor } from "../components/NoteEditor";
import { useJson } from "../data/useJson";

const formLabel = { audio: "无显示 AI 眼镜", display: "轻显示 AI 眼镜", spatial: "空间计算眼镜" };
const statusLabel = { shipping: "已上市", announced: "待上市", "developer-kit": "开发套件", discontinued: "已停产" };

export function ProductDetailPage() {
  const { slug } = useParams();
  const result = useJson<Product>(`/data/products/${slug}.json`);
  if (result.loading) return <LoadingPage />;
  if (!result.data) return <ErrorPage title="产品档案未找到" message={result.error?.message} />;
  const product = result.data;
  return (
    <article className="detail-page product-detail">
      <div className="detail-tools"><Link to="/products"><ArrowLeft size={17} />产品库</Link><SaveButton entityType="product" entityId={product.id} /></div>
      <header className={`product-hero ${product.heroImage ? "has-image" : ""}`}>
        <div><div className="detail-badges"><span>{formLabel[product.form]}</span><span>{statusLabel[product.status]}</span></div><small>{product.brand}</small><h1>{product.name}</h1><p>{product.positioning}</p><a className="primary-link" href={product.officialUrl} target="_blank" rel="noreferrer">官方网站 <ArrowUpRight size={16} /></a></div>
        {product.heroImage && <img src={product.heroImage} alt={`${product.brand} ${product.name}`} />}
      </header>
      <div className="detail-grid">
        <main>
          <section className="detail-section"><div className="detail-section__title"><CircleUserRound size={19} /><h2>用户与场景</h2></div><p className="large-copy">{product.audience}</p><div className="tag-list">{product.scenarios.map((item) => <span key={item}>{item}</span>)}</div></section>
          <section className="detail-section"><div className="detail-section__title"><Gauge size={19} /><h2>核心能力</h2></div><div className="capability-grid">{product.capabilities.map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></div>)}</div></section>
          <section className="detail-section"><div className="detail-section__title"><Layers3 size={19} /><h2>产品系统</h2></div><div className="architecture-flow">{product.architecture.map((item, index) => <div key={item}><span>{index + 1}</span><strong>{item}</strong></div>)}</div></section>
          <section className="detail-section"><div className="detail-section__title"><Box size={19} /><h2>体验取舍</h2></div><div className="tradeoff-list">{product.tradeoffs.map((item) => <p key={item}>{item}</p>)}</div></section>
          <NoteEditor entityType="product" entityId={product.id} />
        </main>
        <aside className="detail-aside"><div><span className="eyebrow">关键参数</span><dl>{Object.entries(product.specs).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></div><div><span className="eyebrow">证据来源</span>{product.sources.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer"><Braces size={15} /><span><strong>{item.name}</strong><small>{item.tier === "official" ? "官方一手" : "技术资料"}</small></span><ArrowUpRight size={14} /></a>)}</div><small>档案更新于 {product.updatedAt.slice(0, 10)}</small></aside>
      </div>
    </article>
  );
}
