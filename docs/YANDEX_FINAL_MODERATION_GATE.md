# Yandex Final Moderation Gate

Generated: 2026-09-07T17:09:32.175Z

This local gate covers the confirmed desktop context-menu/selection rejection and the applicable technical checks that can be automated locally. Native Yandex Debug Panel, real Yandex Draft, iOS native callouts and Firefox/Safari certification still require platform/device verification.

| Check | Evidence | Result |
|---|---|---|
| Central input protection source | src/inputProtection.js capture guards contextmenu/selectstart/dragstart | PASS |
| Mobile selection/callout CSS | #app user-select none, -webkit-user-select none, -webkit-touch-callout none | PASS |
| Official SDK loader | index.html /sdk.js before module entry | PASS |
| Desktop contextmenu .board | Chromium CDP right-click; preventDefault observed in capture phase | PASS |
| Desktop contextmenu button.arrow-tile | Chromium CDP right-click; preventDefault observed in capture phase | PASS |
| Desktop contextmenu .level-label | Chromium CDP right-click; preventDefault observed in capture phase | PASS |
| Desktop contextmenu button | Chromium CDP right-click; preventDefault observed in capture phase | PASS |
| Desktop text selection | Chromium CDP drag over .level-label | PASS |
| Desktop normal click | arrow tile count 1 -> 0 | PASS |
| Android-like long press | Chromium touchStart held 1100ms on board; contextmenu prevented and selection empty | PASS |
| Mobile scroll/overflow | document scrollHeight/clientHeight at 360x800 | PASS |
| WebKit CSS protection | styles.css contains WebKit selection/callout protections | PASS |
| Native iOS callout | WebKit binary unavailable in local automation environment | N/A |

## Totals

- PASS: 12
- FAIL: 0
- N/A / external verification required: 1

## Real Yandex

- Live Draft verification: REQUIRED after uploading RC 1.0.4.
- Debug Panel expected: SDK loader IT, I18N used, Game Ready green.
- Native iOS callout verification: REAL DEVICE REQUIRED.
