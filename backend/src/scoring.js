function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function calculateScore({ available, latencyMs, responseText }) {
  if (!available) {
    return 0;
  }

  const latencyScore = 1 - clamp(latencyMs / 20000, 0, 1);
  const lengthScore = clamp((responseText?.length ?? 0) / 600, 0, 1);

  const weighted = (0.75 * 1) + (0.2 * latencyScore) + (0.05 * lengthScore);

  return Math.round(weighted * 1000) / 10;
}
