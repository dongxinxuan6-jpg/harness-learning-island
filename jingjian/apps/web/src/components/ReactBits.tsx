import type { HTMLAttributes, PropsWithChildren } from "react";

export function GlassSurface({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`glass-surface ${className}`} {...props} />;
}

export function SpotlightCard({ className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={`spotlight-card ${className}`} {...props} />;
}

export function AnimatedList({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <div className={`animated-list ${className}`}>{children}</div>;
}

export function Dock({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <nav className={`dock ${className}`}>{children}</nav>;
}
