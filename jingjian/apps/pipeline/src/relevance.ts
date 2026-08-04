import type { RawCandidate } from "./types";

const TERMS = [
  "ai glasses",
  "ai eyewear",
  "smart glasses",
  "smart eyewear",
  "display glasses",
  "intelligent eyewear",
  "ar glasses",
  "xr glasses",
  "android xr",
  "ray-ban meta",
  "rayban meta",
  "oakley meta",
  "meta glasses",
  "xreal",
  "rokid",
  "rayneo",
  "even realities",
  "halliday",
  "brilliant labs",
  "snap spectacles",
  "mentra",
  "openglass",
  "ai 眼镜",
  "ai眼镜",
  "智能眼镜",
  "显示眼镜",
  "空间计算眼镜",
  "第一视角理解",
  "眼镜光波导"
] as const;

export function isLikelyAiGlassesContent(candidate: RawCandidate): boolean {
  const text = `${candidate.title} ${candidate.text.slice(0, 6_000)}`.toLowerCase().replace(/\s+/g, " ");
  return TERMS.some((term) => text.includes(term));
}
