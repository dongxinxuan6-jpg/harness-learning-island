import { Bookmark } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { isSaved, toggleSaved } from "../state/learningDb";

export function SaveButton({ entityType, entityId }: { entityType: "content" | "product" | "project"; entityId: string }) {
  const [saved, setSaved] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "saving" | "load-error" | "toggle-error">("loading");
  const requestId = useRef(0);
  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setSaved(false);
    setState("loading");
    try {
      const value = await isSaved(entityType, entityId);
      if (requestId.current === currentRequest) { setSaved(value); setState("ready"); }
    } catch {
      if (requestId.current === currentRequest) setState("load-error");
    }
  }, [entityId, entityType]);
  useEffect(() => {
    void load();
    return () => { requestId.current += 1; };
  }, [load]);
  const toggle = async () => {
    if (state === "load-error") { await load(); return; }
    if (state !== "ready" && state !== "toggle-error") return;
    const currentRequest = ++requestId.current;
    setState("saving");
    try {
      const value = await toggleSaved(entityType, entityId);
      if (requestId.current === currentRequest) { setSaved(value); setState("ready"); }
    } catch {
      if (requestId.current === currentRequest) setState("toggle-error");
    }
  };
  const label = state === "loading" ? "读取收藏状态"
    : state === "saving" ? saved ? "正在取消收藏" : "正在收藏"
    : state === "load-error" ? "收藏状态读取失败，重试"
    : state === "toggle-error" ? saved ? "取消收藏失败，重试" : "收藏失败，重试"
    : saved ? "取消收藏" : "收藏";
  return <button disabled={state === "loading" || state === "saving"} className={`icon-button ${saved ? "is-active" : ""}`} title={label} aria-label={label} onClick={toggle}><Bookmark size={18} fill={saved ? "currentColor" : "none"} /></button>;
}
