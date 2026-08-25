const makeLevel = (id, title, rows, cols, arrows) => ({
  id,
  title,
  rows,
  cols,
  arrows: arrows.map(([row, col, direction], index) => ({ id: `l${id}-${index + 1}`, row, col, direction })),
});

export const LEVELS = [
  makeLevel(1, 'Первый выход', 3, 3, [[1, 1, 'up']]),
  makeLevel(2, 'Край поля', 3, 3, [[1, 0, 'left'], [1, 2, 'right']]),
  makeLevel(3, 'Поверни линию', 3, 3, [[1, 0, 'right'], [1, 1, 'down']]),
  makeLevel(4, 'Небольшой сдвиг', 3, 3, [[1, 0, 'right'], [1, 1, 'down'], [2, 1, 'left']]),
  makeLevel(5, 'Сначала край', 4, 4, [[1, 0, 'right'], [1, 1, 'down'], [2, 1, 'left'], [2, 2, 'up']]),
  makeLevel(6, 'Две линии', 4, 4, [[1, 0, 'right'], [1, 1, 'down'], [2, 1, 'left'], [2, 2, 'up'], [3, 2, 'left']]),
  makeLevel(7, 'Цепочка', 4, 4, [[1, 0, 'right'], [1, 1, 'down'], [2, 1, 'left'], [2, 2, 'up'], [3, 2, 'left'], [3, 3, 'up']]),
  makeLevel(8, 'Перекрёсток', 4, 4, [[1, 0, 'right'], [1, 1, 'down'], [2, 1, 'left'], [2, 2, 'up'], [3, 2, 'left'], [3, 3, 'up'], [0, 3, 'right']]),
  makeLevel(9, 'Точный порядок', 5, 5, [[0, 2, 'down'], [1, 1, 'right'], [1, 2, 'down'], [1, 3, 'left'], [2, 1, 'down'], [2, 2, 'left'], [2, 3, 'up']]),
  makeLevel(10, 'Финальная связка', 3, 3, [[1, 0, 'up'], [1, 2, 'up'], [0, 2, 'up'], [1, 1, 'up'], [2, 0, 'up']]),
];
