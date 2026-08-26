# QA and release

Before a release: run unit tests, production build, levels report and `npm run content:report`; use Playwright with Yandex Browser at 360×800, 390×844, 412×915, 768×1024, 1280×720 and 1920×1080; exercise Home → Play/Continue, mode hub, level selection and locked states, blocked, exit, SHIFT, restart, win, dead-end, next level, Route rotate/Run/fail, Rush timer/score, storage, sound toggle, locale and console.

Do not commit `node_modules`, build output, debug captures or secrets.
