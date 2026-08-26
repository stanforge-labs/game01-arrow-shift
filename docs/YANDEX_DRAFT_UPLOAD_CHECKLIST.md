# Arrow Shift — Yandex Draft upload checklist

Чеклист ручного заполнения и финальной проверки черновика. Он не выполняет загрузку и не отправляет игру на модерацию.

## Перед загрузкой

- [ ] Открыта актуальная игра Arrow Shift в Yandex Games Console.
- [ ] Используется версия `1.0.0` и архив `release/arrow-shift-yandex-1.0.0.zip`.
- [ ] SHA-256 архива совпадает с `7cc32fb718cfe67b88aaf31512f7c7b017d42a5530bef24a7239591f93419c0f`.
- [ ] Локально пройдены `npm test`, `npm run release:audit`, `npm run media:audit`, `npm run levels:report`, `npm run content:report`.
- [ ] Store media берутся из `store-assets/`; архив и production build не пересобираются без отдельной причины.

## Пошаговая загрузка Draft

1. Открыть [Yandex Games Console](https://games.yandex.com/developers) и войти в аккаунт разработчика.
2. Выбрать Arrow Shift или нажать **Add game / Добавить игру**.
3. Создать **Draft / Черновик**.
4. Заполнить технические параметры: версия `1.0.0`, архив, Desktop + Android Mobile, Portrait.
5. Указать языки перевода: RU и EN. Проверить автоматическое определение по `environment.i18n.lang`.
6. Выбрать возрастной рейтинг `0+`, категорию **Головоломки** (при необходимости вторую — **Казуальные**), релевантные теги и ключевые слова из [submission pack](<C:\Yandex Games\01 Arrow Shift\docs\YANDEX_SUBMISSION_PACK.md>).
7. Включить **Игра использует облачные сохранения**.
8. Включить **Отсроченная публикация**.
9. Вставить RU metadata: SEO, короткое описание, «Об игре», «Как играть» и комментарий разработчика.
10. Переключить язык формы на EN и вставить EN metadata.
11. Загрузить icon, maskable icon, cover и storefront cover.
12. Загрузить четыре Mobile Android и четыре Desktop screenshots из submission pack.
13. При необходимости оставить видео/GIF пустыми: в этом RC они не являются частью обязательного набора.
14. Сохранить Draft и дождаться завершения обработки архива.
15. **Не нажимать «Отправить на модерацию».**
16. Открыть сохранённый Draft обычной ссылкой **Открыть черновик**.
17. Открыть **Открыть черновик с Debug Panel** и выполнить матрицу ниже.

Официальная последовательность открытия Draft, обычного режима и Debug Panel описана в [«Режиме черновика»](https://yandex.ru/dev/games/doc/ru/console/draft-mode). Перед отправкой модерация рекомендует тестировать Draft с debug-панелью и на всех заявленных платформах — см. [«Модерация»](https://yandex.ru/dev/games/doc/ru/concepts/moderation).

## Поля Console — контрольные значения

- [ ] Name: `Arrow Shift` (одинаков в RU/EN и в media).
- [ ] Version: `1.0.0`.
- [ ] Archive: `release/arrow-shift-yandex-1.0.0.zip`.
- [ ] Platforms: Desktop, Android Mobile.
- [ ] Orientation: Portrait.
- [ ] Languages: Russian, English.
- [ ] Age: 0+.
- [ ] Category: Puzzle / Головоломки; максимум две категории.
- [ ] Cloud save: Yes.
- [ ] Forced authorization: No.
- [ ] In-app purchases: No.
- [ ] Rewarded ads: No.
- [ ] Fullscreen ads: Yes, only after deliberate Next/Again and internal cooldown.
- [ ] Deferred publication: On.

## Debug Panel checks

### Game Ready и SDK

- [ ] Loader исчезает после реальной готовности UI, без искусственной задержки.
- [ ] `LoadingAPI.ready()` вызван ровно один раз.
- [ ] Нет ошибок SDK, uncaught promise rejection и console errors.
- [ ] В Network нет неожиданных 404; `/sdk.js` и runtime assets отвечают 200.

### Gameplay API

- [ ] Home, Level Select и result card не считаются активным gameplay.
- [ ] Puzzle: `start` после загрузки интерактивного уровня; `stop` на victory/dead-end/home/levels.
- [ ] Route: `start` после загрузки уровня; `stop` на complete/fail/home/levels.
- [ ] Rush: `start` при фактическом запуске сессии; `stop` при timer = 0/result/home.
- [ ] Повторный вход, Restart и смена языка не создают duplicate start/stop.

### Language

- [ ] Mock/debug `environment.i18n.lang = ru` открывает RU на чистом локальном сохранении.
- [ ] Mock/debug `environment.i18n.lang = en` открывает EN на чистом локальном сохранении.
- [ ] Ручной сохранённый язык имеет приоритет над environment language.
- [ ] Переключение RU ↔ EN обновляет текущий экран без reload и потери прогресса.

### Pause / resume

- [ ] `game_api_pause`: стрелки и Route Run недоступны, Rush timer заморожен, audio muted/paused.
- [ ] `game_api_resume`: продолжение происходит только на видимом игровом экране и после снятия всех pause reasons.
- [ ] Потеря и возврат focus не создают триггеров повторного resume.
- [ ] При pause во время результата или меню gameplay не запускается сам.

### Cloud save

- [ ] Player инициализируется один раз; forced auth не вызывается.
- [ ] Session A: прогресс Puzzle/Route/Rush сохраняется и переживает reload.
- [ ] Cloud впереди local: merge повышает unlock и объединяет completion sets.
- [ ] Local впереди cloud: прогресс не уменьшается, merged state ставится в writeback.
- [ ] Route best использует меньшее положительное число; Rush records — большее значение.
- [ ] Offline, malformed cloud или SDK failure не блокируют Home и оставляют local save.

### Fullscreen ads

- [ ] В Puzzle/Route реклама не открывается автоматически при появлении result.
- [ ] Запрос возможен только после осознанного **Next**; в Rush — после **Again**.
- [ ] Во время ad open gameplay stopped, input/timer/audio paused.
- [ ] `onClose(true)`, `onClose(false)` и `onError` снимают ad pause reason и продолжают pending navigation.
- [ ] Быстрый двойной Next/Again даёт максимум один ad request и один переход.
- [ ] Не вызывать rewarded video и не вызывать fullscreen ad вручную для обхода gate/cooldown.

## Финальная test matrix

Каждый пункт пройти в обычном Draft и повторить в Debug Panel, где это возможно.

| Область | Desktop | Android Mobile (Portrait) | Ожидание |
| --- | --- | --- | --- |
| Home | 1280×720, 1366×768, 1920×1080 | 360×800, 390×844, 412×915 | Home без body scroll, controls доступны |
| Puzzle 1 | Да | Да | старт, первый ход, victory |
| Puzzle 20 | Да | Да | Pinned/Barrier/SHIFT без regression |
| Puzzle 25 | Да | Да | result card, Restart, Next |
| Puzzle 30 | Да | Да | финальный result и возврат в Levels |
| Route 1 | Да | Да | Start → Target, rotation limit |
| Route 8 | Да | Да | pinned/trace, success и fail |
| Route 12 | Да | Да | final Route result, Next/Levels |
| Rush | Да | Да | timer, score, combo, clear, +4s, result |
| Result cards | Puzzle/Route/Rush | Puzzle/Route/Rush | card внутри viewport, secondary actions работают |
| Audio | Music/Sounds ON/OFF | Music/Sounds ON/OFF | без autoplay до gesture, настройки после reload |
| RU | все экраны | все экраны | нет смешения языков |
| EN | все экраны | все экраны | нет смешения языков |
| Platform pause | Debug event | Debug event | input/timer/audio pause и корректный resume |
| Cloud | Player session | Player session | monotonic merge и writeback |
| Ads | mock/eligible Draft flow | mock/eligible Draft flow | только Next/Again, no duplicate, no hang |
| Network/console | DevTools | DevTools | assets 200, console errors 0 |

## Если найден дефект

Не исправлять его в Console и не отправлять Draft на модерацию. Создать `docs/DRAFT_QA_ISSUES.md` с полями:

- severity;
- дата и build SHA;
- platform/viewport;
- точные шаги;
- expected;
- actual;
- console/network evidence.

После фикса нужен отдельный RC 1.0.1. Если реальный Draft URL и аккаунт недоступны, статус этого этапа: **Draft QA — NOT RUN**; локальные проверки не заменяют проверку реального Draft.

## Если вся матрица пройдена

Создать `docs/DRAFT_QA_PASS.md` с датой, SHA, платформами, результатами Debug Panel, console/network errors и ссылкой на Draft. Не создавать этот файл без реального Draft QA. Последний ручной шаг остаётся за владельцем: после проверки нажать «Отправить на модерацию» только отдельным подтверждённым действием.
