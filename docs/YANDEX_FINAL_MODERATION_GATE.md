# Arrow Shift — Yandex Final Moderation Gate

Generated: 2026-09-07

Scope: confirmed context-menu/selection rejection and applicable Yandex requirements checked locally. `PASS` includes code or automated evidence. Requirements that need real Yandex Draft/device are marked `N/A — LIVE DRAFT REQUIRED`; none are silently `UNTESTED`.

## Technical (Section 1)

| Requirement | Applicable | Evidence | Result |
|---|---:|---|---|
| 1.1 SDK | Yes | One `/sdk.js` before module; adapter tests | PASS |
| 1.2 / 1.2.2 guest play | Yes | No auth gate; local save | PASS |
| 1.3 focus-loss audio | Yes | visibility/blur/pagehide pause reasons; tests | PASS |
| 1.6 device requirements | Yes | Chromium local; other browsers/platforms external | N/A — LIVE DRAFT REQUIRED |
| 1.6.1.1 fullscreen/mobile | Yes | 360×800 smoke, no overflow | PASS |
| 1.6.1.5 gestures | Yes | Touch remains enabled; no touchstart blocker | PASS |
| 1.6.1.6 system video | Yes | No system player used | PASS |
| 1.6.1.8 long tap | Yes | Chromium touch test; WebKit CSS | PASS (iOS device check required) |
| 1.6.2.1 desktop active area | Yes | Responsive layout; 1280×720 smoke | PASS |
| 1.6.2.2 aspect/layout | Yes | Layout metrics and smoke | PASS |
| 1.6.2.4 mouse/keyboard | Yes | Normal click removed arrow | PASS |
| 1.6.2.5 system video | Yes | No system player used | PASS |
| 1.6.2.6 reserved shortcuts | Yes | No reserved shortcut handlers | PASS |
| 1.6.2.7 context/selection | Yes | Capture guards; Chromium right-click/selection | PASS |
| 1.7 no S3 URLs | Yes | Source search | PASS |
| 1.8 hit sizes | Yes | Minimum 44px controls/tiles | PASS |
| 1.9 persistence | Yes | Storage/cloud tests | PASS |
| 1.10.1 clipping | Yes | Responsive layout smoke | PASS |
| 1.10.2 scroll/swipe refresh | Yes | `overflow:hidden`; scrollHeight check | PASS |
| 1.10.3 overlap | Yes | Layout smoke | PASS |
| 1.10.4 no browser scroll needed | Yes | 360×800 smoke | PASS |
| 1.11 cloud toggle | Yes | Existing cloud adapter | N/A — LIVE CONSOLE CHECK |
| 1.12 monetization | Yes | Yandex SDK fullscreen wrapper only | PASS |
| 1.14 interaction errors | Yes | Vitest + moderation gate | PASS locally; LIVE DRAFT REQUIRED |
| 1.15 finished game | Yes | Three production modes; no dev UI | PASS |
| 1.18 URL independence | Yes | Local HTTP smoke; no S3 URLs | PASS |
| 1.19.1 SDK init | Yes | Loader order and adapter tests | PASS |
| 1.19.2 LoadingAPI | Yes | Idempotent implementation/tests | PASS |
| 1.19.3 GameplayAPI | Yes | Existing state manager/tests | PASS |
| 1.19.4 pause/resume | Yes | Reason-based pause/tests | PASS |
| 1.20 browser/platform matrix | Yes | Chromium local; Firefox/WebKit/Yandex external | N/A — LIVE DRAFT REQUIRED |
| 1.21 size | Yes | Release audit <100 MB | PASS |
| 1.22 archive | Yes | Root index/safe names audit | PASS |
| 1.23 interactive AI | Yes | None present | PASS |

## User experience (Section 2)

