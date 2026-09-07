import { LEVELS } from '../game/levels.js';

export const RUSH_TEMPLATES = LEVELS.slice(0, 24).map((level, index) => ({
  ...level,
  id: `rush-${index + 1}`,
  tier: index < 2 ? 1 : index < 4 ? 2 : index < 8 ? 3 : 4,
}));

export function nextRushTemplateIndex(previousIndex, boardsCleared = 0, recentIndices = []) {
  const tier = boardsCleared < 2 ? 1 : boardsCleared < 4 ? 2 : boardsCleared < 6 ? 3 : 4;
  const recent = new Set(recentIndices.slice(-3));
  let candidates = RUSH_TEMPLATES.map((template, index) => ({ template, index })).filter(({ template, index }) => template.tier <= tier && index !== previousIndex && !recent.has(index));
  if (!candidates.length) candidates = RUSH_TEMPLATES.map((template, index) => ({ template, index })).filter(({ template, index }) => template.tier <= tier && index !== previousIndex);
  return candidates[(boardsCleared * 7 + Math.max(previousIndex, 0) + 1) % candidates.length].index;
}
