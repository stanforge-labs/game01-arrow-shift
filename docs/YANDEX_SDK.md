# Yandex Games SDK foundation

`src/platform/yandex.js` owns the platform boundary. On Yandex it loads the official `/sdk.js` path when needed, calls `YaGames.init()` once, and subscribes named handlers for `game_api_pause` / `game_api_resume`. Localhost and SDK failures fall back to a safe local no-op platform.

`LoadingAPI.ready()` is guarded and sent once after the custom boot screen is replaced by interactive Home. `GameplayAPI.start()` / `stop()` are idempotent and are called only for active Puzzle, Route or Rush play, result states, menus and platform pauses.

Platform pause reasons are coalesced with document visibility and window blur. Rush timers, Route signal scheduling, input and AudioManager are paused together and resumed only when the page is visible and the game was active before the pause.

The first Yandex language is read from `environment.i18n.lang` (`ru` or `en`; unsupported values use English). An existing local save takes precedence, preserving a manual selection.

## Player and Cloud Save

`initPlatform()` calls `ysdk.getPlayer()` once and caches the Player. `src/save/cloudSave.js` stores only Puzzle/Route/Rush progress under `arrowShiftSave`. Local settings remain device-only. Cloud data is validated and merged monotonically: highest unlocks and records use max, route rotation bests use the lower positive value, and completion sets are united. Local storage is written first; cloud writes are dirty/debounced, coalesced and rate-limited. Player, network and malformed-data failures fall back to local play.

## Fullscreen Ads

`showFullscreenAd()` is the only ad boundary. It is requested only after an intentional Puzzle/Route Next or Rush Again action, after a 90-second session gate, two completions and a 120-second session cooldown. `onOpen`, `onClose` and `onError` are converted to a Promise result; the app adds/removes the `ad` pause reason so input, timers, gameplay marking and audio cannot resume under the ad. Localhost returns a safe no-op. Rewarded ads, purchases, forced auth and manual ad calls elsewhere are not connected.

Player cloud synchronization and fullscreen-ad behavior are covered by the development mock (`?platform=mock`); production still uses the official Yandex SDK surface.
