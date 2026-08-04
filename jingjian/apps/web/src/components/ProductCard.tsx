import type { Product } from "@jingjian/domain";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

const formLabels = { audio: "无显示", display: "轻显示", spatial: "空间计算" };
const statusLabels = { shipping: "已上市", announced: "待上市", "developer-kit": "开发套件", discontinued: "已停产" };

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link to={`/products/${product.slug}`} className="product-card">
      {product.heroImage ? <div className="product-card__image"><img src={product.heroImage} alt={`${product.brand} ${product.name}`} /></div> : <div className="product-card__monogram" aria-hidden="true">{product.brand.slice(0, 2).toUpperCase()}</div>}
      <div className="product-card__body">
        <div className="product-card__meta"><span>{formLabels[product.form]}</span><span>{statusLabels[product.status]}</span></div>
        <h3><small>{product.brand}</small>{product.name}</h3>
        <p>{product.positioning}</p>
        <span className="text-link">查看产品档案 <ArrowUpRight size={15} /></span>
      </div>
    </Link>
  );
}
