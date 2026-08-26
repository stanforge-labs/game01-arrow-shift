# Yandex Games SDK foundation

`src/platform/yandex.js` owns the platform boundary. On Yandex it loads the official `/sdk.js` path when needed, calls `YaGames.init()` once, and subscribes named handlers for `game_api_pause` / `game_api_resume`. Localhost and SDK failures fall back to a safe local no-op platform.

`LoadingAPI.ready()` is guarded and sent once after the custom boot screen is replaced by interactive Home. `GameplayAPI.start()` / `stop()` are idempotent and are called only for active Puzzle, Route or Rush play, result states, menus and platform pauses.

Platform pause reasons are coalesced with document visibility and window blur. Rush timers, Route signal scheduling, input and AudioManager are paused together and resumed only when the page is visible and the game was active before the pause.

The first Yandex language is read from `environment.i18n.lang` (`ru` or `en`; unsupported values use English). An existing local save takes precedence, preserving a manual selection. Player/cloud save and ad APIs are intentionally not connected yet; they are reserved for the next stage.
