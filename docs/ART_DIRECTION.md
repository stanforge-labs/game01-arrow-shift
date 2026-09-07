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

Rush keeps timer as the strongest HUD value, followed by score and combo. A 3–4px accent time bar sits below the HUD; +4s and combo emphasis are brief, non-modal feedback. Desktop uses a wider plain rail-plus-board composition and a slightly more visible but sparse mode pattern around the outer edges. Result overlays use a separate translucent board backdrop and an opaque card centered on the board; tutorial labels are hidden while a result is shown.

Home and level-select screens reuse the same printed-puzzle surfaces: one compact composition, small physical controls and restrained level tokens. Sound controls use simple inline SVG and never introduce decorative icon packs. Route uses a clearly plated Start with a directional indicator, a full-cell target ring, a small accent signal and a thin trace; Rush keeps the same board and token language. Mode screens are not dashboards and should never become a shared mega-card.

The page background may use a barely visible mode-specific CSS pattern (grid fragments for Puzzle, nodes/traces for Route, directional streaks for Rush). It stays quieter than the board; Route's Start and Target labels appear only on the first two levels as compact onboarding.

Utility controls share one inline SVG language (`viewBox 0 0 24 24`, round 1.9px strokes, currentColor): home, restart and sound on/off use the same 44px tactile button. Result cards use a solid surface, a single vertical flow and full-width actions; no title or button is absolutely positioned. Procedural audio is short and dry: a layered UI click, a lower tile press, a compact exit snap, a restrained SHIFT sweep and muted blocked/pinned/barrier responses, all routed through one compressed master bus.
Boot is a branded full-viewport pause-free handoff: the wordmark, four aligned SVG arrows and a short mode descriptor disappear at the real app-ready point, with `?screen=boot` available only for development preview. Audio uses one compressed master bus with independent SFX and quiet procedural music channels; the compact audio popover controls both without introducing a second utility button.
