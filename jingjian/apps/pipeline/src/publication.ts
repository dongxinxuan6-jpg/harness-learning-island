import type { ContentItem } from "@jingjian/domain";

export type DailyPublication = {
  date: string;
  generatedAt: string;
  status: "published" | "partial" | "stale";
  totalReadMinutes: number;
  items: ContentItem[];
};

export function getBeijingDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
}

export function validateDailyPublication(daily: DailyPublication, expectedDate: string): string[] {
  const errors: string[] = [];
  if (daily.date !== expectedDate) errors.push(`snapshot date ${daily.date} does not match ${expectedDate}`);
  if (daily.status !== "published") errors.push(`snapshot status is ${daily.status}`);
  if (daily.items.length < 5 || daily.items.length > 10) errors.push(`published item count is ${daily.items.length}`);
  if (daily.totalReadMinutes > 15) errors.push(`reading time is ${daily.totalReadMinutes} minutes`);
  const incomplete = daily.items.filter((item) => item.sources.length === 0 || item.sources.some((source) => !source.url));
  if (incomplete.length > 0) errors.push(`${incomplete.length} items are missing traceable evidence`);
  return errors;
}

export function shouldPublishContentSnapshots(ingestionStatus: "succeeded" | "partial" | "failed"): boolean {
  return ingestionStatus !== "failed";
}

export function getDailyPublicationStatus(newContentCount: number): DailyPublication["status"] {
  return newContentCount > 0 ? "published" : "stale";
}
