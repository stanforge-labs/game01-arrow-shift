# QA and release

Before a release: run unit tests, production build and levels report; use Playwright with Yandex Browser at 360×800, 390×844, 412×915, 768×1024, 1280×720 and 1920×1080; exercise Home → Play/Continue, level selection and locked states, blocked, exit, SHIFT, restart, win, dead-end, next level, storage, sound toggle, locale and console.

Do not commit `node_modules`, build output, debug captures or secrets.
