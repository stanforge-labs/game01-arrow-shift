export const translations = {
  ru: {
    gameTitle: 'Arrow Shift', level: 'Уровень', restart: 'Заново', done: 'Готово', allDone: 'Все уровни пройдены', startOver: 'Сначала', next: 'Дальше', noMoves: 'Ходов нет', tryAgain: 'Заново', firstHint: 'Нажми на свободную стрелку', shiftHint: 'Выход поворачивает стрелки в этой линии', pinnedHint: 'Закреплённые стрелки не поворачиваются', language: 'EN', arrow: 'Стрелка', pinned: 'закреплена', direction: { up: 'вверх', right: 'вправо', down: 'вниз', left: 'влево' },
  },
  en: {
    gameTitle: 'Arrow Shift', level: 'Level', restart: 'Restart', done: 'Done', allDone: 'All levels complete', startOver: 'Start over', next: 'Next', noMoves: 'No moves', tryAgain: 'Try again', firstHint: 'Tap a free arrow', shiftHint: 'Exiting rotates arrows in that line', pinnedHint: "Pinned arrows don't rotate", language: 'RU', arrow: 'Arrow', pinned: 'pinned', direction: { up: 'up', right: 'right', down: 'down', left: 'left' },
  },
};

export function getText(language) {
  return translations[language] || translations.ru;
}
