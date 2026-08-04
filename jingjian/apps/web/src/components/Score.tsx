export function ScoreBar({ value, label, subtle = false }: { value: number; label: string; subtle?: boolean }) {
  return (
    <div className={`score-bar ${subtle ? "score-bar--subtle" : ""}`}>
      <span>{label}</span><div><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div><strong>{value}</strong>
    </div>
  );
}

export function VerificationBadge({ state }: { state: "verified" | "developing" | "unverified" }) {
  const label = state === "verified" ? "已验证" : state === "developing" ? "发展中" : "待验证";
  return <span className={`verification verification--${state}`}>{label}</span>;
}
