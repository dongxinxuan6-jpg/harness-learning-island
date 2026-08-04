import { openDB, type DBSchema } from "idb";
import { z } from "zod";

const entityTypeSchema = z.enum(["content", "product", "project"]);
const progressRecordSchema = z.object({
  nodeId: z.string().trim().min(1),
  percent: z.number().finite().min(0).max(100),
  updatedAt: z.string().datetime()
});
const savedRecordSchema = z.object({
  id: z.string().trim().min(1),
  entityType: entityTypeSchema,
  entityId: z.string().trim().min(1),
  savedAt: z.string().datetime()
}).refine((record) => record.id === `${record.entityType}:${record.entityId}`);
const noteRecordSchema = z.object({
  id: z.string().trim().min(1),
  entityType: entityTypeSchema,
  entityId: z.string().trim().min(1),
  text: z.string(),
  updatedAt: z.string().datetime()
}).refine((record) => record.id === `${record.entityType}:${record.entityId}`);
const learningDataSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  progress: z.array(progressRecordSchema),
  saved: z.array(savedRecordSchema),
  notes: z.array(noteRecordSchema)
});

type ProgressRecord = z.infer<typeof progressRecordSchema>;
export type SavedRecord = z.infer<typeof savedRecordSchema>;
type NoteRecord = z.infer<typeof noteRecordSchema>;

interface LearningDatabase extends DBSchema {
  progress: { key: string; value: ProgressRecord };
  saved: { key: string; value: SavedRecord };
  notes: { key: string; value: NoteRecord };
}

const db = () => openDB<LearningDatabase>("jingjian-learning", 1, {
  upgrade(database) {
    database.createObjectStore("progress", { keyPath: "nodeId" });
    database.createObjectStore("saved", { keyPath: "id" });
    database.createObjectStore("notes", { keyPath: "id" });
  }
});

export async function setLearningProgress(nodeId: string, percent: number): Promise<void> {
  const database = await db();
  await database.put("progress", { nodeId, percent: Math.min(100, Math.max(0, percent)), updatedAt: new Date().toISOString() });
}

export async function getLearningProgress(): Promise<ProgressRecord[]> {
  return (await db()).getAll("progress");
}

export async function toggleSaved(entityType: SavedRecord["entityType"], entityId: string): Promise<boolean> {
  const database = await db();
  const id = `${entityType}:${entityId}`;
  if (await database.get("saved", id)) {
    await database.delete("saved", id);
    return false;
  }
  await database.put("saved", { id, entityType, entityId, savedAt: new Date().toISOString() });
  return true;
}

export async function getSavedItems(): Promise<SavedRecord[]> {
  return (await db()).getAll("saved");
}

export async function isSaved(entityType: SavedRecord["entityType"], entityId: string): Promise<boolean> {
  return Boolean(await (await db()).get("saved", `${entityType}:${entityId}`));
}

export async function getLocalDataSummary(): Promise<{ progress: number; saved: number; notes: number }> {
  const database = await db();
  const [progress, saved, notes] = await Promise.all([
    database.count("progress"),
    database.count("saved"),
    database.count("notes")
  ]);
  return { progress, saved, notes };
}

export async function saveNote(entityType: SavedRecord["entityType"], entityId: string, text: string): Promise<void> {
  const id = `${entityType}:${entityId}`;
  await (await db()).put("notes", { id, entityType, entityId, text, updatedAt: new Date().toISOString() });
}

export async function getNote(entityType: SavedRecord["entityType"], entityId: string): Promise<string> {
  return (await (await db()).get("notes", `${entityType}:${entityId}`))?.text ?? "";
}

export async function exportLearningData() {
  const database = await db();
  return {
    version: 1 as const,
    exportedAt: new Date().toISOString(),
    progress: await database.getAll("progress"),
    saved: await database.getAll("saved"),
    notes: await database.getAll("notes")
  };
}

export async function importLearningData(value: unknown): Promise<void> {
  const parsed = learningDataSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error("学习数据文件格式不正确");
  }
  const data = parsed.data;
  const database = await db();
  const transaction = database.transaction(["progress", "saved", "notes"], "readwrite");
  await Promise.all([
    ...data.progress.map((record) => transaction.objectStore("progress").put(record)),
    ...data.saved.map((record) => transaction.objectStore("saved").put(record)),
    ...data.notes.map((record) => transaction.objectStore("notes").put(record)),
    transaction.done
  ]);
}

export async function clearLearningData(): Promise<void> {
  const database = await db();
  const transaction = database.transaction(["progress", "saved", "notes"], "readwrite");
  await Promise.all([
    transaction.objectStore("progress").clear(),
    transaction.objectStore("saved").clear(),
    transaction.objectStore("notes").clear(),
    transaction.done
  ]);
}
