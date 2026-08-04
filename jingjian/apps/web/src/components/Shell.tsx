import { CalendarRange, GitFork, Glasses, GraduationCap, Home, ListOrdered, Menu, Radar, Search, Settings, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Dock, GlassSurface } from "./ReactBits";
import { Logo } from "./Logo";
import { dataPaths, type DailyPayload } from "../data/types";
import { useJson } from "../data/useJson";

const navItems = [
  { to: "/", label: "今日", icon: Home },
  { to: "/rankings", label: "榜单", icon: ListOrdered },
  { to: "/products", label: "产品", icon: Glasses },
  { to: "/projects", label: "开源项目", icon: GitFork },
  { to: "/radar", label: "技术雷达", icon: Radar },
  { to: "/learning", label: "学习路线", icon: GraduationCap },
  { to: "/weekly", label: "每周复盘", icon: CalendarRange }
];

export function Shell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const daily = useJson<DailyPayload>(dataPaths.daily);
  const isSearch = location.pathname === "/search";
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileOpen(false); };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", closeOnEscape); };
  }, [mobileOpen]);
  const publicationLabel = daily.data?.status === "published" ? "今日内容已发布" : daily.data?.status === "stale" ? "正在展示最近一期" : "内容更新中";
  return (
    <div className="app-shell">
      <aside id="primary-sidebar" className={`sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="sidebar__top"><Logo /><button className="icon-button sidebar-close" aria-label="关闭菜单" onClick={() => setMobileOpen(false)}><X size={19} /></button></div>
        <nav className="sidebar-nav" aria-label="主导航">
          {navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/"} onClick={() => setMobileOpen(false)}><Icon size={18} /><span>{label}</span></NavLink>)}
        </nav>
        <div className="sidebar__footer">
          <div className="sync-status"><i /><span><strong>{publicationLabel}</strong><small>{daily.data ? `${daily.data.date.slice(5)} · ${daily.data.items.length} 条 · ${daily.data.totalReadMinutes} 分钟` : "读取发布状态"}</small></span></div>
          <NavLink to="/settings"><Settings size={18} />设置</NavLink>
        </div>
      </aside>

      <div className="app-main">
        <GlassSurface className="topbar">
          <button className="icon-button menu-button" aria-label="打开菜单" aria-controls="primary-sidebar" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <Logo compact />
          <button className={`icon-button ${isSearch ? "is-active" : ""}`} aria-label="搜索" title="搜索" onClick={() => navigate(isSearch ? "/" : "/search")}><Search size={19} /></button>
        </GlassSurface>
        <main className="page-content"><Outlet /></main>
      </div>

      <Dock className="mobile-dock" aria-label="移动主导航">
        {navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === "/"}><Icon size={19} /><span>{label}</span></NavLink>)}
      </Dock>
      {mobileOpen && <button className="sidebar-backdrop" aria-label="关闭菜单" onClick={() => setMobileOpen(false)} />}
    </div>
  );
}
