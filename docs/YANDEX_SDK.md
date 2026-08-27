# Yandex Games SDK foundation

`src/platform/yandex.js` owns the platform boundary. The production `index.html` contains the single official `/sdk.js` script tag before the module entry; the adapter only observes the resulting `YaGames` global (including a short late-global wait) and never injects a second loader. It calls `YaGames.init()` once, caches the promise and SDK instance, and subscribes named handlers for `game_api_pause` / `game_api_resume`. Localhost uses the development mock when requested, while SDK failures fall back to a safe local no-op platform with a diagnostic log.

`LoadingAPI.ready()` is guarded and sent once after the custom boot screen is replaced by interactive Home. `GameplayAPI.start()` / `stop()` are idempotent and are called only for active Puzzle, Route or Rush play, result states, menus and platform pauses.

Platform pause reasons are coalesced with document visibility and window blur. Rush timers, Route signal scheduling, input and AudioManager are paused together and resumed only when the page is visible and the game was active before the pause.

The Yandex language is read during every successful startup from `environment.i18n.lang` (`ru` or `en`; unsupported values use English). An existing local save takes precedence, preserving a manual selection. `LoadingAPI.ready()` is sent only after that startup sequence and interactive Home are ready.

## Player and Cloud Save

`initPlatform()` calls `ysdk.getPlayer()` once and caches the Player. `src/save/cloudSave.js` stores only Puzzle/Route/Rush progress under `arrowShiftSave`. Local settings remain device-only. Cloud data is validated and merged monotonically: highest unlocks and records use max, route rotation bests use the lower positive value, and completion sets are united. Local storage is written first; cloud writes are dirty/debounced, coalesced and rate-limited. Player, network and malformed-data failures fall back to local play.

## Fullscreen Ads

`showFullscreenAd()` is the only ad boundary. It is requested only after an intentional Puzzle/Route Next or Rush Again action, after a 90-second session gate, two completions and a 120-second session cooldown. `onOpen`, `onClose` and `onError` are converted to a Promise result; the app adds/removes the `ad` pause reason so input, timers, gameplay marking and audio cannot resume under the ad. Localhost returns a safe no-op. Rewarded ads, purchases, forced auth and manual ad calls elsewhere are not connected.

Player cloud synchronization and fullscreen-ad behavior are covered by the development mock (`?platform=mock`); production still uses the official Yandex SDK surface.
