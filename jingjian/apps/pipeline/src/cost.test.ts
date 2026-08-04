import { describe, expect, it } from "vitest";
import { calculateAiCost } from "./cost";

describe("calculateAiCost", () => {
  it("calculates Luna cost and converts it to CNY", () => {
    expect(calculateAiCost({
      model: "gpt-5.6-luna",
      inputTokens: 1_000_000,
      cachedInputTokens: 0,
      outputTokens: 100_000,
      cnyPerUsd: 7.2
    })).toEqual({ usd: 1.6, cny: 11.52 });
  });

  it("charges cached tokens as a subset of total input tokens", () => {
    expect(calculateAiCost({
      model: "gpt-5.6-luna",
      inputTokens: 1_000_000,
      cachedInputTokens: 600_000,
      outputTokens: 0,
      cnyPerUsd: 7.2
    }).usd).toBe(0.46);
  });

  it("uses the highest known price for a custom model name", () => {
    expect(calculateAiCost({
      model: "custom-model",
      inputTokens: 1_000_000,
      cachedInputTokens: 0,
      outputTokens: 100_000,
      cnyPerUsd: 7.2
    })).toEqual({ usd: 4, cny: 28.8 });
  });

  it("never turns invalid token counts into negative spend", () => {
    expect(calculateAiCost({
      model: "gpt-5.6-luna",
      inputTokens: -100,
      cachedInputTokens: -10,
      outputTokens: -20,
      cnyPerUsd: 7.2
    })).toEqual({ usd: 0, cny: 0 });
  });
});
