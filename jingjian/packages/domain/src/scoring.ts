export type ValueFeatures = {
  evidenceQuality: number;
  productImpact: number;
  informationGain: number;
  learningValue: number;
  recency: number;
};

export type HeatFeatures = {
  discussionVelocity: number;
  crossPlatformConcentration: number;
  independentSources: number;
  expertParticipation: number;
  recency: number;
};

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export function calculateValueScore(features: ValueFeatures): number {
  return Math.round(
    clamp(features.evidenceQuality) * 0.25 +
    clamp(features.productImpact) * 0.25 +
    clamp(features.informationGain) * 0.2 +
    clamp(features.learningValue) * 0.2 +
    clamp(features.recency) * 0.1
  );
}

export function calculateHeatScore(features: HeatFeatures): number {
  return Math.round(
    clamp(features.discussionVelocity) * 0.3 +
    clamp(features.crossPlatformConcentration) * 0.25 +
    clamp(features.independentSources) * 0.2 +
    clamp(features.expertParticipation) * 0.15 +
    clamp(features.recency) * 0.1
  );
}
