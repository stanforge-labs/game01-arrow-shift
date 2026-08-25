export const translations = {
  ru: {
    gameTitle: 'Arrow Shift', level: 'Уровень', restart: 'Заново', done: 'Готово', next: 'Дальше', noMoves: 'Ходов нет', tryAgain: 'Заново', firstHint: 'Нажми на свободную стрелку', shiftHint: 'Выход поворачивает стрелки в этой линии', language: 'EN', arrow: 'Стрелка', direction: { up: 'вверх', right: 'вправо', down: 'вниз', left: 'влево' },
  },
  en: {
    gameTitle: 'Arrow Shift', level: 'Level', restart: 'Restart', done: 'Done', next: 'Next', noMoves: 'No moves', tryAgain: 'Try again', firstHint: 'Tap a free arrow', shiftHint: 'Exiting rotates arrows in that line', language: 'RU', arrow: 'Arrow', direction: { up: 'up', right: 'right', down: 'down', left: 'left' },
  },
};

export function getText(language) {
  return translations[language] || translations.ru;
}
