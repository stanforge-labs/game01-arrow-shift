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
| board size | grid-derived target: `220px + 50px × max(rows, cols)`, capped at `520px`, then corrected to integer tracks |
| tile size | grid-derived visual cap: `120px - 8px × max(rows, cols)`, with `44px` interaction minimum |

## Surfaces and layout

The board has one border, one surface and an understated grid. No inner frame or blurred halo. Board size derives from the logical grid and available viewport: 3×3 is compact, 6×6 approaches the 520px desktop ceiling, and mobile additionally uses available width and `100dvh`. The inner grid is calculated as `cellSize × gridSize` with an integer `cellSize`; the board is corrected by a few pixels when needed. Header and board share the same calculated width. Tiles use the same CSS Grid tracks and are centered with visible cell breathing room, using a grid-derived visual maximum while staying at least 44px interactive. Below 1100px the composition is stacked; at 1100px and above gameplay uses a horizontal stage with a plain information rail beside the board, never a shared container card.

## Arrow language

Arrows use one custom filled SVG silhouette rotated for all four directions. The ink shape is compact, geometric and original; no emoji, icon library or external asset is used.

## Interaction states

- idle: ink token, thin neutral border, short bottom shadow;
- hover/press: one-pixel lift or press, with the shadow changing accordingly;
- blocked: 180ms nudge and darker neutral border;
- SHIFT: a thin muted-forest sweep crosses the affected row/column, then affected tokens briefly take the accent border before rotating;
- pinned: the same token surface with two small graphite clamp marks and a slightly firmer border; during SHIFT it gets a brief hold/nudge state and keeps its direction;
- barrier: a smaller inset graphite-neutral plate inside its cell, with two restrained diagonal machine marks; it is not a button and uses the board surface rather than the tile surface;
- reduced motion: transitions and feedback collapse to near-instant while remaining functional.

Accent is reserved for SHIFT, active utility states and success actions. Avoid gradients, glow, excessive rounded cards, decorative uppercase branding, background imagery and AI-looking effects.
