import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}

export function LoadingPage() {
  return <div className="loading-page" aria-label="正在加载"><span /><span /><span /></div>;
}

export function ErrorPage({ title = "暂时没有更新", message }: { title?: string; message?: string }) {
  return <div className="empty-state"><strong>{title}</strong><p>{message ?? "最近一次缓存仍会保留在本设备。"}</p></div>;
}
