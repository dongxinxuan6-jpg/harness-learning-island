export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "brand--compact" : ""}`} aria-label="镜见 AI眼镜产品与技术">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 64 28" focusable="false">
          <circle cx="16" cy="14" r="11" fill="currentColor" stroke="currentColor" strokeWidth="2" />
          <circle cx="48" cy="14" r="11" fill="#fff" stroke="currentColor" strokeWidth="2" />
          <path d="M27 14h10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </span>
      <span className="brand-copy"><strong>镜见</strong>{!compact && <small>AI眼镜产品与技术</small>}</span>
    </div>
  );
}
