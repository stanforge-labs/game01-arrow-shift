# Arrow Shift — moderation checklist

Проверять черновик после загрузки `release/arrow-shift-yandex-1.0.0.zip` в Draft и с включённой отсроченной публикацией.

- [ ] SDK и `/sdk.js`
- [ ] Game Ready вызывается один раз после готовности Home
- [ ] Gameplay API start/stop соответствует реальному gameplay
- [ ] `game_api_pause` / `game_api_resume`
- [ ] Audio pause/resume и отсутствие autoplay до gesture
- [ ] Fullscreen ads только после Next/Again; нет automatic result ad
- [ ] Local save и reload
- [ ] Cloud save и monotonic merge
- [ ] RU flow: Home → Puzzle / Route / Rush
- [ ] EN flow: Home → Puzzle / Route / Rush
- [ ] Mobile portrait: 360×800, 390×844, 412×915
- [ ] Desktop: 1024×768, 1280×720, 1366×768, 1920×1080
- [ ] Нет context menu/right-click/long-press в gameplay area
- [ ] Console errors и unhandled rejections отсутствуют
- [ ] ZIP: `index.html` в корне
- [ ] ZIP: нет кириллицы/пробелов в путях
- [ ] ZIP: распакованный размер меньше 100 MB
- [ ] Console metadata заполнена
- [ ] Media placeholders/requirements проверены
- [ ] DEV/debug panel проверен в Draft

## Debug panel plan

1. Открыть Draft и запустить игру.
2. Открыть debug panel.
3. Проверить Game Ready.
4. Проверить Gameplay start/stop в Puzzle, Route и Rush.
5. Эмулировать RU/EN.
6. Проверить platform pause/resume.
7. Проверить доступность fullscreen ad и возврат после close/error.
8. Проверить reload, local progress и cloud merge.
9. Убедиться, что нет 404 и console errors.
