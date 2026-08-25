export const translations = {
  ru: {
    gameTitle: 'Arrow Shift', level: 'Уровень', restart: 'Заново', done: 'Готово', next: 'Дальше', noMoves: 'Ходов нет', tryAgain: 'Заново', shiftHint: 'Выход поворачивает стрелки в этой линии.', language: 'English', arrow: 'Стрелка', direction: { up: 'вверх', right: 'вправо', down: 'вниз', left: 'влево' },
  },
  en: {
    gameTitle: 'Arrow Shift', level: 'Level', restart: 'Restart', done: 'Done', next: 'Next', noMoves: 'No moves', tryAgain: 'Try again', shiftHint: 'An exit turns the arrows on that line.', language: 'Русский', arrow: 'Arrow', direction: { up: 'up', right: 'right', down: 'down', left: 'left' },
  },
};

export function getText(language) {
  return translations[language] || translations.ru;
}
