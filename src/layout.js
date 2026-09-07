const PAGE_HORIZONTAL_PADDING = 28;
const RESERVED_VERTICAL_SPACE = 150;
const BOARD_BORDER = 2;

export function getLayoutMetrics(level, { viewportWidth, viewportHeight }) {
  const gridSize = Math.max(level.rows, level.cols);
  const desktopTarget = 220 + (gridSize * 50);
  const target = viewportWidth < 700
    ? Math.round(desktopTarget * 0.89)
    : Math.round(desktopTarget * (viewportWidth >= 1100 ? 1.12 : 1));
  const requestedBoard = Math.min(
    target,
    Math.max(0, viewportWidth - PAGE_HORIZONTAL_PADDING),
    Math.max(0, viewportHeight - RESERVED_VERTICAL_SPACE),
  );
  const boardPadding = Math.max(12, Math.min(22, Math.round(requestedBoard * 0.04)));
  const requestedGrid = Math.max(1, requestedBoard - (boardPadding * 2) - BOARD_BORDER);
  const cellSize = Math.max(1, Math.floor(requestedGrid / gridSize));
  const gridPixelSize = cellSize * gridSize;
  const boardSize = gridPixelSize + (boardPadding * 2) + BOARD_BORDER;

  return {
    gridSize,
    boardPadding,
    boardSize,
    cellSize,
    gridPixelSize,
    tileSize: 120 - (gridSize * 8),
  };
}
