import type { ContentItem, FrontierSignal } from "@jingjian/domain";
import type { SnapshotDataset } from "./snapshots";

type RichWeekly = SnapshotDataset["weekly"][number];

export function getBeijingIsoWeek(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const date = new Date(Date.UTC(Number(value.year), Number(value.month) - 1, Number(value.day)));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const weekYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `${weekYear}-W${String(week).padStart(2, "0")}`;
}

export function isBeijingMonday(now: Date): boolean {
  return new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Shanghai", weekday: "short" }).format(now) === "Mon";
}

export function buildCurrentWeekly(
  base: RichWeekly,
  now: Date,
  contents: ContentItem[] = [],
  signals: FrontierSignal[] = []
): RichWeekly {
  const isoWeek = getBeijingIsoWeek(now);
  if (base.isoWeek === isoWeek && base.editorial) return { ...base, generatedAt: now.toISOString() };

  const weekNumber = Number(isoWeek.slice(-2));
  const weeklyContents = [...contents]
    .sort((left, right) => right.score.value - left.score.value || right.score.heat - left.score.heat)
    .slice(0, 3);
  const weeklySignals = [...signals].sort((left, right) => right.impact - left.impact).slice(0, 3);
  const lead = weeklyContents[0];
  const signal = weeklySignals[0];
  const developing = [...contents].sort((left, right) => right.score.heat - left.score.heat)
    .find((item) => item.score.verification !== "verified");
  const topic = lead?.tags[0] ?? signal?.category ?? "AI 眼镜产品进展";

  return {
    isoWeek,
    generatedAt: now.toISOString(),
    editorial: false,
    title: `第 ${weekNumber} 周：${topic}`,
    thesis: lead
      ? `${lead.title}是本周最值得建立产品判断的变化。${lead.productImpact}`
      : "本周有效证据仍在积累，暂不形成新的产品路线结论。",
    contentIds: weeklyContents.map((item) => item.id),
    signalIds: weeklySignals.map((item) => item.id),
    sections: [
      {
        title: "长期信号",
        body: signal ? `${signal.title}。${signal.summary}` : "本周尚未出现证据充分的新增长期技术信号。"
      },
      {
        title: "短期噪音",
        body: developing ? `${developing.title}仍处于“发展中”，需要继续核对独立来源、交付状态与真实体验。` : "本周高价值条目均有可追溯证据，仍需区分发布信息与长期产品影响。"
      },
      {
        title: "下周学习",
        body: lead ? `围绕“${lead.beginnerNote}”，继续拆解相关产品的用户场景、软硬件链路与体验取舍。` : "继续完成产品形态基础与软硬件系统拆解。"
      }
    ]
  };
}
