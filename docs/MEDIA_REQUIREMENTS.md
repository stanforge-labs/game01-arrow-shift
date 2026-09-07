# Media requirements — Prompt №24

Store media assets for the 1.0.0 candidate are authored in `store-assets/`.

- Icon: **512×512 PNG**.
- Maskable icon: **512×512 PNG** с безопасной зоной.
- Cover: **800×470 PNG**.
- Storefront cover: **1560×520 PNG/JPG**.
- Vertical video: **9:16, MP4, height ≥400 px, duration ≤28 s, ≤100 MB**.
- Horizontal video: **16:9, MP4, height ≥400 px, duration ≤28 s, ≤100 MB**.
- GIF: optional/deprecated; не планировать для первого релиза.

Материалы должны показывать реальный gameplay и основную механику; не использовать скриншоты интерфейса Яндекс Игр, fake badges, рейтинги, `NEW`, `TOP`, `BEST`, `18+`-имитации или UI платформы. Скриншоты для Console — landscape на desktop и portrait на mobile, без browser chrome и OS status bar.

Текущий комплект:

- `icon/` — 512×512 PNG и maskable-вариант с центральной safe zone;
- `cover/` — 800×470 PNG, самостоятельная векторная композиция;
- `storefront/` — 1560×520 PNG;
- `screenshots/mobile/` — четыре честных игровых кадра 720×1280;
- `screenshots/desktop/` — четыре честных игровых кадра 1280×720;
- `preview/` — внутренние preview и icon-size checks;
- `media-audit.txt` — автоматическая проверка формата, разрешения и размера.
