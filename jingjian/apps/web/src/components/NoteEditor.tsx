import { useEffect, useRef, useState } from "react";
import { getNote, saveNote, type SavedRecord } from "../state/learningDb";

export function NoteEditor({ entityType, entityId }: { entityType: SavedRecord["entityType"]; entityId: string }) {
  const [text, setText] = useState("");
  const [state, setState] = useState("已保存");
  const edited = useRef(false);
  const editVersion = useRef(0);
  const activeEntity = useRef("");
  const pendingSave = useRef<Promise<void> | null>(null);
  const entityKey = `${entityType}:${entityId}`;
  activeEntity.current = entityKey;
  useEffect(() => {
    let active = true;
    edited.current = false;
    editVersion.current += 1;
    setText("");
    setState("已保存");
    getNote(entityType, entityId).then((value) => {
      if (active && !edited.current) setText(value);
    }).catch(() => { if (active) setState("笔记读取失败"); });
    return () => { active = false; };
  }, [entityId, entityType]);

  const persist = async () => {
    const version = editVersion.current;
    const savedEntity = entityKey;
    const savedText = text;
    const task = pendingSave.current
      ? pendingSave.current.then(() => saveNote(entityType, entityId, savedText))
      : saveNote(entityType, entityId, savedText);
    const queueTail = task.then(() => undefined, () => undefined);
    pendingSave.current = queueTail;
    void queueTail.then(() => {
      if (pendingSave.current === queueTail) pendingSave.current = null;
    });

    try {
      await task;
      if (activeEntity.current === savedEntity && editVersion.current === version) setState("已保存");
    } catch {
      if (activeEntity.current === savedEntity && editVersion.current === version) setState("保存失败，请重试");
    }
  };

  return (
    <section className="note-editor">
      <div className="section-heading"><h2>我的笔记</h2><span>{state}</span></div>
      <textarea value={text} aria-label="我的笔记" placeholder="记录你的产品判断" onChange={(event) => { edited.current = true; editVersion.current += 1; setText(event.target.value); setState("编辑中"); }} onBlur={persist} />
    </section>
  );
}
