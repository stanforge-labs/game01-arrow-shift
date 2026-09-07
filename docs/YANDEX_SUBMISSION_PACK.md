# Arrow Shift — Yandex Games submission pack

Готовые значения для заполнения черновика в Yandex Games Console. Перед сохранением сверяйте подсказки самой формы: обязательные поля и ограничения длины указаны в актуальном руководстве [«Заполнение черновика»](https://yandex.ru/dev/games/doc/ru/console/add-new-game/draft).

## 1. Общие поля

| Поле Console | Значение |
| --- | --- |
| Название | `Arrow Shift` |
| Версия | `1.0.0` |
| Архив | `release/arrow-shift-yandex-1.0.0.zip` |
| Поддерживаемые платформы | Desktop; Android Mobile |
| Ориентация | Portrait / Портретная |
| Игра переведена на | Русский, English |
| Возрастной рейтинг | `0+` — фактический контент без насилия, азартных механик, покупок, чата, UGC, хоррора и взрослого контента |
| Категории | Головоломки; Казуальные (вторая — только если доступна в форме) |
| Игра использует облачные сохранения | Да |
| Отсроченная публикация | Включить (рекомендация) |

В актуальной системе Яндекс возрастной рейтинг выбирается из пяти категорий, включая 0+; для Arrow Shift подходит 0+ по содержанию. Категорий можно выбрать не более двух, тегов — до 20, а ключевые слова вводятся в нижнем регистре и разделяются запятыми, с лимитом 100 символов. См. [требования к игре](https://yandex.ru/dev/games/doc/ru/concepts/requirements) и [описание полей черновика](https://yandex.ru/dev/games/doc/ru/console/add-new-game/draft).

### Платформы и ограничения

- Desktop и Android Mobile — проверенные целевые платформы этого RC.
- iOS и TV не заявлять: для них нет отдельного тестового прохода в этом этапе.
- Принудительная авторизация: **нет**. Игра работает без `openAuthDialog`.
- In-app purchases: **нет**.
- Rewarded ads: **нет**.
- Fullscreen ads: **да**, только через SDK после осознанных `Next`/`Again`, с session gate и cooldown; не во время активного gameplay.

## 2. Категории, теги и ключевые слова

**Теги RU:** `головоломки`, `логика`, `стрелки`, `маршрут`, `реакция`, `уровни`, `быстрая игра`

**Tags EN:** `puzzle`, `logic`, `arrows`, `route`, `reaction`, `levels`, `quick game`

**Ключевые слова RU:** `головоломка,логика,стрелки,сдвиг,маршрут,реакция,уровни,быстрая игра`

**Keywords EN:** `puzzle,logic,arrows,shift,route,reaction,levels,quick game`

## 3. Метаданные RU

### Короткое описание (до 70 символов)

`Три режима, где каждое направление стрелки меняет решение`

### Описание для SEO (50–160 символов)

`Спокойная логическая игра о стрелках, сдвигах, маршрутах и быстрых сериях ходов.`

### Об игре (100–1000 символов)

`Arrow Shift — спокойная головоломка с тремя режимами. В «Головоломках» вас ждут 30 уровней: убирайте свободные стрелки, учитывайте SHIFT, закреплённые стрелки и препятствия. В «Маршруте» поворачивайте стрелки и проводите сигнал от Старта к Цели в пределах лимита поворотов. В «Спринте» очищайте поля за ограниченное время, собирайте комбо и улучшайте рекорд. Короткие сессии подходят для одной задачи или быстрой серии.`

### Как играть (100–1000 символов)

`Головоломки: нажимайте на свободные стрелки, чтобы убрать их с поля; SHIFT меняет направления в соответствующей линии. Маршрут: поворачивайте обычные стрелки и проведите сигнал от Старта к Цели, не превышая лимит поворотов. Спринт: быстро очищайте поля, набирайте очки и комбо, пока идёт таймер. Закреплённые стрелки не вращаются, а препятствия блокируют физический путь.`

## 4. Метаданные EN

### Short description (up to 70 characters)

`Three arrow modes where every direction changes the puzzle`

### SEO description (50–160 characters)

`A calm logic game about arrows, shifts, routes and fast satisfying clears.`

### About game (100–1000 characters)

`Arrow Shift is a calm puzzle game with three modes. Puzzles offers 30 levels where you clear free arrows while planning SHIFT, pinned arrows and barriers. In Route, rotate arrows and guide a signal from Start to Target within the rotation limit. In Rush, clear boards against the clock, build combos and chase a higher record. Short sessions work for one thoughtful puzzle or a quick run.`

### How to play (100–1000 characters)

`Puzzles: tap free arrows to clear the board; SHIFT changes directions along the affected line. Route: rotate regular arrows and guide the signal from Start to Target without exceeding the rotation limit. Rush: clear boards quickly, score points and build combos while the timer runs. Pinned arrows do not rotate, and barriers block an arrow’s physical path.`

## 5. Комментарий разработчика

`Arrow Shift содержит три режима: 30 головоломок, 12 маршрутов и Спринт. Поддерживаются RU/EN, автоматический язык через Yandex environment, Game Ready, Gameplay API, локальные и облачные сохранения, управление звуком и fullscreen-реклама только после Next/Again. Авторизация не обязательна.`

Отсроченная публикация нужна, чтобы после одобрения вручную проверить карточку и нажать «Опубликовать». На модерацию этот черновик автоматически не отправлять.

## 6. Карта медиаматериалов

### Иконки и обложки

- Icon: `store-assets/icon/icon-512.png`
- Maskable icon: `store-assets/icon/icon-maskable-512.png`
- Cover: `store-assets/cover/cover-800x470.png`
- Storefront cover: `store-assets/storefront/storefront-1560x520.png`

### Скриншоты Mobile Android

- `store-assets/screenshots/mobile/01-mobile-puzzle.png`
- `store-assets/screenshots/mobile/02-mobile-puzzle-hard.png`
- `store-assets/screenshots/mobile/03-mobile-route.png`
- `store-assets/screenshots/mobile/04-mobile-rush.png`

### Скриншоты Desktop

- `store-assets/screenshots/desktop/01-desktop-puzzle.png`
- `store-assets/screenshots/desktop/02-desktop-puzzle-hard.png`
- `store-assets/screenshots/desktop/03-desktop-route.png`
- `store-assets/screenshots/desktop/04-desktop-rush.png`

`store-assets/media-audit.txt` — локальный аудит размеров, форматов и moderation checks; результат текущего набора — PASS. Иконка и обложка являются авторскими композициями, а скриншоты — реальными игровыми сценами без Yandex UI, браузерного chrome и fake badges.

## 7. RC integrity

- Архив: `release/arrow-shift-yandex-1.0.0.zip`
- SHA-256: `7cc32fb718cfe67b88aaf31512f7c7b017d42a5530bef24a7239591f93419c0f`
- `index.html` находится в корне архива.
- Распакованный размер: 85.5 KiB, меньше 100 MB.
- В runtime-путях нет пробелов, кириллицы и source maps; DEV/mock-файлы в production archive отсутствуют.
- ZIP и store-assets в этом этапе не изменялись.

## 8. Что не делать в Console

- Не нажимать «Отправить на модерацию» без отдельного подтверждения владельца.
- Не включать iOS, rewarded ads, покупки, лидерборды или forced authorization.
- Не заменять локальные настройки `language`, `musicOn`, `sfxOn` облачными игровыми данными.

См. также [режим черновика](https://yandex.ru/dev/games/doc/ru/console/draft-mode), [модерацию](https://yandex.ru/dev/games/doc/ru/concepts/moderation) и [официальные требования](https://yandex.ru/dev/games/doc/ru/concepts/requirements).
