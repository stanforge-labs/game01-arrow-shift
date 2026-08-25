# Art direction

Arrow Shift uses a modern physical-puzzle language: warm printed-paper page, a single defined board surface, graphic grid lines and tactile puzzle tokens. It should feel calm and authored, never like a SaaS panel, glass card or generic AI landing page.

## Tokens

| Token | Value |
| --- | --- |
| page | `#f3f0e8` |
| surface | `#faf8f2` |
| board | `#e7e1d6` |
| tile | `#faf8f2` |
| ink | `#252a27` |
| muted-ink | `#66716a` |
| line | `#cec7ba` |
| grid-line | `rgb(37 42 39 / 8%)` |
| accent | `#3e7465` |
| success | `#48795e` |
| danger | `#a8574c` |
| board radius | `20px` |
| tile radius | `14px` |
| control radius | `10px` |
| board shadow | `0 7px 0 rgb(37 42 39 / 7%)` |
| tile shadow | `0 3px 0 rgb(37 42 39 / 15%)` |
| board size | `min(100%, 520px)` |

## Surfaces and layout

The board has one border, one surface and an understated grid. No inner frame or blurred halo. Tiles align mathematically with cells, stay at least 44px high, and use a shorter physical bottom shadow rather than a large soft shadow.

## Arrow language

Arrows use one custom filled SVG silhouette rotated for all four directions. The ink shape is compact, geometric and original; no emoji, icon library or external asset is used.

## Interaction states

- idle: ink token, thin neutral border, short bottom shadow;
- hover/press: one-pixel lift or press, with the shadow changing accordingly;
- blocked: 180ms nudge and darker neutral border;
- SHIFT: a thin muted-forest sweep crosses the affected row/column, then affected tokens briefly take the accent border before rotating;
- reduced motion: transitions and feedback collapse to near-instant while remaining functional.

Accent is reserved for SHIFT, active utility states and success actions. Avoid gradients, glow, excessive rounded cards, decorative uppercase branding, background imagery and AI-looking effects.
