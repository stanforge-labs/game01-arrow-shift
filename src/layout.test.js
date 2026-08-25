import { describe, expect, it } from 'vitest';
import { getLayoutMetrics } from './layout.js';

describe('pixel-aligned layout metrics', () => {
  it.each([3, 4, 5, 6])('keeps %ix%i cells integral at mobile width', (gridSize) => {
    const layout = getLayoutMetrics({ rows: gridSize, cols: gridSize }, { viewportWidth: 390, viewportHeight: 844 });
    expect(Number.isInteger(layout.cellSize)).toBe(true);
    expect(layout.gridPixelSize % gridSize).toBe(0);
    expect(layout.gridPixelSize).toBe(layout.cellSize * gridSize);
    expect(layout.boardSize).toBe(layout.gridPixelSize + (layout.boardPadding * 2) + 2);
  });

  it.each([3, 4, 5, 6])('keeps %ix%i cells integral at desktop width', (gridSize) => {
    const layout = getLayoutMetrics({ rows: gridSize, cols: gridSize }, { viewportWidth: 1920, viewportHeight: 1080 });
    expect(Number.isInteger(layout.cellSize)).toBe(true);
    expect(layout.gridPixelSize % gridSize).toBe(0);
  });
});
