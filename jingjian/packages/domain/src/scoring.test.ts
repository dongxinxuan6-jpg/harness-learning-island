import { describe, expect, it } from "vitest";
import { calculateHeatScore, calculateValueScore } from "./scoring";

describe("calculateValueScore", () => {
  it("uses the fixed 25/25/20/20/10 weights", () => {
    expect(calculateValueScore({
      evidenceQuality: 100,
      productImpact: 80,
      informationGain: 60,
      learningValue: 40,
      recency: 20
    })).toBe(67);
  });

  it("clamps feature values to the 0-100 range", () => {
    expect(calculateValueScore({
      evidenceQuality: 120,
      productImpact: -20,
      informationGain: 100,
      learningValue: 100,
      recency: 100
    })).toBe(75);
  });
});

describe("calculateHeatScore", () => {
  it("uses the fixed 30/25/20/15/10 weights", () => {
    expect(calculateHeatScore({
      discussionVelocity: 100,
      crossPlatformConcentration: 80,
      independentSources: 60,
      expertParticipation: 40,
      recency: 20
    })).toBe(70);
  });
});
