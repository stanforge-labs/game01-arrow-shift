# Level design

Levels live in `src/game/levels.js` and are solved automatically in the unit suite.

- 1–2: learn a clear path to the edge.
- 3–4: see a line rotation after an exit.
- 5–6: plan a following rotation.
- 7–10: short dependent sequences, still intentionally compact for MVP playtesting.

New levels must be represented as data and pass the solver before being shipped.