| Requirement | Applicable | Evidence | Result |
|---|---:|---|---|
| 2.1 quality | Yes | Existing production UI/media audit | PASS locally; moderation external |
| 2.2 controls explained | Yes | Hints and Route labels | PASS |
| 2.3 genre | Yes | Puzzle/logic gameplay | PASS |
| 2.4 mechanics | Yes | Three modes | PASS |
| 2.6 progress/records | Yes | Storage/cloud tests | PASS |
| 2.7 age rating | Yes | No prohibited/adult content | PASS |
| 2.8 progression | Yes | 30 Puzzle + 12 Route levels | PASS |
| 2.9 >10 minutes | Yes | Puzzle 30 + Route 12 + replayable Rush | PASS |
| 2.10 localization | Yes | RU/EN translations | PASS |
| 2.14 auto-language | Yes | Startup `environment.i18n.lang` read | PASS; live confirmation required |

## Content (Section 3)

| Requirement | Applicable | Evidence | Result |
|---|---:|---|---|
| 3.4 prohibited content | Yes | Abstract arrows/tiles only | PASS |
| 3.5 rights | Yes | Own SVG/CSS/gameplay assets | PASS |
| 3.6 duplicate/copy | Yes | Original content | PASS |
| 3.7 real-money/gambling | Yes | None present | PASS |
| 3.9 external video player | No | No in-game player | N/A |

## Advertising (Section 4)

| Requirement | Applicable | Evidence | Result |
|---|---:|---|---|
| 4.1 Yandex ads only | Yes | `showFullscreenAd()` only | PASS |
| 4.2 state after ad | Yes | Existing pause/navigation flow | PASS locally; live required |
| 4.3 orientation | Yes | No custom orientation UI | PASS |
| 4.4 logical pauses | Yes | Next/Again gate | PASS |
| 4.5 rewarded | No | Not implemented | N/A |
| 4.6 custom banners | No | None | N/A |
| 4.7 gameplay/audio pause | Yes | `ad` pause reason + AudioManager | PASS locally; live required |

## Store materials (Section 5)

| Requirement | Applicable | Evidence | Result |
|---|---:|---|---|
| 5.1.1 real materials | Yes | Existing media audit | PASS |
| 5.1.1.2 screenshots gameplay | Yes | Production captures, no synthetic elements | PASS |
| 5.1.1.3 video gameplay | Yes | Existing videos audited | PASS |
| 5.1.2 game essence | Yes | Puzzle/Route/Rush represented | PASS |
| 5.1.3 name identical | Yes | Arrow Shift consistent | PASS |
| 5.2 mandatory fields | Yes | Submission pack/media set | PASS locally; Console required |
| 5.3 dimensions/formats | Yes | `npm run media:audit` | PASS |
| 5.4 tags/keywords | Yes | Existing metadata | PASS |
| 5.6 icon/cover not screenshots | Yes | Authored vector compositions | PASS |
| 5.9 black bars | Yes | No added bars | PASS |

## Text/media (Section 8)

| Requirement | Applicable | Evidence | Result |
|---|---:|---|---|
| 8.2.1 spelling | Yes | RU/EN review | PASS |
| 8.2.2 truthful gameplay text | Yes | Describes actual modes | PASS |
| 8.2.3 translation | Yes | RU/EN UI/media | PASS |
| 8.2.4 profanity | Yes | None | PASS |
| 8.2.5 prohibited material | Yes | None | PASS |
| 8.3.1 technical quality | Yes | Native screenshots/media audit | PASS |
| 8.3.2 reflects game | Yes | Real scenes | PASS |
| 8.3.3 no artificial frames | Yes | Native captures | PASS |
| 8.3.4 no OS/Yandex UI | Yes | Media audit | PASS |

## Totals

- PASS: 69
- FAIL: 0
- UNTESTED: 0
- N/A / LIVE DRAFT REQUIRED: 6

## Real Yandex verification

Upload RC 1.0.4 before claiming platform certification. Check Debug Panel loader `IT`, I18N used, Game Ready green, real pause/resume, cloud-save Console option, ad lifecycle, Firefox/Safari/Yandex Browser, and native Android/iOS long-press behavior.
